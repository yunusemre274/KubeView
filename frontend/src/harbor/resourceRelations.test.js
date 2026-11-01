import test from "node:test";
import assert from "node:assert/strict";
import {
  ResourceModuleSlots,
  serviceSelectsPod,
  topologyRelations,
  flowEndpointResource,
  prioritizeMeasuredFlows,
} from "./resourceRelations.js";
import { HarborSlots, resourcePosition } from "./layout.js";

const node = (uid) => ({ kind: "Node", metadata: { uid, name: uid } });
const pod = (
  uid,
  namespace = "lab",
  nodeName = "worker",
  labels = { app: "test" },
) => ({
  kind: "Pod",
  metadata: { uid, name: uid, namespace, labels },
  spec: { nodeName },
});
const service = (uid, namespace = "lab") => ({
  kind: "Service",
  metadata: { uid, name: uid, namespace },
  spec: { selector: { app: "test" } },
});

test("resource modules reclaim deleted UID slots without shifting survivors or growing under churn", () => {
  const slots = new ResourceModuleSlots(),
    survivor = service("survivor");
  slots.reconcile([survivor]);
  for (let i = 0; i < 1000; i++) {
    slots.reconcile([survivor, service(`temporary-${i}`)]);
    slots.reconcile([survivor]);
  }
  assert.equal(slots.map.get("survivor"), 0);
  assert.equal(slots.next, 2);
  assert.equal(slots.map.size, 1);
  slots.reconcile([survivor, service("new-uid")]);
  assert.equal(slots.map.get("new-uid"), 1);
});

test("selected Service beyond six uses its actual module anchor, namespaces and outside-region targets stay separate", () => {
  const worker = node("worker"),
    other = node("other"),
    slots = new HarborSlots();
  slots.node("worker");
  slots.node("other");
  slots.windowOffset = 0;
  slots.windowSize = 1;
  const services = Array.from({ length: 10 }, (_, i) =>
    service(`service-${i}`),
  );
  const pods = [
    pod("visible"),
    pod("elsewhere", "lab", "other"),
    pod("foreign", "private"),
  ];
  const result = topologyRelations(
    [...services, worker, other, ...pods],
    services,
    new Map([
      ["worker", worker],
      ["other", other],
    ]),
    slots,
    "service-9",
    "lab",
  );
  assert.equal(result.services.length, 7);
  assert.equal(result.links.length, 1);
  assert.equal(result.outsideWindow, 1);
  assert.deepEqual(result.links[0].source, result.anchors.get("service-9"));
  assert.notDeepEqual(result.links[0].source, result.anchors.get("service-0"));
  assert.equal(result.links[0].resource.metadata.uid, "visible");
  assert.equal(serviceSelectsPod(services[0], pods[2]), false);
});

test("large selector topology aggregates explicitly while selected Pod retains its real UID anchor", () => {
  const worker = node("worker"),
    slots = new HarborSlots();
  slots.node("worker");
  const s = service("svc"),
    pods = Array.from({ length: 100 }, (_, i) => pod(`pod-${i}`));
  const result = topologyRelations(
    [s, worker, ...pods],
    [s],
    new Map([["worker", worker]]),
    slots,
    "pod-99",
    "lab",
  );
  assert.equal(result.aggregated, true);
  assert.equal(result.matchedPods, 100);
  assert.equal(result.links.length, 2);
  assert.equal(result.links.find((l) => l.aggregate).count, 99);
  assert.ok(result.links.some((l) => l.resource.metadata.uid === "pod-99"));
});

test("flow identity never falls back to reused IP/name or crosses namespace", () => {
  const replacement = pod("new-uid"),
    resources = new Map([["new-uid", replacement]]);
  assert.equal(
    flowEndpointResource(
      {
        uid: "old-uid",
        namespace: "lab",
        name: replacement.metadata.name,
        ip: "10.0.0.1",
      },
      resources,
    ),
    null,
  );
  assert.equal(
    flowEndpointResource(
      { name: replacement.metadata.name, namespace: "lab", ip: "10.0.0.1" },
      resources,
    ),
    null,
  );
  assert.equal(
    flowEndpointResource({ uid: "new-uid", namespace: "private" }, resources),
    null,
  );
  assert.equal(
    flowEndpointResource({ uid: "new-uid", namespace: "lab" }, resources),
    replacement,
  );
});

test("assigned orphan remains addressable without fabricating a Node or changing Pod phase", () => {
  const p = pod("orphan", "lab", "removed-node"),
    slots = new HarborSlots();
  p.status = { phase: "Running" };
  const point = resourcePosition(p, new Map(), slots);
  assert.ok(Array.isArray(point));
  assert.equal(slots.nodes.size, 0);
  assert.equal(p.spec.nodeName, "removed-node");
  assert.equal(p.status.phase, "Running");
  slots.lastVisual = new Map([
    [
      "orphan",
      { position: [10, 4, 20], pose: { yaw: 0.5, pitch: 0.1, roll: 0.2 } },
    ],
  ]);
  assert.deepEqual(resourcePosition(p, new Map(), slots), [10, 4, 20]);
});

test("selected authorized Pod flows remain visible before the 96-flow draw cap without changing totals or original order", () => {
  const flows = Array.from({ length: 140 }, (_, i) => ({
    id: `flow-${i}`,
    source: { uid: i === 139 ? "selected" : "other" },
    destination: { uid: i === 138 ? "selected" : "destination" },
  }));
  const prioritized = prioritizeMeasuredFlows(flows, "selected");
  assert.deepEqual(
    prioritized.slice(0, 2).map((f) => f.id),
    ["flow-138", "flow-139"],
  );
  assert.equal(prioritized.length, flows.length);
  assert.ok(prioritized.slice(0, 96).some((f) => f.id === "flow-139"));
  assert.equal(flows[0].id, "flow-0");
  assert.equal(new Set(prioritized.map((f) => f.id)).size, 140);
  assert.equal(prioritizeMeasuredFlows(flows, "absent"), flows);
  assert.equal(prioritizeMeasuredFlows(flows, null), flows);
});
