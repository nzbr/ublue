{ ... }:
{
  name = "ecryptfs utilities for home directory encryption";

  install = ''
    rpm-ostree install ecryptfs-utils ecryptfs-utils-loginmount
    authselect enable-feature with-ecryptfs
  '';
}
