import { Image } from "../lib";
import { commonLayers, dxLayers, kdeLayers } from "./common-layers";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-45.20261117@sha256:bac13ed5d805a9e45b0734a9128a1aea5d2d3c89dc6235edf58d42fea0a8af84";

    layers = [
        ...commonLayers,
        ...dxLayers,
        ...kdeLayers,
    ];
}
