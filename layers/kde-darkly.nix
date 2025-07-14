{ ... }:
{
  name = "kde-darkly";

  install = ''
    dnf copr enable -y deltacopy/darkly
    rpm-ostree install darkly
  '';
}
