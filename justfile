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
    sudo rm -rf vm/quick/{{host}}/rootfs
    # Keep the temporary image archive in tmpfs to avoid a large write to disk
    archive_dir=$(mktemp -d /dev/shm/ublue-oci.XXXXXX)
    archive="$archive_dir/{{host}}.oci.tar"
    cleanup() { rm -rf "$archive_dir"; }
    trap cleanup EXIT
    dagger call {{host}} \
        $(if [ "{{host}}" = nebula ]; then echo --mok=file://./secrets/mok.key; fi) \
        export --path="$archive"
    # bib and podman read from root's storage, so the image has to land there
    skopeo_bin=$(readlink -f "$(command -v skopeo)")
    policy="$(dirname "$(dirname "$skopeo_bin")")/etc/containers/default-policy.json"
    sudo "$skopeo_bin" --policy "$policy" copy "oci-archive:$archive" containers-storage:localhost/ublue-{{host}}:latest
    cleanup
    trap - EXIT

# Build a bootable disk image: real partitions, bootloader and ostree deployment
vm-disk host type="qcow2" rootfs="ext4": (oci-load host)
    #!/usr/bin/env bash
    set -ex
    # bib holds three copies of the image at once (storage + osbuild's raw + the output),
    # so expect to need roughly 3x the image size free.
    mkdir -p vm/output
    podman_home=$(mktemp -d /dev/shm/ublue-podman.XXXXXX)
    trap 'rm -rf "$podman_home"' EXIT
    mkdir -p "$podman_home/.config/containers"
    cp "$(dirname "$(dirname "$(readlink -f "$(command -v skopeo)")")")/etc/containers/default-policy.json" \
        "$podman_home/.config/containers/policy.json"
    sudo env HOME="$podman_home" podman run --rm -it --privileged --pull=newer --net=host \
        --security-opt label=type:unconfined_t \
        -v "$PWD/vm/config.toml:/config.toml:ro" \
        -v "$PWD/vm/output:/output" \
        -v /var/lib/containers/storage:/var/lib/containers/storage \
        quay.io/centos-bootc/bootc-image-builder:latest \
        --type {{type}} --rootfs {{rootfs}} \
        localhost/ublue-{{host}}:latest
    sudo chown -R "$(id -u):$(id -g)" vm/output

# Boot a disk image from `just disk`. secureboot=yes boots it on Secure Boot firmware.
[arg("port_forwards", long="port-forwards")]
vm-run host type="qcow2" secureboot="no" port_forwards="tcp:127.0.0.1:2222-:22":
    #!/usr/bin/env -S nix develop -c bash
    set -ex
    disk=vm/output/{{type}}/disk.{{type}}
    run=vm/run/{{host}}
    if [ ! -f "$disk" ]; then
        echo "no $disk -- build it first with: just vm-disk {{host}} {{type}}" >&2
        exit 1
    fi
    mkdir -p "$run"
    sudo chown -R "$(id -u):$(id -g)" "$run"

    firmware=$(vm-ovmf "{{secureboot}}")
    vars="$run/vars-$(basename "$(dirname "$firmware")").fd"
    if [ "{{secureboot}}" = yes ]; then
        # Secure Boot needs SMM, or the variable store is not actually protected
        machine=(-machine q35,smm=on -global driver=cfi.pflash01,property=secure,value=on -global ICH9-LPC.disable_s3=1)
    else
        machine=(-machine q35,smm=off)
    fi
    # the variable store is per-VM and must be writable, so keep a copy alongside the run
    [ -f "$vars" ] || cp "$firmware/OVMF_VARS.fd" "$vars"
    chmod u+rw "$vars"

    if [ -n "${WAYLAND_DISPLAY:-}${DISPLAY:-}" ]; then
        gfx=(-display gtk)
    else
        gfx=(-display none -vnc 127.0.0.1:1)
    fi

    port_forwards={{quote(port_forwards)}}
    netdev="user,id=n0"
    IFS=' ' read -r -a port_forward_args <<< "$port_forwards"
    for forward in "${port_forward_args[@]}"; do
        [ -n "$forward" ] || continue
        netdev+=",hostfwd=$forward"
    done

    qemu-system-x86_64 \
        -enable-kvm -cpu host -m 8G -smp 4 "${machine[@]}" \
        -drive if=pflash,format=raw,unit=0,readonly=on,file="$firmware/OVMF_CODE.fd" \
        -drive if=pflash,format=raw,unit=1,file="$vars" \
        -device virtio-vga "${gfx[@]}" \
        -netdev "$netdev" -device virtio-net-pci,netdev=n0 \
        -drive file="$disk",format={{type}},if=virtio,cache=writeback \
        -serial mon:stdio

# Boot an image's rootfs directly (minutes, not half an hour) while iterating on a layer
[arg("port_forwards", long="port-forwards")]
vm-quick host password="test" port_forwards="": (oci-load host)
    #!/usr/bin/env bash
    set -ex
    # Skips bootloader and ostree entirely, so it does NOT test the deployment:
    # inside, bootc sees no image and bootloader-update.service fails. Use `just disk`
    # + `just run` for that. Keep the extracted rootfs in tmpfs to avoid writing it to disk.
    work=vm/quick/{{host}}
    sudo rm -rf "$work"
    mkdir -p "$work"
    scratch=$(mktemp -d /dev/shm/ublue-vm-quick.XXXXXX)
    rootfs="$scratch/rootfs"
    cleanup() { sudo rm -rf "$scratch"; }
    trap cleanup EXIT
    sudo mkdir -p "$rootfs"

    # podman export (not `dagger call rootfs export`, which would flatten ownership
    # and setuid bits to the calling user and quietly produce a broken rootfs)
    cid=$(sudo podman create localhost/ublue-{{host}}:latest true)
    sudo podman export "$cid" | sudo tar -xv --xattrs --xattrs-include='*' -C "$rootfs"
    sudo podman rm "$cid"

    kdir=$(sudo find "$rootfs/usr/lib/modules" -maxdepth 1 -mindepth 1 -type d | head -1)
    sudo cp "$kdir/vmlinuz" "$kdir/initramfs.img" "$work/"
    sudo chown "$(id -u):$(id -g)" "$work/vmlinuz" "$work/initramfs.img"

    # the images ship no user accounts, so add a desktop user and set both passwords
    sudo useradd --root "$rootfs" --create-home --user-group --groups wheel test
    hash=$(openssl passwd -6 "{{password}}")
    sudo sed -i "s#^root:[^:]*:#root:$hash:#" "$rootfs/etc/shadow"
    sudo sed -i "s#^test:[^:]*:#test:$hash:#" "$rootfs/etc/shadow"

    # Apply the desktop mode after Plasma takes over from the kernel framebuffer
    sudo mkdir -p "$rootfs/etc/xdg/autostart"
    sudo tee "$rootfs/etc/xdg/autostart/vm-resolution.desktop" >/dev/null <<'EOF'
    [Desktop Entry]
    Type=Application
    Name=VM display resolution
    OnlyShowIn=KDE;
    TryExec=kscreen-doctor
    Exec=kscreen-doctor output.Virtual-1.mode.1920x1080@60
    EOF

    # mke2fs -d populates the filesystem in userspace: no loop device, no mount, no partitions
    size=$(( $(sudo du -sm --apparent-size "$rootfs" | cut -f1) + 4096 ))
    truncate -s "${size}M" "$work/root.ext4"
    sudo mke2fs -q -t ext4 -L root -d "$rootfs" -F "$work/root.ext4"
    cleanup
    trap - EXIT

    # boot the kernel out of the image itself; log in as root on this terminal
    port_forwards={{quote(port_forwards)}}
    netdev="user,id=n0"
    IFS=' ' read -r -a port_forward_args <<< "$port_forwards"
    for forward in "${port_forward_args[@]}"; do
        [ -n "$forward" ] || continue
        netdev+=",hostfwd=$forward"
    done

    qemu-system-x86_64 \
        -enable-kvm -cpu host -m 8G -smp 4 -machine q35 -no-reboot \
        -display gtk -device virtio-vga,edid=on,xres=1920,yres=1080 \
        -kernel "$work/vmlinuz" -initrd "$work/initramfs.img" \
        -append "root=/dev/vda rw rootfstype=ext4 console=ttyS0,115200 video=Virtual-1:1920x1080@60e selinux=0 enforcing=0" \
        -drive file="$work/root.ext4",format=raw,if=virtio,cache=unsafe \
        -netdev "$netdev" -device virtio-net-pci,netdev=n0 \
        -serial mon:stdio

# Remove disk images and VM scratch (keeps vm/config.toml)
clean-vm:
    #!/usr/bin/env bash
    set -ex
    sudo rm -rf vm/output vm/run vm/quick vm/*.oci.tar
