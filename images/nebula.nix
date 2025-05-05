{ layers, ... }:
{
  name = "nebula";
  from = "ghcr.io/nzbr/ublue-bluefin-dx:latest";
  layers = with layers; [
    onepassword
    razer-nari-pulseaudio-profile
    rpm-ostree-tweaks
    nix-mountpoint
    no-flatpak-auto-update
  ];
}
