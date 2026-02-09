import { GenericLayer } from "../lib";

export class CosmicLayer extends GenericLayer {
    name = "cosmic";

    // cosmic-store is not included, because universal-blue images use Bazaar instead
    installScript = `
        dnf install -y \
            cosmic-edit \
            cosmic-files \
            cosmic-greeter \
            cosmic-initial-setup \
            cosmic-player \
            cosmic-session \
            cosmic-term \
            cosmic-config-fedora

        systemctl disable gdm.service sddm.service || true
        systemctl enable cosmic-greeter.service
    `;
}
