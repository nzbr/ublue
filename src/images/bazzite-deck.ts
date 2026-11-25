import { Image } from "../lib";
import { commonLayers, kdeLayers } from "./common-layers";

export default class BazziteDeckImage extends Image {
    name = "bazzite-deck";
    from = "ghcr.io/ublue-os/bazzite-deck:stable-45.20261125@sha256:21dd3c159f3ea0b0a146f968b7661f4b672ba9425218fddcb0d974e169d4afbd";

    layers = [
        ...commonLayers,
        ...kdeLayers,
    ];
}
