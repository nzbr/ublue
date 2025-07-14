[private]
default:
    just --choose

[private]
build host:
    #!/usr/bin/env bash
    set -ex
    if command -v nom >/dev/null; then nom build .#ublueImages.x86_64-linux.{{host}}; else nix build -vL .#ublueImages.x86_64-linux.{{host}}; fi
    CTX=/tmp/ublue-build-context
    mkdir -p "$CTX"
    docker buildx build --debug -t ghcr.io/nzbr/ublue-{{host}}:latest --secret id=key,src=$HOME/.ssh/id_ed25519 --file `readlink result` "$CTX"

shell host:
    #!/usr/bin/env bash
    set -ex
    docker run --rm -it ghcr.io/nzbr/ublue-{{host}}:latest

aurora-dx: (build "aurora-dx")
bluefin-dx: (build "bluefin-dx")
nebula: aurora-dx (build "nebula")
