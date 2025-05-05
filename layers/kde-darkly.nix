{ lib, ... }:
let
  fedora-version = "42";
  repo = builtins.fetchurl {
    url = "https://copr.fedorainfracloud.org/coprs/deltacopy/darkly/repo/fedora-41/deltacopy-darkly-fedora-${fedora-version}.repo";
    sha256 = "sha256:1qc64fzbmdamq5vjr5q1r24qc7csvdpldrxrb0dawiix78nafwjd";
  };
in
{
  name = "kde-darkly";

  build = ''
    cp ${repo} ./deltacopy-darkly-fedora-${fedora-version}.repo
  '';

  install = ''
    install -Dm644 ./deltacopy-darkly-fedora-${fedora-version}.repo /etc/yum.repos.d/deltacopy-darkly-fedora-${fedora-version}.repo

    rpm-ostree install darkly
  '';
}
