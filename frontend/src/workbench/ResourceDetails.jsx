import "./workbench.css";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  FileCode2,
  Maximize2,
  Pin,
  RotateCw,
  Scaling,
  Settings2,
  Terminal,
  Trash2,
  X,
  Focus,
} from "lucide-react";
import { stringify } from "yaml";
import StatusBadge from "./StatusBadge";
import MetricsPanel from "./MetricsPanel";
import PodLogs from "./PodLogs";
import PodTerminal from "./PodTerminal";
import PortForward from "./PortForward";
import { ContainerContents, NodeContents } from "./ResourceContents";
import { podContainers } from "./containerModel";
import {
  DASH,
  age,
  condition,
  formatCPU,
  formatMemory,
  ownerLabel,
  podReady,
  resourceStatus,
  restartCount,
} from "./resourceUtils";

function Row({ label, children }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{children == null || children === "" ? DASH : children}</dd>
    </div>
  );
}
function resolveController(resource, resources) {
  let current = resource;
  for (let depth = 0; depth < 4; depth++) {
    const owner =
      current?.metadata?.ownerReferences?.find((o) => o.controller) ||
      current?.metadata?.ownerReferences?.[0];
    if (!owner) break;
    const found = resources.find((r) => r.metadata?.uid === owner.uid);
    if (!found) break;
    current = found;
  }
  return current?.kind === "Pod" ? null : current;
}
function SpecificSummary({ resource, resources }) {
  const { kind, spec = {}, status = {} } = resource;
  let fields = [];
  switch (kind) {
    case "Namespace":
      fields = [
        ["Phase", status.phase],
        ["Finalizer’lar", spec.finalizers?.join(", ")],
      ];
      break;
    case "EndpointSlice":
      fields = [
        ["Service", resource.metadata?.labels?.["kubernetes.io/service-name"]],
        ["Adres türü", resource.addressType],
        [
          "Portlar",
          resource.ports
            ?.map((p) => `${p.port ?? DASH}/${p.protocol || "TCP"}`)
            .join(", "),
        ],
        ...(resource.endpoints || []).map((endpoint, i) => [
          `Endpoint ${i + 1}`,
          `${endpoint.addresses?.join(", ") || DASH} · Ready ${endpoint.conditions?.ready == null ? "Unknown" : endpoint.conditions.ready} · ${endpoint.targetRef?.kind || ""}/${endpoint.targetRef?.name || ""}`,
        ]),
      ];
      break;
    case "Ingress":
      fields = [
        ["IngressClass", spec.ingressClassName],
        [
          "Adres",
          status.loadBalancer?.ingress
            ?.map((i) => i.hostname || i.ip)
            .join(", "),
        ],
        [
          "TLS Secret",
          spec.tls
            ?.map((t) => t.secretName)
            .filter(Boolean)
            .join(", "),
        ],
        ...(spec.rules || []).flatMap((rule) =>
          (rule.http?.paths || []).map((path) => [
            rule.host || "*",
            `${path.path || "/"} (${path.pathType || DASH}) → ${path.backend?.service?.name || path.backend?.resource?.name || DASH}:${path.backend?.service?.port?.number || path.backend?.service?.port?.name || DASH}`,
          ]),
        ),
      ];
      break;
    case "NetworkPolicy":
      fields = [
        ["Pod selector", JSON.stringify(spec.podSelector || {})],
        ["Policy türleri", spec.policyTypes?.join(", ")],
        ["Ingress kuralları", spec.ingress?.length ?? 0],
        ["Egress kuralları", spec.egress?.length ?? 0],
      ];
      break;
    case "StorageClass":
      fields = [
        ["Provisioner", resource.provisioner],
        ["Reclaim policy", resource.reclaimPolicy],
        ["Volume binding", resource.volumeBindingMode],
        ["Genişletme", resource.allowVolumeExpansion ? "İzinli" : "Kapalı"],
        [
          "Parametreler",
          Object.entries(resource.parameters || {})
            .map(([k, v]) => `${k}=${v}`)
            .join(", "),
        ],
      ];
      break;
    case "ServiceAccount":
      fields = [
        [
          "Token automount",
          resource.automountServiceAccountToken == null
            ? "Pod / varsayılan ayarı"
            : resource.automountServiceAccountToken
              ? "Açık"
              : "Kapalı",
        ],
        [
          "Image pull Secret",
          resource.imagePullSecrets?.map((s) => s.name).join(", "),
        ],
        [
          "Bağlı RoleBinding",
          resources
            .filter(
              (r) =>
                ["RoleBinding", "ClusterRoleBinding"].includes(r.kind) &&
                r.subjects?.some(
                  (s) =>
                    s.kind === "ServiceAccount" &&
                    s.name === resource.metadata.name &&
                    (s.namespace || r.metadata?.namespace) ===
                      resource.metadata.namespace,
                ),
            )
            .map(
              (r) =>
                `${r.kind}/${r.metadata.name} → ${r.roleRef?.kind}/${r.roleRef?.name}`,
            )
            .join("; ") || "Bu akışta bağ gözlenmedi",
        ],
      ];
      break;
    case "HorizontalPodAutoscaler":
      fields = [
        ["Hedef", `${spec.scaleTargetRef?.kind}/${spec.scaleTargetRef?.name}`],
        [
          "Min / max replica",
          `${spec.minReplicas ?? 1} / ${spec.maxReplicas ?? DASH}`,
        ],
        [
          "Mevcut / istenen",
          `${status.currentReplicas ?? DASH} / ${status.desiredReplicas ?? DASH}`,
        ],
        ["Son scale", status.lastScaleTime],
        ...(spec.metrics || []).map((m, i) => [
          `Hedef metrik ${i + 1}`,
          m.resource
            ? `${m.resource.name}: ${m.resource.target?.averageUtilization != null ? `${m.resource.target.averageUtilization}% container request` : m.resource.target?.averageValue || m.resource.target?.value || DASH}`
            : JSON.stringify(m),
        ]),
      ];
      break;
    case "PodDisruptionBudget":
      fields = [
        ["Min available", spec.minAvailable],
        ["Max unavailable", spec.maxUnavailable],
        ["Disruptions allowed", status.disruptionsAllowed],
        [
          "Sağlıklı / hedef",
          `${status.currentHealthy ?? DASH} / ${status.desiredHealthy ?? DASH}`,
        ],
        ["Beklenen Pod", status.expectedPods],
        ["Selector", JSON.stringify(spec.selector || {})],
      ];
      break;
    case "ResourceQuota":
      fields = Object.entries(status.hard || spec.hard || {}).map(
        ([key, value]) => [
          key,
          `${status.used?.[key] ?? DASH} kullanılan / ${value} hard`,
        ],
      );
      break;
    case "LimitRange":
      fields = (spec.limits || []).flatMap((limit) => [
        ["Kısıt türü", limit.type],
        [
          "Min",
          Object.entries(limit.min || {})
            .map(([k, v]) => `${k}=${v}`)
            .join(", "),
        ],
        [
          "Max",
          Object.entries(limit.max || {})
            .map(([k, v]) => `${k}=${v}`)
            .join(", "),
        ],
        [
          "Varsayılan request",
          Object.entries(limit.defaultRequest || {})
            .map(([k, v]) => `${k}=${v}`)
            .join(", "),
        ],
        [
          "Varsayılan limit",
          Object.entries(limit.default || {})
            .map(([k, v]) => `${k}=${v}`)
            .join(", "),
        ],
      ]);
      break;
    case "CustomResourceDefinition":
      fields = [
        ["API group", spec.group],
        ["Tür", `${spec.names?.kind} · ${spec.names?.plural}`],
        ["Scope", spec.scope],
        [
          "Sürümler",
          spec.versions
            ?.map(
              (v) =>
                `${v.name}: ${v.served ? "served" : "not served"}${v.storage ? ", storage" : ""}`,
            )
            .join("; "),
        ],
        ["Saklanan sürümler", status.storedVersions?.join(", ")],
      ];
      break;
    case "PersistentVolumeClaim":
      fields = [
        ["Phase", status.phase],
        ["İstenen depolama", spec.resources?.requests?.storage],
        ["Gerçek kapasite", status.capacity?.storage],
        ["Bağlı PV", spec.volumeName],
        ["StorageClass", spec.storageClassName],
        ["Access modes", spec.accessModes?.join(", ")],
      ];
      break;
    case "PersistentVolume":
      fields = [
        ["Kapasite", spec.capacity?.storage],
        ["StorageClass", spec.storageClassName],
        ["Reclaim policy", spec.persistentVolumeReclaimPolicy],
        [
          "Bağlı PVC",
          spec.claimRef
            ? `${spec.claimRef.namespace}/${spec.claimRef.name}`
            : DASH,
        ],
        ["CSI driver", spec.csi?.driver],
        ["Access modes", spec.accessModes?.join(", ")],
      ];
      break;
    case "Job":
      fields = [
        [
          "Başarılı / hedef",
          `${status.succeeded || 0} / ${spec.completions ?? 1}`,
        ],
        ["Aktif", status.active || 0],
        ["Başarısız", status.failed || 0],
        ["Parallelism", spec.parallelism],
        ["Backoff limit", spec.backoffLimit],
        ["Başlangıç", status.startTime],
        ["Tamamlanma", status.completionTime],
      ];
      break;
    default:
      return null;
  }
  return (
    <section className="detail-section">
      <h3>{kind} özellikleri</h3>
      <dl>
        {fields.map(([label, value], index) => (
          <Row key={`${label}-${index}`} label={label}>
            {value}
          </Row>
        ))}
      </dl>
    </section>
  );
}
function ResourceDetails({
  resource,
  deleted = false,
  cluster,
  onClose,
  onAction,
  api,
  metrics,
  history = [],
  events = [],
  resources = [],
  readOnly = true,
  lastUpdated,
  updateStamp,
  onBack,
  breadcrumb = [],
  onAddPod,
  selectedContainerName,
  onSelectContainer,
  onShowInScene,
  visualMotion,
  onToggleShipPause,
  onToggleShipFollow,
}) {
  const [tab, setTab] = useState(
      resource?.kind === "Pod" ? "containers" : "summary",
    ),
    [pinned, setPinned] = useState(false),
    [expanded, setExpanded] = useState(false),
    [capabilities, setCapabilities] = useState(null),
    [capabilityError, setCapabilityError] = useState(""),
    [revealedSecret, setRevealedSecret] = useState(null),
    [secretError, setSecretError] = useState("");
  const closeRef = useRef(null),
    previousFocus = useRef(null),
    requestedTabRef = useRef(null);
  const [localContainerName, setLocalContainerName] = useState(null);
  const activeContainerName = selectedContainerName || localContainerName;
  const selectContainer = (name, targetTab = "containers") => {
    setLocalContainerName(name);
    requestedTabRef.current = targetTab;
    onSelectContainer?.(name, resource);
    setTab(targetTab);
  };
  useEffect(() => {
    if (selectedContainerName) {
      setLocalContainerName(selectedContainerName);
      setTab(requestedTabRef.current || "containers");
      requestedTabRef.current = null;
    }
  }, [selectedContainerName]);
  useEffect(() => {
    previousFocus.current = document.activeElement;
    return () => {
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, []);
  const uid = resource?.metadata?.uid;
  useEffect(() => {
    requestedTabRef.current = null;
  }, [localContainerName, tab]);
  useEffect(() => {
    if (resource?.__tab) setTab(resource.__tab);
  }, [resource?.__tab]);
  useEffect(() => {
    setRevealedSecret(null);
    setSecretError("");
    setLocalContainerName(null);
    setTab(
      resource?.__tab || (resource?.kind === "Pod" ? "containers" : "summary"),
    );
    setCapabilities(null);
    setCapabilityError("");
    closeRef.current?.focus();
  }, [uid]);
  useEffect(() => {
    const listener = (e) => {
      if (
        e.key === "Escape" &&
        !document.querySelector(".resource-form-dialog")
      )
        onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [pinned, onClose]);
  useEffect(() => {
    if (!resource || !api?.request || deleted || readOnly) return;
    let active = true;
    setCapabilities(null);
    let path;
    try {
      path = api
        .resourcePath(resource)
        .replace("/api/resources", "/api/capabilities");
    } catch (error) {
      setCapabilityError(error.message);
      return;
    }
    api
      .request(path)
      .then((value) => {
        if (active) {
          setCapabilities(value);
          setCapabilityError("");
        }
      })
      .catch((error) => {
        if (active) setCapabilityError(error.message);
      });
    return () => {
      active = false;
    };
  }, [uid, resource?.kind, cluster, deleted, api, readOnly]);
  if (!resource) return null;
  const { metadata = {}, spec = {}, status = {} } = resource;
  const workload = [
    "Deployment",
    "StatefulSet",
    "DaemonSet",
    "ReplicaSet",
  ].includes(resource.kind);
  const controller =
    resource.kind === "Pod" ? resolveController(resource, resources) : null;
  const containers =
    resource.kind === "Pod"
      ? podContainers(resource)
      : spec.containers ||
        spec.template?.spec?.containers ||
        spec.jobTemplate?.spec?.template?.spec?.containers ||
        [];
  const podRelated = resources.filter((r) =>
    r.metadata?.ownerReferences?.some((o) => o.uid === uid),
  );
  const relatedEvents = [
    ...events.filter(
      (e) => (e.involvedObject?.uid || e.regarding?.uid) === uid,
    ),
    ...resources.filter(
      (r) =>
        r.kind === "Event" &&
        (r.involvedObject?.uid || r.regarding?.uid) === uid,
    ),
  ].filter(
    (e, i, all) =>
      all.findIndex(
        (x) => (x.metadata?.uid || x.id) === (e.metadata?.uid || e.id),
      ) === i,
  );
  const canUpdate = !readOnly && !deleted && capabilities?.verbs?.update;
  const canDelete = !readOnly && !deleted && capabilities?.verbs?.delete;
  const actionAllowed = (action, fallback = false) =>
    !readOnly && !deleted && (capabilities?.actions?.[action] ?? fallback);
  const extraActions = [
    ...(resource.kind === "Pod"
      ? [
          {
            action: "resize",
            label: "Bu Pod’u yerinde resize et",
            disabled: !actionAllowed(
              "resize",
              capabilities?.subresources?.resize,
            ),
            reason:
              "pods/resize API desteği, uygun Pod koşulları ve patch yetkisi gerektirir. Owner şablonunu değiştirmez.",
          },
        ]
      : []),
    ...(resource.kind === "Deployment"
      ? [
          {
            action: "rollback",
            label: "Revision geri al",
            disabled: !actionAllowed("rollback", canUpdate),
            reason: "Deployment’a ait ReplicaSet revision geçmişini kullanır.",
          },
        ]
      : []),
    ...(resource.kind === "CronJob"
      ? [
          {
            action: "run-now",
            label: "Şimdi Job çalıştır",
            disabled: !actionAllowed("run-now"),
            reason: "jobs create yetkisi sunucuda ayrıca denetlenir.",
          },
          {
            action: spec.suspend ? "resume" : "suspend",
            label: spec.suspend ? "Zamanlamayı sürdür" : "Askıya al",
            disabled: !actionAllowed(
              spec.suspend ? "resume" : "suspend",
              canUpdate,
            ),
            reason: "Devam eden Job’lar silinmez.",
          },
        ]
      : []),
    ...(resource.kind === "Node"
      ? [
          {
            action: "drain",
            label: "Bakım için drain",
            disabled: !actionAllowed("drain-preview", capabilities?.verbs?.get),
            reason:
              "Önizleme, cordon ve tüm namespace’leri görme yetkisi gerekir; PDB korunur.",
          },
        ]
      : []),
  ];
  const revealSecret = async () => {
    setSecretError("");
    try {
      const query = new URLSearchParams({
        namespace: metadata.namespace,
        name: metadata.name,
      });
      const value = await api.request(`/api/secrets/reveal?${query}`);
      if (value.metadata?.uid !== uid)
        throw new Error("Secret UID değişmiş. Paneli yeniden açın.");
      setRevealedSecret(value);
    } catch (e) {
      setSecretError(e.message);
    }
  };
  const disabledReason = readOnly
    ? "Bağlantı salt okunur veya demo modunda."
    : deleted
      ? "Bu UID artık kümede bulunmuyor."
      : capabilityError
        ? capabilityError
        : !capabilities
          ? "Kubernetes yetenekleri doğrulanıyor."
          : capabilities.scopeRestricted
            ? "Namespace ile sınırlandırılmış bağlantıda küme kapsamlı genel mutasyon kapalı."
            : "Kubernetes yetkisi bulunmuyor.";
  const tabs = [
    { id: "summary", label: "Özet" },
    ...(containers.length || podRelated.length
      ? [
          {
            id: "containers",
            label: containers.length ? "Container’lar" : "İlişkiler",
          },
        ]
      : []),
    ...(["Node", "Pod"].includes(resource.kind)
      ? [{ id: "metrics", label: "Metrikler" }]
      : []),
    ...(resource.kind === "Pod"
      ? [
          { id: "logs", label: "Loglar" },
          { id: "terminal", label: "Terminal" },
          { id: "portforward", label: "Port-forward" },
        ]
      : []),
    { id: "events", label: "Olaylar" },
    { id: "yaml", label: "YAML" },
  ];
  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`resource-details ${expanded ? "details-expanded" : ""}`}
      aria-label={`${metadata.name} kaynak ayrıntıları`}
    >
      <header className="details-header">
        {(onBack || breadcrumb.length > 0) && (
          <div className="details-navigation">
            {onBack && (
              <button
                className="icon-button"
                aria-label="Önceki kaynağa dön"
                onClick={onBack}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <nav className="resource-breadcrumb" aria-label="Kaynak yolu">
              {breadcrumb.map((item, index) => (
                <React.Fragment key={`${item.label}-${index}`}>
                  {index > 0 && <ChevronRight size={12} />}
                  {item.onClick ? (
                    <button onClick={item.onClick}>{item.label}</button>
                  ) : (
                    <span
                      aria-current={
                        index === breadcrumb.length - 1 ? "page" : undefined
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
        <div className="details-eyebrow">
          <span>{resource.kind}</span>
          <div>
            <button
              className={`icon-button ${pinned ? "active" : ""}`}
              aria-label={pinned ? "Sabitlemeyi kaldır" : "Paneli sabitle"}
              aria-pressed={pinned}
              onClick={() => setPinned(!pinned)}
            >
              <Pin size={16} />
            </button>
            <button
              className="icon-button"
              aria-label={
                expanded ? "Panel görünümüne dön" : "Ayrıntıları genişlet"
              }
              onClick={() => setExpanded(!expanded)}
            >
              <Maximize2 size={16} />
            </button>
            <button
              ref={closeRef}
              className="icon-button"
              aria-label="Ayrıntı panelini kapat"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <h2>
          {activeContainerName && resource.kind === "Pod"
            ? activeContainerName
            : metadata.name}
        </h2>
        {activeContainerName && resource.kind === "Pod" && (
          <p className="details-container-parent">
            Container · Pod {metadata.name}
          </p>
        )}
        <div className="details-scope">
          <span>{cluster || "Bağlantı yok"}</span>
          <span>/</span>
          <span>{metadata.namespace || "Küme kapsamı"}</span>
        </div>
        <StatusBadge resource={resource} />
        {metadata.resourceVersion && (
          <p className="details-version">
            resourceVersion <code>{metadata.resourceVersion}</code> ·{" "}
            {age(resource)} önce oluşturuldu
            {updateStamp ||
              (lastUpdated
                ? ` · Son veri ${new Date(lastUpdated).toLocaleTimeString("tr-TR")}`
                : "")}
          </p>
        )}
      </header>
      <nav className="details-tabs" aria-label="Kaynak ayrıntı sekmeleri">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={tab === t.id ? "active" : ""}
          >
            {t.label}
            {t.id === "events" && relatedEvents.length > 0 && (
              <span>{relatedEvents.length}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="details-body">
        {visualMotion &&
          (resource.kind === "Node" ||
            (resource.kind === "Pod" && spec.nodeName)) && (
            <details className="resource-motion-controls">
              <summary>Görsel seyir ve kamera</summary>
              <div className="resource-motion-content">
                <div>
                  <strong>
                    {resource.kind === "Node"
                      ? "Bu geminin hareketi"
                      : `Node gemisi · ${spec.nodeName}`}
                  </strong>
                  <span>
                    {{
                      patrol: "Devriyede",
                      docked: "Demirli",
                      paused: "Görsel hareket duraklatıldı",
                      reduced: "Hareket azaltıldı",
                      unknown: "Node iletişimi belirsiz",
                      notReady: "Node hazır değil",
                      "not-ready": "Node hazır değil",
                      hidden: "Görsel hareket görünüm dışında",
                      idle: "Demirli",
                      returning: "Yanaşıyor",
                    }[visualMotion.state] ||
                      visualMotion.state ||
                      "Görsel durum izleniyor"}
                  </span>
                </div>
                <div>
                  {onToggleShipPause && (
                    <button
                      className="button"
                      aria-pressed={Boolean(visualMotion.paused)}
                      onClick={onToggleShipPause}
                    >
                      {visualMotion.paused
                        ? "Görsel devriyeyi sürdür"
                        : "Görsel devriyeyi duraklat"}
                    </button>
                  )}
                  {onToggleShipFollow && (
                    <button
                      className="button"
                      aria-pressed={Boolean(visualMotion.following)}
                      onClick={onToggleShipFollow}
                    >
                      {visualMotion.following
                        ? "Gemi takibini bırak"
                        : "Gemiyi kamerayla izle"}
                    </button>
                  )}
                </div>
                <p>
                  Bu kontroller yalnız sahneyi etkiler. Node scheduling, Pod
                  yerleşimi ve Kubernetes durumu değiştirilmez.
                </p>
              </div>
            </details>
          )}

        {deleted && (
          <div className="inline-alert alert-warning" role="status">
            Bu kaynak silindi. Gösterilen bilgiler son gözlenen UID’ye aittir;
            aynı adla yeni kaynak oluşturulması bu paneli değiştirmez.
          </div>
        )}
        {metadata.deletionTimestamp && (
          <div className="inline-alert alert-warning">
            Silme API tarafından kabul edilmiş. Grace period veya finalizer’lar
            tamamlanana kadar kaynak var olmaya devam eder.
            {metadata.finalizers?.length
              ? ` Finalizer: ${metadata.finalizers.join(", ")}`
              : ""}
          </div>
        )}
        {tab === "summary" && (
          <>
            {resource.kind === "Node" && (
              <NodeContents
                resource={resource}
                resources={resources}
                metrics={metrics}
                onInspect={(pod) => onAction?.("inspect", pod)}
                onAddPod={
                  onAddPod || ((node) => onAction?.("create-pod-on-node", node))
                }
                readOnly={readOnly}
                deleted={deleted}
              />
            )}
            <section className="detail-section">
              <h3>Kaynak bilgileri</h3>
              <dl>
                <Row label="Tür">{resource.kind}</Row>
                <Row label="Namespace">
                  {metadata.namespace || "Küme kapsamı"}
                </Row>
                <Row label="Sahip zinciri">
                  {ownerLabel(resource)}
                  {controller &&
                  controller.metadata?.uid !==
                    metadata.ownerReferences?.[0]?.uid
                    ? ` → ${controller.kind}/${controller.metadata.name}`
                    : ""}
                </Row>
                <Row label="Node">{spec.nodeName}</Row>
                <Row label="Oluşturulma">
                  {metadata.creationTimestamp
                    ? new Date(metadata.creationTimestamp).toLocaleString(
                        "tr-TR",
                      )
                    : DASH}
                </Row>
                <Row label="UID">
                  <code className="break-value">{uid}</code>
                  <button
                    className="icon-button"
                    aria-label="UID kopyala"
                    onClick={() => navigator.clipboard?.writeText(uid)}
                  >
                    <Copy size={12} />
                  </button>
                </Row>
                {resource.kind === "Pod" && (
                  <>
                    <Row label="Ready">
                      {podReady(resource).ready} / {podReady(resource).total}
                    </Row>
                    <Row label="Yeniden başlama">{restartCount(resource)}</Row>
                    <Row label="Pod IP">{status.podIP}</Row>
                    <Row label="ServiceAccount">{spec.serviceAccountName}</Row>
                    <Row label="QoS">{status.qosClass}</Row>
                    <Row label="Resize durumu">
                      {status.resize ||
                        (status.conditions || [])
                          .filter((c) => /Resize/.test(c.type))
                          .map((c) => `${c.type}: ${c.reason || c.status}`)
                          .join(", ") ||
                        "Resize bildirimi yok"}
                    </Row>
                  </>
                )}
                {workload && (
                  <>
                    <Row label="Replica istenen">
                      {resource.kind === "DaemonSet"
                        ? status.desiredNumberScheduled
                        : (spec.replicas ?? 1)}
                    </Row>
                    <Row label="Replica hazır">
                      {resource.kind === "DaemonSet"
                        ? status.numberReady
                        : status.readyReplicas || 0}
                    </Row>
                    <Row label="Generation / gözlenen">
                      {metadata.generation ?? DASH} /{" "}
                      {status.observedGeneration ?? DASH}
                    </Row>
                    <Row label="Strateji">
                      {spec.strategy?.type || spec.updateStrategy?.type}
                    </Row>
                  </>
                )}
                {resource.kind === "Node" && (
                  <>
                    <Row label="CPU allocatable">
                      {formatCPU(status.allocatable?.cpu)}
                    </Row>
                    <Row label="Bellek allocatable">
                      {formatMemory(status.allocatable?.memory)}
                    </Row>
                    <Row label="Kubelet">{status.nodeInfo?.kubeletVersion}</Row>
                    <Row label="İşletim sistemi">
                      {status.nodeInfo?.osImage}
                    </Row>
                    <Row label="Scheduling">
                      {spec.unschedulable ? "Kapalı · cordoned" : "Açık"}
                    </Row>
                  </>
                )}
                {resource.kind === "Service" && (
                  <>
                    <Row label="Tür">{spec.type}</Row>
                    <Row label="Cluster IP">{spec.clusterIP}</Row>
                    <Row label="Portlar">
                      {spec.ports
                        ?.map(
                          (p) => `${p.port} → ${p.targetPort}/${p.protocol}`,
                        )
                        .join(", ")}
                    </Row>
                    <Row label="Selector">
                      {Object.entries(spec.selector || {})
                        .map(([k, v]) => `${k}=${v}`)
                        .join(", ")}
                    </Row>
                  </>
                )}
                {resource.kind === "CronJob" && (
                  <>
                    <Row label="Zamanlama">{spec.schedule}</Row>
                    <Row label="Askıya alındı">
                      {spec.suspend ? "Evet" : "Hayır"}
                    </Row>
                    <Row label="Aktif Job">{status.active?.length || 0}</Row>
                  </>
                )}
              </dl>
            </section>
            <SpecificSummary resource={resource} resources={resources} />
            {(status.conditions || []).length > 0 && (
              <section className="detail-section">
                <h3>Koşullar</h3>
                {status.conditions.map((c) => (
                  <div className="condition-row" key={c.type}>
                    <div>
                      <strong>{c.type}</strong>
                      <StatusBadge
                        status={{
                          label: c.status,
                          tone:
                            c.status === "Unknown"
                              ? "warning"
                              : c.status === "True" &&
                                  /Ready|Available|Complete/.test(c.type)
                                ? "success"
                                : c.status === "True" &&
                                    /Pressure|Failed/.test(c.type)
                                  ? "danger"
                                  : "neutral",
                        }}
                      />
                    </div>
                    {(c.reason || c.message) && (
                      <p>
                        {c.reason}
                        {c.reason && c.message ? " · " : ""}
                        {c.message}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            )}
            {Object.keys(metadata.labels || {}).length > 0 && (
              <section className="detail-section">
                <h3>Label’lar</h3>
                <div className="label-list">
                  {Object.entries(metadata.labels).map(([k, v]) => (
                    <code key={k}>
                      {k}={v}
                    </code>
                  ))}
                </div>
              </section>
            )}
            {resource.kind === "Secret" && (
              <div className="inline-alert">
                Secret değerleri toplu kaynak akışında aktarılmaz. Maskelenmiş
                içerik düzenleme için geri yazılmaz.
              </div>
            )}
            {resource.kind === "Secret" && (
              <section className="detail-section">
                <h3>Secret anahtarları</h3>
                <p>{(resource.keyNames || []).join(", ") || "Anahtar yok"}</p>
                {revealedSecret ? (
                  <>
                    <div className="inline-alert alert-warning">
                      Yetkili istekle açılmış gerçek Secret değerleri. Panel
                      kapanınca bu yerel görünüm temizlenir.
                    </div>
                    <pre className="yaml-output">
                      {Object.entries(revealedSecret.data || {})
                        .map(([key, value]) => {
                          let decoded;
                          try {
                            decoded = new TextDecoder().decode(
                              Uint8Array.from(atob(value), (c) =>
                                c.charCodeAt(0),
                              ),
                            );
                          } catch {
                            decoded = "[binary value]";
                          }
                          return `${key}: ${decoded}`;
                        })
                        .join("\n")}
                    </pre>
                    <button
                      className="button"
                      onClick={() => setRevealedSecret(null)}
                    >
                      Değerleri gizle
                    </button>
                  </>
                ) : (
                  <button
                    className="button"
                    disabled={deleted || /Demo/.test(cluster || "")}
                    onClick={revealSecret}
                  >
                    Yetkiyle Secret değerlerini aç
                  </button>
                )}
                {secretError && (
                  <div role="alert" className="inline-alert alert-danger">
                    {secretError}
                  </div>
                )}
              </section>
            )}
            {resource.rules && (
              <section className="detail-section">
                <h3>Gerçek RBAC kuralları</h3>
                {resource.rules.map((rule, i) => (
                  <div className="rbac-rule" key={i}>
                    <strong>
                      {(rule.apiGroups || [])
                        .map((g) => g || "core")
                        .join(", ")}
                    </strong>
                    <p>
                      {rule.resources?.join(", ") ||
                        rule.nonResourceURLs?.join(", ")}
                    </p>
                    <code>{rule.verbs?.join(", ")}</code>
                  </div>
                ))}
              </section>
            )}
            {resource.subjects && (
              <section className="detail-section">
                <h3>Bağlı özneler</h3>
                <p>
                  {resource.roleRef?.kind}/{resource.roleRef?.name}
                </p>
                {resource.subjects.map((s, i) => (
                  <p key={i}>
                    {s.kind} · {s.namespace ? `${s.namespace}/` : ""}
                    {s.name}
                  </p>
                ))}
              </section>
            )}
          </>
        )}
        {tab === "containers" &&
          (resource.kind === "Pod" ? (
            <ContainerContents
              resource={resource}
              selectedContainerName={activeContainerName}
              onSelect={(name) => selectContainer(name)}
              onLogs={(name) => selectContainer(name, "logs")}
              onTerminal={(name) => selectContainer(name, "terminal")}
            />
          ) : (
            <>
              <section className="detail-section">
                <h3>Container’lar</h3>
                {containers.map((c) => {
                  const cs = status.containerStatuses?.find(
                    (x) => x.name === c.name,
                  );
                  return (
                    <div className="container-card" key={c.name}>
                      <div>
                        <strong>{c.name}</strong>
                        {cs && (
                          <StatusBadge
                            status={{
                              label: cs.ready
                                ? "Ready"
                                : cs.state?.waiting?.reason ||
                                  (cs.state?.running
                                    ? "Running · Hazır değil"
                                    : cs.state?.terminated?.reason ||
                                      "Bilinmiyor"),
                              tone: cs.ready ? "success" : "warning",
                            }}
                          />
                        )}
                      </div>
                      <code className="break-value">{c.image}</code>
                      <dl>
                        <Row label="CPU request / limit">
                          {c.resources?.requests?.cpu || "Tanımsız"} /{" "}
                          {c.resources?.limits?.cpu || "Tanımsız"}
                        </Row>
                        <Row label="Bellek request / limit">
                          {c.resources?.requests?.memory || "Tanımsız"} /{" "}
                          {c.resources?.limits?.memory || "Tanımsız"}
                        </Row>
                        <Row label="Yeniden başlama">
                          {cs?.restartCount ?? DASH}
                        </Row>
                        {cs?.allocatedResources && (
                          <Row label="Kubelet ayrılan kaynak">
                            CPU {cs.allocatedResources.cpu || DASH} · Bellek{" "}
                            {cs.allocatedResources.memory || DASH}
                          </Row>
                        )}
                        {cs?.resources && (
                          <Row label="Uygulanan kaynak">
                            {JSON.stringify(cs.resources)}
                          </Row>
                        )}
                        {cs?.lastState?.terminated && (
                          <Row label="Son termination">
                            {cs.lastState.terminated.reason} · exit{" "}
                            {cs.lastState.terminated.exitCode}
                          </Row>
                        )}
                      </dl>
                    </div>
                  );
                })}
              </section>
              {podRelated.length > 0 && (
                <section className="detail-section">
                  <h3>Doğrudan ilişkili kaynaklar</h3>
                  {podRelated.map((r) => (
                    <button
                      className="related-resource"
                      key={r.metadata.uid}
                      onClick={() => onAction?.("inspect", r)}
                    >
                      {r.kind} / {r.metadata.name}
                      <StatusBadge resource={r} />
                    </button>
                  ))}
                </section>
              )}
            </>
          ))}
        {tab === "metrics" && (
          <MetricsPanel
            metrics={metrics}
            history={history.length ? history : metrics?.history || []}
            resource={resource}
          />
        )}
        {tab === "logs" && !deleted && (
          <PodLogs
            resource={resource}
            cluster={cluster}
            api={api}
            initialContainerName={activeContainerName}
            onContainerChange={(name) => selectContainer(name, "logs")}
          />
        )}
        {tab === "terminal" && !deleted && (
          <PodTerminal
            resource={resource}
            cluster={cluster}
            api={api}
            initialContainerName={activeContainerName}
            onContainerChange={(name) => selectContainer(name, "terminal")}
            disabled={readOnly || !capabilities?.subresources?.exec}
            reason={
              readOnly
                ? disabledReason
                : capabilities?.reasons?.create || "pods/exec yetkisi gerekli."
            }
          />
        )}
        {tab === "portforward" && !deleted && (
          <PortForward
            resource={resource}
            cluster={cluster}
            api={api}
            disabled={readOnly || !capabilities?.subresources?.portforward}
            reason={
              readOnly
                ? disabledReason
                : "pods/portforward create yetkisi ve gerçek API desteği gerektirir."
            }
          />
        )}
        {tab === "events" && (
          <section className="detail-section">
            <h3>Kaynak olayları</h3>
            {relatedEvents.length ? (
              relatedEvents
                .sort((a, b) =>
                  (
                    b.lastTimestamp ||
                    b.eventTime ||
                    b.metadata?.creationTimestamp ||
                    ""
                  ).localeCompare(
                    a.lastTimestamp ||
                      a.eventTime ||
                      a.metadata?.creationTimestamp ||
                      "",
                  ),
                )
                .map((event, i) => (
                  <article
                    className="detail-event"
                    key={event.metadata?.uid || i}
                  >
                    <div>
                      <StatusBadge resource={event} />
                      <time>
                        {new Date(
                          event.lastTimestamp ||
                            event.eventTime ||
                            event.metadata?.creationTimestamp,
                        ).toLocaleString("tr-TR")}
                      </time>
                    </div>
                    <strong>{event.reason}</strong>
                    <p>{event.message || event.note}</p>
                    <span>
                      {event.count || event.series?.count || 1} kez gözlendi
                    </span>
                  </article>
                ))
            ) : (
              <p className="empty-copy">
                Bu UID ile ilişkili olay gözlenmedi. Kubernetes olay saklama
                süresi ve erişim yetkisi bu listeyi sınırlar.
              </p>
            )}
          </section>
        )}
        {tab === "yaml" && (
          <section className="detail-section">
            <div className="section-heading">
              <h3>Gözlenen kaynak YAML</h3>
              <button
                className="icon-button"
                aria-label="YAML kopyala"
                onClick={() =>
                  navigator.clipboard?.writeText(stringify(resource))
                }
              >
                <Copy size={15} />
              </button>
            </div>
            <pre className="yaml-output" tabIndex={0}>
              {stringify(resource)}
            </pre>
          </section>
        )}
      </div>
      <footer className="details-actions">
        {resource.kind === "Secret" && (
          <button
            className="button"
            disabled={!canUpdate || !capabilities?.verbs?.get}
            title={
              !canUpdate || !capabilities?.verbs?.get
                ? disabledReason
                : "Değerler yalnız ayrı, yetkili yerel düzenleme formuna yüklenir."
            }
            onClick={() => onAction?.("secret-edit", resource)}
          >
            <FileCode2 size={15} />
            Gizli içeriği düzenle
          </button>
        )}
        {onShowInScene && ["Node", "Pod"].includes(resource.kind) && (
          <button className="button" onClick={() => onShowInScene(resource)}>
            <Focus size={15} />
            Sahnede göster
          </button>
        )}
        {resource.kind !== "Secret" && (
          <button
            className="button"
            disabled={!canUpdate}
            title={!canUpdate ? disabledReason : undefined}
            onClick={() => onAction?.("edit", resource)}
          >
            <FileCode2 size={15} />
            Düzenle
          </button>
        )}
        {resource.kind === "Pod" && (
          <button
            className="button"
            disabled={deleted}
            onClick={() => setTab("logs")}
          >
            <Terminal size={15} />
            Loglar
          </button>
        )}
        {["Deployment", "StatefulSet", "ReplicaSet"].includes(
          resource.kind,
        ) && (
          <button
            className="button"
            disabled={readOnly || deleted || !capabilities?.subresources?.scale}
            title={
              readOnly
                ? disabledReason
                : "Gerçek scale alt kaynağı kullanılır; HPA sahipliği sunucuda kontrol edilir."
            }
            onClick={() => onAction?.("scale", resource)}
          >
            <Scaling size={15} />
            Ölçekle
          </button>
        )}
        {["Deployment", "StatefulSet", "DaemonSet"].includes(resource.kind) && (
          <button
            className="button"
            disabled={!actionAllowed("restart", canUpdate)}
            title={!canUpdate ? disabledReason : undefined}
            onClick={() => onAction?.("restart", resource)}
          >
            <RotateCw size={15} />
            Rollout restart
          </button>
        )}
        {(workload || controller) && (
          <button
            className="button"
            disabled={readOnly || deleted || (!controller && !canUpdate)}
            title={
              controller
                ? `${controller.kind}/${controller.metadata.name} workload şablonu güncellenir.`
                : "Container başına request ve limit"
            }
            onClick={() => onAction?.("resources", controller || resource)}
          >
            <Settings2 size={15} />
            CPU / RAM
          </button>
        )}
        {resource.kind === "Node" && (
          <button
            className="button"
            disabled={
              !actionAllowed(spec.unschedulable ? "uncordon" : "cordon")
            }
            title={
              readOnly
                ? disabledReason
                : "Node spec.unschedulable değişir; mevcut Pod’lar yerinde kalır."
            }
            onClick={() =>
              onAction?.(spec.unschedulable ? "uncordon" : "cordon", resource)
            }
          >
            {spec.unschedulable ? "Uncordon" : "Cordon"}
          </button>
        )}
        {extraActions.length > 0 && (
          <details className="extra-actions-menu">
            <summary className="button">Diğer işlemler</summary>
            <div>
              {extraActions.map((item) => (
                <button
                  key={item.action}
                  className="button"
                  disabled={item.disabled}
                  title={
                    item.disabled
                      ? disabledReason + " " + item.reason
                      : item.reason
                  }
                  onClick={() => onAction?.(item.action, resource)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </details>
        )}
        <button
          className="button button-danger"
          disabled={!canDelete}
          title={
            !canDelete
              ? disabledReason
              : "Grace period ve finalizer’lar korunur."
          }
          onClick={() => onAction?.("delete", resource)}
        >
          <Trash2 size={15} />
          Sil
        </button>
      </footer>
    </aside>
  );
}

const MemoResourceDetails = React.memo(ResourceDetails);
export default import.meta.env.VITE_REACT_PROFILE === "1"
  ? function ProfiledResourceDetails(props) {
      return (
        <React.Profiler
          id="ResourceDetails"
          onRender={(...values) =>
            globalThis.__KUBEVIEW_BENCHMARK__?.reactCommit?.(...values)
          }
        >
          <MemoResourceDetails {...props} />
        </React.Profiler>
      );
    }
  : MemoResourceDetails;
