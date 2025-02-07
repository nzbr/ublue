FROM ghcr.io/ublue-os/fedora-toolbox:latest AS build

# Run build scripts
RUN --mount=type=bind,source=./scripts,target=/scripts,z \
    mkdir -p /build && \
    /scripts/kwin-effects-forceblur/build.sh && \
    /scripts/kde-rounded-corners/build.sh


FROM ghcr.io/ublue-os/aurora-dx:stable

RUN mkdir -p /var/lib/alternatives && ostree container commit
## NOTES:
# - /var/lib/alternatives is required to prevent failure with some RPM installs
# - All RUN commands must end with ostree container commit
#   see: https://coreos.github.io/rpm-ostree/container/#using-ostree-container-commit

RUN --mount=type=bind,source=./scripts,target=/scripts,z \
    --mount=type=bind,from=build,source=/build,target=/build,z \
    /scripts/1password/install.sh && \
    ostree container commit

RUN --mount=type=bind,source=./scripts,target=/scripts,z \
    --mount=type=bind,from=build,source=/build,target=/build,z \
    /scripts/razer-nari-pulseaudio-profile/install.sh && \
    ostree container commit

RUN --mount=type=bind,source=./scripts,target=/scripts,z \
    --mount=type=bind,from=build,source=/build,target=/build,z \
    /scripts/kwin-effects-forceblur/install.sh && \
    ostree container commit

RUN --mount=type=bind,source=./scripts,target=/scripts,z \
    --mount=type=bind,from=build,source=/build,target=/build,z \
    /scripts/kde-rounded-corners/install.sh && \
    ostree container commit

RUN --mount=type=bind,source=./scripts,target=/scripts,z \
    --mount=type=bind,from=build,source=/build,target=/build,z \
    /scripts/tweak-rpm-ostree/install.sh && \
    ostree container commit
