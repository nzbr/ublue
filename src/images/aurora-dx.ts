import { Image } from "../lib";
import { commonLayers, dxLayers, kdeLayers } from "./common-layers";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-44.20261110@sha256:248bca1ee773ff1a01efafde5cee60c3e4d6fa17f5629b2c0eb84312a2ae38b4";

    layers = [
        ...commonLayers,
        ...dxLayers,
        ...kdeLayers,
    ];
}
