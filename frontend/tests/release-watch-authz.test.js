import test from "node:test";
import assert from "node:assert/strict";
import { initialState, reduceMessage } from "../src/data/resourceStore.js";
import { resourceObservation, scopeKey } from "../src/data/resourceScopes.js";

const scope = (namespace) => ({
  group: "", version: "v1", resource: "pods", kind: "Pod", namespace,
  authoritative: true, status: "synced",
});
const pod = (uid, namespace) => ({
  apiVersion: "v1", kind: "Pod", metadata: { uid, namespace, name: "same-name", resourceVersion: "opaque" },
  spec: { nodeName: "real-node" }, status: { phase: "Running" },
});
function fixture() {
  const selected = pod("selected-uid", "qa"), peer = pod("peer-uid", "other");
  const state = reduceMessage({ ...initialState("live"), context: "context-a", mode: "live", isConnected: true }, {
    type: "SNAPSHOT", context: "context-a", generation: "session-a", synced: true, upstream: true,
    resources: [selected, peer], scopes: [scope("qa"), scope("other")],
  });
  return { state, selected, peer };
}
const failure = (status = "forbidden") => ({
  type: "STATUS", context: "context-a", generation: "session-a", synced: false, upstream: true,
  timestamp: "2026-11-12T21:00:00Z", errors: ["Synthetic permission refresh failed"],
  scopes: [{ ...scope("qa"), authoritative: false, status, error: "Synthetic scope failure" }],
});

test("watch authorization STATUS marks only its scope unverified without deleting canonical resources", () => {
  for (const status of ["forbidden", "unavailable"]) {
    const { state, selected, peer } = fixture();
    assert.equal(resourceObservation(state, selected).status, "live");
    const next = reduceMessage(state, failure(status));
    assert.equal(next.resources, state.resources);
    assert.equal(next.resources[selected.metadata.uid], selected);
    assert.deepEqual(next.tombstones, {});
    assert.equal(next.synced, false);
    assert.equal(next.stale, true);
    const observation = resourceObservation(next, selected);
    assert.equal(observation.status, status);
    assert.equal(observation.deleted, false);
    assert.equal(observation.stale, true);
    assert.equal(next.scopes[scopeKey(scope("qa"))].authoritative, false);
    assert.equal(next.scopes[scopeKey(scope("other"))], state.scopes[scopeKey(scope("other"))]);
    assert.equal(next.resources[peer.metadata.uid], peer);
    // The previous state must not be mutated by a callback.
    assert.equal(resourceObservation(state, selected).status, "live");
  }
});

test("late authorization STATUS from another context or connection generation is ignored", () => {
  const { state } = fixture();
  assert.equal(reduceMessage(state, { ...failure(), generation: "old-session" }), state);
  assert.equal(reduceMessage(state, { ...failure(), context: "other-context" }), state);
});

test("a healthy STATUS cannot restore failed scope authority without a successful snapshot", () => {
  const { state, selected } = fixture();
  const denied = reduceMessage(state, failure());
  const heartbeat = reduceMessage(denied, { ...failure(), synced: true, errors: [], scopes: [scope("qa")] });
  assert.equal(resourceObservation(heartbeat, selected).status, "forbidden");
  const restored = reduceMessage(heartbeat, {
    type: "SNAPSHOT", context: "context-a", generation: "session-b", synced: true, upstream: true,
    resources: [selected], scopes: [scope("qa")],
  });
  assert.equal(resourceObservation(restored, selected).status, "live");
});
