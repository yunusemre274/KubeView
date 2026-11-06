// Owned real-cluster G00 acceptance. Normal catalog/connection controls only;
// read-only scene projections locate the real center for an actual mouse click.
// Transport closure below is explicitly a network fault, not a fabricated event.
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../../..");
const require = createRequire(path.join(root, "frontend/package.json"));
const { chromium } = require("playwright");
const YAML = require("yaml");
const runtime = JSON.parse(await fs.readFile(path.join(dir, "runtime.json"), "utf8"));
const execute = promisify(execFile);
const namespace = "kv-repair-cr", alias = "kv-repair-cr-reader", plural = "repaircargos", group = "audit.kubeview.io";
const crdName = `${plural}.${group}`, kind = "RepairCargo", name = "reconnect-cargo";
const evidenceName = process.env.KV_G00_EVIDENCE || "frontend-G00-real";
if (!/^[a-zA-Z0-9-]+$/.test(evidenceName)) throw new Error("Invalid evidence basename");
const output = path.join(dir, `${evidenceName}.json`);
await fs.writeFile(output, "{}", { flag: "wx" });
const result = { startedAt: new Date().toISOString(), source: "REAL Kubernetes API / scoped production WebSocket / normal catalog UI", context: runtime.context, clusterUID: runtime.clusterUID, namespace, cases: [], wire: [], screenshots: [], errors: [], cleanup: [] };
const label = { "kubeview.io/repair-run": runtime.runID };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function save() { await fs.writeFile(output, JSON.stringify(result, null, 2)); }
async function raw(args, input) {
  const command = ["--kubeconfig", runtime.kubeconfig, "--context", runtime.context, ...args];
  if (input == null) return (await execute("kubectl", command, { cwd: root, timeout: 30000, maxBuffer: 2 ** 22 })).stdout;
  return new Promise((resolve, reject) => {
    const child = execFile("kubectl", command, { cwd: root, timeout: 30000, maxBuffer: 2 ** 22 }, (error, stdout, stderr) => error ? reject(new Error(stderr.slice(0, 1500))) : resolve(stdout));
    child.stdin.end(JSON.stringify(input));
  });
}
async function guard() {
  if (!runtime.ownsCluster || runtime.context !== "kv-repair-1101") throw new Error("Explicit owned lab identity required");
  const actual = JSON.parse(await raw(["get", "namespace", "kube-system", "-o", "json"]));
  if (actual.metadata.uid !== runtime.clusterUID) throw new Error("Cluster UID mismatch; refusing mutation");
}
async function apply(object) { await guard(); return raw(["apply", "-f", "-"], object); }
async function remove(resource, objectName, ns = namespace) {
  await guard();
  const actual = JSON.parse(await raw(["get", resource, objectName, ...(ns ? ["-n", ns] : []), "-o", "json"]));
  if (actual.metadata.labels?.["kubeview.io/repair-run"] !== runtime.runID) throw new Error("Refusing unowned delete");
  return raw(["delete", resource, objectName, ...(ns ? ["-n", ns] : []), "--wait=true", "--timeout=20s"]);
}
async function getCargo() { return JSON.parse(await raw(["get", crdName, name, "-n", namespace, "-o", "json"])); }
async function makeCargo() { await apply({ apiVersion: `${group}/v1`, kind, metadata: { name, namespace, labels: label }, spec: { purpose: "G00 same-UID reconnect verification" } }); return getCargo(); }
async function poll(fn, description, timeout = 35000) {
  const end = Date.now() + timeout; let last;
  while (Date.now() < end) { try { last = await fn(); if (last) return last; } catch (error) { last = String(error.message).slice(0, 600); } await sleep(150); }
  throw new Error(`Bounded wait failed: ${description}: ${JSON.stringify(last)}`);
}
let browser, context, page, currentSocket, blocked = false, roleBinding;
const snapshots = [];
async function capture(label) {
  const file = `${evidenceName}-${String(result.screenshots.length + 1).padStart(2, "0")}-${label}.png`;
  await page.screenshot({ path: path.join(dir, file) });
  result.screenshots.push({ file, at: new Date().toISOString(), label, panel: await page.locator(".resource-details").innerText().catch(() => null) });
  await save();
}
async function step(name, fn) {
  const record = { name, startedAt: new Date().toISOString() }; result.cases.push(record);
  try { record.result = await fn(); record.status = "PASSED"; }
  catch (error) { record.status = "FAILED"; record.error = error.stack; await capture(`failure-${result.cases.length}`).catch(() => {}); throw error; }
  finally { record.endedAt = new Date().toISOString(); await save(); }
}
async function connectionWindow() { await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click(); }
async function closeUtility() { await page.getByRole("button", { name: "Pencereyi kapat", exact: true }).click(); }
async function refresh() {
  const before = snapshots.length;
  await connectionWindow();
  await page.getByRole("button", { name: "Yeniden bağlan", exact: true }).click();
  await closeUtility();
  return poll(() => snapshots.length > before && snapshots.at(-1), "new real scoped snapshot after reconnect");
}
async function panelLive(uid) {
  return poll(async () => {
    const panel = page.locator(".resource-details");
    if (!(await panel.count())) return false;
    const text = await panel.innerText();
    if (!text.includes(name) || !text.includes(uid) || text.includes("Bu kaynak silindi") || /okuma yetkisi yok|henüz listelenmedi|yeniden senkronize|güncel değil/i.test(text)) return false;
    const wire = [...result.wire].reverse().find((s) => s.resources?.some((r) => r.uid === uid) || s.uid === uid && s.action !== "DELETE");
    return wire && { panel: text, uid, generation: wire.generation };
  }, "same actual CR UID live in normal panel");
}
async function openCargo() {
  const existing = page.getByRole("button", { name: "Ayrıntı panelini kapat", exact: true });
  if (await existing.count()) await existing.click();
  await page.waitForFunction(() => document.querySelector("canvas")?.__harbor?.projectTargets);
  const target = await poll(() => page.locator("canvas").evaluate((canvas) => canvas.__harbor.projectTargets({ type: "facility", id: "center" }).find((item) => item.visible)), "actual world center hit target");
  await page.mouse.click(target.x, target.y);
  await page.getByRole("button", { name: "Kaynak kataloğu", exact: true }).click();
  await page.getByLabel("API kaynağı", { exact: true }).selectOption(`${group}/v1|${plural}`);
  const row = page.locator(".resource-table tbody tr").filter({ hasText: name });
  await row.getByRole("button", { name, exact: true }).click();
  await page.locator(".resource-details").waitFor();
}
try {
  await guard();
  await apply({ apiVersion: "v1", kind: "Namespace", metadata: { name: namespace, labels: label } });
  await apply({ apiVersion: "apiextensions.k8s.io/v1", kind: "CustomResourceDefinition", metadata: { name: crdName, labels: label }, spec: { group, scope: "Namespaced", names: { plural, singular: "repaircargo", kind }, versions: [{ name: "v1", served: true, storage: true, schema: { openAPIV3Schema: { type: "object", properties: { spec: { type: "object", "x-kubernetes-preserve-unknown-fields": true } } } } }] } });
  await raw(["wait", "--for=condition=Established", `crd/${crdName}`, "--timeout=30s"]);
  await makeCargo();
  await apply({ apiVersion: "v1", kind: "ServiceAccount", metadata: { name: "cr-reader", namespace, labels: label } });
  await apply({ apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role", metadata: { name: "cr-reader", namespace, labels: label }, rules: [{ apiGroups: [group], resources: [plural], verbs: ["get", "list", "watch"] }, { apiGroups: [""], resources: ["pods"], verbs: ["get", "list", "watch"] }] });
  roleBinding = { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding", metadata: { name: "cr-reader", namespace, labels: label }, subjects: [{ kind: "ServiceAccount", name: "cr-reader", namespace }], roleRef: { apiGroup: "rbac.authorization.k8s.io", kind: "Role", name: "cr-reader" } };
  await apply(roleBinding);
  // Purpose-issued synthetic account credential remains ONLY in the private
  // kubeconfig. Never include its value in stdout, traces, screenshots or JSON.
  const credential = (await raw(["create", "token", "cr-reader", "-n", namespace, "--duration=30m"])).trim();
  const config = YAML.parse(await fs.readFile(runtime.kubeconfig, "utf8"));
  const originalContext = config.contexts.find((entry) => entry.name === runtime.context);
  config.users = [...config.users.filter((entry) => entry.name !== alias), { name: alias, user: { token: credential } }];
  config.contexts = [...config.contexts.filter((entry) => entry.name !== alias), { name: alias, context: { cluster: originalContext.context.cluster, user: alias, namespace } }];
  await fs.writeFile(runtime.kubeconfig, YAML.stringify(config), { mode: 0o600 });
  browser = await chromium.launch({ headless: false, args: ["--use-angle=metal"] });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: path.join(dir, `${evidenceName}-video`), size: { width: 1280, height: 800 } } });
  page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => result.errors.push(String(error)));
  await page.routeWebSocket(/\/ws(?:\?|$)/, (socket) => {
    currentSocket = socket;
    if (blocked) { socket.close({ code: 1012, reason: "owned audit transport hold" }); return; }
    const server = socket.connectToServer();
    server.onMessage((message) => {
      try {
        const value = JSON.parse(String(message)), body = value.payload || value;
        if (value.type === "SNAPSHOT") {
          const summary = { at: new Date().toISOString(), generation: value.generation, context: value.context, scopes: (body.scopes || []).filter((s) => s.group === group), resources: (body.resources || []).filter((r) => r.kind === kind).map((r) => ({ uid: r.metadata.uid, namespace: r.metadata.namespace, name: r.metadata.name, resourceVersion: r.metadata.resourceVersion })) };
          snapshots.push(summary); result.wire.push(summary);
        } else if (value.type === "RESOURCE_EVENT" && body.object?.kind === kind) result.wire.push({ at: new Date().toISOString(), type: value.type, generation: value.generation, action: body.action, uid: body.object.metadata.uid, namespace: body.object.metadata.namespace, resourceVersion: body.object.metadata.resourceVersion });
      } catch { /* Transport still forwards exact unchanged payload below. */ }
      socket.send(message);
    });
  });
  await page.goto("http://127.0.0.1:5173");
  await connectionWindow();
  await page.getByLabel("Cluster / context", { exact: true }).selectOption(runtime.context);
  await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(namespace);
  await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click();
  await closeUtility();
  await step("real CR normal catalog selection and same-context reconnect preserves same UID", async () => {
    const before = await getCargo();
    await openCargo(); await panelLive(before.metadata.uid); await capture("selected-before-reconnect");
    const canonicalBefore = await page.locator("canvas").evaluate((c) => ({ canvas: c.dataset, bounds: { w: c.clientWidth, h: c.clientHeight } }));
    await refresh(); const live = await panelLive(before.metadata.uid), after = await getCargo();
    if (before.metadata.uid !== after.metadata.uid) throw new Error("Upstream UID changed unexpectedly");
    await capture("same-uid-live-after-reconnect"); return { before: { uid: before.metadata.uid, rv: before.metadata.resourceVersion }, after: { uid: after.metadata.uid, rv: after.metadata.resourceVersion }, live, canonicalBefore };
  });
  await step("real watch DELETE marks only the selected UID deleted", async () => {
    const before = await getCargo(); await remove(crdName, name);
    await poll(async () => (await page.locator(".resource-details").innerText()).includes("Bu kaynak silindi"), "watch DELETE visible");
    await capture("real-delete"); return { deletedUID: before.metadata.uid, matchingWireDELETE: result.wire.find((r) => r.action === "DELETE" && r.uid === before.metadata.uid) };
  });
  await step("same address new UID cannot retarget the old selected panel", async () => {
    const replacement = await makeCargo(); await sleep(600);
    if (!(await page.locator(".resource-details").innerText()).includes("Bu kaynak silindi")) throw new Error("Old selection silently attached to replacement");
    await capture("replacement-old-selection-stays-deleted");
    await openCargo(); await panelLive(replacement.metadata.uid); await capture("replacement-explicitly-reselected");
    return { newUID: replacement.metadata.uid };
  });
  await step("offline DELETE is stale until scoped authoritative relist proves absence", async () => {
    const before = await getCargo(); blocked = true;
    await currentSocket.close({ code: 1012, reason: "owned G00 transport disconnect" });
    await poll(async () => (await page.locator(".resource-details").innerText()).includes("güncel değil"), "stale while disconnected");
    await remove(crdName, name);
    const disconnectedPanel = await page.locator(".resource-details").innerText();
    if (disconnectedPanel.includes("Bu kaynak silindi")) throw new Error("Unobserved absence falsely declared deleted");
    await capture("offline-delete-retained-stale"); blocked = false; await refresh();
    await poll(async () => (await page.locator(".resource-details").innerText()).includes("Bu kaynak silindi"), "fresh relist confirms actual absent UID");
    await capture("offline-delete-confirmed-after-relist"); return { uid: before.metadata.uid, disconnectedPanel, authoritativeScopes: snapshots.at(-1).scopes };
  });
  await makeCargo();
  await step("restricted namespace context works without namespace-list; RBAC loss is forbidden, not deleted; restoration recovers", async () => {
    await connectionWindow(); await page.getByLabel("Cluster / context", { exact: true }).selectOption(alias); await closeUtility();
    const actual = await getCargo(); await openCargo(); await panelLive(actual.metadata.uid); await capture("restricted-context-same-real-cr");
    const namespaceResponse = await page.request.get(`http://127.0.0.1:5173/api/resources?context=${alias}&group=&version=v1&resource=namespaces`);
    if (namespaceResponse.status() !== 403) throw new Error(`Expected actual namespaces LIST denial, got ${namespaceResponse.status()}`);
    await remove("rolebinding", "cr-reader"); await refresh();
    await poll(async () => (await page.locator(".resource-details").innerText()).includes("okuma yetkisi yok"), "RBAC denied status explicit");
    if ((await page.locator(".resource-details").innerText()).includes("Bu kaynak silindi")) throw new Error("RBAC loss incorrectly deleted still-real CR");
    const retained = await getCargo(); await capture("rbac-loss-forbidden-still-real");
    await apply(roleBinding); await refresh(); await panelLive(actual.metadata.uid); await capture("rbac-restored-same-uid-live");
    return { uid: actual.metadata.uid, upstreamStillPresent: retained.metadata.uid, namespaceListHTTP: namespaceResponse.status(), deniedScopeObserved: result.wire.some((s) => s.scopes?.some((scope) => scope.status === "forbidden" && scope.namespace === namespace)) };
  });
  await step("namespace change retains selected leased CR while context change clears previous selection", async () => {
    const actual = await getCargo(); await connectionWindow();
    await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill("default"); await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click(); await closeUtility();
    await panelLive(actual.metadata.uid); await capture("namespace-change-selected-cr-lease-retained");
    await connectionWindow(); await page.getByLabel("Cluster / context", { exact: true }).selectOption(runtime.context); await closeUtility();
    await poll(async () => (await page.locator(".resource-details").count()) === 0, "old context selection closed");
    await capture("context-change-cleared-old-selection"); return { previousContext: alias, nextContext: runtime.context, leasedUID: actual.metadata.uid };
  });
  result.status = "PASSED";
} catch (error) { result.status = "FAILED"; result.error = error.stack; }
finally {
  if (page) await capture("final").catch(() => {});
  await context?.close(); await browser?.close();
  // Exact owned namespace and CRD only. Never wildcard-delete user objects.
  for (const [resource, objectName, ns] of [["namespace", namespace, ""], ["crd", crdName, ""]]) {
    try { await remove(resource, objectName, ns); result.cleanup.push({ resource, name: objectName, status: "deleted-owned" }); }
    catch (error) { result.cleanup.push({ resource, name: objectName, error: error.message.slice(0, 1000) }); }
  }
  try {
    const config = YAML.parse(await fs.readFile(runtime.kubeconfig, "utf8"));
    config.users = config.users.filter((entry) => entry.name !== alias); config.contexts = config.contexts.filter((entry) => entry.name !== alias);
    await fs.writeFile(runtime.kubeconfig, YAML.stringify(config), { mode: 0o600 });
  } catch (error) { result.cleanup.push({ privateAlias: alias, error: error.message }); }
  result.endedAt = new Date().toISOString(); await save();
}
console.log(JSON.stringify({ status: result.status, cases: result.cases.map(({ name, status, error }) => ({ name, status, error: error?.split("\n")[0] })), evidence: output }));
if (result.status !== "PASSED") process.exitCode = 1;
