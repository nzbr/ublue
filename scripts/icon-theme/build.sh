#!/usr/bin/env bash

set -euxo pipefail

source $(dirname $0)/vars.sh

mkdir -p $builddir
cd $builddir

wget https://github.com/mjkim0727/Eleven-icon-theme/archive/refs/tags/1.7.tar.gz -O eleven-icon-theme.tar.gz
tar -xzf eleven-icon-theme.tar.gz
rm eleven-icon-theme.tar.gz
mv Eleven-icon-theme-1.7 Eleven-icon-theme
