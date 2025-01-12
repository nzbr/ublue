#!/usr/bin/env bash

set -euxo pipefail

source $(dirname $0)/vars.sh

cd $builddir/KDE-Rounded-Corners/build

install -Dm755 bin/kwin/effects/plugins/kwin4_effect_shapecorners.so /usr/lib64/qt6/plugins/kwin/effects/plugins/kwin4_effect_shapecorners.so
install -Dm755 bin/kwin/effects/configs/kwin_shapecorners_config.so /usr/lib64/qt6/plugins/kwin/effects/configs/kwin_shapecorners_config.so
install -Dm644 src/shaders/shapecorners.frag /usr/share/kwin/shaders/shapecorners.frag
install -Dm644 src/shaders/shapecorners_core.frag /usr/share/kwin/shaders/shapecorners_core.frag
