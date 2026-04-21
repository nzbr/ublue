import {
    KdeDarklyLayer,
    KdeRoundedCornersLayer,
    KlassyLayer,
    KWinEffectsForceblurLayer,
} from "../layers";
import { Image } from "../lib";
import { commonLayers } from "./common-layers";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-43.20260421";

    layers = [
        ...commonLayers,
        new KdeDarklyLayer(),
        new KdeRoundedCornersLayer(),
        new KlassyLayer(),
        new KWinEffectsForceblurLayer(),
        // yin-yang
    ];
}
