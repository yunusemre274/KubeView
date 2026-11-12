# Private local APT-only derivation; official runtime configuration inherited.
FROM quay.io/cilium/cilium@sha256:20fe92e4c86641233a450098c158d2d29085f3419931ab6bf681d2485dedf16e
RUN set -eu && \
    export DEBIAN_FRONTEND=noninteractive && \
    printf '%s\n' 'deb [arch=arm64 signed-by=/usr/share/keyrings/ubuntu-archive-keyring.gpg] https://ports.ubuntu.com/ubuntu-ports resolute-security main' > /tmp/kubeview-apt-security.list && \
    apt_safe() { apt-get -o Dir::Etc::sourcelist=/tmp/kubeview-apt-security.list -o Dir::Etc::sourceparts=- -o Acquire::Languages=none -o Acquire::Retries=0 -o Acquire::https::Timeout=15 -o Acquire::By-Hash=true -o Acquire::AllowInsecureRepositories=false -o Acquire::AllowDowngradeToInsecureRepositories=false "$@"; }; \
    apt_safe update && \
    plan="$(apt_safe --simulate --no-install-recommends --only-upgrade --no-remove install apt=3.2.1ubuntu0.1 libapt-pkg7.0=3.2.1ubuntu0.1)" && \
    printf '%s\n' "$plan" && \
    printf '%s\n' "$plan" | while IFS=' ' read -r action package rest; do if [ "$action" = Inst ]; then case "$package" in apt|libapt-pkg7.0) ;; *) printf 'Unexpected package change: %s\n' "$package" >&2; exit 81 ;; esac; elif [ "$action" = Remv ]; then exit 82; fi; done && \
    apt_safe -y --no-install-recommends --only-upgrade --no-remove install apt=3.2.1ubuntu0.1 libapt-pkg7.0=3.2.1ubuntu0.1 && \
    dpkg-query -W -f='${Package}\t${Version}\n' apt libapt-pkg7.0 && \
    dpkg --compare-versions "$(dpkg-query -W -f='${Version}' apt)" ge 3.2.1ubuntu0.1 && \
    dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libapt-pkg7.0)" ge 3.2.1ubuntu0.1 && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*.deb /tmp/kubeview-apt-security.list
