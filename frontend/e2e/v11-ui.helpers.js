import { expect } from "@playwright/test";

const scopeObservers = new WeakMap();
function watchScopes(page) {
  if (scopeObservers.has(page)) return scopeObservers.get(page);
  const state = { socket: null, diagnostic: null, events: [] };
  const record = (event) => { state.events.push({ at: new Date().toISOString(), ...event }); if (state.events.length > 100) state.events.shift(); };
  page.on("websocket", (socket) => {
    const url = new URL(socket.url()); if (url.pathname !== "/ws") return;
    const current = { context: url.searchParams.get("context"), namespace: url.searchParams.get("namespace") || "", snapshot: false, closed: false };
    state.socket = current; record({ type: "websocket", context: current.context, namespace: current.namespace });
    socket.on("close", () => { current.closed = true; });
    socket.on("framereceived", ({ payload }) => {
      try {
        const data = JSON.parse(String(payload)); if (data.type !== "SNAPSHOT") return;
        current.snapshot = true;
        const resources = Array.isArray(data.resources) ? data.resources : Object.values(data.resources || {});
        const pods = resources.filter((object) => object.kind === "Pod");
        record({ type: "snapshot", context: current.context, namespace: current.namespace,
          podUIDs: pods.map((pod) => ({ uid: pod.metadata?.uid, namespace: pod.metadata?.namespace })) });
      } catch { /* Non-resource messages are not scope evidence. */ }
    });
  });
  page.on("response", async (response) => {
    if (new URL(response.url()).pathname !== "/api/connection" || response.status() !== 200) return;
    try {
      const data = await response.json();
      state.diagnostic = { context: data.context, namespace: data.namespace || "", readOnly: data.readOnly };
      record({ type: "diagnostic", ...state.diagnostic });
    } catch { /* Canceled old-scope response is not confirmation. */ }
  });
  scopeObservers.set(page, state);
  return state;
}

export function scopeObservation(page) {
  const state = scopeObservers.get(page);
  return state ? { socket: state.socket, diagnostic: state.diagnostic, events: state.events } : null;
}

export async function closePanels(page) {
  const details = page.getByRole("button", { name: "Ayrıntı panelini kapat", exact: true });
  if (await details.isVisible()) await details.click();
  for (let index = 0; index < 4; index++) {
    const close = page.getByRole("button", { name: "Pencereyi kapat", exact: true }).last();
    if (!(await close.isVisible())) break;
    await close.click();
  }
}

export async function openConnection(page) {
  if (await page.getByRole("dialog", { name: "Bağlantı ve kapsam", exact: true }).isVisible())
    return page.getByRole("dialog", { name: "Bağlantı ve kapsam", exact: true });
  // Keep a resource/log panel open so a real source switch exercises stream
  // cancellation. Close only a competing temporary world window.
  for (let index = 0; index < 4; index++) {
    const close = page.getByRole("button", { name: "Pencereyi kapat", exact: true }).last();
    if (!(await close.isVisible())) break;
    await close.click();
  }
  await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Bağlantı ve kapsam", exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function chooseScope(page, context, namespace, { close = true } = {}) {
  const observed = watchScopes(page);
  const dialog = await openConnection(page);
  const priorSocket = observed.socket;
  observed.diagnostic = null;
  await dialog.getByLabel("Cluster / context", { exact: true }).selectOption(context);
  await expect.poll(async () => {
    const selected = await dialog.getByLabel("Namespace kapsamı", { exact: true }).inputValue();
    const scope = selected === "all" ? "" : selected;
    return observed.diagnostic?.context === context && observed.diagnostic.namespace === scope &&
      observed.socket !== priorSocket && observed.socket?.context === context && observed.socket.namespace === scope && observed.socket.snapshot && !observed.socket.closed;
  }, { timeout: 30000, message: "Selected context must finish its actual diagnostic and scoped snapshot before manual namespace entry" }).toBe(true);
  await dialog.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(namespace);
  await dialog.getByRole("button", { name: "Kapsamı uygula", exact: true }).click();
  await expect(page.locator(".world-brand-control")).toContainText(context);
  await expect.poll(async () => {
    const selected = await dialog.getByLabel("Namespace kapsamı", { exact: true }).inputValue();
    return selected === namespace && observed.diagnostic?.context === context && observed.diagnostic.namespace === namespace &&
      observed.socket?.context === context && observed.socket.namespace === namespace && observed.socket.snapshot && !observed.socket.closed;
  }, { timeout: 30000, message: "Manual namespace must match the actual backend diagnostic and WebSocket snapshot scope" }).toBe(true);
  await expect(dialog.getByText("Snapshot alındı", { exact: true })).toBeVisible({ timeout: 30000 });
  if (close) await dialog.getByRole("button", { name: "Pencereyi kapat", exact: true }).click();
}

