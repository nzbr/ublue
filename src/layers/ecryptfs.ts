import { GenericLayer } from "../lib";

export class EcryptfsLayer extends GenericLayer {
    name = "ecryptfs";

    installScript = `
        set -euxo pipefail
        rpm-ostree install ecryptfs-utils ecryptfs-utils-loginmount
        authselect enable-feature with-ecryptfs
        authselect apply-changes
    `;
}
