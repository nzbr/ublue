import { GenericLayer } from "../lib";

export class NixMountpointLayer extends GenericLayer {
    name = "nix-mountpoint";

    installScript = `
        mkdir -p /nix
    `;
}
