import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, replay, apply, digest, PROFILES } from "./fixtures.mjs";
for (const [profile, [nodes, pods]] of Object.entries(PROFILES))
  test(`${profile}: deterministic relationships and replay counts`, () => {
    const resources = fixture(profile),
      events = replay(resources);
    assert.equal(resources.filter((r) => r.kind === "Node").length, nodes);
    assert.equal(resources.filter((r) => r.kind === "Pod").length, pods);
    assert.equal(digest(resources), digest(fixture(profile)));
    assert.equal(events.length, 1250);
    assert.equal(
      apply(resources, events).filter((r) => r.kind === "Pod").length,
      pods,
    );
    assert.ok(resources.some((r) => r.spec?.containers?.length > 1));
    assert.ok(resources.some((r) => r.status?.phase === "Pending"));
    for (const pod of resources.filter(
      (r) => r.kind === "Pod" && !r.spec.nodeName,
    ))
      for (const status of pod.status.containerStatuses) {
        assert.equal(status.ready, false);
        assert.equal(status.state.running, undefined);
        assert.ok(status.state.waiting);
      }
  });
test("replay keeps restarts monotonic, Pending unready and transient owners valid", () => {
  const resources = fixture("M"),
    counts = new Map(
      resources
        .filter((r) => r.kind === "Pod")
        .map((r) => [
          r.metadata.uid,
          r.status.containerStatuses[0].restartCount,
        ]),
    );
  for (const e of replay(resources)) {
    if (e.action === "UPDATE") {
      const status = e.object.status.containerStatuses[0];
      assert.ok(status.restartCount >= counts.get(e.object.metadata.uid));
      counts.set(e.object.metadata.uid, status.restartCount);
      if (!e.object.spec.nodeName)
        assert.equal(e.object.status.conditions[0].status, "False");
    } else {
      assert.deepEqual(e.object.metadata.ownerReferences, []);
      assert.equal(e.object.metadata.deletionTimestamp, undefined);
    }
  }
});
