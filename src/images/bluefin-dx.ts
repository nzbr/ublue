import { Image } from "../lib";
import { commonLayers, dxLayers } from "./common-layers";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable-44.20261117@sha256:fa893830ca753dffbb3f5c2beb3ed6d2c4007740524e4169f755a0858bb6009d";

    layers = [...commonLayers, ...dxLayers];
}
