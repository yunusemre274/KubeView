import React, {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Anchor,
  Search,
  Compass,
  Settings,
  HelpCircle,
  X,
  Activity,
  AlertTriangle,
  Focus,
  ArrowUpRight,
} from "lucide-react";
import { useClusterConnection } from "./context/ShipyardClusterContext";
import { hasProblem } from "./data/resourceStore";
import ResourceDetails from "./workbench/ResourceDetails";
import ResourceForms from "./workbench/ResourceForms";
import FacilityWindow from "./world/FacilityWindow";
import {
  ConnectionWindow,
  FinderWindow,
  HelpWindow,
  NotificationsWindow,
  PreferencesWindow,
} from "./world/UtilityWindows";
import { FACILITIES, facilityFor, ownerNode } from "./world/registry";
import { acceptedOperation, observeOperation } from "./world/operations";
const HarborScene = lazy(() => import("./harbor/HarborScene"));
export default function App() {
  const connection = useClusterConnection();
  const {
    resources,
    api,
    context,
    mode,
    readOnly,
    stale,
    snapshotReady,
    sourceKey,
    lastUpdated,
  } = connection;
  const [namespace, setNamespace] = useState("all"),
    [panel, setPanel] = useState(null),
    [selection, setSelection] = useState(null),
    [utility, setUtility] = useState(null),
    [form, setForm] = useState(null),
    [operations, setOperations] = useState([]);
  const [theme, setTheme] = useState(
      () => localStorage.getItem("kubeview-theme") || "light",
    ),
    [quality, setQuality] = useState(
      () => localStorage.getItem("kubeview-quality") || "medium",
    ),
    [layers, setLayers] = useState({
      nodes: true,
      pods: true,
      storage: true,
      network: false,
      labels: false,
    }),
    [reducedMotion, setReducedMotion] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const [guide, setGuide] = useState(
      () => localStorage.getItem("kubeview-world-guide") !== "seen",
    ),
    [focusRequest, setFocusRequest] = useState(0),
    [overviewRequest, setOverviewRequest] = useState(0),
    [focusFacilityRequest, setFocusFacilityRequest] = useState(null),
    [clock, setClock] = useState(Date.now());
  const currentSource = useRef(sourceKey),
    seenUIDs = useRef(new Set()),
    formRef = useRef(form),
    utilityRef = useRef(utility),
    panelRef = useRef(panel),
    savedTrigger = useRef(null);
  formRef.current = form;
  utilityRef.current = utility;
  panelRef.current = panel;
  const byUID = useMemo(
    () => new Map(resources.map((r) => [r.metadata.uid, r])),
    [resources],
  );
  useEffect(() => {
    for (const r of resources) seenUIDs.current.add(r.metadata.uid);
  }, [resources]);
  useEffect(() => {
    if (currentSource.current !== sourceKey) {
      currentSource.current = sourceKey;
      seenUIDs.current.clear();
      setSelection(null);
      setPanel(null);
      setForm(null);
      setOperations([]);
      setNamespace("all");
    }
  }, [sourceKey]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kubeview-theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("kubeview-quality", quality);
  }, [quality]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!operations.length) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [operations.length]);
  useEffect(() => {
    const key = (e) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k" &&
        !formRef.current
      ) {
        e.preventDefault();
        setUtility("finder");
      }
      if (
        e.key === "Escape" &&
        !document.querySelector(".resource-form-dialog") &&
        !document.querySelector(".world-window") &&
        !document.querySelector(".resource-details")
      ) {
        setUtility(null);
        setPanel(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const selected = selection
    ? byUID.get(selection.resource.metadata.uid) || selection.resource
    : null;
  const deleted = Boolean(
    selected &&
    snapshotReady &&
    seenUIDs.current.has(selected.metadata.uid) &&
    !byUID.has(selected.metadata.uid),
  );
  const tracked = useMemo(
    () => operations.map((op) => observeOperation(op, byUID, clock)),
    [operations, byUID, clock],
  );
  const activeCount = tracked.filter((op) =>
    ["accepted", "reconciling", "partial", "failed", "timed-out"].includes(
      op.status,
    ),
  ).length;
  const problems = resources.filter(
    (r) => (r.kind === "Node" || r.kind === "Pod") && hasProblem(r),
  ).length;
  const mutationDisabled = readOnly || mode === "demo" || stale;
  const status =
    mode === "demo"
      ? "Demo — örnek veri"
      : connection.authRequired
        ? "Oturum gerekli"
        : !connection.isConnected
          ? "Bağlantı yok"
          : !connection.upstream
            ? "API bekleniyor"
            : stale
              ? "Veri güncel değil"
              : connection.errors.length
                ? "Kısmi erişim"
                : "Canlı";
  function captureTrigger() {
    savedTrigger.current = document.activeElement;
  }
  function closePanel() {
    setPanel(null);
    requestAnimationFrame(() => {
      if (savedTrigger.current?.isConnected) savedTrigger.current.focus();
      else document.getElementById("world-find")?.focus();
    });
  }
  function openFacility(id) {
    if (formRef.current) return;
    captureTrigger();
    setUtility(null);
    setPanel({ type: "facility", id });
    if (connection.authRequired) setUtility("connection");
  }
  function selectResource(resource, options = {}) {
    if (!resource?.metadata?.uid || formRef.current) return;
    captureTrigger();
    setUtility(null);
    const node = ownerNode(resource, resources);
    const origin =
      options.origin ||
      (panelRef.current?.type === "facility"
        ? panelRef.current
        : node && node.metadata.uid !== resource.metadata.uid
          ? { type: "resource", resource: node }
          : { type: "facility", id: facilityFor(resource) || "center" });
    setSelection({ resource, containerName: options.containerName, origin });
    setPanel({ type: "resource" });
  }
  function back() {
    if (selection?.containerName) {
      setSelection((s) => ({ ...s, containerName: null, tab: null }));
      return;
    }
    const origin = selection?.origin;
    if (origin?.type === "resource") {
      setSelection({
        resource: byUID.get(origin.resource.metadata.uid) || origin.resource,
        origin: { type: "facility", id: "center" },
      });
      setPanel({ type: "resource" });
    } else if (origin?.id) {
      setPanel(origin);
    } else closePanel();
  }
  function create(options = {}) {
    setUtility(null);
    setForm({ action: "create", ...options, sourceKey });
  }
  function action(name, resource) {
    if (name === "secret-edit") {
      setForm({ action: "edit", secretEdit: true, resource, sourceKey });
      return;
    }
    if (name === "inspect") {
      selectResource(resource);
      return;
    }
    if (name === "logs") {
      selectResource(resource, { containerName: selection?.containerName });
      setSelection((s) => ({ ...s, tab: "logs" }));
      return;
    }
    if (name === "focus") {
      showInScene(resource);
      return;
    }
    setForm({ action: name, resource, sourceKey });
  }
  function showInScene(resource) {
    if (resource.kind === "Node" || resource.kind === "Pod") {
      setSelection({ resource, origin: selection?.origin });
      setFocusRequest((n) => n + 1);
    } else
      setFocusFacilityRequest({
        id: facilityFor(resource) || "center",
        revision: Date.now(),
      });
    setPanel(null);
    setUtility(null);
  }
  function submit(result, meta = {}) {
    const submitSource = form?.sourceKey;
    if (submitSource !== currentSource.current) return;
    const op = acceptedOperation(
      result,
      { ...meta, action: meta.action || form?.action },
      sourceKey,
    );
    setOperations((list) => [op, ...list].slice(0, 30));
    setForm(null);
    // Observe generic/discovered resources with a real authoritative read, never local success insertion.
    const r = op.resource;
    if (r?.kind && mode !== "demo")
      connection.loadKind(r.kind, namespace).catch(() => {});
    if (r?.metadata?.uid) {
      setSelection({
        resource: r,
        origin:
          panel?.type === "facility"
            ? panel
            : selection?.origin || { type: "facility", id: "center" },
      });
      setPanel({ type: "resource" });
    }
  }
  function focusFacility(id) {
    setPanel(null);
    setFocusFacilityRequest({ id, revision: Date.now() });
  }
  const breadcrumb =
    selected?.kind === "Pod" && ownerNode(selected, resources)
      ? [
          {
            label: ownerNode(selected, resources).metadata.name,
            onClick: () =>
              selectResource(ownerNode(selected, resources), {
                origin: { type: "facility", id: "center" },
              }),
          },
        ]
      : [];
  return (
    <main className="world-root" aria-label="KubeView etkileşimli tersane">
      <a href="#world-find" className="skip-link">
        Nesne bulucusuna geç
      </a>
      <div
        className="world-canvas"
        role="region"
        aria-label="Etkileşimli 3D liman"
      >
        <Suspense
          fallback={
            <div className="world-loading">
              <Anchor size={32} />
              <p>Tersane hazırlanıyor…</p>
            </div>
          }
        >
          <HarborScene
            resources={resources}
            visibleNamespace={namespace === "all" ? null : namespace}
            snapshotReady={snapshotReady}
            selectedUID={selected?.metadata.uid}
            selectedFacility={panel?.type === "facility" ? panel.id : null}
            onSelect={selectResource}
            onOpenFacility={openFacility}
            quality={quality}
            layers={layers}
            focusRequest={focusRequest}
            focusFacilityRequest={focusFacilityRequest}
            overviewRequest={overviewRequest}
            reducedMotion={reducedMotion}
            sourceKey={sourceKey}
            isStale={mode !== "demo" && stale}
          />
        </Suspense>
      </div>
      <div className="world-overlay">
        <button
          className={`world-brand-control ${mode === "demo" ? "is-demo" : stale ? "is-stale" : ""}`}
          aria-label="Bağlantı ve cluster kapsamını aç"
          title="Bağlantı ve kapsam"
          onClick={() => {
            captureTrigger();
            setUtility("connection");
          }}
        >
          <span className="world-brand-mark">
            <Anchor size={19} />
          </span>
          <strong>KubeView</strong>
          <span className="brand-separator" />
          <span className="world-cluster-name">
            {mode === "demo" ? "Tersane demo" : context || "Tersane"}
          </span>
          <span className="connection-light" />
          <span className="connection-short">{status}</span>
        </button>
        <div
          className="world-tools"
          role="toolbar"
          aria-label="Liman yardımcı kontrolleri"
        >
          {[
            ["finder", "Bul", Search],
            ["home", "Limana dön", Compass],
            ["preferences", "Görünüm ve ayarlar", Settings],
            ["help", "Yardım", HelpCircle],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              id={id === "finder" ? "world-find" : undefined}
              className="world-tool"
              aria-label={label}
              title={id === "finder" ? `${label} · Cmd/Ctrl+K` : label}
              aria-pressed={utility === id}
              onClick={() => {
                captureTrigger();
                if (id === "home") {
                  if (form) return;
                  setPanel(null);
                  setUtility(null);
                  setOverviewRequest((n) => n + 1);
                } else if (!form)
                  setUtility((current) => (current === id ? null : id));
              }}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
        {guide && !panel && !utility && (
          <div className="world-first-guide">
            <p>
              <strong>Merkez:</strong> yönetim <span>·</span>{" "}
              <strong>Gemi:</strong> Node <span>·</span>{" "}
              <strong>Konteynır:</strong> Pod/container
            </p>
            <button
              className="icon-button"
              aria-label="Kısa rehberi kapat"
              onClick={() => {
                setGuide(false);
                localStorage.setItem("kubeview-world-guide", "seen");
              }}
            >
              <X size={17} />
            </button>
          </div>
        )}
        {(operations.length > 0 || problems > 0) && (
          <button
            className={`world-notification ${panel ? "notification-with-panel" : ""}`}
            aria-label={`Olaylar ve işlemler: ${activeCount} işlem, ${problems} sorunlu kaynak`}
            onClick={() => setUtility("notifications")}
            title="Olaylar ve işlem takibi"
          >
            {problems && !activeCount ? (
              <AlertTriangle size={17} />
            ) : (
              <Activity size={17} />
            )}
            <span>
              {activeCount
                ? `${activeCount} işlem`
                : problems
                  ? `${problems} sorun`
                  : "İşlem geçmişi"}
            </span>
          </button>
        )}
        {namespace !== "all" && !panel && !utility && (
          <button
            className="world-scope-chip"
            onClick={() => setUtility("connection")}
          >
            {namespace}
            <span>Namespace kapsamı</span>
          </button>
        )}
        {panel?.type === "facility" && (
          <FacilityWindow
            key={panel.id}
            id={panel.id}
            connection={connection}
            namespace={namespace}
            onNamespace={setNamespace}
            onClose={closePanel}
            onSelect={selectResource}
            onAction={action}
            onCreate={create}
            onFocus={focusFacility}
            onConnection={() => setUtility("connection")}
          />
        )}
        {panel?.type === "resource" && selected && (
          <ResourceDetails
            key={selected.metadata.uid}
            resource={{
              ...selected,
              ...(selection?.tab ? { __tab: selection.tab } : {}),
            }}
            deleted={deleted}
            cluster={mode === "demo" ? "Demo — örnek veri" : context}
            lastUpdated={lastUpdated}
            resources={resources}
            onClose={closePanel}
            onBack={back}
            breadcrumb={breadcrumb}
            onAddPod={(node) => create({ createKind: "Pod", targetNode: node })}
            onShowInScene={showInScene}
            selectedContainerName={selection?.containerName}
            onSelectContainer={(containerName) =>
              setSelection((s) => ({ ...s, containerName }))
            }
            onAction={action}
            api={api}
            metrics={{
              ...connection.metrics,
              history: connection.metricHistory,
            }}
            events={resources.filter((r) => r.kind === "Event")}
            readOnly={mutationDisabled}
          />
        )}
        {utility === "connection" && (
          <ConnectionWindow
            connection={connection}
            namespace={namespace}
            onNamespace={setNamespace}
            onClose={() => setUtility(null)}
          />
        )}
        {utility === "finder" && (
          <FinderWindow
            connection={connection}
            namespace={namespace}
            onSelect={selectResource}
            onFacility={openFacility}
            onClose={() => setUtility(null)}
          />
        )}
        {utility === "preferences" && (
          <PreferencesWindow
            theme={theme}
            onTheme={setTheme}
            quality={quality}
            onQuality={setQuality}
            layers={layers}
            onLayers={setLayers}
            reducedMotion={reducedMotion}
            onReducedMotion={setReducedMotion}
            onClose={() => setUtility(null)}
            mode={mode}
            onDemoScenario={() => {
              setUtility(null);
              connection.runDemoScenario();
            }}
          />
        )}
        {utility === "help" && <HelpWindow onClose={() => setUtility(null)} />}
        {utility === "notifications" && (
          <NotificationsWindow
            operations={tracked}
            connection={connection}
            namespace={namespace}
            onSelect={selectResource}
            onClose={() => setUtility(null)}
          />
        )}
        {form && (
          <ResourceForms
            {...form}
            cluster={context}
            namespace={
              namespace === "all"
                ? connection.watchNamespace || "default"
                : namespace
            }
            api={api}
            resources={resources}
            readOnly={mutationDisabled}
            onClose={() => setForm(null)}
            onSubmitted={submit}
          />
        )}
      </div>
      <div className="sr-only" aria-live="polite">
        {status}. {connection.totalShips} gerçek Node, {connection.totalPallets}{" "}
        gerçek Pod. Kaynak ve tesislere Bul kontrolüyle ulaşabilirsiniz.
      </div>
    </main>
  );
}
