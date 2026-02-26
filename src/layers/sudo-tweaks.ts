import { GenericLayer } from "../lib";

export class SudoTweaksLayer extends GenericLayer {
    name = "sudo-tweaks";

    extraFiles = {
        "pwfeedback": `
            Defaults pwfeedback
        `,
    };

    installScript = `
        set -euxo pipefail

        mv pwfeedback /etc/sudoers.d/pwfeedback
        chmod 0440 /etc/sudoers.d/pwfeedback
    `;
}
