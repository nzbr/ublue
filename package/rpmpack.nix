{ inputs
, buildGoModule
, nukeReferences
}:
buildGoModule {
  name = "tar2rpm";

  src = inputs.rpmpack;

  vendorHash = "sha256-BHw7AsbD1mF8RlKxbp7+fRJsuQ0gbKuNh82o04hg/nY=";

  preFixup = ''
    for exe in $out/bin/*; do
      ${nukeReferences}/bin/nuke-refs $exe
    done
  '';

  env.CGO_ENABLED = 0;
}
