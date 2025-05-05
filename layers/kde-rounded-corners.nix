{ inputs, runCommand, ... }:
let
  stripped-source = runCommand "kde-rounded-corners" { } ''
    mkdir -p $out
    cd $out
    cp -vr ${inputs.kde-rounded-corners}/. .
    chmod -R +w screenshots .github
    rm -rf screenshots .github
  '';
in
{
  name = "KDE Rounded Corners";

  build = ''
    rpm-ostree install \
      cmake \
      gcc-c++ \
      extra-cmake-modules \
      kwin-devel \
      kf6-kconfigwidgets-devel \
      libepoxy-devel \
      kf6-kcmutils-devel \
      qt6-qtbase-private-devel \
      wayland-devel

    cp -vr ${stripped-source}/. ./

    cmake -B build -S . -D CMAKE_INSTALL_PREFIX=/usr
    cmake --build build -j$(nproc)
  '';

  install = ''
    cd build

    install -Dm755 bin/kwin/effects/plugins/kwin4_effect_shapecorners.so /usr/lib64/qt6/plugins/kwin/effects/plugins/kwin4_effect_shapecorners.so
    install -Dm755 bin/kwin/effects/configs/kwin_shapecorners_config.so /usr/lib64/qt6/plugins/kwin/effects/configs/kwin_shapecorners_config.so
    install -Dm644 src/shaders/shapecorners.frag /usr/share/kwin/shaders/shapecorners.frag
    install -Dm644 src/shaders/shapecorners_core.frag /usr/share/kwin/shaders/shapecorners_core.frag
  '';
}
