let
  keys = [
    "age1jqhcxfnfezztwu4wnp6vgjfdaesf4w9cxz5n4ycwnqyf8tvjpfpqznzaul"
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILQL6A3KKS+0ximTtRCX4YiKoaf9r0rfYov3/D1E3uAT nzbr@nebula.lan"
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIkNP8Lo20fw3Ysq3B64Iep9WyVKWxdv5KJOZRLmAaaM nzbr@pulsar"
  ];

  files = [
    "secrets/mok.key.age"
    "secrets/cosign.key.age"
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
