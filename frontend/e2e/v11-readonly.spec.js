import { test, expect } from "./v11-fixtures.js";
import { guardScope, resourcePath } from "./v11-lab.mjs";
import { chooseScope, findFacility, closePanels } from "./v11-ui.helpers.js";

test("V11-11 explicit readonly production gateway normal UI cannot enable writes or create a real object", async ({ page, lab, evidence }, info) => {
  test.skip(process.env.KV_V11_READONLY_GATE !== "1" || info.project.name !== "chromium",
    "BLOCKED: requires explicit KV_V11_READONLY_GATE=1 and the separate root-owned readonly production configuration; the ordinary18410 suite is not this test");
  test.setTimeout(90000);
  expect(lab.baseURL, "Use the explicitly allocated separate root readonly gateway").toBe("http://127.0.0.1:18414");
  const slot = lab.slots.A, name = `v11-server-readonly-${Date.now().toString(36)}`;
  evidence.result.command = `KV_V11_READONLY_GATE=1 KV_V11_CONFIG_FILE=/private/qa-config-readonly.env ${evidence.result.command}`;
  evidence.result.limits.push("Gateway18414 belongs to root and is stopped by root; QA does not stop or reconfigure it");
  await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace, { close: false });
  const dialog = page.getByRole("dialog", { name: "Bağlantı ve kapsam", exact: true });
  await expect(dialog).toContainText("Salt okunur");
  await expect(dialog).toContainText("Sunucu salt okunur yapılandırılmış; yönetim modu bu sunucuda açılamaz.");
  await expect(dialog.getByRole("button", { name: "Yönetim modunu aç", exact: true })).toBeDisabled();
  const query = new URLSearchParams({ context: slot.context, namespace: slot.namespace });
  const status = await page.request.get(`${lab.baseURL}/api/connection?${query}`); expect(status.status()).toBe(200);
  const connection = await status.json();
  expect(connection.serverReadOnly).toBe(true); expect(connection.readOnly).toBe(true);
  expect(connection.managementAvailable).toBe(false); expect(connection.managementEnabled).toBe(false);
  await evidence.capture("actual-readonly-server-normal-connection-ui");
  await closePanels(page); await findFacility(page);
  await page.getByRole("button", { name: "Uygulama oluştur", exact: true }).click();
  const form = page.locator(".resource-form-dialog");
  await expect(form).toContainText("Salt okunur bağlantı.");
  await form.getByLabel("Kaynak adı", { exact: true }).fill(name);
  await form.getByLabel("Ana container image", { exact: false }).fill(lab.image);
  await expect(form.getByRole("button", { name: "Server dry-run", exact: true })).toBeDisabled();
  await expect(form.getByRole("button", { name: "Oluştur", exact: true })).toBeDisabled();
  evidence.check("Actual server READ_ONLY=true is displayed and normal form/dry-run cannot submit writes");
  await evidence.capture("actual-readonly-normal-create-form-disabled");

  await guardScope(lab, slot);
  const enabled = await page.request.post(`${lab.baseURL}/api/management?${query}`, {
    headers: { "X-KubeView-Connection": connection.connectionID },
    data: { enabled: true, context: slot.context, namespace: slot.namespace, connectionID: connection.connectionID },
  });
  expect(enabled.status()).toBe(403);
  const object = { apiVersion: "v1", kind: "ConfigMap", metadata: { name, namespace: slot.namespace,
    labels: { [lab.ownerKey]: lab.owner } }, data: { fixture: "synthetic-readonly-negative" } };
  const path = lab.baseURL + resourcePath(slot, object);
  expect((await page.request.get(path)).status()).toBe(404);
  await guardScope(lab, slot);
  const denied = await page.request.post(path, { headers: { "X-KubeView-Connection": connection.connectionID }, data: { object } });
  expect(denied.status()).toBe(403);
  expect((await page.request.get(path)).status()).toBe(404);
  evidence.check("Actual readonly production management403 and direct valid ConfigMap create403 leave GET404", {
    managementHTTP: enabled.status(), createHTTP: denied.status(), nonceRecorded: false, objectCreated: false });
  await page.goto(lab.baseURL);
});
