import { Image } from "../lib";
import { commonLayers, dxLayers } from "./common-layers";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable-45.20261120@sha256:cca4448a3138178afff93f142f25d8b61b8e4624636dd99fb800a977945a4fb4";

    layers = [...commonLayers, ...dxLayers];
}
