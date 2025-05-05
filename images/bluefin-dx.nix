{ layers, ... }:
{
  name = "bluefin-dx";
  from = "ghcr.io/ublue-os/bluefin-dx:latest";
  layers = with layers; [
    razer-nari-pulseaudio-profile
    rpm-ostree-tweaks
    no-flatpak-auto-update
    nix-mountpoint
  ];
}
