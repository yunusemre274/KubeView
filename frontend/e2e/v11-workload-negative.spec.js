import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { test, expect } from "./v11-fixtures.js";
import { guardScope, assertOwned, getOwned, cleanupOwned, resourcePath } from "./v11-lab.mjs";
import { chooseScope, enableManagement, findFacility, findResource, resourceTab } from "./v11-ui.helpers.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("V11-07 normal UI actual unschedulable image-pull quota-admission and discarded context draft stay truthful", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium", "One bounded real negative-workload operation group");
  test.setTimeout(420000);
  const slot = lab.slots.A, suffix = Date.now().toString(36), created = [];
  const resumeFromImage = process.env.KV_V11_NEGATIVE_FROM === "image";
  let quota;
  const objectURL = (name) => lab.baseURL + resourcePath(slot, { kind: "Deployment", metadata: { name } });
  const quotaURL = `${lab.baseURL}/api/resources?${new URLSearchParams({ context: slot.context, namespace: slot.namespace,
    version: "v1", resource: "resourcequotas", name: `v11-quota-${suffix}` })}`;
  const list = async (resource) => {
    const response = await page.request.get(`${lab.baseURL}/api/resources?${new URLSearchParams({ context: slot.context,
      namespace: resource === "nodes" ? "" : slot.namespace, version: "v1",
      group: resource === "deployments" ? "apps" : "", resource })}`);
    expect(response.status()).toBe(200); return (await response.json()).items;
  };
  const connectionNonce = async () => {
    const response = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
    expect(response.status()).toBe(200); return (await response.json()).connectionID;
  };
  const deleteQuota = async () => {
    if (!quota) return;
    await guardScope(lab, slot);
    const current = await page.request.get(quotaURL);
    if (current.status() !== 404) {
      expect(current.status()).toBe(200); const value = await current.json();
      expect(value.kind).toBe("ResourceQuota"); expect(value.metadata.uid).toBe(quota.metadata.uid);
      expect(value.metadata.namespace).toBe(slot.namespace); expect(value.metadata.labels[lab.ownerKey]).toBe(lab.owner);
      await guardScope(lab, slot);
      const removed = await page.request.delete(quotaURL, { headers: { "X-KubeView-Connection": await connectionNonce() },
        data: { uid: value.metadata.uid, resourceVersion: value.metadata.resourceVersion } });
      expect([200, 202, 404]).toContain(removed.status());
      await expect.poll(async () => (await page.request.get(quotaURL)).status(), { timeout: 30000 }).toBe(404);
    }
    evidence.check("Exact owned admission-quota cleanup observed404", { uid: quota.metadata.uid }); quota = null;
  };
  const closeDraft = async () => {
    const form = page.locator(".resource-form-dialog");
    if (!(await form.isVisible())) return;
    await form.getByRole("button", { name: "Formu kapat", exact: true }).click();
    const discard = form.getByRole("button", { name: "Taslağı bırak ve kapat", exact: true });
    if (await discard.isVisible()) await discard.click();
    await expect(form).toHaveCount(0);
  };
  const manifest = (name, target, { badImage = false, replicas = 1 } = {}) => ({
    apiVersion: "apps/v1", kind: "Deployment", metadata: { name, namespace: slot.namespace, labels: { [lab.ownerKey]: lab.owner } },
    spec: { replicas, selector: { matchLabels: { app: name } }, template: {
      metadata: { labels: { app: name, [lab.ownerKey]: lab.owner } }, spec: {
        terminationGracePeriodSeconds: 1,
        ...(target ? { affinity: { nodeAffinity: { requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [{ matchFields: [{ key: "metadata.name", operator: "In", values: [target] }] }],
        } } } } : {}),
        containers: [{ name: "app", image: badImage ? `registry.invalid/kubeview/v11-never:${suffix}` : lab.fixtureImage,
          imagePullPolicy: badImage ? "Always" : "IfNotPresent", command: ["sh", "-c", "sleep 1200"],
          resources: { requests: { cpu: "5m", memory: "8Mi" }, limits: { cpu: "100m", memory: "32Mi" } } }],
      },
    } },
  });
  const responseFor = (name, dryRun) => page.waitForResponse((response) => {
    if (new URL(response.url()).pathname !== "/api/resources" || response.request().method() !== "POST") return false;
    try { const body = response.request().postDataJSON(); return body.object?.metadata?.name === name && body.dryRun === dryRun; }
    catch { return false; }
  });
  const preview = async (object) => {
    await findFacility(page); await page.getByRole("button", { name: "Uygulama oluştur", exact: true }).click();
    const form = page.locator(".resource-form-dialog");
    await form.getByRole("button", { name: "YAML", exact: true }).click();
    await form.getByLabel("Kaynak YAML", { exact: true }).fill(YAML.stringify(object));
    await guardScope(lab, slot);
    const pending = responseFor(object.metadata.name, true);
    await form.getByRole("button", { name: "Server dry-run", exact: true }).click();
    expect((await pending).status()).toBe(201);
    await expect(form.locator(".dry-run-preview")).toContainText("Server dry-run başarılı.");
    expect((await page.request.get(objectURL(object.metadata.name))).status()).toBe(404);
    evidence.check("Normal UI real server dry-run leaves negative/draft Deployment absent", { name: object.metadata.name });
    return form;
  };
  const create = async (object) => {
    const form = await preview(object); await guardScope(lab, slot);
    const pending = responseFor(object.metadata.name, false);
    await form.getByRole("button", { name: "Oluştur", exact: true }).click();
    const accepted = await pending; expect(accepted.status()).toBe(201); await expect(form).toHaveCount(0);
    const value = assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", object.metadata.name));
    created.push(value); return value;
  };
  try {
    await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
    const nodes = await list("nodes"), absentTarget = `kv-v11-absent-${suffix}`;
    expect(nodes.some((value) => value.metadata.name === absentTarget)).toBe(false);
    const usableNode = nodes.find((value) => !value.spec?.unschedulable &&
      !value.spec?.taints?.some((taint) => ["NoSchedule", "NoExecute"].includes(taint.effect)) &&
      value.status.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True"));
    expect(usableNode?.metadata.uid).toBeTruthy();
    if (resumeFromImage) {
      const priorPath = "runs/2026-11-09T08-25-10-609Z-chromium-cea91338/result.json";
      const prior = JSON.parse(await fs.readFile(path.join(root, "artifacts/v1.1.0/v11-20261108/qa", priorPath), "utf8"));
      expect(prior.sourceStart.sourceSHA256).toBe(evidence.result.sourceStart.sourceSHA256);
      expect(prior.sourceStart.build.backendBinarySHA256).toBe(evidence.result.sourceStart.build.backendBinarySHA256);
      expect(prior.checks.some((check) => check.status === "PASS" && check.name.startsWith("Real scheduler reports Pending/Unschedulable"))).toBe(true);
      evidence.result.command = `KV_V11_NEGATIVE_FROM=image ${evidence.result.command}`;
      evidence.result.priorSubcheckReuse = { path: priorPath, subcheck: "Actual Pending/Unschedulable API and normal UI",
        productSourceAndBinaryEqual: true, limit: "Immutable compound attempt remains FAIL; only its completed subcheck is reused" };
      evidence.check("Prior real Unschedulable subcheck preserved on identical product source/binary; no blind recreate");
    } else {
      const unsched = await create(manifest(`v11-unsched-${suffix}`, absentTarget));
      let unscheduled;
      await expect.poll(async () => {
        unscheduled = (await list("pods")).find((value) => value.metadata.labels?.app === unsched.metadata.name &&
          value.status.phase === "Pending" && !value.spec.nodeName && value.status.conditions?.some((condition) =>
            condition.type === "PodScheduled" && condition.status === "False" && condition.reason === "Unschedulable"));
        return Boolean(unscheduled);
      }, { timeout: 45000 }).toBe(true);
      assertOwned(lab, slot, unscheduled);
      await findResource(page, "Pod", unscheduled.metadata.name, unscheduled.metadata.uid);
      await expect(page.locator(".resource-details")).toContainText("Unschedulable");
      evidence.check("Real scheduler reports Pending/Unschedulable without inventing Node placement or Ready", {
        deploymentUID: unsched.metadata.uid, podUID: unscheduled.metadata.uid, absentTarget, assignedNode: unscheduled.spec.nodeName || null });
      await evidence.capture("actual-no-eligible-node-pending");
    }

    const badImage = await create(manifest(`v11-bad-image-${suffix}`, usableNode.metadata.name, { badImage: true }));
    let imagePod;
    await expect.poll(async () => {
      imagePod = (await list("pods")).find((value) => value.metadata.labels?.app === badImage.metadata.name &&
        value.status.containerStatuses?.some((status) => ["ErrImagePull", "ImagePullBackOff"].includes(status.state?.waiting?.reason)));
      return Boolean(imagePod);
    }, { timeout: 90000 }).toBe(true);
    assertOwned(lab, slot, imagePod); expect(imagePod.spec.nodeName).toBe(usableNode.metadata.name);
    expect(imagePod.status.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True")).not.toBe(true);
    expect((await list("nodes")).find((node) => node.metadata.name === usableNode.metadata.name)?.metadata.uid).toBe(usableNode.metadata.uid);
    await findResource(page, "Pod", imagePod.metadata.name, imagePod.metadata.uid); await resourceTab(page, "Container’lar");
    await expect(page.locator(".resource-details")).toContainText(/ErrImagePull|ImagePullBackOff/);
    evidence.check("Real invalid image remains non-Ready with truthful waiting reason on the same actual Node UID", {
      deploymentUID: badImage.metadata.uid, podUID: imagePod.metadata.uid, nodeUID: usableNode.metadata.uid, nodeName: imagePod.spec.nodeName });
    await evidence.capture("actual-invalid-image-waiting-reason");

    const rejected = manifest(`v11-quota-denied-${suffix}`, null, { replicas: 0 }), form = await preview(rejected);
    const count = (await list("deployments")).length;
    await guardScope(lab, slot);
    quota = await new Promise((resolve, reject) => {
      const child = execFile("kubectl", ["--kubeconfig", lab.kubeconfig, "--context", slot.context, "--request-timeout=10s",
        "create", "-f", "-", "-o", "json"], { timeout: 20000, maxBuffer: 2 << 20 }, (error, stdout) => {
          if (error) reject(new Error("Owned admission-quota fixture creation failed")); else resolve(JSON.parse(stdout));
        });
      child.stdin.end(JSON.stringify({ apiVersion: "v1", kind: "ResourceQuota", metadata: { name: `v11-quota-${suffix}`,
        namespace: slot.namespace, labels: { [lab.ownerKey]: lab.owner } }, spec: { hard: { "count/deployments.apps": String(count) } } }));
    });
    expect(quota.metadata.namespace).toBe(slot.namespace); expect(quota.metadata.labels[lab.ownerKey]).toBe(lab.owner);
    expect(quota.metadata.uid).toBeTruthy(); expect(quota.metadata.resourceVersion).toBeTruthy();
    await fs.appendFile(path.join(root, "artifacts/v1.1.0/v11-20261108/qa/fixture-registry.jsonl"), `${JSON.stringify({
      at: new Date().toISOString(), context: slot.context, clusterUID: slot.clusterUID, namespace: slot.namespace,
      namespaceUID: slot.namespaceUID, owner: lab.owner, kind: quota.kind, name: quota.metadata.name,
      uid: quota.metadata.uid, resourceVersion: quota.metadata.resourceVersion })}\n`);
    await expect.poll(async () => {
      const response = await page.request.get(quotaURL); if (response.status() !== 200) return false;
      const value = await response.json(); return value.metadata.uid === quota.metadata.uid &&
        Number(value.status?.hard?.["count/deployments.apps"]) === count && Number(value.status?.used?.["count/deployments.apps"]) === count;
    }, { timeout: 30000 }).toBe(true);
    const refused = responseFor(rejected.metadata.name, false); await guardScope(lab, slot);
    await form.getByRole("button", { name: "Oluştur", exact: true }).click(); expect((await refused).status()).toBe(403);
    await expect(form.getByRole("alert")).toContainText(/quota|kota/i);
    expect((await page.request.get(objectURL(rejected.metadata.name))).status()).toBe(404);
    evidence.check("Real quota admission403 after a successful server preview leaves no stored Deployment", { quotaUID: quota.metadata.uid });
    await evidence.capture("actual-quota-refuses-after-server-preview");
    await closeDraft(); await deleteQuota();

    const cancelled = manifest(`v11-unsent-${suffix}`, null, { replicas: 0 }); await preview(cancelled); await closeDraft();
    await chooseScope(page, lab.slots.B.context, lab.slots.B.namespace, { close: false });
    await expect(page.locator(".connection-window")).toContainText("Salt okunur");
    expect((await page.request.get(objectURL(cancelled.metadata.name))).status()).toBe(404);
    const inB = lab.baseURL + resourcePath(lab.slots.B, cancelled);
    expect((await page.request.get(inB)).status()).toBe(404);
    const stillAccepted = await page.request.get(objectURL(badImage.metadata.name)); expect(stillAccepted.status()).toBe(200);
    expect((await stillAccepted.json()).metadata.uid).toBe(badImage.metadata.uid);
    evidence.check("Explicit unsent draft discard plus real context switch creates nothing; accepted A workload remains real", {
      acceptedUID: badImage.metadata.uid, draftName: cancelled.metadata.name,
      limit: "No accepted Kubernetes operation was cancelled; no fabricated in-flight response race is claimed" });
    await evidence.capture("unsent-draft-discarded-context-b-readonly");
  } catch (error) {
    try { await evidence.capture("negative-workload-failure-before-cleanup"); } catch { /* A closed page cannot provide a capture. */ }
    throw error;
  } finally {
    await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
    await deleteQuota();
    const currentNonce = await connectionNonce();
    for (const object of created.reverse()) evidence.check("Owned negative Deployment cleanup", await cleanupOwned(lab, slot, object, page.request, currentNonce));
    await expect.poll(async () => (await list("pods")).filter((pod) => created.some((object) =>
      pod.metadata.labels?.app === object.metadata.name)).length, { timeout: 60000 }).toBe(0);
    evidence.check("Actual owned negative-workload child Pods are absent after controller cleanup");
  }
});
