import { fetchGit, GenericLayer, unindent } from "../lib";

export class NixLayer extends GenericLayer {
    name = "nix";

    src = fetchGit(
        "https://github.com/DeterminateSystems/nix-installer.git",
        "v3.22.3",
    ).directory("src/action/linux/selinux");

    // mirrors upstream's build.sh
    buildScript = `
        dnf install -y checkpolicy policycoreutils

        checkmodule -M -m -c 5 -o nix.mod nix.te
        semodule_package -o nix.pp -m nix.mod -f nix.fc
    `;

    extraFiles = {
        "nix-store-setup": unindent`
            #!/usr/bin/env bash
            set -euo pipefail

            mkdir -p /var/home/nix/var/nix/daemon-socket

            selinuxenabled || exit 0

            policy=/usr/share/selinux/packages/nix.pp
            stamp=/var/lib/nix-selinux/policy.pp

            if [[ ! -e $stamp ]] || ! cmp -s "$policy" "$stamp"; then
                semodule --install "$policy"
                install -Dm644 "$policy" "$stamp"
            fi

            chcon "$(matchpathcon -n /nix/var/nix/daemon-socket)" /var/home/nix/var/nix/daemon-socket
        `,
        "nix-store-setup.service": unindent`
            [Unit]
            Description=Set up the nix store
            DefaultDependencies=no
            After=local-fs.target
            Before=nix.mount
            Conflicts=shutdown.target
            Before=shutdown.target

            [Service]
            Type=oneshot
            RemainAfterExit=yes
            ExecStart=/usr/libexec/nix-store-setup

            [Install]
            RequiredBy=nix.mount
        `,
        "nix.conf.append": unindent`

            !include nix.custom.conf
        `,
        "nix.mount": unindent`
            [Unit]
            Description=Mount /var/home/nix on /nix
            PropagatesStopTo=nix-daemon.service
            PropagatesStopTo=nix-store-setup.service
            After=nix-store-setup.service
            Requires=nix-store-setup.service
            Before=nix-daemon.service
            Before=nix-daemon.socket
            Before=systemd-tmpfiles-setup.service
            ConditionPathIsDirectory=/nix
            DefaultDependencies=no

            [Mount]
            What=/var/home/nix
            Where=/nix
            Type=none
            DirectoryMode=0755
            Options=bind

            [Install]
            RequiredBy=nix-daemon.service
            RequiredBy=nix-daemon.socket
            RequiredBy=systemd-tmpfiles-setup.service
        `,
    };

    installScript = `
        dnf install -y \
            nix \
            nix-legacy

        cat nix.conf.append >>/etc/nix/nix.conf

        rm -rf /nix
        mkdir -p /nix
        install -m644 nix.mount /usr/lib/systemd/system/nix.mount
        install -m644 nix-store-setup.service /usr/lib/systemd/system/nix-store-setup.service
        install -Dm644 nix.pp /usr/share/selinux/packages/nix.pp
        install -m755 nix-store-setup /usr/libexec/nix-store-setup
        systemctl enable nix.mount nix-store-setup.service nix-daemon.socket
    `;
}
