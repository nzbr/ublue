import { dag, Container, Secret } from "@dagger.io/dagger";

const rechunkContainer = dag.container().from("ghcr.io/hhd-dev/rechunk:v1.2.4");

/**
 * Rechunk the image's layers as ostree chunks and push it to every tag, returning the
 * digest. Modeled after the GitHub Action used by universal-blue images.
 *
 * @param repository Where the image will be pushed to. Its `:latest` is used to align the new chunks against.
 * @param targetLayers Number of layers to optimize towards. The final result might contain more or less than this.
 */
export async function pushChunked(
    image: Container,
    repository: string,
    tags: string[],
    username: string,
    password: Secret,
    targetLayers = 256,
): Promise<string> {
    // Rechunk creates a new image from only the rootfs. Capture the labels from the orignal to apply them to the new image later
    const labels = (
        await Promise.all(
            (await image.labels()).map(
                async (label): Promise<[string, string]> => [
                    await label.name(),
                    await label.value(),
                ],
            ),
        )
    ).filter(
        ([name]) =>
            !["containers.bootc", "dev.hhd.rechunk.info"].includes(name) &&
            !name.startsWith("ostree."),
    );

    const [first, ...rest] = tags.map((tag) => `${repository}:${tag}`);

    const outName = "chunked";

    let container = rechunkContainer
        .withMountedDirectory("/var/tree", image.rootfs())
        .withEnvVariable("TREE", "/var/tree")
        .withEnvVariable("REPO", "/var/ostree/repo")
        .withExec(["/sources/rechunk/1_prune.sh"], {
            insecureRootCapabilities: true,
        })
        // ostree init creates the repo but not its parent; ublue's action gets that
        // directory from a podman volume mount.
        .withExec(["mkdir", "-p", "/var/ostree"])
        // Only from here on: applied to 1_prune.sh it touches the mounted tree, which
        // copies every file up.
        .withEnvVariable("RESET_TIMESTAMP", "1")
        .withExec(["/sources/rechunk/2_create.sh"], {
            insecureRootCapabilities: true,
        })
        .withEnvVariable("OUT_NAME", outName)
        .withEnvVariable("OUT_REF", `oci:${outName}`)
        .withEnvVariable("MAX_LAYERS", `${targetLayers}`)
        // 3_chunk.sh prefixes this with docker:// itself.
        .withEnvVariable("PREV_REF", `${repository}:latest`)
        .withEnvVariable(
            "LABELS",
            Object.entries(labels)
                .map(([key, value]) => `${key}=${value}`)
                .join("\n"),
        )
        .withExec(["/sources/rechunk/3_chunk.sh"], {
            insecureRootCapabilities: true,
        })
        // Only log in once the rechunk is done: the token changes every CI run, and
        // everything after it in the chain is invalidated with it.
        .withExec(
            [
                "skopeo",
                "login",
                "--username",
                username,
                "--password-stdin",
                repository.split("/")[0],
            ],
            { stdin: await password.plaintext() },
        )
        .withExec(["skopeo", "copy", `oci:${outName}`, `docker://${first}`]);

    for (const ref of rest) {
        // Identical manifest in the same repository, so the registry mounts the blobs
        // it already has instead of us uploading them again.
        container = container.withExec([
            "skopeo",
            "copy",
            `docker://${first}`,
            `docker://${ref}`,
        ]);
    }

    // Last in the chain, so its output is the container's stdout.
    return (
        await container
            .withExec([
                "skopeo",
                "inspect",
                "--format",
                "{{.Digest}}",
                `docker://${first}`,
            ])
            .stdout()
    ).trim();
}
