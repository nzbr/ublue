{

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    nix-basement.url = "github:nix-prefab/nix-basement/flake-part-stories";

    razer-nari-pulseaudio-profile = {
      url = "github:imustafin/razer-nari-pulseaudio-profile";
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
        shell.packages = [ pkgs.nix-output-monitor ];
      };
    }
  );

}
