#!/usr/bin/bash

set -euxo pipefail
source $(dirname $0)/vars.sh

mkdir -p $builddir
cd $builddir

# TODO: Update with renovate
git clone --depth 1 --branch v3.4 https://github.com/oskarsh/Yin-Yang.git

dnf install -y conda
conda init || true
. /usr/etc/profile.d/conda.sh
conda env create -f "$(dirname $0)/environment.yaml" -p "$venv"
conda activate "$venv"

pushd Yin-Yang
pip install -r requirements.txt
popd

conda deactivate

mv "$venv" "$builddir/venv"
