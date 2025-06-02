# code: language=nix
{
  imageConfig ? { },
  lib,
  jq,
  pkgsStatic,
  runCommand,
  stdenvNoCC,
  writeText,
  ...
}:
let
  inherit (builtins)
    sort
    storeDir
    substring
    ;

  inherit (lib)
    concatStringsSep
    filter
    flatten
    hasSuffix
    length
    map
    optional
    readFile
    removePrefix
    secretPath
    splitString
    strings
    toBase64
    ;

  pathLayerName = path: "nix-store-${strings.toLower (removePrefix "${storeDir}/" path)}";

  processedLayers = map (
    layer:
    let
      name =
        if layer.name or "" == "" && layer.build or "" != "" then
          throw "Layer name is required when a build script is provided"
        else if layer.name or "" == "" then
          "anonymous"
        else
          (strings.toLower (strings.sanitizeDerivationName layer.name));

      buildDir = "/run/build/${name}";

      buildScript = writeText "build-${name}.sh" layer.build;

      rage = runCommand "rage" { } "cp ${pkgsStatic.rage}/bin/rage $out";
      setupSecrets = writeText "setup-secrets-${name}.sh" ''
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

      closurePaths =
        if layer.build or "" == "" then
          [ ]
        else
          let
            closureInfo = stdenvNoCC.mkDerivation {
              name = "${name}-nix-closure";

              __structuredAttrs = true;
              exportReferencesGraph.closure = flatten [
                (optional hasSecrets setupSecrets)
                buildScript
              ];

              buildCommand = ''
                ${jq}/bin/jq -r '.closure.[].path' $NIX_ATTRS_JSON_FILE > $out
              '';
            };
          in
          filter (line: line != "") (sort (a: b: a < b) (splitString "\n" (readFile closureInfo)));
    in
    {
      closure = closurePaths;

      build =
        if layer.build or "" == "" then
          ""
        else if layer.name or "" == "" then
          throw "Layer name is required when a build script is provided"
        else
          ''
            FROM ${imageConfig.from} AS ${name}
            RUN mkdir -p ${buildDir}
            ${concatStringsSep "\n" (
              map (path: "COPY --from=${pathLayerName path} ${path} ${path}") closurePaths
            )}
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
          '';

      install =
        if layer.install or "" == "" then
          ""
        else if builtins.hasContext layer.install then
          throw "Layer install scripts may not reference nix store paths"
        else
          ''
            ${if layer.build or "" != "" then "COPY --from=${name} ${buildDir} ${buildDir}" else ""}
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
          '';
    }
  ) imageConfig.layers;

  mergedClosure = sort (a: b: a < b) (flatten (map (layer: layer.closure) processedLayers));

  closureLayers = map (
    path:
    let
      serializedPath = stdenvNoCC.mkDerivation {
        name = "${substring 33 (-1) (removePrefix "${storeDir}/" path)}.tar.xz.b64";

        buildCommand = ''
          tar -vc ${path} | xz -v -T0 -e9 | base64 -w 65000 > $out
          sed -i -E 's|^(.*)$|RUN echo \1 >> /${pathLayerName path}.tar.xz.b64|' $out
        '';
      };
    in
    ''
      FROM ${imageConfig.from} AS ${pathLayerName path}
      ${readFile serializedPath}
      RUN base64 -d /${pathLayerName path}.tar.xz.b64 | xz -d -T0 | tar -xv && rm /${pathLayerName path}.tar.xz.b64
    ''
  ) mergedClosure;
in

writeText "${imageConfig.name}.Containerfile" ''
  ${concatStringsSep "\n" closureLayers}

  ${concatStringsSep "\n" (map (layer: layer.build) processedLayers)}

  FROM ${imageConfig.from}

  ${concatStringsSep "\n" (map (layer: layer.install) processedLayers)}

  CMD ["/bin/sh", "-c", "mkdir /var/roothome && exec /usr/bin/bash --login"]
''
