import { Image } from "../lib";
import { commonLayers, dxLayers, kdeLayers } from "./common-layers";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-44.20261027";

    layers = [
        ...commonLayers,
        ...dxLayers,
        ...kdeLayers,
    ];
}
