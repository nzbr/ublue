import { GenericLayer, unindent } from "../lib";

export class CosmicLayer extends GenericLayer {
    name = "cosmic";

    extraFiles = {
        "00-cosmic.conf": unindent`
            g cosmic-greeter 401
            g greetd 402
        `,
    };

    installScript = `
        install -m644 00-cosmic.conf /usr/lib/sysusers.d/00-cosmic.conf

        dnf copr enable -y ryanabx/cosmic-epoch

        dnf install -y \
            cosmic-edit \
            cosmic-files \
            cosmic-greeter \
            cosmic-initial-setup \
            cosmic-player \
            cosmic-session \
            cosmic-term \
            cosmic-config-fedora \
            cosmic-desktop # this package is from the COPR

        systemctl disable gdm.service sddm.service || true
        systemctl enable cosmic-greeter.service

        grep 'vt = "1"' /etc/greetd/cosmic-greeter.toml # Check that the option is still set as-is. If not, this might need to be updated.
        sed -i 's/vt = "1"/vt = "next"/' /etc/greetd/cosmic-greeter.toml
    `;
}
