import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
} from "react";
import {
  initialState,
  reduceMessage,
  appendMetrics,
} from "../data/resourceStore";
import { demoResources, demoMetrics } from "../data/demo";
import { buildResourceIndex } from "../data/resourceIndex.js";
import {
  MAX_RESOURCE_SCOPES,
  resourceScope,
  resourceObservation,
  scopeContains,
  scopeCoversScope,
  scopeKey,
  scopeSubscription,
  mergeResourceList,
  narrowNamespaceState,
} from "../data/resourceScopes.js";
const EMPTY_RESOURCES = Object.freeze([]);

const Context = createContext(null);
// Legacy single-source adapter. Workspace production instances are independent
// managers created below; this export remains the compatibility/test adapter.
export const singletonManager = {
  state: {
    ...initialState(),
    contexts: [],
    context: "",
    mode: "live",
    configured: false,
    readOnly: true,
    discovery: [],
    connectionChecks: null,
    connectionChecking: false,
    serverReadOnly: true,
    managementAvailable: false,
    managementEnabled: false,
  },
  listeners: new Set(),
  socket: null,
  epoch: 0,
  retry: null,
  poll: null,
  demoTimers: [],
  started: false,
  storeTimings: [],
  scopeSubscriptions: new Map(),
  scopeRequests: new Map(),
  refreshQueued: false,
  socketSerial: 0,
  streamListeners: new Set(),
  scopeRevision: 0,
  metricsAbort: null,
  connectionAbort: null,
  requests: new Set(),
  managementReset: Promise.resolve(),
  managementIntent: false,
  streamSession() {
    return {
      key: `${this.epoch}:${this.socketSerial}:${this.state.generation ?? "pending"}`,
      ready:
        this.state.mode === "live" &&
        this.state.isConnected &&
        this.state.snapshotReady,
    };
  },
  notifyStreamSession() {
    const session = this.streamSession();
    this.streamListeners.forEach((listener) => listener(session));
  },
  watchCovers(scope) {
    return Object.values(this.state.scopes || {}).some(
      (known) =>
        known.source === "watch" &&
        known.authoritative &&
        known.status === "synced" &&
        scopeCoversScope(known, scope),
    );
  },
  scheduleScopeRefresh() {
    if (this.refreshQueued || this.state.mode !== "live") return;
    this.refreshQueued = true;
    const epoch = this.epoch;
    queueMicrotask(() => {
      this.refreshQueued = false;
      if (epoch === this.epoch && this.started) this.connect();
    });
  },
  registerScope(scope, retain = false) {
    const key = scopeKey(scope);
    const existing = this.scopeSubscriptions.get(key);
    if (existing) {
      existing.touched = Date.now();
      const known = this.state.scopes?.[key];
      if (
        known &&
        ["forbidden", "unavailable", "not-listed"].includes(known.status)
      )
        this.scheduleScopeRefresh();
      return existing;
    }
    const covered = this.watchCovers(scope);
    if (covered && !retain) return null;
    // One served version per GR: UID-only canonical objects must not oscillate
    // between e.g. HPA v1/v2 from competing informers.
    for (const [otherKey, entry] of this.scopeSubscriptions)
      if (
        entry.scope.group === scope.group &&
        entry.scope.resource === scope.resource &&
        entry.scope.version !== scope.version
      )
        this.scopeSubscriptions.delete(otherKey);
    if (this.scopeSubscriptions.size >= MAX_RESOURCE_SCOPES) {
      const victim = [...this.scopeSubscriptions.entries()]
        .filter(([, entry]) => !entry.references)
        .sort((a, b) => a[1].touched - b[1].touched)[0];
      if (!victim)
        throw new Error(
          "32 kaynak kapsamı zaten açık. Yeni kapsam için bir kaynak penceresini kapatın.",
        );
      this.scopeSubscriptions.delete(victim[0]);
      const scopes = { ...this.state.scopes };
      delete scopes[victim[0]];
      const resources = { ...this.state.resources };
      for (const [uid, resource] of Object.entries(resources))
        if (
          scopeContains(victim[1].scope, resource) &&
          !Object.values(scopes).some(
            (known) => known.authoritative && scopeContains(known, resource),
          )
        )
          delete resources[uid];
      this.publish({ scopes, resources });
    }
    const entry = { scope, references: 0, touched: Date.now() };
    this.scopeSubscriptions.set(key, entry);
    if (!covered) this.scheduleScopeRefresh();
    return entry;
  },
  retainKind(kind, namespace = "all", requestedDescriptor) {
    if (this.state.mode === "demo") return () => {};
    const descriptor =
      requestedDescriptor || this.state.discovery.find((d) => d.kind === kind);
    if (!descriptor) return () => {};
    const entry = this.registerScope(
      resourceScope(descriptor, namespace),
      true,
    );
    if (!entry) return () => {};
    ++entry.references;
    return () => {
      entry.references = Math.max(0, entry.references - 1);
      entry.touched = Date.now();
    };
  },
  observeNamespace(
    namespace = "all",
    expectedSourceKey = this.state.sourceKey,
  ) {
    if (
      this.state.mode !== "live" ||
      expectedSourceKey !== this.state.sourceKey
    )
      return;
    const next = this.workspaceScope
      ? this.connectionNamespace() || "all"
      : this.state.watchNamespace ||
        (namespace && namespace !== "*" ? namespace : "all");
    if (next === this.state.activeNamespace) return;
    for (const [key, entry] of this.scopeSubscriptions)
      if (
        !entry.references &&
        entry.scope.namespace &&
        next !== "all" &&
        entry.scope.namespace !== next
      )
        this.scopeSubscriptions.delete(key);
    const retained = [...this.scopeSubscriptions.values()].map(
      (entry) => entry.scope,
    );
    this.state = narrowNamespaceState(this.state, next, retained);
    this.publish({ activeNamespace: next });
    ++this.scopeRevision;
    this.requests.forEach((abort) => abort.abort());
    this.publish({
      readOnly: true,
      managementEnabled: false,
      connectionChecks: null,
      metrics: null,
      metricHistory: [],
    });
    this.pauseStream();
    const revision = this.scopeRevision;
    this.resetManagement().then(() => {
      if (revision !== this.scopeRevision || !this.state.configured) return;
      this.refreshMetrics();
      this.scheduleScopeRefresh();
    });
  },
  diagnostics() {
    const sorted = [...this.storeTimings].sort((a, b) => a - b);
    return {
      samples: sorted.length,
      p50Ms: sorted[Math.floor(sorted.length * 0.5)] ?? null,
      p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? null,
      maxMs: sorted.at(-1) ?? null,
    };
  },
  publish(patch = {}) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn(this.state));
  },
  url(path, context = this.state.context) {
    const url = new URL(path, window.location.origin);
    if (context) url.searchParams.set("context", context);
    if (this.workspaceScope) {
      for (const key of ["workspaceId", "harborId", "tabId"])
        url.searchParams.set(key, this.workspaceScope[key]);
    }
    return url;
  },
  async request(path, options = {}) {
    const requestEpoch = this.epoch;
    const { onOperation, ...fetchOptions } = options;
    if (this.state.mode === "demo")
      throw new Error(
        "Demo — örnek veri. Canlı Kubernetes işlemleri bu veri kaynağında kapalı.",
      );
    const abort = new AbortController();
    const cancel = () => abort.abort();
    if (options.signal?.aborted) abort.abort();
    options.signal?.addEventListener("abort", cancel, { once: true });
    this.requests.add(abort);
    try {
      const response = await fetch(this.url(path), {
        ...fetchOptions,
        signal: abort.signal,
        headers: {
          "Content-Type": "application/json",
          ...(this.state.connectionChecks?.connectionID
            ? {
                "X-KubeView-Connection":
                  this.state.connectionChecks.connectionID,
              }
            : {}),
          ...options.headers,
        },
        body:
          options.body && typeof options.body !== "string"
            ? JSON.stringify(options.body)
            : options.body,
      });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("json")
        ? await response.json()
        : await response.text();
      if (response.ok && onOperation) {
        const object = data?.object || data;
        onOperation({ operation: data?.operation ? { id: data.operation.id, status: data.operation.status } : null,
          target: object?.metadata ? { kind: object.kind, uid: object.metadata.uid, name: object.metadata.name, namespace: object.metadata.namespace, resourceVersion: object.metadata.resourceVersion } : null });
      }
      if (requestEpoch !== this.epoch)
        throw new Error(
          "Bağlantı kapsamı değişti; önceki oturum yanıtı kullanılmadı.",
        );
      if (!response.ok) {
        const error = new Error(
          data?.error?.message ||
            data?.message ||
            data?.error ||
            data ||
            `HTTP ${response.status}`,
        );
        error.status = response.status;
        error.details = data;
        throw error;
      }
      return data;
    } finally {
      options.signal?.removeEventListener("abort", cancel);
      this.requests.delete(abort);
    }
  },
  connectionNamespace() {
    if (this.workspaceScope) {
      const namespaces = this.workspaceScope.namespaces || [];
      return namespaces.length === 1 && namespaces[0] !== "*" ? namespaces[0] : "";
    }
    return this.state.watchNamespace || (this.state.activeNamespace === "all" ? "" : this.state.activeNamespace) || "";
  },
  async refreshConnection() {
    if (this.state.mode !== "live" || !this.state.configured) return;
    this.connectionAbort?.abort();
    const abort = new AbortController();
    this.connectionAbort = abort;
    const epoch = this.epoch,
      revision = this.scopeRevision,
      socketSerial = this.socketSerial;
    const namespace = this.connectionNamespace();
    this.publish({ connectionChecking: true });
    try {
      const data = await this.request(
        `/api/connection?${new URLSearchParams({ namespace })}`,
        { signal: abort.signal },
      );
      if (
        epoch !== this.epoch ||
        revision !== this.scopeRevision ||
        socketSerial !== this.socketSerial ||
        abort.signal.aborted
      )
        return;
      this.publish({
        connectionChecks: data,
        readOnly: !this.managementIntent || data.readOnly !== false,
        serverReadOnly: data.serverReadOnly !== false,
        managementAvailable: data.managementAvailable === true,
        managementEnabled:
          this.managementIntent && data.managementEnabled === true,
      });
    } catch (error) {
      if (
        epoch === this.epoch &&
        revision === this.scopeRevision &&
        socketSerial === this.socketSerial &&
        !abort.signal.aborted
      )
        this.publish({
          connectionChecks: {
            checks: { api: { status: "error", message: error.message } },
          },
          readOnly: true,
          managementEnabled: false,
        });
    } finally {
      if (this.connectionAbort === abort) {
        this.connectionAbort = null;
        this.publish({ connectionChecking: false });
      }
    }
  },
  async resetManagement() {
    this.managementIntent = false;
    this.publish({ readOnly: true, managementEnabled: false });
    if (this.state.mode !== "live" || !this.state.configured) return;
    const epoch = this.epoch,
      revision = this.scopeRevision;
    const url = this.url("/api/management");
    const body = JSON.stringify({
      enabled: false,
      context: this.state.context,
      namespace: this.connectionNamespace(),
    });
    // Revocation must finish even when cleanup aborts old reads. Serialize it
    // ahead of the next diagnostic so a late response cannot restore writes.
    this.managementReset = this.managementReset
      .catch(() => {})
      .then(async () => {
        const abort = new AbortController();
        const deadline = setTimeout(() => abort.abort(), 10000);
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: abort.signal,
            credentials: "same-origin",
          });
          if (!response.ok)
            throw new Error("Yönetim modu kapatılamadı; yeniden bağlanın.");
        } finally {
          clearTimeout(deadline);
        }
        if (epoch === this.epoch && revision === this.scopeRevision)
          return this.refreshConnection();
      })
      .catch(() => {
        if (epoch === this.epoch && revision === this.scopeRevision)
          this.publish({
            readOnly: true,
            managementEnabled: false,
            connectionChecking: false,
          });
      });
    return this.managementReset;
  },
  async setManagement(enabled) {
    if (!enabled) {
      this.managementIntent = false;
      this.publish({ readOnly: true, managementEnabled: false });
    }
    const epoch = this.epoch,
      revision = this.scopeRevision,
      socketSerial = this.socketSerial;
    const data = await this.request("/api/management", {
      method: "POST",
      body: {
        enabled,
        context: this.state.context,
        namespace: this.connectionNamespace(),
        connectionID: this.state.connectionChecks?.connectionID || "",
      },
    });
    if (
      epoch !== this.epoch ||
      revision !== this.scopeRevision ||
      socketSerial !== this.socketSerial
    )
      return;
    this.managementIntent = enabled && data.managementEnabled === true;
    this.publish({
      readOnly: data.readOnly !== false,
      managementEnabled: data.managementEnabled === true,
    });
    return this.refreshConnection();
  },
  async refreshMetrics() {
    if (this.state.mode !== "live" || !this.state.configured) return;
    this.metricsAbort?.abort();
    const abort = new AbortController();
    this.metricsAbort = abort;
    const epoch = this.epoch,
      revision = this.scopeRevision;
    const namespace = this.connectionNamespace();
    try {
      const data = await this.request(
        namespace
          ? `/api/metrics?${new URLSearchParams({ namespace })}`
          : "/api/metrics",
        { signal: abort.signal },
      );
      if (
        epoch !== this.epoch ||
        revision !== this.scopeRevision ||
        abort.signal.aborted
      )
        return;
      this.state = appendMetrics(this.state, data);
      this.publish();
    } catch (error) {
      if (
        epoch !== this.epoch ||
        revision !== this.scopeRevision ||
        abort.signal.aborted
      )
        return;
      this.state = appendMetrics(this.state, {
        available: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      this.publish();
    } finally {
      if (this.metricsAbort === abort) this.metricsAbort = null;
    }
  },
  async start() {
    if (this.started) return;
    this.started = true;
    const epoch = this.epoch;
    try {
      const response = await fetch("/api/contexts");
      if (!response.ok) {
        if (response.status === 401) this.publish({ authRequired: true });
        throw new Error(`Backend HTTP ${response.status}`);
      }
      const result = await response.json();
      if (epoch !== this.epoch) return;
      this.publish({
        contexts: result.contexts || [],
        configured: result.configured ?? result.contexts?.length > 0,
        watchNamespace: result.namespace || "",
        authRequired: false,
        readOnly: result.readOnly !== false,
        serverReadOnly: result.serverReadOnly !== false,
        managementAvailable: result.managementAvailable === true,
        managementEnabled: result.managementEnabled === true,
        namespaceHint: result.currentNamespace || "",
      });
      if (epoch !== this.epoch) return;
      this.selectSource(result.current || result.contexts?.[0]?.name || "");
    } catch (error) {
      if (epoch === this.epoch)
        this.publish({ errors: [`Backend erişilemiyor: ${error.message}`] });
    }
  },
  async login(token) {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Oturum açılamadı");
    this.started = false;
    await this.start();
  },
  async loadKind(kind, namespace = "all", requestedDescriptor) {
    if (this.state.mode === "demo") return;
    const descriptor =
      requestedDescriptor || this.state.discovery.find((d) => d.kind === kind);
    if (!descriptor) return;
    const scope = resourceScope(descriptor, namespace);
    this.registerScope(scope);
    const key = scopeKey(scope);
    const previous = this.scopeRequests.get(key);
    previous?.abort();
    const abort = new AbortController();
    this.scopeRequests.set(key, abort);
    const epoch = this.epoch;
    const socketSerial = this.socketSerial;
    const before = this.state.resources;
    try {
      const list = await this.request(
        "/api/resources?" +
          new URLSearchParams({
            group: scope.group,
            version: scope.version,
            resource: scope.resource,
            namespace: scope.namespace === "*" ? "" : scope.namespace,
          }),
        { signal: abort.signal },
      );
      if (
        epoch !== this.epoch ||
        abort.signal.aborted ||
        socketSerial !== this.socketSerial
      )
        return;
      const next = mergeResourceList(
        this.state.resources,
        before,
        list.items || [],
        scope,
      );
      const timestamp = new Date().toISOString();
      const tombstones = { ...this.state.tombstones };
      for (const [uid, old] of Object.entries(before))
        if (
          scopeContains(scope, old) &&
          !next[uid] &&
          this.state.resources[uid] === old
        )
          tombstones[uid] = { reason: "authoritative-list-absence", timestamp };
      for (const uid of Object.keys(next)) delete tombstones[uid];
      const known = this.state.scopes?.[key];
      this.publish({
        resources: next,
        tombstones: Object.fromEntries(Object.entries(tombstones).slice(-1000)),
        scopes: {
          ...this.state.scopes,
          [key]: {
            ...scope,
            authoritative: true,
            status: "synced",
            timestamp,
            generation: this.state.generation,
            source: known?.source || "list",
          },
        },
      });
      return list;
    } catch (error) {
      if (
        epoch !== this.epoch ||
        abort.signal.aborted ||
        socketSerial !== this.socketSerial
      )
        return;
      this.publish({
        scopes: {
          ...this.state.scopes,
          [key]: {
            ...scope,
            authoritative: false,
            status: error.status === 403 ? "forbidden" : "unavailable",
            error: error.message,
            timestamp: new Date().toISOString(),
            source: "list",
          },
        },
        errors: [...new Set([error.message, ...this.state.errors])].slice(
          0,
          30,
        ),
      });
      throw error;
    } finally {
      if (this.scopeRequests.get(key) === abort) this.scopeRequests.delete(key);
    }
  },
  cleanup() {
    this.managementIntent = false;
    ++this.epoch;
    ++this.scopeRevision;
    ++this.socketSerial;
    clearTimeout(this.retry);
    clearInterval(this.poll);
    this.demoTimers.forEach(clearTimeout);
    this.demoTimers = [];
    this.storeTimings = [];
    this.scopeRequests.forEach((abort) => abort.abort());
    this.scopeRequests.clear();
    this.requests.forEach((abort) => abort.abort());
    this.requests.clear();
    this.metricsAbort?.abort();
    this.connectionAbort?.abort();
    this.scopeSubscriptions.clear();
    this.refreshQueued = false;
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.state = { ...this.state, isConnected: false, snapshotReady: false };
    this.notifyStreamSession();
  },
  selectSource(context) {
    this.cleanup();
    const mode = context === "__demo__" ? "demo" : "live";
    const namespaceHint =
      mode === "demo"
        ? ""
        : this.state.contexts.find((c) => c.name === context)?.namespace || "";
    this.publish({
      ...initialState(`${this.workspaceScope?.scopeKey || ""}${mode}:${context}:${this.epoch}`),
      context: mode === "demo" ? "" : context,
      mode,
      discovery: [],
      readOnly: true,
      managementEnabled: false,
      connectionChecks: null,
      connectionChecking: false,
      namespaceHint,
      activeNamespace: this.workspaceScope
        ? this.connectionNamespace() || "all"
        : this.state.watchNamespace || namespaceHint || "all",
    });
    if (mode === "demo") {
      this.state = reduceMessage(this.state, {
        type: "SNAPSHOT",
        generation: "demo",
        resources: demoResources(),
        timestamp: new Date().toISOString(),
      });
      this.state = appendMetrics(
        this.state,
        demoMetrics(Object.values(this.state.resources)),
      );
      this.publish({ isConnected: false });
      return;
    }
    if (!context && !this.state.configured) return;
    const epoch = this.epoch;
    this.resetManagement().then(() => {
      if (epoch !== this.epoch) return;
      this.connect();
      this.refreshMetrics();
      this.request("/api/discovery")
        .then((data) => {
          if (epoch === this.epoch)
            this.publish({ discovery: data.resources || [] });
        })
        .catch((error) => {
          if (epoch === this.epoch)
            this.publish({ errors: [...this.state.errors, error.message] });
        });
    });
    this.poll = setInterval(() => {
      if (!document.hidden) this.refreshMetrics();
    }, 15000);
  },
  pauseStream() {
    clearTimeout(this.retry);
    if (this.socket) {
      this.socket.onopen =
        this.socket.onmessage =
        this.socket.onerror =
        this.socket.onclose =
          null;
      this.socket.close();
      this.socket = null;
    }
    ++this.socketSerial;
    this.scopeRequests.forEach((abort) => abort.abort());
    this.scopeRequests.clear();
    this.state = reduceMessage(this.state, { type: "CONNECTION_PENDING" });
    this.publish({ isConnected: false });
    this.notifyStreamSession();
  },
  connect() {
    const epoch = this.epoch;
    this.pauseStream();
    const url = this.url("/ws");
    url.searchParams.set("namespace", this.connectionNamespace());
    for (const { scope } of this.scopeSubscriptions.values())
      url.searchParams.append("subscribe", scopeSubscription(scope));
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    globalThis.__KUBEVIEW_BENCHMARK__?.connection?.(socket);
    this.socket = socket;
    socket.onopen = () => {
      if (epoch !== this.epoch || socket !== this.socket) return;
      this.publish({
        isConnected: true,
        readOnly: true,
        managementEnabled: false,
      });
      this.refreshConnection();
    };
    socket.onmessage = (e) => {
      if (epoch !== this.epoch || socket !== this.socket) return;
      try {
        const t = performance.now();
        const message = JSON.parse(e.data);
        if (this.workspaceScope) {
          if (message.workspaceId !== this.workspaceScope.workspaceId || message.harborId !== this.workspaceScope.harborId || message.tabId !== this.workspaceScope.tabId) return;
          if (message.type === "SNAPSHOT") this.sessionGeneration = message.sessionGeneration;
          else if (this.sessionGeneration && message.sessionGeneration !== this.sessionGeneration) return;
        }
        const parsed = performance.now();
        this.state = reduceMessage(this.state, message);
        const elapsed = performance.now() - t;
        this.storeTimings.push(elapsed);
        if (this.storeTimings.length > 500) this.storeTimings.shift();
        this.publish({ lastStoreLatency: elapsed });
        if (message.type === "SNAPSHOT") this.notifyStreamSession();
        globalThis.__KUBEVIEW_BENCHMARK__?.message(
          message,
          {
            callback: t,
            parsed,
            stored: t + elapsed,
            published: performance.now(),
          },
          this.state,
        );
      } catch (error) {
        this.publish({ errors: [`Veri mesajı okunamadı: ${error.message}`] });
      }
    };
    socket.onerror = () => {
      if (epoch === this.epoch && socket === this.socket)
        this.publish({ stale: true, upstream: false });
    };
    socket.onclose = () => {
      if (epoch !== this.epoch || socket !== this.socket) return;
      this.state = reduceMessage(this.state, { type: "CONNECTION_PENDING" });
      this.publish({ isConnected: false, stale: true });
      this.notifyStreamSession();
      this.retry = setTimeout(() => this.connect(), 3000);
    };
  },
  runDemoScenario() {
    if (this.state.mode !== "demo" || this.demoTimers.length) return;
    const base = demoResources().find((r) => r.kind === "Pod");
    const pod = {
      ...base,
      metadata: {
        ...base.metadata,
        uid: "demo-scenario-pod",
        name: "arrival-scenario",
        resourceVersion: "scenario-1",
        creationTimestamp: new Date().toISOString(),
        ownerReferences: [],
      },
      spec: { ...base.spec, nodeName: "" },
      status: {
        phase: "Pending",
        conditions: [{ type: "Ready", status: "False" }],
      },
    };
    const emit = (action, object) => {
      this.state = reduceMessage(this.state, {
        type: "RESOURCE_EVENT",
        generation: "demo",
        action,
        object,
        timestamp: new Date().toISOString(),
      });
      this.publish();
    };
    emit("ADD", pod);
    const steps = [
      [
        1800,
        () =>
          emit("UPDATE", {
            ...pod,
            spec: { ...pod.spec, nodeName: "marmara-01" },
          }),
      ],
      [
        4500,
        () =>
          emit("UPDATE", {
            ...pod,
            spec: { ...pod.spec, nodeName: "marmara-01" },
            status: { ...base.status, phase: "Running" },
          }),
      ],
      [
        6500,
        () =>
          emit("UPDATE", {
            ...pod,
            metadata: {
              ...pod.metadata,
              deletionTimestamp: new Date().toISOString(),
            },
            spec: { ...pod.spec, nodeName: "marmara-01" },
            status: base.status,
          }),
      ],
      [
        8500,
        () => {
          emit("DELETE", pod);
          this.demoTimers = [];
        },
      ],
    ];
    this.demoTimers = steps.map(([time, fn]) => setTimeout(fn, time));
  },
};
export function createSourceManager(scope) {
  const manager = {
    ...singletonManager,
    workspaceScope: scope,
    state: {
      ...initialState(), contexts: scope.contexts || [], context: scope.context,
      configured: scope.bound !== false, mode: "live", readOnly: true,
      serverReadOnly: true, managementEnabled: false, managementAvailable: false,
      discovery: [], connectionChecks: null, connectionChecking: false,
      watchNamespace: scope.namespaces?.length === 1 && scope.namespaces[0] !== "*" ? scope.namespaces[0] : "",
    },
    listeners: new Set(), streamListeners: new Set(), requests: new Set(),
    scopeSubscriptions: new Map(), scopeRequests: new Map(),
    storeTimings: [], demoTimers: [], started: false, socket: null,
    retry: null, poll: null, epoch: 0, socketSerial: 0, scopeRevision: 0,
    metricsAbort: null, connectionAbort: null, refreshQueued: false,
    managementReset: Promise.resolve(), managementIntent: false,
    async start() {
      if (this.started || !this.state.configured) return;
      this.started = true;
      this.selectSource(scope.context);
    },
  };
  return manager;
}

export function ShipyardClusterProvider({ children, manager = singletonManager, workspace }) {
  const [publishedState, setState] = useState(manager.state);
  const renderedManager = useRef(manager);
  const state = renderedManager.current === manager ? publishedState : manager.state;
  useLayoutEffect(() => {
    renderedManager.current = manager;
    setState(manager.state);
    manager.listeners.add(setState);
    manager.start();
    if (import.meta.env.DEV)
      window.__kubeviewDiagnostics = () => manager.diagnostics();
    return () => manager.listeners.delete(setState);
  }, [manager]);
  const resources = useMemo(
    () => Object.values(state.resources),
    [state.resources],
  );
  const previousIndex = useRef();
  const resourceIndex = useMemo(
    () => buildResourceIndex(resources, previousIndex.current, state.sourceKey),
    [resources, state.sourceKey],
  );
  useLayoutEffect(() => {
    previousIndex.current = resourceIndex;
  }, [resourceIndex]);
  const api = useMemo(
    () => {
      const renderEpoch = manager.epoch;
      return ({
      request: (path, options) => {
        const revision = manager.scopeRevision;
        if (
          renderEpoch !== manager.epoch ||
          state.sourceKey !== manager.state.sourceKey ||
          state.activeNamespace !== manager.state.activeNamespace
        )
          return Promise.reject(
            new Error(
              "Bu işlem önceki bağlantı kapsamına ait. Kaynağı yeni bağlantıda tekrar açın.",
            ),
          );
        return manager.request(path, options).then((data) => {
          if (revision !== manager.scopeRevision)
            throw new Error(
              "Namespace kapsamı değişti; önceki yanıt kullanılmadı.",
            );
          return data;
        });
      },
      url: (path) => {
        if (
          renderEpoch !== manager.epoch ||
          state.sourceKey !== manager.state.sourceKey ||
          state.activeNamespace !== manager.state.activeNamespace
        )
          throw new Error(
            "Bağlantı kapsamı değişti; eski oturum URL’si kullanılmadı.",
          );
        const url = manager.url(path, state.context);
        if (
          state.sourceKey === manager.state.sourceKey &&
          state.activeNamespace === manager.state.activeNamespace &&
          manager.state.connectionChecks?.connectionID
        )
          url.searchParams.set(
            "connectionID",
            manager.state.connectionChecks.connectionID,
          );
        return url.toString();
      },
      context: state.context,
      workspaceScope: manager.workspaceScope,
      isClusterScoped(resource) {
        const group = resource?.apiVersion?.includes("/") ? resource.apiVersion.split("/")[0] : "";
        const descriptor = state.discovery.find((entry) => entry.kind === resource?.kind && entry.group === group);
        return descriptor ? descriptor.namespaced === false : ["Node", "Namespace", "PersistentVolume", "StorageClass", "ClusterRole", "ClusterRoleBinding", "CustomResourceDefinition", "APIService", "PriorityClass", "RuntimeClass"].includes(resource?.kind);
      },
      mode: state.mode,
      streamSession: () => {
        const session = manager.streamSession();
        return {
          ...session,
          ready:
            session.ready &&
            state.sourceKey === manager.state.sourceKey,
        };
      },
      subscribeStreamSession(listener) {
        manager.streamListeners.add(listener);
        return () => manager.streamListeners.delete(listener);
      },
      resourcePath(resource) {
        const [group, version] = resource.apiVersion.includes("/")
          ? resource.apiVersion.split("/")
          : ["", resource.apiVersion];
        const descriptor = state.discovery.find(
          (d) =>
            d.kind === resource.kind &&
            d.group === group &&
            d.version === version,
        );
        if (!descriptor)
          throw new Error(
            `API discovery içinde ${resource.apiVersion}/${resource.kind} bulunamadı.`,
          );
        return `/api/resources?${new URLSearchParams({ group, version, resource: descriptor.resource, namespace: resource.metadata?.namespace || "", name: resource.metadata?.name || "" })}`;
      },
    }); },
    [
      state.context,
      state.mode,
      state.discovery,
      state.sourceKey,
      state.activeNamespace,
      manager,
      state.sessionRevision,
    ],
  );
  return (
    <Context.Provider
      value={{
        ...state,
        workspace,
        authRequired: workspace?.authRequired || state.authRequired,
        resources,
        // Stable across live deltas; a scoped snapshot is not a batch of ADDs.
        snapshotUIDs: state.snapshotUIDs,
        resourceIndex,
        api,
        login: (token) => workspace ? workspace.login(token) : manager.login(token),
        refreshConnection: () => manager.refreshConnection(),
        setManagement: (enabled) => manager.setManagement(enabled),
        loadKind: manager.loadKind.bind(manager),
        retainKind: manager.retainKind.bind(manager),
        observeNamespace:
          manager.observeNamespace.bind(manager),
        resourceObservation: (resource) =>
          resourceObservation(manager.state, resource),
        selectSource: (name) => manager.selectSource(name),
        runDemoScenario: () => manager.runDemoScenario(),
        refresh: () => {
          if (state.mode !== "demo" && (!state.context || !state.configured)) {
            manager.started = false;
            return manager.start();
          }
          if (state.mode === "demo")
            return manager.selectSource("__demo__");
          // Reconnect is not a context switch: retain scoped subscriptions,
          // canonical data and UID selection until the real relist reconciles.
          manager.connect();
          manager.refreshMetrics();
          return manager.refreshConnection();
        },
        totalShips: resourceIndex.nodes.length,
        totalPallets: resourceIndex.pods.length,
        ships: resourceIndex.ships,
        eventsLog: state.events,
        deployments: resourceIndex.kinds.get("Deployment") || EMPTY_RESOURCES,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useClusterConnection() {
  const context = useContext(Context);
  if (!context) throw new Error("ShipyardClusterProvider is required");
  return context;
}
