// Real storage provider/API/watch/UI DELETE proof; all writes scoped to an
// owned namespace/PVC. No default SC/Node changes or wildcard/forced cleanup.
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { launch, kubectl, get, dir, root, runtime, sleep, poll } from "./repair-ui.mjs";
const YAML = createRequire(root + "/frontend/package.json")("yaml"), namespace = "kv-repair-storage", prefix = process.env.KV_STORAGE_EVIDENCE || "frontend-storage-real";
await fs.writeFile(`${dir}/${prefix}.json`, "{}", { flag: "wx" });
const labels = { "kubeview.io/owner": "pre-v11-repair", "kubeview.io/repair-run": runtime.runID };
const files = ["frontend/src/harbor/FacilityResources.jsx", "frontend/src/harbor/resourceRelations.js", "frontend/src/data/resourceStore.js", "frontend/src/world/FacilityWindow.jsx"];
const hashes = async () => Object.fromEntries(await Promise.all(files.map(async (file) => [file, crypto.createHash("sha256").update(await fs.readFile(`${root}/${file}`)).digest("hex")])));
const ui = await launch(prefix), { page, result } = ui;
result.source = "REAL Kubernetes/minikube hostpath provisioning → informer/WS → normal depot catalog/physical UID markers → actual UI UID/RV-preconditioned delete/reclaim";
result.namespace = namespace; result.sourceCommitFromParent = "f090c59"; result.sourceBefore = await hashes(); result.cycles = []; result.wire = []; result.deletes = []; result.cleanup = [];
const claims = new Set();
page.on("websocket", (socket) => socket.on("framereceived", ({ payload }) => {
 try {
  const message = JSON.parse(String(payload)), body = message.payload || message;
  const objects = message.type === "SNAPSHOT" ? body.resources || [] : message.type === "RESOURCE_EVENT" ? [body.object] : [];
  for (const object of objects.filter((r) => r && (r.kind === "PersistentVolumeClaim" && r.metadata?.namespace === namespace || r.kind === "PersistentVolume" && r.spec?.claimRef?.namespace === namespace)))
   result.wire.push({ at: new Date().toISOString(), type: message.type, generation: message.generation, action: body.action, kind: object.kind, uid: object.metadata.uid, name: object.metadata.name, namespace: object.metadata.namespace, rv: object.metadata.resourceVersion, phase: object.status?.phase, volumeName: object.spec?.volumeName, claimRef: object.spec?.claimRef ? { uid: object.spec.claimRef.uid, name: object.spec.claimRef.name, namespace: object.spec.claimRef.namespace } : null });
 } catch {}
}));
page.on("response", async (response) => {
 if (response.request().method() !== "DELETE" || !response.url().includes("/api/resources")) return;
 const url = new URL(response.url()); if (url.searchParams.get("namespace") !== namespace) return;
 const body = response.request().postDataJSON(); result.deletes.push({ at: new Date().toISOString(), resource: url.searchParams.get("resource"), name: url.searchParams.get("name"), namespace, status: response.status(), uid: body.uid, resourceVersion: body.resourceVersion });
});
async function sample(label) {
 const data = await page.locator("canvas").evaluate((canvas) => {
  const h = canvas.__harbor, modules = [], geometries = new Set(), materials = new Set(); let objects = 0;
  h.scene.traverse((object) => { ++objects; if (object.geometry) geometries.add(object.geometry.uuid); for (const m of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) materials.add(m.uuid);
   const target = object.userData.harborTarget; if (target?.type === "resource-module" && ["PersistentVolume", "PersistentVolumeClaim"].includes(target.kind)) modules.push({ uid: target.uid, name: target.name, kind: target.kind, position: object.position.toArray() });
  });
  return { at: new Date().toISOString(), modules, refs: { objects, geometries: geometries.size, materials: materials.size }, renderer: h.stats() };
 }); result.checks.push({ label, ...data }); return data;
}
async function createNamespace() {
 await kubectl(["version", "--client"]);
 const file = `${runtime.privateDirectory}/owned-storage-namespace.json`;
 await fs.writeFile(file, JSON.stringify({ apiVersion: "v1", kind: "Namespace", metadata: { name: namespace, labels } }), { mode: 0o600 });
 try { await kubectl(["apply", "-f", file]); } finally { await fs.unlink(file); }
}
async function absent(kind, name, ns = namespace) {
 return (await kubectl(["get", kind, name, ...(ns ? ["-n", ns] : []), "-o", "name", "--ignore-not-found"])).trim() === "";
}
async function pickAndVerify(resource) {
 await ui.world({ type: "resource-module", uid: resource.metadata.uid });
 assert.equal(await page.locator(".resource-details h2").innerText(), resource.metadata.name);
 await page.locator(".details-tabs").getByRole("button", { name: "YAML", exact: true }).click();
 assert((await page.locator(".yaml-output").innerText()).includes(resource.metadata.uid));
}
try {
 result.storageClass = await get("storageclass", "standard", "");
 result.storageClass = { name: result.storageClass.metadata.name, uid: result.storageClass.metadata.uid, provisioner: result.storageClass.provisioner, reclaimPolicy: result.storageClass.reclaimPolicy, volumeBindingMode: result.storageClass.volumeBindingMode };
 if (result.storageClass.volumeBindingMode !== "Immediate" || result.storageClass.reclaimPolicy !== "Delete") throw new Error("This bounded proof requires the existing Immediate/Delete standard class; class was not changed");
 await createNamespace();
 await page.goto("http://127.0.0.1:5173"); await page.waitForFunction(() => document.querySelector("canvas")?.__harbor);
 await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click(); await page.getByLabel("Cluster / context", { exact: true }).selectOption(runtime.context);
 await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(namespace); await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click(); await page.getByRole("button", { name: "Pencereyi kapat", exact: true }).click(); await sleep(500);
 await ui.world({ type: "facility", id: "storage" }); await ui.capture("depot-before-owned-claims"); result.baseline = await sample("baseline");
 for (let index = 0; index < 3; index++) {
  const name = `storage-cycle-${index}`, cycle = { index, name, startedAt: new Date().toISOString() }; result.cycles.push(cycle);
  await ui.world({ type: "facility", id: "storage" }); await page.getByRole("button", { name: "PVC oluştur", exact: true }).click(); const form = page.locator(".resource-form-dialog");
  await form.getByRole("button", { name: "YAML", exact: true }).click();
  await form.getByLabel("Kaynak YAML", { exact: true }).fill(YAML.stringify({ apiVersion: "v1", kind: "PersistentVolumeClaim", metadata: { name, namespace, labels }, spec: { accessModes: ["ReadWriteOnce"], storageClassName: "standard", resources: { requests: { storage: "10Mi" } } } }));
  await form.getByRole("button", { name: "Server dry-run", exact: true }).click(); await poll(async () => (await form.innerText()).includes("Server dry-run başarılı"), 12000);
  assert(await absent("pvc", name), "Dry-run created an actual PVC"); cycle.dryRunResourceAbsent = true;
  await form.getByRole("button", { name: "Oluştur", exact: true }).click(); await form.waitFor({ state: "detached" });
  const pvc = await poll(async () => { const value = await get("pvc", name, namespace); return value.status.phase === "Bound" && value; }, 22000); claims.add(pvc.metadata.uid);
  assert.equal(pvc.metadata.labels?.["kubeview.io/repair-run"], runtime.runID);
  const pv = await get("pv", pvc.spec.volumeName, ""); assert.equal(pv.spec.claimRef.uid, pvc.metadata.uid); assert.equal(pv.spec.claimRef.namespace, namespace); assert.equal(pv.status.phase, "Bound"); assert.equal(pv.spec.persistentVolumeReclaimPolicy, "Delete");
  cycle.pvc = { name, uid: pvc.metadata.uid, rv: pvc.metadata.resourceVersion, phase: pvc.status.phase, requested: pvc.spec.resources.requests.storage, capacity: pvc.status.capacity.storage };
  cycle.pv = { name: pv.metadata.name, uid: pv.metadata.uid, rv: pv.metadata.resourceVersion, phase: pv.status.phase, claimUID: pv.spec.claimRef.uid, reclaimPolicy: pv.spec.persistentVolumeReclaimPolicy };
  await ui.world({ type: "facility", id: "storage" });
  await page.locator(".resource-table tbody tr").filter({ hasText: name }).getByRole("button", { name, exact: true }).waitFor();
  await poll(async () => { const s = await sample(`bound-${index}`); return s.modules.some((m) => m.uid === pvc.metadata.uid) && s.modules.some((m) => m.uid === pv.metadata.uid); }, 12000);
  await pickAndVerify(pvc); if (index === 0) await ui.capture("actual-bound-pvc-uid-module-selected");
  await pickAndVerify(pv); if (index === 0) await ui.capture("actual-bound-pv-claim-uid-selected"); cycle.bound = await sample(`bound-modules-cycle-${index}`);
  await pickAndVerify(pvc);
  const identity = await get("pvc", name, namespace); assert.equal(identity.metadata.uid, pvc.metadata.uid);
  // Normal UI sends required UID/RV preconditions to the actual Kubernetes API.
  await page.getByRole("button", { name: "Sil", exact: true }).click(); const deletion = page.locator(".resource-form-dialog");
  await deletion.getByLabel(`Onaylamak için “${name}” yazın`, { exact: true }).fill(name); await deletion.getByRole("button", { name: "Silmeyi onayla", exact: true }).click(); await deletion.waitFor({ state: "detached" });
  await poll(() => absent("pvc", name), 22000); await poll(() => absent("pv", pv.metadata.name, ""), 22000);
  await poll(async () => { const s = await sample(`removed-${index}`); return !s.modules.some((m) => m.uid === pvc.metadata.uid || m.uid === pv.metadata.uid); }, 10000);
  await sleep(350); cycle.after = await sample(`after-cycle-${index}`);
  assert.equal(cycle.after.modules.length, result.baseline.modules.length, "Old module references remain after true DELETE");
  cycle.deletedBoth = true; cycle.completedAt = new Date().toISOString(); await ui.save();
 }
 result.slotPositions = result.cycles.map((cycle) => cycle.bound.modules.filter((m) => claims.has(m.uid) || m.uid === cycle.pv.uid).map((m) => m.position.join(",")).sort());
 for (const positions of result.slotPositions) assert.deepEqual(positions, result.slotPositions[0], "Sequential live storage cycles did not reuse module slots");
 for (const request of result.deletes) { assert.equal(request.resource, "persistentvolumeclaims"); assert(claims.has(request.uid)); assert(request.resourceVersion); assert.equal(request.status, 202); }
 assert.equal(result.deletes.length, 3); result.final = await sample("final-baseline-restored");
 await ui.capture("after-three-real-claims-reclaimed"); result.status = "PASSED";
} catch (error) { result.status = "FAILED"; result.error = error.stack; await ui.capture("failed").catch(() => {}); }
finally {
 await ui.finish();
 try {
  const ns = await get("namespace", namespace, ""); assert.equal(ns.metadata.labels?.["kubeview.io/repair-run"], runtime.runID);
  // Any remaining owned PVC is removed with its current real UID/RV through the
  // API rather than force/wildcard delete; volume reclaim remains controller-owned.
  const remaining = await get("pvc", undefined, namespace);
  for (const pvc of remaining.items) {
   assert.equal(pvc.metadata.labels?.["kubeview.io/repair-run"], runtime.runID);
   const url = `http://127.0.0.1:5173/api/resources?${new URLSearchParams({ context: runtime.context, namespace, group: "", version: "v1", resource: "persistentvolumeclaims", name: pvc.metadata.name })}`;
   const response = await fetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid: pvc.metadata.uid, resourceVersion: pvc.metadata.resourceVersion }) });
   result.cleanup.push({ name: pvc.metadata.name, uid: pvc.metadata.uid, status: response.status });
  }
  await kubectl(["delete", "namespace", namespace, "--wait=false"]); result.cleanup.push({ namespace, status: "exact-owned-delete-requested" });
 } catch (error) { result.cleanup.push({ error: error.message.slice(0, 1500) }); }
 result.sourceAfter = await hashes(); result.sourceUnchangedDuringRun = JSON.stringify(result.sourceBefore) === JSON.stringify(result.sourceAfter); result.endedAt = new Date().toISOString(); await ui.save();
}
console.log(JSON.stringify({ status: result.status, cycles: result.cycles.map((c) => ({ index: c.index, pvcUID: c.pvc?.uid, pvUID: c.pv?.uid, deletedBoth: c.deletedBoth })), error: result.error?.split("\n")[0], pageErrors: result.errors, sourceUnchanged: result.sourceUnchangedDuringRun, evidence: `${dir}/${prefix}.json` }));
if (result.status !== "PASSED") process.exitCode = 1;
