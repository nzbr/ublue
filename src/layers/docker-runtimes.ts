import { dag, Container } from "@dagger.io/dagger";
import { Layer, unindent } from "../lib";

export class DockerRuntimesLayer implements Layer {
    name = "docker-runtimes";

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

        const uname = targetContainer.file("/usr/bin/uname");
        const fakeUname = dag.file("uname", unindent`
            #!/usr/bin/env bash
            live=$(uname.real -r)
            bundled=$(rpm -q --qf '%{VERSION}-%{RELEASE}.%{ARCH}' kernel-core)
            uname.real "$@" | sed "s|$live|$bundled|g"
        `)

        const withRuntimes = targetContainer
            .withFile("/usr/bin/runsc", runsc, { permissions: 0o755 })
            .withExec(["runsc", "install"])
            .withMountedFile("/usr/bin/uname.real", uname)
            .withMountedFile("/usr/bin/uname", fakeUname)
            .withExec(["chmod", "+x", "/usr/bin/uname.real", "/usr/bin/uname"])
            .withExec(["dnf", "install", "-y", "kata-containers"])
            .withoutMount("/usr/bin/uname")
            .withoutMount("/usr/bin/uname.real");

        const daemonJson = JSON.parse(
            await withRuntimes.file("/etc/docker/daemon.json").contents(),
        );
        daemonJson.runtimes ??= {};
        daemonJson.runtimes.kata = { path: "/usr/bin/kata-runtime" };

        return withRuntimes.withNewFile(
            "/etc/docker/daemon.json",
            JSON.stringify(daemonJson, null, 2),
        );
    }
}
