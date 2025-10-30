import { GenericLayer, fetchGit } from "../lib";

export class KWinEffectsForceblurLayer extends GenericLayer {
    name = "kwin-effects-forceblur";

    baseBuildDir = fetchGit("https://github.com/taj-ny/kwin-effects-forceblur.git", "v1.5.0")

    buildScript = `
        kf6_ver=$(rpm -q --qf '%{VERSION}' kf6-kconfigwidgets)

        rpm-ostree install \\
        cmake \\
        extra-cmake-modules-\${kf6_ver} \\
        gcc-g++ \\
        kdecoration-devel-$(rpm -q --qf '%{VERSION}' kdecoration) \\
        kf6-kcmutils-devel-\${kf6_ver} \\
        kf6-kconfigwidgets-devel-\${kf6_ver} \\
        kf6-kcrash-devel-\${kf6_ver} \\
        kf6-kdeclarative-\${kf6_ver} \\
        kf6-kdeclarative-devel-\${kf6_ver} \\
        kf6-kglobalaccel-\${kf6_ver} \\
        kf6-kglobalaccel-devel-\${kf6_ver} \\
        kf6-kguiaddons-\${kf6_ver} \\
        kf6-kguiaddons-devel-\${kf6_ver} \\
        kf6-ki18n-\${kf6_ver} \\
        kf6-ki18n-devel-\${kf6_ver} \\
        kf6-kio-\${kf6_ver} \\
        kf6-kio-devel-\${kf6_ver} \\
        kf6-knotifications-devel-\${kf6_ver} \\
        kf6-kwindowsystem-devel-\${kf6_ver} \\
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