import {
    dag,
    object,
    func,
    argument,
    Secret,
    File,
    Container,
} from "@dagger.io/dagger";
import BluefinDxImage from "./images/bluefin-dx";
import AuroraDxImage from "./images/aurora-dx";
import NebulaImage from "./images/nebula";
import CosmicAtomicImage from "./images/cosmic-atomic";
import { pushChunked } from "./lib";
import { Image } from "./lib/image";

@object()
export class Ublue {
    constructor() {}

    @func()
    auroraDx(): Promise<Container> {
        return new AuroraDxImage().build();
    }

    @func()
    bluefinDx(): Promise<Container> {
        return new BluefinDxImage().build();
    }

    @func()
    cosmicAtomic(): Promise<Container> {
        return new CosmicAtomicImage().build();
    }

    @func()
    nebula(
        mok: Secret,
        @argument({ defaultPath: "/secrets/mok.pub" }) mokPub: File,
    ): Promise<Container> {
        return new NebulaImage(mok, mokPub).build();
    }

    getImages(
        mok: Secret,
        @argument({ defaultPath: "/secrets/mok.pub" }) mokPub: File,
    ): Promise<Image[]> {
        return Promise.all([
            // new AuroraDxImage(),
            new BluefinDxImage(),
            new CosmicAtomicImage(),
            new NebulaImage(mok, mokPub),
        ]);
    }

    /**
     * The names of the images that {@link build} builds, as a JSON array. CI reads this
     * to fan {@link buildAndPush} out over one runner per image.
     */
    @func()
    async imageNames(
        mok: Secret,
        @argument({ defaultPath: "/secrets/mok.pub" }) mokPub: File,
    ): Promise<string> {
        const images = await this.getImages(mok, mokPub);
        return JSON.stringify(images.map((image) => image.name));
    }

    @func()
    async build(
        mok: Secret,
        @argument({ defaultPath: "/secrets/mok.pub" }) mokPub: File,
    ): Promise<Container[]> {
        return this.getImages(mok, mokPub).then((images) =>
            Promise.all(
                images.map((image) =>
                    image.build().then((it) => it.sync()),
                ),
            ),
        );
    }

    @func()
    async buildAndPush(
        registry: string,
        namespace: string,
        username: string,
        password: Secret,
        mok: Secret,
        cosignKey: Secret,
        revision: string,
        isPr: boolean,
        prNumber: string,
        @argument({ defaultPath: "/secrets/mok.pub" }) mokPub: File,
        /** Push only this one image. Empty pushes all of them. */
        imageName = "",
    ): Promise<void> {
        const allImages = await this.getImages(mok, mokPub);
        const images = imageName
            ? allImages.filter((image) => image.name === imageName)
            : allImages;
        if (images.length === 0) {
            throw new Error(
                `No image named "${imageName}". Known images: ${allImages
                    .map((image) => image.name)
                    .join(", ")}`,
            );
        }

        const timestamp = new Date().toISOString();

        let cosignContainer = dag
            .container()
            .from("cgr.dev/chainguard/cosign:latest");
        cosignContainer = cosignContainer
            .withExec(
                [
                    "cosign",
                    "login",
                    "-u",
                    username,
                    "--password-stdin=true",
                    registry,
                ],
                { stdin: await password.plaintext() },
            )
            .withMountedSecret("/secrets/cosign.key", cosignKey, {
                owner: `${await cosignContainer.user()}`,
                mode: 0o600,
            });

        await Promise.all(
            images.map(async (image) => {
                const labels = {
                    "org.opencontainers.image.title": image.name,
                    "org.opencontainers.image.description": `Custom image based on ${image.baseRef}`,
                    "org.opencontainers.image.created": timestamp,
                    "org.opencontainers.image.revision": revision,
                    "org.opencontainers.image.source": `https://github.com/nzbr/ublue/tree/${revision}/src/images/${image.name}.ts`,
                    "org.opencontainers.image.vendor": "nzbr",
                };

                const container = Object.entries(labels).reduce(
                    (container, [key, value]) =>
                        container.withLabel(key, value),
                    await image.build(),
                );

                const kernelRelease = await container.label("ostree.linux");
                const fedoraVersion = kernelRelease.split(".").at(-2);
                const imageVersion = await container.label(
                    "org.opencontainers.image.version",
                );
                if (!fedoraVersion || !imageVersion) {
                    throw new Error("Failed to get version from image");
                }

                const shortCommit = revision.slice(0, 7);
                const tags = isPr
                    ? [`pr-${prNumber}`, shortCommit]
                    : ["latest", fedoraVersion, imageVersion, shortCommit];

                const repository = `${registry}/${namespace}/ublue-${image.name}`;

                const digest = await pushChunked(
                    container,
                    repository,
                    tags,
                    username,
                    password,
                );

                // All tags share the one manifest, so one signature covers them.
                await cosignContainer
                    .withExec([
                        "cosign",
                        "sign",
                        "--key",
                        "/secrets/cosign.key",
                        `${repository}@${digest}`,
                    ])
                    .sync();
            }),
        );
    }
}
