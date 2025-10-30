import { GenericLayer } from "../lib";

export class NoFlatpakAutoUpdateLayer extends GenericLayer {
    name = "no-flatpak-auto-update";

    installScript = `
        rm -f /etc/systemd/system/timers.target.wants/flatpak-system-update.timer
    `;
}
