import { Container } from "@dagger.io/dagger";
import { Layer } from "../lib";

const uupdConfigPath = "/etc/uupd/config.json";

export class NoFlatpakAutoUpdateLayer implements Layer {
    name = "no-flatpak-auto-update";

    async install(
        buildContainer: Container,
        targetContainer: Container,
    ): Promise<Container> {
        const uupdConfig: any = JSON.parse(await targetContainer.file(uupdConfigPath).contents());

        uupdConfig.modules ??= {};
        uupdConfig.modules.flatpak ??= {};
        uupdConfig.modules.flatpak.disable = true;

        return targetContainer
            .withoutFile("/etc/systemd/system/timers.target.wants/flatpak-system-update.timer")
            .withNewFile(uupdConfigPath, JSON.stringify(uupdConfig, null, 2));
    }
}
