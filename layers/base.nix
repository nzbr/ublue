{ ... }:
{
  name = "base";

  install = ''
    mkdir -p /var/lib/alternatives
  '';
}
