import test from "node:test";
import assert from "node:assert/strict";
import {
  VisualLifecycle,
  sampleContainerEffect,
  applyNodeFaultPose,
  waterDropTarget,
  confirmedRemoval,
  visibleContainerMarkers,
  observedNodeArrivals,
} from "./visualLifecycle.js";
import {
  FLEET_OBSTACLES,
  launchTrajectory,
  vesselHitsLand,
  vesselsOverlap,
  FleetSimulator,
} from "./fleet.js";
import { VISUAL_EVENT_DIMENSIONS as V } from "../constants/dimensions.js";
const node = (status = "True", uid = "n") => ({
  kind: "Node",
  metadata: { uid, name: uid },
  status: { conditions: [{ type: "Ready", status }] },
});
const pod = (count = 0, failed = false, uid = "p") => ({
  kind: "Pod",
  metadata: { uid, name: uid, namespace: "test" },
  spec: {
    nodeName: "n",
    containers: [{ name: "steady" }, { name: "crasher" }],
  },
  status: {
    phase: "Running",
    containerStatuses: [
      { name: "steady", ready: true, restartCount: 0, state: { running: {} } },
      {
        name: "crasher",
        ready: !failed,
        restartCount: count,
        state: failed
          ? { waiting: { reason: "CrashLoopBackOff" } }
          : { running: {} },
        ...(count
          ? {
              lastState: {
                terminated: {
                  reason: "Error",
                  exitCode: 7,
                  finishedAt: `period-${count}`,
                },
              },
            }
          : {}),
      },
    ],
  },
});

test("first snapshot is end state, False sinks progressively only in a new observed period, Unknown is distinct", () => {
  const life = new VisualLifecycle("cluster");
  life.observe([node("False")], [], { now: 100 });
  assert.equal(life.nodeVisual("n", 100).fault, 1);
  life.observe([node()], [], { now: 200 });
  assert.equal(life.nodeVisual("n", 200).fault, 1);
  assert.equal(life.nodeVisual("n", 200 + V.NODE_RECOVER_MS).fault, 0);
  life.observe([node("False")], [], { now: 4000 });
  assert.equal(life.nodeVisual("n", 4000).fault, 0);
  const half = life.nodeVisual("n", 4000 + V.NODE_SINK_MS / 2).fault;
  assert.ok(half > 0.4 && half < 0.6);
  life.observe([node("False")], [], { now: 7000 });
  assert.equal(
    life.nodes.get("n").changedAt,
    4000,
    "duplicate/resync must not restart sink",
  );
  const pose = { position: [10, 0.2, 20], yaw: 0.4, pitch: 0, roll: 0 };
  applyNodeFaultPose(pose, life.nodeVisual("n", 10000));
  assert.ok(pose.position[1] < -3 && pose.roll > 0.1);
  life.observe([node("Unknown")], [], { now: 11000 });
  assert.equal(life.nodeVisual("n", 15000).fault, 0);
  assert.equal(life.nodeVisual("n", 15000).communication, true);
});

test("new Node awaiting its first Ready is not presented as an already failed physical machine", () => {
  const life = new VisualLifecycle();
  life.observe([], [], { now: 0 });
  life.observe([node("False")], [], { now: 10 });
  assert.equal(life.nodeVisual("n", 10000).fault, 0);
  assert.equal(life.nodes.get("n").pending, true);
  life.observe([node()], [], { now: 11000 });
  life.observe([node("False")], [], { now: 12000 });
  assert.equal(life.nodeVisual("n", 18000).fault, 1);
});

test("one real restart detaches only its container, follows a continuous arc and same UID recovers", () => {
  const life = new VisualLifecycle();
  life.observe([node()], [pod()], { now: 0 });
  life.observe([node()], [pod(1, true)], { now: 100 });
  assert.equal(life.containers.size, 1);
  assert.equal(life.container("p", "steady", "container"), undefined);
  const effect = life.container("p", "crasher", "container"),
    origin = [-54, 6, 128],
    pose = { yaw: 0, pitch: 0.02, roll: 0.01 };
  const first = [
    ...sampleContainerEffect(effect, 100, origin, pose, FLEET_OBSTACLES)
      .position,
  ];
  const middle = [
    ...sampleContainerEffect(effect, 1100, origin, pose, FLEET_OBSTACLES)
      .position,
  ];
  assert.equal(first[1], origin[1]);
  assert.ok(middle[1] > origin[1]);
  life.observe([node()], [pod(1, true)], { now: 1200 });
  assert.equal(effect.started, 100);
  life.observe([node()], [pod(1, false)], { now: 1300 });
  const atSea = sampleContainerEffect(
    effect,
    2400,
    origin,
    pose,
    FLEET_OBSTACLES,
  );
  assert.equal(atSea.phase, "recovering");
  assert.equal(
    sampleContainerEffect(effect, 3501, origin, pose, FLEET_OBSTACLES),
    null,
  );
  assert.equal(effect.phase, "settled");
  life.observe([node()], [pod(2, true)], { now: 4000 });
  assert.equal(life.container("p", "crasher", "container").started, 4000);
});

