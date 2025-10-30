import { Container, dag, Directory } from "@dagger.io/dagger";
import { fetchTarball, GenericLayer, mkRPM } from "../lib";

export class OllamaLayer extends GenericLayer {
    name = "Ollama";

    withRocm: boolean;

    constructor(args: {withRocm?: boolean}) {
        super();
        this.withRocm = args.withRocm ?? false;
    }

    async build(buildContainer: Container): Promise<Directory> {
        const baseUrl = "https://github.com/ollama/ollama/releases/download/v0.11.10";
        const version = baseUrl.split("/").at(-1)?.slice(1);
        if (!version) {
            throw new Error("Version not found");
        }

        const _mkRPM = mkRPM(buildContainer);
        const _fetchTarball = fetchTarball(buildContainer);

        let outDir = dag.directory()
            .withFile("ollama-linux-amd64.rpm", await _mkRPM(
                {
                    name: "ollama",
                    version,
                    arch: "x86_64",
                    license: "MIT",
                },
                dag.directory().withDirectory("usr", _fetchTarball(`${baseUrl}/ollama-linux-amd64.tgz`)),
            ));

        if (this.withRocm) {
            outDir = outDir.withFile("ollama-rocm-linux-amd64.rpm", await _mkRPM(
                {
                    name: "ollama-rocm",
                    version,
                    arch: "x86_64",
                    license: "MIT",
                    requires: ["rocm", "ollama"],
                },
                dag.directory().withDirectory("usr", _fetchTarball(`${baseUrl}/ollama-linux-amd64-rocm.tgz`)),
            ));
        }

        return outDir;
    }

    installScript = `
        rpm-ostree install $PWD/*.rpm
    `;
}