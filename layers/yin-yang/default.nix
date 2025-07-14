{ inputs, ... }:
let
  venv = "/usr/lib/yin-yang/.venv";
in
{
  name = "Yin Yang";

  build = ''
    cp -vr ${inputs.yin-yang}/. ./

    rpm-ostree install conda

    mkdir -p /var/roothome # /var is not set up in the container

    conda init || true
    . /usr/etc/profile.d/conda.sh

    conda env create -f "${./environment.yaml}" -p "${venv}"
    conda activate "${venv}"

    pip install -r requirements.txt

    conda deactivate

    mv "${venv}" ./venv
  '';

  install = ''
    mkdir -p /usr/lib/yin-yang /usr/share/applications /usr/share/icons/hicolor/scalable/apps "${venv}"

    cp -r ./venv/. "${venv}"
    rm -rf venv
    cp -r . /usr/lib/yin-yang

    cat - >/usr/bin/yin-yang <<EOF
    #!/usr/bin/env bash
    cd /usr/lib/yin-yang/ || exit 1
    export PATH=${venv}/bin:\\$PATH
    exec python -Om yin_yang "\$@"
    EOF
    chmod 0755 /usr/bin/yin-yang

    cp ./resources/Yin-Yang.desktop "/usr/share/applications/Yin-Yang.desktop"
    sed -i 's|Path=/opt/yin-yang|Path=/usr/lib/yin-yang|' "/usr/share/applications/Yin-Yang.desktop"

    cp ./resources/logo.svg /usr/share/icons/hicolor/scalable/apps/yin_yang.svg
  '';
}
