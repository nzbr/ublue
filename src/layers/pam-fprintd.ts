import { Container, dag, Directory } from "@dagger.io/dagger";
import { fetchGit, GenericLayer, Layer, mkRPM, unindent } from "../lib";

export class LibFprintTodLayer extends GenericLayer {
    name = "libfprint-tod";

    src = fetchGit("https://gitlab.freedesktop.org/3v1n0/libfprint.git", "v1.95.0+tod1");

    async build(buildContainer: Container): Promise<Directory> {
        let container = buildContainer
            .withExec(["dnf", "install", "-y",
                "meson",
                "cmake",
                "gcc-c++",
                "glib2-devel",
                "libgusb-devel",
                "gobject-introspection-devel",
                "cairo-devel",
                "pixman-devel",
                "libgudev-devel",
                "gtk-doc"
            ])
            .withWorkdir("/build")
            .withDirectory("/build/repo", this.src)
            .withWorkdir("/build/repo")
            .withExec(["meson", "setup", "build", "--prefix=/usr"])
            .withEnvVariable("CCACHE_DISABLE", "1")
            .withExec(["meson", "install", "-C", "build", "--destdir", "/build/install"]);

        const content = container.directory("/build/install");
        const version = this.src.ref.replace("v", "").replace("+", ".");
        const rpm = await mkRPM(buildContainer)({
            name: "libfprint",
            version: version,
            specfile: unindent`
                Name: libfprint
                Version: ${version}
                Release: 1%{?dist}
                Summary: libfprint-tod
                License: Unknown
                URL: https://gitlab.freedesktop.org/3v1n0/libfprint
                Source0: %{name}-%{version}.tar.gz
                BuildArch: x86_64

                %description
                libfprint-tod

                %install
                export QA_RPATHS=0x0030
                rm -rf $RPM_BUILD_ROOT
                mkdir -p $RPM_BUILD_ROOT
                cp -vr %{_sourcedir}/libfprint/. $RPM_BUILD_ROOT

                %files
            `,
        }, content);

        return dag.directory().withFile("libfprint.rpm", rpm);
    }

    installScript = `
        dnf swap -y libfprint $PWD/libfprint.rpm
    `;
}

export class SynatudorLayer extends GenericLayer {
    name = "synatudor";

    src = fetchGit("https://github.com/popax21/synatudor.git", "31dfdb06107fd1c35c9f9ceae72617e98eccc43a");

    async build(buildContainer: Container): Promise<Directory> {
        let container = buildContainer
            .withExec(["dnf", "install", "-y",
                "meson",
                "cmake",
                "gcc",
                "glib2-devel",
                "innoextract",
                "libusb1-devel",
                "libcap-devel",
                "libseccomp-devel",
                "dbus-devel"
            ])
            .withWorkdir("/build")
            .withDirectory("/build/repo", this.src)
            .withWorkdir("/build/repo")
            .withEnvVariable("CCACHE_DISABLE", "1")
            .withExec(["meson", "setup", "build", "--prefix=/usr"])
            .withExec(["meson", "install", "-C", "build", "--destdir", "/build/install"]);

        const content = container.directory("/build/install");
        const version = this.src.ref;
        const rpm = await mkRPM(buildContainer)({
            name: "synatudor",
            version: version,
            arch: "x86_64",
            license: "Unknown",
            requires: ["libfprint"]
        }, content);

        return dag.directory().withFile("synatudor.rpm", rpm);
    }

    installScript = `
        dnf install -y $PWD/synatudor.rpm
    `;
}

export class PamFprintdLayer implements Layer {
    name = "pam-fprintd";

    async install(buildContainer: Container, targetContainer: Container): Promise<Container> {
        const libfprintTod = new LibFprintTodLayer();
        const synatudor = new SynatudorLayer();

        const withLibFprint = await libfprintTod.install(buildContainer, targetContainer);
        const withSynatudor = await synatudor.install(withLibFprint, withLibFprint);
        return await withSynatudor
            .withExec(["authselect", "enable-feature", "with-fingerprint"])
            .withExec(["authselect", "apply-changes"]);
    }
}
