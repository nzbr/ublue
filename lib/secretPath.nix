{ lib, ... }:
let
  inherit (lib)
    removeSuffix
    ;
in
{
  secretPath = file:
    "/run/secrets/${removeSuffix ".age" (builtins.baseNameOf file)}";
}
