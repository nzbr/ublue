import { Secret, File } from "@dagger.io/dagger";
import { CiderLayer, EcryptfsLayer, MotorcommYT6801Layer } from "../layers";
import { OnepasswordLayer } from "../layers/onepassword";
import { Image, Layer } from "../lib";
import AuroraDxImage from "./aurora-dx";
import { OllamaLayer } from "../layers/ollama";

export default class NebulaImage extends Image {
    name = "nebula";
    from = new AuroraDxImage().build();

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
        ];
    }
}
