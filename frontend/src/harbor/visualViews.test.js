import test from "node:test";
import assert from "node:assert/strict";
import { cacheVisualView, pruneVisualViews, MAX_VISUAL_VIEWS } from "./visualViews.js";

const visual = (x = 0) => ({
  slots: { nodes: new Map([["node-uid", { position: [x, 0, 25] }]]) },
  fleet: { ships: new Map([["node-uid", { progress: 81, pose: { position: [x, 0.2, 25], yaw: 0.8 } }]]) },
});

test("visual cache remains bounded over many distinct harbor visits and evicts the oldest", () => {
  const views = new Map();
  for (let i = 0; i < 500; i++) {
    cacheVisualView(views, `source-${i}`, visual(i), `harbor-${i}`);
    assert.ok(views.size <= MAX_VISUAL_VIEWS);
  }
  assert.equal(views.size, 64);
  assert.equal(views.has("source-435"), false);
  assert.equal(views.keys().next().value, "source-436");
  assert.equal(views.get("source-499").harborId, "harbor-499");
});

test("returning to a cached source refreshes its LRU order without rebuilding fleet state", () => {
  const views = new Map();
  const first = visual(10);
  cacheVisualView(views, "a", first, "harbor-a");
  for (let i = 1; i < 64; i++) cacheVisualView(views, `s${i}`, visual(i), `h${i}`);
  cacheVisualView(views, "a", views.get("a"), "harbor-a");
  cacheVisualView(views, "new", visual(200), "new-harbor");
  assert.equal(views.size, 64);
  assert.equal(views.has("s1"), false);
  assert.equal(views.has("a"), true);
  assert.strictEqual(views.get("a").fleet, first.fleet);
});

test("scope/source rotation prunes only that harbor's previous generation even when the old key was pinned", () => {
  const views = new Map();
  const other = visual(41);
  cacheVisualView(views, "scope-b", other, "harbor-b");
  for (let generation = 0; generation < 150; generation++) {
    cacheVisualView(views, `scope-a-${generation}`, visual(generation), "harbor-a", [`scope-a-${generation - 1}`, "scope-b"]);
    assert.equal(views.size, 2);
    assert.equal(views.has(`scope-a-${generation - 1}`), false);
    assert.strictEqual(views.get("scope-b").fleet, other.fleet);
  }
  assert.equal(views.get("scope-a-149").harborId, "harbor-a");
});

test("active and nearby views survive LRU pressure with exact Node pose and slot identities", () => {
  const views = new Map();
  const active = visual(101), nearby = visual(202);
  const activePose = active.fleet.ships.get("node-uid").pose;
  const activePosition = activePose.position;
  const activeSlot = active.slots.nodes.get("node-uid");
  cacheVisualView(views, "active", active, "a");
  cacheVisualView(views, "nearby", nearby, "b");
  for (let i = 0; i < 200; i++) cacheVisualView(views, `s${i}`, visual(i), `h${i}`, new Set(["active", "nearby"]));
  assert.equal(views.size, 64);
  assert.strictEqual(views.get("active").fleet, active.fleet);
  assert.strictEqual(views.get("active").slots, active.slots);
  assert.strictEqual(views.get("active").fleet.ships.get("node-uid").pose, activePose);
  assert.strictEqual(activePose.position, activePosition);
  assert.strictEqual(views.get("active").slots.nodes.get("node-uid"), activeSlot);
  assert.deepEqual(activePosition, [101, 0.2, 25]);
  assert.equal(activePose.yaw, 0.8);
  assert.strictEqual(views.get("nearby").fleet, nearby.fleet);
  assert.equal(Object.hasOwn(active, "harborId"), false);
});

test("removing a harbor drops its records but preserves all surviving view objects", () => {
  const views = new Map();
  cacheVisualView(views, "a-source", visual(), "a");
  cacheVisualView(views, "b-source", visual(), "b");
  views.set("legacy-source", { ...visual() });
  const survivor = views.get("b-source");
  assert.strictEqual(pruneVisualViews(views, ["b"]), views);
  assert.equal(views.size, 1);
  assert.strictEqual(views.get("b-source"), survivor);
  pruneVisualViews(views, new Set());
  assert.equal(views.size, 0);
});

test("over-subscribed pins cannot grow the cache or evict any existing live view", () => {
  const views = new Map();
  const keys = [];
  for (let i = 0; i < 64; i++) {
    keys.push(`s${i}`);
    cacheVisualView(views, `s${i}`, visual(i), `h${i}`);
  }
  const entries = [...views.entries()];
  assert.equal(cacheVisualView(views, "new", visual(), "new-harbor", [...keys, "new"]), null);
  assert.deepEqual([...views.entries()], entries);
  assert.equal(views.size, 64);
});
