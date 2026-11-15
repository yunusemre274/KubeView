import "./workbench.css";
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Filter,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import {
  DASH,
  age,
  formatCPU,
  formatMemory,
  metricFor,
  metricUsage,
  ownerLabel,
  podReady,
  resourceUID,
  restartCount,
  quantityNumber,
} from "./resourceUtils";

function NameCell({ resource, onSelect }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="resource-name-cell">
      <button
        className="resource-name"
        onClick={() => onSelect(resource)}
        title={resource.metadata?.name}
      >
        {resource.metadata?.name}
      </button>
      <button
        className="icon-button copy-name"
        aria-label={`${resource.metadata?.name} adını kopyala`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(resource.metadata?.name || "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          } catch {
            setCopied(false);
          }
        }}
      >
        <Copy size={13} />
      </button>
      {copied && (
        <span role="status" className="copy-feedback">
          Kopyalandı
        </span>
      )}
    </div>
  );
}
function columnsFor(kind, resources, metrics) {
  const status = {
    key: "status",
    label: "Durum",
    render: (r) => <StatusBadge resource={r} />,
  };
  const ns = {
    key: "namespace",
    label: "Namespace",
    render: (r) => r.metadata?.namespace || DASH,
  };
  const ageCol = {
    key: "age",
    label: "Yaş",
    render: (r) => <span title={r.metadata?.creationTimestamp}>{age(r)}</span>,
  };
  const usage = (key) => (r) =>
    key === "cpu"
      ? formatCPU(metricUsage(metricFor(r, metrics), key))
      : formatMemory(metricUsage(metricFor(r, metrics), key));
  switch (kind) {
    case "Pod":
      return [
        ns,
        {
          ...status,
          label: "Durum / Ready",
          render: (r) => {
            const ready = podReady(r);
            return (
              <div className="cell-status">
                <StatusBadge resource={r} />
                <span className="ready-ratio">
                  {ready.ready}/{ready.total}
                </span>
              </div>
            );
          },
        },
        {
          key: "node",
          label: "Node",
          render: (r) => r.spec?.nodeName || "Atanmadı",
        },
        {
          key: "owner",
          label: "Sahip workload",
          render: (r) => (
            <span className="cell-truncate" title={ownerLabel(r)}>
              {ownerLabel(r)}
            </span>
          ),
        },
        { key: "restarts", label: "Restart", render: restartCount },
        { key: "cpu", label: "CPU", render: usage("cpu") },
        { key: "memory", label: "Bellek", render: usage("memory") },
        ageCol,
      ];
    case "Deployment":
    case "StatefulSet":
    case "ReplicaSet":
      return [
        ns,
        {
          key: "replicas",
          label: "İstenen / mevcut / hazır",
          render: (r) =>
            `${r.spec?.replicas ?? 1} / ${r.status?.replicas ?? 0} / ${r.status?.readyReplicas ?? 0}`,
        },
        {
          key: "updated",
          label: "Güncel replica",
          render: (r) => r.status?.updatedReplicas ?? DASH,
        },
        {
          key: "image",
          label: "Image",
          render: (r) => (
            <span
              className="cell-truncate"
              title={r.spec?.template?.spec?.containers
                ?.map((c) => c.image)
                .join(", ")}
            >
              {r.spec?.template?.spec?.containers
                ?.map((c) => c.image)
                .join(", ") || DASH}
            </span>
          ),
        },
        {
          key: "strategy",
          label: "Strateji",
          render: (r) =>
            r.spec?.strategy?.type || r.spec?.updateStrategy?.type || DASH,
        },
        {
          key: "hpa",
          label: "HPA",
          render: (r) =>
            resources.find(
              (x) =>
                x.kind === "HorizontalPodAutoscaler" &&
                x.metadata?.namespace === r.metadata?.namespace &&
                x.spec?.scaleTargetRef?.name === r.metadata?.name &&
                x.spec?.scaleTargetRef?.kind === r.kind,
            )?.metadata?.name || DASH,
        },
        status,
      ];
    case "Node":
      return [
        status,
        {
          key: "pods",
          label: "Pod",
          render: (r) =>
            resources.filter(
              (p) => p.kind === "Pod" && p.spec?.nodeName === r.metadata?.name,
            ).length,
        },
        {
          key: "cpu",
          label: "CPU / allocatable",
          render: (r) =>
            `${usage("cpu")(r)} / ${formatCPU(r.status?.allocatable?.cpu)}`,
        },
        {
          key: "memory",
          label: "Bellek / allocatable",
          render: (r) =>
            `${usage("memory")(r)} / ${formatMemory(r.status?.allocatable?.memory)}`,
        },
        {
          key: "pressure",
          label: "Basınç koşulları",
          render: (r) =>
            (r.status?.conditions || [])
              .filter((c) => /Pressure$/.test(c.type) && c.status === "True")
              .map((c) => c.type)
              .join(", ") ||
            (r.status?.conditions?.some((c) => /Pressure$/.test(c.type))
              ? "Basınç yok"
              : "Veri yok"),
        },
        {
          key: "version",
          label: "Kubelet sürümü",
          render: (r) => r.status?.nodeInfo?.kubeletVersion || DASH,
        },
      ];
    case "Service":
      return [
        ns,
        { key: "type", label: "Tür", render: (r) => r.spec?.type || DASH },
        {
          key: "ip",
          label: "Cluster IP",
          render: (r) => r.spec?.clusterIP || DASH,
        },
        {
          key: "ports",
          label: "Portlar",
          render: (r) =>
            r.spec?.ports
              ?.map(
                (p) =>
                  `${p.port}${p.nodePort ? `:${p.nodePort}` : ""}/${p.protocol}`,
              )
              .join(", ") || DASH,
        },
        {
          key: "selector",
          label: "Selector",
          render: (r) =>
            Object.entries(r.spec?.selector || {})
              .map(([k, v]) => `${k}=${v}`)
              .join(", ") || DASH,
        },
        ageCol,
      ];
    case "PersistentVolume":
    case "PersistentVolumeClaim":
      return [
        ns,
        status,
        {
          key: "capacity",
          label: "Kapasite / istenen",
          render: (r) =>
            r.status?.capacity?.storage ||
            r.spec?.capacity?.storage ||
            r.spec?.resources?.requests?.storage ||
            DASH,
        },
        {
          key: "storageclass",
          label: "StorageClass",
          render: (r) => r.spec?.storageClassName || DASH,
        },
        {
          key: "access",
          label: "Erişim",
          render: (r) => r.spec?.accessModes?.join(", ") || DASH,
        },
        {
          key: "volume",
          label: "Bağlı kaynak",
          render: (r) => r.spec?.volumeName || r.spec?.claimRef?.name || DASH,
        },
        ageCol,
      ];
    case "ConfigMap":
    case "Secret":
      return [
        ns,
        {
          key: "data",
          label: "Anahtarlar",
          render: (r) =>
            Object.keys(r.data || r.binaryData || {}).join(", ") ||
            (r.keyNames || []).join(", ") ||
            DASH,
        },
        { key: "type", label: "Tür", render: (r) => r.type || "ConfigMap" },
        {
          key: "immutable",
          label: "Immutable",
          render: (r) => (r.immutable ? "Evet" : "Hayır"),
        },
        ageCol,
      ];
    case "Role":
    case "ClusterRole":
      return [
        ns,
        {
          key: "rules",
          label: "Kural sayısı",
          render: (r) => r.rules?.length ?? 0,
        },
        {
          key: "verbs",
          label: "Verb’ler",
          render: (r) =>
            [...new Set((r.rules || []).flatMap((x) => x.verbs || []))].join(
              ", ",
            ) || DASH,
        },
        ageCol,
      ];
    case "RoleBinding":
    case "ClusterRoleBinding":
      return [
        ns,
        {
          key: "role",
          label: "Role",
          render: (r) => `${r.roleRef?.kind || ""}/${r.roleRef?.name || ""}`,
        },
        {
          key: "subjects",
          label: "Özneler",
          render: (r) =>
            r.subjects
              ?.map(
                (s) =>
                  `${s.kind}: ${s.namespace ? `${s.namespace}/` : ""}${s.name}`,
              )
              .join(", ") || DASH,
        },
        ageCol,
      ];
    case "Job":
      return [
        ns,
        status,
        {
          key: "completed",
          label: "Başarılı / hedef",
          render: (r) =>
            `${r.status?.succeeded || 0} / ${r.spec?.completions ?? 1}`,
        },
        { key: "active", label: "Aktif", render: (r) => r.status?.active || 0 },
        {
          key: "failed",
          label: "Başarısız",
          render: (r) => r.status?.failed || 0,
        },
        ageCol,
      ];
    case "CronJob":
      return [
        ns,
        status,
        {
          key: "schedule",
          label: "Zamanlama",
          render: (r) => r.spec?.schedule || DASH,
        },
        {
          key: "last",
          label: "Son çalıştırma",
          render: (r) =>
            r.status?.lastScheduleTime
              ? new Date(r.status.lastScheduleTime).toLocaleString("tr-TR")
              : DASH,
        },
        {
          key: "active",
          label: "Aktif Job",
          render: (r) => r.status?.active?.length || 0,
        },
        ageCol,
      ];
    case "DaemonSet":
      return [
        ns,
        status,
        {
          key: "replicas",
          label: "İstenen / mevcut / hazır",
          render: (r) =>
            `${r.status?.desiredNumberScheduled || 0} / ${r.status?.currentNumberScheduled || 0} / ${r.status?.numberReady || 0}`,
        },
        ageCol,
      ];
    case "HorizontalPodAutoscaler":
      return [
        ns,
        {
          key: "target",
          label: "Hedef workload",
          render: (r) =>
            `${r.spec?.scaleTargetRef?.kind || ""}/${r.spec?.scaleTargetRef?.name || ""}`,
        },
        {
          key: "limits",
          label: "Min / max",
          render: (r) =>
            `${r.spec?.minReplicas ?? 1} / ${r.spec?.maxReplicas ?? DASH}`,
        },
        {
          key: "replicas",
          label: "Mevcut / istenen",
          render: (r) =>
            `${r.status?.currentReplicas ?? DASH} / ${r.status?.desiredReplicas ?? DASH}`,
        },
        {
          key: "metrics",
          label: "Hedef metrik",
          render: (r) =>
            (r.spec?.metrics || [])
              .map((m) =>
                m.resource
                  ? `${m.resource.name}: ${m.resource.target?.averageUtilization ?? m.resource.target?.averageValue ?? m.resource.target?.value ?? DASH}${m.resource.target?.averageUtilization != null ? "% request" : ""}`
                  : m.type,
              )
              .join(", ") || DASH,
        },
        ageCol,
      ];
    case "PodDisruptionBudget":
      return [
        ns,
        {
          key: "min",
          label: "Min available",
          render: (r) => r.spec?.minAvailable ?? DASH,
        },
        {
          key: "max",
          label: "Max unavailable",
          render: (r) => r.spec?.maxUnavailable ?? DASH,
        },
        {
          key: "allowed",
          label: "İzinli disruption",
          render: (r) => r.status?.disruptionsAllowed ?? DASH,
        },
        {
          key: "healthy",
          label: "Sağlıklı / hedef",
          render: (r) =>
            `${r.status?.currentHealthy ?? DASH} / ${r.status?.desiredHealthy ?? DASH}`,
        },
        {
          key: "selector",
          label: "Selector",
          render: (r) =>
            Object.entries(r.spec?.selector?.matchLabels || {})
              .map(([k, v]) => `${k}=${v}`)
              .join(", ") || DASH,
        },
        ageCol,
      ];
    case "ResourceQuota":
      return [
        ns,
        {
          key: "used",
          label: "Kullanılan / hard",
          render: (r) => (
            <span
              className="cell-truncate"
              title={Object.entries(r.status?.hard || {})
                .map(([k, v]) => `${k}: ${r.status?.used?.[k] ?? DASH}/${v}`)
                .join(", ")}
            >
              {Object.entries(r.status?.hard || {})
                .map(([k, v]) => `${k}: ${r.status?.used?.[k] ?? DASH}/${v}`)
                .join(", ") || DASH}
            </span>
          ),
        },
        {
          key: "scope",
          label: "Scope",
          render: (r) => r.spec?.scopes?.join(", ") || "Namespace",
        },
        ageCol,
      ];
    case "LimitRange":
      return [
        ns,
        {
          key: "limits",
          label: "Kısıt türleri",
          render: (r) => r.spec?.limits?.map((l) => l.type).join(", ") || DASH,
        },
        {
          key: "default",
          label: "Varsayılan request",
          render: (r) =>
            r.spec?.limits
              ?.map((l) =>
                Object.entries(l.defaultRequest || {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", "),
              )
              .filter(Boolean)
              .join("; ") || DASH,
        },
        {
          key: "max",
          label: "Maksimum",
          render: (r) =>
            r.spec?.limits
              ?.map((l) =>
                Object.entries(l.max || {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", "),
              )
              .filter(Boolean)
              .join("; ") || DASH,
        },
        ageCol,
      ];
    case "EndpointSlice":
      return [
        ns,
        {
          key: "service",
          label: "Service",
          render: (r) =>
            r.metadata?.labels?.["kubernetes.io/service-name"] || DASH,
        },
        {
          key: "addressType",
          label: "Adres türü",
          render: (r) => r.addressType || DASH,
        },
        {
          key: "endpoints",
          label: "Endpoint / Ready",
          render: (r) =>
            `${r.endpoints?.length || 0} / ${(r.endpoints || []).filter((e) => e.conditions?.ready === true).length}`,
        },
        {
          key: "ports",
          label: "Portlar",
          render: (r) =>
            r.ports?.map((p) => `${p.port}/${p.protocol}`).join(", ") || DASH,
        },
        ageCol,
      ];
    case "Ingress":
      return [
        ns,
        {
          key: "class",
          label: "IngressClass",
          render: (r) => r.spec?.ingressClassName || DASH,
        },
        {
          key: "hosts",
          label: "Host’lar",
          render: (r) =>
            r.spec?.rules?.map((rule) => rule.host || "*").join(", ") || DASH,
        },
        {
          key: "tls",
          label: "TLS",
          render: (r) =>
            r.spec?.tls
              ?.map((t) => t.secretName || "Secret belirtilmedi")
              .join(", ") || DASH,
        },
        {
          key: "address",
          label: "Adres",
          render: (r) =>
            r.status?.loadBalancer?.ingress
              ?.map((i) => i.hostname || i.ip)
              .join(", ") || DASH,
        },
        ageCol,
      ];
    case "NetworkPolicy":
      return [
        ns,
        {
          key: "selector",
          label: "Pod selector",
          render: (r) =>
            Object.keys(r.spec?.podSelector?.matchLabels || {}).length
              ? Object.entries(r.spec.podSelector.matchLabels)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ")
              : JSON.stringify(r.spec?.podSelector || {}),
        },
        {
          key: "types",
          label: "Policy türü",
          render: (r) => r.spec?.policyTypes?.join(", ") || DASH,
        },
        {
          key: "ingress",
          label: "Ingress kuralı",
          render: (r) => r.spec?.ingress?.length ?? 0,
        },
        {
          key: "egress",
          label: "Egress kuralı",
          render: (r) => r.spec?.egress?.length ?? 0,
        },
        ageCol,
      ];
    case "StorageClass":
      return [
        {
          key: "provisioner",
          label: "Provisioner",
          render: (r) => r.provisioner || DASH,
        },
        {
          key: "reclaim",
          label: "Reclaim policy",
          render: (r) => r.reclaimPolicy || DASH,
        },
        {
          key: "binding",
          label: "Volume binding",
          render: (r) => r.volumeBindingMode || DASH,
        },
        {
          key: "expand",
          label: "Genişletme",
          render: (r) => (r.allowVolumeExpansion ? "İzinli" : "Kapalı"),
        },
        ageCol,
      ];
    case "Namespace":
      return [
        status,
        {
          key: "labels",
          label: "Label’lar",
          render: (r) =>
            Object.entries(r.metadata?.labels || {})
              .map(([k, v]) => `${k}=${v}`)
              .join(", ") || DASH,
        },
        ageCol,
      ];
    case "ServiceAccount":
      return [
        ns,
        {
          key: "bindings",
          label: "RoleBinding / ClusterRoleBinding",
          render: (r) =>
            resources
              .filter(
                (x) =>
                  ["RoleBinding", "ClusterRoleBinding"].includes(x.kind) &&
                  x.subjects?.some(
                    (s) =>
                      s.kind === "ServiceAccount" &&
                      s.name === r.metadata?.name &&
                      (s.namespace || x.metadata?.namespace) ===
                        r.metadata?.namespace,
                  ),
              )
              .map((x) => x.metadata.name)
              .join(", ") || DASH,
        },
        {
          key: "automount",
          label: "Token automount",
          render: (r) =>
            r.automountServiceAccountToken == null
              ? "Pod / varsayılan"
              : r.automountServiceAccountToken
                ? "Açık"
                : "Kapalı",
        },
        ageCol,
      ];
    case "CustomResourceDefinition":
      return [
        {
          key: "group",
          label: "API group",
          render: (r) => r.spec?.group || DASH,
        },
        {
          key: "kind",
          label: "Kind",
          render: (r) => r.spec?.names?.kind || DASH,
        },
        {
          key: "versions",
          label: "Sunulan sürümler",
          render: (r) =>
            r.spec?.versions
              ?.filter((v) => v.served)
              .map((v) => `${v.name}${v.storage ? " (storage)" : ""}`)
              .join(", ") || DASH,
        },
        { key: "scope", label: "Scope", render: (r) => r.spec?.scope || DASH },
        ageCol,
      ];
    case "Event":
      return [
        ns,
        status,
        { key: "reason", label: "Neden", render: (r) => r.reason || DASH },
        {
          key: "object",
          label: "İlgili kaynak",
          render: (r) => r.involvedObject?.name || r.regarding?.name || DASH,
        },
        {
          key: "message",
          label: "Açıklama",
          render: (r) => (
            <span className="cell-truncate" title={r.message || r.note}>
              {r.message || r.note || DASH}
            </span>
          ),
        },
        {
          key: "count",
          label: "Tekrar",
          render: (r) => r.count || r.series?.count || 1,
        },
        ageCol,
      ];
    default:
      return [
        { key: "kind", label: "Tür", render: (r) => r.kind },
        ns,
        status,
        {
          key: "detail",
          label: "Ayrıntı",
          render: (r) =>
            r.spec?.ingressClassName ||
            r.spec?.provisioner ||
            r.spec?.addressType ||
            r.spec?.scaleTargetRef?.name ||
            (r.spec?.ports
              ? `${r.spec.ports.length} port`
              : r.metadata?.ownerReferences?.map((o) => o.name).join(", ")) ||
            DASH,
        },
        ageCol,
      ];
  }
}
export default function ResourceTable({
  resources = [],
  allResources,
  selectedUID,
  onSelect,
  onAction,
  metrics,
  readOnly = true,
  loading = false,
  error,
  kind,
  title,
  hideToolbar = false,
  searchValue,
  onSearchChange,
  problemsValue,
  onProblemsChange,
}) {
  const [localSearch, setLocalSearch] = useState(""),
    [localProblems, setLocalProblems] = useState(false),
    [sort, setSort] = useState({ key: "name", direction: 1 }),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState(new Set()),
    [dense, setDense] = useState(false),
    [hidden, setHidden] = useState(new Set()),
    [showColumns, setShowColumns] = useState(false);
  const search = searchValue ?? localSearch,
    problems = problemsValue ?? localProblems;
  const setSearch = (value) => {
      setLocalSearch(value);
      onSearchChange?.(value);
    },
    setProblems = (value) => {
      setLocalProblems(value);
      onProblemsChange?.(value);
    };
  const resourceKind =
    kind ||
    (resources.length && resources.every((r) => r.kind === resources[0].kind)
      ? resources[0].kind
      : "");
  const columns = useMemo(
    () => columnsFor(resourceKind, allResources || resources, metrics),
    [resourceKind, allResources, resources, metrics],
  );
  const rows = useMemo(
    () =>
      resources
        .filter(
          (r) =>
            (!problems ||
              ["warning", "danger"].includes(resourceStatusLocal(r))) &&
            `${r.metadata?.name} ${r.metadata?.namespace || ""} ${r.kind} ${JSON.stringify(r.metadata?.labels || {})}`
              .toLocaleLowerCase("tr-TR")
              .includes(search.toLocaleLowerCase("tr-TR")),
        )
        .sort((a, b) => {
          const value = (r) => {
            const values = {
              name: r.metadata?.name,
              namespace: r.metadata?.namespace,
              age: Date.parse(r.metadata?.creationTimestamp) || 0,
              restarts: restartCount(r),
              status: resourceStatus(r).label,
              node: r.spec?.nodeName,
              owner: ownerLabel(r),
              cpu: quantityNumber(metricUsage(metricFor(r, metrics), "cpu")),
              memory: quantityNumber(
                metricUsage(metricFor(r, metrics), "memory"),
              ),
              replicas: r.spec?.replicas ?? r.status?.desiredNumberScheduled,
              updated: r.status?.updatedReplicas,
              image: r.spec?.template?.spec?.containers
                ?.map((c) => c.image)
                .join(", "),
              strategy: r.spec?.strategy?.type || r.spec?.updateStrategy?.type,
              kind: r.kind,
              version: r.status?.nodeInfo?.kubeletVersion,
              type: r.spec?.type || r.type,
              ip: r.spec?.clusterIP,
            };
            return (
              values[sort.key] ??
              (typeof columns.find((c) => c.key === sort.key)?.render(r) ===
              "object"
                ? ""
                : columns.find((c) => c.key === sort.key)?.render(r))
            );
          };
          const first = value(a),
            second = value(b);
          if (first == null && second != null) return 1;
          if (second == null && first != null) return -1;
          return (
            (typeof first === "number" && typeof second === "number"
              ? first - second
              : String(first ?? "").localeCompare(String(second ?? ""), "tr", {
                  numeric: true,
                })) * sort.direction
          );
        }),
    [resources, search, problems, sort, columns],
  );
  const pageSize = 50,
    pages = Math.max(1, Math.ceil(rows.length / pageSize)),
    safePage = Math.min(page, pages - 1),
    visibleRows = rows.slice(safePage * pageSize, (safePage + 1) * pageSize);
  useEffect(() => {
    setPage(0);
  }, [search, problems, resourceKind]);
  useEffect(() => {
    setSelected(
      (previous) =>
        new Set(
          [...previous].filter((uid) =>
            resources.some((r) => resourceUID(r) === uid),
          ),
        ),
    );
  }, [resources]);
  const toggle = (uid) =>
    setSelected((previous) => {
      const next = new Set(previous);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  const sortBy = (key) =>
    setSort((previous) => ({
      key,
      direction: previous.key === key ? -previous.direction : 1,
    }));
  return (
    <section
      className={`resource-table-panel ${dense ? "table-dense" : ""}`}
      aria-label={title || "Kaynak tablosu"}
    >
      {!hideToolbar && (
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={15} />
            <input
              aria-label="Tabloda ara"
              placeholder="Kaynaklarda ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button
            className={`button button-subtle ${problems ? "active" : ""}`}
            aria-pressed={problems}
            onClick={() => setProblems(!problems)}
          >
            <Filter size={14} />
            Sorunlular
          </button>
          <div className="table-column-menu">
            <button
              className="icon-button"
              aria-label="Sütunları seç"
              aria-expanded={showColumns}
              onClick={() => setShowColumns(!showColumns)}
            >
              <SlidersHorizontal size={16} />
            </button>
            {showColumns && (
              <div className="popover column-options">
                {columns.map((c) => (
                  <label key={c.key}>
                    <input
                      type="checkbox"
                      checked={!hidden.has(c.key)}
                      onChange={() =>
                        setHidden((prev) => {
                          const next = new Set(prev);
                          next.has(c.key)
                            ? next.delete(c.key)
                            : next.add(c.key);
                          return next;
                        })
                      }
                    />
                    {c.label}
                  </label>
                ))}
                <label>
                  <input
                    type="checkbox"
                    checked={dense}
                    onChange={(e) => setDense(e.target.checked)}
                  />
                  Sık görünüm
                </label>
              </div>
            )}
          </div>
          <span className="table-result-count">{rows.length} kaynak</span>
          {selected.size > 0 && (
            <button
              className="button button-danger"
              disabled={readOnly}
              onClick={() =>
                onAction?.(
                  "delete-many",
                  resources.filter((r) => selected.has(resourceUID(r))),
                )
              }
            >
              {selected.size} kaynağı sil
            </button>
          )}
        </div>
      )}
      {error && (
        <div role="alert" className="inline-alert alert-danger">
          {error}
        </div>
      )}
      <div className="table-scroll">
        <table className="resource-table">
          <thead>
            <tr>
              <th className="select-column">
                <input
                  aria-label="Bu sayfadaki kaynakları seç"
                  type="checkbox"
                  checked={
                    visibleRows.length > 0 &&
                    visibleRows.every((r) => selected.has(resourceUID(r)))
                  }
                  onChange={(e) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      visibleRows.forEach((r) =>
                        e.target.checked
                          ? next.add(resourceUID(r))
                          : next.delete(resourceUID(r)),
                      );
                      return next;
                    })
                  }
                />
              </th>
              <th>
                <button onClick={() => sortBy("name")}>
                  Ad
                  <ArrowUpDown size={12} />
                </button>
              </th>
              {columns
                .filter((c) => !hidden.has(c.key))
                .map((c) => (
                  <th key={c.key}>
                    <button onClick={() => sortBy(c.key)}>
                      {c.label}
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                ))}
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => {
              const uid = resourceUID(r);
              return (
                <tr
                  key={uid}
                  className={uid === selectedUID ? "selected-row" : ""}
                  aria-selected={uid === selectedUID}
                  onClick={(event) => {
                    if (!event.target.closest("button,input,a,select,textarea"))
                      onSelect(r);
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${r.metadata?.name} seç`}
                      checked={selected.has(uid)}
                      onChange={() => toggle(uid)}
                    />
                  </td>
                  <td>
                    <NameCell resource={r} onSelect={onSelect} />
                  </td>
                  {columns
                    .filter((c) => !hidden.has(c.key))
                    .map((c) => (
                      <td key={c.key}>{c.render(r)}</td>
                    ))}
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`${r.metadata?.name} ayrıntıları ve işlemleri`}
                      onClick={() => onSelect(r)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <div className="table-empty">
            <div className="empty-state-icon">
              <Search size={24} />
            </div>
            <strong>
              {loading
                ? "Kaynaklar yükleniyor…"
                : search || problems
                  ? "Filtreye uyan kaynak yok"
                  : "Bu kapsamda kaynak yok"}
            </strong>
            <p>
              {loading
                ? "Kubernetes API yanıtı bekleniyor."
                : search || problems
                  ? "Aramayı veya filtreleri değiştirin."
                  : "Namespace kapsamını değiştirin veya yeni bir kaynak oluşturun."}
            </p>
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          {rows.length ? safePage * pageSize + 1 : 0}–
          {Math.min((safePage + 1) * pageSize, rows.length)} / {rows.length}{" "}
          kaynak
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Önceki sayfa"
            disabled={!safePage}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {safePage + 1} / {pages}
          </span>
          <button
            className="icon-button"
            aria-label="Sonraki sayfa"
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
import { resourceStatus } from "./resourceUtils";
function resourceStatusLocal(r) {
  return resourceStatus(r).tone;
}
