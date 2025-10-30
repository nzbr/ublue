import { GenericLayer } from "../lib";

export class KdeRoundedCornersLayer extends GenericLayer {
    name = "kde-rounded-corners";

    installScript = `
        dnf copr enable -y matinlotfali/KDE-Rounded-Corners
        rpm-ostree install kwin-effect-roundcorners
    `;
}
