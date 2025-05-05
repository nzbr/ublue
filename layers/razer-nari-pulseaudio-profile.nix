{ inputs, ... }:
{
  name = "Razer Nari PulseAudio Profile";

  build = ''
    cp -vr ${inputs.razer-nari-pulseaudio-profile}/. .
  '';

  install = ''
    install -Dvm 0644 razer-nari-{input,output-{game,chat}}.conf /usr/share/alsa-card-profile/mixer/paths/
    install -Dvm 0644 razer-nari-usb-audio.conf /usr/share/alsa-card-profile/mixer/profile-sets/
    install -Dvm 0644 91-pulseaudio-razer-nari.rules /usr/lib/udev/rules.d/91-pulseaudio-razer-nari.rules.pipewire
  '';
}
