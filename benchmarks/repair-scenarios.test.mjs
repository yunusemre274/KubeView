import test from "node:test";
import assert from "node:assert/strict";
import { fixture, apply, digest } from "./fixtures.mjs";
import {
  REPAIR_SCENARIOS,
  repairScenario,
  assessRepairRun,
  assessRepairVisibility,
  recordRepairPanelCycle,
} from "./repair-scenarios.mjs";

for (const profile of ["S", "M", "L"])
  for (const scenario of REPAIR_SCENARIOS)
    test(`${profile}/${scenario}: deterministic bounded real-protocol replay, stable UID/counts and monotonic restart`, () => {
      const resources = fixture(profile),
        initial = digest(resources),
        plan = repairScenario(resources, scenario),
        again = repairScenario(resources, scenario);
      assert.deepEqual(plan, again);
      assert.equal(digest(resources), initial);
      assert.ok(plan.events.length <= 31);
      assert.equal(
        new Set(plan.events.map((e) => e.sequence)).size,
        plan.events.length,
      );
      assert.equal(plan.events[0].atMs >= 1000, true);
      assert.equal(plan.events.at(-1).atMs, 22000);
      const result = apply(resources, plan.events);
      assert.equal(result.length, resources.length);
      assert.equal(digest(result), plan.expectedDigest);
      for (const target of plan.targets.containers) {
        const original = resources.find((r) => r.metadata.uid === target.uid),
          last = result.find((r) => r.metadata.uid === target.uid);
        assert.equal(last.metadata.uid, original.metadata.uid);
        assert.equal(last.spec.nodeName, original.spec.nodeName);
        let count = original.status.containerStatuses[0].restartCount;
        for (const event of plan.events.filter(
          (e) => e.targetUID === target.uid,
        )) {
          const status = event.object.status.containerStatuses.find(
            (c) => c.name === target.name,
          );
          assert.ok(status.restartCount >= count);
          count = status.restartCount;
          assert.deepEqual(
            event.object.status.containerStatuses.filter((c) =>
              target.healthyNames.includes(c.name),
            ),
            original.status.containerStatuses.filter((c) =>
              target.healthyNames.includes(c.name),
            ),
          );
        }
        assert.equal(
          last.status.conditions.find((c) => c.type === "Ready").status,
          "True",
        );
      }
      for (const nodeUID of plan.targets.nodes)
        assert.equal(
          result
            .find((r) => r.metadata.uid === nodeUID)
            .status.conditions.find((c) => c.type === "Ready").status,
          "True",
        );
    });

test("repair integrity rejects content corruption despite identical resource counts and supports pre-effect baseline", () => {
  const initial = fixture("M"),
    plan = repairScenario(initial, "repair-container"),
    result = apply(initial, plan.events);
  const snapshot = {
    available: true,
    hidden: false,
    visibility: "visible",
    canvas: {
      width: 1440,
      height: 900,
      cssWidth: 1440,
      cssHeight: 900,
      dpr: 1,
      rendererDPR: 1,
      sceneUUID: "scene",
      cameraUUID: "camera",
    },
    camera: { position: [0, 100, 200] },
    canonicalCounts: { Node: 20, Pod: 300 },
    stats: {
      memory: { geometries: 20, textures: 4 },
      lifecycle: { visibleNodes: 8, visiblePods: 120 },
    },
  };
  const upstream = {
    resources: result,
    samples: plan.events.map((e) => ({ sequence: e.sequence })),
  };
  const success = assessRepairRun(plan, initial, {
    before: snapshot,
    after: snapshot,
    upstream,
    actualResources: result,
    expectedVisible: { nodes: 8, pods: 120 },
  });
  assert.equal(success.valid, true);
  assert.equal(
    success.visual.available,
    false,
    "absence of new baseline effect is not fabricated visual success",
  );
  const corrupted = structuredClone(result);
  corrupted.find((r) => r.kind === "Pod").spec.nodeName = "wrong-node";
  assert.equal(
    assessRepairRun(plan, initial, {
      before: snapshot,
      after: snapshot,
      upstream,
      actualResources: corrupted,
    }).valid,
    false,
  );
  assert.equal(
    assessRepairRun(plan, initial, {
      before: snapshot,
      after: { ...snapshot, hidden: true },
      upstream,
      actualResources: result,
    }).valid,
    false,
  );
});

