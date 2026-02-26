import { GenericLayer } from "../../lib";

export class KdeDarklyLayer extends GenericLayer {
    name = "kde-darkly";

    installScript = `
        dnf copr enable -y deltacopy/darkly
        dnf install -y darkly
    `;
}
