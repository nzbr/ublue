import { dag, Container } from "@dagger.io/dagger";
import * as toml from "smol-toml";
import { Layer, unindent } from "../lib";

export class ContainerRuntimesLayer implements Layer {
    name = "container-runtimes";

    async install(buildContainer: Container, targetContainer: Container): Promise<Container> {
        const platform = await targetContainer.platform();
        const arch = platform === "linux/arm64" ? "aarch64" : "x86_64";
        const baseUrl = `https://storage.googleapis.com/gvisor/releases/release/latest/${arch}`;

        const runscDownload = dag.http(`${baseUrl}/runsc`);
        const checksum = dag.http(`${baseUrl}/runsc.sha512`);

        const runsc = buildContainer
            .withFile("/runsc", runscDownload)
            .withFile("/runsc.sha512", checksum)
            .withExec(["bash", "-c", "cd / && sha512sum -c runsc.sha512"])
            .file("/runsc");

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

        let configToml = await (async () => {
            try {
                return await withRuntimes.file("/etc/containerd/config.toml").contents();
            } catch {
                return await withRuntimes.withExec(["containerd", "config", "default"]).stdout();
            }
        })();


        const configObj: any = toml.parse(configToml) || {};

        configObj.plugins ??= {};
        configObj.plugins["io.containerd.grpc.v1.cri"] ??= {};
        configObj.plugins["io.containerd.grpc.v1.cri"].containerd ??= {};
        configObj.plugins["io.containerd.grpc.v1.cri"].containerd.runtimes ??= {};

        configObj.plugins["io.containerd.grpc.v1.cri"].containerd.runtimes.kata = {
            runtime_type: "io.containerd.kata.v2",
            privileged_without_host_devices: true,
            pod_annotations: ["io.katacontainers.*"]
        };

        configObj.plugins["io.containerd.grpc.v1.cri"].containerd.runtimes.runsc = {
            runtime_type: "io.containerd.runsc.v1"
        };

        const newToml = toml.stringify(configObj);

        return withRuntimes.withNewFile(
            "/etc/containerd/config.toml",
            newToml,
        );
    }
}
