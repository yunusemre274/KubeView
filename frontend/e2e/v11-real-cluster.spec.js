import { test, expect } from "./v11-fixtures.js";
import { createFixture, getOwned, guardScope, cleanupOwned, resourcePath, assertOwned, releaseOwnedFinalizer } from "./v11-lab.mjs";
import { chooseScope, openConnection, enableManagement, findResource, findFacility, resourceTab,
  closePanels, confirmDelete, applyAction, cameraPose, poseDistance, scopeObservation } from "./v11-ui.helpers.js";

async function apiObject(page, lab, slot, kind, name) {
  const descriptor = { kind, metadata: { name } };
  const response = await page.request.get(lab.baseURL + resourcePath(slot, descriptor));
  expect(response.status()).toBe(200);
  return response.json();
}

async function readyDeployment(page, lab, slot, name, replicas) {
  let object;
  await expect.poll(async () => {
    object = await apiObject(page, lab, slot, "Deployment", name);
    return object.spec.replicas === replicas &&
      object.status?.observedGeneration >= object.metadata.generation &&
      object.status?.updatedReplicas === replicas && object.status?.readyReplicas === replicas &&
      (object.status?.unavailableReplicas || 0) === 0;
  }, { timeout: 90000, intervals: [200, 500, 1000], message: `Observed rollout ${name} → ${replicas} Ready` }).toBe(true);
  return object;
}

async function ownedPods(page, lab, slot, deploymentName) {
  const query = new URLSearchParams({ context: slot.context, namespace: slot.namespace, version: "v1", resource: "pods" });
  const response = await page.request.get(`${lab.baseURL}/api/resources?${query}`);
  expect(response.status()).toBe(200);
  const payload = await response.json();
  return (payload.items || []).filter((pod) => pod.metadata.labels?.app === deploymentName);
}

async function nonce(page, lab, slot) {
  const response = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
  expect(response.status()).toBe(200);
  const state = await response.json();
  expect(state.context).toBe(slot.context);
  expect(state.namespace).toBe(slot.namespace);
  expect(state.connectionID).toBeTruthy();
  return state.connectionID;
}

function actualQuantity(value) {
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)([numkKMGTPE]|[KMGTPE]i)?$/.exec(String(value ?? ""));
  if (!match) throw new Error("Actual metric quantity has an unsupported unit");
  const scale = { n: 1e-9, u: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9,
    T: 1e12, P: 1e15, E: 1e18, Ki: 1024, Mi: 1024 ** 2, Gi: 1024 ** 3, Ti: 1024 ** 4, Pi: 1024 ** 5, Ei: 1024 ** 6 };
  return Number(match[1]) * (scale[match[2]] || 1);
}

async function teardown(page, lab, slot, object, evidence) {
  if (!page.url().startsWith(lab.baseURL)) await page.goto(lab.baseURL);
  await chooseScope(page, slot.context, slot.namespace);
  await enableManagement(page);
  const result = await cleanupOwned(lab, slot, object, page.request, await nonce(page, lab, slot));
  evidence.check("Guarded own cleanup", { clusterUID: slot.clusterUID, ...result });
}

