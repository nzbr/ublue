# FROM ghcr.io/ublue-os/fedora-toolbox:latest AS build

FROM ghcr.io/ublue-os/bluefin-dx:latest

RUN mkdir -p /var/lib/alternatives && ostree container commit
## NOTES:
# - /var/lib/alternatives is required to prevent failure with some RPM installs
# - All RUN commands must end with ostree container commit
#   see: https://coreos.github.io/rpm-ostree/container/#using-ostree-container-commit

RUN mkdir /scripts /build && ostree container commit

COPY scripts/razer-nari-pulseaudio-profile /scripts/razer-nari-pulseaudio-profile
RUN mkdir -p /build/razer-nari-pulseaudio-profile && cd /build/razer-nari-pulseaudio-profile && /scripts/razer-nari-pulseaudio-profile/install.sh && ostree container commit

COPY scripts/1password /scripts/1password
RUN mkdir -p /build/1password && cd /build/1password && /scripts/1password/install.sh && ostree container commit

COPY scripts/tweak-rpm-ostree /scripts/tweak-rpm-ostree
RUN mkdir -p /build/tweak-rpm-ostree && cd /build/tweak-rpm-ostree && /scripts/tweak-rpm-ostree/install.sh && ostree container commit

COPY scripts/nix-mountpoint /scripts/nix-mountpoint
RUN mkdir -p /build/nix-mountpoint && cd /build/nix-mountpoint && /scripts/nix-mountpoint/install.sh && ostree container commit

RUN rm -rf /scripts /build && ostree container commit
