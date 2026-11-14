import { createSourceManager, singletonManager } from "./ShipyardClusterContext.jsx";
import { appendMetrics, initialState } from "../data/resourceStore.js";
import { harborScopeKey, normalizeNamespaces, MAX_HARBOR_VIEWS } from "../world/workspace.js";
export { createSourceManager };

export class HarborSession {
  constructor(core, scope, onChange = () => {}) {
    this.core = core;
    this.workspaceScope = scope;
    this.listeners = new Set();
    this.streamListeners = new Set();
    this.requests = new Set();
    this.scopeRevision = 0;
    this.revision = 0;
    this.active = false;
    this.overlay = { readOnly: true, managementEnabled: false, connectionChecks: null, connectionChecking: false, activeNamespace: scope.viewNamespace };
    this.managementIntent = false;
    this.managementReset = Promise.resolve();
    this.connectionAbort = null;
    this.metricsAbort = null;
    this.onChange = onChange;
    this.lastStream = "";
    this.lastCoreEpoch = core.epoch;
    this.operationRecords = [];
    this.observationPins = new Map();
    this.lastCoreMetrics = core.state.metrics;
    this.coreListener = () => {
      if (this.lastCoreEpoch !== core.epoch) {
        this.lastCoreEpoch = core.epoch;
        this.clearObservationPins();
        this.lastCoreMetrics = null;
        this.managementIntent = false;
        this.overlay = { ...this.overlay, readOnly: true, managementEnabled: false, connectionChecks: null, metrics: null, metricHistory: [] };
        ++this.revision;
        this.requests.forEach((abort) => abort.abort());
      }
      if (this.lastCoreMetrics !== core.state.metrics) {
        this.lastCoreMetrics = core.state.metrics;
        if (this.active) this.adoptCoreMetrics();
      }
      const key = this.streamSession().key;
      if (key !== this.lastStream) {
        this.lastStream = key;
        this.overlay = { ...this.overlay, readOnly: true, managementEnabled: false, connectionChecks: null };
        this.publish();
        this.notifyStreamSession();
        if (this.active && this.core.state.isConnected) this.refreshConnection();
      } else this.publish();
    };
    core.listeners.add(this.coreListener);
  }
  get epoch() { return `${this.core.epoch}:${this.core.socketSerial}:${this.revision}`; }
  get socketSerial() { return this.core.socketSerial; }
  get state() {
    return { ...this.core.state, ...this.overlay,
      sourceKey: `${this.core.state.sourceKey}:harbor:${this.workspaceScope.harborId}`,
      sessionRevision: this.epoch,
      harborId: this.workspaceScope.harborId,
      workspaceId: this.workspaceScope.workspaceId,
      activeNamespace: this.overlay.activeNamespace || this.core.state.activeNamespace,
      detachedOperations: this.operationRecords.filter((record) => record.detached),
    };
  }
  publish(patch = {}) {
    this.overlay = { ...this.overlay, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
    if (Object.keys(patch).length) this.onChange();
  }
  url(path, context) { return singletonManager.url.call(this, path, context ?? this.state.context); }
  request(path, options) {
    if (!this.active) return Promise.reject(new Error("Bu liman artık aktif değil; önceki oturum isteği gönderilmedi."));
    const method = options?.method || "GET";
    const track = ["POST", "PUT", "PATCH", "DELETE"].includes(method) && /^\/api\/(resources|actions)(\?|$)/.test(path) && options?.body?.dryRun !== true;
    if (!track) return singletonManager.request.call(this, path, options);
    const object = options?.body?.object, address = new URL(path, window.location.origin).searchParams;
    const record = { id: crypto.randomUUID(), at: Date.now(), status: "sending", detached: false,
      workspaceId: this.workspaceScope.workspaceId, harborId: this.workspaceScope.harborId, context: this.state.context,
      action: options?.body?.action || (method === "DELETE" ? "delete" : method === "POST" ? "create" : "edit"),
      target: { kind: object?.kind || "", uid: object?.metadata?.uid || options?.body?.uid,
        name: object?.metadata?.name || address.get("name"), namespace: object?.metadata?.namespace || address.get("namespace") } };
    this.operationRecords = [record, ...this.operationRecords].slice(0, 30);
    return singletonManager.request.call(this, path, { ...options, onOperation: (summary) => {
      record.status = "accepted";
      record.operationId = summary.operation?.id;
      if (summary.target) record.target = summary.target;
      this.publish();
    } }).catch((error) => {
      if (record.status !== "accepted") record.status = record.detached || error.name === "AbortError" ? "unknown" : "failed";
      this.publish();
      throw error;
    });
  }
  start() { this.activate(); }
  activate() {
    if (this.active) return;
    this.active = true;
    ++this.revision;
    this.publish({ readOnly: true, managementEnabled: false });
    this.core.start();
    this.adoptCoreMetrics();
    this.refreshConnection();
    this.notifyStreamSession();
  }
  deactivate() {
    if (!this.active) return;
    this.active = false;
    ++this.revision;
    for (const record of this.operationRecords)
      if (record.status === "sending") { record.detached = true; record.status = "unknown"; }
    this.requests.forEach((abort) => abort.abort());
    this.connectionAbort?.abort();
    this.metricsAbort?.abort();
    this.publish({ readOnly: true, managementEnabled: false });
    this.notifyStreamSession();
  }
  refreshConnection() { return singletonManager.refreshConnection.call(this); }
  connectionNamespace() {
    const namespaces = this.workspaceScope.namespaces;
    return namespaces.length === 1 && namespaces[0] !== "*" ? namespaces[0] : "";
  }
  resetManagement() { return singletonManager.resetManagement.call(this); }
  setManagement(enabled) { return singletonManager.setManagement.call(this, enabled); }
  setObservationPin(slot, uid) {
    if (!["selection", "form"].includes(slot)) throw new Error("Geçersiz kaynak gözlem alanı.");
    if (uid) this.observationPins.set(slot, uid);
    else this.observationPins.delete(slot);
    this.core.setObservationPin?.(`${this.workspaceScope.harborId}:${slot}`, uid);
  }
  clearObservationPins() {
    for (const slot of this.observationPins.keys())
      this.core.setObservationPin?.(`${this.workspaceScope.harborId}:${slot}`, null);
    this.observationPins.clear();
  }
  adoptCoreMetrics() {
    const metrics = this.core.state.metrics;
    if (!this.active || !metrics) return;
    this.metricsAbort?.abort(); this.metricsAbort = null;
    const namespace = this.state.activeNamespace;
    const filter = (items) => items.filter((item) => (item.metadata?.namespace || item.namespace) === namespace);
    const scoped = namespace && namespace !== "all"
      ? { ...metrics, pods: Array.isArray(metrics.pods) ? filter(metrics.pods) : { ...metrics.pods, items: filter(metrics.pods?.items || []) } }
      : metrics;
    this.overlay = appendMetrics({ ...this.overlay, metricHistory: this.overlay.metricHistory || [] }, scoped);
    // A union list can fail where an authorized, narrower namespace still works.
    // Reuse complete samples directly; retry only that active local observation.
    if (namespace && namespace !== "all" && metrics.errors?.pods) this.refreshMetrics();
  }
  async refreshMetrics() {
    if (!this.active) return;
    this.metricsAbort?.abort();
    const abort = new AbortController(), epoch = this.epoch;
    this.metricsAbort = abort;
    try {
      const namespace = this.state.activeNamespace;
      const metrics = await this.request(`/api/metrics?${new URLSearchParams({ namespace: namespace === "all" ? "" : namespace || "" })}`, { signal: abort.signal });
      if (epoch !== this.epoch || abort.signal.aborted) return;
      this.publish({ metrics, metricHistory: [...(this.overlay.metricHistory || []), metrics].slice(-241) });
    } catch (error) {
      if (epoch === this.epoch && !abort.signal.aborted)
        this.publish({ metrics: { available: false, error: error.message } });
    } finally {
      if (this.metricsAbort === abort) this.metricsAbort = null;
    }
  }
  observeNamespace(namespace = "all", expectedSource = this.state.sourceKey) {
    if (expectedSource !== this.state.sourceKey || namespace === this.state.activeNamespace) return;
    const allowed = this.workspaceScope.namespaces;
    if (namespace !== "all" && !allowed.includes("*") && !allowed.includes(namespace)) return;
    ++this.scopeRevision;
    ++this.revision;
    const hadIntent = this.managementIntent || this.overlay.managementEnabled;
    this.managementIntent = false;
    this.requests.forEach((abort) => abort.abort());
    this.publish({ activeNamespace: namespace, readOnly: true, managementEnabled: false, connectionChecks: null, metrics: null, metricHistory: [] });
    if (hadIntent) this.resetManagement().then(() => this.active && this.refreshMetrics());
    else { this.refreshConnection(); this.refreshMetrics(); }
    this.notifyStreamSession();
  }
  retainKind(...args) { return this.core.retainKind(...args); }
  loadKind(...args) { return this.core.loadKind(...args); }
  connect() { return this.core.connect(); }
  diagnostics() { return this.core.diagnostics(); }
  selectSource(context) {
    if (context === this.state.context) return;
    throw new Error("Bağlantı değişikliği Limanlar penceresindeki liman ayarlarından yapılır.");
  }
  login(token) { return this.core.login(token); }
  runDemoScenario() {}
  streamSession() { return { ...this.core.streamSession(), key: `${this.workspaceScope.harborId}:${this.epoch}:${this.core.streamSession().key}`, ready: this.active && this.core.streamSession().ready }; }
  notifyStreamSession() { this.streamListeners.forEach((listener) => listener(this.streamSession())); }
  dispose() {
    this.deactivate();
    this.clearObservationPins();
    this.core.listeners.delete(this.coreListener);
    this.listeners.clear();
    this.streamListeners.clear();
    this.overlay = {};
  }
}

export class WorkspaceRegistry {
  constructor(tabId, factory = createSourceManager) {
    this.tabId = tabId;
    this.factory = factory;
    this.cores = new Map();
    this.sessions = new Map();
    this.activeId = null;
    this.listeners = new Set();
    this.authorities = new Map();
    this.connectionConfigurations = new Map();
  }
  notify() { this.listeners.forEach((listener) => listener()); }
  configure(workspace, contexts = []) {
    const planned = new Set();
    for (const harbor of workspace.harbors || []) {
      const connection = workspace.connections.find((item) => item.id === harbor.connectionRef);
      if (connection?.bound && connection.context) planned.add(harborScopeKey(workspace, harbor, connection));
    }
    if (planned.size > MAX_HARBOR_VIEWS)
      throw new Error("64 farklı canlı kapsam sınırı aşıldı. Workspace verisi korunuyor; bağlantıları azaltın veya kapsamları açıkça düzenleyin.");
    const connectionIds = new Set(workspace.connections.map((connection) => connection.id));
    for (const connection of workspace.connections) {
      const signature = JSON.stringify([connection.context || "", connection.bound, connection.credentialGeneration || "", connection.authorizationKey || ""]);
      if (this.connectionConfigurations.get(connection.id) !== signature || !connection.bound) this.authorities.delete(connection.id);
      this.connectionConfigurations.set(connection.id, signature);
    }
    for (const id of this.authorities.keys()) if (!connectionIds.has(id)) this.authorities.delete(id);
    for (const id of this.connectionConfigurations.keys()) if (!connectionIds.has(id)) this.connectionConfigurations.delete(id);
    const retained = new Set(), scopes = new Set();
    for (const harbor of workspace.harbors || []) {
      const connection = workspace.connections.find((c) => c.id === harbor.connectionRef);
      if (!connection?.bound || !connection.context) continue;
      const key = harborScopeKey(workspace, harbor, connection);
      retained.add(harbor.id);
      scopes.add(key);
      const old = this.sessions.get(harbor.id);
      if (old?.workspaceScope.scopeKey === key) continue;
      old?.dispose();
      const scope = { workspaceId: workspace.id, harborId: harbor.id, tabId: this.tabId, scopeKey: key, context: connection.context, contexts,
        namespaces: normalizeNamespaces(harbor.namespaces), bound: true,
        viewNamespace: harbor.view?.namespace };
      let core = this.cores.get(key);
      if (!core) {
        // One canonical state + transport per exact trusted auth/scope key.
        core = this.factory(scope);
        core.listeners.add(() => {
          const checks = core.state.connectionChecks;
          if (checks?.identity) {
            const authority = { identity: checks.identity, credentialGeneration: checks.credentialGeneration, authorizationKey: checks.authorizationKey };
            const signature = JSON.stringify([authority.credentialGeneration || "", authority.authorizationKey || ""]);
            const previous = core.authoritySignature;
            core.authoritySignature = signature;
            this.authorities.set(connection.id, authority);
            if (previous && previous !== signature && !core.authorityRefreshQueued) {
              core.authorityRefreshQueued = true;
              queueMicrotask(() => {
                core.authorityRefreshQueued = false;
                if (this.cores.get(key) === core && core.authoritySignature === signature)
                  core.selectSource(core.state.context);
              });
            }
          }
          this.notify();
        });
        this.cores.set(key, core);
      }
      this.sessions.set(harbor.id, new HarborSession(core, scope, () => this.notify()));
      core.start();
    }
    for (const [id, session] of this.sessions)
      if (!retained.has(id)) { session.dispose(); this.sessions.delete(id); }
    for (const [key, core] of this.cores)
      if (!scopes.has(key)) { core.cleanup(); this.cores.delete(key); }
      else if (!retained.has(core.workspaceScope?.harborId)) {
        const replacement = [...this.sessions.values()].find((session) => session.core === core);
        if (replacement) {
          core.workspaceScope = { ...core.workspaceScope, harborId: replacement.workspaceScope.harborId };
          core.connect();
        }
      }
    // Configuration is bounded independently of render detail. A future larger
    // workspace is explicit rather than silently opening unbounded collectors.
    this.notify();
  }
  activate(id) {
    if (this.activeId !== id) this.sessions.get(this.activeId)?.deactivate();
    this.activeId = id;
    this.sessions.get(id)?.activate();
    this.notify();
  }
  snapshots() { return new Map([...this.sessions].map(([id, session]) => [id, session.state])); }
  connections(records) { return records.map((record) => ({ ...record, ...(this.authorities.get(record.id) || {}) })); }
  dispose() {
    this.sessions.forEach((s) => s.dispose());
    this.cores.forEach((c) => c.cleanup());
    this.sessions.clear(); this.cores.clear(); this.listeners.clear(); this.authorities.clear(); this.connectionConfigurations.clear();
  }
}

export function emptyWorkspaceManager(contexts = []) {
  return { ...singletonManager, state: { ...initialState("workspace:empty"), contexts, context: "", mode: "live", configured: false, readOnly: true, discovery: [], managementEnabled: false, connectionChecks: null },
    listeners: new Set(), streamListeners: new Set(), observationPins: new Map(), started: true,
    start() {}, cleanup() {}, refreshConnection() {}, refreshMetrics() {},
    observeNamespace() {}, retainKind() { return () => {}; }, loadKind() {},
    selectSource() {}, diagnostics() { return {}; },
    request() { return Promise.reject(new Error("Önce bir liman bağlayın.")); },
  };
}
