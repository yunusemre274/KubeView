import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  CalendarClock,
  Construction,
  Warehouse,
  FileSliders,
  LockKeyhole,
  Network,
  TowerControl,
  ShieldCheck,
  Plus,
  FileCode2,
  Focus,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Window from "./Window";
import {
  FACILITIES,
  apiVersionOf,
  descriptorKey,
  scopeResources,
} from "./registry";
import ResourceTable from "../workbench/ResourceTable";
import MetricsPanel from "../workbench/MetricsPanel";
const icons = {
  Building2,
  ClipboardList,
  CalendarClock,
  Construction,
  Warehouse,
  FileSliders,
  LockKeyhole,
  Network,
  TowerControl,
  ShieldCheck,
};
const short = {
  PersistentVolumeClaim: "PVC",
  PersistentVolume: "PV",
  HorizontalPodAutoscaler: "HPA",
  PodDisruptionBudget: "PDB",
};
export function Events({ resources, onSelect, onlyScheduling = false }) {
  const events = resources
    .filter(
      (r) =>
        r.kind === "Event" &&
        (!onlyScheduling ||
          r.reason === "FailedScheduling" ||
          r.reason === "Scheduled"),
    )
    .sort(
      (a, b) =>
        Date.parse(
          b.lastTimestamp || b.eventTime || b.metadata.creationTimestamp,
        ) -
        Date.parse(
          a.lastTimestamp || a.eventTime || a.metadata.creationTimestamp,
        ),
    );
  return (
    <div className="world-events">
      {!events.length ? (
        <p className="empty-copy">
          Bu kapsamda{" "}
          {onlyScheduling ? "scheduler tarafından bildirilmiş " : ""}olay
          gözlenmedi. Olayların saklanma süresi ve okuma yetkileri listeyi
          sınırlar.
        </p>
      ) : (
        events.map((r) => (
          <button
            className={`world-event ${r.type === "Warning" ? "event-warning" : ""}`}
            key={r.metadata.uid}
            onClick={() =>
              onSelect(
                resources.find(
                  (o) =>
                    o.metadata.uid ===
                    (r.involvedObject?.uid || r.regarding?.uid),
                ) || r,
              )
            }
          >
            <span>
              {r.type === "Warning" ? (
                <AlertTriangle size={17} />
              ) : (
                <CalendarClock size={17} />
              )}
            </span>
            <div>
              <strong>
                {r.reason}
                <small>{r.involvedObject?.name || r.regarding?.name}</small>
              </strong>
              <p>{r.message || r.note}</p>
              <small>
                {r.metadata.namespace} ·{" "}
                {new Date(
                  r.lastTimestamp ||
                    r.eventTime ||
                    r.metadata.creationTimestamp,
                ).toLocaleTimeString("tr-TR")}{" "}
                · {r.count || r.series?.count || 1} gözlem
              </small>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
export default function FacilityWindow({
  id,
  connection,
  namespace,
  onNamespace,
  onClose,
  onSelect,
  onAction,
  onCreate,
  onFocus,
  onConnection,
}) {
  const config = FACILITIES[id] || FACILITIES.center;
  const [tab, setTab] = useState("resources"),
    [kind, setKind] = useState(config.kinds[0]),
    [gvr, setGVR] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [range, setRange] = useState(15);
  const {
    resources,
    discovery,
    metrics,
    metricHistory,
    mode,
    context,
    readOnly,
    stale,
    sourceKey,
  } = connection;
  const scoped = useMemo(
    () => scopeResources(resources, namespace),
    [resources, namespace],
  );
  const descriptor =
    discovery.find((d) => descriptorKey(d) === gvr) ||
    discovery.find((d) => d.kind === kind);
  const chosen = descriptor?.kind || kind;
  const namespaces = [
    ...new Set(
      [
        connection.watchNamespace,
        ...resources.map((r) =>
          r.kind === "Namespace" ? r.metadata.name : r.metadata.namespace,
        ),
      ].filter(Boolean),
    ),
  ].sort();
  const selectedResources = scoped.filter(
    (r) =>
      r.kind === chosen &&
      (!gvr || !descriptor || r.apiVersion === apiVersionOf(descriptor)) &&
      (id !== "scheduling" || !r.spec?.nodeName),
  );
  useEffect(() => {
    if (mode === "demo" || !descriptor) return;
    let active = true;
    setLoading(true);
    setError("");
    connection
      .loadKind(descriptor.kind, namespace, descriptor)
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    descriptor?.group,
    descriptor?.version,
    descriptor?.resource,
    namespace,
    mode,
    sourceKey,
  ]);
  function create(type = chosen) {
    const d =
      (type === chosen ? descriptor : null) ||
      discovery.find((x) => x.kind === type);
    onCreate({
      createKind: type,
      initialObject: d
        ? {
            apiVersion: apiVersionOf(d),
            kind: type,
            metadata: {
              name: "",
              ...(d.namespaced
                ? {
                    namespace:
                      namespace === "all"
                        ? connection.watchNamespace || "default"
                        : namespace,
                  }
                : {}),
            },
          }
        : undefined,
    });
  }
  const centerTabs =
    id === "center"
      ? [
          ["resources", "İş yükleri"],
          ["catalog", "Kaynak kataloğu"],
          ["events", "Olaylar"],
          ["metrics", "Metrikler"],
          ["access", "Bağlantı ve yetki"],
        ]
      : id === "scheduling"
        ? [
            ["resources", "Bekleyen yükler"],
            ["events", "Yerleştirme olayları"],
          ]
        : [
            ["resources", "Kaynaklar"],
            ["events", "İlgili olaylar"],
          ];
  return (
    <Window
      title={config.title}
      subtitle={`${mode === "demo" ? "Demo — örnek veri" : context || "Küme bağlı değil"} · ${namespace === "all" ? "Tüm namespace’ler" : namespace}`}
      icon={icons[config.icon]}
      onClose={onClose}
      className="facility-window"
      footer={
        <>
          <p>{config.description}</p>
          <button className="button" onClick={() => onFocus(id)}>
            <Focus size={15} />
            Yaklaş
          </button>
        </>
      }
    >
      <nav className="window-tabs" aria-label="Tesis bölümleri">
        {centerTabs.map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? "active" : ""}
            aria-current={tab === value ? "page" : undefined}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "access" ? (
        <div className="facility-copy">
          <h2>Bağlantı ve işlem yetkisi</h2>
          <p>
            {readOnly
              ? "Backend salt okunur modda; yazma istekleri sunucuda da reddedilir."
              : "İşlemler, bağlı Kubernetes kimliğinin gerçek RBAC yetkileriyle yapılır."}
          </p>
          <p>
            WebSocket: {connection.isConnected ? "açık" : "kapalı"} · Kubernetes
            API: {connection.upstream ? "erişilebilir" : "doğrulanamadı"} ·
            Snapshot: {connection.snapshotReady ? "alındı" : "bekleniyor"}
          </p>
          <button className="button" onClick={onConnection}>
            Bağlantıyı ve kapsamı incele
          </button>
          <h3>Yetki kaynakları</h3>
          <p>
            Personel binası ServiceAccount, Role ve binding ilişkilerini açar.
            Bir kaynakta kullanılabilir işlem kendi capability sorgusuyla
            belirlenir.
          </p>
          <button
            className="button"
            onClick={() => {
              setTab("catalog");
              setKind("Role");
              setGVR("");
            }}
          >
            Role kataloğunu aç
          </button>
        </div>
      ) : tab === "metrics" ? (
        <MetricsPanel
          metrics={metrics}
          history={metricHistory}
          resources={scoped}
          range={range}
          onRangeChange={setRange}
        />
      ) : tab === "events" ? (
        <Events
          resources={scoped}
          onSelect={onSelect}
          onlyScheduling={id === "scheduling"}
        />
      ) : (
        <>
          <div className="facility-actions">
            <div className="facility-context">
              <label>
                Namespace
                <select
                  aria-label="Pencere namespace kapsamı"
                  value={namespace}
                  onChange={(e) => onNamespace(e.target.value)}
                >
                  <option value="all">Tümü</option>
                  {namespaces.map((ns) => (
                    <option key={ns}>{ns}</option>
                  ))}
                </select>
              </label>
              <span className="scope-label">
                {mode === "demo"
                  ? "Demo · salt okunur"
                  : readOnly
                    ? "Salt okunur"
                    : stale
                      ? "Veri güncel değil"
                      : "RBAC denetimli"}
              </span>
            </div>
            <div className="facility-create">
              <button
                className="button button-primary"
                onClick={() =>
                  create(
                    (id === "center" || id === "workloads") && tab !== "catalog"
                      ? "Deployment"
                      : chosen,
                  )
                }
              >
                <Plus size={16} />
                {(id === "center" || id === "workloads") && tab !== "catalog"
                  ? "Uygulama oluştur"
                  : id === "scheduling"
                    ? "Pod oluştur"
                    : `${short[chosen] || chosen} oluştur`}
              </button>
              <button
                className="button"
                onClick={() => onCreate({ createKind: "YAML" })}
              >
                <FileCode2 size={15} />
                YAML
              </button>
            </div>
          </div>
          {tab === "catalog" ? (
            <div className="catalog-selector">
              <label>
                API kaynağı
                <select
                  aria-label="API kaynağı"
                  value={gvr || (descriptor ? descriptorKey(descriptor) : kind)}
                  onChange={(e) => {
                    setGVR(e.target.value);
                    const d = discovery.find(
                      (x) => descriptorKey(x) === e.target.value,
                    );
                    if (d) setKind(d.kind);
                    else {
                      setKind(e.target.value);
                      setGVR("");
                    }
                  }}
                >
                  {discovery.length
                    ? discovery.map((d) => (
                        <option key={descriptorKey(d)} value={descriptorKey(d)}>
                          {d.kind} · {d.group || "core"}/{d.version} ·{" "}
                          {d.resource}
                        </option>
                      ))
                    : [...new Set(resources.map((r) => r.kind))]
                        .sort()
                        .map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                </select>
              </label>
              {descriptor && (
                <p>
                  {descriptor.namespaced
                    ? "Namespace kapsamlı"
                    : "Küme kapsamlı"}{" "}
                  · API verb’leri: {descriptor.verbs.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <nav className="resource-kind-tabs" aria-label="Kaynak türü">
              {config.kinds
                .filter(
                  (k) =>
                    ![
                      "Gateway",
                      "GatewayClass",
                      "HTTPRoute",
                      "TCPRoute",
                      "TLSRoute",
                      "GRPCRoute",
                    ].includes(k) ||
                    resources.some((r) => r.kind === k) ||
                    discovery.some((d) => d.kind === k),
                )
                .map((k) => (
                  <button
                    key={k}
                    className={chosen === k ? "active" : ""}
                    onClick={() => {
                      setKind(k);
                      setGVR("");
                    }}
                  >
                    {short[k] || k}
                    <span>{scoped.filter((r) => r.kind === k).length}</span>
                  </button>
                ))}
            </nav>
          )}
          {id === "scheduling" && (
            <p className="facility-note">
              Yalnız <code>spec.nodeName</code> atanmamış gerçek Pod’lar bekleme
              alanındadır. Scheduler kararı veya skor uydurulmaz; nedeni Olaylar
              bölümünde görünür.
            </p>
          )}
          {error && (
            <div className="inline-alert alert-danger" role="alert">
              {error}
              <button
                className="button"
                onClick={() => {
                  setLoading(true);
                  connection
                    .loadKind(chosen, namespace, descriptor)
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false));
                }}
              >
                <RefreshCw size={14} />
                Tekrar dene
              </button>
            </div>
          )}
          <ResourceTable
            kind={chosen}
            resources={selectedResources}
            allResources={resources}
            metrics={metrics}
            onSelect={onSelect}
            onAction={onAction}
            readOnly={readOnly || stale || mode === "demo"}
            loading={loading}
            title={`${config.short} kaynakları`}
          />
        </>
      )}
    </Window>
  );
}
