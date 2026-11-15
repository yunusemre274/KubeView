const checks = [
  "configuration",
  "api",
  "discovery",
  "permissions",
  "metrics",
  "hubble",
];
export const CHECK_LABELS = {
  configuration: "Güvenilir sunucu yapılandırması",
  api: "Kubernetes API",
  discovery: "API discovery",
  permissions: "Kaynak okuma izinleri",
  metrics: "Metrics API · isteğe bağlı",
  hubble: "Hubble · isteğe bağlı",
};
export const CHECK_STATUS = {
  ok: "Erişilebilir",
  forbidden: "Forbidden · yetki yok",
  unavailable: "Kullanılamıyor",
  error: "Bağlantı hatası",
  checking: "Denetleniyor",
  configured: "Yapılandırılmış · henüz canlı ölçüm yok",
};
export const PERMISSION_LABELS = {
  pods: "Pod",
  deployments: "Deployment",
  nodes: "Node",
  namespaces: "Namespace",
};
export function connectionStatus(connection) {
  if (connection.mode === "demo") return "Demo — örnek veri";
  if (connection.authRequired) return "Oturum gerekli";
  if (!connection.configured) return "Küme bağlı değil";
  if (!connection.isConnected)
    return connection.lastUpdated ? "Stale / bağlantı kesildi" : "Bağlanıyor";
  if (!connection.upstream) return "API bekleniyor";
  if (!connection.snapshotReady) return "Kaynaklar senkronize ediliyor";
  if (connection.stale) return "Stale · veri güncel değil";
  if (connection.errors?.length) return "Kısmi erişim";
  return "Canlı";
}
// Deliberate allowlist: never copy server errors, URLs, credentials, raw objects,
// connection IDs, kubeconfig, Secret metadata or provider configuration.
export function safeConnectionDiagnostics(connection, namespace) {
  const diagnostic = connection.connectionChecks;
  return {
    product: "KubeView",
    mode: connection.mode,
    context: connection.context || null,
    namespace,
    browserBackend: connection.isConnected ? "connected" : "disconnected",
    upstream: connection.upstream === true,
    snapshotReady: connection.snapshotReady === true,
    stale: connection.stale === true,
    readOnly: connection.readOnly !== false,
    lastResourceUpdate: connection.lastUpdated || null,
    checks: Object.fromEntries(
      checks.map((key) => [
        key,
        key === "permissions"
          ? Object.fromEntries(
              Object.keys(PERMISSION_LABELS).map((resource) => [
                resource,
                {
                  status:
                    diagnostic?.checks?.permissions?.[resource]?.status ||
                    "checking",
                },
              ]),
            )
          : { status: diagnostic?.checks?.[key]?.status || "checking" },
      ]),
    ),
  };
}
