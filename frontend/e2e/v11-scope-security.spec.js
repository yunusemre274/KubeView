import { test, expect } from "./v11-fixtures.js";
import { createFixture, getOwned, guardScope, cleanupOwned, resourcePath } from "./v11-lab.mjs";
import { chooseScope, openConnection, closePanels, findResource, enableManagement, resourceTab } from "./v11-ui.helpers.js";

test("V11-11 initial read-only, absent/stale nonce and hostile Origin cannot mutate the real lab", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium", "HTTP security assertions run once");
  const slot = lab.slots.A;
  await page.goto(lab.baseURL);
  await chooseScope(page, slot.context, slot.namespace, { close: false });
  await expect(page.locator(".connection-window")).toContainText("Salt okunur");
  const status = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
  expect(status.status()).toBe(200);
  const connection = await status.json();
  expect(connection.readOnly).toBe(true);
  expect(connection.managementEnabled).toBe(false);
  const object = { apiVersion: "v1", kind: "ConfigMap", metadata: { name: `v11-denied-${Date.now().toString(36)}`,
    namespace: slot.namespace, labels: { [lab.ownerKey]: lab.owner } }, data: { fixture: "synthetic" } };
  const path = lab.baseURL + resourcePath(slot, object);
  const denied = [
    { name: "missing nonce", headers: {}, expected: 403 },
    { name: "management not enabled", headers: { "X-KubeView-Connection": connection.connectionID }, expected: 403 },
    { name: "hostile Origin", headers: { Origin: "https://attacker.invalid", "X-KubeView-Connection": connection.connectionID }, expected: 403 },
    { name: "cross-site fetch", headers: { "Sec-Fetch-Site": "cross-site", "X-KubeView-Connection": connection.connectionID }, expected: 403 },
  ];
  for (const attack of denied) {
    await guardScope(lab, slot);
    const response = await page.request.post(path, { headers: attack.headers, data: { object } });
    expect(response.status(), attack.name).toBe(attack.expected);
    expect((await page.request.get(path)).status()).toBe(404);
    evidence.check(`Rejected ${attack.name}; real object remains absent`, { httpStatus: response.status() });
  }
  const foreignRead = await page.request.get(`${lab.baseURL}/api/contexts`, { headers: { Origin: "https://attacker.invalid" } });
  expect(foreignRead.status()).toBe(403);
  const contexts = await page.request.get(`${lab.baseURL}/api/contexts`);
  expect(contexts.status()).toBe(200);
  const safeMetadata = await contexts.json();
  const exported = JSON.stringify(safeMetadata);
  expect(exported).not.toMatch(/client-key-data|client-certificate-data|certificate-authority-data|access-token|refresh-token|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/);
  await closePanels(page);
  await enableManagement(page);
  const enabled = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
  const enabledConnection = await enabled.json();
  expect(enabledConnection.managementEnabled).toBe(true);
  await chooseScope(page, lab.slots.B.context, lab.namespace);
  await guardScope(lab, slot);
  const stale = await page.request.post(path, { headers: { "X-KubeView-Connection": enabledConnection.connectionID }, data: { object } });
  expect(stale.status()).toBe(409);
  expect((await page.request.get(path)).status()).toBe(404);
  evidence.check("Old A management nonce rejected after B intent", { httpStatus: stale.status() });
  await evidence.capture("fresh-context-read-only-security");
});

