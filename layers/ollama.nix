{ lib
, hostPlatform
, writeText
, withRocm ? false
, ... 
}:
let
  inherit (lib)
    concatStringsSep
    last
    length
    optionalString
    removePrefix
    replaceString
    splitString
    ;

  baseUrl = "https://github.com/ollama/ollama/releases/download/v0.11.10";

  mkRPM = file: deps:
  let
    name = replaceString "-linux-amd64" "" file;
    version = removePrefix "v" (last (splitString "/" baseUrl));
    specfile = writeText "${name}.spec" ''
      AutoReqProv: no

      Name: ${name}
      Version: ${version}
      Release: 1%{?dist}
      BuildArch: x86_64
      Summary: ${name}
      License: MIT
      ${optionalString (length deps > 0) "Requires: ${concatStringsSep ", " deps}"}

      %description
      ${name}
  
      %install
      export QA_RPATHS=0x0030
      rm -rf $RPM_BUILD_ROOT
      mkdir -p $RPM_BUILD_ROOT/usr
      tar -I pigz -C $RPM_BUILD_ROOT/usr -xvf %{_sourcedir}/${file}.tgz

      %clean
      rm -rf $RPM_BUILD_ROOT

      %files
    '';
  in
  ''
    mkdir -p rpmbuild/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}
    wget ${baseUrl}/${file}.tgz -O rpmbuild/SOURCES/${file}.tgz
    cp ${specfile} rpmbuild/SPECS/${name}.spec
    tar -I pigz -tf rpmbuild/SOURCES/${file}.tgz | sed -E 's|^\.?/?|/usr/|;/\/$/d' >> rpmbuild/SPECS/${name}.spec
    cat rpmbuild/SPECS/${name}.spec
    rpmbuild --define "_topdir $PWD/rpmbuild" -bb rpmbuild/SPECS/${name}.spec
    mv rpmbuild/RPMS/x86_64/*.rpm $PWD/${file}.rpm
    rm -rf rpmbuild
  '';
in
{
  name = "Ollama";

  build = ''
    rpm-ostree install rpmdevtools

    ${mkRPM "ollama-linux-amd64" []}
    ${optionalString withRocm (mkRPM "ollama-linux-amd64-rocm" ["rocm" "ollama"])}
  '';

  install = ''
    rpm-ostree install $PWD/ollama-linux-amd64.rpm ${optionalString withRocm "$PWD/ollama-linux-amd64-rocm.rpm"}
  '';
}