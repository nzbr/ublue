#!/usr/bin/bash

set -euxo pipefail
source $(dirname $0)/vars.sh

dnf install -y --setopt=install_weak_deps=False \
    git \
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

mkdir -p $builddir
cd $builddir

# TODO: Update with renovate
git clone --depth 1 --branch v1.3.4 https://github.com/taj-ny/kwin-effects-forceblur.git
cd kwin-effects-forceblur

mkdir build && cd build
cmake ../ -DCMAKE_INSTALL_PREFIX=/usr
make -j$(nproc)
