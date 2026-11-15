import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { loadLab } from "../../../../frontend/e2e/v11-lab.mjs";
import { sourceIdentity } from "../../../../frontend/e2e/v11-evidence.mjs";

if (process.env.KV_V11_TEST_LEASE !== "v11-20261108-qa") throw new Error("QA browser lease required");
const require = createRequire(new URL("../../../../frontend/package.json", import.meta.url));
const { chromium } = require("playwright");
const lab = await loadLab();
const id = `startup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const wall = Date.now(), mono = performance.now();
const result = { id, startedAt: new Date().toISOString(), type: "bounded headed production startup diagnostic; not full UI acceptance",
  headless: false, sourceStart: await sourceIdentity(lab), pageErrors: [], consoleErrors: [], assetResponses: [] };
const safe = (value) => String(value).split(/\nCall log:/)[0]
  .replace(/((?:X-KubeView-Connection|Cookie|Authorization)\s*[:=]\s*)[^\r\n]*/gi, "$1[REDACTED]")
  .replace(/([?&]connectionID=)[^&\s"'<>]*/gi, "$1[REDACTED]")
  .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_TOKEN]");
const browser = await chromium.launch({ headless: false, args: ["--use-angle=metal"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("pageerror", (error) => result.pageErrors.push({ name: error.name, message: safe(error.message) }));
page.on("console", (message) => { if (message.type() === "error") result.consoleErrors.push(safe(message.text()).slice(0, 6000)); });
page.on("response", (response) => { const path = new URL(response.url()).pathname;
  if (path.startsWith("/assets/")) result.assetResponses.push({ path, status: response.status() }); });
try {
  await page.goto(lab.baseURL, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).waitFor({ state: "visible", timeout: 15000 });
  result.status = "STARTUP_VISIBLE";
} catch (error) {
  result.status = "STARTUP_FAILED";
  result.error = { name: error.name, message: safe(error.message) };
} finally {
  result.dom = await page.evaluate(() => ({ bodyText: document.body.innerText, canvasCount: document.querySelectorAll("canvas").length,
    buttons: [...document.querySelectorAll("button")].map((button) => ({ text: button.innerText, aria: button.getAttribute("aria-label") })) }));
  await page.screenshot({ path: new URL(`./${id}.png`, import.meta.url).pathname });
  await context.close();
  await browser.close();
  result.sourceEnd = await sourceIdentity(lab);
  result.clock = { wallMs: Date.now() - wall, monotonicMs: performance.now() - mono };
  result.sourceUnchanged = result.sourceStart.sourceSHA256 === result.sourceEnd.sourceSHA256;
  result.finishedAt = new Date().toISOString();
  await fs.writeFile(new URL(`./${id}.json`, import.meta.url), `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify({ id, status: result.status, pageErrors: result.pageErrors, consoleErrors: result.consoleErrors, dom: result.dom, clock: result.clock })}\n`);
}
