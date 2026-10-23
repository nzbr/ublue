import { GenericLayer } from "../lib";

export class XrdpLayer extends GenericLayer {
    name = "xrdp";

    extraFiles = {
        "startwm-plasma.sh": `
            #!/bin/sh

            export XDG_SESSION_TYPE=x11
            export XDG_CURRENT_DESKTOP=KDE
            export DESKTOP_SESSION=plasma

            exec /usr/bin/startplasma-x11
        `,
    };

    installScript = `
      set -euxo pipefail

      if ! test -f /usr/share/wayland-sessions/plasma.desktop; then
        echo "ERROR: The xrdp layer currently only supports KDE, but this does not seem to be installed."
        exit 1
      fi

      dnf install -y \
        xrdp \
        xorgxrdp \
        xrdp-selinux \
        plasma-workspace-x11

      grep -q '^DefaultWindowManager=' /etc/xrdp/sesman.ini # Make sure the sed below keeps working
      sed -i \
          's|^DefaultWindowManager=.*|DefaultWindowManager=/usr/libexec/xrdp/startwm-plasma.sh|' \
          /etc/xrdp/sesman.ini

      systemctl enable xrdp
      systemctl enable xrdp-sesman
    `;
}
