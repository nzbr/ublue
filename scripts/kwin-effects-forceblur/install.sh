#!/usr/bin/env bash

set -euxo pipefail

# TODO: Check kwin version

source $(dirname $0)/vars.sh

cd $builddir/kwin-effects-forceblur/build
mkdir -p /usr/lib64/qt6/plugins/kwin/effects/plugins/
install -Dm755 src/forceblur.so /usr/lib64/qt6/plugins/kwin/effects/plugins/
install -Dm755 src/kcm/kwin_better_blur_config.so /usr/lib64/qt6/plugins/kwin/effects/configs/
