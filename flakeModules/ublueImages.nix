{ config, lib, root, inputs, ... }:
let
  inherit (lib)
    mkPerSystemOption
    findModules
    mkOption
    types
    removeSuffix
    mapAttrs'
    mapAttrs
    ;
in
{
  options = {
    perSystem = mkPerSystemOption {
      _file = ./ublueImages.nix;

      options = {
        ublueLayers = mkOption {
          type = with types; lazyAttrsOf (attrsOf anything);
          default = { };
        };
      };
    };
  };

  config = {
    perSystem = { pkgs, config, ... }: {
      ublueLayers =
        let
          layerModules = mapAttrs' (n: v: { name = removeSuffix "/default" n; value = v; }) (findModules "${root}/layers");
        in
        mapAttrs (n: v: pkgs.callPackage v { inherit inputs; inherit lib; }) layerModules;

      ublueImages =
        let
          configs = findModules "${root}/images";
          configs' = mapAttrs (n: v: pkgs.callPackage v { layers = config.ublueLayers; }) configs;
        in
        mapAttrs (n: v: pkgs.callPackage ../package/containerfile.nix { imageConfig = v; inherit lib; }) configs';
    };
  };
}
