{ inputs, ... }:
{
  name = "KWin Effects Forceblur";

  build = ''
    rpm-ostree install \
      cmake \
      extra-cmake-modules \
      gcc-g++ \
      kf6-kwindowsystem-devel \
      plasma-workspace-devel \
      libplasma-devel \
      qt6-qtbase-private-devel \
      qt6-qtbase-devel \
      cmake \
      kwin-devel \
      extra-cmake-modules \
      kwin-devel \
      kf6-knotifications-devel \
      kf6-kio-devel \
      kf6-kcrash-devel \
      kf6-ki18n-devel \
      kf6-kguiaddons-devel \
      libepoxy-devel \
      kf6-kglobalaccel-devel \
      kf6-kcmutils-devel \
      kf6-kconfigwidgets-devel \
      kf6-kdeclarative-devel \
      kdecoration-devel \
      kf6-kglobalaccel \
      kf6-kdeclarative \
      libplasma \
      kf6-kio \
      qt6-qtbase \
      kf6-kguiaddons \
      kf6-ki18n \
      wayland-devel

      cp -vr ${inputs.kwin-effects-forceblur}/. ./

      cmake -B build -S . -D CMAKE_INSTALL_PREFIX=/usr
      cmake --build build -j$(nproc)
  '';

  install = ''
    cd build
    mkdir -p /usr/lib64/qt6/plugins/kwin/effects/plugins/
    install -Dm755 src/forceblur.so /usr/lib64/qt6/plugins/kwin/effects/plugins/
    install -Dm755 src/kcm/kwin_better_blur_config.so /usr/lib64/qt6/plugins/kwin/effects/configs/
  '';
}
