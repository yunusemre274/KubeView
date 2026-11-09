import React, {
  Suspense,
  lazy,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
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
  Pause,
  Play,
} from "lucide-react";
import { useClusterConnection } from "./context/ShipyardClusterContext";
import { hasProblem } from "./data/resourceStore";
import { detailResourceScope } from "./data/resourceIndex.js";
import ResourceDetails from "./workbench/ResourceDetails";
import ResourceForms from "./workbench/ResourceForms";
import FacilityWindow from "./world/FacilityWindow";
import { ProviderWindow, FlowWindow } from "./world/ProviderWindows.jsx";
import useWorldProviders from "./world/useWorldProviders.js";
import {
  ConnectionWindow,
  FinderWindow,
  HelpWindow,
  NotificationsWindow,
  PreferencesWindow,
} from "./world/UtilityWindows";
import { FACILITIES, facilityFor, ownerNode } from "./world/registry";
import { acceptedOperation, observeOperation } from "./world/operations";
import { connectionStatus } from "./world/connectionState.js";
import { focusElement } from "./world/focus.js";
import {
  loadPreferences,
  savePreferences,
  resolvePreferences,
} from "./world/preferences.js";
const safeStored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const HarborScene = lazy(() => import("./harbor/HarborScene"));
function useCommittedEvent(callback) {
  const latest = useRef(callback);
  useLayoutEffect(() => {
    latest.current = callback;
  });
  return useCallback((...args) => latest.current(...args), []);
}
function ConnectionUpdateStamp() {
  const { lastUpdated } = useClusterConnection();
  return lastUpdated
    ? ` · Son veri ${new Date(lastUpdated).toLocaleTimeString("tr-TR")}`
    : null;
}
const CONNECTION_UPDATE_STAMP = <ConnectionUpdateStamp />;
export default function App() {
  const connection = useClusterConnection();
  const {
    resources,
    resourceIndex,
    api,
    context,
    mode,
    readOnly,
    stale,
    snapshotReady,
    sourceKey,
    lastUpdated,
  } = connection;
  useEffect(() => {
    globalThis.__KUBEVIEW_BENCHMARK__?.commit(resources);
  }, [resources]);
  const [namespace, setNamespace] = useState("all"),
    [panel, setPanel] = useState(null),
    [selection, setSelection] = useState(null),
    [utility, setUtility] = useState(null),
    [form, setForm] = useState(null),
    [selectedFlow, setSelectedFlow] = useState(null),
    [operations, setOperations] = useState([]);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const resolved = useMemo(
    () =>
      resolvePreferences(preferences, {
        systemReduced,
        systemDark,
        viewportWidth,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
      }),
    [preferences, systemReduced, systemDark, viewportWidth],
  );
  const { theme, quality, contrast, motion } = resolved;
  const reducedMotion = motion.reduced || motion.paused;
  const [layers, setLayers] = useState({
    nodes: true,
    pods: true,
    storage: true,
    network: false,
    labels: false,
    measuredTraffic: false,
    controlPlane: true,
  });
  const [shipControls, setShipControls] = useState({
    pausedUIDs: [],
    followUID: null,
  });
  const [shipMotion, setShipMotion] = useState(null);
  const lastShipMotion = useRef(null);
  const onShipMotionChange = useCallback((value) => {
    const previous = lastShipMotion.current;
    if (
      (!previous && !value) ||
      (previous &&
        value &&
        previous.uid === value.uid &&
        previous.state === value.state &&
        previous.paused === value.paused &&
        previous.visualLoading === value.visualLoading)
    )
      return;
    const next = value
      ? {
          uid: value.uid,
          state: value.state,
          paused: value.paused,
          visualLoading: value.visualLoading,
        }
      : null;
    lastShipMotion.current = next;
    setShipMotion(next);
  }, []);
  const onFollowEnd = useCallback(
    () =>
      setShipControls((value) =>
        value.followUID ? { ...value, followUID: null } : value,
      ),
    [],
  );
  const [guide, setGuide] = useState(
      () => safeStored("kubeview-world-guide") !== "seen",
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
  const byUID = resourceIndex.byUID;
  useEffect(() => {
    const uid = selection?.resource?.metadata?.uid;
    const keepDeletedSelection = uid && seenUIDs.current.has(uid);
    seenUIDs.current = new Set(
      resources.map((resource) => resource.metadata.uid),
    );
    if (keepDeletedSelection) seenUIDs.current.add(uid);
  }, [resources, selection?.resource?.metadata?.uid]);
  useEffect(() => {
    if (currentSource.current !== sourceKey) {
      currentSource.current = sourceKey;
      seenUIDs.current.clear();
      setSelection(null);
      setSelectedFlow(null);
      setPanel(null);
      setForm(null);
      setOperations([]);
      setNamespace(
        connection.watchNamespace || connection.namespaceHint || "all",
      );
      setShipControls({ pausedUIDs: [], followUID: null });
      setShipMotion(null);
      lastShipMotion.current = null;
    }
  }, [sourceKey]);
  const namespaceSource = useRef(sourceKey);
  const viewNamespace = useRef(namespace);
  viewNamespace.current = namespace;
  const previousNamespace = useRef(namespace);
  useEffect(() => {
    if (previousNamespace.current === namespace) return;
    previousNamespace.current = namespace;
    setSelection(null);
    setSelectedFlow(null);
    setForm(null);
    setOperations([]);
    setPanel((value) => (value?.type === "resource" ? null : value));
  }, [namespace]);
  const observeNamespace = useCommittedEvent(connection.observeNamespace);
  useEffect(() => {
    if (namespaceSource.current !== sourceKey) {
      namespaceSource.current = sourceKey;
      return;
    }
    observeNamespace(namespace, sourceKey);
  }, [namespace, sourceKey, observeNamespace]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.contrast = contrast;
  }, [theme, contrast]);
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
      dark = matchMedia("(prefers-color-scheme: dark)");
    const changeReduced = () => setSystemReduced(reduced.matches),
      changeDark = () => setSystemDark(dark.matches),
      resize = () => setViewportWidth(window.innerWidth);
    reduced.addEventListener("change", changeReduced);
    dark.addEventListener("change", changeDark);
    window.addEventListener("resize", resize);
    return () => {
      reduced.removeEventListener("change", changeReduced);
      dark.removeEventListener("change", changeDark);
      window.removeEventListener("resize", resize);
    };
  }, []);
  useEffect(() => {
    if (
      !snapshotReady ||
      (!shipControls.pausedUIDs.length && !shipControls.followUID)
    )
      return;
    const nodes = new Set(resourceIndex.nodes.map((r) => r.metadata.uid));
    const pausedUIDs = shipControls.pausedUIDs.filter((uid) => nodes.has(uid));
    const followUID = nodes.has(shipControls.followUID)
      ? shipControls.followUID
      : null;
    if (
      pausedUIDs.length !== shipControls.pausedUIDs.length ||
      followUID !== shipControls.followUID
    )
      setShipControls({ ...shipControls, pausedUIDs, followUID });
  }, [resourceIndex.nodes, snapshotReady, shipControls]);
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
  const selectedObservation = useMemo(
    () => selected && connection.resourceObservation(selected),
    [
      selected,
      connection.scopes,
      connection.tombstones,
      connection.isConnected,
      connection.upstream,
      connection.snapshotReady,
      sourceKey,
    ],
  );
  const retainKind = useCommittedEvent(connection.retainKind);
  const selectedDescriptor =
    selected &&
    connection.discovery.find(
      (d) =>
        d.kind === selected.kind &&
        `${d.group ? d.group + "/" : ""}${d.version}` === selected.apiVersion,
    );
  useEffect(() => {
    if (!selectedDescriptor) return;
    return retainKind(
      selectedDescriptor.kind,
      selected?.metadata.namespace || "",
      selectedDescriptor,
    );
  }, [selectedDescriptor, selected?.metadata.namespace, sourceKey, retainKind]);
  const selectedNode =
    selected?.kind === "Node"
      ? selected
      : selected?.kind === "Pod"
        ? resourceIndex.nodesByName.get(selected.spec?.nodeName)
        : ownerNode(selected, resources);
  const selectedNodeUID = selectedNode?.metadata.uid;
  const deleted = Boolean(selectedObservation?.deleted);
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
  const worldProviders = useWorldProviders({
    connection,
    namespace,
    trafficEnabled: layers.measuredTraffic,
    selectedUID: selected?.kind === "Pod" ? selected.metadata.uid : null,
    managementVisible: utility === "providers",
  });
  const openProviders = useCommittedEvent(() => {
    captureTrigger();
    setUtility("providers");
  });
  const selectFlow = useCommittedEvent((flow) => {
    if (formRef.current) return;
    captureTrigger();
    setSelectedFlow(flow);
    setUtility("flow");
  });
  const flowResource = useCommittedEvent((uid) => {
    const resource = byUID.get(uid);
    if (resource) selectResource(resource);
  });
  const status = connectionStatus(connection);
  function captureTrigger(trigger = document.activeElement) {
    savedTrigger.current = focusElement(trigger);
  }
  function closePanel() {
    setPanel(null);
    requestAnimationFrame(() => {
      focusElement(savedTrigger.current, document.getElementById("world-find"));
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
    setForm({
      action: "create",
      ...options,
      sourceKey,
      viewNamespace: namespace,
    });
  }
  function action(name, resource) {
    if (name === "secret-edit") {
      setForm({
        action: "edit",
        secretEdit: true,
        resource,
        sourceKey,
        viewNamespace: namespace,
      });
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
    setForm({ action: name, resource, sourceKey, viewNamespace: namespace });
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
    if (
      submitSource !== currentSource.current ||
      form?.viewNamespace !== viewNamespace.current
    )
      return;
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
  const detailSelectResource = useCommittedEvent(selectResource);
  const sceneOpenFacility = useCommittedEvent(openFacility);
  const detailsClose = useCommittedEvent(closePanel),
    detailsBack = useCommittedEvent(back),
    detailsAction = useCommittedEvent(action);
  const detailsAddPod = useCommittedEvent((node) =>
    create({ createKind: "Pod", targetNode: node }),
  );
  const detailsShow = useCommittedEvent(showInScene);
  const detailsContainer = useCommittedEvent((containerName) =>
    setSelection((s) => ({ ...s, containerName })),
  );
  const detailsPause = useCommittedEvent(() =>
    setShipControls((value) => ({
      ...value,
      pausedUIDs: value.pausedUIDs.includes(selectedNodeUID)
        ? value.pausedUIDs.filter((uid) => uid !== selectedNodeUID)
        : [...value.pausedUIDs, selectedNodeUID],
    })),
  );
  const detailsFollow = useCommittedEvent(() =>
    setShipControls((value) => ({
      ...value,
      followUID: value.followUID === selectedNodeUID ? null : selectedNodeUID,
    })),
  );
  const breadcrumb = useMemo(
    () =>
      selected?.kind === "Pod" && selectedNode
        ? [
            {
              label: selectedNode.metadata.name,
              onClick: () =>
                detailSelectResource(selectedNode, {
                  origin: { type: "facility", id: "center" },
                }),
            },
          ]
        : [],
    [selected?.kind, selectedNode, detailSelectResource],
  );
  const previousScope = useRef();
  const detailScope = useMemo(
    () => detailResourceScope(resourceIndex, selected, previousScope.current),
    [resourceIndex, selected],
  );
  useLayoutEffect(() => {
    previousScope.current = detailScope;
  }, [detailScope]);
  const detailResource = useMemo(
    () => (selection?.tab ? { ...selected, __tab: selection.tab } : selected),
    [selected, selection?.tab],
  );
  const detailMetrics = useMemo(
    () => ({
      ...connection.metrics,
      history: connection.metricHistory,
      stale: connection.stale,
    }),
    [connection.metrics, connection.metricHistory, connection.stale],
  );
  const detailEvents = selected
    ? resourceIndex.eventsByUID.get(selected.metadata.uid)
    : undefined;
  const detailMotion = useMemo(
    () =>
      selectedNodeUID && !deleted
        ? {
            state:
              shipMotion?.uid === selectedNodeUID
                ? shipMotion.state
                : undefined,
            paused: shipControls.pausedUIDs.includes(selectedNodeUID),
            following: shipControls.followUID === selectedNodeUID,
            reduced: motion.reduced,
          }
        : undefined,
    [selectedNodeUID, deleted, shipMotion, shipControls, motion.reduced],
  );
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
            resourceTombstones={connection.tombstones}
            snapshotUIDs={connection.snapshotUIDs}
            selectedContainerName={selection?.containerName}
            workloadOperations={operations}
            provisionOperations={worldProviders.provisionOperations}
            measuredFlows={worldProviders.measuredFlows}
            onFlowSelect={selectFlow}
            visibleNamespace={namespace === "all" ? null : namespace}
            snapshotReady={snapshotReady}
            selectedUID={selected?.metadata.uid}
            selectedFacility={panel?.type === "facility" ? panel.id : null}
            onSelect={detailSelectResource}
            onOpenFacility={sceneOpenFacility}
            quality={quality}
            layers={layers}
            focusRequest={focusRequest}
            focusFacilityRequest={focusFacilityRequest}
            overviewRequest={overviewRequest}
            reducedMotion={reducedMotion}
            motion={motion}
            shipControls={shipControls}
            onFollowEnd={onFollowEnd}
            onShipMotionChange={onShipMotionChange}
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
          onClick={(event) => {
            captureTrigger(event.currentTarget);
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
              onClick={(event) => {
                captureTrigger(event.currentTarget);
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
        <button
          className="world-tool world-motion-toggle"
          style={{ position: "absolute", left: 16, top: 68 }}
          aria-label={
            preferences.paused
              ? "Görsel hareketleri sürdür"
              : "Görsel hareketleri duraklat"
          }
          title={
            preferences.paused
              ? "Görsel hareketleri sürdür · Kubernetes verisi devam ediyor"
              : "Görsel hareketleri duraklat · yalnız görsel sunum"
          }
          aria-pressed={preferences.paused}
          onClick={() =>
            setPreferences((value) => ({ ...value, paused: !value.paused }))
          }
        >
          {preferences.paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        {guide && !panel && !utility && (
          <div className="world-first-guide">
            {mode !== "demo" && !snapshotReady ? (
              <div className="connection-onboarding-actions">
                <button
                  className="button button-primary"
                  onClick={() => setUtility("connection")}
                >
                  Kendi Kubernetes kümeme bağlan
                </button>
                <button
                  className="button"
                  onClick={() => connection.selectSource("__demo__")}
                >
                  Demo ile incele
                </button>
              </div>
            ) : null}
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
                try {
                  localStorage.setItem("kubeview-world-guide", "seen");
                } catch {}
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
            onProviders={openProviders}
            measuredFlows={worldProviders.measuredFlows}
            trafficEnabled={layers.measuredTraffic}
            onEnableTraffic={() =>
              setLayers((value) => ({ ...value, measuredTraffic: true }))
            }
            onFlowSelect={selectFlow}
          />
        )}
        {panel?.type === "resource" && selected && (
          <ResourceDetails
            key={selected.metadata.uid}
            resource={detailResource}
            deleted={deleted}
            observation={selectedObservation}
            cluster={mode === "demo" ? "Demo — örnek veri" : context}
            updateStamp={CONNECTION_UPDATE_STAMP}
            resources={detailScope.resources}
            onClose={detailsClose}
            onBack={detailsBack}
            breadcrumb={breadcrumb}
            onAddPod={detailsAddPod}
            onShowInScene={detailsShow}
            selectedContainerName={selection?.containerName}
            onSelectContainer={detailsContainer}
            visualMotion={detailMotion}
            onToggleShipPause={detailsPause}
            onToggleShipFollow={detailsFollow}
            onAction={detailsAction}
            api={api}
            metrics={detailMetrics}
            events={detailEvents}
            readOnly={
              mutationDisabled || selectedObservation?.status !== "live"
            }
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
            preferences={preferences}
            onPreferences={setPreferences}
            motion={motion}
            layers={layers}
            onLayers={setLayers}
            onProviders={openProviders}
            onClose={() => setUtility(null)}
            mode={mode}
            onDemoScenario={() => {
              setUtility(null);
              connection.runDemoScenario();
            }}
          />
        )}
        {utility === "providers" && (
          <ProviderWindow
            {...worldProviders}
            context={context}
            readOnly={mutationDisabled}
            onRefresh={worldProviders.refresh}
            onAddWorker={worldProviders.addWorker}
            onCancelWorker={worldProviders.cancelWorker}
            onClose={() => setUtility(null)}
          />
        )}
        {utility === "flow" && (
          <FlowWindow
            flow={
              worldProviders.measuredFlows.flows.find(
                (f) => f.id === selectedFlow?.id,
              ) || selectedFlow
            }
            measuredFlows={worldProviders.measuredFlows}
            context={context}
            onSelectResource={flowResource}
            onClose={() => setUtility(null)}
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
            readOnly={
              mutationDisabled ||
              Boolean(
                form.resource &&
                connection.resourceObservation(form.resource).status !== "live",
              )
            }
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
