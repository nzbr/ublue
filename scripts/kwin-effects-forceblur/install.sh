#!/usr/bin/env bash

set -euxo pipefail

source $(dirname $0)/vars.sh

cp -vr $pkgdir/* /
