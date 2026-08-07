import { GenericLayer, unindent } from "../lib";

export class EcryptfsLayer extends GenericLayer {
    name = "ecryptfs";

    extraFiles = {
        "00-ecryptfs.conf": unindent`
            g ecryptfs 400
        `,
    }

    installScript = `
        install -m644 00-ecryptfs.conf /usr/lib/sysusers.d/00-ecryptfs.conf

        dnf install -y ecryptfs-utils ecryptfs-utils-loginmount
        authselect enable-feature with-ecryptfs
        authselect enable-feature with-pamaccess
        authselect apply-changes

        # Prevent SELinux from blocking the ecryptfs unlock
        setsebool -P use_ecryptfs_home_dirs 1
    `;
}
