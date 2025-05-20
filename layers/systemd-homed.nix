{ ... }:
{
  name = "systemd-homed";

  install = ''
    authselect enable-feature with-systemd-homed
    systemctl enable systemd-homed
  '';
}
