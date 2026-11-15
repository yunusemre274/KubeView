// Opt-in candidate correctness only. The existing evidence runner owns the
// loopback fake upstream; this file never starts a browser/server or uses kubeconfig.
import { test, expect } from "@playwright/test";
import { installProbe } from "../../benchmarks/probe.mjs";
import { clickWorld, closeWindow } from "./world.helpers.js";

test.skip(
  process.env.KUBEVIEW_BENCH_BROWSER !== "1" ||
    process.env.KUBEVIEW_BENCH_CAPACITY !== "1",
  "Explicit capacity candidate and isolated fixture required",
);

const upstream = async (request) => {
  const response = await request.get("/__benchmark/state");
  expect(response.ok()).toBeTruthy();
  return response.json();
};
const address = (r) => `${r.kind}/${r.metadata.namespace || ""}/${r.metadata.name}`;
const roles = ["body", "details", "status"];
const inspect = (page) =>
  page.locator("canvas").evaluate((canvas) => {
    const audit = (globalThis.__KV_CAPACITY_TEST__ ||= {
      ids: new WeakMap(), next: 1, watched: new WeakSet(), disposed: [],
    });
    const id = (object) => {
      if (!object) return null;
      if (!audit.ids.has(object)) audit.ids.set(object, audit.next++);
      return audit.ids.get(object);
    };
    const meshes = {};
    for (const role of ["body", "details", "status"]) {
      const mesh = canvas.__harbor.scene.getObjectByName(`pod-cargo:${role}`);
      if (!mesh) { meshes[role] = null; continue; }
      if (!audit.watched.has(mesh)) {
        audit.watched.add(mesh);
        const uuid = mesh.uuid;
        mesh.addEventListener("dispose", () => audit.disposed.push(uuid));
      }
      meshes[role] = {
        uuid: mesh.uuid,
        matrixID: id(mesh.instanceMatrix),
        colorID: id(mesh.instanceColor),
        count: mesh.count,
        capacity: mesh.instanceMatrix.count,
        geometry: mesh.geometry.uuid,
        material: mesh.material.uuid,
      };
    }
    return {
      meshes,
      disposed: [...audit.disposed],
      lifecycle: canvas.__harbor.stats().lifecycle,
      canvasIdentity: canvas.dataset.capacityIdentity,
    };
  });

async function context(page, value) {
  await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
  await page.getByLabel("Cluster / context", { exact: true }).selectOption(value);
  await closeWindow(page);
}
async function namespace(page, value) {
  await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
  await page.getByLabel("Namespace kapsamı", { exact: true }).selectOption(value);
  await closeWindow(page);
}

