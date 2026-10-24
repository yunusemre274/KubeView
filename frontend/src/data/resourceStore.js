// Canonical objects are independent of scene transitions. resourceVersion is opaque.
export const identity = (resource) => resource?.metadata?.uid;
export const address = (r) =>
  `${r.apiVersion}/${r.kind}/${r.metadata?.namespace || ""}/${r.metadata?.name}`;
export function initialState(sourceKey = "") {
  return {
    sourceKey,
    generation: null,
    resources: {},
    snapshotReady: false,
    synced: false,
    upstream: false,
    isConnected: false,
    stale: true,
    errors: [],
    lastUpdated: null,
    events: [],
    metrics: null,
    metricHistory: [],
  };
}
export function reduceMessage(state, message) {
  const payload = message.payload || message;
  const generation = message.generation ?? payload.generation;
  if (
    message.type !== "SNAPSHOT" &&
    state.generation !== null &&
    generation !== undefined &&
    generation !== state.generation
  )
    return state;
  if (message.type === "SNAPSHOT") {
    const objects = payload.resources || [];
    const resources = Object.fromEntries(
      objects.filter(identity).map((r) => [identity(r), r]),
    );
    return {
      ...state,
      resources,
      generation,
      snapshotReady: true,
      synced: payload.synced !== false,
      upstream: payload.upstream !== false,
      stale: payload.synced === false,
      errors: payload.errors || [],
      lastUpdated: message.timestamp || new Date().toISOString(),
    };
  }
  if (message.type === "RESOURCE_EVENT") {
    const r = payload.object;
    if (!identity(r)) return state;
    const resources = { ...state.resources };
    if (payload.action === "DELETE") delete resources[identity(r)];
    else {
      // A recreated address has a new identity; delayed DELETE cannot remove it.
      for (const [uid, old] of Object.entries(resources))
        if (uid !== identity(r) && address(old) === address(r))
          delete resources[uid];
      resources[identity(r)] = r;
    }
    const now = message.timestamp || new Date().toISOString();
    const event = {
      id: `${identity(r)}:${r.metadata.resourceVersion}:${payload.action}`,
      timestamp: now,
      action: payload.action,
      resource: r,
      kind: r.kind,
      name: r.metadata.name,
      namespace: r.metadata.namespace,
      message: r.message || `${r.kind} ${r.metadata.name} · ${payload.action}`,
    };
    return {
      ...state,
      resources,
      lastUpdated: now,
      events: [
        event,
        ...state.events.filter(
          (e) => Date.parse(now) - Date.parse(e.timestamp) < 3600000,
        ),
      ].slice(0, 500),
    };
  }
  if (message.type === "STATUS" || message.type === "SNAPSHOT_READY") {
    const upstream =
      payload.upstream ??
      payload.apiReachable ??
      payload.connected ??
      payload.ready ??
      state.upstream;
    return {
      ...state,
      upstream,
      synced: payload.synced ?? state.synced,
      stale: !upstream || payload.synced === false,
      snapshotReady:
        message.type === "SNAPSHOT_READY" ? true : state.snapshotReady,
      errors:
        payload.errors || (payload.error ? [payload.error] : state.errors),
    };
  }
  if (message.type === "ERROR")
    return {
      ...state,
      stale: true,
      upstream: false,
      errors: [payload.message || payload.error || "Bağlantı hatası"],
    };
  return state;
}
export function appendMetrics(state, metrics) {
  const timestamp = metrics.timestamp || new Date().toISOString();
  const cutoff = Date.parse(timestamp) - 3600000;
  return {
    ...state,
    metrics,
    metricHistory: [
      ...state.metricHistory.filter((s) => Date.parse(s.timestamp) >= cutoff),
      { ...metrics, timestamp },
    ].slice(-241),
  };
}
export function quantity(value) {
  if (value === undefined || value === null || value === "") return null;
  const match = String(value).match(/^([+-]?[0-9.]+)([a-zA-Z]*)$/);
  if (!match) return null;
  const unit = {
    n: 1e-9,
    u: 1e-6,
    m: 1e-3,
    k: 1e3,
    K: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
  };
  const factor = match[2] ? unit[match[2]] : 1;
  return factor === undefined ? null : Number(match[1]) * factor;
}
export function ready(r) {
  return (
    r.status?.conditions?.find((c) => c.type === "Ready")?.status === "True"
  );
}
export function hasProblem(r) {
  if (r.metadata?.deletionTimestamp) return true;
  if (r.kind === "Node")
    return (
      !ready(r) ||
      r.status?.conditions?.some(
        (c) => c.type.endsWith("Pressure") && c.status === "True",
      )
    );
  if (r.kind === "Pod")
    return (
      !["Succeeded", "Completed"].includes(r.status?.phase) &&
      (!ready(r) ||
        r.status?.containerStatuses?.some((c) => c.state?.waiting?.reason))
    );
  return (
    r.status?.conditions?.some(
      (c) =>
        c.status === "True" && ["Failed", "ReplicaFailure"].includes(c.type),
    ) || false
  );
}
