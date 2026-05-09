import { dag, Container } from "@dagger.io/dagger";
import { Layer } from "../lib";

export class GVisorLayer implements Layer {
    name = "gvisor";

    async install(buildContainer: Container, targetContainer: Container): Promise<Container> {
        const platform = await targetContainer.platform();
        const arch = platform === "linux/arm64" ? "aarch64" : "x86_64";
        const baseUrl = `https://storage.googleapis.com/gvisor/releases/release/latest/${arch}`;

        const runsc = dag.http(`${baseUrl}/runsc`);
        const checksum = dag.http(`${baseUrl}/runsc.sha512`);

        await buildContainer
            .withFile("/runsc", runsc)
            .withFile("/runsc.sha512", checksum)
            .withExec(["bash", "-c", "cd / && sha512sum -c runsc.sha512"])
            .sync();

        return targetContainer
            .withFile("/usr/bin/runsc", runsc, { permissions: 0o755 })
            .withExec(["runsc", "install"]);
    }
}