test("background acceptance requires actual hidden=true and frozen visual work", () => {
  const sample = { hidden: true, stats: { frame: 100 }, waterTime: 10 };
  assert.equal(
    assessRepairVisibility({ ...sample, hidden: false }, sample, {
      ...sample,
      hidden: false,
    }).valid,
    false,
  );
  assert.equal(
    assessRepairVisibility(
      sample,
      { ...sample, stats: { frame: 101 } },
      { ...sample, hidden: false },
    ).valid,
    true,
  );
  assert.equal(
    assessRepairVisibility(
      sample,
      { ...sample, waterTime: 11 },
      { ...sample, hidden: false },
    ).valid,
    false,
  );
});

test("foreground acceptance rejects an actual hidden midpoint even when both boundaries and canonical content are correct", () => {
  const initial = fixture("M"),
    plan = repairScenario(initial, "repair-node"),
    resources = apply(initial, plan.events);
  const snapshot = {
    available: true,
    hidden: false,
    visibility: "visible",
    canvas: {
      width: 1440,
      height: 900,
      cssWidth: 1440,
      cssHeight: 900,
      dpr: 1,
      rendererDPR: 1,
      sceneUUID: "same-scene",
      cameraUUID: "same-camera",
    },
    camera: { position: [0, 100, 200] },
    canonicalCounts: { Node: 20, Pod: 300 },
    stats: {
      memory: { geometries: 20, textures: 3 },
      lifecycle: { visibleNodes: 8, visiblePods: 120 },
    },
  };
  const shared = {
    before: snapshot,
    after: snapshot,
    actualResources: resources,
    upstream: {
      resources,
      samples: plan.events.map((e) => ({ sequence: e.sequence })),
    },
  };
  const hidden = assessRepairRun(plan, initial, {
    ...shared,
    observations: [
      { ...snapshot, time: 5500, hidden: true, visibility: "hidden" },
    ],
  });
  assert.equal(hidden.valid, false);
  assert.ok(
    hidden.reasons.some((reason) => reason.includes("inside the foreground")),
  );
  assert.deepEqual(
    hidden.canonical,
    {
      clientMatchesUpstream: true,
      upstreamMatchesPlanned: true,
      clientMatchesPlanned: true,
    },
    "the failure is the foreground window, not fabricated canonical corruption",
  );
  const visible = assessRepairRun(plan, initial, {
    ...shared,
    observations: [{ ...snapshot, time: 5500 }],
  });
  assert.equal(visible.valid, true);
});

test("existing long-run UI cycle records close/abort/reopen counters without adding a scheduler", async () => {
  let open = true,
    opened = 1,
    closed = 0;
  const order = [];
  const record = await recordRepairPanelCycle({
    cycle: 20,
    closePanel: async () => {
      order.push("close");
      open = false;
      closed++;
    },
    openPanel: async () => {
      order.push("open");
      open = true;
      opened++;
    },
    inventory: async () => ({ panel: { open, title: open ? "app" : "" } }),
    upstreamState: async () => ({ logOpened: opened, logClosed: closed }),
  });
  assert.deepEqual(order, ["close", "open"]);
  assert.equal(record.valid, true);
  assert.deepEqual(record.streams, {
    before: 1,
    closed: 0,
    reopened: 1,
    opened: 1,
    closedRequests: 1,
  });
});

test("unknown scenario, too-short measurement and absent multi-container fixture fail early", () => {
  assert.throws(() => repairScenario(fixture("M"), "not-a-case"));
  assert.throws(() =>
    repairScenario(fixture("M"), "repair-node", { duration: 20 }),
  );
  assert.throws(() =>
    repairScenario(
      fixture("M").filter((r) => r.kind !== "Pod"),
      "repair-container",
    ),
  );
});
