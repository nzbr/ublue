import { Image } from "../lib";
import { commonLayers } from "./common-layers";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable-43.20260421";

    layers = [...commonLayers];
}
