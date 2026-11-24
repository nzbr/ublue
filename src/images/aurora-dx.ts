import { Image } from "../lib";
import { commonLayers, dxLayers, kdeLayers } from "./common-layers";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-45.20261124@sha256:8591f68eed99333993234f2c87aad1686c7a5cb6d9cff63dd40e1d47327085fa";

    layers = [
        ...commonLayers,
        ...dxLayers,
        ...kdeLayers,
    ];
}
