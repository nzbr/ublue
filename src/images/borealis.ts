import { Image } from "../lib";
import { CiderLayer, XrdpLayer } from "../layers";
import BazziteDeckImage from "./bazzite-deck";

export default class BorealisImage extends Image {
    name = "borealis";
    from = new BazziteDeckImage();

    layers = [
      new XrdpLayer(),
      new CiderLayer(),
    ];
}
