import { Image } from "../lib";
import { commonLayers, dxLayers } from "./common-layers";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable-45.20261124@sha256:cf6aa98cab602b7387c34f63eb7580a2a0b23afb7f72a1a8630dce2179b464c0";

    layers = [...commonLayers, ...dxLayers];
}
