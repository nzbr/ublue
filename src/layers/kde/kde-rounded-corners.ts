import { Container, dag, Directory } from "@dagger.io/dagger";
import * as os from "os";
import { fetchGit, GenericLayer, mkRPM } from "../../lib";

export class KdeRoundedCornersLayer extends GenericLayer {
    name = "kde-rounded-corners";

    // src = fetchGit("https://github.com/matinlotfali/KDE-Rounded-Corners", "v0.8.6");
    src = fetchGit("https://github.com/matinlotfali/KDE-Rounded-Corners", "4c5dce7d9190d077f51e87b095ce322a9483af97");

    async build(buildContainer: Container): Promise<Directory> {
        const packages = [
            "git",
            "cmake",
            "gcc-c++",
            "extra-cmake-modules",
            "kwin-devel",
            "kf6-kconfigwidgets-devel",
            "libepoxy-devel",
            "kf6-kcmutils-devel",
            "kf6-ki18n-devel",
            "qt6-qtbase-private-devel",
            "wayland-devel",
            "libdrm-devel",
        ];

        const content = buildContainer
            .withExec(["dnf", "install", "-y", ...packages])
            .withMountedDirectory("/src", this.src)
            .withExec(["cmake", "-S", "/src", "-B", "/build", "-DCMAKE_INSTALL_PREFIX=/usr"])
            .withExec(["cmake", "--build", "/build", "--parallel", os.cpus().length.toString()])
            .withEnvVariable("DESTDIR", "/dest")
            .withExec(["cmake", "--install", "/build"])
            .directory("/dest");

        return dag.directory()
            .withFile(
                "kde-rounded-corners.rpm",
                await mkRPM(buildContainer)({ name: "kde-rounded-corners", version: this.src.ref }, content),
            )
    }

    installScript = `
        dnf install -y ./kde-rounded-corners.rpm
    `;
}
