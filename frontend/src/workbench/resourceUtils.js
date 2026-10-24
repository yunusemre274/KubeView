export const DASH = "—";
export function resourceUID(resource) {
  return (
    resource?.metadata?.uid ||
    `${resource?.kind}/${resource?.metadata?.namespace || ""}/${resource?.metadata?.name || ""}`
  );
}
export function condition(resource, type) {
  return resource?.status?.conditions?.find((c) => c.type === type);
}
export function podReady(resource) {
  const statuses = resource?.status?.containerStatuses || [];
  return {
    ready: statuses.filter((c) => c.ready).length,
    total: resource?.spec?.containers?.length || 0,
  };
}
export function resourceStatus(resource) {
  if (!resource) return { label: "Bilinmiyor", tone: "neutral" };
  if (resource.metadata?.deletionTimestamp)
    return { label: "Sonlandırılıyor", tone: "warning" };
  const { kind, spec = {}, status = {} } = resource;
  if (kind === "Pod") {
    const containers = [
      ...(status.initContainerStatuses || []),
      ...(status.containerStatuses || []),
    ];
    const waiting = containers.find((c) => c.state?.waiting?.reason);
    if (waiting)
      return {
        label: waiting.state.waiting.reason,
        tone: /BackOff|Error|Invalid|Crash/.test(waiting.state.waiting.reason)
          ? "danger"
          : "warning",
      };
    if (status.phase === "Succeeded")
      return { label: "Tamamlandı", tone: "success" };
    if (status.phase === "Failed")
      return { label: status.reason || "Failed", tone: "danger" };
    if (!spec.nodeName)
      return {
        label: condition(resource, "PodScheduled")?.reason || "Atama bekliyor",
        tone: "warning",
      };
    if (status.phase === "Running")
      return condition(resource, "Ready")?.status === "True"
        ? { label: "Running", tone: "success" }
        : { label: "Running · Hazır değil", tone: "warning" };
    return {
      label: status.phase || "Bilinmiyor",
      tone: status.phase === "Pending" ? "warning" : "neutral",
    };
  }
  if (kind === "Node") {
    const ready = condition(resource, "Ready");
    return {
      label:
        ready?.status === "True"
          ? spec.unschedulable
            ? "Ready · Cordon"
            : "Ready"
          : ready?.status === "False"
            ? "NotReady"
            : "Ready Unknown",
      tone:
        ready?.status === "True"
          ? spec.unschedulable
            ? "warning"
            : "success"
          : ready?.status === "False"
            ? "danger"
            : "warning",
    };
  }
  if (["Deployment", "StatefulSet", "ReplicaSet"].includes(kind)) {
    const desired = spec.replicas ?? 1;
    const observed =
      (status.observedGeneration ?? -1) >= (resource.metadata?.generation ?? 0);
    return {
      label:
        observed && (status.readyReplicas || 0) === desired
          ? "Hazır"
          : "Uygulanıyor",
      tone:
        observed && (status.readyReplicas || 0) === desired
          ? "success"
          : "warning",
    };
  }
  if (kind === "DaemonSet")
    return {
      label:
        status.numberReady === status.desiredNumberScheduled
          ? "Hazır"
          : "Uygulanıyor",
      tone:
        status.numberReady === status.desiredNumberScheduled
          ? "success"
          : "warning",
    };
  if (kind === "Job")
    return condition(resource, "Complete")?.status === "True"
      ? { label: "Tamamlandı", tone: "success" }
      : condition(resource, "Failed")?.status === "True"
        ? { label: "Başarısız", tone: "danger" }
        : { label: "Çalışıyor", tone: "warning" };
  if (kind === "CronJob")
    return {
      label: spec.suspend ? "Askıya alındı" : "Zamanlandı",
      tone: spec.suspend ? "warning" : "neutral",
    };
  if (kind === "Event")
    return {
      label: resource.type || "Bilinmiyor",
      tone: resource.type === "Warning" ? "warning" : "neutral",
    };
  if (status.phase)
    return {
      label: status.phase,
      tone: ["Bound", "Active", "Available"].includes(status.phase)
        ? "success"
        : ["Failed", "Lost"].includes(status.phase)
          ? "danger"
          : "neutral",
    };
  return { label: "Gözlendi", tone: "neutral" };
}
export function restartCount(resource) {
  return (resource?.status?.containerStatuses || []).reduce(
    (n, c) => n + (c.restartCount || 0),
    0,
  );
}
export function age(resource, now = Date.now()) {
  const created = Date.parse(resource?.metadata?.creationTimestamp);
  if (!Number.isFinite(created)) return DASH;
  const seconds = Math.max(0, Math.floor((now - created) / 1000));
  return seconds < 60
    ? `${seconds} sn`
    : seconds < 3600
      ? `${Math.floor(seconds / 60)} dk`
      : seconds < 86400
        ? `${Math.floor(seconds / 3600)} sa`
        : `${Math.floor(seconds / 86400)} gün`;
}
export function quantityNumber(value) {
  if (value == null || value === "") return null;
  const match = String(value).match(
    /^([+-]?(?:\d+\.?\d*|\.\d+))([eE][+-]?\d+|[a-zA-Z]*)$/,
  );
  if (!match) return null;
  const powers = {
    n: 1e-9,
    u: 1e-6,
    m: 1e-3,
    k: 1e3,
    K: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    P: 1e15,
    E: 1e18,
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    Pi: 1024 ** 5,
    Ei: 1024 ** 6,
    "": 1,
  };
  const scale = /^[eE][+-]?\d+$/.test(match[2])
    ? 10 ** Number(match[2].slice(1))
    : powers[match[2]];
  const number = Number(match[1]) * scale;
  return Number.isFinite(number) ? number : null;
}
export function formatCPU(value) {
  const n = quantityNumber(value);
  return n == null
    ? DASH
    : n < 1
      ? `${Math.round(n * 1000)}m`
      : `${Number(n.toFixed(2))} CPU`;
}
export function formatMemory(value) {
  const n = quantityNumber(value);
  return n == null
    ? DASH
    : n >= 1024 ** 3
      ? `${Number((n / 1024 ** 3).toFixed(2))} Gi`
      : `${Number((n / 1024 ** 2).toFixed(1))} Mi`;
}
export function metricFor(resource, metrics) {
  if (!metrics?.available) return null;
  const items = resource?.kind === "Node" ? metrics.nodes : metrics.pods;
  const list = Array.isArray(items) ? items : items?.items || [];
  return (
    list.find(
      (m) =>
        (m.metadata?.name || m.name) === resource?.metadata?.name &&
        (resource.kind === "Node" ||
          (m.metadata?.namespace || m.namespace) ===
            resource.metadata?.namespace),
    ) || null
  );
}
export function metricUsage(metric, key) {
  if (!metric) return null;
  if (metric.usage?.[key] != null) return metric.usage[key];
  if (metric[key] != null) return metric[key];
  if (metric[`${key}_usage`] != null) return metric[`${key}_usage`];
  if (!metric.containers?.length) return null;
  const values = metric.containers.map((c) => quantityNumber(c.usage?.[key]));
  return values.some((v) => v == null)
    ? null
    : String(values.reduce((sum, v) => sum + v, 0));
}
export function ownerLabel(resource) {
  return (
    (resource?.metadata?.ownerReferences || [])
      .map((o) => `${o.kind}/${o.name}`)
      .join(", ") || "Bağımsız"
  );
}
export function cloneResource(resource) {
  return JSON.parse(JSON.stringify(resource));
}
export function editableResource(resource) {
  const result = cloneResource(resource);
  delete result.status;
  if (result.metadata) {
    delete result.metadata.managedFields;
  }
  return result;
}
export function validateResources(containers) {
  const errors = [];
  for (const c of containers)
    for (const type of ["cpu", "memory"]) {
      const request = c.resources?.requests?.[type];
      const limit = c.resources?.limits?.[type];
      const r = quantityNumber(request),
        l = quantityNumber(limit);
      if (request && (r == null || r < 0))
        errors.push(
          `${c.name}: ${type} request geçerli ve pozitif bir Kubernetes quantity olmalı.`,
        );
      if (limit && (l == null || l <= 0))
        errors.push(
          `${c.name}: ${type} limit sıfırdan büyük bir Kubernetes quantity olmalı.`,
        );
      if (r != null && l != null && r > l)
        errors.push(`${c.name}: ${type} request, limit değerini aşamaz.`);
      if (type === "memory" && [request, limit].some((v) => v && /m$/.test(v)))
        errors.push(
          `${c.name}: bellek için Mi/Gi gibi açık bir birim kullanın; m, milibyte anlamına gelir.`,
        );
    }
  return errors;
}
