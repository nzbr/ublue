{
  config,
  lib,
  stories,
  ...
}:
let
  inherit (lib)
  mkTransposedPerSystemModule
    concatStringsSep
    flatten
    mapAttrs
    mapAttrs'
    mkOption
    mkPerSystemOption
    ;
  inherit (lib.types)
    lazyAttrsOf
    lines
    listOf
    package
    submodule
    functionTo
    ;
in
mkTransposedPerSystemModule {
  name = "ublueImages";
  option = mkOption {
    type = lazyAttrsOf package;
    default = { };
    description = ''
      An attribute set of derivations that produce Containerfiles for building universal-blue images.
    '';
  };
  file = ./ublueImages.nix;
}
