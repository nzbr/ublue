import { File, Secret } from "@dagger.io/dagger";
import { CiderLayer, EcryptfsLayer, GVisorLayer, MotorcommYT6801Layer } from "../layers";
import { OnepasswordLayer } from "../layers/onepassword";
import { PamFprintdLayer } from "../layers/pam-fprintd";
import { PAMU2FLayer } from "../layers/pam-u2f";
import { Image, Layer } from "../lib";
import { GenericLayer } from "../lib/layer";
import { unindent } from "../lib/unindent";
import CosmicAtomicImage from "./cosmic-atomic";
import { AntigravityLayer } from "../layers/antigravity";

class KernelVersionCheckLayer extends GenericLayer {
    name = "kernel-version-check";
    installScript = unindent(`
        #!/bin/bash
        set -euxo pipefail

        KERNEL_VERSION=$(rpm -q kernel --qf '%{VERSION}-%{RELEASE}.%{ARCH}\n')

        if [[ "$KERNEL_VERSION" == 6.18.* ]]; then
            echo "Error: Kernel version \${KERNEL_VERSION} is known to be broken on this machine."
            exit 1
        fi
    `);
}

export default class NebulaImage extends Image {
    name = "nebula";
    from = new CosmicAtomicImage().build();

    signingKey: Secret;
    signingKeyPub: File;

    layers: Layer[];

    constructor(signingKey: Secret, signingKeyPub: File) {
        super();
        this.signingKey = signingKey;
        this.signingKeyPub = signingKeyPub;

        this.layers = [
            new KernelVersionCheckLayer(),
            new EcryptfsLayer(),
            new OnepasswordLayer(),
            new CiderLayer(),
            new MotorcommYT6801Layer(this.signingKey, this.signingKeyPub),
            // new OllamaLayer({ withRocm: true }),
            new PAMU2FLayer(),
            // new PamFprintdLayer(),
            new AntigravityLayer(),
            new GVisorLayer(),
        ];
    }
}
