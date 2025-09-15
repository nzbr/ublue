{ lib
, rpmpack
, hostPlatform
, withRocm ? false
, ... 
}:
let
  inherit (lib)
    last
    optionalString
    replaceString
    splitString
    removePrefix
    ;

  baseUrl = "https://github.com/ollama/ollama/releases/download/v0.11.10";

  mkRPM = file: extraOpts:
  ''
    wget ${baseUrl}/${file}.tgz -O ${file}.tgz
    mkdir -p unpack/usr
    tar -I pigz -C unpack/usr -xvf ${file}.tgz
    rm ${file}.tgz
    tar -cf ${file}.tar -C unpack .
    rm -rf unpack
    ${rpmpack}/bin/tar2rpm \
      -use_dir_allowlist \
      -name ${replaceString "-linux-amd64" "" file} \
      -version ${removePrefix "v" (last (splitString "/" baseUrl))} \
      -release tar2rpm \
      -arch x86_64 \
      -file ${file}.rpm \
      ${extraOpts} \
      ${file}.tar
    rm ${file}.tar
  '';
in
{
  name = "Ollama";

  build = ''
    ${mkRPM "ollama-linux-amd64" ""}
    ${optionalString withRocm (mkRPM "ollama-linux-amd64-rocm" "-requires rocm -requires ollama")}
  '';

  install = ''
    rpm-ostree install $PWD/ollama-linux-amd64.rpm ${optionalString withRocm "$PWD/ollama-linux-amd64-rocm.rpm"}
  '';
}