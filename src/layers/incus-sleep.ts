import { GenericLayer } from "../lib";

export class IncusSleepLayer extends GenericLayer {
    name = "incus-sleep";

    extraFiles = {
        // lxcfs implements poll() in the daemon and answers everything with
        // DEFAULT_POLLMASK instead of ENOSYS, so the kernel never sets no_poll and
        // every poll() on an lxcfs file stays a round trip to lxcfs. udisksd in a
        // container polls /proc/swaps, which is one of them, and the freezer's own
        // wakeup makes do_poll re-arm that fd before it looks at the signal -- by
        // which point lxcfs is frozen, so the reply never comes and fuse waits for it
        // uninterruptibly. The task refuses to freeze, the suspend fails with EBUSY
        // and logind retries it for as long as the lid stays closed.
        "incus-freeze": `
            #!/usr/bin/bash
            # Park the containers in the cgroup freezer before the system freezer
            # starts, while lxcfs is still running to answer them
            set -u

            state=/run/incus-freeze-on-sleep

            containers() {
                find /sys/fs/cgroup -maxdepth 4 -type d -name 'lxc.payload.*' 2>/dev/null
            }

            frozen() {
                grep -qx 'frozen 1' "$1/cgroup.events" 2>/dev/null
            }

            case "$1" in
                pre)
                    : > "$state"
                    for cg in $(containers); do
                        # Leave a container that is already paused alone, so that post
                        # does not resume it on the way back
                        frozen "$cg" && continue
                        echo 1 > "$cg/cgroup.freeze" || continue
                        echo "$cg" >> "$state"
                    done

                    # The write returns before the tasks have actually stopped, and
                    # suspending in that window is the race this is here to avoid
                    for _ in $(seq 100); do
                        pending=
                        for cg in $(cat "$state"); do
                            frozen "$cg" || pending=$cg
                        done
                        [ -z "$pending" ] && break
                        sleep 0.1
                    done
                    [ -z "$pending" ] || echo "$pending did not freeze within 10s, suspending anyway" >&2
                    ;;
                post)
                    for cg in $(cat "$state" 2>/dev/null); do
                        echo 0 > "$cg/cgroup.freeze" || true
                    done
                    rm -f "$state"
                    ;;
            esac
        `,
    };

    installScript = `
        set -euxo pipefail

        install -Dm755 incus-freeze /usr/lib/systemd/system-sleep/incus-freeze
    `;
}
