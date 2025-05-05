nebula-nix:
    if command -v nom >/dev/null; then nom build .#ublueImages.x86_64-linux.nebula; else nix build -vL .#ublueImages.x86_64-linux.nebula; fi && buildah build --layers -t local:test --file `readlink result` .