test("V11-04 V11-13 restricted operator manually enters permitted namespace without Namespace/Node/metrics LIST", async ({ page, lab, evidence }) => {
  test.skip(!lab.restrictedContext, "BLOCKED: explicit restricted context has not been provisioned");
  const slot = lab.slots.A;
  const fixture = await createFixture(lab, slot, {
    apiVersion: "v1", kind: "Pod", metadata: { name: `v11-restricted-${Date.now().toString(36)}`, namespace: slot.namespace,
      labels: { [lab.ownerKey]: lab.owner } },
    spec: { restartPolicy: "Never", containers: [{ name: "app", image: lab.fixtureImage,
      command: ["sh", "-c", "echo V11_RESTRICTED_SCOPE; sleep 1200"] }] },
  });
  try {
    await page.goto(lab.baseURL);
    await chooseScope(page, lab.restrictedContext, lab.namespace);
    await findResource(page, "Pod", fixture.metadata.name, fixture.metadata.uid);
    await resourceTab(page, "Metrikler");
    const metricPanel = page.locator(".resource-details .metrics-panel");
    await expect(metricPanel).toContainText("Metrik alınamıyor", { timeout: 30000 });
    await expect(metricPanel.getByRole("img", { name: /kullanımı zaman serisi/ })).toHaveCount(0);
    await expect(metricPanel.locator(".metric-charts svg circle title")).toHaveCount(0);
    evidence.check("Restricted metrics API did not fabricate a zero series or retain previous scope samples");
    for (const resource of ["nodes", "namespaces"]) {
      const query = new URLSearchParams({ context: lab.restrictedContext, version: "v1", resource });
      expect((await page.request.get(`${lab.baseURL}/api/resources?${query}`)).status()).toBe(403);
    }
    const outside = new URLSearchParams({ context: lab.restrictedContext, namespace: "kube-system", version: "v1", resource: "pods" });
    expect((await page.request.get(`${lab.baseURL}/api/resources?${outside}`)).status()).toBe(403);
    await closePanels(page);
    await page.getByRole("button", { name: "Bul", exact: true }).click();
    const finder = page.getByRole("dialog", { name: "Dünyada bul", exact: true });
    await finder.getByLabel("Nesne veya kaynak ara", { exact: true }).fill("");
    await expect(finder.locator(".finder-result").filter({ hasText: /Node · Küme kapsamı/ })).toHaveCount(0);
    evidence.check("Real namespaced Pod accessible; Node/Namespace LIST and other namespace forbidden", { uid: fixture.metadata.uid });
    await evidence.capture("restricted-manual-namespace");
  } finally {
    await chooseScope(page, slot.context, slot.namespace);
    await enableManagement(page);
    const response = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
    const cleanup = await cleanupOwned(lab, slot, fixture, page.request, (await response.json()).connectionID);
    evidence.check("Restricted fixture own cleanup", cleanup);
  }
});

test("V11-05 empty scope and unreachable context stay distinct from explicitly selected Demo", async ({ page, lab, evidence }) => {
  test.skip(!lab.emptyNamespace || !lab.emptyNamespaceUID || !lab.unavailableContext,
    "BLOCKED: empty owned namespace and intentionally unavailable trusted context are required");
  await page.goto(lab.baseURL);
  const emptySlot = { ...lab.slots.A, namespace: lab.emptyNamespace, namespaceUID: lab.emptyNamespaceUID };
  await guardScope(lab, emptySlot);
  const query = new URLSearchParams({ context: emptySlot.context, namespace: emptySlot.namespace, version: "v1", resource: "pods" });
  const pods = await page.request.get(`${lab.baseURL}/api/resources?${query}`);
  expect(pods.status()).toBe(200);
  expect((await pods.json()).items).toHaveLength(0);
  await chooseScope(page, emptySlot.context, emptySlot.namespace);
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  const finder = page.getByRole("dialog", { name: "Dünyada bul", exact: true });
  await finder.getByLabel("Bulucu kaynak türü", { exact: true }).selectOption("Pod");
  await expect(finder.locator(".finder-result")).toHaveCount(0);
  await expect(finder).toContainText("Bu kapsamda eşleşme yok");
  await evidence.capture("actual-empty-pod-scope");
  const dialog = await openConnection(page);
  await dialog.getByLabel("Cluster / context", { exact: true }).selectOption(lab.unavailableContext);
  await expect(dialog).toContainText(/erişilemiyor|ulaşılamıyor|Doğrulanamadı|kullanılamıyor/, { timeout: 30000 });
  await expect(page.locator(".world-brand-control")).not.toContainText("Demo");
  await evidence.capture("unavailable-context-no-demo-fallback");
  await dialog.getByLabel("Cluster / context", { exact: true }).selectOption("__demo__");
  await expect(page.locator(".world-brand-control")).toContainText("Demo");
  await expect(dialog).toContainText("Örnek veri");
  await closePanels(page);
  evidence.check("Zero real Pods, connection failure and explicit Demo remained separate");
  await evidence.capture("explicit-demo-only");
});
