import { GenericLayer } from "../lib";

export class WaypipeLayer extends GenericLayer {
    name = "waypipe";

    installScript = `
        dnf install -y waypipe
    `;
}
