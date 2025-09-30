{ ... }:
{
  name = "klassy";

  install = ''
    rpm-ostree install klassy
  '';
}
