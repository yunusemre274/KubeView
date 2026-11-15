import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { loadLab, getOwned } from "../../../../frontend/e2e/v11-lab.mjs";
import { chooseScope, findResource, openConnection } from "../../../../frontend/e2e/v11-ui.helpers.js";
import { sourceIdentity } from "../../../../frontend/e2e/v11-evidence.mjs";
if (process.env.KV_V11_TEST_LEASE !== "v11-20261108-qa") throw new Error("QA lease required");
const require = createRequire(new URL("../../../../frontend/package.json", import.meta.url));
const { chromium } = require("playwright");
const lab = await loadLab(), ownB = await getOwned(lab, lab.slots.B, "Pod", lab.samePod);
const id = `scope-probe-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const result = { id, startedAt: new Date().toISOString(), sourceStart: await sourceIdentity(lab), ownBUID: ownB.metadata.uid,
  sockets: [], snapshots: [], requests: [], diagnostics: [], views: [], errors: [] };
const awake = spawn("/usr/bin/caffeinate", ["-di", "-w", String(process.pid)], { stdio: "ignore" });
const browser = await chromium.launch({ headless: false, args: ["--use-angle=metal"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage(); page.setDefaultTimeout(15000);
page.on("websocket", (socket) => {
  const url = new URL(socket.url()), scope = { context: url.searchParams.get("context"), namespace: url.searchParams.get("namespace") };
  result.sockets.push({ at: new Date().toISOString(), ...scope });
  socket.on("framereceived", ({ payload }) => {
    try {
      const data = JSON.parse(String(payload)); if (data.type !== "SNAPSHOT") return;
      const objects = Array.isArray(data.resources) ? data.resources : Object.values(data.resources || {});
      const pods = objects.filter((object) => object.kind === "Pod");
      result.snapshots.push({ ...scope, podCount: pods.length, podNamespaces: [...new Set(pods.map((pod) => pod.metadata?.namespace))],
        ownBPodPresent: pods.some((pod) => pod.metadata?.uid === ownB.metadata.uid) });
    } catch { /* Non-JSON heartbeat frames are not snapshots. */ }
  });
});
page.on("request", (request) => { const url = new URL(request.url()); if (["/api/connection", "/api/metrics"].includes(url.pathname))
  result.requests.push({ path: url.pathname, context: url.searchParams.get("context"), namespace: url.searchParams.get("namespace") }); });
page.on("response", async (response) => { if (new URL(response.url()).pathname !== "/api/connection" || response.status() !== 200) return;
  try { const data = await response.json(); result.diagnostics.push({ context: data.context, namespace: data.namespace, readOnly: data.readOnly }); } catch {} });
async function view(label) {
  const dialog = await openConnection(page);
  result.views.push({ label, context: await dialog.getByLabel("Cluster / context", { exact: true }).inputValue(),
    namespace: await dialog.getByLabel("Namespace kapsamı", { exact: true }).inputValue(),
    manualInput: await dialog.getByLabel("Namespace adıyla kapsam", { exact: true }).inputValue(),
    alerts: await dialog.locator('[role="alert"]').allTextContents(),
    status: await dialog.locator(".connection-grid:not(.connection-checks)").innerText() });
  await page.screenshot({ path: new URL(`./${id}-${label}.png`, import.meta.url).pathname });
}
try {
  await page.goto(lab.baseURL);
  await chooseScope(page, lab.slots.A.context, lab.namespace, { close: false }); await view("a");
  await chooseScope(page, lab.slots.B.context, lab.namespace, { close: false }); await view("b");
  await findResource(page, "Pod", lab.samePod, ownB.metadata.uid);
  result.status = "B_POD_VISIBLE";
} catch (error) {
  result.status = "B_SCOPE_FAILED";
  result.errors.push({ name: error.name, message: String(error.message).split(/\nCall log:/)[0] });
  await view("b-after-finder-failure");
} finally {
  result.sourceEnd = await sourceIdentity(lab); result.finishedAt = new Date().toISOString();
  await context.close(); await browser.close(); awake.kill("SIGTERM");
  await fs.writeFile(new URL(`./${id}.json`, import.meta.url), `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify({ id, status: result.status, ownBUID: result.ownBUID, sockets: result.sockets, snapshots: result.snapshots,
    diagnostics: result.diagnostics, views: result.views, errors: result.errors })}\n`);
}
