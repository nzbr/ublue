import { Image } from "../lib";
import { commonLayers, kdeLayers } from "./common-layers";

export default class BazziteDeckImage extends Image {
    name = "bazzite-deck";
    from = "ghcr.io/ublue-os/bazzite-deck:stable-44.20261026@sha256:278941ea67603e24e24ff18e8c418b91f2f326fffd3d24edcff9779f36fbdf4e";

    layers = [
        ...commonLayers,
        ...kdeLayers,
    ];
}
