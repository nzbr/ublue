#!/usr/bin/env bash

set -euxo pipefail

curl https://copr.fedorainfracloud.org/coprs/deltacopy/darkly/repo/fedora-41/deltacopy-darkly-fedora-41.repo -o /etc/yum.repos.d/deltacopy-darkly-fedora-41.repo

rpm-ostree install darkly
