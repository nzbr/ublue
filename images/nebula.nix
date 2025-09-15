{ layers, ... }:
{
  name = "nebula";
  from = "ghcr.io/nzbr/ublue-aurora-dx:latest";
  layers = with layers; [
    motorcomm-yt6801
    ecryptfs
    onepassword
    cider
    (ollama.override { withRocm = true; })
  ];
}
