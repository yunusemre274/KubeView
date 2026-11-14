# Local descriptor reference only; not a claim of registry publication.
# Wrapper must guard parent descriptor/config/layers before build.
FROM kubeview-private/cilium@sha256:107f572571a14f7c7cb37b44dc9887b79b11925f1102f0d48db7d7f39335587a
COPY packages /tmp/kubeview-os-medium
RUN set -eu && \
    export DEBIAN_FRONTEND=noninteractive && \
    cd /tmp/kubeview-os-medium && \
    sha256sum -c SHA256SUMS && \
    plan="$(apt-get --simulate --no-download --no-install-recommends --only-upgrade --no-remove install /tmp/kubeview-os-medium/libpcre2-8-0_10.46-1ubuntu0.1_arm64.deb /tmp/kubeview-os-medium/zlib1g_1.3.dfsg+really1.3.1-1ubuntu3.2_arm64.deb)" && \
    printf '%s\n' "$plan" && \
    printf '%s\n' "$plan" | while IFS=' ' read -r action package rest; do if [ "$action" = Inst ]; then case "${package%%:*}" in libpcre2-8-0|zlib1g) ;; *) printf 'Unexpected package change: %s\n' "$package" >&2; exit 81 ;; esac; elif [ "$action" = Remv ]; then exit 82; fi; done && \
    apt-get -y --no-download --no-install-recommends --only-upgrade --no-remove install /tmp/kubeview-os-medium/libpcre2-8-0_10.46-1ubuntu0.1_arm64.deb /tmp/kubeview-os-medium/zlib1g_1.3.dfsg+really1.3.1-1ubuntu3.2_arm64.deb && \
    test "$(dpkg-query -W -f='${Version}' libpcre2-8-0)" = '10.46-1ubuntu0.1' && \
    test "$(dpkg-query -W -f='${Version}' zlib1g)" = '1:1.3.dfsg+really1.3.1-1ubuntu3.2' && \
    cd / && \
    rm -rf /tmp/kubeview-os-medium /var/lib/apt/lists/* /var/cache/apt/archives/*.deb
