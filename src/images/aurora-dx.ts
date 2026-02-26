import { KdeDarklyLayer, KdeRoundedCornersLayer, KlassyLayer, KWinEffectsForceblurLayer, NixMountpointLayer, NoFlatpakAutoUpdateLayer, RpmOstreeTweaksLayer } from "../layers";
import { Image } from "../lib";

export default class AuroraDxImage extends Image {
    name = "aurora-dx";
    from = "ghcr.io/ublue-os/aurora-dx:stable-43.20260225";

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
