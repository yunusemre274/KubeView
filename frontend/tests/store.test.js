import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  reduceMessage,
  quantity,
  ready,
  hasProblem,
  appendMetrics,
} from "../src/data/resourceStore.js";
import {
  resourceObservation,
  resourceScope,
  scopeKey,
  mergeResourceList,
  narrowNamespaceState,
} from "../src/data/resourceScopes.js";
const pod = (uid, nodeName = "") => ({
  apiVersion: "v1",
  kind: "Pod",
  metadata: {
    uid,
    name: "same-name",
    namespace: "test",
    resourceVersion: "opaque",
  },
  spec: { nodeName },
  status: {
    phase: "Running",
    conditions: [{ type: "Ready", status: "False" }],
  },
});
const event = (action, object, generation = 1) => ({
  type: "RESOURCE_EVENT",
  generation,
  action,
  object,
});
test("snapshot includes unscheduled pod without creating a fictitious node", () => {
  const s = reduceMessage(initialState(), {
    type: "SNAPSHOT",
    generation: 1,
    resources: [pod("old")],
  });
  assert.equal(Object.keys(s.resources).length, 1);
  assert.equal(s.events.length, 0);
  assert.equal(s.resources.old.spec.nodeName, "");
});
test("same-name recreation, delayed DELETE, and opaque resourceVersion remain safe", () => {
  let s = reduceMessage(initialState(), {
    type: "SNAPSHOT",
    generation: 1,
    resources: [pod("old")],
  });
  s = reduceMessage(s, event("ADD", pod("new")));
  s = reduceMessage(s, event("DELETE", pod("old")));
  assert.deepEqual(Object.keys(s.resources), ["new"]);
  s = reduceMessage(s, event("DELETE", pod("new")));
  assert.equal(Object.keys(s.resources).length, 0);
});
test("generation rejects previous session messages and resync removes vanished resources", () => {
  let s = reduceMessage(initialState(), {
    type: "SNAPSHOT",
    generation: 2,
    resources: [pod("current")],
  });
  assert.equal(reduceMessage(s, event("ADD", pod("stale"), 1)), s);
  s = reduceMessage(s, { type: "SNAPSHOT", generation: 2, resources: [] });
  assert.deepEqual(s.resources, {});
});
test("Running and Ready differ; deletionTimestamp stays canonical until DELETE", () => {
  let p = pod("a");
  assert.equal(ready(p), false);
  assert.equal(hasProblem(p), true);
  p = {
    ...p,
    metadata: { ...p.metadata, deletionTimestamp: new Date().toISOString() },
  };
  let s = reduceMessage(initialState(), { type: "SNAPSHOT", resources: [p] });
  assert.ok(s.resources.a);
});
test("restart update preserves identity; missing measurements never become zero", () => {
  let p = pod("a");
  let s = reduceMessage(initialState(), {
    type: "SNAPSHOT",
    generation: 1,
    resources: [p],
  });
  s = reduceMessage(
    s,
    event("UPDATE", {
      ...p,
      status: { ...p.status, containerStatuses: [{ restartCount: 2 }] },
    }),
  );
  assert.equal(Object.keys(s.resources).length, 1);
  assert.equal(quantity(undefined), null);
  assert.equal(quantity("500m"), 0.5);
  assert.equal(quantity("2Gi"), 2147483648);
  assert.equal(
    appendMetrics(s, { available: false }).metricHistory[0].available,
    false,
  );
});

