// Narrow extensions for run.mjs; no launcher, timer loop, provider or product hook.
// These are synthetic API status replays, never real Node/container failure E2E.
import { apply, digest, signature } from "./fixtures.mjs";

export const REPAIR_SCENARIO_VERSION = "pre-v11-visual-repair-v1";
export const REPAIR_SCENARIOS = Object.freeze([
  "repair-node",
  "repair-container",
  "repair-burst",
]);
const CLOCK = Date.parse("2026-11-01T00:00:00Z");
const uid = (r) => r.metadata.uid;
const ready = (r) =>
  r.status?.conditions?.find((c) => c.type === "Ready")?.status === "True";
const same = (a, b) =>
  JSON.stringify(signature(a)) === JSON.stringify(signature(b));
const time = (atMs) => new Date(CLOCK + atMs).toISOString();

/** Same canonical input on frozen baseline and candidate; no visual-only setters. */
export function repairScenario(
  resources,
  scenario,
  { duration = 60, startSequence = 1 } = {},
) {
  if (!REPAIR_SCENARIOS.includes(scenario))
    throw Error(`Unknown repair scenario ${scenario}`);
  if (
    !(duration >= 30) ||
    !Number.isInteger(startSequence) ||
    startSequence < 1
  )
    throw Error("Repair cases need >=30s and a positive integral sequence");
  const nodes = resources
    .filter((r) => r.kind === "Node" && ready(r))
    .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name, "en"));
  const visibleNames = new Set(nodes.slice(0, 8).map((n) => n.metadata.name));
  const pods = resources
    .filter(
      (r) =>
        r.kind === "Pod" &&
        ready(r) &&
        visibleNames.has(r.spec?.nodeName) &&
        !r.metadata.deletionTimestamp &&
        (r.spec.containers?.length || 0) > 1,
    )
    .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name, "en"));
  const targetNodes = nodes.slice(0, scenario === "repair-burst" ? 2 : 1),
    targetPods = pods.slice(0, scenario === "repair-burst" ? 8 : 1);
  if (!targetNodes.length || !targetPods.length)
    throw Error(
      "Repair fixture requires a healthy Node and visible healthy multi-container Pod",
    );
  const events = [],
    checkpoints = [];
  const push = (original, object, atMs, stage) => {
    object.metadata.resourceVersion = `repair-${scenario}-${startSequence + events.length}`;
    events.push({
      action: "UPDATE",
      object,
      atMs,
      sequence: startSequence + events.length,
      repairStage: stage,
      targetUID: uid(original),
    });
  };
  const nodeChange = (original, status, atMs, stage) => {
    const object = structuredClone(original);
    object.status.conditions = (object.status.conditions || []).map((c) =>
      c.type === "Ready"
        ? {
            ...c,
            status,
            lastTransitionTime: time(atMs),
            reason:
              status === "False"
                ? "BenchmarkStatusInjection"
                : "BenchmarkRecovered",
          }
        : c,
    );
    push(original, object, atMs, stage);
    return object;
  };
  const podChange = (original, failed, atMs, stage) => {
    const object = structuredClone(original),
      name = object.spec.containers[0].name;
    const count =
      (original.status.containerStatuses.find((c) => c.name === name)
        ?.restartCount || 0) + 1;
    object.status.containerStatuses = object.status.containerStatuses.map(
      (c) =>
        c.name !== name
          ? c
          : {
              ...c,
              ready: !failed,
              restartCount: count,
              lastState: {
                terminated: {
                  exitCode: 7,
                  reason: "Error",
                  finishedAt: time(1500),
                },
              },
              state: failed
                ? { waiting: { reason: "CrashLoopBackOff" } }
                : { running: { startedAt: time(atMs) } },
            },
    );
    object.status.conditions = object.status.conditions.map((c) =>
      c.type === "Ready"
        ? {
            ...c,
            status: failed ? "False" : "True",
            lastTransitionTime: time(atMs),
          }
        : c,
    );
    push(original, object, atMs, stage);
    return object;
  };
  if (scenario !== "repair-container")
    for (const [i, node] of targetNodes.entries()) {
      const failed = nodeChange(node, "False", 1000 + i * 32, "node-fault");
      push(
        node,
        structuredClone(failed),
        4000 + i * 32,
        "duplicate-node-fault",
      );
      nodeChange(node, "True", 13000 + i * 32, "node-recovery");
    }
  if (scenario !== "repair-node")
    for (const [i, pod] of targetPods.entries()) {
      const failed = podChange(pod, true, 1500 + i * 32, "container-fault");
      push(
        pod,
        structuredClone(failed),
        4200 + i * 32,
        "duplicate-container-fault",
      );
      // Recovery keeps the increased restartCount/last termination within this UID.
      podChange(pod, false, 9000 + i * 32, "container-recovery");
    }
  events.sort((a, b) => a.atMs - b.atMs || a.sequence - b.sequence);
  events.forEach((event, i) => {
    event.sequence = startSequence + i;
    event.object.metadata.resourceVersion = `repair-${scenario}-${event.sequence}`;
  });
  // A final ordinary UPDATE re-renders after all visual transitions, without
  // resetting a real restart counter or deleting/recreating a target UID.
  const recovered = apply(resources, events).find(
    (r) =>
      uid(r) ===
      (scenario === "repair-node" ? uid(targetNodes[0]) : uid(targetPods[0])),
  );
  push(recovered, structuredClone(recovered), 22000, "cleanup-observation");
  for (const atMs of [
    0,
    3000,
    5500,
    10000,
    16000,
    24000,
    Math.round(duration * 1000),
  ])
    checkpoints.push({
      atMs,
      phase:
        atMs < 1000
          ? "before"
          : atMs < 9000
            ? "effect"
            : atMs < 17000
              ? "recovery"
              : "cleanup",
    });
  return {
    version: REPAIR_SCENARIO_VERSION,
    scenario,
    duration,
    source:
      "SYNTHETIC STATUS REPLAY through production informer/WebSocket/store; not Kubernetes fault E2E",
    initialDigest: digest(resources),
    events,
    checkpoints,
    targets: {
      nodes: scenario === "repair-container" ? [] : targetNodes.map(uid),
      containers:
        scenario === "repair-node"
          ? []
          : targetPods.map((p) => ({
              uid: uid(p),
              name: p.spec.containers[0].name,
              healthyNames: p.spec.containers.slice(1).map((c) => c.name),
            })),
    },
    expectedDigest: digest(apply(resources, events)),
    canonicalCounts: {
      nodes: resources.filter((r) => r.kind === "Node").length,
      pods: resources.filter((r) => r.kind === "Pod").length,
    },
    note: "Whole effect + recovery + cleanup cycle. Draws are JS submit cadence, not physical presented FPS. No traffic-provider cost claim.",
  };
}

