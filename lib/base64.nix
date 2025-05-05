{ lib, ... }:
import (builtins.fetchurl {
  url = "https://gist.githubusercontent.com/manveru/74eb41d850bc146b7e78c4cb059507e2/raw/6299aeb3a99d91070648a4297f46fa93140c8ea4/base64.nix";
  sha256 = "sha256:0pxlm06xf4da000w1pw69cbqk4ylyapyd5gv0la2ddiz2nsb3ysv";
}) { inherit lib; }
