{

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    nix-basement = {
      url = "github:nix-prefab/nix-basement/flake-part-stories";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    dagger = {
      url = "github:dagger/nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs: inputs.nix-basement.lib.constructFlake
  { inherit inputs; root = ./.; }
  (
    { lib, ... }:
    {
      systems = [ "x86_64-linux" ];

      perSystem = { pkgs, system, ... }: {
        shell.packages = [
          pkgs.just
          pkgs.awscli2
          pkgs.rage
          pkgs.ragenix
          pkgs.zstd

          inputs.dagger.packages.${system}.dagger
          pkgs.nodejs
          pkgs.corepack

          pkgs.skopeo
          pkgs.podman
          pkgs.qemu
          pkgs.OVMF
          (pkgs.writeShellScriptBin "vm-ovmf" ''
            case "$1" in
              no) echo ${(pkgs.OVMF.override { secureBoot = false; systemManagementModeRequired = false; }).fd}/FV ;;
              yes) echo ${pkgs.OVMFFull.fd}/FV ;;
              *) echo "secureboot must be yes or no" >&2; exit 1 ;;
            esac
          '')
          pkgs.e2fsprogs
          pkgs.openssl
          pkgs.shadow
          pkgs.coreutils
          pkgs.findutils
          pkgs.gnutar
          pkgs.gnused
        ];
      };
    }
  );

}
