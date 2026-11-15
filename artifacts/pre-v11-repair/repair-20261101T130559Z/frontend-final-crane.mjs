// One owned UI workload: wait for a real patrol gate, observe full rope transfer,
// then one real container failure. No fleet pose/event mutation or forced docking.
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { launch, kubectl, get, dir, root, runtime, sleep, poll } from "./repair-ui.mjs";
const YAML = createRequire(root + "/frontend/package.json")("yaml"), namespace = "kv-repair-containers", name = "final-crane-cargo", prefix = process.env.KV_CRANE_EVIDENCE || "frontend-final-crane";
await fs.writeFile(`${dir}/${prefix}.json`, "{}", { flag: "wx" });
const labels = { "kubeview.io/owner": "pre-v11-repair", "kubeview.io/repair-run": runtime.runID };
async function apply(object) {
  await kubectl(["version", "--client"]);
  const file = `${runtime.privateDirectory}/crane-owned-namespace.json`;
  await fs.writeFile(file, JSON.stringify(object), { mode: 0o600 });
  try { return await kubectl(["apply", "-f", file]); } finally { await fs.unlink(file); }
}
const ui = await launch(prefix), { page, result } = ui; result.namespace = namespace; result.wire = []; result.samples = []; result.actions = [];
let podUID, podName;
page.on("websocket", (socket) => socket.on("framereceived", ({ payload }) => {
  try {
    const msg = JSON.parse(String(payload)), body = msg.payload || msg;
    const objects = msg.type === "SNAPSHOT" ? body.resources || [] : msg.type === "RESOURCE_EVENT" ? [body.object] : [];
    for (const object of objects.filter((r) => r?.metadata?.namespace === namespace && ["Deployment", "ReplicaSet", "Pod"].includes(r.kind))) {
      result.wire.push({ at: new Date().toISOString(), type: msg.type, action: body.action, kind: object.kind, uid: object.metadata.uid, name: object.metadata.name, owners: object.metadata.ownerReferences, generation: object.metadata.generation, observedGeneration: object.status?.observedGeneration, phase: object.status?.phase, nodeName: object.spec?.nodeName, conditions: object.status?.conditions, containers: object.status?.containerStatuses });
      if (object.kind === "Pod" && object.metadata.labels?.app === name && body.action !== "DELETE") { podUID = object.metadata.uid; podName = object.metadata.name; }
    }
  } catch {}
}));
async function sample(label) {
  const data = await page.locator("canvas").evaluate((canvas, uid) => {
    const h = canvas.__harbor, cargo = [];
    h.scene.updateMatrixWorld(true);
    h.scene.traverse((o) => {
      if (!o.isInstancedMesh || !o.userData.harborTargets) return;
      for (const target of o.userData.harborTargets().filter((t) => t.uid === uid)) {
        const matrix = o.matrixWorld.clone(); o.getMatrixAt(target.instance, matrix); matrix.premultiply(o.matrixWorld);
        cargo.push({ containerName: target.containerName, instance: target.instance, world: [matrix.elements[12], matrix.elements[13], matrix.elements[14]] });
      }
    });
    return { fleet: h.fleetStates(), stats: h.stats(), lifecycle: h.visualLifecycleState(), cargo };
  }, podUID || "unknown");
  const row = { at: new Date().toISOString(), label, uid: podUID, ...data }; result.samples.push(row); return row;
}
try {
  await apply({ apiVersion: "v1", kind: "Namespace", metadata: { name: namespace, labels } });
  await page.goto("http://127.0.0.1:5173"); await page.waitForFunction(() => document.querySelector("canvas")?.__harbor);
  await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
  await page.getByLabel("Cluster / context", { exact: true }).selectOption(runtime.context);
  await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(namespace);
  await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click(); await page.getByRole("button", { name: "Pencereyi kapat", exact: true }).click(); await sleep(500);
  // Actual semantic facility action sets the camera; it does not alter the ship.
  await ui.world({ type: "facility", id: "scheduling" }); await page.getByRole("button", { name: "Yaklaş", exact: true }).click(); await sleep(400);
  // Ordinary OrbitControls wheel steps frame the entire runway, land-side
  // pickup and vessel; one large wheel delta is only one dolly step in r164.
  await page.mouse.move(700, 430);
  for (let i = 0; i < 19; i++) { await page.mouse.wheel(0, 100); await sleep(30); }
  await sleep(200);
  await page.locator("canvas").focus(); await page.keyboard.down("ArrowDown"); await sleep(500); await page.keyboard.up("ArrowDown");
  const guide = page.locator(".world-first-guide button"); if (await guide.count()) await guide.click();
  await ui.find(runtime.context, "Node"); await page.getByRole("button", { name: "Bu gemiye Pod ekle", exact: true }).click();
  const form = page.locator(".resource-form-dialog");
  await form.getByLabel("Kaynak türü", { exact: true }).selectOption("Deployment"); await form.getByLabel("Namespace", { exact: true }).fill(namespace);
  await form.getByLabel("Kaynak adı", { exact: true }).fill(name); await form.getByLabel("Ana container image", { exact: false }).fill("busybox:1.36");
  await form.getByRole("button", { name: "YAML", exact: true }).click(); const field = form.getByLabel("Kaynak YAML", { exact: true }), object = YAML.parse(await field.inputValue());
  object.metadata.labels = { ...object.metadata.labels, ...labels }; object.spec.template.metadata.labels = { ...object.spec.template.metadata.labels, ...labels };
  object.spec.template.spec = { ...object.spec.template.spec, terminationGracePeriodSeconds: 1, volumes: [{ name: "control", emptyDir: {} }], containers: [
    { name: "healthy", image: "busybox:1.36", command: ["sh", "-c", "while :; do echo HEALTHY; sleep 3; done"], volumeMounts: [{ name: "control", mountPath: "/control" }] },
    { name: "controlled-crash", image: "busybox:1.36", command: ["sh", "-c", "while [ ! -f /control/fail ]; do sleep 0.2; done; exit 42"], volumeMounts: [{ name: "control", mountPath: "/control" }] },
  ] };
  await field.fill(YAML.stringify(object)); await form.getByRole("button", { name: "Server dry-run", exact: true }).click();
  await poll(async () => (await form.innerText()).includes("Server dry-run başarılı"));
  const noDeployment = !(await get("deployments", undefined, namespace)).items.some((d) => d.metadata.name === name);
  if (!noDeployment) throw new Error("Dry-run wrote real resource"); result.dryRunAbsence = true;
  result.gateWaitStartedAt = new Date().toISOString();
  result.gate = await poll(async () => { const row = await sample("wait-for-actual-patrol-gate"); return row.fleet.find((ship) => ship.name === runtime.context && ship.eligibleForDock); }, 190000);
  result.gateAcceptedAt = new Date().toISOString(); await ui.save();
  await form.getByRole("button", { name: "Oluştur", exact: true }).click(); await form.waitFor({ state: "detached" });
  await ui.close(); result.actions.push({ at: new Date().toISOString(), action: "actual UI accepted create; close panel to expose rope" });
  const start = Date.now(); let detailed = false, entered = false, activeStarted, captured = 0;
  while (Date.now() - start < 14000) {
    const row = await sample("real-rope-transfer"), ship = row.fleet.find((s) => s.name === runtime.context), active = row.stats.lifecycle.activeTransfers > 0;
    if (active && ship?.state === "docked") { detailed = true; activeStarted ||= Date.now(); }
    if (detailed && active && captured < 5 && Date.now() - activeStarted >= captured * 350) { await ui.capture(`full-rope-phase-${captured}`); captured++; }
    if (active) entered = true;
    if (entered && !active && row.stats.lifecycle.queuedTransfers === 0) break;
    await sleep(80);
  }
  result.detailedTransfer = detailed; result.ropePhaseScreenshots = captured;
  if (!detailed) throw new Error("No actual docked full transfer; not accepted as detailed crane evidence");
  const actual = await poll(async () => { const pod = await get("pod", podName, namespace); return pod.status?.containerStatuses?.length === 2 && pod.status.containerStatuses.every((c) => c.ready) && pod; }, 30000);
  result.pod = { uid: actual.metadata.uid, name: actual.metadata.name, owners: actual.metadata.ownerReferences, nodeName: actual.spec.nodeName, statuses: actual.status.containerStatuses };
  if (process.env.KV_CRANE_SKIP_FALL !== "1") {
  await ui.find(podName, "Pod"); await page.getByRole("button", { name: "Sahnede göster", exact: true }).click(); await sleep(300);
  await page.mouse.move(700, 350); await page.mouse.wheel(0, 180); await sleep(200); await ui.find(podName, "Pod");
  await page.getByText("Görsel seyir ve kamera", { exact: true }).click(); await page.getByRole("button", { name: "Gemiyi kamerayla izle", exact: true }).click(); await ui.close();
  await kubectl(["exec", "-n", namespace, podName, "-c", "healthy", "--", "touch", "/control/fail"]);
  await poll(async () => (await sample("wait-real-crash")).lifecycle.containers.some((effect) => effect.uid === podUID && effect.name === "controlled-crash"), 15000);
  for (let i = 0; i < 7; i++) { await sample("clean-label-real-fall"); await ui.capture(`clean-single-container-fall-${i}`); await sleep(220); }
  }
  result.status = "PASSED";
} catch (error) { result.status = "FAILED"; result.error = error.stack; await ui.capture("failed").catch(() => {}); }
finally {
  await ui.finish();
  try { const ns = await get("namespace", namespace, ""); if (ns.metadata.labels?.["kubeview.io/repair-run"] !== runtime.runID) throw new Error("Unowned namespace"); await kubectl(["delete", "namespace", namespace, "--wait=false"]); result.cleanup = "exact owned namespace delete requested"; } catch (error) { result.cleanup = error.message; }
  result.endedAt = new Date().toISOString(); await ui.save();
}
console.log(JSON.stringify({ status: result.status, detailedTransfer: result.detailedTransfer, ropePhaseScreenshots: result.ropePhaseScreenshots, error: result.error?.split("\n")[0], evidence: `${dir}/${prefix}.json` }));
if (result.status !== "PASSED") process.exitCode = 1;
