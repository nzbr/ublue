{ ... }:
{
  name = "nix-mountpoint";

  install = ''
    mkdir /nix
  '';
}
