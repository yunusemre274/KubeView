// Real owned Kubernetes / normal UI functional acceptance. No state setters,
// fixture WS messages, node status injection, or synthesized progress.
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { launch, kubectl, get, dir, root, runtime, sleep, poll } from "./repair-ui.mjs";
const require = createRequire(root + "/frontend/package.json"), YAML = require("yaml");
const namespace = "kv-repair-containers", prefix = process.env.KV_CONTAINER_EVIDENCE || "frontend-container-preparation";
await fs.writeFile(`${dir}/${prefix}.json`, "{}", { flag: "wx" });
const labels = { "kubeview.io/owner": "pre-v11-repair", "kubeview.io/repair-run": runtime.runID };
async function apply(object) {
  if (object.metadata.labels?.["kubeview.io/repair-run"] !== runtime.runID || (object.kind !== "Namespace" && object.metadata.namespace !== namespace)) throw new Error("Unowned fixture refused");
  await kubectl(["version", "--client"]);
  const file = `${runtime.privateDirectory}/${object.kind}-${object.metadata.name}.json`;
  await fs.writeFile(file, JSON.stringify(object), { mode: 0o600 });
  try { return await kubectl(["apply", "-f", file]); } finally { await fs.unlink(file); }
}
async function remove(kind, name, args = []) {
  const actual = await get(kind, name, namespace);
  if (actual.metadata.labels?.["kubeview.io/repair-run"] !== runtime.runID) throw new Error("Unowned delete refused");
  return kubectl(["delete", kind, name, "-n", namespace, ...args]);
}
const podView = (pod) => ({ uid: pod.metadata.uid, name: pod.metadata.name, namespace: pod.metadata.namespace, rv: pod.metadata.resourceVersion, deletion: pod.metadata.deletionTimestamp, owners: pod.metadata.ownerReferences, node: pod.spec?.nodeName, phase: pod.status?.phase, reason: pod.status?.reason, conditions: pod.status?.conditions, statuses: pod.status?.containerStatuses, initStatuses: pod.status?.initContainerStatuses, ephemeralStatuses: pod.status?.ephemeralContainerStatuses });
const ui = await launch(prefix), { page, result } = ui;
result.namespace = namespace; result.wire = []; result.requests = []; result.samples = []; result.cases = []; result.cleanup = [];
const deploymentName = "controlled-container-pair", successfulJob = "completed-without-fall", failedPodName = "terminal-error-container";
let activePod;
page.on("websocket", (socket) => socket.on("framereceived", ({ payload }) => {
  try {
    const message = JSON.parse(String(payload)), body = message.payload || message;
    const resources = message.type === "SNAPSHOT" ? body.resources || [] : message.type === "RESOURCE_EVENT" ? [body.object] : [];
    for (const resource of resources.filter((r) => r?.metadata?.namespace === namespace)) {
      if (!["Pod", "Deployment", "ReplicaSet", "Job"].includes(resource.kind)) continue;
      result.wire.push({ at: new Date().toISOString(), generation: message.generation, type: message.type, action: body.action, kind: resource.kind, ...(resource.kind === "Pod" ? podView(resource) : { uid: resource.metadata.uid, name: resource.metadata.name, owners: resource.metadata.ownerReferences, generation: resource.metadata.generation, observedGeneration: resource.status?.observedGeneration, readyReplicas: resource.status?.readyReplicas }) });
    }
  } catch { /* No broad resource payload or Secret content retained. */ }
}));
page.on("response", async (response) => {
  const request = response.request();
  if (request.method() !== "POST" || !response.url().includes("/api/resources")) return;
  let body; try { body = await response.json(); } catch { return; }
  const sent = request.postDataJSON(), object = sent.object || sent;
  if (object.metadata?.namespace !== namespace) return;
  result.requests.push({ at: new Date().toISOString(), url: response.url(), status: response.status(), kind: object.kind, name: object.metadata.name, requestedPodNodeName: object.spec?.template?.spec?.nodeName || object.spec?.nodeName || null, affinity: object.spec?.template?.spec?.affinity || object.spec?.affinity, accepted: body.accepted, uid: body.object?.metadata?.uid || body.metadata?.uid, operation: body.operation });
});
async function step(name, fn) {
  const row = { name, startedAt: new Date().toISOString() }; result.cases.push(row);
  try { row.result = await fn(); row.status = "PASSED"; }
  catch (error) { row.status = "FAILED"; row.error = error.stack; await ui.capture(`failed-${result.cases.length}`).catch(() => {}); throw error; }
  finally { row.endedAt = new Date().toISOString(); await ui.save(); }
}
async function sample(label) {
  const value = await page.locator("canvas").evaluate((c) => ({ lifecycle: c.__harbor.visualLifecycleState(), stats: c.__harbor.stats(), fleet: c.__harbor.fleetStates() }));
  const row = { at: new Date().toISOString(), label, ...value }; result.samples.push(row); return row;
}
async function sampleFor(label, duration, spacing = 100) {
  const start = Date.now(); while (Date.now() - start < duration) { await sample(label); await sleep(spacing); }
  await ui.save();
}
async function podsForDeployment() {
  return (await get("pods", undefined, namespace)).items.filter((pod) => pod.metadata.labels?.app === deploymentName);
}
async function findReadyPod() { return poll(async () => (await podsForDeployment()).find((p) => !p.metadata.deletionTimestamp && p.status?.containerStatuses?.length === 2 && p.status.containerStatuses.every((c) => c.ready)), 70000); }
async function waitEffect(uid, name) {
  return poll(async () => (await sample("waiting-effect")).lifecycle.containers.find((r) => r.uid === uid && r.name === name), 15000);
}
try {
  await apply({ apiVersion: "v1", kind: "Namespace", metadata: { name: namespace, labels } });
  await page.goto("http://127.0.0.1:5173"); await page.waitForFunction(() => document.querySelector("canvas")?.__harbor);
  await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
  await page.getByLabel("Cluster / context", { exact: true }).selectOption(runtime.context);
  await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(namespace);
  await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click();
  await page.getByRole("button", { name: "Pencereyi kapat", exact: true }).click(); await sleep(600);
  await step("normal targeted ship form dry-run then Deployment create, real owner chain and observed transfer", async () => {
    await ui.find(runtime.context, "Node");
    await page.getByRole("button", { name: "Bu gemiye Pod ekle", exact: true }).click();
    const form = page.locator(".resource-form-dialog");
    await form.getByLabel("Kaynak türü", { exact: true }).selectOption("Deployment");
    await form.getByLabel("Namespace", { exact: true }).fill(namespace);
    await form.getByLabel("Kaynak adı", { exact: true }).fill(deploymentName);
    await form.getByLabel("Ana container image", { exact: false }).fill("busybox:1.36");
    await form.getByLabel("Replica sayısı", { exact: true }).fill("1");
    await form.getByRole("button", { name: "YAML", exact: true }).click();
    const yaml = form.getByLabel("Kaynak YAML", { exact: true }), object = YAML.parse(await yaml.inputValue());
    object.metadata.labels = { ...object.metadata.labels, ...labels };
    object.spec.template.metadata.labels = { ...object.spec.template.metadata.labels, ...labels };
    object.spec.template.spec = { ...object.spec.template.spec, terminationGracePeriodSeconds: 1,
      volumes: [{ name: "control", emptyDir: {} }],
      initContainers: [{ name: "successful-init", image: "busybox:1.36", command: ["sh", "-c", "echo INIT_COMPLETE"] }],
      containers: [
        { name: "healthy", image: "busybox:1.36", command: ["sh", "-c", "while :; do echo HEALTHY_CONTAINER; sleep 3; done"], volumeMounts: [{ name: "control", mountPath: "/control" }], resources: { requests: { cpu: "5m", memory: "8Mi" }, limits: { cpu: "100m", memory: "32Mi" } } },
        { name: "controlled-crash", image: "busybox:1.36", command: ["sh", "-c", "while [ ! -f /control/start ]; do sleep 0.2; done; if [ ! -f /control/allow ]; then echo CONTROLLED_EXIT_42; exit 42; fi; while :; do echo RECOVERED_SAME_UID; sleep 3; done"], volumeMounts: [{ name: "control", mountPath: "/control" }], resources: { requests: { cpu: "5m", memory: "8Mi" }, limits: { cpu: "100m", memory: "32Mi" } } },
      ],
    };
    await yaml.fill(YAML.stringify(object));
    await form.getByRole("button", { name: "Form", exact: true }).click();
    await form.getByRole("button", { name: "Server dry-run", exact: true }).click();
    await poll(async () => (await form.innerText()).includes("Server dry-run başarılı"));
    const listBefore = await get("deployments", undefined, namespace);
    if (listBefore.items.some((d) => d.metadata.name === deploymentName)) throw new Error("Dry-run created a real workload");
    await ui.capture("targeted-form-dry-run-no-real-resource");
    await form.getByRole("button", { name: "Oluştur", exact: true }).click();
    await form.waitFor({ state: "detached" });
    await sampleFor("create-owner-assignment-transfer", 7000, 100);
    activePod = await findReadyPod();
    const deployment = await get("deployment", deploymentName, namespace);
    const rsOwner = activePod.metadata.ownerReferences.find((owner) => owner.controller && owner.kind === "ReplicaSet");
    const rs = await get("replicaset", rsOwner.name, namespace);
    if (!rs.metadata.ownerReferences.some((owner) => owner.uid === deployment.metadata.uid && owner.kind === "Deployment")) throw new Error("Observed owner UID chain invalid");
    if (activePod.spec.nodeName !== runtime.context) throw new Error("Targeted scheduler assignment went to another real Node");
    const terms = deployment.spec.template.spec.affinity?.nodeAffinity?.requiredDuringSchedulingIgnoredDuringExecution?.nodeSelectorTerms;
    if (!terms?.every((term) => term.matchFields?.some((field) => field.key === "metadata.name" && field.operator === "In" && field.values.includes(runtime.context)))) throw new Error("Required metadata.name matchFields absent");
    if (deployment.spec.template.spec.nodeName) throw new Error("Scheduler bypassed via spec.nodeName");
    await ui.find(activePod.metadata.name, "Pod");
    await page.getByRole("button", { name: "Sahnede göster", exact: true }).click();
    await sleep(650);
    // Keep the moving target and its overboard path in the actual user camera.
    // This is the existing opt-in camera-follow control, not a render hook.
    await page.mouse.move(700, 350); await page.mouse.wheel(0, 220); await sleep(250);
    await ui.find(activePod.metadata.name, "Pod");
    await page.getByText("Görsel seyir ve kamera", { exact: true }).click();
    await page.getByRole("button", { name: "Gemiyi kamerayla izle", exact: true }).click();
    await page.getByRole("button", { name: "Ayrıntı panelini kapat", exact: true }).click();
    await sleep(350); await ui.capture("actual-two-container-pod-loaded");
    return { deploymentUID: deployment.metadata.uid, replicaSetUID: rs.metadata.uid, pod: podView(activePod), affinity: deployment.spec.template.spec.affinity, dryRunResourceAbsent: true,
      actualTransferSamples: result.samples.filter((s) => s.stats.lifecycle?.activeTransfers || s.stats.lifecycle?.queuedTransfers), observedSignals: result.samples.flatMap((s) => s.lifecycle.signals).filter((s) => s.uid === activePod.metadata.uid || s.uid === deployment.metadata.uid) };
  });
  await step("one real container crash produces time-varying fall; healthy and successful-init remain", async () => {
    const before = await get("pod", activePod.metadata.name, namespace);
    await kubectl(["exec", "-n", namespace, activePod.metadata.name, "-c", "healthy", "--", "touch", "/control/start"]);
    await waitEffect(activePod.metadata.uid, "controlled-crash");
    await ui.capture("controlled-container-warning");
    await sampleFor("actual-container-fall", 3000, 80);
    await ui.capture("controlled-container-overboard-marker");
    const actual = await get("pod", activePod.metadata.name, namespace), crash = actual.status.containerStatuses.find((c) => c.name === "controlled-crash"), healthy = actual.status.containerStatuses.find((c) => c.name === "healthy");
    if (actual.metadata.uid !== before.metadata.uid || !healthy.ready || healthy.restartCount !== 0) throw new Error("Healthy container or Pod identity changed during one-container failure");
    const effects = result.samples.flatMap((s) => s.lifecycle.containers).filter((effect) => effect.uid === actual.metadata.uid);
    if (effects.some((effect) => ["healthy", "successful-init"].includes(effect.name))) throw new Error("Healthy/init container falsely fell");
    const positions = effects.filter((effect) => effect.name === "controlled-crash" && effect.position).map((effect) => effect.position.map((n) => n.toFixed(3)).join(","));
    if (new Set(positions).size < 3) throw new Error("Fall did not move across multiple sampled positions");
    return { before: podView(before), after: podView(actual), crash, healthy, distinctFallPositions: new Set(positions).size, phases: [...new Set(effects.map((e) => e.phase))], triggeredNames: [...new Set(effects.map((e) => e.name))] };
  });
  await step("same Pod UID recovers after real shared-volume flag and restart, without replaying healthy boxes", async () => {
    await kubectl(["exec", "-n", namespace, activePod.metadata.name, "-c", "healthy", "--", "touch", "/control/allow"]);
    const recovered = await findReadyPod();
    if (recovered.metadata.uid !== activePod.metadata.uid) throw new Error("Recovery replaced the Pod UID");
    await sampleFor("same-uid-container-recovery", 2200, 100);
    await ui.find(recovered.metadata.name, "Pod"); await ui.capture("same-uid-recovered-both-ready");
    const lifecycle = await sample("recovered");
    return { pod: podView(recovered), effect: lifecycle.lifecycle.containers.find((effect) => effect.uid === recovered.metadata.uid && effect.name === "controlled-crash") };
  });
  await step("successful real Job/init completion does not create failure effect", async () => {
    await apply({ apiVersion: "batch/v1", kind: "Job", metadata: { name: successfulJob, namespace, labels }, spec: { template: { metadata: { labels }, spec: { restartPolicy: "Never", affinity: { nodeAffinity: { requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [{ matchFields: [{ key: "metadata.name", operator: "In", values: [runtime.context] }] }] } } }, containers: [{ name: "complete", image: "busybox:1.36", command: ["sh", "-c", "echo SUCCESSFUL_JOB; sleep 2; exit 0"] }] } } } });
    const completed = await poll(async () => (await get("pods", undefined, namespace)).items.find((pod) => pod.metadata.ownerReferences?.some((o) => o.kind === "Job" && o.name === successfulJob) && pod.status.phase === "Succeeded"), 40000);
    const state = await sample("normal-job-completed");
    if (state.lifecycle.containers.some((effect) => effect.uid === completed.metadata.uid)) throw new Error("Normal successful Job falsely fell");
    await ui.find(completed.metadata.name, "Pod"); await ui.capture("normal-completed-job-no-fall"); return { pod: podView(completed), falseFailureEffect: false };
  });
  await step("real terminal Failed container produces bounded error marker", async () => {
    await apply({ apiVersion: "v1", kind: "Pod", metadata: { name: failedPodName, namespace, labels }, spec: { restartPolicy: "Never", affinity: { nodeAffinity: { requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [{ matchFields: [{ key: "metadata.name", operator: "In", values: [runtime.context] }] }] } } }, containers: [{ name: "terminal-fail", image: "busybox:1.36", command: ["sh", "-c", "sleep 3; echo CONTROLLED_TERMINAL_FAILURE; exit 9"] }] } });
    const failed = await poll(async () => { const pod = await get("pod", failedPodName, namespace); return pod.status.phase === "Failed" && pod; }, 40000);
    await waitEffect(failed.metadata.uid, "terminal-fail"); await ui.find(failedPodName, "Pod"); await ui.capture("real-terminal-failed-pod-selectable");
    return { pod: podView(failed), visual: (await sample("terminal-failed")).lifecycle.containers.find((effect) => effect.uid === failed.metadata.uid) };
  });
  await step("normal Pod delete preserves finalizer UID and replacement is a distinct real Pod", async () => {
    await kubectl(["patch", "pod", activePod.metadata.name, "-n", namespace, "--type=merge", "-p", JSON.stringify({ metadata: { finalizers: ["audit.kubeview.io/hold"] } })]);
    await ui.find(activePod.metadata.name, "Pod"); await page.getByRole("button", { name: "Sil", exact: true }).click();
    const form = page.locator(".resource-form-dialog");
    await form.getByLabel(`Onaylamak için “${activePod.metadata.name}” yazın`, { exact: true }).fill(activePod.metadata.name);
    await form.getByRole("button", { name: "Silmeyi onayla", exact: true }).click(); await form.waitFor({ state: "detached" });
    const held = await get("pod", activePod.metadata.name, namespace);
    if (!held.metadata.deletionTimestamp || held.metadata.uid !== activePod.metadata.uid) throw new Error("Finalizer-held UID disappeared prematurely");
    if ((await page.locator(".resource-details").innerText()).includes("Bu kaynak silindi")) throw new Error("Held terminating Pod falsely deleted in UI");
    await ui.capture("finalizer-holds-terminating-real-pod");
    const replacement = await poll(async () => (await podsForDeployment()).find((pod) => pod.metadata.uid !== held.metadata.uid && !pod.metadata.deletionTimestamp), 30000);
    await sampleFor("replacement-new-uid-transfer", 2200, 100);
    const terminationEffects = result.samples.filter((s) => s.label === "replacement-new-uid-transfer").flatMap((s) => s.lifecycle.containers).filter((effect) => effect.uid === held.metadata.uid);
    if (terminationEffects.some((effect) => effect.name === "healthy" || effect.name === "controlled-crash" && effect.phase !== "settled")) throw new Error("Expected normal termination spawned a new false crash fall");
    await page.locator(".details-tabs").getByRole("button", { name: "YAML", exact: true }).click();
    if (!(await page.locator(".resource-details").innerText()).includes(held.metadata.uid)) throw new Error("YAML selected UID retargeted to replacement");
    await kubectl(["patch", "pod", held.metadata.name, "-n", namespace, "--type=merge", "-p", '{"metadata":{"finalizers":[]}}']);
    await poll(async () => (await page.locator(".resource-details").innerText()).includes("Bu kaynak silindi"), 20000);
    await ui.capture("removed-selected-uid-stays-deleted-replacement-separate");
    return { held: podView(held), replacement: podView(replacement), originalSelectionStayedUID: held.metadata.uid, expectedTerminationDidNotCreateNewFall: true, terminationEffects };
  });
  result.status = "PASSED";
} catch (error) { result.status = "FAILED"; result.error = error.stack; }
finally {
  await ui.capture("final").catch(() => {}); await ui.finish();
  try {
    const resources = await get("pods", undefined, namespace);
    for (const pod of resources.items.filter((p) => p.metadata.labels?.["kubeview.io/repair-run"] === runtime.runID && p.metadata.finalizers?.includes("audit.kubeview.io/hold")))
      await kubectl(["patch", "pod", pod.metadata.name, "-n", namespace, "--type=merge", "-p", '{"metadata":{"finalizers":[]}}']);
    const actual = await get("namespace", namespace, "");
    if (actual.metadata.labels?.["kubeview.io/repair-run"] !== runtime.runID) throw new Error("Namespace owner mismatch");
    await kubectl(["delete", "namespace", namespace, "--wait=false"]); result.cleanup.push({ namespace, status: "exact-owned-deletion-requested" });
  } catch (error) { result.cleanup.push({ namespace, error: error.message.slice(0, 1000) }); }
  result.endedAt = new Date().toISOString(); await ui.save();
}
console.log(JSON.stringify({ status: result.status, cases: result.cases.map(({ name, status, error }) => ({ name, status, error: error?.split("\n")[0] })), evidence: `${dir}/${prefix}.json` }));
if (result.status !== "PASSED") process.exitCode = 1;
