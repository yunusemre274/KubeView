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
const EMPTY_RESOURCES = Object.freeze([]);

const Context = createContext(null);
// One manager per browser. Each context change invalidates every old callback.
export const singletonManager = {
  state: {
    ...initialState(),
    contexts: [],
    context: "",
    mode: "live",
    configured: false,
    readOnly: true,
    discovery: [],
  },
  listeners: new Set(),
  socket: null,
  epoch: 0,
  retry: null,
  poll: null,
  demoTimers: [],
  started: false,
  storeTimings: [],
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
    return url;
  },
  async request(path, options = {}) {
    const requestEpoch = this.epoch;
    if (this.state.mode === "demo")
      throw new Error(
        "Demo — örnek veri. Canlı Kubernetes işlemleri bu veri kaynağında kapalı.",
      );
    const response = await fetch(this.url(path), {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body:
        options.body && typeof options.body !== "string"
          ? JSON.stringify(options.body)
          : options.body,
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("json")
      ? await response.json()
      : await response.text();
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
      });
      if (epoch !== this.epoch) return;
      this.selectSource(result.current || result.contexts?.[0]?.name || "");
    } catch (error) {
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
    const epoch = this.epoch;
    const before = this.state.resources;
    try {
      const list = await this.request(
        "/api/resources?" +
          new URLSearchParams({
            group: descriptor.group,
            version: descriptor.version,
            resource: descriptor.resource,
            namespace: namespace === "all" ? "" : namespace,
          }),
      );
      if (epoch !== this.epoch) return;
      const version =
        (descriptor.group ? descriptor.group + "/" : "") + descriptor.version;
      const next = { ...this.state.resources };
      for (const [uid, r] of Object.entries(before))
        if (
          r.kind === kind &&
          r.apiVersion === version &&
          (namespace === "all" ||
            !r.metadata.namespace ||
            r.metadata.namespace === namespace) &&
          next[uid] === r
        )
          delete next[uid];
      for (const r of list.items || []) {
        const uid = r.metadata?.uid;
        if (!uid) continue;
        // Do not undo newer watch updates/deletes received while this list was in flight.
        if (before[uid] && !this.state.resources[uid]) continue;
        if (
          this.state.resources[uid] &&
          this.state.resources[uid] !== before[uid]
        )
          continue;
        const replaced = Object.values(this.state.resources).some(
          (old) =>
            old.metadata.uid !== uid &&
            old.kind === r.kind &&
            old.apiVersion === r.apiVersion &&
            old.metadata.name === r.metadata.name &&
            old.metadata.namespace === r.metadata.namespace,
        );
        if (!replaced) next[uid] = r;
      }
      this.publish({ resources: next });
      return list;
    } catch (error) {
      if (epoch === this.epoch)
        this.publish({
          errors: [...new Set([error.message, ...this.state.errors])].slice(
            0,
            30,
          ),
        });
      throw error;
    }
  },
  cleanup() {
    ++this.epoch;
    clearTimeout(this.retry);
    clearInterval(this.poll);
    this.demoTimers.forEach(clearTimeout);
    this.demoTimers = [];
    this.storeTimings = [];
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  },
  selectSource(context) {
    this.cleanup();
    const mode = context === "__demo__" ? "demo" : "live";
    this.publish({
      ...initialState(`${mode}:${context}:${this.epoch}`),
      context: mode === "demo" ? "" : context,
      mode,
      discovery: [],
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
    this.connect();
    const epoch = this.epoch;
    this.request("/api/discovery")
      .then((data) => {
        if (epoch === this.epoch)
          this.publish({ discovery: data.resources || [] });
      })
      .catch((error) => {
        if (epoch === this.epoch)
          this.publish({ errors: [...this.state.errors, error.message] });
      });
    const metrics = async () => {
      try {
        const data = await this.request("/api/metrics");
        if (epoch === this.epoch) {
          this.state = appendMetrics(this.state, data);
          this.publish();
        }
      } catch (error) {
        if (epoch === this.epoch) {
          this.state = appendMetrics(this.state, {
            available: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          this.publish();
        }
      }
    };
    metrics();
    this.poll = setInterval(() => {
      if (!document.hidden) metrics();
    }, 15000);
  },
  connect() {
    const epoch = this.epoch;
    const url = this.url("/ws");
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    globalThis.__KUBEVIEW_BENCHMARK__?.connection?.(socket);
    this.socket = socket;
    socket.onopen = () => {
      if (epoch === this.epoch) this.publish({ isConnected: true });
    };
    socket.onmessage = (e) => {
      if (epoch !== this.epoch || socket !== this.socket) return;
      try {
        const t = performance.now();
        const message = JSON.parse(e.data);
        const parsed = performance.now();
        this.state = reduceMessage(this.state, message);
        const elapsed = performance.now() - t;
        this.storeTimings.push(elapsed);
        if (this.storeTimings.length > 500) this.storeTimings.shift();
        this.publish({ lastStoreLatency: elapsed });
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
      if (epoch === this.epoch) this.publish({ stale: true, upstream: false });
    };
    socket.onclose = () => {
      if (epoch !== this.epoch) return;
      this.publish({ isConnected: false, stale: true });
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
export function ShipyardClusterProvider({ children }) {
  const [state, setState] = useState(singletonManager.state);
  useEffect(() => {
    singletonManager.listeners.add(setState);
    singletonManager.start();
    if (import.meta.env.DEV)
      window.__kubeviewDiagnostics = () => singletonManager.diagnostics();
    return () => singletonManager.listeners.delete(setState);
  }, []);
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
    () => ({
      request: (path, options) => {
        if (state.sourceKey !== singletonManager.state.sourceKey)
          return Promise.reject(
            new Error(
              "Bu işlem önceki bağlantı kapsamına ait. Kaynağı yeni bağlantıda tekrar açın.",
            ),
          );
        return singletonManager.request(path, options);
      },
      url: (path) => singletonManager.url(path).toString(),
      context: state.context,
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
    }),
    [state.context, state.mode, state.discovery, state.sourceKey],
  );
  return (
    <Context.Provider
      value={{
        ...state,
        resources,
        resourceIndex,
        api,
        login: (token) => singletonManager.login(token),
        loadKind: singletonManager.loadKind.bind(singletonManager),
        selectSource: (name) => singletonManager.selectSource(name),
        runDemoScenario: () => singletonManager.runDemoScenario(),
        refresh: () => {
          if (state.mode !== "demo" && (!state.context || !state.configured)) {
            singletonManager.started = false;
            return singletonManager.start();
          }
          return singletonManager.selectSource(
            state.mode === "demo" ? "__demo__" : state.context,
          );
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
