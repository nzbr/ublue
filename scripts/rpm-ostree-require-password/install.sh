#!/usr/bin/env bash

set -euxo pipefail

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
