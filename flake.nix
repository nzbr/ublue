{

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    nix-basement = {
      url = "github:nix-prefab/nix-basement/flake-part-stories";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    razer-nari-pulseaudio-profile = {
      url = "github:imustafin/razer-nari-pulseaudio-profile";
      flake = false;
    };
    kwin-effects-forceblur = {
      url = "github:taj-ny/kwin-effects-forceblur";
      flake = false;
    };
    kde-rounded-corners = {
      url = "github:matinlotfali/KDE-Rounded-Corners/v0.6.7";
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
      };
    }
  );

}
