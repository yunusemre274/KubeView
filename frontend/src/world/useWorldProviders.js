import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = Object.freeze([]);
export const EMPTY_MEASURED_FLOWS = Object.freeze({
  status: "disabled",
  provider: "hubble",
  windowSeconds: 10,
  observedAt: null,
  updatedAt: null,
  dropped: null,
  summarized: null,
  flows: EMPTY_ROWS,
  clientOmitted: 0,
});
const WAITING_FLOWS = Object.freeze({
  ...EMPTY_MEASURED_FLOWS,
  status: "connecting",
});
const MAX_UI_OPERATIONS = 32;
const MAX_UI_FLOWS = 1024;
const terminal = new Set([
  "succeeded",
  "ready",
  "failed",
  "cancelled",
  "canceled",
  "rejected",
  "completed",
]);
export const provisionTerminal = (operation) => terminal.has(operation?.status);
let fallbackSequence = 0;
const uuid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `kv-${Date.now().toString(36)}-${++fallbackSequence}`;
const text = (value) => (typeof value === "string" ? value : null);
const errorText = (error) =>
  String(error?.message || error || "Sağlayıcı isteği tamamlanamadı").slice(
    0,
    1500,
  );
const count = (value) =>
  Number.isSafeInteger(value) && value >= 0 ? value : null;

function endpoint(value = {}) {
  value = value || {};
  return {
    uid: text(value.uid),
    name: text(value.name),
    namespace: text(value.namespace),
    nodeName: text(value.nodeName),
    nodeUID: text(value.nodeUID),
    ip: text(value.ip),
    port:
      Number.isInteger(value.port) && value.port >= 0 && value.port <= 65535
        ? value.port
        : null,
    containerName: text(value.containerName),
    identityStatus: text(value.identityStatus),
  };
}
export function normalizeMeasuredFlows(value = {}) {
  const supplied = Array.isArray(value.flows) ? value.flows : [];
  const rows = supplied
    .slice(0, MAX_UI_FLOWS)
    .filter((flow) => flow && typeof flow.id === "string")
    .map((flow) => ({
      id: flow.id,
      source: endpoint(flow.source),
      destination: endpoint(flow.destination),
      protocol: text(flow.protocol),
      transportProtocol: text(flow.transportProtocol),
      verdict: text(flow.verdict),
      direction: text(flow.direction),
      firstObserved: text(flow.firstObserved),
      lastObserved: text(flow.lastObserved),
      eventCount: count(flow.eventCount),
      latencyMs:
        typeof flow.latencyMs === "number" &&
        Number.isFinite(flow.latencyMs) &&
        flow.latencyMs >= 0
          ? flow.latencyMs
          : null,
      httpCode: count(flow.httpCode),
      httpProtocol: text(flow.httpProtocol),
      dnsRcode: count(flow.dnsRcode),
      dropReason: text(flow.dropReason),
      isReply: typeof flow.isReply === "boolean" ? flow.isReply : null,
    }));
  // Never retain provider payload/header/URL fields in world or panel state.
  return {
    status: text(value.status) || "unknown",
    provider: "hubble",
    windowSeconds:
      typeof value.windowSeconds === "number" &&
      Number.isFinite(value.windowSeconds) &&
      value.windowSeconds > 0
        ? value.windowSeconds
        : null,
    context: text(value.context),
    clusterUID: text(value.clusterUID),
    namespace: text(value.namespace),
    units: text(value.units),
    observedAt: text(value.observedAt),
    updatedAt: text(value.updatedAt),
    dropped: count(value.dropped),
    summarized: count(value.summarized),
    totalFlowGroups: count(value.totalFlowGroups),
    omittedGroups: count(value.omittedGroups),
    filteredEvents: count(value.filteredEvents),
    providerLostEvents: count(value.providerLostEvents),
    mappingDropped: count(value.mappingDropped),
    duplicateEvents: count(value.duplicateEvents),
    flows: rows,
    clientOmitted: Math.max(0, supplied.length - rows.length),
    error: text(value.error) || text(value.reason),
  };
}
function operation(value) {
  if (!value || typeof value.id !== "string") return null;
  const safe = {};
  for (const key of [
    "id",
    "status",
    "stage",
    "stageSource",
    "expectedName",
    "message",
    "reason",
    "context",
    "profile",
    "clusterUID",
    "idempotencyKey",
    "createdAt",
    "updatedAt",
    "startedAt",
    "finishedAt",
    "nodeName",
    "nodeUID",
  ])
    if (typeof value[key] === "string") safe[key] = value[key];
  if (typeof value.cancelRequested === "boolean")
    safe.cancelRequested = value.cancelRequested;
  const nodes = Array.isArray(value.nodes)
    ? value.nodes
    : value.node
      ? [value.node]
      : [];
  safe.nodes = nodes.slice(0, 32).map((node) => ({
    name: text(node.name || node.metadata?.name),
    uid: text(node.uid || node.metadata?.uid),
    ready: typeof node.ready === "boolean" ? node.ready : text(node.ready),
  }));
  safe.history = (Array.isArray(value.history) ? value.history : [])
    .slice(-16)
    .map((row) => ({
      status: text(row.status),
      stage: text(row.stage),
      timestamp: text(row.timestamp || row.at),
      message: text(row.message),
    }));
  return safe;
}
export function mergeProvisionOperations(previous = [], incoming = []) {
  const records = new Map(previous.map((row) => [row.id, row]));
  for (const row of incoming) {
    const safe = operation(row);
    if (safe) records.set(safe.id, safe);
  }
  return [...records.values()]
    .sort(
      (a, b) =>
        (Date.parse(b.createdAt || b.startedAt) || 0) -
        (Date.parse(a.createdAt || a.startedAt) || 0),
    )
    .slice(0, MAX_UI_OPERATIONS);
}
function normalizeProviders(value = {}) {
  const local = value.minikube || {},
    hubble = value.hubble || {};
  const configuration = local.configuration ? {} : null;
  for (const key of ["profile", "context", "clusterUID", "maxNodes", "driver"])
    if (
      configuration &&
      ["string", "number"].includes(typeof local.configuration[key])
    )
      configuration[key] = local.configuration[key];
  return {
    minikube: {
      available: local.available === true,
      canAdd: local.canAdd === true,
      configuration,
      reason: text(local.reason),
    },
    hubble: {
      available: hubble.available === true,
      configured: hubble.configured === true,
      reason: text(hubble.reason),
      status:
        typeof hubble.status === "string"
          ? hubble.status
          : hubble.status?.state || hubble.status?.status || null,
    },
  };
}
const modelFor = (owner) => ({
  owner,
  providers: null,
  operations: EMPTY_ROWS,
  flows: EMPTY_MEASURED_FLOWS,
  flowKey: "",
  error: "",
  busy: false,
  uncertain: false,
});

