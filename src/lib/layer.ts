import { dag, Container, Directory } from "@dagger.io/dagger";
import { unindent } from "./unindent";

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

    async install(buildContainer: Container, targetContainer: Container): Promise<Container> {
        const buildDir = (await this.build(buildContainer))
            .withNewFile("install.sh", unindent(this.installScript), { permissions: 0o755 })

        return targetContainer
            .withMountedDirectory("/build", buildDir)
            .withWorkdir("/build")
            .withExec(["bash", "-euxo", "pipefail", "install.sh"])
            .withoutMount("/build")
    };
}
