import { GenericLayer } from "../../lib";

export class KWinEffectsBetterBlurDxLayer extends GenericLayer {
    name = "kwin-effects-better-blur-dx";

    installScript = `
        dnf copr enable -y infinality/kwin-effects-better-blur-dx
        dnf install -y --setopt='copr:copr.fedorainfracloud.org:infinality:kwin-effects-better-blur-dx.priority=1' \\
            kwin-effects-better-blur-dx \\
            kwin-effects-better-blur-dx-x11
    `;
}