test("Completed app/init and succeeded Job are not failures; ephemeral and native sidecar status are independent", () => {
  const life = new VisualLifecycle(),
    p = pod();
  p.spec.initContainers = [
    { name: "init" },
    { name: "sidecar", restartPolicy: "Always" },
  ];
  p.spec.ephemeralContainers = [{ name: "debug" }];
  p.status.initContainerStatuses = [
    {
      name: "init",
      restartCount: 0,
      state: { terminated: { exitCode: 0, reason: "Completed" } },
    },
    { name: "sidecar", ready: true, state: { running: {} } },
  ];
  p.status.ephemeralContainerStatuses = [
    { name: "debug", state: { running: {} } },
  ];
  life.observe([node()], [p], { now: 0 });
  const broken = structuredClone(p);
  broken.status.ephemeralContainerStatuses[0].state = {
    terminated: { exitCode: 2, reason: "Error", finishedAt: "now" },
  };
  life.observe([node()], [broken], { now: 100 });
  assert.equal(life.containers.size, 1);
  assert.ok(life.container("p", "debug", "ephemeral"));
  assert.equal(life.container("p", "init", "init"), undefined);
  const completed = pod();
  completed.status.phase = "Succeeded";
  completed.status.containerStatuses = completed.spec.containers.map((c) => ({
    name: c.name,
    state: { terminated: { exitCode: 0, reason: "Completed" } },
  }));
  life.observe([node()], [completed], { now: 200 });
  assert.equal(life.containers.size, 0);
});

test("initial broken containers settle without replay; reduced/hidden batches and DELETE/context have bounded cleanup", () => {
  const life = new VisualLifecycle();
  life.observe([node()], [pod(9, true)], { now: 0 });
  assert.equal(life.pulses.size, 0);
  assert.equal(life.container("p", "crasher", "app").phase, "faulted");
  life.observe([node()], [], { now: 10 });
  assert.equal(life.containers.size, 0);
  assert.equal(life.signals.length, 0);
  const healthy = Array.from({ length: 80 }, (_, i) => pod(0, false, `p-${i}`));
  life.observe([node()], healthy, { now: 100 });
  life.observe(
    [node()],
    healthy.map((p, i) => pod(1, true, `p-${i}`)),
    { now: 200 },
  );
  assert.ok(life.pulses.size <= V.MAX_CONTAINER_EFFECTS);
  assert.ok(life.summarized > 0);
  assert.ok(life.signals.length <= V.MAX_PROCESS_SIGNALS);
  life.observe([node()], healthy, { now: 300, hidden: true });
  assert.equal(life.pulses.size, 0);
  assert.equal(life.signals.length, 0);
  life.observe([], [], { now: 400, source: "other-context" });
  assert.equal(life.nodes.size, 0);
  assert.equal(life.containers.size, 0);
  assert.equal(life.previousContainers.size, 0);
});

test("water drop targets avoid all concrete footprints", () => {
  for (const origin of [
    [-54, 6, 128],
    [26, 9, 100],
    [0, 3, -50],
    [-104, 3, -44],
  ]) {
    const p = waterDropTarget(origin, 0.6, FLEET_OBSTACLES);
    assert.equal(
      FLEET_OBSTACLES.some(
        (b) =>
          p[0] >= b.minX && p[0] <= b.maxX && p[2] >= b.minZ && p[2] <= b.maxZ,
      ),
      false,
    );
  }
});