const cargo = (uid, namespace = "test") => ({
  apiVersion: "audit.kubeview.local/v1",
  kind: "AuditCargo",
  metadata: { uid, name: "cargo", namespace, resourceVersion: "opaque-A" },
  spec: { note: "retained-real-data" },
});
const cargoDescriptor = {
  group: "audit.kubeview.local",
  version: "v1",
  resource: "auditcargo",
  kind: "AuditCargo",
  namespaced: true,
};
const cargoScope = {
  ...resourceScope(cargoDescriptor, "test"),
  authoritative: true,
  status: "synced",
};
const podScope = {
  group: "",
  version: "v1",
  resource: "pods",
  kind: "Pod",
  namespace: "*",
  authoritative: true,
  status: "synced",
};
const live = () => ({
  ...initialState("live:context-a"),
  context: "context-a",
  mode: "live",
  isConnected: true,
});
const snapshot = (generation, resources, scopes) => ({
  type: "SNAPSHOT",
  context: "context-a",
  generation,
  resources,
  scopes,
  synced: true,
  upstream: true,
});
test("limited reconnect snapshot cannot declare an unlisted custom resource deleted", () => {
  const cr = cargo("cr");
  let state = reduceMessage(live(), snapshot("old", [cr], [cargoScope]));
  state = reduceMessage(state, { type: "CONNECTION_PENDING" });
  state = reduceMessage(state, snapshot("new", [pod("pod")], [podScope]));
  assert.equal(state.resources.cr, cr);
  assert.equal(resourceObservation(state, cr).deleted, false);
  assert.equal(resourceObservation(state, cr).stale, true);
  state = reduceMessage(
    state,
    snapshot("new", [cr, pod("pod")], [podScope, cargoScope]),
  );
  assert.equal(resourceObservation(state, cr).status, "live");
});
test("real CR DELETE and offline delete confirmed by scoped relist remove only that UID", () => {
  const cr = cargo("cr");
  let state = reduceMessage(live(), snapshot("one", [cr], [cargoScope]));
  state = reduceMessage(state, {
    ...event("DELETE", cr, "one"),
    scope: cargoScope,
  });
  assert.equal(resourceObservation(state, cr).status, "deleted");
  state = reduceMessage(live(), snapshot("one", [cr], [cargoScope]));
  state = reduceMessage(state, { type: "CONNECTION_PENDING" });
  assert.equal(resourceObservation(state, cr).deleted, false);
  state = reduceMessage(state, snapshot("two", [], [cargoScope]));
  assert.equal(state.resources.cr, undefined);
  assert.equal(resourceObservation(state, cr).status, "deleted");
});
test("RBAC loss and unavailable CR API retain explicitly unverified data, never tombstone it", () => {
  const cr = cargo("cr");
  const original = reduceMessage(live(), snapshot("one", [cr], [cargoScope]));
  for (const status of ["forbidden", "unavailable"]) {
    const state = reduceMessage(
      original,
      snapshot(
        "two",
        [],
        [
          {
            ...cargoScope,
            status,
            authoritative: false,
            error: "scope failed",
          },
        ],
      ),
    );
    assert.equal(state.resources.cr, cr);
    assert.equal(state.tombstones.cr, undefined);
    assert.equal(resourceObservation(state, cr).status, status);
    assert.equal(resourceObservation(state, cr).deleted, false);
  }
});
test("specific namespace authority is usable when cluster-wide list is denied; a later exact denial is explicit", () => {
  const cr = cargo("cr");
  let state = reduceMessage(
    live(),
    snapshot(
      "one",
      [cr],
      [
        {
          ...cargoScope,
          namespace: "*",
          authoritative: false,
          status: "forbidden",
          error: "all namespaces denied",
        },
        cargoScope,
      ],
    ),
  );
  assert.equal(resourceObservation(state, cr).status, "live");
  const all = { ...cargoScope, namespace: "*" };
  state = {
    ...state,
    scopes: {
      [scopeKey(all)]: { ...all, source: "watch" },
      [scopeKey(cargoScope)]: {
        ...cargoScope,
        authoritative: false,
        status: "forbidden",
      },
    },
  };
  assert.equal(resourceObservation(state, cr).status, "forbidden");
  assert.equal(resourceObservation(state, cr).deleted, false);
});
test("a CR recreated at the same address has new UID, and delayed old DELETE cannot remove it", () => {
  const old = cargo("old"),
    replacement = cargo("new");
  let state = reduceMessage(live(), snapshot("one", [old], [cargoScope]));
  state = reduceMessage(state, snapshot("two", [replacement], [cargoScope]));
  state = reduceMessage(state, {
    ...event("DELETE", old, "two"),
    scope: cargoScope,
  });
  assert.equal(state.resources.new, replacement);
  assert.equal(state.resources.old, undefined);
  assert.equal(resourceObservation(state, old).deleted, true);
  assert.equal(resourceObservation(state, replacement).status, "live");
});
test("namespace/GVR authority and connection identity do not leak across scopes or contexts", () => {
  const a = cargo("a", "test"),
    b = cargo("b", "other");
  let state = reduceMessage(
    live(),
    snapshot("one", [a, b], [{ ...cargoScope, namespace: "*" }]),
  );
  state = reduceMessage(state, snapshot("two", [], [cargoScope]));
  assert.equal(state.resources.a, undefined);
  assert.equal(state.resources.b, b);
  assert.equal(
    reduceMessage(state, {
      ...snapshot("unrelated", [], [cargoScope]),
      context: "other-context",
    }),
    state,
  );
  assert.equal(
    reduceMessage(state, { ...event("UPDATE", a, "one"), scope: cargoScope }),
    state,
  );
  const reset = { ...initialState("live:context-b"), context: "context-b" };
  assert.equal(reduceMessage(reset, snapshot("two", [a], [cargoScope])), reset);
});
test("empty scoped authority preserves unknown objects while explicit legacy full snapshot reconciles them", () => {
  const cr = cargo("cr");
  let state = reduceMessage(live(), snapshot("one", [cr], [cargoScope]));
  state = reduceMessage(state, snapshot("two", [], []));
  assert.equal(state.resources.cr, cr);
  assert.equal(resourceObservation(state, cr).deleted, false);
  state = reduceMessage(state, {
    type: "SNAPSHOT",
    generation: "three",
    resources: [],
  });
  assert.equal(state.resources.cr, undefined);
  assert.equal(resourceObservation(state, cr).deleted, true);
});
test("in-flight list cannot undo a newer watch update, DELETE, ADD or UID replacement", () => {
  const a = cargo("a"),
    gone = cargo("gone", "other");
  const before = { a, gone };
  const updated = {
    ...a,
    metadata: { ...a.metadata, resourceVersion: "not-numeric-z" },
    spec: { note: "watch wins" },
  };
  assert.equal(
    mergeResourceList({ a: updated }, before, [a, gone], {
      ...cargoScope,
      namespace: "*",
    }).a,
    updated,
  );
  assert.equal(mergeResourceList({}, before, [a], cargoScope).a, undefined);
  const added = {
    ...cargo("added"),
    metadata: { ...cargo("added").metadata, name: "new-name" },
  };
  assert.equal(
    mergeResourceList({ a, added }, { a }, [a], cargoScope).added,
    added,
  );
  const replacement = cargo("replacement");
  const next = mergeResourceList({ replacement }, { a }, [a], cargoScope);
  assert.equal(next.a, undefined);
  assert.equal(next.replacement, replacement);
  const relisted = mergeResourceList({ a }, { a }, [replacement], cargoScope);
  assert.equal(relisted.a, undefined);
  assert.equal(relisted.replacement, replacement);
});
test("scope and tombstone identities stay stable on unrelated normal updates; deletion cache is bounded", () => {
  const cr = cargo("cr");
  let state = reduceMessage(live(), snapshot("one", [cr], [cargoScope]));
  const scopes = state.scopes,
    tombstones = state.tombstones;
  state = reduceMessage(state, {
    ...event(
      "UPDATE",
      { ...cr, metadata: { ...cr.metadata, resourceVersion: "opaque-new" } },
      "one",
    ),
    scope: cargoScope,
  });
  assert.equal(state.scopes, scopes);
  assert.equal(state.tombstones, tombstones);
  for (let i = 0; i < 1100; i++)
    state = reduceMessage(
      state,
      event(
        "DELETE",
        { ...cr, metadata: { ...cr.metadata, uid: "deleted-" + i } },
        "one",
      ),
    );
  assert.equal(Object.keys(state.tombstones).length, 1000);
  assert.equal(state.events.length, 500);
  assert.equal(Object.keys(state.resources).length, 1);
  assert.equal(state.scopes[scopeKey(cargoScope)].status, "synced");
});
test("namespace narrowing forgets only unleased coverage without inventing DELETE or replacing context", () => {
  const a = cargo("a", "old"),
    b = cargo("b", "next"),
    pinned = { ...cargoScope, namespace: "old" };
  let state = reduceMessage(
    live(),
    snapshot("one", [a, b], [{ ...cargoScope, namespace: "*" }]),
  );
  const unleased = narrowNamespaceState(state, "next");
  assert.equal(unleased.resources.a, undefined);
  assert.equal(unleased.resources.b, b);
  assert.equal(unleased.tombstones.a, undefined);
  assert.equal(unleased.sourceKey, state.sourceKey);
  assert.equal(resourceObservation(unleased, a).deleted, false);
  const retained = narrowNamespaceState(state, "next", [pinned]);
  assert.equal(retained.resources.a, a);
  assert.equal(retained.resources.b, b);
  assert.deepEqual(Object.keys(narrowNamespaceState(state, "all").resources), [
    "a",
    "b",
  ]);
});

