#!/usr/bin/env bash

set -euxo pipefail

repo=/tmp/razer-nari-pulseaudio-profile

git clone https://github.com/imustafin/razer-nari-pulseaudio-profile.git $repo

install -Dvm 0644 $repo/razer-nari-{input,output-{game,chat}}.conf /usr/share/alsa-card-profile/mixer/paths/
install -Dvm 0644 $repo/razer-nari-usb-audio.conf /usr/share/alsa-card-profile/mixer/profile-sets/
install -Dvm 0644 $repo/91-pulseaudio-razer-nari.rules /usr/lib/udev/rules.d/91-pulseaudio-razer-nari.rules.pipewire

rm -rf $repo
