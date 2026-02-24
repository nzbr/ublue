import { KdeDarklyLayer, KdeRoundedCornersLayer, KlassyLayer, NixMountpointLayer, NoFlatpakAutoUpdateLayer, RpmOstreeTweaksLayer } from "../layers";
import { KWinEffectsForceblurLayer } from "../layers/kwin-effects-forceblur";
import { Image } from "../lib";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-43.20260224";

    layers = [
        new RpmOstreeTweaksLayer(),
        new NoFlatpakAutoUpdateLayer(),
        new NixMountpointLayer(),
        new KdeDarklyLayer(),
        new KdeRoundedCornersLayer(),
        new KlassyLayer(),
        new KWinEffectsForceblurLayer(),
        // yin-yang
    ];
}
