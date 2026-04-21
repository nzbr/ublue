import { dag, Container, Directory, Secret, File } from "@dagger.io/dagger";
import { fetchGit, GenericLayer, Layer, mkRPM, unindent } from "../lib";

export class CopperflameMonoLayer extends GenericLayer {
    name = "Copperflame Mono";

    src = fetchGit(
        "https://github.com/nzbr/copperflame.git",
        "c8b1f1e1c8d934a25dcc864b00fbc00bb1b001cb",
    );

    async build(buildContainer: Container): Promise<Directory> {
        const content = dag
            .container()
            .from("nixos/nix:2.34.6")
            .withMountedDirectory("/build", this.src, { owner: "0" })
            .withWorkdir("/build")
            .withExec([
                "nix",
                "--extra-experimental-features",
                "nix-command flakes",
                "--accept-flake-config",
                "build",
                "-L",
                ".#copperflame-mono",
            ])
            .withExec([
                "/bin/sh",
                "-exc",
                unindent`
          mkdir -p /pkg/usr
          cp -vr --dereference result/. /pkg/usr
        `,
            ])
            .directory("/pkg");
        return dag
            .directory()
            .withFile(
                "copperflame-mono.rpm",
                await mkRPM(buildContainer)(
                    { name: "copperflame-mono", version: this.src.ref },
                    content,
                ),
            );
    }

    installScript = `
    dnf install -y ./copperflame-mono.rpm
  `;
}
