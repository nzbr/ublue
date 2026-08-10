import { GenericLayer, unindent } from "../lib";

export class NixLayer extends GenericLayer {
    name = "nix";

    extraFiles = {
        "nix-directory.service": unindent`
            [Unit]
            Description=Ensure /var/home/nix exists
            DefaultDependencies=no
            After=local-fs.target
            Before=nix.mount
            Conflicts=shutdown.target
            Before=shutdown.target

            [Service]
            Type=oneshot
            RemainAfterExit=yes
            ExecStart=/usr/bin/mkdir -p /var/home/nix

            [Install]
            RequiredBy=nix.mount
        `,
        "nix.conf.append": unindent`

            !include nix.custom.conf
        `,
        "nix.mount": unindent`
            [Unit]
            Description=Mount /var/home/nix on /nix
            PropagatesStopTo=nix-daemon.service
            PropagatesStopTo=nix-directory.service
            After=nix-directory.service
            Requires=nix-directory.service
            Before=nix-daemon.service
            Before=nix-daemon.socket
            Before=systemd-tmpfiles-setup.service
            ConditionPathIsDirectory=/nix
            DefaultDependencies=no

            [Mount]
            What=/var/home/nix
            Where=/nix
            Type=none
            DirectoryMode=0755
            Options=bind

            [Install]
            RequiredBy=nix-daemon.service
            RequiredBy=nix-daemon.socket
            RequiredBy=systemd-tmpfiles-setup.service
        `,
    };

    installScript = `
        dnf install -y \
            nix \
            nix-legacy

        cat nix.conf.append >>/etc/nix/nix.conf

        rm -rf /nix
        mkdir -p /nix
        install -m644 nix-directory.service /usr/lib/systemd/system/nix-directory.service
        install -m644 nix.mount /usr/lib/systemd/system/nix.mount
        systemctl enable nix-directory.service nix.mount nix-daemon.socket
    `;
}
