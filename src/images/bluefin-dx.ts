import { Image } from "../lib";
import { commonLayers, dxLayers } from "./common-layers";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable-44.20261022";

    layers = [...commonLayers, ...dxLayers];
}
