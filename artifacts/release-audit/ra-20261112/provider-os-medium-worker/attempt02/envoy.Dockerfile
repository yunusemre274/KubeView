# Local descriptor reference only; not a claim of registry publication.
# Wrapper must guard parent descriptor/config/layers before build.
FROM kubeview-private/cilium-envoy@sha256:5872d9d1c44f90bbed712e6a0f07c1c876788aca67ceabeb782e97b9a6c75740
COPY packages /tmp/kubeview-os-medium
RUN set -eu && \
    export DEBIAN_FRONTEND=noninteractive && \
    cd /tmp/kubeview-os-medium && \
    sha256sum -c SHA256SUMS && \
    plan="$(apt-get --simulate --no-download --no-install-recommends --only-upgrade --no-remove install /tmp/kubeview-os-medium/libpcre2-8-0_10.42-4ubuntu2.2_arm64.deb)" && \
    printf '%s\n' "$plan" && \
    printf '%s\n' "$plan" | while IFS=' ' read -r action package rest; do if [ "$action" = Inst ]; then case "${package%%:*}" in libpcre2-8-0) ;; *) printf 'Unexpected package change: %s\n' "$package" >&2; exit 81 ;; esac; elif [ "$action" = Remv ]; then exit 82; fi; done && \
    apt-get -y --no-install-recommends --only-upgrade --no-remove install /tmp/kubeview-os-medium/libpcre2-8-0_10.42-4ubuntu2.2_arm64.deb && \
    test "$(dpkg-query -W -f='${Version}' libpcre2-8-0)" = '10.42-4ubuntu2.2' && \
    cd / && \
    rm -rf /tmp/kubeview-os-medium /var/lib/apt/lists/* /var/cache/apt/archives/*.deb
