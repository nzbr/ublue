import { dag, Container } from "@dagger.io/dagger";
import { Layer } from "./layer";

export abstract class Image {
    abstract name: string;
    abstract from: string | Container | Promise<Container>;
    abstract layers: Layer[];

    constructor() { }

    async build(): Promise<Container> {
        const container = typeof this.from === "string" ? dag.container().from(this.from) : await this.from;

        return (await this.layers.reduce<Promise<Container>>(
            async (state, layer) => (await layer.install(container, await state)).withExec(["ostree", "container", "commit"]),
            Promise.resolve(container),
        ))
        .withoutWorkdir()
        .withDefaultTerminalCmd(["/bin/sh", "-c", "mkdir /var/roothome && exec /usr/bin/bash --login"])
    }
}