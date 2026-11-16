import { Image } from "../lib";
import { commonLayers, dxLayers, kdeLayers } from "./common-layers";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-44.20261027@sha256:4baf37ef2582843515cdd7329eb47d90eb2a042bae605d30b051cbacb936cb8d";

    layers = [
        ...commonLayers,
        ...dxLayers,
        ...kdeLayers,
    ];
}
