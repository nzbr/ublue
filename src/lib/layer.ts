import { dag, Container, Directory } from "@dagger.io/dagger";
import { unindent } from "./unindent";
import { ContainerID } from "../../sdk/core";

export interface Layer {
    name: string;
    install(buildContainer: Container, targetContainer: Container): Promise<Container>;
}

export abstract class GenericLayer implements Layer {
    abstract name: string;
    buildScript: string | null = null;
    abstract installScript: string;

    src = dag.directory()

    extraFiles: { [key: string]: string } = {};

    async build(buildContainer: Container): Promise<Directory> {
        let buildDir = this.src;

        for (const [key, value] of Object.entries(this.extraFiles)) {
            buildDir = buildDir.withNewFile(key, unindent(value), { permissions: 0o755 });
        }

        if (this.buildScript) {
            buildDir = buildDir.withNewFile("build.sh", this.buildScript, { permissions: 0o755 });
            buildDir = buildContainer
                .withDirectory("/build", buildDir)
                .withWorkdir("/build")
                .withExec(["bash", "-euxo", "pipefail", "build.sh"])
                .directory("/build");
        }

        return buildDir;
    }

    buildCache: { [key: string]: Promise<Directory> | undefined } = {};
    buildCached(buildContainer: Container, buildContainerId: ContainerID): Promise<Directory> {
        if (this.buildCache[buildContainerId.toString()]) {
            return this.buildCache[buildContainerId.toString()]!;
        }

        this.buildCache[buildContainerId.toString()] = this.build(buildContainer);

        return this.buildCache[buildContainerId.toString()]!;
    }

    async install(buildContainer: Container, targetContainer: Container): Promise<Container> {
        const buildDir = (await this.buildCached(buildContainer, (await buildContainer.id())))
            .withNewFile("install.sh", unindent(this.installScript), { permissions: 0o755 })

        return targetContainer
            .withMountedDirectory("/build", buildDir)
            .withWorkdir("/build")
            .withExec(["bash", "-euxo", "pipefail", "install.sh"])
            .withoutMount("/build")
    };
}

export abstract class CompositeLayer implements Layer {
    name: string;
    layers: Layer[];

    constructor(layers: Layer[]) {
        this.name = `Composite: ${layers.map(layer => layer.name).join("+")}`;
        this.layers = layers;
    }

    install(buildContainer: Container, targetContainer: Container): Promise<Container> {
        return this.layers.reduce((container, layer) => container.then(result => layer.install(buildContainer, result)), Promise.resolve(targetContainer));
    }
}