/** Pass directly to page.evaluate. Boundary diagnostic, not a per-frame probe. */
export function readRepairSnapshot({ includeCanonical = false } = {}) {
  const canvas = document.querySelector("canvas"),
    harbor = canvas?.__harbor,
    probe = globalThis.__KUBEVIEW_BENCHMARK__;
  if (!canvas || !harbor)
    return {
      available: false,
      hidden: document.hidden,
      visibility: document.visibilityState,
    };
  const stats = harbor.stats(),
    visual = harbor.visualLifecycleState?.() || null,
    resources = Object.values(probe?.resources || {}),
    rect = canvas.getBoundingClientRect(),
    kinds = {},
    materials = new Set(),
    geometries = new Set();
  for (const resource of resources)
    kinds[resource.kind] = (kinds[resource.kind] || 0) + 1;
  let meshes = 0,
    instances = 0;
  harbor.scene.traverse((object) => {
    if (!object.isMesh) return;
    meshes++;
    if (object.isInstancedMesh) instances += object.count;
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      if (material) materials.add(material);
  });
  const water =
    harbor.scene.getObjectByName("harbor:ocean")?.material?.userData
      ?.oceanUniforms;
  let preferences = null;
  try {
    preferences = JSON.parse(localStorage.getItem("kubeview.preferences.v1"));
  } catch {}
  return {
    available: true,
    wallTime: new Date().toISOString(),
    time: performance.now(),
    hidden: document.hidden,
    visibility: document.visibilityState,
    preferences,
    source: visual?.source || null,
    canvas: {
      width: canvas.width,
      height: canvas.height,
      cssWidth: rect.width,
      cssHeight: rect.height,
      dpr: devicePixelRatio,
      rendererDPR:
        probe?.gl?.getPixelRatio?.() ?? canvas.width / Math.max(1, rect.width),
      sceneUUID: harbor.scene.uuid,
      cameraUUID: harbor.camera.uuid,
    },
    camera: {
      position: harbor.camera.position.toArray(),
      quaternion: harbor.camera.quaternion.toArray(),
      zoom: harbor.camera.zoom,
    },
    stats,
    visual,
    waterTime: water?.uWaterTime?.value ?? null,
    fleet: harbor.fleetStates(),
    canonicalCounts: kinds,
    ...(includeCanonical ? { canonical: resources } : {}),
    panel: {
      open: !!document.querySelector(".resource-details,.world-window"),
      title:
        (
          document.querySelector(".resource-details h2") ||
          document.querySelector(".world-window h1")
        )?.textContent || null,
    },
    sceneReferences: {
      meshes,
      instances,
      uniqueGeometries: geometries.size,
      uniqueMaterials: materials.size,
      scope:
        "Retained Three scene references, including hidden meshes; not GPU bytes/VRAM",
    },
    sockets: probe?.sockets?.size ?? null,
    lifecycle: globalThis.__KUBEVIEW_LIFECYCLE__?.read() || null,
    heap: performance.memory
      ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
        }
      : null,
    note: "Read-only boundary sample. Rendering/DOM timestamps are proxies; this does not establish visual polish, presented FPS or full panel usability.",
  };
}

