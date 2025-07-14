{ inputs, lib, ... }:
let
  inherit (lib)
    secretPath
    ;

  kernelVersion = "$(rpm -q kernel | sed 's/^kernel-//')";
in
{
  name = "Motorcomm YT6801 NIC driver";

  secrets = [
    ../secrets/mok.key.age
    ../secrets/mok.pub
  ];

  build = ''
    rpm-ostree install dkms

    # Set up the MOK
    mkdir -p /var/lib/dkms
    ln -s ${secretPath ../secrets/mok.pub} /var/lib/dkms/mok.pub
    ln -s ${secretPath ../secrets/mok.key.age} /var/lib/dkms/mok.key

    MODULE_NAME=$(grep -Pom1 '.*(?= \(.*\) .*; urgency=.*)' ${inputs.yt6801}/debian/changelog)
    MODULE_VERSION=$(grep -Pom1 '.* \(\K.*(?=\) .*; urgency=.*)' ${inputs.yt6801}/debian/changelog)
    KERNEL_VERSION=${kernelVersion}
    DKMS_DIR="/usr/src/''${MODULE_NAME}-''${MODULE_VERSION}"

    cp -vr "${inputs.yt6801}/src/." "$DKMS_DIR"
    sed "s/#MODULE_VERSION#/''${MODULE_VERSION}/" "${inputs.yt6801}/debian/tuxedo-yt6801.dkms" > "$DKMS_DIR/dkms.conf"

    dkms add -m "$MODULE_NAME" -v "$MODULE_VERSION"
    dkms build -m "$MODULE_NAME" -v "$MODULE_VERSION" -k "$KERNEL_VERSION"
    dkms install -m "$MODULE_NAME" -v "$MODULE_VERSION" -k "$KERNEL_VERSION"

    # # Copy the signed module and the MOK to the build directory
    cp $(find /lib/modules -type f -name 'yt6801.ko.xz' -print) yt6801.ko.xz
    cp ${secretPath ../secrets/mok.pub} mok.pub;
  '';

  install = ''
    # Install the module
    install -Dm644 ./yt6801.ko.xz /lib/modules/${kernelVersion}/extra/yt6801.ko.xz

    # Install MOK
    install -Dm644 ./mok.pub /usr/lib/dkms/mok.pub

    # Write service for setting up the MOK
    cat <<EOF >/usr/lib/dkms/setup-mok.sh
    #!/usr/bin/env bash
    set -ex
    echo -e "universalblue\nuniversalblue" | mokutil --import /usr/lib/dkms/mok.pub
    mkdir -p /var/lib/dkms
    touch /var/lib/dkms/mok-setup-done
    EOF
    chmod +x /usr/lib/dkms/setup-mok.sh

    cat <<EOF >/usr/lib/systemd/system/mok-setup.service
    [Unit]
    Description=Set up MOK
    ConditionPathExists=/usr/lib/dkms/mok.pub
    ConditionPathExists=!/var/lib/dkms/mok-setup-done

    [Service]
    Type=oneshot
    ExecStart=/usr/lib/dkms/setup-mok.sh

    [Install]
    WantedBy=multi-user.target
    EOF

    # Load the yt6801 module on boot
    cat <<EOF >/usr/lib/modules-load.d/yt6801.conf
    yt6801
    EOF

    systemctl enable mok-setup.service
  '';
}