test("V11-02 V11-03 V11-12 same-name different-UID A→B→A isolates normal details and live logs", async ({ page, lab, evidence }) => {
  test.setTimeout(240000);
  const fixtures = [];
  let primaryError;
  const markers = { A: "V11_CLUSTER_A_ONLY", B: "V11_CLUSTER_B_ONLY" };
  const activeLogs = new Map();
  let openedLogs = 0, closedLogs = 0;
  const observeLog = (request) => {
    const url = new URL(request.url());
    if (url.pathname !== "/api/logs") return;
    activeLogs.set(request, { context: url.searchParams.get("context"), uid: url.searchParams.get("uid") });
    openedLogs++;
  };
  const closeLog = (request) => { if (activeLogs.delete(request)) closedLogs++; };
  page.on("request", observeLog);
  page.on("requestfinished", closeLog);
  page.on("requestfailed", closeLog);
  try {
    for (const slot of Object.values(lab.slots)) {
      const pod = await createFixture(lab, slot, {
        apiVersion: "v1", kind: "Pod", metadata: { name: lab.samePod, namespace: slot.namespace,
          labels: { [lab.ownerKey]: lab.owner, "kubeview.io/v11-slot": slot.slot } },
        spec: { restartPolicy: "Never", containers: [{ name: "app", image: lab.fixtureImage,
          command: ["sh", "-c", `while true; do echo ${markers[slot.slot]}; sleep 1; done`],
          resources: { requests: { cpu: "10m", memory: "16Mi" }, limits: { cpu: "100m", memory: "64Mi" } } }] },
      });
      fixtures.push({ slot, pod });
      await expect.poll(async () => (await getOwned(lab, slot, "Pod", lab.samePod)).status?.phase,
        { timeout: 90000, intervals: [250, 500, 1000] }).toBe("Running");
    }
    expect(fixtures[0].pod.metadata.uid).not.toBe(fixtures[1].pod.metadata.uid);
    const kubeconfigBefore = await import("node:fs/promises").then((fs) => fs.readFile(lab.kubeconfig));
    await page.goto(lab.baseURL);
    for (const slotName of ["A", "B", "A"]) {
      const { slot, pod } = fixtures.find((fixture) => fixture.slot.slot === slotName);
      await chooseScope(page, slot.context, slot.namespace, { close: false });
      evidence.result.scopeTrace = scopeObservation(page);
      await expect.poll(() => [...activeLogs.values()].filter((stream) => stream.context !== slot.context).length).toBe(0);
      await expect(page.locator(".connection-window")).toContainText("Salt okunur");
      await closePanels(page);
      const details = await findResource(page, "Pod", lab.samePod, pod.metadata.uid);
      await resourceTab(page, "Loglar");
      await expect(details.locator(".log-output")).toContainText(markers[slotName], { timeout: 30000 });
      await expect(details.locator(".log-output")).not.toContainText(markers[slotName === "A" ? "B" : "A"]);
      await details.getByRole("button", { name: "Log akışını duraklat", exact: true }).click();
      await expect(details.getByRole("button", { name: "Logları yeniden bağla", exact: true })).toBeVisible();
      await details.getByRole("button", { name: "Logları yeniden bağla", exact: true }).click();
      await expect(details.locator(".logs-status")).toContainText("Canlı akış");
      evidence.check("Context-specific visible UID and synthetic fixture log", { context: slot.context,
        clusterUID: slot.clusterUID, uid: pod.metadata.uid, marker: markers[slotName] });
      await evidence.capture(`${slotName.toLowerCase()}-own-uid-log`);
    }
    // Rapid intent switch: no direct store hook, only the real selector.
    const dialog = await openConnection(page);
    const priorRapidSocket = scopeObservation(page)?.socket;
    await dialog.getByLabel("Cluster / context", { exact: true }).selectOption(lab.slots.B.context);
    await dialog.getByLabel("Cluster / context", { exact: true }).selectOption(lab.slots.A.context);
    await expect.poll(async () => {
      const observed = scopeObservation(page), selected = await dialog.getByLabel("Namespace kapsamı", { exact: true }).inputValue();
      const namespace = selected === "all" ? "" : selected;
      return observed?.diagnostic?.context === lab.slots.A.context && observed.diagnostic.namespace === namespace &&
        observed.socket !== priorRapidSocket && observed.socket?.context === lab.slots.A.context && observed.socket.namespace === namespace && observed.socket.snapshot && !observed.socket.closed;
    }, { timeout: 30000, message: "Rapid context intent must settle on the actual A connection and displayed scope" }).toBe(true);
    await dialog.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(lab.namespace);
    await dialog.getByRole("button", { name: "Kapsamı uygula", exact: true }).click();
    await expect.poll(() => {
      const observed = scopeObservation(page);
      return observed?.diagnostic?.context === lab.slots.A.context && observed.diagnostic.namespace === lab.namespace &&
        observed.socket?.context === lab.slots.A.context && observed.socket.namespace === lab.namespace && observed.socket.snapshot && !observed.socket.closed;
    }, { timeout: 30000, message: "After rapid switch, manual scope requires the actual A/QA snapshot" }).toBe(true);
    await expect(dialog.getByText("Snapshot alındı", { exact: true })).toBeVisible({ timeout: 30000 });
    await closePanels(page);
    await expect.poll(() => activeLogs.size).toBe(0);
    await findResource(page, "Pod", lab.samePod, fixtures[0].pod.metadata.uid);
    expect(await import("node:fs/promises").then((fs) => fs.readFile(lab.kubeconfig))).toEqual(kubeconfigBefore);
    evidence.check("Rapid A→B→A selected correct current UID; trusted kubeconfig bytes unchanged");
    evidence.check("Open prior-context log requests actually closed on normal source changes", { openedLogs, closedLogs, activeLogs: activeLogs.size });
  } catch (error) {
    primaryError = error;
    evidence.result.primaryFailure = { name: error.name, message: String(error.message).split(/\nCall log:/)[0] };
    evidence.result.scopeTrace = scopeObservation(page);
    try { await evidence.capture("primary-failure-before-cleanup"); } catch { /* A closed page cannot provide a screenshot. */ }
    throw error;
  } finally {
    const cleanupFailures = [];
    for (const { slot, pod } of fixtures.reverse()) {
      try { await teardown(page, lab, slot, pod, evidence); }
      catch (error) {
        cleanupFailures.push(slot.slot);
        evidence.result.checks.push({ name: "Guarded own cleanup", status: "FAIL", clusterUID: slot.clusterUID,
          uid: pod.metadata.uid, reason: String(error.message).split(/\nCall log:/)[0] });
      }
    }
    page.off("request", observeLog);
    page.off("requestfinished", closeLog);
    page.off("requestfailed", closeLog);
    if (cleanupFailures.length && !primaryError) throw new Error(`Guarded cleanup remains required for owned cluster slots ${cleanupFailures.join(", ")}`);
  }
});

