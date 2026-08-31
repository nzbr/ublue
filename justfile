[private]
default:
    just --choose

build-all:
    #!/usr/bin/env -S nix develop -c bash
    set -ex
    dagger call build --mok=file://./secrets/mok.key

build host:
    #!/usr/bin/env -S nix develop -c bash
    set -ex
    dagger call {{host}}

shell host:
    #!/usr/bin/env bash
    set -ex
    dagger -c '{{host}} | terminal'

# ==============
# = VM Tooling =
# ==============

# Put a built image into root containers-storage as localhost/ublue-<host>:latest
[private]
oci-load host:
    #!/usr/bin/env -S nix develop -c bash
    set -ex
    mkdir -p vm
    dagger call {{host}} \
        $(if [ "{{host}}" = nebula ]; then echo --mok=file://./secrets/mok.key; fi) \
        export --path=vm/{{host}}.oci.tar
    # bib and podman read from root's storage, so the image has to land there
    sudo skopeo copy oci-archive:vm/{{host}}.oci.tar containers-storage:localhost/ublue-{{host}}:latest
    rm -f vm/{{host}}.oci.tar

# Build a bootable disk image: real partitions, bootloader and ostree deployment
vm-disk host type="qcow2" rootfs="ext4": (oci-load host)
    #!/usr/bin/env bash
    set -ex
    # bib holds three copies of the image at once (storage + osbuild's raw + the output),
    # so expect to need roughly 3x the image size free.
    mkdir -p vm/output
    sudo podman run --rm -it --privileged --pull=newer --net=host \
        --security-opt label=type:unconfined_t \
        -v "$PWD/vm/config.toml:/config.toml:ro" \
        -v "$PWD/vm/output:/output" \
        -v /var/lib/containers/storage:/var/lib/containers/storage \
        quay.io/centos-bootc/bootc-image-builder:latest \
        --type {{type}} --rootfs {{rootfs}} \
        localhost/ublue-{{host}}:latest
    sudo chown -R "$(id -u):$(id -g)" vm/output

# Boot a disk image from `just disk`. secureboot=yes boots it on Secure Boot firmware.
vm-run host type="qcow2" secureboot="no":
    #!/usr/bin/env bash
    set -ex
    disk=vm/output/{{type}}/disk.{{type}}
    run=vm/run/{{host}}
    if [ ! -f "$disk" ]; then
        echo "no $disk -- build it first with: just disk {{host}} {{type}}" >&2
        exit 1
    fi
    mkdir -p "$run"

    pick() { ls "$@" 2>/dev/null | head -1; }
    if [ "{{secureboot}}" = yes ]; then
        code=$(pick /usr/share/OVMF/OVMF_CODE.secboot.fd /usr/share/edk2/ovmf/OVMF_CODE.secboot.fd /usr/share/OVMF/OVMF_CODE_4M.secboot.fd)
        vars=$(pick /usr/share/OVMF/OVMF_VARS.secboot.fd /usr/share/edk2/ovmf/OVMF_VARS.secboot.fd /usr/share/OVMF/OVMF_VARS_4M.ms.fd)
        # Secure Boot needs SMM, or the variable store is not actually protected
        machine=(-machine q35,smm=on -global driver=cfi.pflash01,property=secure,value=on -global ICH9-LPC.disable_s3=1)
    else
        code=$(pick /usr/share/OVMF/OVMF_CODE.fd /usr/share/edk2/ovmf/OVMF_CODE.fd /usr/share/OVMF/OVMF_CODE_4M.fd)
        vars=$(pick /usr/share/OVMF/OVMF_VARS.fd /usr/share/edk2/ovmf/OVMF_VARS.fd /usr/share/OVMF/OVMF_VARS_4M.fd)
        machine=(-machine q35)
    fi
    # the variable store is per-VM and must be writable, so keep a copy alongside the run
    [ -f "$run/vars.fd" ] || cp "$vars" "$run/vars.fd"

    if [ -n "${WAYLAND_DISPLAY:-}${DISPLAY:-}" ]; then
        gfx=(-display gtk)
    else
        gfx=(-display none -vnc 127.0.0.1:1)
    fi

    qemu-system-x86_64 \
        -enable-kvm -cpu host -m 8G -smp 4 "${machine[@]}" \
        -drive if=pflash,format=raw,unit=0,readonly=on,file="$code" \
        -drive if=pflash,format=raw,unit=1,file="$run/vars.fd" \
        -device virtio-vga "${gfx[@]}" \
        -netdev user,id=n0,hostfwd=tcp:127.0.0.1:2222-:22 -device virtio-net-pci,netdev=n0 \
        -drive file="$disk",format={{type}},if=virtio,cache=writeback \
        -serial mon:stdio

# Boot an image's rootfs directly (minutes, not half an hour) while iterating on a layer
vm-quick host password="test": (oci-load host)
    #!/usr/bin/env bash
    set -ex
    # Skips bootloader and ostree entirely, so it does NOT test the deployment:
    # inside, bootc sees no image and bootloader-update.service fails. Use `just disk`
    # + `just run` for that. Needs about twice the image size in free space while it runs.
    work=vm/quick/{{host}}
    sudo rm -rf "$work"
    sudo mkdir -p "$work/rootfs"

    # podman export (not `dagger call rootfs export`, which would flatten ownership
    # and setuid bits to the calling user and quietly produce a broken rootfs)
    cid=$(sudo podman create localhost/ublue-{{host}}:latest true)
    sudo podman export "$cid" | sudo tar -x --xattrs --xattrs-include='*' -C "$work/rootfs"
    sudo podman rm "$cid"

    kdir=$(sudo find "$work/rootfs/usr/lib/modules" -maxdepth 1 -mindepth 1 -type d | head -1)
    sudo cp "$kdir/vmlinuz" "$kdir/initramfs.img" "$work/"
    sudo chown "$(id -u):$(id -g)" "$work/vmlinuz" "$work/initramfs.img"

    # the images ship no user accounts, so give root a password to log in with
    hash=$(openssl passwd -6 "{{password}}")
    sudo sed -i "s#^root:[^:]*:#root:$hash:#" "$work/rootfs/etc/shadow"

    # mke2fs -d populates the filesystem in userspace: no loop device, no mount, no partitions
    size=$(( $(sudo du -sm --apparent-size "$work/rootfs" | cut -f1) + 1536 ))
    truncate -s "${size}M" "$work/root.ext4"
    sudo mke2fs -q -t ext4 -L root -d "$work/rootfs" -F "$work/root.ext4"
    sudo rm -rf "$work/rootfs"

    # boot the kernel out of the image itself; log in as root on this terminal
    qemu-system-x86_64 \
        -enable-kvm -cpu host -m 8G -smp 4 -machine q35 -no-reboot \
        -kernel "$work/vmlinuz" -initrd "$work/initramfs.img" \
        -append "root=/dev/vda rw rootfstype=ext4 console=ttyS0,115200 selinux=0 enforcing=0" \
        -drive file="$work/root.ext4",format=raw,if=virtio,cache=unsafe \
        -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
        -nographic

# Remove disk images and VM scratch (keeps vm/config.toml)
clean-vm:
    #!/usr/bin/env bash
    set -ex
    sudo rm -rf vm/output vm/run vm/quick vm/*.oci.tar