test("a later scoped snapshot marks only its actual UIDs as baseline; live ADD and Pending assignment stay separate", () => {
  const pending = {
    ...pod("snapshot-pending"),
    metadata: {
      ...pod("snapshot-pending").metadata,
      name: "preexisting-pending",
      namespace: "qa",
    },
    status: { phase: "Pending" },
  };
  const scope = {
    group: "",
    version: "v1",
    resource: "pods",
    kind: "Pod",
    namespace: "qa",
    authoritative: true,
    status: "synced",
  };
  let state = reduceMessage(initialState("same-context"), {
    type: "SNAPSHOT",
    generation: "default-snapshot",
    resources: [],
    scopes: [{ ...scope, namespace: "default" }],
  });
  const firstIDs = state.snapshotUIDs;
  assert.equal(firstIDs.size, 0);
  state = reduceMessage(state, {
    type: "SNAPSHOT",
    generation: "qa-snapshot",
    resources: [pending],
    scopes: [scope],
  });
  assert.equal(state.sourceKey, "same-context");
  assert.deepEqual([...state.snapshotUIDs], [pending.metadata.uid]);
  assert.notEqual(state.snapshotUIDs, firstIDs);
  const snapshotIDs = state.snapshotUIDs;
  const liveAdded = {
    ...pod("live-added", "worker-cp"),
    metadata: {
      ...pod("live-added").metadata,
      name: "new-live-pod",
      namespace: "qa",
    },
  };
  state = reduceMessage(state, event("ADD", liveAdded, "qa-snapshot"));
  assert.equal(
    state.snapshotUIDs,
    snapshotIDs,
    "ordinary live events must not invalidate origin consumers",
  );
  assert.equal(
    state.snapshotUIDs.has("live-added"),
    false,
    "a real later ADD must keep its arrival animation",
  );
  const assigned = {
    ...pending,
    spec: { nodeName: "worker-cp" },
    metadata: { ...pending.metadata, resourceVersion: "opaque-assigned" },
  };
  state = reduceMessage(state, event("UPDATE", assigned, "qa-snapshot"));
  assert.equal(
    state.resources[pending.metadata.uid].spec.nodeName,
    "worker-cp",
  );
  assert.equal(
    state.snapshotUIDs,
    snapshotIDs,
    "known Pending→assigned is still a live update, not another baseline",
  );
  assert.equal(state.resources["live-added"], liveAdded);
});

test("snapshot provenance replaces rather than accumulates UID history and resets with source", () => {
  let state = initialState("old-context");
  for (let index = 0; index < 40; index++) {
    const current = pod(`snapshot-${index}`);
    state = reduceMessage(state, {
      type: "SNAPSHOT",
      generation: `generation-${index}`,
      resources: [current],
    });
    assert.deepEqual([...state.snapshotUIDs], [current.metadata.uid]);
    const ids = state.snapshotUIDs;
    state = reduceMessage(
      state,
      event("DELETE", current, `generation-${index}`),
    );
    assert.equal(
      state.snapshotUIDs,
      ids,
      "snapshot membership describes that snapshot, not mutable live existence",
    );
  }
  const nextSource = initialState("next-context");
  assert.equal(nextSource.snapshotUIDs.size, 0);
  assert.notEqual(nextSource.snapshotUIDs, state.snapshotUIDs);
});
