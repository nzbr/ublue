#!/usr/bin/env bash

set -euxo pipefail

# Add the Koi COPR
FEDORA_VERSION=$(grep -oP '(?<=release )\d+' /etc/fedora-release)
curl -sL https://copr.fedorainfracloud.org/coprs/birkch/Koi/repo/fedora-41/birkch-Koi-fedora-41.repo -o /etc/yum.repos.d/birkch-Koi-fedora-41.repo

# Install Koi
rpm-ostree install Koi
