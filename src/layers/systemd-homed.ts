import { GenericLayer } from "../lib";

export class SystemdHomedLayer extends GenericLayer {
    name = "systemd-homed";

    installScript = `
        authselect enable-feature with-systemd-homed
        systemctl enable systemd-homed
    `;
}
