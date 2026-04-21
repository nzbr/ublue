import { NixMountpointLayer, NoFlatpakAutoUpdateLayer, RpmOstreeTweaksLayer, SudoTweaksLayer } from "../layers";
import { CopperflameMonoLayer } from "../layers/copperflame-mono";
import { Image } from "../lib";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable-43.20260127";

    layers = [
        new RpmOstreeTweaksLayer(),
        new NoFlatpakAutoUpdateLayer(),
        new SudoTweaksLayer(),
        new NixMountpointLayer(),
        new CopperflameMonoLayer(),
    ];
}
