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
    perSystem = { self', pkgs, config, ... }: {
      ublueLayers =
        let
          layerModules = mapAttrs' (n: v: { name = removeSuffix "/default" n; value = v; }) (findModules "${root}/layers");
        in
        # For some reason this only works when everything is passed to the last argument of callPackage, so there's no point in using pkgs.callPackage
        mapAttrs (n: v: lib.callPackageWith { } v (pkgs // self'.packages // { inherit inputs lib; })) layerModules;

      ublueImages =
        let
          configs = findModules "${root}/images";
          configs' = mapAttrs (n: v: pkgs.callPackage v { layers = config.ublueLayers; }) configs;
        in
        mapAttrs (n: v: pkgs.callPackage ../package/generateContainerfile.nix { imageConfig = v; inherit lib; }) configs';
    };
  };
}
