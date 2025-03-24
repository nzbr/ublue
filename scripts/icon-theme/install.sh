#!/usr/bin/env bash

set -euxo pipefail

source $(dirname $0)/vars.sh

cd $builddir/Eleven-icon-theme

cp -r icons/Eleven /usr/share/icons/
cp -r icons/Eleven-Dark /usr/share/icons/
cp -r icons/Eleven-Light /usr/share/icons/
