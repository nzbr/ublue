import { GenericLayer } from "../../lib";

export class KWinEffectsBetterBlurDxLayer extends GenericLayer {
    name = "kwin-effects-better-blur-dx";

    installScript = `
        dnf copr enable -y infinality/kwin-effects-better-blur-dx
        dnf install -y --from-repo=copr:copr.fedorainfracloud.org:infinality:kwin-effects-better-blur-dx \\
            kwin-effects-better-blur-dx \\
            kwin-effects-better-blur-dx-x11
    `;
}
