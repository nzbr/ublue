[private]
default:
    just --choose

[private]
build host:
    set -ex
    if command -v nom >/dev/null; then nom build .#ublueImages.x86_64-linux.{{host}}; else nix build -vL .#ublueImages.x86_64-linux.{{host}}; fi
    buildah build --layers -t ghcr.io/nzbr/ublue-{{host}}:latest --secret id=key,src=$HOME/.ssh/id_ed25519 --file `readlink result` .

[confirm]
clean-buildah:
    buildah prune -af

aurora-dx: (build "aurora-dx")
bluefin-dx: (build "bluefin-dx")
nebula: bluefin-dx (build "nebula")
