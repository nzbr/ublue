import { Image } from "../lib";
import { commonLayers, kdeLayers } from "./common-layers";

export default class BazziteDeckImage extends Image {
    name = "bazzite-deck";
    from = "ghcr.io/ublue-os/bazzite-deck:stable-45.20261117@sha256:6662139c6170a8316fc53936a7b49ab9aacf52d3369efe86cdaf4c63e795567b";

    layers = [
        ...commonLayers,
        ...kdeLayers,
    ];
}
