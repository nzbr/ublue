# code: language=nix
{
  imageConfig ? { },
  lib,
  writeText,
  stdenvNoCC,
  pkgs,
  ...
}:
let
  inherit (lib)
    concatStringsSep
    flatten
    hasSuffix
    length
    map
    optional
    readFile
    secretPath
    strings
    toBase64
    ;

  getSafeName =
    layer: if layer.name or "" == "" then "anonymous" else (strings.toLower (strings.sanitizeDerivationName layer.name));

  getBuildDir = layer: "/run/build/${getSafeName layer}";

  buildCommands = map (
    layer:
    if layer.build or "" == "" then
      ""
    else if layer.name or "" == "" then
      throw "Layer name is required when a build script is provided"
    else
      let
        buildDir = getBuildDir layer;

        buildScript = pkgs.writeText "build-${layer.name}.sh" layer.build;

        rage = pkgs.runCommand "rage" { } "cp ${pkgs.pkgsStatic.rage}/bin/rage $out";
        setupSecrets = pkgs.writeText "setup-secrets-${layer.name}.sh" ''
          mkdir -p /run/secrets
          ${concatStringsSep "\n" (
            map (
              secret:
              if hasSuffix ".age" secret then
                "${rage} -i $ageKey -d ${secret} -o ${secretPath secret}"
              else
                "cp ${secret} ${secretPath secret}"
            ) layer.secrets
          )}
        '';
        hasSecrets = length (layer.secrets or [ ]) > 0;

        closureArchive = stdenvNoCC.mkDerivation {
          name = "${layer.name}-nix-closure.tar.xz";

          __structuredAttrs = true;
          exportReferencesGraph.closure = flatten [
            (optional hasSecrets setupSecrets)
            buildScript
          ];

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

          buildCommand = ''
            base64 -w 65000 ${closureArchive} > $out
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
        ENV ageKey="/run/secrets/key"
        RUN ${if hasSecrets then "--mount=type=secret,id=key" else ""} ${
          concatStringsSep " && " (flatten [
            "export buildDir=${buildDir}"
            "echo -e '\\n\\e[36m>>> Building ${layer.name} <<<\\e[0m'"
            (optional hasSecrets "bash -ex ${setupSecrets}")
            "bash -ex ${buildScript}"
            (map (secret: "rm -f ${secretPath secret}") (layer.secrets or [ ]))
            "echo ''"
          ])
        }
      ''
  ) imageConfig.layers;

  installCommands = map (
    layer:
    if layer.install or "" == "" then
      ""
    else if builtins.hasContext layer.install then
      throw "Layer install scripts may not reference nix store paths"
    else
      let
        buildDir = getBuildDir layer;
      in
      ''
        ${
          if layer.build or "" != "" then "COPY --from=${getSafeName layer} ${buildDir} ${buildDir}" else ""
        }
        RUN ${
          concatStringsSep " && " [
            "export buildDir=${buildDir}"
            "mkdir -p ${buildDir}"
            "cd ${buildDir}"
            "echo -e '\\n\\e[32m>>> ${
              if layer.name or "" == "" then "Running a script" else "Installing ${layer.name}"
            } <<<\\e[0m'"
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

  CMD ["/bin/sh", "-c", "mkdir /var/roothome && exec /usr/bin/bash --login"]
''