test("real new UID launches on a water-safe tangent path; first snapshot never launches old fleet", () => {
  for (let t = 0; t <= V.LAUNCH_SECONDS; t += 0.02)
    assert.equal(
      vesselHitsLand(launchTrajectory(t)),
      false,
      `launch touched land at${t}`,
    );
  const sim = new FleetSimulator();
  sim.reconcile([node()], () => 0);
  assert.equal(sim.ships.get("n").mode, "patrolling");
  const progress = sim.ships.get("n").progress;
  sim.reconcile([node(), node("True", "new")], (uid) =>
    uid === "new" ? 1 : 0,
  );
  assert.equal(sim.ships.get("n").progress, progress);
  assert.equal(sim.ships.get("new").mode, "launching");
  for (let i = 0; i < 250; i++)
    sim.tick(0.05, sim.time + 0.05, { patrol: true, operations: "full" });
  assert.equal(sim.ships.get("new").mode, "patrolling");
  assert.equal(sim.ships.size, 2);
});

test("real accepted operations and observed owner chain stay distinct from draft/dry-run, bounded and source-scoped", () => {
  const life = new VisualLifecycle("lab"),
    deployment = {
      kind: "Deployment",
      metadata: { uid: "dep", name: "web", generation: 2 },
    },
    rs = {
      kind: "ReplicaSet",
      metadata: {
        uid: "rs",
        ownerReferences: [
          { uid: "dep", kind: "Deployment", name: "web", controller: true },
        ],
      },
    },
    p = pod();
  p.metadata.ownerReferences = [
    { uid: "rs", kind: "ReplicaSet", name: "web-rs", controller: true },
  ];
  life.observe([node()], [], { now: 0, resources: [deployment, rs, node()] });
  life.observeOperations(
    [
      { id: "dry", sourceKey: "lab", action: "dry-run", resource: deployment },
      { id: "old", sourceKey: "other", action: "create", resource: deployment },
    ],
    10,
  );
  assert.equal(life.signals.length, 0);
  const op = {
    id: "op",
    sourceKey: "lab",
    action: "create",
    resource: deployment,
  };
  life.observeOperations([op], 20);
  life.observeOperations([op], 40);
  assert.equal(life.signals.length, 1);
  assert.equal(life.signals[0].operationId, "op");
  assert.equal(life.signals[0].dataSource, "API response");
  life.observe([node()], [p], {
    now: 50,
    resources: [deployment, rs, node(), p],
  });
  const observed = life.signals.find((s) => s.stage === "resource-observed");
  assert.deepEqual(
    observed.owners.map((o) => o.uid),
    ["rs", "dep"],
  );
  life.observe([], [], { now: 100, source: "other" });
  assert.equal(life.operationFingerprints.size, 0);
  assert.equal(life.signals.length, 0);
});

test("Ready=False brakes in its existing lane, Unknown and explicit pause stop immediately", () => {
  const sim = new FleetSimulator();
  sim.reconcile([node()], () => 0);
  sim.tick(0.05, 0.05, { patrol: true });
  const start = sim.ships.get("n").progress;
  sim.reconcile([node("False")], () => 0);
  sim.tick(0.05, 0.1, { patrol: true });
  assert.ok(sim.ships.get("n").progress > start);
  assert.ok(sim.ships.get("n").failureCoast > 0);
  for (let i = 0; i < 20; i++)
    sim.tick(0.05, 0.15 + i * 0.05, { patrol: true });
  const stopped = sim.ships.get("n").progress;
  sim.tick(0.1, 2, { patrol: true });
  assert.equal(sim.ships.get("n").progress, stopped);
  sim.reconcile([node()], () => 0);
  sim.tick(0.05, 2.05, { patrol: true });
  sim.reconcile([node("Unknown")], () => 0);
  const unknown = sim.ships.get("n").progress;
  sim.tick(0.1, 2.15, { patrol: true });
  assert.equal(sim.ships.get("n").progress, unknown);
});

test("only canonical delete/relist/replacement evidence permits exit animation; scope and access loss do not", () => {
  for (const reason of [
    "delete-event",
    "authoritative-absence",
    "authoritative-list-absence",
    "replaced",
  ])
    assert.equal(confirmedRemoval("uid", { uid: { reason } }), true);
  for (const reason of [
    "forbidden",
    "not-listed",
    "scope-purge",
    "stale",
    "syncing",
  ])
    assert.equal(confirmedRemoval("uid", { uid: { reason } }), false);
  assert.equal(confirmedRemoval("uid", {}), false);
  assert.equal(confirmedRemoval("uid", null), false);
});

