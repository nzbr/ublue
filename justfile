[private]
default:
    just --choose

build host:
    #!/usr/bin/env -S nix develop -c bash
    set -ex
    dagger call {{host}}

shell host:
    #!/usr/bin/env bash
    set -ex
    dagger -c '{{host}} | terminal'
