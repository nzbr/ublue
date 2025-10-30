import * as fs from "fs";
import * as path from "path";
import { GenericLayer } from "../../lib";

export class CiderLayer extends GenericLayer {
    name = "cider";

    extraFiles = {
        "cidercollective.repo": fs.readFileSync(path.resolve(import.meta.dirname, "cidercollective.repo"), "utf-8"),
        "cidercollective.asc": fs.readFileSync(path.resolve(import.meta.dirname, "cidercollective.asc"), "utf-8"),
    }

    buildScript = null;
    
    installScript = `
        cp "./cidercollective.repo" /etc/yum.repos.d/cidercollective.repo
        cp "./cidercollective.asc" /etc/pki/rpm-gpg/RPM-GPG-KEY-cidercollective
        rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-cidercollective

        rpm-ostree install Cider
    `;
}