test("observed cargo changes retain buffers; growth, source and empty scope clean up correctly", async ({
  page, context: browserContext, request,
}, info) => {
  test.setTimeout(90000);
  await browserContext.addInitScript(installProbe);
  await browserContext.addInitScript(() => {
    localStorage.setItem("kubeview.preferences.v1", JSON.stringify({
      version: 1, quality: "medium", theme: "light", motionPreference: "full",
    }));
    localStorage.setItem("kubeview-world-guide", "seen");
  });
  await page.goto("/");
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(page.url()).hostname);
  const fixture = await upstream(request);
  const originalPods = fixture.resources.filter((r) => r.kind === "Pod");
  expect(originalPods).toHaveLength(300);
  expect(fixture.resources.filter((r) => r.kind === "Node")).toHaveLength(20);
  const contexts = await (await request.get("/api/contexts")).json();
  expect(contexts.contexts.map((c) => c.name)).toEqual(["benchmark"]);
  await page.waitForFunction(() => document.querySelector("canvas")?.__harbor?.stats().lifecycle.canonicalPods === 300);
  const identity = `capacity-${info.project.name}`;
  await page.locator("canvas").evaluate((canvas, value) => { canvas.dataset.capacityIdentity = value; }, identity);
  const initial = await inspect(page);
  for (const role of roles) expect(initial.meshes[role]).not.toBeNull();
  expect(initial.lifecycle.visiblePods).toBeGreaterThan(0);
  const seen = [{ stage: "initial", ...initial }];
  const created = new Map();
  const restored = [];
  let sequence = 10000;
  const prefix = `capacity-${info.project.name}-${Date.now().toString(36)}`;
  const seed = originalPods.find((p) => p.metadata.name === "app-0");
  const makePod = (suffix) => {
    const pod = structuredClone(seed);
    pod.metadata = {
      ...pod.metadata, name: `${prefix}-${suffix}`, uid: `${prefix}-${suffix}`,
      resourceVersion: `${prefix}-${suffix}`, creationTimestamp: new Date().toISOString(),
      ownerReferences: [],
    };
    delete pod.metadata.deletionTimestamp;
    delete pod.metadata.finalizers;
    pod.spec.containers = [pod.spec.containers[0]];
    delete pod.spec.initContainers;
    delete pod.spec.ephemeralContainers;
    pod.status.containerStatuses = [pod.status.containerStatuses[0]];
    return pod;
  };
  const replay = async (changes) => {
    if (!changes.length) return;
    await expect.poll(async () => (await upstream(request)).running).toBe(false);
    const response = await request.post("/__benchmark/replay", {
      data: changes.map(({ action, object }, i) => ({
        action, object, atMs: (i + 1) * 25, sequence: sequence++,
      })),
    });
    expect(response.status()).toBe(202);
    await expect.poll(async () => {
      const state = await upstream(request);
      return !state.running && state.samples.length === changes.length;
    }).toBe(true);
    expect((await upstream(request)).samples.filter((s) => s.error)).toEqual([]);
  };
  const waitPod = (uid, present) => page.waitForFunction(({ uid, present }) =>
    Object.values(globalThis.__KUBEVIEW_BENCHMARK__.resources).some((r) => r.metadata.uid === uid) === present,
  { uid, present });
  const waitVisible = (visible, canonical = 300) => page.waitForFunction(({ visible, canonical }) => {
    const state = document.querySelector("canvas").__harbor.stats().lifecycle;
    return state.visiblePods === visible && state.canonicalPods === canonical;
  }, { visible, canonical });
  const sameBuffers = (before, after, selectedRoles = roles) => {
    for (const role of selectedRoles) {
      expect(after.meshes[role].uuid).toBe(before.meshes[role].uuid);
      expect(after.meshes[role].matrixID).toBe(before.meshes[role].matrixID);
      expect(after.meshes[role].colorID).toBe(before.meshes[role].colorID);
      expect(after.meshes[role].geometry).toBe(before.meshes[role].geometry);
      expect(after.meshes[role].material).toBe(before.meshes[role].material);
    }
  };
  let originalError;
  try {
    const single = makePod("single");
    created.set(single.metadata.uid, single);
    await replay([{ action: "ADD", object: single }]);
    await waitPod(single.metadata.uid, true);
    await waitVisible(initial.lifecycle.visiblePods + 1, 301);
    const added = await inspect(page);
    sameBuffers(initial, added);
    expect(added.meshes.body.count).toBe(initial.meshes.body.count + 1);
    expect(added.meshes.details.count).toBe(initial.meshes.details.count + 3);
    expect(added.meshes.status.count).toBe(initial.meshes.status.count + 2);
    seen.push({ stage: "single-add", ...added });
    await clickWorld(page, { type: "container", uid: single.metadata.uid, containerName: "app" });
    await expect(page.locator(".resource-details h2")).toHaveText("app");
    await expect(page.locator(".details-container-parent")).toContainText(single.metadata.name);
    await page.getByRole("button", { name: "Ayrıntı panelini kapat", exact: true }).click();
    await replay([{ action: "DELETE", object: single }]);
    await waitPod(single.metadata.uid, false);
    await waitVisible(initial.lifecycle.visiblePods);
    const deleted = await inspect(page);
    sameBuffers(initial, deleted);
    expect(deleted.meshes.body.count).toBe(initial.meshes.body.count);
    expect(deleted.meshes.details.count).toBe(initial.meshes.details.count);
    expect(deleted.meshes.status.count).toBe(initial.meshes.status.count);
    seen.push({ stage: "single-delete", ...deleted });

    const spare = initial.meshes.details.capacity / 3 - initial.lifecycle.visiblePods;
    expect(spare).toBeGreaterThanOrEqual(1);
    expect(spare).toBeLessThan(32);
    const growth = [];
    let previous = deleted, podBufferGrowths = 0;
    for (let i = 0; i <= spare; i++) {
      const pod = makePod(`growth-${i}`);
      growth.push(pod);
      created.set(pod.metadata.uid, pod);
      await replay([{ action: "ADD", object: pod }]);
      await waitPod(pod.metadata.uid, true);
      await waitVisible(initial.lifecycle.visiblePods + growth.length, 300 + growth.length);
      const current = await inspect(page);
      sameBuffers(initial, current, ["body"]);
      if (current.meshes.details.uuid !== previous.meshes.details.uuid) {
        podBufferGrowths++;
        for (const role of ["details", "status"]) {
          expect(current.meshes[role].uuid).not.toBe(previous.meshes[role].uuid);
          expect(current.meshes[role].matrixID).not.toBe(previous.meshes[role].matrixID);
          expect(current.disposed.filter((id) => id === previous.meshes[role].uuid)).toHaveLength(1);
        }
      } else sameBuffers(previous, current, ["details", "status"]);
      expect(current.meshes.body.count).toBe(initial.meshes.body.count + growth.length);
      expect(current.meshes.details.count).toBe((initial.lifecycle.visiblePods + growth.length) * 3);
      expect(current.meshes.status.count).toBe((initial.lifecycle.visiblePods + growth.length) * 2);
      seen.push({ stage: `growth-${i}`, ...current });
      previous = current;
    }
    expect(podBufferGrowths).toBe(1);
    expect(previous.meshes.details.capacity).toBe(initial.meshes.details.capacity * 2);
    expect(previous.meshes.status.capacity).toBe(initial.meshes.status.capacity * 2);
    sameBuffers(initial, previous, ["body"]);
    await replay(growth.map((object) => ({ action: "DELETE", object })));
    await waitVisible(initial.lifecycle.visiblePods);
    const shrunk = await inspect(page);
    sameBuffers(previous, shrunk);
    seen.push({ stage: "growth-deleted", ...shrunk });

    await context(page, "__demo__");
    await page.waitForFunction(() => document.querySelector("canvas").__harbor.stats().lifecycle.canonicalPods === 24);
    const demo = await inspect(page);
    expect(demo.canvasIdentity).toBe(identity);
    for (const role of roles) expect(demo.meshes[role].uuid).not.toBe(shrunk.meshes[role].uuid);
    seen.push({ stage: "demo-source", ...demo });
    const snapshots = await page.evaluate(() => __KUBEVIEW_BENCHMARK__.snapshots);
    await context(page, "benchmark");
    await page.waitForFunction((before) => __KUBEVIEW_BENCHMARK__.snapshots > before, snapshots);
    await waitVisible(initial.lifecycle.visiblePods);
    const returned = await inspect(page);
    expect(returned.canvasIdentity).toBe(identity);
    for (const role of roles) expect(returned.meshes[role].uuid).not.toBe(demo.meshes[role].uuid);
    seen.push({ stage: "real-source-return", ...returned });

    const empty = { apiVersion: "v1", kind: "Namespace", metadata: {
      uid: `${prefix}-empty`, name: `${prefix}-empty`, resourceVersion: "empty-scope",
    } };
    created.set(empty.metadata.uid, empty);
    await replay([{ action: "ADD", object: empty }]);
    await waitPod(empty.metadata.uid, true);
    await namespace(page, empty.metadata.name);
    await waitVisible(0);
    const emptied = await inspect(page);
    expect(emptied.canvasIdentity).toBe(identity);
    for (const role of roles) {
      expect(emptied.meshes[role]).toBeNull();
      expect(emptied.disposed.filter((id) => id === returned.meshes[role].uuid)).toHaveLength(1);
    }
    seen.push({ stage: "empty-visible-scope", ...emptied });
    await namespace(page, "all");
    await waitVisible(initial.lifecycle.visiblePods);
    const restoredScope = await inspect(page);
    expect(restoredScope.canvasIdentity).toBe(identity);
    for (const role of roles) {
      expect(restoredScope.meshes[role]).not.toBeNull();
      expect(restoredScope.meshes[role].uuid).not.toBe(returned.meshes[role].uuid);
      expect(restoredScope.meshes[role].count).toBe(initial.meshes[role].count);
      expect(restoredScope.meshes[role].capacity).toBe(initial.meshes[role].capacity);
    }
    seen.push({ stage: "all-visible-scope", ...restoredScope });
  } catch (error) {
    originalError = error;
    throw error;
  } finally {
    try {
      const actual = await upstream(request);
      // Delete only UIDs this test created, never a same-name foreign replacement.
      const cleanup = actual.resources.filter((r) => created.has(r.metadata.uid))
        .map((object) => ({ action: "DELETE", object }));
      const presentAddresses = new Set(actual.resources.map(address));
      for (const original of originalPods) if (!presentAddresses.has(address(original))) {
        const replacement = structuredClone(original);
        replacement.metadata.uid = `${prefix}-restored-${restored.length}`;
        replacement.metadata.resourceVersion = `restored-${sequence}`;
        replacement.metadata.creationTimestamp = new Date().toISOString();
        restored.push({ address: address(original), oldUID: original.metadata.uid, newUID: replacement.metadata.uid });
        cleanup.push({ action: "ADD", object: replacement });
      }
      await replay(cleanup);
      expect((await upstream(request)).resources.filter((r) => r.kind === "Pod")).toHaveLength(300);
      if (!page.isClosed()) {
        const close = page.getByRole("button", { name: /^(Ayrıntı panelini kapat|Pencereyi kapat)$/ });
        if (await close.count()) await close.last().click();
        await context(page, "benchmark");
        await namespace(page, "all");
        await waitVisible(initial.lifecycle.visiblePods);
      }
    } catch (cleanupError) {
      await info.attach("capacity-cleanup-error", { body: cleanupError.stack || cleanupError.message, contentType: "text/plain" });
      if (!originalError) throw cleanupError;
    } finally {
      await info.attach("capacity-identity-and-cleanup", {
        body: JSON.stringify({ source: "Explicit isolated fake upstream; production informer/store/scene", seen, restored }, null, 2),
        contentType: "application/json",
      });
    }
  }
});
