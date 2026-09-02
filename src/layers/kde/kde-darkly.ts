import { GenericLayer } from "../../lib";

export class KdeDarklyLayer extends GenericLayer {
    name = "kde-darkly";

    installScript = `
        # darkly is not in the Fedora repos, only in terra, so that layer has to
        # be included before this one
        dnf install -y --from-repo=terra darkly
    `;
}
