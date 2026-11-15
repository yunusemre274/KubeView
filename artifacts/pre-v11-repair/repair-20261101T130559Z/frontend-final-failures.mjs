// PREPARED DURING THE EXCLUSIVE PERFORMANCE LOCK. Do not execute until root
// restores the owned lab and explicitly releases that lock. No product changes.
// Intended invocation after release:
// KV_FINAL_FAILURES_EXECUTE=1 KV_REPAIR_UI_URL=http://127.0.0.1:18081 \
//   node artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-final-failures.mjs
// Normal UI controls are used for workload mutations. Direct API use is limited
// to reads, exact UID/RV cleanup, and creation of the owned namespace/quota fixture.
import fs from "node:fs/promises";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { launch, dir, root, runtime, sleep } from "./repair-ui.mjs";

if (process.env.KV_FINAL_FAILURES_EXECUTE !== "1") {
  throw new Error("Preparation only: execution requires root's performance-lock release and KV_FINAL_FAILURES_EXECUTE=1.");
}
const YAML = createRequire(root + "/frontend/package.json")("yaml");
const suffix = Date.now().toString(36), namespace = `kv-repair-final-${suffix}`;
const prefix = process.env.KV_FINAL_FAILURES_EVIDENCE || "frontend-final-failures";
assert(/^[a-zA-Z0-9_-]+$/.test(prefix) && prefix.length <= 63, "Unsafe evidence prefix or Kubernetes label value exceeds 63 characters");
await fs.writeFile(`${dir}/${prefix}.json`, "{}", { flag: "wx" });
const labels = { "kubeview.io/owner": "pre-v11-repair", "kubeview.io/repair-run": runtime.runID, "kubeview.io/test-job": prefix };
const uiURL = process.env.KV_REPAIR_UI_URL || "http://127.0.0.1:18081";
assert(["127.0.0.1", "localhost"].includes(new URL(uiURL).hostname), "Only the owned local gateway is allowed");
const restartOnly = process.env.KV_FINAL_FAILURES_RESTART_ONLY === "1";
const started = Date.now(), workDeadline = started + (restartOnly ? 120000 : 240000), cleanupDeadline = workDeadline + 60000;
const exec = promisify(execFile), ownedEnv = { ...process.env, KUBECONFIG: `${root}/.git/kv-repair-runtime/kubeconfig`, MINIKUBE_HOME: `${root}/.git/kv-repair-runtime/.minikube` };
const sourceFiles = ["frontend/src/App.jsx", "frontend/src/workbench/ResourceForms.jsx", "frontend/src/workbench/ResourceDetails.jsx", "frontend/src/world/operations.js", "frontend/src/data/resourceStore.js", "frontend/src/context/ShipyardClusterContext.jsx", "backend/pkg/server/resources.go", "backend/pkg/server/server.go", "backend/pkg/server/stream.go", "backend/pkg/server/resource_scopes.go", "backend/pkg/k8s/client.go"];
const hashes = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, crypto.createHash("sha256").update(await fs.readFile(`${root}/${file}`)).digest("hex")])));
const ui = await launch(prefix), { page, result } = ui;
page.setDefaultTimeout(10000);
result.namespace = namespace; result.uiURL = uiURL; result.plannedSourceFromRoot = "6bb9dea (verify actual hashes; not assumed to equal every earlier proof)";
result.source = "Actual owned Kubernetes API through the frozen local production gateway; normal center/finder/form controls and real scoped WebSocket owner events";
result.sourceBefore = await hashes(); result.cases = []; result.wire = []; result.operations = []; result.cleanup = []; result.created = [];
result.scope = "REAL owned Kubernetes / normal contextual UI; negative admission, assignment, image, scale/restart and source-change checks. No fault injection, telemetry generation or new Node provisioning.";
if (restartOnly) result.scope = "Restart-only recovery: new owned namespace and normal UI create of a two-replica Ready fixture, then one actual UI rollout restart. The seven previously passing cases are not rerun.";
if (restartOnly) {
  result.recoveryOf = { evidence: "frontend-final-failures-20261106T102147Z.json", rootCause: "Helper scope mismatch: canonical state correctly retained a terminating old Pod. ready() checked live Pods, but the following UID assertion included terminating Pods. The old FAILED artifact is preserved." };
  result.restartOldTerminatingObservations = [];
}
const topLevel = new Map(); let ownNamespace = null, accepted = null, readyBaseline = false, scaleSucceeded = false, watchdogClosed = false;
const globalWatchdog = setTimeout(() => { watchdogClosed = true; page.close().catch(() => {}); }, Math.max(1, workDeadline - Date.now()));
class Blocked extends Error {}
function checkTime() { if (Date.now() >= workDeadline) throw new Blocked(`Finite ${restartOnly ? "two" : "four"}-minute work budget reached; cleanup is reserved separately`); }
function timeoutWithin(deadline, maximum = 8000) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Blocked("Finite operation budget expired");
  return Math.min(maximum, remaining);
}
async function kubectl(args) {
  // Bound both the guard and the actual child process; the shared helper's 45s
  // command timeout could otherwise consume the minute reserved for cleanup.
  const options = () => ({ env: ownedEnv, timeout: timeoutWithin(workDeadline), killSignal: "SIGKILL", maxBuffer: 4 << 20 });
  const uid = (await exec("kubectl", ["--context", runtime.context, "get", "namespace", "kube-system", "-o", "jsonpath={.metadata.uid}"], options())).stdout;
  assert.equal(uid, runtime.clusterUID, "Owned cluster UID guard rejected");
  return (await exec("kubectl", ["--context", runtime.context, ...args], options())).stdout;
}
async function get(kind, name, scope = runtime.namespace) {
  return JSON.parse(await kubectl(["get", kind, ...(name ? [name] : []), ...(scope ? ["-n", scope] : []), "-o", "json"]));
}
async function wait(fn, ms = 25000) {
  const stop = Math.min(Date.now() + ms, workDeadline); let last;
  while (Date.now() < stop) { try { last = await fn(); if (last) return last; } catch (e) { last = e.message; } await sleep(200); }
  checkTime(); throw new Error(`Bounded observation timed out (${ms}ms): ${String(last).slice(0, 500)}`);
}
function slim(object) {
  return { kind: object.kind, name: object.metadata.name, namespace: object.metadata.namespace, uid: object.metadata.uid, rv: object.metadata.resourceVersion, owners: object.metadata.ownerReferences, generation: object.metadata.generation, deletionTimestamp: object.metadata.deletionTimestamp, nodeName: object.spec?.nodeName || null, phase: object.status?.phase, conditions: object.status?.conditions, statuses: object.status?.containerStatuses, replicas: object.spec?.replicas, readyReplicas: object.status?.readyReplicas, updatedReplicas: object.status?.updatedReplicas, observedGeneration: object.status?.observedGeneration };
}
page.on("websocket", socket => socket.on("framereceived", ({ payload }) => {
  try {
    const msg = JSON.parse(String(payload)), body = msg.payload || msg;
    const rows = msg.type === "SNAPSHOT" ? body.resources || [] : msg.type === "RESOURCE_EVENT" ? [body.object] : [];
    for (const object of rows) if (object?.metadata?.namespace === namespace && ["Deployment", "ReplicaSet", "Pod", "Event"].includes(object.kind)) {
      result.wire.push({ at: new Date().toISOString(), messageType: msg.type, action: body.action, connectionGeneration: msg.generation, ...slim(object) });
      if (result.wire.length > 2048) { result.wire.shift(); result.wireTruncated = (result.wireTruncated || 0) + 1; }
    }
  } catch { /* Never retain unrelated resource/Secret payloads. */ }
}));
async function fixture(object, resource) {
  checkTime(); assert.equal(object.metadata.labels?.["kubeview.io/test-job"], prefix);
  assert(object.kind === "Namespace" || object.metadata.namespace === namespace);
  const file = `${runtime.privateDirectory}/${prefix}-${object.kind}-${suffix}.json`;
  await fs.writeFile(file, JSON.stringify(object), { mode: 0o600 });
  try { await kubectl(["create", "-f", file]); } finally { await fs.unlink(file); }
  const actual = await get(resource, object.metadata.name, object.kind === "Namespace" ? "" : namespace);
  if (object.kind === "Namespace") ownNamespace = slim(actual); else track(actual, resource);
  return actual;
}
function track(object, resource = "deployments") {
  assert.equal(object.metadata.labels?.["kubeview.io/test-job"], prefix, "Only own created top-level objects may be tracked");
  const record = { ...slim(object), resource, group: object.apiVersion.includes("/") ? object.apiVersion.split("/")[0] : "", version: object.apiVersion.split("/").at(-1) };
  topLevel.set(record.uid, record); result.created.push(record); return object;
}
function address(record) {
  return `${new URL(uiURL).origin}/api/resources?${new URLSearchParams({ context: runtime.context, group: record.group || "", version: record.version || "v1", resource: record.resource, namespace: record.namespace || "", name: record.name })}`;
}
async function exactDelete(record, deadline = cleanupDeadline) {
  // Same-source/context URL is pinned; a replacement UID is never deleted.
  let statusHTTP;
  for (let retry = 0; retry < 2; retry++) {
    const response = await ui.context.request.get(address(record), { timeout: timeoutWithin(deadline) });
    if (response.status() === 404) return { uid: record.uid, name: record.name, resource: record.resource, status: "already-absent", observedHTTP404: true };
    assert(response.ok(), `Cleanup GET ${response.status()}`); const current = await response.json();
    assert.equal(current.metadata.uid, record.uid, "Cleanup refused a replacement UID");
    assert.equal(current.metadata.labels?.["kubeview.io/test-job"], prefix, "Cleanup owner mismatch");
    const deleted = await ui.context.request.delete(address(record), { timeout: timeoutWithin(deadline), data: { uid: record.uid, resourceVersion: current.metadata.resourceVersion } });
    if (deleted.status() === 409) continue;
    assert([200, 202, 404].includes(deleted.status()), `Cleanup DELETE ${deleted.status()}`);
    statusHTTP = deleted.status(); break;
  }
  if (!statusHTTP) throw new Error("Cleanup conflict after two bounded attempts; resource left for root's ownership-aware reconciliation");
  const stop = Math.min(deadline, Date.now() + 10000);
  while (Date.now() < stop) {
    const response = await ui.context.request.get(address(record), { timeout: timeoutWithin(stop) });
    if (response.status() === 404) return { uid: record.uid, name: record.name, resource: record.resource, status: "observed-absent", statusHTTP, uidAndResourceVersionPrecondition: true, observedHTTP404: true };
    assert(response.ok(), `Cleanup observation GET ${response.status()}`); const current = await response.json();
    assert.equal(current.metadata.uid, record.uid, "Cleanup observation found a replacement UID; it was not deleted");
    assert.equal(current.metadata.labels?.["kubeview.io/test-job"], prefix, "Cleanup observation owner mismatch");
    await sleep(Math.min(200, Math.max(0, stop - Date.now())));
  }
  throw new Blocked(`DELETE accepted but ${record.resource}/${record.name} UID absence was not observed within the reserved budget`);
}
async function step(name, fn) {
  const row = { name, startedAt: new Date().toISOString() }; result.cases.push(row);
  try { checkTime(); row.result = await fn(); row.status = "PASSED"; }
  catch (error) { row.status = error instanceof Blocked ? "BLOCKED" : "FAILED"; row.error = error.stack; await ui.capture(`case-${result.cases.length}-${row.status.toLowerCase()}`).catch(() => {}); }
  finally { row.endedAt = new Date().toISOString(); await ui.save(); }
  return row;
}
async function closeForm() {
  const form = page.locator(".resource-form-dialog");
  if (await form.count()) { await form.getByRole("button", { name: "Vazgeç", exact: true }).click(); const discard = page.getByRole("button", { name: "Taslağı bırak ve kapat", exact: true }); if (await discard.count()) await discard.click(); await form.waitFor({ state: "detached" }); }
}
async function changeContext(context, applyScope = true) {
  await ui.close(); await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
  await page.getByLabel("Cluster / context", { exact: true }).selectOption(context);
  if (applyScope && context !== "__demo__") { await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(namespace); await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click(); }
  await page.locator(".connection-window").getByRole("button", { name: "Pencereyi kapat", exact: true }).click(); await sleep(300);
}
function deployment(name, { target = runtime.context, invalidImage = false, replicas = 1 } = {}) {
  return { apiVersion: "apps/v1", kind: "Deployment", metadata: { name, namespace, labels }, spec: { replicas, selector: { matchLabels: { app: name } }, template: { metadata: { labels: { ...labels, app: name } }, spec: { terminationGracePeriodSeconds: 1, affinity: { nodeAffinity: { requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [{ matchFields: [{ key: "metadata.name", operator: "In", values: [target] }] }] } } }, containers: [{ name: "app", image: invalidImage ? "registry.invalid/kubeview/never:pre-v11-audit" : "busybox:1.36", imagePullPolicy: invalidImage ? "Always" : "IfNotPresent", command: ["sh", "-c", "sleep 3600"], resources: { requests: { cpu: "5m", memory: "8Mi" }, limits: { cpu: "100m", memory: "32Mi" } } }] } } } };
}
async function resourceResponse(name, dryRun) {
  return page.waitForResponse(response => {
    if (response.request().method() !== "POST" || !response.url().includes("/api/resources")) return false;
    try { const body = response.request().postDataJSON(); return body.object?.metadata?.namespace === namespace && body.object.metadata.name === name && body.dryRun === dryRun; } catch { return false; }
  }, { timeout: 12000 });
}
async function formFor(object) {
  checkTime(); await closeForm(); await ui.world({ type: "facility", id: "center" });
  await page.getByRole("button", { name: "Uygulama oluştur", exact: true }).click();
  const form = page.locator(".resource-form-dialog"); await form.getByRole("button", { name: "YAML", exact: true }).click();
  await form.getByLabel("Kaynak YAML", { exact: true }).fill(YAML.stringify(object)); return form;
}
async function dryRun(form, object) {
  const responseWait = resourceResponse(object.metadata.name, true); await form.getByRole("button", { name: "Server dry-run", exact: true }).click();
  const response = await responseWait; assert(response.ok(), `Dry-run rejected: ${response.status()} ${await response.text()}`);
  await wait(async () => (await form.innerText()).includes("Server dry-run başarılı"), 8000);
  const actual = (await get("deployments", undefined, namespace)).items;
  assert(!actual.some(d => d.metadata.name === object.metadata.name), "Server dry-run unexpectedly persisted a Deployment");
  assert(!object.spec.template.spec.nodeName, "Fixture bypasses the scheduler");
  return { statusHTTP: response.status(), persisted: false, targeting: object.spec.template.spec.affinity };
}
async function create(object) {
  const form = await formFor(object), preview = await dryRun(form, object);
  const responseWait = resourceResponse(object.metadata.name, false); await form.getByRole("button", { name: "Oluştur", exact: true }).click();
  const response = await responseWait, body = await response.json(); assert.equal(response.status(), 201, JSON.stringify(body));
  await form.waitFor({ state: "detached" }); const actual = track(await get("deployment", object.metadata.name, namespace));
  assert.equal(actual.metadata.uid, body.object.metadata.uid); assert.equal(body.operation?.status, "accepted");
  const op = { at: new Date().toISOString(), action: "create", id: body.operation.id, uid: actual.metadata.uid, name: actual.metadata.name, statusHTTP: response.status(), serverStatus: body.operation.status };
  result.operations.push(op); return { object: actual, preview, operation: op };
}
async function workload(name) {
  const d = await get("deployment", name, namespace), replicas = (await get("replicasets", undefined, namespace)).items.filter(rs => rs.metadata.ownerReferences?.some(o => o.uid === d.metadata.uid && o.controller));
  const ids = new Set(replicas.map(rs => rs.metadata.uid)), pods = (await get("pods", undefined, namespace)).items.filter(p => p.metadata.ownerReferences?.some(o => ids.has(o.uid) && o.controller));
  return { deployment: slim(d), replicas: replicas.map(slim), pods: pods.map(slim), rawDeployment: d };
}
async function ready(name, desired, previousRS) {
  return wait(async () => {
    const w = await workload(name), live = w.pods.filter(p => !p.deletionTimestamp);
    if (previousRS && restartOnly) for (const pod of w.pods.filter(p => p.deletionTimestamp && p.owners?.some(o => o.controller && o.uid === previousRS))) {
      if (!result.restartOldTerminatingObservations.some(p => p.uid === pod.uid && p.rv === pod.rv)) result.restartOldTerminatingObservations.push({ at: new Date().toISOString(), ...pod });
    }
    // Restart assertions inspect every Pod returned by workload(), including
    // terminating Pods. Wait for old incarnations to disappear as well as for
    // the new live set to be Ready; mixing these scopes caused a false failure.
    return w.deployment.replicas === desired && w.deployment.readyReplicas === desired && w.deployment.updatedReplicas === desired && w.deployment.observedGeneration >= w.deployment.generation && live.length === desired && live.every(p => p.nodeName === runtime.context && p.conditions?.some(c => c.type === "Ready" && c.status === "True")) && (!previousRS || w.pods.every(p => p.owners?.some(o => o.controller && o.uid !== previousRS))) && w;
  }, 40000);
}
async function ownerWatch(w) {
  const pods = w.pods.filter(p => !p.deletionTimestamp), ownerIDs = new Set(pods.flatMap(p => p.owners?.filter(o => o.controller).map(o => o.uid) || []));
  const replicas = w.replicas.filter(rs => ownerIDs.has(rs.uid));
  assert(pods.length && replicas.length, "No real Deployment/ReplicaSet/Pod owner chain");
  const expected = [{ ...w.deployment, kind: "Deployment" }, ...replicas.map(rs => ({ ...rs, kind: "ReplicaSet", parentUID: w.deployment.uid })), ...pods.map(p => ({ ...p, kind: "Pod", parentUID: p.owners.find(o => o.controller)?.uid }))];
  await wait(async () => expected.every(object => result.wire.some(row => row.messageType === "RESOURCE_EVENT" && row.action !== "DELETE" && row.kind === object.kind && row.uid === object.uid && (!object.parentUID || row.owners?.some(owner => owner.controller && owner.uid === object.parentUID)) && (object.kind !== "Pod" || row.nodeName === object.nodeName))), 5000);
  return expected.map(object => {
    const row = result.wire.find(row => row.messageType === "RESOURCE_EVENT" && row.action !== "DELETE" && row.uid === object.uid && (!object.parentUID || row.owners?.some(owner => owner.controller && owner.uid === object.parentUID)) && (object.kind !== "Pod" || row.nodeName === object.nodeName));
    return { kind: object.kind, uid: object.uid, parentUID: object.parentUID, at: row.at, messageType: row.messageType, action: row.action, owners: row.owners, nodeName: row.nodeName, phase: row.phase };
  });
}
async function action(name, action, replicas) {
  await closeForm(); await ui.find(name, "Deployment"); await page.getByRole("button", { name: action === "scale" ? "Ölçekle" : "Rollout restart", exact: true }).click();
  const form = page.locator(".resource-form-dialog"); if (action === "scale") await form.getByLabel("Yeni replica sayısı", { exact: true }).fill(String(replicas));
  const expectedUID = accepted.object.metadata.uid;
  const responseWait = page.waitForResponse(response => { if (response.request().method() !== "POST" || !response.url().includes("/api/actions")) return false; try { const b = response.request().postDataJSON(); return b.action === action && b.uid === expectedUID && b.namespace === namespace; } catch { return false; } }, { timeout: 12000 });
  await form.getByRole("button", { name: "Uygula", exact: true }).click(); const response = await responseWait, body = await response.json(); assert.equal(response.status(), 202, JSON.stringify(body)); await form.waitFor({ state: "detached" });
  const op = { at: new Date().toISOString(), action, id: body.operation?.id, uid: expectedUID, name, statusHTTP: response.status(), serverStatus: body.operation?.status };
  assert(op.id, "Accepted action has no operation identity"); result.operations.push(op); return op;
}
async function operationUI(op) {
  await ui.close(); await page.getByRole("button", { name: /^Olaylar ve işlemler:/ }).click();
  const row = page.locator(".operation-item").filter({ hasText: op.id }); await wait(async () => await row.count() && (await row.innerText()).includes("Gözlenen sonuç doğrulandı"), 5000);
  const text = await row.innerText(); await ui.capture(`${op.action}-real-observed-operation`); await ui.close(); return text;
}
try {
  await kubectl(["get", "namespace", "kube-system", "-o", "jsonpath={.metadata.uid}"]); // Guard in shared helper; no cluster is created/resumed here.
  const nodes = (await get("nodes", undefined, "")).items, cp = nodes.find(n => n.metadata.name === runtime.context);
  if (!cp?.status?.conditions?.some(c => c.type === "Ready" && c.status === "True")) throw new Blocked("Owned target control-plane Node is not Ready after lab resume");
  await fixture({ apiVersion: "v1", kind: "Namespace", metadata: { name: namespace, labels } }, "namespaces");
  await page.goto(uiURL); await page.waitForFunction(() => document.querySelector("canvas")?.__harbor, null, { timeout: 15000 });
  await changeContext(runtime.context); const guide = page.getByRole("button", { name: "Kısa rehberi kapat", exact: true }); if (await guide.count()) await guide.click();

  if (restartOnly) {
    accepted = await create(deployment("final-ready", { replicas: 2 }));
    const w = await ready("final-ready", 2);
    assert.equal(w.deployment.uid, accepted.object.metadata.uid);
    result.restartFixture = { operation: accepted.operation, deployment: w.deployment, replicas: w.replicas, pods: w.pods, watchOwnerUIDs: await ownerWatch(w) };
    await ui.find(w.pods[0].name, "Pod"); await ui.capture("restart-fixture-two-ready");
    readyBaseline = true; scaleSucceeded = true; await ui.save();
  } else {
  await step("normal center dry-run absence then real Deployment owner/assignment/Ready", async () => {
    accepted = await create(deployment("final-ready")); const w = await ready("final-ready", 1);
    assert.equal(w.deployment.uid, accepted.object.metadata.uid); const watchOwnerUIDs = await ownerWatch(w);
    await ui.find(w.pods[0].name, "Pod"); await ui.capture("real-create-ready-owner"); readyBaseline = true;
    return { preview: accepted.preview, operation: accepted.operation, ...w, rawDeployment: undefined, watchOwnerUIDs };
  });
  await step("normal UI scale uses real scale endpoint and preserves existing Pod UID", async () => {
    if (!readyBaseline) throw new Blocked("Successful create/Ready prerequisite unavailable"); const before = await workload("final-ready"), op = await action("final-ready", "scale", 2), after = await ready("final-ready", 2);
    assert.equal(after.deployment.uid, before.deployment.uid); assert(before.pods.every(p => after.pods.some(q => q.uid === p.uid)), "Scale unnecessarily replaced original Pod");
    const watchOwnerUIDs = await ownerWatch(after), operationPanel = await operationUI(op); scaleSucceeded = true;
    return { op, before: { deployment: before.deployment, pods: before.pods }, after: { deployment: after.deployment, replicas: after.replicas, pods: after.pods }, watchOwnerUIDs, operationPanel };
  });
  }
  await step("normal UI rollout restart observes new ReplicaSet/new Pods without changing Node identity", async () => {
    if (!scaleSucceeded) throw new Blocked("Successful scale2/Ready prerequisite unavailable"); const before = await workload("final-ready"), owner = before.pods.find(p => !p.deletionTimestamp)?.owners.find(o => o.controller)?.uid;
    assert(owner); const op = await action("final-ready", "restart"), after = await ready("final-ready", 2, owner);
    assert(after.pods.every(p => !before.pods.some(q => q.uid === p.uid)), "Restart did not produce new Pod incarnations");
    const newRSUIDs = new Set(after.replicas.filter(rs => rs.uid !== owner && rs.owners?.some(parent => parent.controller && parent.uid === before.deployment.uid)).map(rs => rs.uid));
    assert(after.pods.every(p => p.owners?.some(o => o.controller && newRSUIDs.has(o.uid))), "New Pods do not belong to a real new ReplicaSet owned by the same Deployment");
    await wait(async () => before.pods.every(p => result.wire.some(row => row.messageType === "RESOURCE_EVENT" && row.action === "DELETE" && row.kind === "Pod" && row.uid === p.uid && row.owners?.some(o => o.controller && o.uid === owner) && row.nodeName === runtime.context)), 5000);
    const oldPodDeleteWatch = before.pods.map(p => result.wire.find(row => row.messageType === "RESOURCE_EVENT" && row.action === "DELETE" && row.kind === "Pod" && row.uid === p.uid));
    assert.equal(after.deployment.uid, before.deployment.uid); const currentNode = await get("node", runtime.context, ""); assert.equal(currentNode.metadata.uid, cp.metadata.uid, "Rollout changed the target Node incarnation");
    const watchOwnerUIDs = await ownerWatch(after); await ui.find(after.pods[0].name, "Pod"); await ui.capture("restart-new-pod-owner-ready");
    return { op, before: { deployment: before.deployment, pods: before.pods }, after: { deployment: after.deployment, replicas: after.replicas, pods: after.pods }, unchangedNodeUID: currentNode.metadata.uid, oldPodDeleteWatch, watchOwnerUIDs, operationPanel: await operationUI(op) };
  });
  if (!restartOnly) {
  await step("real no-eligible-Node workload stays Pending with scheduler Unschedulable reason", async () => {
    const target = `kv-absent-${suffix}`; assert(!nodes.some(n => n.metadata.name === target)); const created = await create(deployment("final-unsched", { target }));
    const w = await wait(async () => { const x = await workload("final-unsched"); return x.pods.some(p => !p.nodeName && p.phase === "Pending" && p.conditions?.some(c => c.type === "PodScheduled" && c.status === "False" && c.reason === "Unschedulable")) && x; }, 20000);
    const pod = w.pods.find(p => !p.nodeName); await ui.find(pod.name, "Pod"); await ui.capture("actual-pending-unschedulable");
    assert.equal(w.deployment.readyReplicas || 0, 0); return { operation: created.operation, nonexistentTarget: target, pod, deployment: w.deployment, canonicalNotArtificiallyAssigned: true };
  });
  await step("real invalid image reports ErrImagePull/ImagePullBackOff without fabricated readiness", async () => {
    const created = await create(deployment("final-bad-image", { invalidImage: true }));
    const w = await wait(async () => { const x = await workload("final-bad-image"); return x.pods.some(p => p.statuses?.some(c => ["ErrImagePull", "ImagePullBackOff"].includes(c.state?.waiting?.reason))) && x; }, 35000);
    const pod = w.pods.find(p => p.statuses?.some(c => c.state?.waiting)); assert.equal(pod.nodeName, runtime.context); assert(!pod.conditions?.some(c => c.type === "Ready" && c.status === "True"));
    await ui.find(pod.name, "Pod"); await ui.capture("actual-image-pull-error"); return { operation: created.operation, pod, deployment: w.deployment, imagePullPercentage: "Not observed or invented" };
  });
  await step("real quota admission rejects create after successful server dry-run preview", async () => {
    let quota;
    try {
      const object = deployment("final-quota-rejected", { replicas: 0 }), form = await formFor(object), preview = await dryRun(form, object);
      const current = (await get("deployments", undefined, namespace)).items.length;
      quota = await fixture({ apiVersion: "v1", kind: "ResourceQuota", metadata: { name: "final-admission-quota", namespace, labels }, spec: { hard: { "count/deployments.apps": String(current) } } }, "resourcequotas");
      await wait(async () => { const q = await get("resourcequota", quota.metadata.name, namespace); return Number(q.status?.hard?.["count/deployments.apps"]) === current && Number(q.status?.used?.["count/deployments.apps"]) === current; }, 15000);
      const responseWait = resourceResponse(object.metadata.name, false); await form.getByRole("button", { name: "Oluştur", exact: true }).click(); const response = await responseWait, body = await response.json();
      assert.equal(response.status(), 403); assert(/quota|kota/i.test(body.error || body.message || "")); await wait(async () => await form.getByRole("alert").count() && /quota|kota/i.test(await form.getByRole("alert").innerText()), 5000);
      assert(!(await get("deployments", undefined, namespace)).items.some(d => d.metadata.name === object.metadata.name)); await ui.capture("actual-admission-quota-rejected");
      const errorText = await form.getByRole("alert").innerText(); await closeForm(); return { preview, quotaUID: quota.metadata.uid, statusHTTP: response.status(), error: errorText, realRejectedResourceAbsent: true, admissionChangedAfterPreview: true, notAnAnimationSuccess: true };
    } finally {
      if (quota) {
        const reconciled = await exactDelete(topLevel.get(quota.metadata.uid), Math.min(workDeadline, Date.now() + 10000));
        result.cleanup.push({ phase: "quota-before-next-preview", ...reconciled }); topLevel.delete(quota.metadata.uid);
      }
    }
  });
  await step("discarded unsent draft then real context switch; accepted workload is not server-cancelled", async () => {
    if ([...topLevel.values()].some(record => record.resource === "resourcequotas")) throw new Blocked("Owned admission quota was not reconciled; later dry-run is not comparable");
    const object = deployment("final-cancelled-draft", { replicas: 0 }), form = await formFor(object); const preview = await dryRun(form, object);
    await closeForm(); await changeContext("__demo__", false); assert.equal(await page.locator(".resource-form-dialog").count(), 0);
    const stillAbsent = !(await get("deployments", undefined, namespace)).items.some(d => d.metadata.name === object.metadata.name); assert(stillAbsent);
    const existing = accepted ? await get("deployment", accepted.object.metadata.name, namespace) : null; if (existing) assert.equal(existing.metadata.uid, accepted.object.metadata.uid);
    await ui.capture("draft-discarded-context-changed-no-server-cancel-claim"); await changeContext(runtime.context);
    return { preview, discardedBeforeSubmit: true, contextChangedByNormalSelect: true, draftResourceAbsent: stillAbsent, acceptedExistingResourceUID: existing?.metadata.uid || null, limitation: "Explicit pre-submit discard then source switch. No accepted Kubernetes operation was cancelled; no in-flight response race was manufactured or claimed." };
  });
  await step("reuse prior actual RBAC rejection only when the relevant authorization source still matches", async () => {
    const manifest = JSON.parse(await fs.readFile(`${dir}/backend-hubble-reader-163936Z-manifest.json`, "utf8")), log = await fs.readFile(`${dir}/backend-hubble-reader-163936Z.txt`, "utf8");
    const relevant = ["backend/pkg/server/resources.go", "backend/pkg/server/server.go", "backend/pkg/server/resource_scopes.go", "backend/pkg/k8s/client.go"];
    const comparison = relevant.map(file => ({ file, previous: manifest.sourceBefore[file] || null, current: result.sourceBefore[file], matches: manifest.sourceBefore[file] === result.sourceBefore[file] }));
    const reused = comparison.every(x => x.matches) && /PASS: TestOwnedRepairRealHubbleRestrictedNamespace/.test(log);
    result.reusedRBAC = { source: "backend-hubble-reader-163936Z.txt", manifest: "backend-hubble-reader-163936Z-manifest.json", comparison, testReported: "Actual restricted identity own-namespace Pod LIST allowed; namespace/Node LIST and other/all namespace reads403", scope: "Authorization regression reference, not a new Deployment-create RBAC-denial UI test", historicalCRRevokeUI: "frontend-G00-real-2.json", status: reused ? "REUSED_REAL_E2E_SOURCE_UNCHANGED" : "HISTORICAL_ONLY_SOURCE_CHANGED_OR_INCOMPLETE" };
    if (!reused) throw new Blocked("Relevant source changed or missing manifest hash; prior RBAC proof remains historical and is not relabelled current. Root may choose a separate bounded restricted-identity test.");
    return result.reusedRBAC;
  });
  }
  result.status = result.errors.length || result.cases.some(c => c.status === "FAILED") ? "FAILED" : result.cases.some(c => c.status === "BLOCKED") ? "PARTIAL_WITH_EXPLICIT_BLOCKERS" : "PASSED";
} catch (error) { result.status = error instanceof Blocked ? "BLOCKED" : "FAILED"; result.error = error.stack; }
finally {
  clearTimeout(globalWatchdog); result.watchdogClosedPage = watchdogClosed;
  await ui.capture("final-checkpoint").catch(() => {});
  // Exact created-object identity checks, not wildcard deletion or user namespace cleanup.
  for (const record of [...topLevel.values()].reverse()) { try { result.cleanup.push(await exactDelete(record)); } catch (error) { result.cleanup.push({ uid: record.uid, name: record.name, status: "CLEANUP_BLOCKED", error: error.message }); } }
  if (ownNamespace) { try { result.cleanup.push(await exactDelete({ ...ownNamespace, resource: "namespaces", group: "", version: "v1" })); } catch (error) { result.cleanup.push({ namespace, status: "CLEANUP_BLOCKED", error: error.message }); } }
  result.sourceAfter = await hashes(); result.sourceUnchanged = JSON.stringify(result.sourceBefore) === JSON.stringify(result.sourceAfter); result.endedAt = new Date().toISOString(); result.elapsedSeconds = (Date.now() - started) / 1000;
  if (!result.sourceUnchanged) { result.sourceComparability = "SOURCE_CHANGED: individual observations retained, not one frozen-source acceptance"; if (result.status === "PASSED") result.status = "PARTIAL_SOURCE_CHANGED"; }
  if (result.cleanup.some(row => row.status === "CLEANUP_BLOCKED") && result.status === "PASSED") result.status = "PARTIAL_CLEANUP_BLOCKED";
  await ui.finish(); await ui.save();
}
console.log(JSON.stringify({ status: result.status, namespace, cases: result.cases.map(({ name, status, error }) => ({ name, status, error: error?.split("\n")[0] })), elapsedSeconds: result.elapsedSeconds, sourceUnchanged: result.sourceUnchanged, pageErrors: result.errors, cleanup: result.cleanup, evidence: `${dir}/${prefix}.json` }));
if (result.status !== "PASSED") process.exitCode = 1;
