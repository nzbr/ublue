let
  keys = [
    "age1uhjmqvcw2k8efx0fncl0wa579r8ka9vmxpgd6g56mmt4m9x75vksa864ts"
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILQL6A3KKS+0ximTtRCX4YiKoaf9r0rfYov3/D1E3uAT nzbr@nebula.lan"
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIkNP8Lo20fw3Ysq3B64Iep9WyVKWxdv5KJOZRLmAaaM nzbr@pulsar"
  ];

  files = [
    "secrets/mok.key.age"
  ];
in
builtins.listToAttrs (
  builtins.map (file: {
    name = file;
    value = {
      publicKeys = keys;
    };
  }) files
)