test("V11-07 V11-08 V11-09 V11-10 center dry-run/create/scale/resources/restart/Pod replacement/delete", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium", "Mutations run once; read-only browser coverage is separate");
  test.setTimeout(420000);
  const slot = lab.slots.A;
  const name = `v11-ui-${Date.now().toString(36)}`;
  let created;
  let primaryError;
  try {
    await page.goto(lab.baseURL);
    await chooseScope(page, slot.context, slot.namespace);
    await enableManagement(page);
    await findFacility(page);
    await page.getByRole("button", { name: "Uygulama oluştur", exact: true }).click();
    let dialog = page.locator(".resource-form-dialog");
    await dialog.getByLabel("Kaynak adı", { exact: true }).fill(name);
    await dialog.getByLabel("Ana container image", { exact: false }).fill(lab.image);
    await dialog.getByLabel("Replica sayısı", { exact: true }).fill("2");
    await dialog.getByRole("button", { name: "YAML", exact: true }).click();
    const editor = dialog.getByLabel("Kaynak YAML", { exact: true });
    const YAML = await import("yaml");
    const draft = YAML.parse(await editor.inputValue());
    draft.metadata.labels = { ...draft.metadata.labels, [lab.ownerKey]: lab.owner, "kubeview.io/v11-preserve": "keep" };
    draft.spec.template.metadata.labels = { ...draft.spec.template.metadata.labels, [lab.ownerKey]: lab.owner };
    draft.spec.template.metadata.annotations = { "kubeview.io/v11-preserve": "keep" };
    await editor.fill(YAML.stringify(draft));
    await guardScope(lab, slot);
    await dialog.getByRole("button", { name: "Server dry-run", exact: true }).click();
    await expect(dialog).toContainText("Server dry-run başarılı.");
    const descriptor = { kind: "Deployment", metadata: { name } };
    expect((await page.request.get(lab.baseURL + resourcePath(slot, descriptor))).status()).toBe(404);
    evidence.check("Real server dry-run left GET 404");
    await guardScope(lab, slot);
    await dialog.getByRole("button", { name: "Oluştur", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    created = await apiObject(page, lab, slot, "Deployment", name);
    assertOwned(lab, slot, created);
    evidence.check("Normal UI CREATE accepted real owned UID; rollout is still pending", { name, uid: created.metadata.uid,
      resourceVersion: created.metadata.resourceVersion, clusterUID: slot.clusterUID, namespace: slot.namespace });
    created = await readyDeployment(page, lab, slot, name, 2);
    await getOwned(lab, slot, "Deployment", name);
    evidence.check("Create reached observed-generation and 2 Ready", { uid: created.metadata.uid });
    for (const replicas of [3, 1]) {
      await findResource(page, "Deployment", name, created.metadata.uid);
      assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), created.metadata.uid);
      await applyAction(page, "Ölçekle", (form) => form.getByLabel("Yeni replica sayısı", { exact: true }).fill(String(replicas)));
      created = await readyDeployment(page, lab, slot, name, replicas);
      const live = (await ownedPods(page, lab, slot, name)).filter((pod) => !pod.metadata.deletionTimestamp);
      expect(live).toHaveLength(replicas);
      expect(live.every((pod) => pod.spec.nodeName && pod.status.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True"))).toBe(true);
      evidence.check(`Scale observed desired/current/ready ${replicas}`, { uid: created.metadata.uid, livePodUIDs: live.map((pod) => pod.metadata.uid) });
    }
    await findResource(page, "Deployment", name, created.metadata.uid);
    assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), created.metadata.uid);
    await applyAction(page, "CPU / RAM", async (form) => {
      await form.getByLabel("CPU request", { exact: false }).first().fill("20m");
      await form.getByLabel("CPU limit", { exact: false }).first().fill("150m");
      await form.getByLabel("Bellek request", { exact: false }).first().fill("24Mi");
      await form.getByLabel("Bellek limit", { exact: false }).first().fill("96Mi");
    });
    created = await readyDeployment(page, lab, slot, name, 1);
    expect(created.spec.template.spec.containers[0].resources).toEqual({ requests: { cpu: "20m", memory: "24Mi" }, limits: { cpu: "150m", memory: "96Mi" } });
    expect(created.metadata.labels["kubeview.io/v11-preserve"]).toBe("keep");
    expect(created.spec.template.metadata.annotations["kubeview.io/v11-preserve"]).toBe("keep");
    const beforeRestart = (await ownedPods(page, lab, slot, name)).filter((pod) => !pod.metadata.deletionTimestamp);
    await findResource(page, "Deployment", name, created.metadata.uid);
    assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), created.metadata.uid);
    await applyAction(page, "Rollout restart");
    created = await readyDeployment(page, lab, slot, name, 1);
    await expect.poll(async () => {
      const live = (await ownedPods(page, lab, slot, name)).filter((pod) => !pod.metadata.deletionTimestamp);
      return live.length === 1 && live.every((pod) => !beforeRestart.some((old) => old.metadata.uid === pod.metadata.uid) &&
        pod.status.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True"));
    }, { timeout: 90000 }).toBe(true);
    const afterRestart = (await ownedPods(page, lab, slot, name)).filter((pod) => !pod.metadata.deletionTimestamp);
    expect(afterRestart[0].metadata.ownerReferences[0].uid).not.toBe(beforeRestart[0].metadata.ownerReferences[0].uid);
    evidence.check("Restart reached new ReplicaSet/new Ready UID", { oldUIDs: beforeRestart.map((pod) => pod.metadata.uid), newUID: afterRestart[0].metadata.uid });
    await findResource(page, "Pod", afterRestart[0].metadata.name, afterRestart[0].metadata.uid);
    assertOwned(lab, slot, await getOwned(lab, slot, "Pod", afterRestart[0].metadata.name), afterRestart[0].metadata.uid);
    await confirmDelete(page, afterRestart[0].metadata.name);
    await expect.poll(async () => {
      const live = (await ownedPods(page, lab, slot, name)).filter((pod) => !pod.metadata.deletionTimestamp);
      return live.length === 1 && live[0].metadata.uid !== afterRestart[0].metadata.uid && live[0].status.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True");
    }, { timeout: 90000 }).toBe(true);
    evidence.check("Pod delete reached a controller replacement with distinct UID");
    await findResource(page, "Deployment", name, created.metadata.uid);
    await evidence.capture("ready-workload-after-actions");
    assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), created.metadata.uid);
    await confirmDelete(page, name);
    await expect.poll(async () => (await page.request.get(lab.baseURL + resourcePath(slot, created))).status(), { timeout: 45000 }).toBe(404);
    await expect(page.locator(".resource-details")).toContainText("Bu kaynak silindi");
    evidence.check("Deployment delete observed real API 404 and deleted old-UID panel");
  } catch (error) {
    primaryError = error;
    evidence.result.primaryFailure = { name: error.name, message: String(error.message).split(/\nCall log:/)[0] };
    try { await evidence.capture("workload-primary-failure-before-cleanup"); } catch {}
    throw error;
  } finally {
    if (created) {
      try { await teardown(page, lab, slot, created, evidence); }
      catch (error) {
        evidence.result.checks.push({ name: "Workload own cleanup", status: "FAIL", uid: created.metadata.uid,
          reason: String(error.message).split(/\nCall log:/)[0] });
        if (!primaryError) throw error;
      }
    }
  }
});

