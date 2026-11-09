import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShipyardClusterProvider, singletonManager } from "./ShipyardClusterContext.jsx";
import { WorkspaceRegistry, emptyWorkspaceManager } from "./WorkspaceRegistry.js";
import { browserTabId, HarborViewCache, safeHarborView } from "../world/workspace.js";

export default function WorkspaceProvider({ children }) {
  const registryRef = useRef(null), views = useRef(new HarborViewCache()), current = useRef(null),
    mounted = useRef(false), bootstrapGeneration = useRef(0), bootstrapAbort = useRef(null), mutationQueue = useRef(Promise.resolve()), demoMode = useRef(false);
  if (!registryRef.current) registryRef.current = new WorkspaceRegistry(browserTabId());
  const registry = registryRef.current;
  const [record, setRecord] = useState(null), [contexts, setContexts] = useState([]),
    [activeId, setActiveId] = useState(null), [error, setError] = useState(null),
    [loading, setLoading] = useState(true), [demo, setDemo] = useState(false),
    [sourceInfo, setSourceInfo] = useState({}), [authRequired, setAuthRequired] = useState(false);
  const empty = useMemo(() => emptyWorkspaceManager(contexts), [contexts]);
  const apply = useCallback((workspace, trustedContexts) => {
    current.current = workspace;
    registry.configure(workspace, trustedContexts);
    let previous;
    try { previous = sessionStorage.getItem(`kubeview-active-harbor:${workspace.id}`); } catch { /* memory only */ }
    const id = demoMode.current ? null : workspace.harbors.some((h) => h.id === registry.activeId) ? registry.activeId
      : workspace.harbors.find((h) => h.id === previous)?.id || workspace.harbors[0]?.id || null;
    registry.activate(id);
    setRecord(workspace); setActiveId(id);
    return workspace;
  }, [registry]);
  const bootstrap = useCallback(async () => {
    const generation = ++bootstrapGeneration.current;
    bootstrapAbort.current?.abort();
    const abort = new AbortController();
    bootstrapAbort.current = abort;
    setLoading(true); setError(null);
    try {
      const [workspaceResponse, contextResponse] = await Promise.all([
        fetch("/api/workspace", { credentials: "same-origin", signal: abort.signal }),
        fetch("/api/contexts", { credentials: "same-origin", signal: abort.signal }),
      ]);
      if (!mounted.current || generation !== bootstrapGeneration.current || abort.signal.aborted) return;
      if (!workspaceResponse.ok) {
        setAuthRequired(workspaceResponse.status === 401);
        throw new Error(workspaceResponse.status === 401 ? "Uygulama erişim token'ı gerekli." : `Workspace okunamadı (HTTP ${workspaceResponse.status}). Mevcut dosya sıfırlanmadı.`);
      }
      const workspace = await workspaceResponse.json();
      if (workspace.schemaVersion !== 1) throw new Error("Bu workspace şema sürümü desteklenmiyor; veri değiştirilmedi.");
      const discovered = contextResponse.ok ? await contextResponse.json() : {};
      if (!mounted.current || generation !== bootstrapGeneration.current || abort.signal.aborted) return;
      setSourceInfo({ dataSource: discovered.dataSource, sourceLabel: discovered.sourceLabel });
      setContexts(discovered.contexts || []);
      setAuthRequired(false);
      apply(workspace, discovered.contexts || []);
    } catch (failure) {
      if (mounted.current && generation === bootstrapGeneration.current && !abort.signal.aborted) setError(failure.message);
    }
    finally { if (mounted.current && generation === bootstrapGeneration.current) setLoading(false); }
  }, [apply]);
  useEffect(() => {
    mounted.current = true;
    bootstrap();
    return () => { mounted.current = false; ++bootstrapGeneration.current; bootstrapAbort.current?.abort(); registry.dispose(); };
  }, [bootstrap, registry]);
  const request = useCallback(async (route, options = {}) => {
    const workspace = current.current;
    if (!workspace) throw new Error("Workspace henüz yüklenmedi.");
    const response = await fetch(route, { ...options, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-KubeView-Workspace-Nonce": workspace.workspaceNonce || "", ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify({ revision: workspace.revision, ...options.body }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || data.error || `Workspace işlemi reddedildi (HTTP ${response.status}).`);
    return data;
  }, []);
  const mutate = useCallback(async (route, options) => {
    const pending = mutationQueue.current.catch(() => {}).then(async () => {
      if (!mounted.current) throw new Error("Workspace kapandı; yeni yapılandırma isteği gönderilmedi.");
      const data = await request(route, options);
      const workspace = data.workspace || data;
      if (!mounted.current) return workspace;
      if (workspace.schemaVersion === 1) return apply(workspace, contexts);
      const response = await fetch("/api/workspace", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Değişiklikten sonra workspace yeniden okunamadı.");
      const reloaded = await response.json();
      return mounted.current ? apply(reloaded, contexts) : reloaded;
    });
    mutationQueue.current = pending;
    return pending;
  }, [request, apply, contexts]);
  const selectHarbor = useCallback((id) => {
    if (!current.current?.harbors.some((h) => h.id === id)) return;
    demoMode.current = false; setDemo(false); registry.activate(id); setActiveId(id);
    try { sessionStorage.setItem(`kubeview-active-harbor:${current.current.id}`, id); } catch { /* memory only */ }
  }, [registry]);
  const activeHarbor = record?.harbors.find((h) => h.id === activeId);
  const workspace = useMemo(() => ({
    record, activeHarbor, activeId, loading, error, contexts, authRequired, ...sourceInfo, tabId: registry.tabId, registry,
    reload: bootstrap, request, mutate, selectHarbor,
    view: views.current.get(activeId) || safeHarborView(activeHarbor?.view),
    saveView(id, value) { views.current.set(id, value); },
    getView(id) { return views.current.get(id); },
    async persistView(id, value) {
      const harbor = current.current?.harbors.find((h) => h.id === id);
      if (!harbor) return;
      return mutate(`/api/workspace/harbors/${encodeURIComponent(id)}`, { method: "PATCH", body: { harbor: { ...harbor, view: safeHarborView(value) } } });
    },
    async login(token) {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      if (!response.ok) throw new Error("Uygulama oturumu açılamadı.");
      return bootstrap();
    },
    enterDemo() { demoMode.current = true; registry.activate(null); setActiveId(null); singletonManager.selectSource("__demo__"); setDemo(true); },
  }), [record, activeHarbor, activeId, loading, error, contexts, authRequired, sourceInfo, registry, bootstrap, request, mutate, selectHarbor]);
  const manager = demo ? singletonManager : registry.sessions.get(activeId) || empty;
  return <ShipyardClusterProvider manager={manager} workspace={workspace}>{children}</ShipyardClusterProvider>;
}
