import { Image } from "../lib";
import { commonLayers, kdeLayers } from "./common-layers";

export default class BazziteDeckImage extends Image {
    name = "bazzite-deck";
    from = "ghcr.io/ublue-os/bazzite-deck:stable-44.20261023";

    layers = [
        ...commonLayers,
        ...kdeLayers,
    ];
}
