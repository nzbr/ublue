import { NixMountpointLayer, NoFlatpakAutoUpdateLayer, RpmOstreeTweaksLayer } from "../layers";
import { Image } from "../lib";

export default class BluefinDxImage extends Image {
    name = "bluefin-dx";
    from = "ghcr.io/ublue-os/bluefin-dx:stable";
    
    layers = [
        new RpmOstreeTweaksLayer(),
        new NoFlatpakAutoUpdateLayer(),
        new NixMountpointLayer(),
    ];
}