test("disconnect/reconnect/resync never turns healthy Nodes into failures or replays an old crash period", () => {
  const life = new VisualLifecycle("lab");
  life.observe([node()], [pod()], { now: 0 });
  life.observe([], [], { now: 100, snapshotReady: false });
  assert.equal(life.nodeVisual("n", 100).phase, "ready");
  life.observe([node("False")], [pod(1, true)], { now: 200 });
  const crash = life.container("p", "crasher", "app"),
    faultStart = life.nodes.get("n").changedAt;
  life.observe([], [], { now: 300, snapshotReady: false });
  life.observe([node("False")], [pod(1, true)], { now: 400 });
  assert.equal(life.nodes.get("n").changedAt, faultStart);
  assert.equal(life.container("p", "crasher", "app"), crash);
  assert.equal(crash.started, 200);
  life.observe(
    [node("False", "replacement")],
    [pod(1, true, "replacement-pod")],
    { now: 500 },
  );
  assert.equal(life.nodes.has("n"), false);
  assert.equal(life.container("p", "crasher", "app"), undefined);
  assert.equal(
    life.nodeVisual("replacement", 500).fault,
    0,
    "new UID awaits first Ready, never inherits old wreck",
  );
  life.observe([node()], [pod()], {
    now: 600,
    source: "new-context",
    snapshotReady: false,
  });
  assert.equal(life.nodes.size, 0);
  assert.equal(life.containers.size, 0);
  assert.equal(life.signals.length, 0);
});

test("normal terminating SIGTERM/137 is not a new container failure, including a finalizer-held first snapshot", () => {
  const terminating = pod();
  terminating.metadata.deletionTimestamp = "2026-11-01T14:14:13Z";
  terminating.metadata.finalizers = ["audit.invalid/hold"];
  terminating.status.containerStatuses =
    terminating.status.containerStatuses.map((c) => ({
      ...c,
      ready: false,
      state: {
        terminated: {
          exitCode: 137,
          reason: "Error",
          finishedAt: "2026-11-01T14:14:14Z",
        },
      },
    }));
  const initial = new VisualLifecycle();
  initial.observe([node()], [terminating], { now: 0 });
  assert.equal(initial.containers.size, 0);
  assert.equal(initial.pulses.size, 0);
  const life = new VisualLifecycle();
  life.observe([node()], [pod()], { now: 0 });
  life.observe([node()], [terminating], { now: 100 });
  assert.equal(life.containers.size, 0);
  assert.equal(life.pulses.size, 0);
  assert.equal(
    life.previousPods.get("p").metadata.finalizers[0],
    "audit.invalid/hold",
  );
  life.observe([node()], [structuredClone(terminating)], { now: 200 });
  assert.equal(life.containers.size, 0);
  life.observe([node()], [], { now: 300 });
  assert.equal(life.previousContainers.size, 0);
});

test("deletion preserves an existing real crash period without adding healthy-box faults or replaying recovered faults", () => {
  const life = new VisualLifecycle();
  life.observe([node()], [pod()], { now: 0 });
  life.observe([node()], [pod(1, true)], { now: 100 });
  const crash = life.container("p", "crasher", "app"),
    originalStarted = crash.started,
    originalReason = crash.reason;
  const stopping = pod(1, true);
  stopping.metadata.deletionTimestamp = "2026-11-01T14:14:13Z";
  stopping.status.containerStatuses = stopping.status.containerStatuses.map(
    (c) => ({
      ...c,
      ready: false,
      state: {
        terminated: {
          exitCode: 137,
          reason: "Error",
          finishedAt: "later-normal-shutdown",
        },
      },
    }),
  );
  life.observe([node()], [stopping], { now: 1000 });
  assert.equal(life.containers.size, 1);
  assert.equal(life.container("p", "steady", "app"), undefined);
  assert.equal(life.container("p", "crasher", "app"), crash);
  assert.equal(crash.started, originalStarted);
  assert.equal(crash.reason, originalReason);
  assert.equal(life.pulses.size, 1);
  assert.equal([...life.pulses.values()][0].started, 100);
  const recovered = new VisualLifecycle();
  recovered.observe([node()], [pod()], { now: 0 });
  recovered.observe([node()], [pod(1, true)], { now: 100 });
  recovered.observe([node()], [pod(1, false)], { now: 300 });
  const old = recovered.container("p", "crasher", "app");
  sampleContainerEffect(old, 4000, [-54, 6, 128], { yaw: 0 }, FLEET_OBSTACLES);
  assert.equal(old.phase, "settled");
  recovered.observe([node()], [stopping], { now: 5000 });
  assert.equal(old.phase, "settled");
  assert.equal(recovered.container("p", "steady", "app"), undefined);
  life.observe([node()], [], { now: 6000 });
  assert.equal(life.containers.size, 0);
  assert.equal(life.pulses.size, 0);
});

