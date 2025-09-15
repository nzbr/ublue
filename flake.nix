{

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    nix-basement = {
      url = "github:nix-prefab/nix-basement/flake-part-stories";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    kwin-effects-forceblur = {
      url = "github:taj-ny/kwin-effects-forceblur";
      flake = false;
    };
    rpmpack = {
      url = "github:google/rpmpack/v0.7.1";
      flake = false;
    };
    yin-yang = {
      url = "github:oskarsh/Yin-Yang/v3.4";
      flake = false;
    };
    yt6801 = {
      url = "git+https://gitlab.com/tuxedocomputers/development/packages/tuxedo-yt6801.git";
      flake = false;
    };
  };

  outputs = inputs: inputs.nix-basement.lib.constructFlake
  { inherit inputs; root = ./.; }
  (
    { lib, ... }:
    {
      systems = [ "x86_64-linux" ];

      perSystem = { pkgs, ... }: {
        shell.packages = [
          pkgs.nix-output-monitor
          pkgs.rage
          pkgs.ragenix
        ];

        packages.rpmpack = pkgs.callPackage ./package/rpmpack.nix { inherit inputs; };
      };
    }
  );

}
