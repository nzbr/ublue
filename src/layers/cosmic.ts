import { Container, dag, Directory } from "@dagger.io/dagger";
import { fetchGit, GenericLayer, mkRPM } from "../lib";

export class CosmicLayer extends GenericLayer {
    name = "cosmic";

    src = fetchGit("https://github.com/pop-os/cosmic-epoch.git", "epoch-1.0.8", true);

    async build(buildContainer: Container): Promise<Directory> {
      const packages = [
        "rustc",
        "cargo",
        "wayland-devel",
        "libxkbcommon-devel",
        "systemd-devel",
        "dbus-devel",
        "pipewire-devel",
        "clang-devel",
        "libinput-devel",
        "libseat-devel",
        "libdisplay-info-devel",
        "pixman-devel",
        "mesa-libgbm-devel",
        "glib2-devel",
        "pam-devel",
        "gstreamer1-devel",
        "gstreamer1-plugin-libav",
        "gstreamer1-plugins-base-devel",
        "flatpak-devel",
      ];                                                                                                                                                                                                                                                                                       
      const content = buildContainer
        .withExec(["dnf", "install", "-y", ...packages])
	.withExec(["cargo", "install", "just"])
	.withMountedDirectory("/src", this.src)
	.withWorkdir("/src")
	.withExec(["mkdir", "/install"])
	.withExec(["/root/.cargo/bin/just", "install", "/install", "/usr"])
	.directory("/install");

      return dag.directory()
        .withFile(
	  "cosmic-epoch.rpm",
	  await mkRPM(buildContainer)({ name: "cosmic-epoch", version: this.src.ref }, content),
	);
    }

    installScript = `
        dnf install -y ./cosmic-epoch.rpm

        systemctl disable gdm.service sddm.service || true
        systemctl enable cosmic-greeter.service
    `;
}
