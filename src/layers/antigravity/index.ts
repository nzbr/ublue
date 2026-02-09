import { GenericLayer } from "../../lib";
import * as fs from "fs";
import * as path from "path";

export class AntigravityLayer extends GenericLayer {
    name = "antigravity";

    extraFiles = {
        "antigravity.repo": fs.readFileSync(path.resolve(import.meta.dirname, "antigravity.repo"), "utf-8"),
    }

    installScript = `
        cp ./antigravity.repo /etc/yum.repos.d/antigravity.repo

        dnf install -y antigravity
    `;
}