test("a NotReady joined Node never blocks the existing fleet, and the observed three-ship launch resumes without gate deadlock", () => {
  const sim = new FleetSimulator(),
    old = [node("True", "control-plane"), node("True", "worker-2")],
    slot = (uid) => (uid === "control-plane" ? 0 : uid === "worker-2" ? 1 : 2);
  sim.reconcile(old, slot);
  for (const [uid, progress] of [
    ["control-plane", 1008.6],
    ["worker-2", 1182.2],
  ]) {
    const ship = sim.ships.get(uid);
    ship.progress = progress;
    ship.pose = sim.route.pose(progress);
  }
  const before = sim.ships.get("control-plane").progress;
  sim.reconcile([...old, node("False", "worker-3")], slot);
  assert.equal(
    sim.mergeGates("control-plane").length,
    0,
    "a Node awaiting Ready cannot reserve/block the join gate",
  );
  for (let i = 0; i < 900; i++)
    sim.tick(0.05, sim.time + 0.05, { patrol: true, operations: "full" });
  const delta =
    (sim.ships.get("control-plane").progress - before + sim.route.length) %
    sim.route.length;
  assert.ok(delta > 300, `existing fleet only advanced ${delta}`);
  assert.equal(sim.ships.get("worker-3").modeElapsed, 0);
  sim.reconcile([...old, node("True", "worker-3")], slot);
  let completed = false;
  for (let i = 0; i < 700; i++) {
    sim.tick(0.05, sim.time + 0.05, { patrol: true, operations: "full" });
    const ships = [...sim.ships.values()];
    for (let a = 0; a < ships.length; a++)
      for (let b = a + 1; b < ships.length; b++)
        assert.equal(
          vesselsOverlap(ships[a].pose, ships[b].pose),
          false,
          "joined hull collided with an existing ship",
        );
    if (sim.ships.get("worker-3").mode === "patrolling") completed = true;
  }
  assert.equal(
    completed,
    true,
    "Ready Node remained stuck on the slipway/merge curve",
  );
  for (const ship of sim.ships.values()) {
    assert.equal(ship.mode, "patrolling");
    assert.ok(ship.speed > 1);
  }
});

test("specific fault markers remain bounded, prioritize the selected container group and leave unrelated labels accessible", () => {
  const life = new VisualLifecycle();
  for (let i = 0; i < 30; i++)
    life.containers.set(`effect-${i}`, {
      uid: `pod-${i}`,
      name: "app",
      phase: "faulted",
      started: 0,
      settledInitial: true,
    });
  life.containers.get("effect-0").settledInitial = false;
  const visible = new Set(Array.from({ length: 30 }, (_, i) => `pod-${i}`));
  const markers = visibleContainerMarkers(life, visible, "pod-29", 1000);
  assert.equal(markers.length, V.MAX_CONTAINER_EFFECTS);
  assert.equal(markers[0].uid, "pod-29");
  assert.equal(markers[1].uid, "pod-0");
  life.containers.get("effect-29").phase = "settled";
  assert.equal(
    visibleContainerMarkers(life, visible, "pod-29", 5000).length,
    0,
  );
});

test("a later scoped snapshot baselines old Pod failure/owners without pulses; known Pending→assigned and new live UID remain live", () => {
  const life = new VisualLifecycle("lab"),
    origins = new Set(["old", "pending"]);
  const old = pod(4, true, "old"),
    pending = pod(0, false, "pending");
  delete pending.spec.nodeName;
  pending.status.conditions = [{ type: "Ready", status: "False" }];
  life.observe([node()], [], { now: 0 });
  life.observe([node()], [old, pending], { now: 100, snapshotUIDs: origins });
  assert.equal(life.signals.length, 0);
  assert.equal(life.pulses.size, 0);
  assert.equal(life.container("old", "crasher", "app").phase, "faulted");
  const scheduled = structuredClone(pending);
  scheduled.spec.nodeName = "n";
  life.observe([node()], [old, scheduled], { now: 200, snapshotUIDs: origins });
  assert.equal(
    life.signals.filter((s) => s.uid === "pending" && s.stage === "assigned")
      .length,
    1,
  );
  const live = pod(0, false, "live-add");
  life.observe([node()], [old, scheduled, live], {
    now: 300,
    snapshotUIDs: origins,
  });
  assert.ok(
    life.signals.some(
      (s) => s.uid === "live-add" && s.stage === "resource-observed",
    ),
  );
  life.observe([node()], [], { now: 400, snapshotUIDs: origins });
  life.observe([node()], [old], { now: 500, snapshotUIDs: new Set(["old"]) });
  assert.equal(life.signals.length, 0);
  assert.equal(life.pulses.size, 0);
});

