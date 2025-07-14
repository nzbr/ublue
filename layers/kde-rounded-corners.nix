{ ... }:
{
  name = "KDE Rounded Corners";

  install = ''
    dnf copr enable -y matinlotfali/KDE-Rounded-Corners
    rpm-ostree install kwin-effect-roundcorners
  '';
}
