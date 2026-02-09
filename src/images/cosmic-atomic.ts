import { CosmicLayer } from "../layers/cosmic";
import { Image } from "../lib";
import BluefinDxImage from "./bluefin-dx";

export default class CosmicAtomicImage extends Image {
    name = "cosmic-atomic";
    from = new BluefinDxImage().build();

    layers = [
        new CosmicLayer()
    ];
}
