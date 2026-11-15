import YAML from "yaml";
import { test, expect } from "./v11-fixtures.js";
import { guardScope, resourcePath, assertOwned, cleanupOwned } from "./v11-lab.mjs";
import { chooseScope, enableManagement, findFacility } from "./v11-ui.helpers.js";

test("V11-04 V11-07 actual restricted identity cannot preview or create Deployment after explicit management intent", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium" || !lab.restrictedContext, "Explicit owned restricted identity required; run the actual RBAC negative once");
  test.setTimeout(120000);
  const admin = lab.slots.A, reader = { ...admin, context: lab.restrictedContext }, name = `v11-rbac-denied-${Date.now().toString(36)}`;
  const object = { apiVersion: "apps/v1", kind: "Deployment", metadata: { name, namespace: admin.namespace,
    labels: { [lab.ownerKey]: lab.owner } }, spec: { replicas: 0, selector: { matchLabels: { app: name } },
    template: { metadata: { labels: { app: name, [lab.ownerKey]: lab.owner } }, spec: { containers: [{ name: "app", image: lab.image }] } } } };
  const path = lab.baseURL + resourcePath(reader, object), adminPath = lab.baseURL + resourcePath(admin, object);
  try {
    await guardScope(lab, admin);
    await page.goto(lab.baseURL); await chooseScope(page, reader.context, reader.namespace); await enableManagement(page);
    const query = new URLSearchParams({ context: reader.context, namespace: reader.namespace });
    const diagnostic = await page.request.get(`${lab.baseURL}/api/connection?${query}`); expect(diagnostic.status()).toBe(200);
    const connection = await diagnostic.json();
    expect(connection.serverReadOnly).toBe(false); expect(connection.readOnly).toBe(false); expect(connection.managementEnabled).toBe(true);
    expect((await page.request.get(path)).status()).toBe(404);
    await findFacility(page); await page.getByRole("button", { name: "Uygulama oluştur", exact: true }).click();
    const form = page.locator(".resource-form-dialog");
    await form.getByRole("button", { name: "YAML", exact: true }).click();
    await form.getByLabel("Kaynak YAML", { exact: true }).fill(YAML.stringify(object));
    const preview = page.waitForResponse((response) => {
      if (new URL(response.url()).pathname !== "/api/resources" || response.request().method() !== "POST") return false;
      try { const body = response.request().postDataJSON(); return body.object?.metadata?.name === name && body.dryRun === true; }
      catch { return false; }
    });
    await guardScope(lab, admin); await form.getByRole("button", { name: "Server dry-run", exact: true }).click();
    expect((await preview).status()).toBe(403);
    await expect(form.getByRole("alert")).toContainText(/forbidden|yetki|izin|reddedildi/i);
    await expect(form.locator(".dry-run-preview")).toHaveCount(0);
    await expect(form.getByRole("button", { name: "Oluştur", exact: true })).toBeDisabled();
    expect((await page.request.get(path)).status()).toBe(404);
    evidence.check("Normal UI real RBAC preview403 is distinct from readonly server or missing management intent", {
      serverReadOnly: false, managementEnabled: true, restrictedContext: reader.context, httpStatus: 403 });
    await evidence.capture("actual-rbac-preview-forbidden-normal-form");
    await guardScope(lab, admin);
    const denied = await page.request.post(path, { headers: { "X-KubeView-Connection": connection.connectionID }, data: { object } });
    expect(denied.status()).toBe(403);
    expect((await page.request.get(path)).status()).toBe(404);
    evidence.check("Direct actual restricted-identity Deployment create403 leaves GET404 with scoped grant enabled", { nonceRecorded: false });
  } finally {
    // A failing permission invariant must not strand a resource if the wrong
    // credential were accidentally selected. Admin cleanup remains UID/owner guarded.
    await page.goto(lab.baseURL);
    const remaining = await page.request.get(adminPath);
    if (remaining.status() === 404) evidence.check("Actual RBAC negative Deployment remains absent404; no fixture cleanup needed");
    else {
      expect(remaining.status()).toBe(200); const value = assertOwned(lab, admin, await remaining.json());
      await chooseScope(page, admin.context, admin.namespace); await enableManagement(page);
      const status = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: admin.context, namespace: admin.namespace })}`);
      expect(status.status()).toBe(200);
      evidence.check("Unexpected owned permission-negative object guarded cleanup", await cleanupOwned(lab, admin, value, page.request, (await status.json()).connectionID));
    }
  }
});
