import { GenericLayer } from "../lib";

export class KlassyLayer extends GenericLayer {
    name = "klassy";

    installScript = `
        rpm-ostree install klassy
    `;
}
