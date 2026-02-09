import { File, Secret } from "@dagger.io/dagger";
import { CiderLayer, EcryptfsLayer, MotorcommYT6801Layer } from "../layers";
import { OnepasswordLayer } from "../layers/onepassword";
import { PamFprintdLayer } from "../layers/pam-fprintd";
import { PAMU2FLayer } from "../layers/pam-u2f";
import { Image, Layer } from "../lib";
import CosmicAtomicImage from "./cosmic-atomic";
import { AntigravityLayer } from "../layers/antigravity";

export default class NebulaImage extends Image {
    name = "nebula";
    from = new CosmicAtomicImage().build();

    signingKey: Secret;
    signingKeyPub: File;

    layers: Layer[];

    constructor(
        signingKey: Secret,
        signingKeyPub: File,
    ) {
        super();
        this.signingKey = signingKey;
        this.signingKeyPub = signingKeyPub;

        this.layers = [
            new EcryptfsLayer(),
            new OnepasswordLayer(),
            new CiderLayer(),
            new MotorcommYT6801Layer(this.signingKey, this.signingKeyPub),
            // new OllamaLayer({ withRocm: true }),
            new PAMU2FLayer(),
            new PamFprintdLayer(),
            new AntigravityLayer(),
        ];
    }
}