export default function useWorldProviders({
  connection,
  namespace = "all",
  selectedUID = null,
  trafficEnabled = false,
  managementVisible = false,
}) {
  const api = connection.api;
  const owner =
    connection.sourceKey || `${connection.mode}:${connection.context}`;
  const live = connection.mode === "live";
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const [model, setModel] = useState(() => modelFor(owner));
  const [revision, setRevision] = useState(0);
  const [streamRevision, setStreamRevision] = useState(0);
  const attempt = useRef(null),
    statusAbort = useRef(null),
    flowAbort = useRef(null),
    mutationAbort = useRef(null);
  const current = model.owner === owner ? model : modelFor(owner);
  const currentRef = useRef(current);
  currentRef.current = current;
  const selectedUIDRef = useRef(selectedUID);
  selectedUIDRef.current = selectedUID;
  const stream = api?.streamSession?.();
  const flowKey = `${owner}|${namespace}|${stream?.key || "no-session"}|${streamRevision}`;
  const flowKeyRef = useRef(flowKey);
  flowKeyRef.current = flowKey;
  const commit = useCallback((captured, patch) => {
    if (ownerRef.current !== captured) return;
    setModel((previous) => {
      if (ownerRef.current !== captured) return previous;
      const base = previous.owner === captured ? previous : modelFor(captured);
      const next = { ...base };
      for (const [key, value] of Object.entries(patch))
        next[key] =
          ["providers", "operations", "flows"].includes(key) &&
          JSON.stringify(base[key]) === JSON.stringify(value)
            ? base[key]
            : value;
      return Object.keys(next).every((key) => next[key] === base[key])
        ? base
        : next;
    });
  }, []);
  const commitOperations = useCallback((captured, rows) => {
    if (ownerRef.current !== captured) return;
    setModel((previous) => {
      if (ownerRef.current !== captured) return previous;
      const base = previous.owner === captured ? previous : modelFor(captured);
      const merged = mergeProvisionOperations(base.operations, rows);
      const pending = attempt.current;
      const found =
        pending?.owner === captured &&
        merged.find(
          (row) =>
            row.id === pending.operationID ||
            row.idempotencyKey === pending.key,
        );
      if (found) {
        pending.operationID = found.id;
        pending.confirmed = true;
      }
      const uncertain = found ? false : base.uncertain;
      return JSON.stringify(merged) === JSON.stringify(base.operations) &&
        uncertain === base.uncertain
        ? base
        : { ...base, operations: merged, uncertain };
    });
  }, []);
  const refreshProviders = useCallback(async () => {
    if (!live || !api) return;
    statusAbort.current?.abort();
    const abort = new AbortController();
    statusAbort.current = abort;
    try {
      const value = await api.request("/api/providers", {
        signal: abort.signal,
      });
      if (abort.signal.aborted || ownerRef.current !== owner) return;
      commit(owner, { providers: normalizeProviders(value), error: "" });
      commitOperations(owner, value.minikube?.operations || []);
    } catch (error) {
      if (!abort.signal.aborted) commit(owner, { error: errorText(error) });
    } finally {
      if (statusAbort.current === abort) statusAbort.current = null;
    }
  }, [api, live, owner, commit, commitOperations]);
  useEffect(() => {
    attempt.current = null;
    setModel(modelFor(owner));
    return () => {
      statusAbort.current?.abort();
      mutationAbort.current?.abort();
    };
  }, [owner]);
  useEffect(() => {
    if (!trafficEnabled) return;
    return api?.subscribeStreamSession?.(() => {
      flowAbort.current?.abort();
      setStreamRevision((value) => value + 1);
    });
  }, [api, trafficEnabled]);
  const active =
    current.uncertain ||
    current.operations.some((row) => !provisionTerminal(row));
  const workersReadable =
    live &&
    !connection.readOnly &&
    (current.providers?.minikube?.canAdd === true || active);
  useEffect(() => {
    if (live && (managementVisible || trafficEnabled || active))
      refreshProviders();
    return () => statusAbort.current?.abort();
  }, [
    refreshProviders,
    managementVisible,
    trafficEnabled,
    active,
    revision,
    live,
  ]);
  useEffect(() => {
    if (!workersReadable || !api || (!managementVisible && !active)) return;
    let cancelled = false,
      timer,
      abort;
    const poll = async () => {
      abort = new AbortController();
      try {
        const value = await api.request("/api/providers/minikube/workers", {
          signal: abort.signal,
        });
        if (cancelled || ownerRef.current !== owner) return;
        commitOperations(owner, value.operations || []);
      } catch (error) {
        if (!cancelled && !abort.signal.aborted)
          commit(owner, { error: errorText(error) });
      }
      if (!cancelled) timer = setTimeout(poll, 1000);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      abort?.abort();
    };
  }, [
    api,
    workersReadable,
    managementVisible,
    active,
    owner,
    revision,
    commit,
    commitOperations,
  ]);
  useEffect(() => {
    if (!live || !api || !trafficEnabled) return;
    if (stream && !stream.ready) {
      commit(owner, { flows: WAITING_FLOWS, flowKey });
      return;
    }
    const subscription = uuid();
    const query = new URLSearchParams({
      namespace: namespace || "all",
      subscription,
    });
    const path = `/api/flows?${query}`;
    const pinnedURL = api.url
      ? api.url(path)
      : new URL(path, window.location.href).toString();
    let cancelled = false,
      timer,
      abort,
      leaseID;
    commit(owner, { flows: WAITING_FLOWS, flowKey });
    const poll = async () => {
      abort = new AbortController();
      flowAbort.current = abort;
      try {
        // Selection only prioritizes the next bounded result page. It must not
        // restart the scoped collector lease or discard its measured history.
        const requestQuery = new URLSearchParams(query);
        if (selectedUIDRef.current)
          requestQuery.set("selectedUID", selectedUIDRef.current);
        const value = await api.request(`/api/flows?${requestQuery}`, {
          signal: abort.signal,
        });
        if (
          cancelled ||
          ownerRef.current !== owner ||
          flowKeyRef.current !== flowKey
        )
          return;
        leaseID = value.leaseID || value.leaseId || leaseID;
        commit(owner, { flows: normalizeMeasuredFlows(value), flowKey });
      } catch (error) {
        if (
          !cancelled &&
          !abort.signal.aborted &&
          flowKeyRef.current === flowKey
        )
          commit(owner, {
            flows: {
              ...(currentRef.current.flowKey === flowKey
                ? currentRef.current.flows
                : EMPTY_MEASURED_FLOWS),
              status: "unavailable",
              error: errorText(error),
            },
            flowKey,
          });
      }
      if (!cancelled) timer = setTimeout(poll, 1000);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      abort?.abort();
      if (flowAbort.current === abort) flowAbort.current = null;
      // Pin the old context/scope URL before a source change. Current API guards
      // correctly reject old reads; cleanup must release only this old lease.
      const url = new URL(pinnedURL, window.location.href);
      if (leaseID) url.searchParams.set("leaseID", leaseID);
      const closing = new AbortController(),
        deadline = setTimeout(() => closing.abort(), 2000);
      fetch(url, {
        method: "DELETE",
        credentials: "same-origin",
        keepalive: true,
        signal: closing.signal,
      })
        .catch(() => {})
        .finally(() => clearTimeout(deadline));
    };
  }, [
    api,
    live,
    trafficEnabled,
    namespace,
    owner,
    flowKey,
    stream?.ready,
    revision,
    commit,
  ]);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const addWorker = useCallback(async () => {
    if (!live || connection.readOnly)
      throw new Error("Worker ekleme bu bağlantıda kapalı.");
    let pending = attempt.current;
    if (pending?.owner === owner && pending.promise) return pending.promise;
    const known =
      pending?.owner === owner &&
      currentRef.current.operations.find(
        (row) => row.id === pending.operationID,
      );
    if (known && !provisionTerminal(known)) return known;
    const reuse = pending?.owner === owner && !pending.confirmed;
    if (!reuse && !currentRef.current.providers?.minikube?.canAdd)
      throw new Error(
        currentRef.current.providers?.minikube?.reason ||
          "Yerel sağlayıcı worker eklemeye uygun değil.",
      );
    if (!reuse) pending = { owner, key: uuid(), confirmed: false };
    attempt.current = pending;
    const abort = new AbortController();
    mutationAbort.current = abort;
    commit(owner, { busy: true, error: "" });
    pending.promise = (async () => {
      try {
        const value = await api.request("/api/providers/minikube/workers", {
          method: "POST",
          body: { action: "add-worker", idempotencyKey: pending.key },
          signal: abort.signal,
        });
        if (!value.operation?.id)
          throw new Error(
            "Sağlayıcı işlem kimliği doğrulanamadı; aynı istek anahtarı korunuyor.",
          );
        pending.operationID = value.operation.id;
        pending.confirmed = true;
        if (ownerRef.current === owner && !abort.signal.aborted) {
          commitOperations(owner, [value.operation]);
          commit(owner, { uncertain: false });
          refresh();
        }
        return value.operation;
      } catch (error) {
        const rejected = [400, 401, 403, 404, 405, 422].includes(error.status);
        pending.confirmed = rejected;
        if (!abort.signal.aborted)
          commit(owner, { error: errorText(error), uncertain: !rejected });
        throw error;
      } finally {
        pending.promise = null;
        if (mutationAbort.current === abort) mutationAbort.current = null;
        commit(owner, { busy: false });
      }
    })();
    return pending.promise;
  }, [
    api,
    live,
    connection.readOnly,
    owner,
    commit,
    commitOperations,
    refresh,
  ]);
  const cancelWorker = useCallback(
    async (id) => {
      if (!live || connection.readOnly || !id) return;
      const abort = new AbortController();
      mutationAbort.current?.abort();
      mutationAbort.current = abort;
      commit(owner, { busy: true, error: "" });
      try {
        const value = await api.request("/api/providers/minikube/workers", {
          method: "POST",
          body: { action: "cancel", id },
          signal: abort.signal,
        });
        if (!abort.signal.aborted) {
          commitOperations(
            owner,
            value.operation ? [value.operation] : value.operations || [],
          );
          refresh();
        }
      } catch (error) {
        if (!abort.signal.aborted) commit(owner, { error: errorText(error) });
        throw error;
      } finally {
        if (mutationAbort.current === abort) mutationAbort.current = null;
        commit(owner, { busy: false });
      }
    },
    [api, live, connection.readOnly, owner, commit, commitOperations, refresh],
  );
  const providers = useMemo(
    () =>
      current.providers && {
        ...current.providers,
        clientRequest: { uncertain: current.uncertain },
      },
    [current.providers, current.uncertain],
  );
  return {
    providers,
    provisionOperations: current.operations,
    measuredFlows:
      live && trafficEnabled
        ? current.flowKey === flowKey
          ? current.flows
          : WAITING_FLOWS
        : EMPTY_MEASURED_FLOWS,
    refresh,
    addWorker,
    cancelWorker,
    error: current.error,
    busy: current.busy,
  };
}
