{ ... }:
{
  name = "Disable automatic updates for Flatpak";

  install = ''
    rm /etc/systemd/system/timers.target.wants/flatpak-system-update.timer
  '';
}
