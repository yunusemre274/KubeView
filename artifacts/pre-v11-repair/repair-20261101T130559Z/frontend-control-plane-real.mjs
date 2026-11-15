// Real normal UI/API/watch process proof, not observed internal RPC traffic.
import fs from "node:fs/promises";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { launch, kubectl, get, dir, root, runtime, sleep, poll } from "./repair-ui.mjs";
const YAML = createRequire(root + "/frontend/package.json")("yaml"), namespace = "kv-repair-process", prefix = "frontend-control-plane-real";
await fs.writeFile(`${dir}/${prefix}.json`, "{}", { flag: "wx" });
const labels = { "kubeview.io/owner": "pre-v11-repair", "kubeview.io/repair-run": runtime.runID };
const files = ["frontend/src/harbor/visualLifecycle.js", "frontend/src/harbor/LifecycleEffects.jsx", "frontend/src/world/operations.js", "frontend/src/App.jsx"];
const hashes = async () => Object.fromEntries(await Promise.all(files.map(async (file) => [file, crypto.createHash("sha256").update(await fs.readFile(`${root}/${file}`)).digest("hex")])));
const ui = await launch(prefix), { page, result } = ui;
result.source = "REAL owned Kubernetes via normal center UI / API/watch. 3D control-plane signals are explicitly conceptual narratives derived from state, not measured internal API/controller/scheduler/kubelet RPC packets.";
result.namespace = namespace; result.sourceBefore = await hashes(); result.operations = []; result.wire = []; result.samples = []; result.workloads = []; result.cleanup = [];
page.on("websocket", (socket) => socket.on("framereceived", ({ payload }) => {
 try {
  const message = JSON.parse(String(payload)), body = message.payload || message;
  const resources = message.type === "SNAPSHOT" ? body.resources || [] : message.type === "RESOURCE_EVENT" ? [body.object] : [];
  for (const object of resources.filter((r) => r?.metadata?.namespace === namespace && ["Deployment", "ReplicaSet", "Pod", "Event"].includes(r.kind))) {
   result.wire.push({ at: new Date().toISOString(), type: message.type, action: body.action, generation: message.generation, kind: object.kind, name: object.metadata.name, uid: object.metadata.uid, rv: object.metadata.resourceVersion, owners: object.metadata.ownerReferences, resourceGeneration: object.metadata.generation, observedGeneration: object.status?.observedGeneration, nodeName: object.spec?.nodeName || null, phase: object.status?.phase, conditions: object.status?.conditions, containerStatuses: object.status?.containerStatuses, reason: object.reason, regardingUID: object.involvedObject?.uid || object.regarding?.uid });
  }
 } catch {}
}));
page.on("response", async (response) => {
 if (response.request().method() !== "POST" || !response.url().includes("/api/resources")) return;
 const submitted = response.request().postDataJSON(), object = submitted.object || submitted;
 if (object.metadata?.namespace !== namespace || object.kind !== "Deployment") return;
 const returned = await response.json();
 result.operations.push({ at: new Date().toISOString(), name: object.metadata.name, statusHTTP: response.status(), operationID: returned.operation?.id, status: returned.operation?.status, uid: returned.object?.metadata?.uid, dryRun: submitted.dryRun, affinity: object.spec?.template?.spec?.affinity, nodeNameBypass: object.spec?.template?.spec?.nodeName || null });
});
async function sample(label) {
 const value = await page.locator("canvas").evaluate((canvas) => {
  const h = canvas.__harbor, state = h.visualLifecycleState(), process = h.scene.getObjectByName("harbor:conceptual-control-plane"), balls = [], geometryRefs = new Set(), materialRefs = new Set();
  process?.traverse((object) => { if (object.geometry) geometryRefs.add(object.geometry.uuid); if (object.material) materialRefs.add(object.material.uuid); if (object.isInstancedMesh && object.visible) for (let i = 0; i < object.count; i++) { const matrix = object.matrixWorld.clone(); object.getMatrixAt(i, matrix); matrix.premultiply(object.matrixWorld); balls.push({ index: i, world: [matrix.elements[12], matrix.elements[13], matrix.elements[14]] }); } });
  return { clock: state.clock, signals: state.signals.filter((signal) => signal.expires > state.clock * 1000), balls, refs: { geometry: geometryRefs.size, material: materialRefs.size }, stats: h.stats(), labels: [...document.querySelectorAll("span")].filter((element) => element.textContent?.startsWith("Temsili süreç") && !element.hidden).map((element) => element.textContent) };
 }); const row = { at: new Date().toISOString(), label, ...value }; result.samples.push(row); return row;
}
async function openCenter() {
 await ui.close(); const target = await poll(() => page.locator("canvas").evaluate((canvas) => canvas.__harbor.projectTargets({ type: "facility", id: "center" }).find((target) => target.visible)), 10000);
 await page.mouse.click(target.x, target.y);
 await page.getByRole("button", { name: "Uygulama oluştur", exact: true }).click();
}
async function create(name) {
 await openCenter(); const form = page.locator(".resource-form-dialog"); await form.getByRole("button", { name: "YAML", exact: true }).click();
 const object = { apiVersion: "apps/v1", kind: "Deployment", metadata: { name, namespace, labels }, spec: { replicas: 1, selector: { matchLabels: { app: name } }, template: { metadata: { labels: { app: name, ...labels } }, spec: { terminationGracePeriodSeconds: 1, affinity: { nodeAffinity: { requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [{ matchFields: [{ key: "metadata.name", operator: "In", values: [runtime.context] }] }] } } }, containers: [{ name: "process-app", image: "busybox:1.36", command: ["sh", "-c", "sleep 3600"], resources: { requests: { cpu: "5m", memory: "8Mi" }, limits: { cpu: "100m", memory: "32Mi" } } }] } } } };
 await form.getByLabel("Kaynak YAML", { exact: true }).fill(YAML.stringify(object)); await sample(`draft-${name}`);
 await form.getByRole("button", { name: "Server dry-run", exact: true }).click(); await poll(async () => (await form.innerText()).includes("Server dry-run başarılı"), 10000);
 assert(!(await get("deployments", undefined, namespace)).items.some((d) => d.metadata.name === name), "Dry-run created actual Deployment");
 await form.getByRole("button", { name: "Oluştur", exact: true }).click(); await form.waitFor({ state: "detached" }); await sample(`accepted-${name}`);
 await page.getByRole("button", { name: "Ayrıntı panelini kapat", exact: true }).click();
}
try {
 const namespaceFile = `${runtime.privateDirectory}/owned-process-namespace.json`; await fs.writeFile(namespaceFile, JSON.stringify({ apiVersion: "v1", kind: "Namespace", metadata: { name: namespace, labels } }), { mode: 0o600 });
 try { await kubectl(["apply", "-f", namespaceFile]); } finally { await fs.unlink(namespaceFile); }
 await page.goto("http://127.0.0.1:5173"); await page.waitForFunction(() => document.querySelector("canvas")?.__harbor);
 await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click(); await page.getByLabel("Cluster / context", { exact: true }).selectOption(runtime.context);
 await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(namespace); await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click(); await page.getByRole("button", { name: "Pencereyi kapat", exact: true }).click(); await sleep(350);
 const guide = page.locator(".world-first-guide button"); if (await guide.count()) await guide.click();
 // Existing user camera focus provides a closer view of actual center/hangar.
 await ui.world({ type: "facility", id: "center" }); await page.getByRole("button", { name: "Yaklaş", exact: true }).click(); await sleep(250);
 await page.mouse.move(700, 420); for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await sleep(20); }
 await create("process-alpha"); await create("process-beta");
 for (let i = 0; i < 32; i++) { const row = await sample("overlap-and-observed-progress"); if (row.balls.length && i % 5 === 0) await ui.capture(`actual-process-phase-${i}`); await sleep(75); }
 const pods = await poll(async () => { const items = (await get("pods", undefined, namespace)).items; return items.length === 2 && items.every((p) => p.status?.conditions?.some((c) => c.type === "Ready" && c.status === "True")) && items; }, 40000);
 const accepted = result.operations.filter((op) => op.status === "accepted"); assert.equal(accepted.length, 2); assert.notEqual(accepted[0].operationID, accepted[1].operationID);
 for (const name of ["process-alpha", "process-beta"]) {
  const deployment = await get("deployment", name, namespace), rs = (await get("replicasets", undefined, namespace)).items.find((r) => r.metadata.ownerReferences?.some((o) => o.uid === deployment.metadata.uid));
  const pod = pods.find((p) => p.metadata.ownerReferences?.some((o) => o.uid === rs?.metadata.uid)); assert(pod && rs); assert.equal(pod.spec.nodeName, runtime.context);
  const operation = accepted.find((op) => op.uid === deployment.metadata.uid); assert(operation); assert.equal(operation.nodeNameBypass, null);
  const samples = result.samples.flatMap((s) => s.signals), signals = samples.filter((s) => s.uid === deployment.metadata.uid || s.uid === pod.metadata.uid);
  assert(signals.some((signal) => signal.stage === "api-accepted" && signal.operationId === operation.operationID && signal.uid === deployment.metadata.uid), "Actual API operation did not identify its own center signal");
  for (const signal of signals.filter((s) => s.uid === pod.metadata.uid)) assert(signal.owners.some((owner) => owner.uid === rs.metadata.uid), "Pod signal lost actual owner UID");
  result.workloads.push({ name, operationID: operation.operationID, deploymentUID: deployment.metadata.uid, replicaSetUID: rs.metadata.uid, podUID: pod.metadata.uid, nodeName: pod.spec.nodeName, generation: deployment.metadata.generation, observedGeneration: deployment.status.observedGeneration,
   stages: { draftAndDryRun: "LOCAL draft/server validation; no real workload until accepted", apiAccepted: true, deploymentWatchObserved: result.wire.some((w) => w.uid === deployment.metadata.uid), replicaSetWatchObserved: result.wire.some((w) => w.uid === rs.metadata.uid), podWatchObserved: result.wire.some((w) => w.uid === pod.metadata.uid), unassignedPendingWatchObserved: result.wire.some((w) => w.uid === pod.metadata.uid && !w.nodeName && w.phase === "Pending"), nodeAssignmentWatchObserved: result.wire.some((w) => w.uid === pod.metadata.uid && w.nodeName === runtime.context), readyWatchObserved: result.wire.some((w) => w.uid === pod.metadata.uid && w.conditions?.some((c) => c.type === "Ready" && c.status === "True")), containerPullRPC: "NOT OBSERVED — not invented from elapsed time", schedulerInternalRPC: "NOT OBSERVED — state-derived conceptual signal only" },
   visualStages: [...new Set(signals.map((signal) => signal.stage))] });
 }
 const bothUIDs = new Set(accepted.map((op) => op.uid)); result.overlap = result.samples.some((sample) => [...bothUIDs].every((uid) => sample.signals.some((signal) => signal.uid === uid && signal.stage === "api-accepted")));
 assert(result.overlap, "The two true API acceptance process signals did not overlap");
 assert(result.samples.some((s) => s.balls.length > 0 && s.labels.length), "No actual rendered process balls/caption observed");
 await sleep(2200); result.afterExpiry = await sample("after-signal-expiry"); assert.equal(result.afterExpiry.balls.length, 0, "Expired process actors remain drawn");
 result.status = "PASSED";
} catch (error) { result.status = "FAILED"; result.error = error.stack; await ui.capture("failed").catch(() => {}); }
finally {
 await ui.finish();
 try { const ns = await get("namespace", namespace, ""); assert.equal(ns.metadata.labels?.["kubeview.io/repair-run"], runtime.runID); await kubectl(["delete", "namespace", namespace, "--wait=false"]); result.cleanup.push("exact owned namespace delete requested"); } catch (error) { result.cleanup.push(error.message); }
 result.sourceAfter = await hashes(); result.sourceUnchanged = JSON.stringify(result.sourceBefore) === JSON.stringify(result.sourceAfter); result.endedAt = new Date().toISOString(); await ui.save();
}
console.log(JSON.stringify({ status: result.status, overlap: result.overlap, workloads: result.workloads, error: result.error?.split("\n")[0], pageErrors: result.errors, sourceUnchanged: result.sourceUnchanged, evidence: `${dir}/${prefix}.json` }));
if (result.status !== "PASSED") process.exitCode = 1;
