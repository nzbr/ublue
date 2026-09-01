import { GenericLayer } from "../../lib";

export class VicinaeLayer extends GenericLayer {
    name = "vicinae";

    extraFiles = {
        "70-vicinae-uinput.rules": `
            KERNEL=="uinput", SUBSYSTEM=="misc", TAG+="uaccess", OPTIONS+="static_node=uinput"
        `,
    };

    installScript = `
        # The terra layer needs to be included before this one
        dnf install -y vicinae

        install -m644 70-vicinae-uinput.rules /usr/lib/udev/rules.d/70-vicinae-uinput.rules

        mkdir -p /usr/lib/systemd/user/graphical-session.target.wants
        ln -sf ../vicinae.service /usr/lib/systemd/user/graphical-session.target.wants/vicinae.service
    `;
}
