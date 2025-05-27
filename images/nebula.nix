{ layers, ... }:
{
  name = "nebula";
  from = "ghcr.io/nzbr/ublue-bluefin-dx:latest";
  layers = with layers; [
    onepassword
    ecryptfs
    motorcomm-yt6801
  ];
}
