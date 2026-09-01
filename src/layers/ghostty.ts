import { GenericLayer } from "../lib";

export class GhosttyLayer extends GenericLayer {
    name = "ghostty";

    installScript = `
        dnf install -y \\
            ghostty-tip \\
            ghostty-tip-bash-completion \\
            ghostty-tip-zsh-completion
    `;
}
