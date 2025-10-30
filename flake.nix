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
          pkgs.rage
          pkgs.ragenix

          inputs.dagger.packages.${system}.dagger
          pkgs.corepack
        ];
      };
    }
  );

}
