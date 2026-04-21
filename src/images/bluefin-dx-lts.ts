import { NixMountpointLayer, NoFlatpakAutoUpdateLayer, RpmOstreeTweaksLayer, SudoTweaksLayer } from "../layers";
import { Image } from "../lib";

export default class BluefinDxLtsImage extends Image {
    name = "bluefin-dx-lts";
    from = "ghcr.io/ublue-os/bluefin-dx:lts.20260308";

    layers = [
        new RpmOstreeTweaksLayer(),
        new NoFlatpakAutoUpdateLayer(),
        new SudoTweaksLayer(),
        new NixMountpointLayer(),
    ];
}
