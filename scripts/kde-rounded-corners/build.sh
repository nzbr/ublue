#!/usr/bin/bash

set -euxo pipefail
source $(dirname $0)/vars.sh

dnf install -y --setopt=install_weak_deps=False \
    cmake \
    gcc-c++ \
    extra-cmake-modules \
    kwin-devel \
    kf6-kconfigwidgets-devel \
    libepoxy-devel \
    kf6-kcmutils-devel \
    qt6-qtbase-private-devel \
    wayland-devel

mkdir -p $builddir
cd $builddir

# TODO: Pin version, update with renovate
git clone --depth 1 --branch v0.6.7 https://github.com/matinlotfali/KDE-Rounded-Corners.git
cd KDE-Rounded-Corners

mkdir build && cd build
cmake ../ -DCMAKE_INSTALL_PREFIX=$pkgdir/usr
make -j$(nproc)

mkdir -p $pkgdir
make install
