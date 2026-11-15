# Private local APT-only derivation; official runtime configuration inherited.
FROM quay.io/cilium/cilium-envoy@sha256:547ab45f6092f681d9f54f3be9fa8fb1e705c9c5dc2df388efe3a52aa6965629
RUN set -eu && \
    export DEBIAN_FRONTEND=noninteractive && \
    printf '%s\n' 'deb [arch=arm64 signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] https://ports.ubuntu.com/ubuntu-ports noble-security main' > /tmp/kubeview-apt-security.list && \
    apt_safe() { apt-get -o Dir::Etc::sourcelist=/tmp/kubeview-apt-security.list -o Dir::Etc::sourceparts=- -o Acquire::Languages=none -o Acquire::Retries=0 -o Acquire::https::Timeout=15 -o Acquire::By-Hash=true -o Acquire::AllowInsecureRepositories=false -o Acquire::AllowDowngradeToInsecureRepositories=false "$@"; }; \
    apt_safe update && \
    plan="$(apt_safe --simulate --no-install-recommends --only-upgrade --no-remove install apt=2.8.4ubuntu0.1 libapt-pkg6.0t64=2.8.4ubuntu0.1)" && \
    printf '%s\n' "$plan" && \
    printf '%s\n' "$plan" | while IFS=' ' read -r action package rest; do if [ "$action" = Inst ]; then case "$package" in apt|libapt-pkg6.0t64) ;; *) printf 'Unexpected package change: %s\n' "$package" >&2; exit 81 ;; esac; elif [ "$action" = Remv ]; then exit 82; fi; done && \
    apt_safe -y --no-install-recommends --only-upgrade --no-remove install apt=2.8.4ubuntu0.1 libapt-pkg6.0t64=2.8.4ubuntu0.1 && \
    dpkg-query -W -f='${Package}\t${Version}\n' apt libapt-pkg6.0t64 && \
    dpkg --compare-versions "$(dpkg-query -W -f='${Version}' apt)" ge 2.8.4ubuntu0.1 && \
    dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libapt-pkg6.0t64)" ge 2.8.4ubuntu0.1 && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*.deb /tmp/kubeview-apt-security.list
