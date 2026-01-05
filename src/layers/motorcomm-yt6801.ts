import { Container, Secret, File } from "@dagger.io/dagger";
import { fetchGit, Layer, unindent } from "../lib";

export class MotorcommYT6801Layer implements Layer {
    name = "Motorcomm YT6801 NIC driver";

    signingKey: Secret;
    signingKeyPub: File;

    constructor(signingKey: Secret, signingKeyPub: File) {
        this.signingKey = signingKey;
        this.signingKeyPub = signingKeyPub;
    }

    async install(buildContainer: Container, targetContainer: Container): Promise<Container> {
        const kernelVersion = (await buildContainer
            .withExec(["rpm", "-q", "kernel"])
            .stdout())
            .replace(/^kernel-/, "")
            .trim();

        const moduleFileName = "yt6801.ko.xz";

        const buildScript = unindent`
            MODULE_NAME=$(grep -Pom1 '.*(?= \\(.*\\) .*; urgency=.*)' ./debian/changelog)
            MODULE_VERSION=$(grep -Pom1 '.* \\(\\K.*(?=\\) .*; urgency=.*)' ./debian/changelog)
            DKMS_DIR="/usr/src/\${MODULE_NAME}-\${MODULE_VERSION}"

            cp -vr "./src/." "$DKMS_DIR"
            sed "s/#MODULE_VERSION#/\${MODULE_VERSION}/" "./debian/tuxedo-yt6801.dkms" > "$DKMS_DIR/dkms.conf"

            dkms add -m "$MODULE_NAME" -v "$MODULE_VERSION"
            dkms build -m "$MODULE_NAME" -v "$MODULE_VERSION" -k "${kernelVersion}"
            dkms install -m "$MODULE_NAME" -v "$MODULE_VERSION" -k "${kernelVersion}"

            # # Copy the signed module and the MOK to the build directory
            mkdir -p /out
            cp $(find /lib/modules -type f -name 'yt6801.ko.xz' -print) /out/${moduleFileName}
        `;

        const src = fetchGit("https://gitlab.com/tuxedocomputers/development/packages/tuxedo-yt6801.git", "v1.0.30tux5")
            .withNewFile("build.sh", buildScript, { permissions: 0o755 });


        const kernelModule = buildContainer
            .withExec(["dnf", "install", "-y", "dkms"])
            .withMountedFile("/var/lib/dkms/mok.pub", this.signingKeyPub)
            .withMountedSecret("/var/lib/dkms/mok.key", this.signingKey)
            .withMountedDirectory("/build", src)
            .withWorkdir("/build")
            .withExec(["bash", "./build.sh"])
            .file(`/out/${moduleFileName}`);

        const setupScript = unindent`
            #!/usr/bin/env bash
            set -ex
            echo -e "universalblue\nuniversalblue" | mokutil --import /usr/lib/dkms/mok.pub
            mkdir -p /var/lib/dkms
            touch /var/lib/dkms/mok-setup-done
        `;

        const setupUnit = unindent`
            [Unit]
            Description=Set up MOK
            ConditionPathExists=/usr/lib/dkms/mok.pub
            ConditionPathExists=!/var/lib/dkms/mok-setup-done

            [Service]
            Type=oneshot
            ExecStart=/usr/lib/dkms/setup-mok.sh

            [Install]
            WantedBy=multi-user.target
        `;

        return targetContainer
            .withFile(`/lib/modules/${kernelVersion}/extra/${moduleFileName}`, kernelModule)
            .withFile(`/usr/lib/dkms/mok.pub`, this.signingKeyPub)
            .withNewFile(`/usr/lib/dkms/setup-mok.sh`, setupScript, { permissions: 0o755 })
            .withNewFile(`/usr/lib/systemd/system/mok-setup.service`, setupUnit, { permissions: 0o644 })
            .withNewFile(`/usr/lib/modules-load.d/yt6801.conf`, "yt6801\n", { permissions: 0o644 })
            .withExec(["systemctl", "enable", "mok-setup.service"])
    }
}
