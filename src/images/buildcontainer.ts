import { Image } from "../lib";
import BluefinDxImage from "./bluefin-dx";
import { workLayers } from "./common-layers";

export default class BuildContainerImage extends Image {
    name = "buildcontainer";
    from = new BluefinDxImage();

    layers = [...workLayers];
}