/** Canonical/producer gates are valid in both builds; visual checks are separate. */
export function assessRepairRun(
  plan,
  initialResources,
  {
    before,
    after,
    observations = [],
    upstream,
    actualResources,
    expectedVisible = null,
  },
) {
  const planned = apply(initialResources, plan.events),
    reasons = [];
  if (digest(initialResources) !== plan.initialDigest)
    reasons.push("Initial source objects do not match this replay plan");
  if (
    observations.some(
      (sample) => sample.hidden === true || sample.visibility === "hidden",
    )
  )
    reasons.push(
      "Actual hidden document observed inside the foreground CPU/effect window",
    );
  const canonical = {
    clientMatchesUpstream: same(actualResources, upstream.resources),
    upstreamMatchesPlanned: same(planned, upstream.resources),
    clientMatchesPlanned: same(actualResources, planned),
  };
  if (Object.values(canonical).some((value) => !value))
    reasons.push("Canonical content differs, not merely object counts");
  const producer = {
    planned: plan.events.length,
    completed: upstream.samples.length,
    errors: upstream.samples.filter((s) => s.error),
    lastSequence: upstream.samples.at(-1)?.sequence ?? null,
    sequenceMatches:
      JSON.stringify(upstream.samples.map((s) => s.sequence)) ===
      JSON.stringify(plan.events.map((e) => e.sequence)),
  };
  if (
    producer.completed !== producer.planned ||
    producer.errors.length ||
    !producer.sequenceMatches
  )
    reasons.push("Independent Go producer lost/failed/reordered planned work");
  for (const snap of [before, after]) {
    if (!snap?.available) {
      reasons.push("Browser inventory unavailable");
      continue;
    }
    if (snap.hidden || snap.visibility !== "visible")
      reasons.push("Foreground CPU/effect window included a hidden document");
    if (
      snap.canonicalCounts.Node !== plan.canonicalCounts.nodes ||
      snap.canonicalCounts.Pod !== plan.canonicalCounts.pods
    )
      reasons.push("Canonical Node/Pod density changed");
    if (
      expectedVisible &&
      (snap.stats.lifecycle.visibleNodes !== expectedVisible.nodes ||
        snap.stats.lifecycle.visiblePods !== expectedVisible.pods)
    )
      reasons.push("Visible Node/Pod density changed");
  }
  if (before?.available && after?.available) {
    for (const key of [
      "width",
      "height",
      "cssWidth",
      "cssHeight",
      "dpr",
      "rendererDPR",
      "sceneUUID",
      "cameraUUID",
    ])
      if (before.canvas[key] !== after.canvas[key])
        reasons.push(`Canvas ${key} changed`);
    if (JSON.stringify(before.camera) !== JSON.stringify(after.camera))
      reasons.push("Fixed camera changed");
  }
  const visualAvailable = !!after?.visual;
  const nodeTargets = new Set(plan.targets.nodes),
    containerTargets = new Map(plan.targets.containers.map((c) => [c.uid, c]));
  const observedNodes = new Set(),
    observedContainers = new Set(),
    wrongContainers = [];
  for (const snapshot of observations)
    if (snapshot.visual) {
      for (const node of snapshot.visual.nodes)
        if (nodeTargets.has(node.uid) && node.fault > 0.01)
          observedNodes.add(node.uid);
      for (const c of snapshot.visual.containers)
        if (containerTargets.has(c.uid) && c.phase !== "settled") {
          if (containerTargets.get(c.uid).name === c.name)
            observedContainers.add(c.uid);
          else wrongContainers.push({ uid: c.uid, name: c.name });
        }
    }
  const visual = {
    available: visualAvailable,
    source:
      "Read-only sampled transforms; motion/video inspection remains separate",
    nodeFaultObserved: [...observedNodes],
    containerFaultObserved: [...observedContainers],
    wrongContainers,
    cleanup: visualAvailable
      ? {
          activeTransfers: after.stats.lifecycle.activeTransfers,
          queuedTransfers: after.stats.lifecycle.queuedTransfers,
          targetNodesRecovered: after.visual.nodes
            .filter((n) => nodeTargets.has(n.uid))
            .every((n) => n.fault < 0.001),
          targetContainersRecovered: after.visual.containers
            .filter((c) => containerTargets.has(c.uid))
            .every((c) => c.phase === "settled"),
          processSignals: after.visual.summary.processSignals,
        }
      : null,
    geometryDelta:
      before?.available && after?.available
        ? after.stats.memory.geometries - before.stats.memory.geometries
        : null,
    textureDelta:
      before?.available && after?.available
        ? after.stats.memory.textures - before.stats.memory.textures
        : null,
  };
  visual.valid = visualAvailable
    ? observedNodes.size === nodeTargets.size &&
      observedContainers.size === containerTargets.size &&
      !wrongContainers.length &&
      visual.cleanup.activeTransfers === 0 &&
      visual.cleanup.queuedTransfers === 0 &&
      visual.cleanup.targetNodesRecovered &&
      visual.cleanup.targetContainersRecovered &&
      visual.cleanup.processSignals === 0
    : null;
  return {
    valid: !reasons.length,
    reasons,
    canonical,
    producer,
    visual,
    initialDigest: plan.initialDigest,
    finalDigest: digest(actualResources),
    expectedDigest: plan.expectedDigest,
  };
}

