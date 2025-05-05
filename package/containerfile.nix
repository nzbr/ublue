{
  imageConfig ? {}
, lib
, writeText
, stdenvNoCC
, pkgs
, ...
}:
let
  inherit (lib)
    concatStringsSep
    map
    toBase64
    readFile
    strings
    ;

  getSafeName = layer:
    if layer.name or "" == ""
    then "anonymous"
    else strings.sanitizeDerivationName layer.name;

  getBuildDir = layer:
    "/tmp/build/${getSafeName layer}";

  buildCommands = map (
    layer:
      if layer.build or "" == ""
      then ""
      else
        if layer.name or "" == ""
        then throw "Layer name is required when a build script is provided"
        else
          let
            buildDir = getBuildDir layer;

            buildScript = pkgs.writeText "build-${layer.name}.sh" layer.build;

            closureArchive = stdenvNoCC.mkDerivation {
              name = "${layer.name}-nix-closure.tar.xz";

              __structuredAttrs = true;
              exportReferencesGraph.closure = [ buildScript ];

              nativeBuildInputs = [
                pkgs.gnutar
                pkgs.jq
              ];

              buildCommand = ''
                jq -r '.closure.[].path' < $NIX_ATTRS_JSON_FILE | xargs tar -vc | xz -T0 -9e > $out
              '';
            };

            serializedClosure = stdenvNoCC.mkDerivation {
              name = "${layer.name}-serialized-nix-closure";

              nativeBuildInputs = [
                pkgs.fend
                pkgs.glibc # getconf
              ];

              buildCommand = ''
                base64 -w 100000 ${closureArchive} > $out
                sed -i -E 's|^(.*)$|RUN echo \1 >> ${buildDir}/nix-closure.tar.xz.b64|' $out
              '';
            };

          in
            ''
              FROM ${imageConfig.from} AS ${getSafeName layer}
              RUN mkdir -p ${buildDir}
              ${readFile serializedClosure}
              RUN base64 -d ${buildDir}/nix-closure.tar.xz.b64 | xz -d -T0 | tar -xv && rm ${buildDir}/nix-closure.tar.xz.b64
              WORKDIR ${buildDir}
              RUN ${concatStringsSep " && " [
                "echo -e '\\n\\e[36m>>> Building ${layer.name} <<<\\e[0m'"
                "bash -ex ${buildScript}"
                "echo ''"
              ]}
            ''
  ) imageConfig.layers;

  installCommands = map (
    layer:
      if layer.install or "" == ""
      then ""
      else
        if builtins.hasContext layer.install
        then throw "Layer install scripts may not reference nix store paths"
        else
          let
            buildDir = getBuildDir layer;
          in
          ''
            ${
              if layer.build or "" != ""
                then "COPY --from=${getSafeName layer} ${buildDir} ${buildDir}"
                else ""
            }
            RUN ${concatStringsSep " && " [
              "mkdir -p ${buildDir}"
              "cd ${buildDir}"
              "echo -e '\\n\\e[32m>>> ${if layer.name or "" == "" then "Running a script" else "Installing ${layer.name}"} <<<\\e[0m'"
              "echo ${toBase64 layer.install} | base64 -d | bash -ex -"
              "rm -rf ${buildDir}"
              "echo ''"
              "ostree container commit"
              ]
            }
          ''
    ) imageConfig.layers;
in

writeText "${imageConfig.name}.Containerfile" ''
  ${concatStringsSep "\n" buildCommands}

  FROM ${imageConfig.from}

  ${concatStringsSep "\n" installCommands}
''
