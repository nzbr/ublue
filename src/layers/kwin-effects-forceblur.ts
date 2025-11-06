import { GenericLayer, fetchGit } from "../lib";

export class KWinEffectsForceblurLayer extends GenericLayer {
    name = "kwin-effects-forceblur";

    src = fetchGit("https://github.com/taj-ny/kwin-effects-forceblur.git", "v1.5.0")

    buildScript = `
        rpm-ostree install \\
        cmake \\
        extra-cmake-modules \\
        gcc-g++ \\
        kdecoration-devel-$(rpm -q --qf '%{VERSION}' kdecoration) \\
        kf6-kcmutils-devel-$(rpm -q --qf '%{VERSION}' kf6-kcmutils) \\
        kf6-kconfigwidgets-devel-$(rpm -q --qf '%{VERSION}' kf6-kconfigwidgets) \\
        kf6-kcrash-devel-$(rpm -q --qf '%{VERSION}' kf6-kcrash) \\
        kf6-kdeclarative \\
        kf6-kdeclarative-devel \\
        kf6-kglobalaccel \\
        kf6-kglobalaccel-devel \\
        kf6-kguiaddons \\
        kf6-kguiaddons-devel \\
        kf6-ki18n \\
        kf6-ki18n-devel \\
        kf6-kio \\
        kf6-kio-devel \\
        kf6-knotifications-devel-$(rpm -q --qf '%{VERSION}' kf6-knotifications) \\
        kf6-kwindowsystem-devel-$(rpm -q --qf '%{VERSION}' kf6-kwindowsystem) \\
        kwin-devel-$(rpm -q --qf '%{VERSION}' kwin) \\
        libdrm-devel-$(rpm -q --qf '%{VERSION}' libdrm) \\
        libepoxy-devel-$(rpm -q --qf '%{VERSION}' libepoxy) \\
        libplasma-devel-$(rpm -q --qf '%{VERSION}' libplasma) \\
        plasma-workspace-devel-$(rpm -q --qf '%{VERSION}' plasma-workspace) \\
        qt6-qtbase-devel-$(rpm -q --qf '%{VERSION}' qt6-qtbase) \\
        qt6-qtbase-private-devel-$(rpm -q --qf '%{VERSION}' qt6-qtbase) \\
        rpm-build \\
        wayland-devel-$(rpm -q --qf '%{VERSION}' libwayland-client)

        cmake -B build -S . -D CMAKE_INSTALL_PREFIX=/usr
        cmake --build build -j$(nproc)

        cd build
        cpack -V -G RPM
    `;

    installScript = `
        rpm-ostree install "$PWD/build/kwin-better-blur.rpm"
    `;
}