test("scoped snapshot Nodes are existing fleet; a verified provision UID or genuine live ADD still admits once", () => {
  const life = new VisualLifecycle("lab");
  life.observe([node()], [], { now: 0 });
  const old = node("False", "old-snapshot"),
    live = node("False", "live-node"),
    provided = node("False", "provider-node"),
    origins = new Set(["old-snapshot", "provider-node"]);
  const initial = observedNodeArrivals(
    [node(), old, live, provided],
    life,
    origins,
    [
      {
        id: "verified",
        nodeUID: "provider-node",
        startedAt: new Date(life.sourceWallStart).toISOString(),
      },
    ],
  );
  assert.deepEqual([...initial], ["live-node", "provider-node"]);
  life.observe([node(), old, live, provided], [], {
    now: 100,
    snapshotUIDs: origins,
    newNodeUIDs: initial,
  });
  assert.equal(
    life.nodeVisual("old-snapshot", 100).fault,
    1,
    "already-broken snapshot starts at its end state",
  );
  assert.equal(life.nodeVisual("live-node", 100).fault, 0);
  assert.equal(life.nodes.get("live-node").pending, true);
  assert.equal(life.nodeVisual("provider-node", 100).fault, 0);
  assert.equal(life.nodes.get("provider-node").pending, true);
  assert.equal(
    observedNodeArrivals([node(), old, live, provided], life, origins, [
      { nodeUID: "provider-node" },
    ]).size,
    0,
    "same UID cannot replay admission on operation polling",
  );
  const baseline = new VisualLifecycle();
  assert.equal(
    observedNodeArrivals([provided], baseline, new Set(), [
      { nodeUID: "provider-node" },
    ]).size,
    0,
    "first connection is never an ADD parade",
  );
  assert.deepEqual(
    [...origins],
    ["old-snapshot", "provider-node"],
    "consumer must not mutate snapshot origins",
  );
});

test("old provisioning journal history cannot turn a later first-seen snapshot Node into a new admission", () => {
  const life = new VisualLifecycle("new-source"),
    old = node("True", "historical-worker"),
    origins = new Set(["historical-worker"]);
  life.observe([node("True", "known-1"), node("True", "known-2")], [], {
    now: 0,
  });
  const historical = {
    id: "old-provider-journal",
    nodeUID: "historical-worker",
    status: "ready",
    startedAt: new Date(Date.now() - 60000).toISOString(),
  };
  assert.equal(
    observedNodeArrivals(
      [node("True", "known-1"), node("True", "known-2"), old],
      life,
      origins,
      [historical],
    ).size,
    0,
    "old successful journal entry predates this visual source epoch",
  );
});

test("only valid provider start time within this visual source epoch can override a snapshot; live delta admission is independent", () => {
  const life = new VisualLifecycle("source");
  life.observe([], [], { now: 0 });
  const opened = life.sourceWallStart,
    n = node("True", "worker"),
    origins = new Set(["worker"]);
  for (const startedAt of [
    undefined,
    "invalid",
    new Date(opened - 60000).toISOString(),
    new Date(Date.now() + 60000).toISOString(),
  ])
    assert.equal(
      observedNodeArrivals([n], life, origins, [
        { nodeUID: "worker", startedAt },
      ]).size,
      0,
    );
  const request = {
    nodeUID: "worker",
    startedAt: new Date(opened).toISOString(),
  };
  assert.deepEqual(
    [...observedNodeArrivals([n], life, origins, [request])],
    ["worker"],
  );
  assert.deepEqual(
    [...observedNodeArrivals([n], life, new Set(), [])],
    ["worker"],
    "real live ADD must not depend on a provider operation",
  );
  life.observe([], [], { now: 200 });
  assert.equal(
    life.sourceWallStart,
    opened,
    "visual source wall start is stable across ordinary updates",
  );
  life.reset("next-source");
  assert.ok(life.sourceWallStart >= opened);
  assert.equal(life.initialized, false);
});
