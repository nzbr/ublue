import { GenericLayer } from "../lib";

export class PAMU2FLayer extends GenericLayer {
    name = "pam-u2f";

    installScript = `
        set -euxo pipefail
        authselect enable-feature with-pam-u2f
        authselect apply-changes
    `;
}
