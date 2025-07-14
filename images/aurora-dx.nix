{ layers, ... }:
{
  name = "aurora-dx";
  from = "ghcr.io/ublue-os/aurora-dx:latest";
  layers = with layers; [
    razer-nari-pulseaudio-profile
    rpm-ostree-tweaks
    nix-mountpoint
    kde-darkly
    kwin-effects-forceblur
    kde-rounded-corners
    yin-yang
  ];
}
