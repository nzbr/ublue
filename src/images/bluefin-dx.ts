import { Image } from "../lib";
import { commonLayers, dxLayers } from "./common-layers";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable-44.20261029@sha256:4b7a467b6d5f0cd65075802ad2ec9d4a4bb16fedb8d602b688f3ba64d0ab0779";

    layers = [...commonLayers, ...dxLayers];
}