test("V11-13 filled real Node and Pod CPU/memory graphs expose source timestamp and units", async ({ page, lab, evidence }) => {
  test.setTimeout(240000);
  const slot = lab.slots.A;
  const fixture = await createFixture(lab, slot, {
    apiVersion: "v1", kind: "Pod", metadata: { name: `v11-metrics-${Date.now().toString(36)}`, namespace: slot.namespace,
      labels: { [lab.ownerKey]: lab.owner } },
    spec: { restartPolicy: "Never", containers: [{ name: "app", image: lab.fixtureImage,
      command: ["sh", "-c", "while true; do echo V11_METRICS_FIXTURE; sleep 1; done"],
      resources: { requests: { cpu: "10m", memory: "16Mi" }, limits: { cpu: "100m", memory: "64Mi" } } }] },
  });
  const appMetricResponses = [];
  const observeMetrics = async (response) => {
    if (new URL(response.url()).pathname !== "/api/metrics" || response.status() !== 200) return;
    try { appMetricResponses.push(await response.json()); } catch { /* Abort on scope close is not a metrics sample. */ }
  };
  page.on("response", observeMetrics);
  try {
  await page.goto(lab.baseURL);
  await chooseScope(page, lab.slots.A.context, lab.namespace);
  const query = new URLSearchParams({ context: lab.slots.A.context, namespace: lab.namespace });
  let metrics;
  await expect.poll(async () => {
    const response = await page.request.get(`${lab.baseURL}/api/metrics?${query}`);
    if (response.status() !== 200) return false;
    metrics = await response.json();
    const nodes = Array.isArray(metrics.nodes) ? metrics.nodes : metrics.nodes?.items || [];
    const pods = Array.isArray(metrics.pods) ? metrics.pods : metrics.pods?.items || [];
    return metrics.available !== false && nodes.length > 0 && pods.some((pod) => (pod.metadata?.name || pod.name) === fixture.metadata.name);
  }, { timeout: 90000, intervals: [1000, 2000] }).toBe(true);
  for (const [kind, samples] of [["Node", metrics.nodes], ["Pod", metrics.pods]]) {
    const values = Array.isArray(samples) ? samples : samples.items;
    const sample = kind === "Pod" ? values.find((pod) => (pod.metadata?.name || pod.name) === fixture.metadata.name) : values[0];
    const name = sample.metadata?.name || sample.name;
    expect(name).toBeTruthy();
    const details = await findResource(page, kind, name);
    await resourceTab(page, "Metrikler");
    const panel = details.locator(".metrics-panel");
    await expect(panel.getByRole("img", { name: /^CPU kullanımı zaman serisi; [1-9]\d* gerçek ölçüm$/ })).toBeVisible({ timeout: 30000 });
    await expect(panel.getByRole("img", { name: /^Bellek kullanımı zaman serisi; [1-9]\d* gerçek ölçüm$/ })).toBeVisible();
    await expect(panel.locator(".metric-source")).toContainText("metrics.k8s.io");
    await expect(panel.locator(".metric-source")).toContainText("Son ölçüm zamanı:");
    await expect(panel.locator(".metric-source")).toContainText(/\d{2}:\d{2}/);
    const chartText = await panel.innerText();
    expect(chartText).toMatch(/CPU|m\b|millicore/);
    expect(chartText).toMatch(/Mi|Gi/);
    expect(await panel.locator("svg circle title").allTextContents()).toEqual(expect.arrayContaining([expect.stringMatching(/ham değer: .* (CPU|byte)/)]));
    const wireSamples = appMetricResponses.flatMap((payload) => {
      const values = kind === "Node" ? payload.nodes : payload.pods;
      return (Array.isArray(values) ? values : values?.items || []).filter((value) => (value.metadata?.name || value.name) === name);
    });
    expect(wireSamples.length, "The actual app metrics HTTP response must contain this resource").toBeGreaterThan(0);
    const tooltips = await panel.locator("svg circle title").allTextContents();
    let matchingMeasurement;
    for (const measured of wireSamples) {
      const sourceContainers = kind === "Pod" ? measured.containers : [measured];
      const cpu = sourceContainers.reduce((sum, container) => sum + actualQuantity(container.usage.cpu), 0);
      const memory = sourceContainers.reduce((sum, container) => sum + actualQuantity(container.usage.memory), 0);
      const visibleValues = tooltips.map((text) => /ham değer:\s*([\d.eE+-]+)\s*(CPU|byte)/.exec(text)).filter(Boolean);
      const sameCPU = visibleValues.some((value) => value[2] === "CPU" && Math.abs(Number(value[1]) - cpu) <= Math.max(1e-12, Math.abs(cpu) * 1e-9));
      const sameMemory = visibleValues.some((value) => value[2] === "byte" && Number(value[1]) === memory);
      if (sameCPU && sameMemory) { matchingMeasurement = { cpuCore: cpu, memoryByte: memory, timestamp: measured.timestamp }; break; }
    }
    expect(matchingMeasurement, "Rendered CPU/core and memory/byte samples must match real metrics.k8s.io quantities").toBeTruthy();
    const formattedTimestamp = await page.evaluate((timestamp) => new Date(timestamp).toLocaleString("tr-TR"), matchingMeasurement.timestamp);
    expect(tooltips.some((text) => text.includes(formattedTimestamp))).toBe(true);
    evidence.check(`Filled actual ${kind} CPU and memory charts`, { name, sourceTimestamp: sample.timestamp || metrics.timestamp,
      matchedActualMeasurement: matchingMeasurement,
      cpuChart: await panel.getByRole("img", { name: /^CPU kullanımı/ }).getAttribute("aria-label"),
      memoryChart: await panel.getByRole("img", { name: /^Bellek kullanımı/ }).getAttribute("aria-label") });
    await evidence.capture(`${kind.toLowerCase()}-filled-real-metrics`);
  }
  } finally {
    page.off("response", observeMetrics);
    await teardown(page, lab, slot, fixture, evidence);
  }
});

