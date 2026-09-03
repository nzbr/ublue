import { GenericLayer, unindent } from "../lib";

const COPR = "ryanabx/cosmic-epoch";
const COPR_REPO = "copr:copr.fedorainfracloud.org:ryanabx:cosmic-epoch";

export class CosmicLayer extends GenericLayer {
    name = "cosmic";

    extraFiles = {
        "00-cosmic.conf": unindent`
            g cosmic-greeter 401
            g greetd 402
        `,
        // Prevent black-screen on login due to a race-condition between the greeter releasing the GPU and cosmic-comp needing it to work
        "start-cosmic-after-greeter": unindent`
            #!/usr/bin/bash
            i=0
            while [ "$i" -lt 100 ] \\
                && [ -n "$(/usr/bin/loginctl show-user cosmic-greeter --property=Sessions --value 2>/dev/null)" ]; do
                /usr/bin/sleep 0.1
                i=$((i + 1))
            done

            exec /usr/bin/start-cosmic "$@"
        `,
    };

    installScript = `
        install -m644 00-cosmic.conf /usr/lib/sysusers.d/00-cosmic.conf

        dnf copr enable -y ${COPR}

        # Make sure we install only the packages from the COPR
        dnf install -y --setopt='${COPR_REPO}.priority=1' \
            cosmic-edit \
            cosmic-files \
            cosmic-greeter \
            cosmic-initial-setup \
            cosmic-player \
            cosmic-session \
            cosmic-term \
            cosmic-config-fedora \
            cosmic-desktop

        systemctl disable gdm.service sddm.service || true
        systemctl enable cosmic-greeter.service

        grep 'vt = "1"' /etc/greetd/cosmic-greeter.toml # Check that the option is still set as-is. If not, this might need to be updated.
        sed -i 's/vt = "1"/vt = "next"/' /etc/greetd/cosmic-greeter.toml

        install -m755 start-cosmic-after-greeter /usr/libexec/start-cosmic-after-greeter
        grep -Fx 'Exec=/usr/bin/start-cosmic' /usr/share/wayland-sessions/cosmic.desktop # Check that the line is still there as-is. If not, this might need to be updated.
        sed -i 's|^Exec=/usr/bin/start-cosmic$|Exec=/usr/libexec/start-cosmic-after-greeter|' /usr/share/wayland-sessions/cosmic.desktop
    `;
}
