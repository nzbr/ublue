{ buildGoModule
, fetchFromGitHub
, nukeReferences
}:
buildGoModule {
  name = "tar2rpm";

  src = fetchFromGitHub {
    owner = "google";
    repo = "rpmpack";
    rev = "v0.7.1";
    sha256 = "sha256-JN9U6tF6of37JKDB2qrpNTVB1p2UWWeCXpuFFF7QAp4=";
  };

  vendorHash = "sha256-BHw7AsbD1mF8RlKxbp7+fRJsuQ0gbKuNh82o04hg/nY=";

  preFixup = ''
    for exe in $out/bin/*; do
      ${nukeReferences}/bin/nuke-refs $exe
    done
  '';

  env.CGO_ENABLED = 0;
}
