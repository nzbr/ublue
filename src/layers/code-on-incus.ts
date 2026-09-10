import { Container, dag, Directory } from "@dagger.io/dagger";
import { fetchGit, GenericLayer, mkRPM, unindent } from "../lib";

export class CodeOnIncusLayer extends GenericLayer {
    name = "code-on-incus";

    src = fetchGit("https://github.com/mensfeld/code-on-incus.git", "v0.12.0");

    async build(buildContainer: Container): Promise<Directory> {
        const version = this.src.ref.replace(/^v/, "");

        const content = buildContainer
            .withExec([
                "dnf",
                "install",
                "-y",
                "gcc",
                "golang",
                "make",
                "pkgconf-pkg-config",
                "systemd-devel",
            ])
            .withMountedDirectory("/src", this.src)
            .withWorkdir("/src")
            .withEnvVariable("GOCACHE", "/tmp/go-cache")
            .withEnvVariable("GOMODCACHE", "/tmp/go-mod-cache")
            // fetchGit discards the git dir, so the Makefile's `git describe` would stamp the binary as "dev"
            .withExec(["make", "build", `VERSION=${version}`])
            .withExec([
                "bash",
                "-euxo",
                "pipefail",
                "-c",
                unindent`
                    install -Dm755 coi /dest/usr/bin/coi

                    # coi loads its config before it runs any subcommand, and /root
                    # is a symlink to the /var/roothome that only exists once the
                    # image is deployed, so give it a home it can write to
                    export HOME=/tmp/coi-home

                    mkdir -p /dest/usr/share/bash-completion/completions \\
                        /dest/usr/share/zsh/site-functions \\
                        /dest/usr/share/fish/vendor_completions.d
                    ./coi completion bash > /dest/usr/share/bash-completion/completions/coi
                    ./coi completion zsh > /dest/usr/share/zsh/site-functions/_coi
                    ./coi completion fish > /dest/usr/share/fish/vendor_completions.d/coi.fish
                `,
            ])
            .directory("/dest");

        return dag
            .directory()
            .withFile(
                "code-on-incus.rpm",
                await mkRPM(buildContainer)(
                    {
                        name: "code-on-incus",
                        version,
                        summary: "Run AI coding tools in isolated Incus containers",
                        license: "MIT",
                        url: "https://github.com/mensfeld/code-on-incus",
                        // nft is what the restricted and allowlist network modes are built on
                        requires: ["incus", "nftables"],
                    },
                    content,
                ),
            );
    }

    installScript = `
        dnf install -y ./code-on-incus.rpm

        # coi sets the immutable bit on the host paths it hands to a container
        # read-only, so that unshare + umount cannot get at them
        setcap cap_linux_immutable=ep /usr/bin/coi
    `;
}
