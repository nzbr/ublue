import { Container, dag, Directory } from "@dagger.io/dagger";
import { fetchGit, GenericLayer, mkRPM } from "../lib";

export class NerdctlLayer extends GenericLayer {
    name = "nerdctl";

    src = fetchGit("https://github.com/containerd/nerdctl.git", "v2.3.2");

    async build(buildContainer: Container): Promise<Directory> {
        const content = buildContainer
            .withExec(["dnf", "install", "-y", "golang", "make", "git"])
            .withMountedDirectory("/src", this.src)
            .withWorkdir("/src")
            .withEnvVariable("GOCACHE", "/tmp/go-cache")
            .withEnvVariable("GOMODCACHE", "/tmp/go-mod-cache")
            .withExec(["make", "binaries"])
            .withExec(["make", "install", "DESTDIR=/dest", "PREFIX=/usr"])
            .directory("/dest");

        const version = this.src.ref.replace(/^v/, '');

        return dag
            .directory()
            .withFile(
                "nerdctl.rpm",
                await mkRPM(buildContainer)(
                    {
                        name: "nerdctl",
                        version,
                        requires: [
                            "containernetworking-plugins",
                            "iptables",
                            "iproute",
                        ],
                    },
                    content,
                ),
            );
    }

    installScript = `
        dnf install -y ./nerdctl.rpm
    `;
}
