import { dag, object, func, argument, Secret, File, Container } from "@dagger.io/dagger"
import BluefinDxImage from "./images/bluefin-dx";
import AuroraDxImage from "./images/aurora-dx";
import NebulaImage from "./images/nebula";

@object()
export class Ublue {
  constructor() { }

  @func()
  bluefinDx(): Promise<Container> {
    return new BluefinDxImage().build()
  }

  @func()
  auroraDx(): Promise<Container> {
    return new AuroraDxImage().build()
  }

  @func()
  nebula(
    signingKey: Secret,
    @argument({ defaultPath: "/secrets/mok.pub" }) signingKeyPub: File,
  ): Promise<Container> {
    return new NebulaImage(signingKey, signingKeyPub).build()
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
  ): Promise<string[][]> {
    const timestamp = new Date().toISOString();

    const images = [
      await new BluefinDxImage(),
      await new AuroraDxImage(),
      await new NebulaImage(mok, mokPub),
    ];

    return await Promise.all(images.map(async image => image.build().then(async container => {
      container = container
        .withRegistryAuth(registry, username, password);

      const kernelRelease = await container.label("ostree.linux");
      const fedoraVersion = kernelRelease.split(".").at(-2);
      const imageVersion = await container.label("org.opencontainers.image.version");
      if (!fedoraVersion || !imageVersion) {
        throw new Error("Failed to get version from image");
      }

      const labels = {
        "org.opencontainers.image.title": image.name,
        "org.opencontainers.image.description": `Custom image based on ${image.from}`,
        "org.opencontainers.image.created": timestamp,
        "org.opencontainers.image.revision": revision,
        "org.opencontainers.image.source": `https://github.com/nzbr/ublue/tree/${revision}/src/images/${image.name}.ts`,
        "org.opencontainers.image.vendor": "nzbr",
      };
      container = Object.entries(labels).reduce((container, [key, value]) => container.withLabel(key, value), container);

      const shortCommit = revision.slice(0, 7);
      const tags = isPr
        ? [
          `pr-${prNumber}`,
          shortCommit,
        ]
        : [
          "latest",
          fedoraVersion,
          imageVersion,
          shortCommit,
        ];

      let cosignContainer = dag.container()
        .from("cgr.dev/chainguard/cosign:latest");
      cosignContainer = cosignContainer
        .withExec(["cosign", "login", "-u", username, "--password-stdin=true", registry], { stdin: await password.plaintext() })
        .withMountedSecret("/secrets/cosign.key", cosignKey, { owner: `${await cosignContainer.user()}`, mode: 0o600 })

      return await Promise.all(tags.map(async tag => {
        const digest = await container.publish(`${registry}/${namespace}/ublue-${image.name}:${tag}`)
        return await cosignContainer
          .withExec(["cosign", "sign", "--key", "/secrets/cosign.key", digest])
          .stdout();
      }));
    })));
  }
}
