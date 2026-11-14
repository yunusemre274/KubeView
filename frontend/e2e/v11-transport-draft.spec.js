import { test, expect } from "./v11-fixtures.js";
import { createFixture, assertOwned, getOwned, resourcePath, cleanupOwned, guardScope } from "./v11-lab.mjs";
import { chooseScope, enableManagement, findResource } from "./v11-ui.helpers.js";

test("V11-09 V11-11 explicit actual-WebSocket transport fault preserves dirty draft and reconciles revoked server grant", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium", "One owned replica-zero transport-fault reproduction");
  test.setTimeout(180000);
  const slot = lab.slots.A, name = `v11-transport-${Date.now().toString(36)}`;
  const fixture = await createFixture(lab, slot, {
    apiVersion: "apps/v1", kind: "Deployment", metadata: { name, namespace: slot.namespace, labels: { [lab.ownerKey]: lab.owner } },
    spec: { replicas: 0, selector: { matchLabels: { app: name } }, template: {
      metadata: { labels: { app: name, [lab.ownerKey]: lab.owner } },
      spec: { containers: [{ name: "app", image: lab.image, resources: {
        requests: { cpu: "10m", memory: "16Mi" }, limits: { cpu: "100m", memory: "64Mi" },
      } }] },
    } },
  });
  const uid = fixture.metadata.uid, path = lab.baseURL + resourcePath(slot, fixture);
  const snapshots = [], reads = [], closedSockets = new Set();
  let socketSerial = 0;
  // This test-only wrapper retains actual native sockets solely for close().
  // It neither fabricates payloads nor injects application/canonical state.
  await page.addInitScript(() => {
    const NativeWebSocket = window.WebSocket;
    window.__v11ActualTransportSockets = [];
    window.WebSocket = class extends NativeWebSocket {
      constructor(...args) {
        super(...args);
        if (new URL(args[0], location.href).pathname === "/ws") window.__v11ActualTransportSockets.push(this);
      }
    };
  });
  page.on("websocket", (socket) => {
    const url = new URL(socket.url()); if (url.pathname !== "/ws") return;
    const serial = ++socketSerial;
    socket.on("close", () => closedSockets.add(serial));
    socket.on("framereceived", ({ payload }) => {
      try {
        const message = JSON.parse(String(payload)); if (message.type !== "SNAPSHOT") return;
        const resources = Array.isArray(message.resources) ? message.resources : Object.values(message.resources || {});
        const object = resources.find((value) => value.metadata?.uid === uid);
        snapshots.push({ serial, context: url.searchParams.get("context"), namespace: url.searchParams.get("namespace"),
          uid: object?.metadata?.uid, resourceVersion: object?.metadata?.resourceVersion });
      } catch { /* No resource bodies or credentials are recorded. */ }
    });
  });
  page.on("response", async (response) => {
    const url = new URL(response.url());
    if (url.pathname !== "/api/resources" || url.searchParams.get("name") !== name || response.request().method() !== "GET" || response.status() !== 200) return;
    try { const value = await response.json(); reads.push({ uid: value.metadata.uid, resourceVersion: value.metadata.resourceVersion }); }
    catch { /* An aborted prior read is not an actual response. */ }
  });
  const labels = ["CPU request", "CPU limit", "Bellek request", "Bellek limit"];
  const values = ["25m", "175m", "28Mi", "112Mi"];
  const form = page.locator(".resource-form-dialog");
  const actualValues = () => Promise.all(labels.map((label) => form.getByLabel(label, { exact: false }).first().inputValue()));
  const reconnect = async (phase, { priorSerial = socketSerial, closeNative = true } = {}) => {
    if (closeNative) {
      const didClose = await page.evaluate(() => {
        const socket = window.__v11ActualTransportSockets.findLast((value) => value.readyState === WebSocket.OPEN);
        if (!socket) return false;
        socket.close(1000, "explicit owned QA transport fault"); return true;
      });
      expect(didClose).toBe(true);
    }
    // Real management revocation itself closes the server-side WebSocket.
    // Observe that actual close instead of trying to close an already closed socket.
    await expect.poll(() => closedSockets.has(priorSerial)).toBe(true);
    await expect(page.locator(".world-brand-control")).toHaveClass(/is-stale/);
    await evidence.capture(`${phase}-actual-native-transport-stale`);
    await expect.poll(() => snapshots.some((value) => value.serial > priorSerial && value.context === slot.context &&
      value.namespace === slot.namespace && value.uid === uid), { timeout: 30000 }).toBe(true);
    await expect(page.locator(".world-brand-control")).not.toHaveClass(/is-stale/);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(form.getByText("Kaynağın güncel sürümü alınıyor…", { exact: true })).toHaveCount(0);
    evidence.check(`Explicit ${phase} transport fault received a fresh actual same-UID scoped snapshot`, snapshots.at(-1));
  };
  try {
    await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
    await findResource(page, "Deployment", name, uid);
    await page.locator(".resource-details").getByRole("button", { name: "CPU / RAM", exact: true }).click();
    await expect(form.getByText("Kaynağın güncel sürümü alınıyor…", { exact: true })).toHaveCount(0);
    for (let index = 0; index < labels.length; index++) await form.getByLabel(labels[index], { exact: false }).first().fill(values[index]);
    expect(await actualValues()).toEqual(values);
    await evidence.capture("four-dirty-values-before-transport-fault");
    const storedBefore = assertOwned(lab, slot, await getOwned(lab, slot, "Deployment", name), uid);
    await reconnect("dirty-draft");
    const afterReconnect = await actualValues();
    const current = await page.request.get(path); expect(current.status()).toBe(200);
    const storedAfter = assertOwned(lab, slot, await current.json(), uid);
    expect(storedAfter.spec.template).toEqual(storedBefore.spec.template);
    const draftPreserved = JSON.stringify(afterReconnect) === JSON.stringify(values);
    evidence.result.transportDraft = { expected: values, actual: afterReconnect, preserved: draftPreserved,
      uid, storedResourceVersionBefore: storedBefore.metadata.resourceVersion, storedResourceVersionAfter: storedAfter.metadata.resourceVersion,
      actualGETResponses: reads };
    await evidence.capture(draftPreserved ? "dirty-draft-preserved-after-live" : "dirty-draft-lost-after-live");
    expect.soft(afterReconnect, "A same-UID real transport reconnect must preserve all four unsubmitted dirty quantities").toEqual(values);

    // Read the real server state through APIRequestContext; this does not call
    // any frontend refresh or mutate its displayed connection state.
    await guardScope(lab, slot);
    const query = new URLSearchParams({ context: slot.context, namespace: slot.namespace });
    const before = await page.request.get(`${lab.baseURL}/api/connection?${query}`); expect(before.status()).toBe(200);
    const prior = await before.json(); expect(prior.managementEnabled).toBe(true);
    const beforeRevokeSerial = socketSerial;
    const revoke = await page.request.post(`${lab.baseURL}/api/management?${query}`, {
      headers: { "X-KubeView-Connection": prior.connectionID },
      data: { enabled: false, context: slot.context, namespace: slot.namespace, connectionID: prior.connectionID },
    });
    expect(revoke.status()).toBe(200);
    await reconnect("server-grant-revoked", { priorSerial: beforeRevokeSerial, closeNative: false });
    const after = await page.request.get(`${lab.baseURL}/api/connection?${query}`); expect(after.status()).toBe(200);
    const real = await after.json(); expect(real.readOnly).toBe(true); expect(real.managementEnabled).toBe(false);
    const warning = await form.locator(".inline-alert").filter({ hasText: "Salt okunur bağlantı." }).isVisible();
    const dryRunDisabled = await form.getByRole("button", { name: "Server dry-run", exact: true }).isDisabled();
    evidence.result.revokedGrant = { serverReadOnly: real.readOnly, serverManagementEnabled: real.managementEnabled,
      displayedReadOnlyWarning: warning, displayedDryRunDisabled: dryRunDisabled, nonceRecorded: false };
    await evidence.capture("server-readonly-versus-displayed-form-after-reconnect");
    expect.soft(warning, "After reconnect the form must reflect the actual revoked server grant").toBe(true);
    expect.soft(dryRunDisabled, "After reconnect a server-readonly form must disable dry-run").toBe(true);
  } finally {
    // Close the document and its streams before guarded fixture cleanup. The
    // same exact zero-replica fixture is the sole object for both probes.
    await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
    const query = new URLSearchParams({ context: slot.context, namespace: slot.namespace });
    const status = await page.request.get(`${lab.baseURL}/api/connection?${query}`); expect(status.status()).toBe(200);
    const result = await cleanupOwned(lab, slot, fixture, page.request, (await status.json()).connectionID);
    evidence.check("Transport-fault zero-replica Deployment cleanup observed404", result);
  }
});
