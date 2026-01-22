import { GenericLayer } from "../lib";

export class EcryptfsLayer extends GenericLayer {
    name = "ecryptfs";

    installScript = `
        dnf install -y ecryptfs-utils ecryptfs-utils-loginmount
        authselect enable-feature with-ecryptfs
        authselect enable-feature with-pamaccess
        authselect apply-changes

        # Prevent SELinux from blocking the ecryptfs unlock
        setsebool -P use_ecryptfs_home_dirs 1
    `;
}