test("V11-06 V11-10 finalizer holds the real old UID and same-name replacement needs explicit reselection", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium", "Finalizer lifecycle mutates once");
  const slot = lab.slots.A;
  const name = `v11-finalizer-${Date.now().toString(36)}`;
  const fixture = {
    apiVersion: "v1", kind: "Pod", metadata: { name, namespace: slot.namespace,
      labels: { [lab.ownerKey]: lab.owner }, finalizers: ["kubeview.io/v11-test-hold"] },
    spec: { restartPolicy: "Never", containers: [{ name: "app", image: lab.fixtureImage,
      command: ["sh", "-c", "echo V11_FINALIZER_OLD; sleep 1200"] }] },
  };
  let current = await createFixture(lab, slot, fixture);
  const oldUID = current.metadata.uid;
  try {
    await page.goto(lab.baseURL);
    await chooseScope(page, slot.context, slot.namespace);
    await enableManagement(page);
    await findResource(page, "Pod", name, oldUID);
    assertOwned(lab, slot, await getOwned(lab, slot, "Pod", name), oldUID);
    await confirmDelete(page, name);
    await expect.poll(async () => (await apiObject(page, lab, slot, "Pod", name)).metadata.deletionTimestamp).toBeTruthy();
    const terminating = await apiObject(page, lab, slot, "Pod", name);
    expect(terminating.metadata.uid).toBe(oldUID);
    expect(terminating.metadata.finalizers).toContain("kubeview.io/v11-test-hold");
    await expect(page.locator(".resource-details")).toContainText(/Terminating|Sonlandırılıyor/);
    evidence.check("Delete accepted while the exact old UID remains with own finalizer", { uid: oldUID });
    await evidence.capture("real-finalizer-held");
    await releaseOwnedFinalizer(lab, slot, current, page.request, await nonce(page, lab, slot));
    await expect.poll(async () => (await page.request.get(lab.baseURL + resourcePath(slot, current))).status(), { timeout: 45000 }).toBe(404);
    await expect(page.locator(".resource-details")).toContainText("Bu kaynak silindi");
    const replacement = { ...fixture, metadata: { ...fixture.metadata, finalizers: [] },
      spec: { ...fixture.spec, containers: [{ ...fixture.spec.containers[0], command: ["sh", "-c", "echo V11_FINALIZER_NEW; sleep 1200"] }] } };
    current = await createFixture(lab, slot, replacement);
    expect(current.metadata.uid).not.toBe(oldUID);
    await expect(page.locator(".resource-details")).toContainText("Bu kaynak silindi");
    await expect(page.locator(".resource-details")).not.toContainText(current.metadata.uid);
    await findResource(page, "Pod", name, current.metadata.uid);
    evidence.check("Same-name new UID remained separate from deleted old selection", { oldUID, newUID: current.metadata.uid });
    await evidence.capture("replacement-explicitly-reselected");
  } finally {
    await chooseScope(page, slot.context, slot.namespace);
    await enableManagement(page);
    await releaseOwnedFinalizer(lab, slot, current, page.request, await nonce(page, lab, slot));
    await teardown(page, lab, slot, current, evidence);
  }
});

test("V11-16 normal finder/form keyboard, viewport and reduced-motion preserve the single full canvas", async ({ page, lab, evidence }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(lab.baseURL);
  await chooseScope(page, lab.slots.A.context, lab.namespace);
  await expect(page.locator("canvas")).toHaveCount(1);
  for (const width of [768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "Bul", exact: true }).click();
    const finder = page.getByRole("dialog", { name: "Dünyada bul", exact: true });
    const input = finder.getByLabel("Nesne veya kaynak ara", { exact: true });
    await input.fill("v11");
    await input.press("End");
    const before = await cameraPose(page);
    expect(before).toHaveLength(3);
    await input.press("ArrowLeft");
    await input.press("ArrowDown");
    expect(poseDistance(before, await cameraPose(page))).toBeLessThan(0.01);
    await input.press("Escape");
    await expect(finder).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Bul", exact: true })).toBeFocused();
    const size = await page.locator("canvas").evaluate((canvas) => ({ width: canvas.clientWidth, height: canvas.clientHeight }));
    expect(size).toEqual({ width, height: 900 });
    evidence.check(`Viewport ${width}: finder arrows isolated, focus restored, full-size single canvas`);
    await evidence.capture(`viewport-${width}-reduced-motion`);
  }
});