export async function enableManagement(page) {
  const dialog = await openConnection(page);
  const enable = dialog.getByRole("button", { name: "Yönetim modunu aç", exact: true });
  if (await enable.isVisible()) {
    const response = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/management" && r.request().method() === "POST");
    await enable.click();
    expect((await response).status()).toBe(200);
  }
  await expect(dialog).toContainText("Kubernetes RBAC denetimli");
  await dialog.getByRole("button", { name: "Pencereyi kapat", exact: true }).click();
}

export async function findResource(page, kind, name, uid) {
  await closePanels(page);
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  const finder = page.getByRole("dialog", { name: "Dünyada bul", exact: true });
  await finder.getByLabel("Nesne veya kaynak ara", { exact: true }).fill(name);
  await finder.getByLabel("Bulucu kaynak türü", { exact: true }).selectOption(kind);
  const row = finder.locator(".finder-result").filter({ has: page.getByText(name, { exact: true }) });
  await expect(row).toHaveCount(1);
  await row.click();
  const details = page.locator(".resource-details");
  await expect(details.locator("h2")).toHaveText(name);
  if (uid) {
    await details.locator(".details-tabs").getByRole("button", { name: "Özet", exact: true }).click();
    await expect(details).toContainText(uid);
  }
  return details;
}

export async function findFacility(page, name = "Merkez") {
  await closePanels(page);
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  const finder = page.getByRole("dialog", { name: "Dünyada bul", exact: true });
  await finder.getByLabel("Nesne veya kaynak ara", { exact: true }).fill(name);
  const row = finder.locator(".finder-result").filter({ hasText: name });
  await expect(row).toHaveCount(1);
  await row.click();
}

export async function resourceTab(page, label) {
  await page.locator(".resource-details .details-tabs").getByRole("button", { name: label, exact: true }).click();
}

export async function confirmDelete(page, name) {
  await page.locator(".resource-details").getByRole("button", { name: "Sil", exact: true }).click();
  const dialog = page.locator(".resource-form-dialog");
  await dialog.getByLabel(`Onaylamak için “${name}” yazın`, { exact: true }).fill(name);
  await dialog.getByRole("button", { name: "Silmeyi onayla", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

export async function submitActionForm(page, configure, { dryRun = false, onPreview } = {}) {
  const dialog = page.locator(".resource-form-dialog");
  await expect(dialog).toBeVisible();
  if (configure) await configure(dialog);
  if (dryRun) {
    await dialog.getByRole("button", { name: "Server dry-run", exact: true }).click();
    await expect(dialog.locator(".dry-run-preview")).toContainText("Server dry-run başarılı.");
    if (onPreview) await onPreview(dialog);
  }
  await dialog.getByRole("button", { name: "Uygula", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

export async function applyAction(page, name, configure) {
  const freshResource = name === "CPU / RAM" ? page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/resources" && response.request().method() === "GET") : null;
  await page.locator(".resource-details").getByRole("button", { name, exact: true }).click();
  const dialog = page.locator(".resource-form-dialog");
  await expect(dialog).toBeVisible();
  if (freshResource) {
    expect((await freshResource).status()).toBe(200);
    await expect(dialog.getByText("Kaynağın güncel sürümü alınıyor…", { exact: true })).toHaveCount(0);
  }
  await submitActionForm(page, configure, { dryRun: name === "CPU / RAM" });
}

export async function cameraPose(page) {
  // Existing read-only diagnostic; no product state or camera is injected.
  return page.locator("canvas").evaluate((canvas) => canvas.__harbor?.camera?.position.toArray());
}

export function poseDistance(left, right) {
  return Math.hypot(...left.map((value, index) => value - right[index]));
}
