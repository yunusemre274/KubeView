// Canonical objects are independent of scene transitions. resourceVersion is opaque.
import { scopeContains, scopeKey } from "./resourceScopes.js";
export const identity = (resource) => resource?.metadata?.uid;
export const address = (r) =>
  `${r.apiVersion}/${r.kind}/${r.metadata?.namespace || ""}/${r.metadata?.name}`;
export function initialState(sourceKey = "") {
  return {
    sourceKey,
    generation: null,
    resources: {},
    // Origin of the latest real snapshot, not a growing history of seen UIDs.
    // Scene consumers use it only for first-seen baseline presentation.
    snapshotUIDs: new Set(),
    scopes: {},
    tombstones: {},
    outOfScope: {},
    completeSnapshot: false,
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
const MAX_TOMBSTONES = 1000;
const MAX_OUT_OF_SCOPE = 1000;
function boundedScopeExits(exits, pinnedUIDs) {
  const pins = new Set(pinnedUIDs), ordinary = [], protectedEntries = [];
  for (const entry of Object.entries(exits))
    (pins.has(entry[0]) ? protectedEntries : ordinary).push(entry);
  return Object.fromEntries([...ordinary.slice(-MAX_OUT_OF_SCOPE), ...protectedEntries]);
}
function boundedTombstones(tombstones) {
  const entries = Object.entries(tombstones);
  return entries.length <= MAX_TOMBSTONES
    ? tombstones
    : Object.fromEntries(entries.slice(-MAX_TOMBSTONES));
}
export function reduceMessage(state, message, { pinnedUIDs = [] } = {}) {
  const payload = message.payload || message;
  const generation = message.generation ?? payload.generation;
  const context = message.context ?? payload.context;
  if (context !== undefined && state.context && context !== state.context)
    return state;
  if (message.type === "CONNECTION_PENDING") {
    return {
      ...state,
      snapshotReady: false,
      stale: true,
      scopes: Object.fromEntries(
        Object.entries(state.scopes || {}).map(([key, scope]) => [
          key,
          { ...scope, authoritative: false, status: "syncing" },
        ]),
      ),
    };
  }
  if (
    message.type !== "SNAPSHOT" &&
    state.generation !== null &&
    generation !== undefined &&
    generation !== state.generation
  )
    return state;
  if (message.type === "SNAPSHOT") {
    const objects = payload.resources || [];
    const scoped = Array.isArray(payload.scopes);
    const incoming = new Set(objects.filter(identity).map(identity));
    const exited = new Set((payload.outOfScope || []).map(identity).filter(Boolean));
    const resources = scoped ? { ...state.resources } : {};
    const tombstones = { ...state.tombstones };
    const timestamp = message.timestamp || new Date().toISOString();
    const outOfScope = { ...(state.outOfScope || {}) };
    for (const uid of exited) {
      delete resources[uid]; delete tombstones[uid]; outOfScope[uid] = timestamp;
    }
    for (const [uid, old] of Object.entries(state.resources)) {
      if (exited.has(uid)) continue;
      if (
        !incoming.has(uid) &&
        (!scoped ||
          payload.scopes.some(
            (scope) =>
              scope.authoritative &&
              scope.status === "synced" &&
              scopeContains(scope, old),
          ))
      ) {
        delete resources[uid];
        tombstones[uid] = { reason: "authoritative-absence", timestamp };
      }
    }
    const addresses = new Map(
      Object.entries(resources).map(([uid, resource]) => [
        address(resource),
        uid,
      ]),
    );
    for (const resource of objects.filter(identity)) {
      const uid = identity(resource);
      const oldUID = addresses.get(address(resource));
      if (oldUID && oldUID !== uid) {
        delete resources[oldUID];
        tombstones[oldUID] = { reason: "replaced", timestamp };
      }
      resources[uid] = resource;
      addresses.set(address(resource), uid);
      delete tombstones[uid];
      delete outOfScope[uid];
    }
    const retained = Object.values(resources);
    const scopes = scoped
      ? Object.fromEntries(
          Object.entries(state.scopes || {})
            .filter(([, scope]) =>
              retained.some((resource) => scopeContains(scope, resource)),
            )
            .map(([key, scope]) => [
              key,
              { ...scope, authoritative: false, status: "not-listed" },
            ]),
        )
      : {};
    for (const scope of payload.scopes || []) {
      const key = scopeKey(scope);
      scopes[key] = {
        ...scope,
        kind: scope.kind || state.scopes?.[key]?.kind || "",
        timestamp,
        generation,
        source: "watch",
      };
    }
    return {
      ...state,
      resources,
      snapshotUIDs: incoming,
      scopes,
      tombstones: boundedTombstones(tombstones),
      outOfScope: boundedScopeExits(outOfScope, pinnedUIDs),
      completeSnapshot: !scoped,
      generation,
      snapshotReady: true,
      synced: payload.synced !== false,
      upstream: payload.upstream !== false,
      stale: payload.synced === false,
      errors: payload.errors || [],
      lastUpdated: timestamp,
    };
  }
  if (message.type === "RESOURCE_EVENT") {
    const r = payload.object;
    if (!identity(r)) return state;
    const resources = { ...state.resources };
    let outOfScope = state.outOfScope || {};
    let tombstones = state.tombstones || {};
    let changedTombstones = false;
    const recordDeletion = (uid, reason) => {
      if (!changedTombstones) {
        tombstones = { ...tombstones };
        changedTombstones = true;
      }
      tombstones[uid] = { reason, timestamp: now };
    };
    const now = message.timestamp || new Date().toISOString();
    if (payload.action === "OUT_OF_SCOPE") {
      // Membership ended, not the Kubernetes object's life. Do not manufacture
      // deletion tombstones or a delete/fall animation for a selector change.
      delete resources[identity(r)];
      const retainedTombstones = { ...tombstones }; delete retainedTombstones[identity(r)];
      return { ...state, resources, tombstones: retainedTombstones, lastUpdated: now,
        outOfScope: boundedScopeExits({ ...outOfScope, [identity(r)]: now }, pinnedUIDs) };
    }
    if (outOfScope[identity(r)]) {
      outOfScope = { ...outOfScope };
      delete outOfScope[identity(r)];
    }
    if (payload.action === "DELETE") {
      delete resources[identity(r)];
      recordDeletion(identity(r), "delete-event");
    } else {
      // A recreated address has a new identity; delayed DELETE cannot remove it.
      for (const [uid, old] of Object.entries(resources))
        if (uid !== identity(r) && address(old) === address(r)) {
          delete resources[uid];
          recordDeletion(uid, "replaced");
        }
      resources[identity(r)] = r;
      if (tombstones[identity(r)]) {
        if (!changedTombstones) {
          tombstones = { ...tombstones };
          changedTombstones = true;
        }
        delete tombstones[identity(r)];
      }
    }
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
    const oldScope = payload.scope && state.scopes?.[scopeKey(payload.scope)];
    const scopeChanged =
      payload.scope &&
      (!oldScope ||
        oldScope.status !== "synced" ||
        !oldScope.authoritative ||
        oldScope.generation !== generation);
    return {
      ...state,
      resources,
      outOfScope,
      tombstones: changedTombstones
        ? boundedTombstones(tombstones)
        : tombstones,
      scopes: scopeChanged
        ? {
            ...state.scopes,
            [scopeKey(payload.scope)]: {
              ...payload.scope,
              authoritative: true,
              status: "synced",
              timestamp: now,
              generation,
              source: "watch",
            },
          }
        : state.scopes,
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
