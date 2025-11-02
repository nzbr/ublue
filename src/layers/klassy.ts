import * as os from "os";
import { Container, dag, Directory } from "@dagger.io/dagger";
import { fetchGit, GenericLayer, mkRPM } from "../lib";

export class KlassyLayer extends GenericLayer {
    name = "klassy";

    src = fetchGit("https://github.com/paulmcauley/klassy.git", "6.4.breeze6.4.0");

    async build(buildContainer: Container): Promise<Directory> {
        const packages = [
            "git",
            "cmake",
            "extra-cmake-modules",
            "gettext",
            "cmake(KF5Config)",
            "cmake(KF5CoreAddons)",
            "cmake(KF5FrameworkIntegration)",
            "cmake(KF5GuiAddons)",
            "cmake(KF5Kirigami2)",
            "cmake(KF5WindowSystem)",
            "cmake(KF5I18n)",
            "cmake(Qt5DBus)",
            "cmake(Qt5Quick)",
            "cmake(Qt5Widgets)",
            "cmake(Qt5X11Extras)",
            "cmake(KDecoration3)",
            "cmake(KF6ColorScheme)",
            "cmake(KF6Config)",
            "cmake(KF6CoreAddons)",
            "cmake(KF6FrameworkIntegration)",
            "cmake(KF6GuiAddons)",
            "cmake(KF6I18n)",
            "cmake(KF6KCMUtils)",
            "cmake(KF6KirigamiPlatform)",
            "cmake(KF6WindowSystem)",
            "cmake(Qt6Core)",
            "cmake(Qt6DBus)",
            "cmake(Qt6Quick)",
            "cmake(Qt6Svg)",
            "cmake(Qt6Widgets)",
            "cmake(Qt6Xml)",
        ];

        const content = buildContainer
            .withExec(["rpm-ostree", "install", ...packages])
            .withMountedDirectory("/src", this.src)
            .withExec(["cmake", "-S", "/src", "-B", "/build", "-DCMAKE_INSTALL_PREFIX=/usr"])
            .withExec(["cmake", "--build", "/build", "--parallel", os.cpus().length.toString()])
            .withEnvVariable("DESTDIR", "/dest")
            .withExec(["cmake", "--install", "/build"])
            .directory("/dest");

        return dag.directory()
            .withFile(
                "klassy.rpm",
                await mkRPM(buildContainer)({ name: "klassy", version: this.src.ref }, content),
            )
    };

    installScript = `
        rpm-ostree install ./klassy.rpm
    `;
}
