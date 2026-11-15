// Existing benchmarks/visibility.mjs native-window method, narrowed to actual
// normal UI and read-only owned resources. No fixture writes or fake hidden event.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { chromium, dir, runtime, get, sleep, poll } from "./repair-ui.mjs";
const output = path.join(dir, "frontend-final-visibility.json"); await writeFile(output, "{}", { flag: "wx" });
const profile = await mkdtemp(path.join(os.tmpdir(), "kv-repair-visibility-"));
const child = spawn(chromium.executablePath(), ["--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--use-mock-keychain", "--use-angle=metal", "about:blank"], { stdio: "ignore" });
const report = { startedAt: new Date().toISOString(), source: "Real owned Kubernetes / normal UI; native own Chromium OS minimization, not synthetic visibility dispatch", context: runtime.context, clusterUID: runtime.clusterUID, errors: [] };
let browser;
const save = () => writeFile(output, JSON.stringify(report, null, 2));
try {
  const port = await poll(async () => Number((await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]), 10000);
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { noDefaults: true }); report.browser = browser.version();
  const context = browser.contexts()[0], page = context.pages()[0] || await context.newPage();
  const cdp = await context.newCDPSession(page), root = await browser.newBrowserCDPSession();
  page.on("pageerror", (error) => report.errors.push(String(error)));
  await page.setViewportSize({ width: 1440, height: 900 }); await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: false });
  await page.goto("http://127.0.0.1:5173"); await page.waitForFunction(() => document.querySelector("canvas")?.__harbor);
  await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
  await page.getByLabel("Cluster / context", { exact: true }).selectOption(runtime.context);
  await page.getByLabel("Namespace adıyla kapsam", { exact: true }).fill(runtime.namespace); await page.getByRole("button", { name: "Kapsamı uygula", exact: true }).click();
  await page.getByRole("button", { name: "Pencereyi kapat", exact: true }).click(); await sleep(700);
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: false });
  const sample = () => page.locator("canvas").evaluate((canvas) => {
    const h = canvas.__harbor, u = h.scene.getObjectByName("harbor:ocean").material.userData.oceanUniforms;
    return { at: new Date().toISOString(), hidden: document.hidden, visibilityState: document.visibilityState, water: { time: u.uWaterTime.value, strength: u.uWaterStrength.value }, fleet: h.fleetStates(), stats: h.stats(), camera: h.camera.position.toArray(), brand: document.querySelector(".world-brand-control")?.textContent };
  });
  const upstream = await get("pod", "flow-client", runtime.namespace); report.expectedPod = { uid: upstream.metadata.uid, name: upstream.metadata.name, namespace: runtime.namespace };
  report.before = await sample();
  const targetId = (await cdp.send("Target.getTargetInfo")).targetInfo.targetId, { windowId } = await root.send("Browser.getWindowForTarget", { targetId });
  await root.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "minimized" } }); await sleep(700);
  report.minimized = await sample(); await save();
  if (!report.minimized.hidden) { report.status = "TEST BLOCKED"; throw new Error("Actual document.hidden stayed false after native window minimization"); }
  const start = Date.now(); await sleep(60000); report.hiddenMs = Date.now() - start;
  report.during = await sample(); report.upstreamDuring = { uid: (await get("pod", "flow-client", runtime.namespace)).metadata.uid };
  await root.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "normal" } }); await page.bringToFront(); await sleep(800);
  report.after = await sample(); report.hiddenFrames = report.during.stats.frame - report.minimized.stats.frame;
  report.waterPaused = report.during.water.time === report.minimized.water.time;
  report.hiddenFleetMaxProgress = Math.max(...report.during.fleet.map((ship) => Math.abs(ship.progress - (report.minimized.fleet.find((old) => old.uid === ship.uid)?.progress ?? ship.progress))));
  report.resumedFleetMaxProgress = Math.max(...report.after.fleet.map((ship) => Math.abs(ship.progress - (report.during.fleet.find((old) => old.uid === ship.uid)?.progress ?? ship.progress))));
  await page.getByRole("button", { name: "Bul", exact: true }).click(); await page.getByLabel("Nesne veya kaynak ara", { exact: true }).fill(upstream.metadata.name);
  await page.locator(".finder-result").filter({ hasText: upstream.metadata.name }).first().click();
  await page.locator(".details-tabs").getByRole("button", { name: "YAML", exact: true }).click();
  report.resumedSelectedUIDCorrect = (await page.locator(".yaml-output").innerText()).includes(upstream.metadata.uid);
  await page.screenshot({ path: path.join(dir, "frontend-final-visibility-restored.png") });
  report.status = report.waterPaused && report.hiddenFrames <= 2 && report.hiddenFleetMaxProgress < 0.05 && report.resumedFleetMaxProgress < 18 && report.resumedSelectedUIDCorrect && report.upstreamDuring.uid === upstream.metadata.uid && !report.after.hidden ? "PASSED" : "FAILED";
  report.limit = "Read-only selected UID retained/accessible and canonical count/queue diagnostics recorded; no event generator or full canonical-content equality claim in this visibility check.";
} catch (error) { report.errors.push(error.stack); report.status ||= "FAILED"; }
finally { await browser?.close().catch(() => {}); child.kill("SIGTERM"); await sleep(200); await rm(profile, { recursive: true, force: true }); report.endedAt = new Date().toISOString(); await save(); }
console.log(JSON.stringify({ status: report.status, hiddenMs: report.hiddenMs, hiddenFrames: report.hiddenFrames, waterPaused: report.waterPaused, hiddenFleetMaxProgress: report.hiddenFleetMaxProgress, resumedFleetMaxProgress: report.resumedFleetMaxProgress, errors: report.errors, evidence: output }));
if (report.status !== "PASSED") process.exitCode = 1;
