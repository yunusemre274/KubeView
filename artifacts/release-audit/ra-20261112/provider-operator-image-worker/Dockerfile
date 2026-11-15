# Private local derivation; no publication or installation.
# Official multi-platform reference resolves locally to Linux/arm64 manifest
# sha256:f72cbe831147c52dd5fd3c8ec06fe3e913dfe32490113b9462480ccc21a02cdb.
FROM quay.io/cilium/operator-generic@sha256:7a7a3489dc66ad67e420d285c8a8d2e169b0957ad15e120f593d27081bf38d82
# Preserve official CA bundle, gops, license file, environment and config.
# This leaves the original binary in the lower layer; it increases storage.
COPY cilium-operator-generic /usr/bin/cilium-operator-generic
