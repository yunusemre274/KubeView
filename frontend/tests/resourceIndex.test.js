import test from "node:test";
import assert from "node:assert/strict";
import {
  buildResourceIndex,
  detailResourceScope,
} from "../src/data/resourceIndex.js";
const node = (uid) => ({ kind: "Node", metadata: { uid, name: uid } });
const pod = (uid, host, restart = 0) => ({
  kind: "Pod",
  metadata: { uid, name: "same-name", namespace: "ns" },
  spec: { nodeName: host },
  status: { restart },
});

test("unrelated changes retain node panel inputs; relevant updates and UID replacement are immediate", () => {
  const n0 = node("n0"),
    n1 = node("n1"),
    p0 = pod("old", "n0"),
    p1 = pod("other", "n1");
  const a = buildResourceIndex([n0, n1, p0, p1], undefined, "cluster-a");
  const view = detailResourceScope(a, n0);
  const b = buildResourceIndex(
    [n0, n1, p0, pod("other", "n1", 1)],
    a,
    "cluster-a",
  );
  assert.equal(detailResourceScope(b, n0, view), view);
  assert.equal(a.ships[0], b.ships[0]);
  assert.notEqual(a.ships[1], b.ships[1]);
  const updated = pod("old", "n0", 2),
    c = buildResourceIndex([n0, n1, updated, p1], b, "cluster-a");
  const updatedView = detailResourceScope(c, n0, view);
  assert.notEqual(updatedView, view);
  assert.equal(
    updatedView.resources.find((r) => r.metadata.uid === "old").status.restart,
    2,
  );
  const replacement = pod("new", "n0"),
    d = buildResourceIndex([n0, n1, replacement, p1], c, "cluster-a");
  assert.equal(d.byUID.has("old"), false);
  assert.equal(
    detailResourceScope(d, n0, updatedView).resources.some(
      (r) => r.metadata.uid === "old",
    ),
    false,
  );
  assert.equal(d.ships[0].pods[0], replacement);
});

test("event, owner and scope dependencies are retained without reintroducing deleted resources", () => {
  const n0 = node("n0"),
    p0 = pod("p0", "n0");
  const owner = {
    kind: "Deployment",
    metadata: { uid: "owner", name: "owner", labels: { keep: "all-fields" } },
    spec: { replicas: 3 },
  };
  const event = {
    kind: "Event",
    metadata: { uid: "event", name: "warning" },
    involvedObject: { uid: "p0" },
  };
  const a = buildResourceIndex([n0, p0, owner, event], undefined, "a");
  const view = detailResourceScope(a, p0);
  assert.equal(
    view.resources.find((r) => r.kind === "Deployment"),
    owner,
  );
  assert.equal(view.resources.includes(event), true);
  const b = buildResourceIndex([n0, p0, owner, event], a, "b");
  assert.notEqual(detailResourceScope(b, p0, view), view);
  const c = buildResourceIndex([p0, owner, event], b, "b");
  assert.equal(detailResourceScope(c, n0).resources.includes(n0), false);
  assert.equal(c.podsByNode.get("n0")[0], p0);
  assert.equal(detailResourceScope(a, owner).resources, a.resources);
});
