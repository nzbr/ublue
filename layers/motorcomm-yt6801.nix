{ inputs, lib, ... }:
let
  inherit (lib)
    secretPath
    ;
in
{
  name = "Motorcomm YT6801 NIC driver";

  secrets = [
    ../secrets/mok.key.age
    ../secrets/mok.pub
  ];

  build = ''
    rpm-ostree install rpm-build

    cp -vr ${inputs.yt6801}/. .

    mkdir build
    export HOME="$PWD/build"
    make package-rpm

    if [ "$(find build/rpmbuild/RPMS -type f -print | wc -l)" -ne 1 ]; then
      echo "There should be exactly one RPM in the build directory!"
      ls -la build
      exit 1
    fi

    # Set up the MOK
    mkdir -p /var/lib/dkms
    ln -s ${secretPath ../secrets/mok.pub} /var/lib/dkms/mok.pub
    ln -s ${secretPath ../secrets/mok.key.age} /var/lib/dkms/mok.key

    # This builds the module with DKMS
    rpm-ostree install "$(find build/rpmbuild/RPMS -type f -print)"

    # Copy the signed module and the MOK to the build directory
    cp $(find /lib/modules -type f -name 'yt6801.ko.xz' -print) build/yt6801.ko.xz
    cp ${secretPath ../secrets/mok.pub} build/mok.pub;
  '';

  install = ''
    # Install the module
    install -Dm644 build/yt6801.ko.xz /lib/modules/$(ls /lib/modules/)/extra/yt6801.ko.xz

    # Install MOK
    install -Dm644 build/mok.pub /usr/lib/dkms/mok.pub

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
    ConditionPathExists=/var/lib/dkms/mok.pub
    ConditionPathExists=!/var/lib/dkms/mok-setup-done

    [Service]
    Type=oneshot
    ExecStart=/usr/lib/dkms/setup-mok.sh

    [Install]
    WantedBy=multi-user.target
    EOF

    systemctl enable mok-setup.service
  '';
}
