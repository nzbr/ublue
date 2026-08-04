import { dag, Container } from "@dagger.io/dagger";
import { Layer } from "./layer";

export abstract class Image {
    abstract name: string;
    /** A registry reference, or the image this one is derived from. */
    abstract from: string | Image;
    abstract layers: Layer[];

    constructor() {}

    /** The registry reference at the root of the derivation chain. */
    get baseRef(): string {
        return typeof this.from === "string" ? this.from : this.from.baseRef;
    }

    async build(): Promise<Container> {
        const container =
            typeof this.from === "string"
                ? dag.container().from(this.from)
                : await this.from.build();

        return (
            await this.layers.reduce<Promise<Container>>(
                async (state, layer) =>
                    (await layer.install(container, await state)).withExec([
                        "ostree",
                        "container",
                        "commit",
                    ]),
                Promise.resolve(container),
            )
        )
            .withExec(["rm", "-rf", "/var/cache"])
            .withoutWorkdir()
            .withDefaultTerminalCmd([
                "/bin/sh",
                "-c",
                "mkdir /var/roothome && exec /usr/bin/bash --login",
            ]);
    }
}
