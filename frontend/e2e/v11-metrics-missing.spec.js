import { execFile } from "node:child_process";
import { test, expect } from "./v11-fixtures.js";
import { createFixture, guardScope, cleanupOwned } from "./v11-lab.mjs";
import { chooseScope, enableManagement, findResource, resourceTab } from "./v11-ui.helpers.js";

test("V11-13 reachable owned cluster with actual missing Metrics API shows empty Node and Pod charts", async ({ page, lab, evidence }) => {
  test.setTimeout(180000);
  const slot = lab.slots.B;
  await guardScope(lab, slot);
  const registrations = await new Promise((resolve, reject) => {
    execFile("kubectl", ["--kubeconfig", lab.kubeconfig, "--context", slot.context, "--request-timeout=10s",
      "get", "apiservices", "-o", "json"], { timeout: 20000, maxBuffer: 2 << 20 }, (error, stdout) => {
      if (error) reject(new Error("Owned Metrics API registration lookup failed"));
      else resolve(JSON.parse(stdout).items);
    });
  });
  test.skip(registrations.some((value) => value.spec.group === "metrics.k8s.io"),
    "BLOCKED: this owned reachable cluster currently has a registered Metrics API; do not remove an addon to force absence");
  evidence.check("Actual owned B APIService inventory has no metrics.k8s.io registration", { clusterUID: slot.clusterUID });
  const fixture = await createFixture(lab, slot, {
    apiVersion: "v1", kind: "Pod", metadata: { name: `v11-no-metrics-${Date.now().toString(36)}`, namespace: slot.namespace,
      labels: { [lab.ownerKey]: lab.owner } },
    spec: { restartPolicy: "Never", containers: [{ name: "app", image: lab.fixtureImage,
      command: ["sh", "-c", "echo V11_ACTUAL_NO_METRICS_PROVIDER; sleep 1200"],
      resources: { requests: { cpu: "10m", memory: "16Mi" }, limits: { cpu: "100m", memory: "64Mi" } } }] },
  });
  try {
    await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace);
    const scope = new URLSearchParams({ context: slot.context, namespace: slot.namespace });
    const diagnostic = await page.request.get(`${lab.baseURL}/api/connection?${scope}`); expect(diagnostic.status()).toBe(200);
    const state = await diagnostic.json(); expect(state.checks.api.status).toBe("ok"); expect(state.checks.metrics.status).toBe("unavailable");
    const actual = await page.request.get(`${lab.baseURL}/api/metrics?${scope}`); expect(actual.status()).toBe(200);
    const metrics = await actual.json(); expect(metrics.available).toBe(false); expect(metrics.source).toBe("metrics.k8s.io");
    expect(metrics.nodes).toHaveLength(0); expect(metrics.pods).toHaveLength(0);
    const query = new URLSearchParams({ context: slot.context, version: "v1", resource: "nodes" });
    const nodeResponse = await page.request.get(`${lab.baseURL}/api/resources?${query}`); expect(nodeResponse.status()).toBe(200);
    const node = (await nodeResponse.json()).items[0]; expect(node?.metadata?.uid).toBeTruthy();
    for (const resource of [node, fixture]) {
      const details = await findResource(page, resource.kind, resource.metadata.name, resource.metadata.uid);
      await resourceTab(page, "Metrikler");
      const panel = details.locator(".metrics-panel");
      await expect(panel).toContainText("Metrik alınamıyor", { timeout: 30000 });
      await expect(panel.getByRole("img", { name: /kullanımı zaman serisi/ })).toHaveCount(0);
      await expect(panel.locator(".metric-charts svg circle title")).toHaveCount(0);
      await expect(panel.locator(".chart-empty")).toHaveCount(2);
      await expect(panel.locator(".metric-source")).toContainText("Ölçüm yok");
      evidence.check(`Actual missing-provider ${resource.kind} panel has no fabricated zero usage series`, {
        clusterUID: slot.clusterUID, uid: resource.metadata.uid, apiReachable: true, metricsRegistered: false });
      await evidence.capture(`${resource.kind.toLowerCase()}-actual-metrics-provider-absent`);
    }
  } finally {
    await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
    const status = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
    expect(status.status()).toBe(200);
    const result = await cleanupOwned(lab, slot, fixture, page.request, (await status.json()).connectionID);
    evidence.check("Actual-missing-metrics owned Pod cleanup observed404", result);
  }
});