/** Wrap the EXISTING long-run closePanel/openPodLogs pair; no new cadence/loop. */
export async function recordRepairPanelCycle({
  cycle,
  closePanel,
  openPanel,
  inventory,
  upstreamState,
}) {
  const before = await inventory(),
    serverBefore = await upstreamState(),
    start = Date.now();
  const waitStreams = async (expected) => {
    const deadline = Date.now() + 3000;
    let state = await upstreamState();
    while (
      state.logOpened - state.logClosed !== expected &&
      Date.now() < deadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      state = await upstreamState();
    }
    return state;
  };
  await closePanel();
  const serverClosed = await waitStreams(0),
    closed = await inventory();
  await openPanel();
  const serverReopened = await waitStreams(1),
    reopened = await inventory();
  const count = (s) => s.logOpened - s.logClosed;
  return {
    cycle,
    startedAt: new Date(start).toISOString(),
    elapsedMs: Date.now() - start,
    before,
    closed,
    reopened,
    streams: {
      before: count(serverBefore),
      closed: count(serverClosed),
      reopened: count(serverReopened),
      opened: serverReopened.logOpened - serverBefore.logOpened,
      closedRequests: serverReopened.logClosed - serverBefore.logClosed,
    },
    valid:
      before.panel.open &&
      !closed.panel.open &&
      reopened.panel.open &&
      before.panel.title === reopened.panel.title &&
      count(serverBefore) === 1 &&
      count(serverClosed) === 0 &&
      count(serverReopened) === 1,
    note: "One semantic UI close/reopen of the same log resource; actual stream counters, not hidden-panel CSS. Add existing DOM/listener and process samples separately.",
  };
}

/** Never synthesize document.hidden. visibility.mjs owns actual OS minimization. */
export function assessRepairVisibility(minimized, during, restored) {
  if (!minimized.hidden || !during.hidden)
    return {
      valid: false,
      reason:
        "Real document.hidden=true was not observed; background test unverified",
    };
  return {
    valid:
      !restored.hidden &&
      during.stats.frame - minimized.stats.frame <= 2 &&
      during.waterTime === minimized.waterTime,
    hiddenFrames: during.stats.frame - minimized.stats.frame,
    waterTimeDelta: during.waterTime - minimized.waterTime,
    note: "Visual-only hidden/restore gate; canonical apply/signature checks and resume pose delta are still required by visibility.mjs. No hidden FPS claim.",
  };
}
