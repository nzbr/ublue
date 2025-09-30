{ layers, ... }:
{
  name = "aurora-dx";
  from = "ghcr.io/ublue-os/aurora-dx:latest";
  layers = with layers; [
    rpm-ostree-tweaks
    nix-mountpoint
    kde-darkly
    kde-rounded-corners
    klassy
    kwin-effects-forceblur
    yin-yang
  ];
}
