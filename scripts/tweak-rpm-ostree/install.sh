#!/usr/bin/env bash

set -euxo pipefail

rpm-ostree install plasma-discover-rpm-ostree

systemctl disable ublue-update.timer
systemctl enable rpm-ostreed-automatic.timer

cat <<EOF >/etc/rpm-ostreed.conf
# Entries in this file show the compile time defaults.
# You can change settings by editing this file.
# For option meanings, see rpm-ostreed.conf(5).

[Daemon]
AutomaticUpdatePolicy=check

##########
# NOTE: This will be set to true by default in Spring 2025
#
# Set this to false to enable local layering with dnf
# This is an unsupported configuration that can lead to upgrade isses
# Be careful when setting this to true
#
# See [future link] for more information
##########
# LockLayering=false
EOF

cat <<EOF >/etc/polkit-1/rules.d/org.projectatomic.rpmostree1.rules
polkit.addRule(function(action, subject) {
    if ((action.id == "org.projectatomic.rpmostree1.repo-refresh" ||
         action.id == "org.projectatomic.rpmostree1.upgrade") &&
        subject.active == true &&
        subject.local == true) {
            return polkit.Result.YES;
    }
});
EOF
