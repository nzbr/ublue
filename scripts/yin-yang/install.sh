#!/usr/bin/env bash

set -euxo pipefail

source $(dirname $0)/vars.sh

cd "$builddir/Yin-Yang"

mkdir -p /usr/lib/yin-yang
mkdir -p /usr/share/applications
mkdir -p /usr/share/icons/hicolor/scalable/apps
mkdir -p $venv

cp -r . /usr/lib/yin-yang/
cp -r "$builddir/venv/." "$venv"

cat - >/usr/bin/yin-yang <<EOF
#!/usr/bin/env bash
cd /usr/lib/yin-yang/ || exit 1
export PATH=$venv/bin:\$PATH
exec python -Om yin_yang "\$@"
EOF
chmod 0755 /usr/bin/yin-yang

cp ./resources/Yin-Yang.desktop "/usr/share/applications/Yin-Yang.desktop"
sed -i 's|Path=/opt/yin-yang|Path=/usr/lib/yin-yang|' "/usr/share/applications/Yin-Yang.desktop"

cp ./resources/logo.svg /usr/share/icons/hicolor/scalable/apps/yin_yang.svg
