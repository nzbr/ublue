import { GenericLayer, sourceFileIn } from "../../lib";

const sourceFile = sourceFileIn(import.meta.dirname);

export class TerraLayer extends GenericLayer {
    name = "terra";

    extraFiles = {
        "terra.repo": sourceFile("terra.repo"),
        "terra.asc": sourceFile("terra.asc"),
    };

    installScript = `
        release=$(rpm -E %fedora)

        cp ./terra.repo /etc/yum.repos.d/terra.repo
        cp ./terra.asc /etc/pki/rpm-gpg/RPM-GPG-KEY-terra$release
        rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-terra$release
    `;
}
