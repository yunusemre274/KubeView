// Genuine OS minimization; no synthetic visibility events, no FPS during hidden time.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { installProbe } from "./probe.mjs";
import { replay, apply, signature } from "./fixtures.mjs";
import { HarborRoute } from "../frontend/src/harbor/fleet.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  require = createRequire(path.join(root, "frontend/package.json"));
const { chromium } = require("playwright"),
  base = process.env.BASE_URL || "http://127.0.0.1:5195";
const i = process.argv.indexOf("--id");
const evidenceId =
  i < 0 ? `native-visibility-${Date.now()}` : process.argv[i + 1];
if (!/^[\w.-]+$/.test(evidenceId)) throw Error("Invalid result id");
const profile = await mkdtemp(
  path.join(os.tmpdir(), "kubeview-native-visibility-"),
);
const child = spawn(
  chromium.executablePath(),
  [
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--use-mock-keychain",
    ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
    "about:blank",
  ],
  { stdio: "ignore" },
);
const report = {
  date: new Date().toISOString(),
  method:
    "Own native Chromium window minimized for 60s; production App, real Go fixture path. Hidden time excluded from FPS; no rAF FPS claim.",
  errors: [],
};
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    try {
      port = Number(
        (
          await readFile(path.join(profile, "DevToolsActivePort"), "utf8")
        ).split("\n")[0],
      );
    } catch {}
    await sleep(100);
  }
  if (!port) throw new Error("Native Chromium endpoint unavailable");
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, {
    noDefaults: true,
  });
  report.browser = browser.version();
  const context = browser.contexts()[0],
    page = context.pages()[0] || (await context.newPage()),
    cdp = await context.newCDPSession(page),
    session = await browser.newBrowserCDPSession();
  await context.addInitScript(installProbe);
  await context.addInitScript(() => {
    localStorage.setItem(
      "kubeview.preferences.v1",
      JSON.stringify({
        version: 1,
        quality: "medium",
        motionPreference: "full",
        sea: true,
        patrol: true,
      }),
    );
    localStorage.setItem("kubeview-world-guide", "seen");
    addEventListener("DOMContentLoaded", () => {
      const label = document.createElement("div");
      label.textContent =
        "BENCHMARK — sentetik fixture · canlı mutasyonlar kapalı";
      label.style.cssText =
        "position:fixed;bottom:8px;left:8px;background:#e6edf1;color:#20313f;z-index:99999;font:12px system-ui;padding:5px;pointer-events:none";
      document.body.append(label);
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: false });
  await page.goto(base);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.stats()?.lifecycle
        ?.canonicalPods === 300,
  );
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: false });
  const sample = () =>
    page.evaluate(() => {
      const c = document.querySelector("canvas"),
        h = c.__harbor,
        u =
          h.scene.getObjectByName("harbor:ocean").material.userData
            .oceanUniforms;
      return {
        hidden: document.hidden,
        stats: h.stats(),
        fleet: h.fleetStates(),
        waterTime: u.uWaterTime.value,
        resources: Object.values(__KUBEVIEW_BENCHMARK__.resources),
        camera: h.camera.position.toArray(),
      };
    });
  await sleep(1000);
  report.before = await sample();
  const targetId = (await cdp.send("Target.getTargetInfo")).targetInfo.targetId,
    { windowId } = await session.send("Browser.getWindowForTarget", {
      targetId,
    });
  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: { windowState: "minimized" },
  });
  await sleep(700);
  report.minimized = await sample();
  if (!report.minimized.hidden)
    throw new Error(
      "OS minimization did not produce document.hidden; test unavailable",
    );
  const upstream = await fetch(`${base}/__benchmark/state`).then((r) =>
      r.json(),
    ),
    events = replay(upstream.resources, {
      duration: 60,
      burst: false,
      startSequence: 50001,
    });
  const sent = await fetch(`${base}/__benchmark/replay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(events),
  });
  if (sent.status !== 202) throw new Error(await sent.text());
  const start = Date.now();
  await sleep(60000);
  report.hiddenMs = Date.now() - start;
  report.during = await sample();
  report.canonicalCorrectWhileHidden =
    JSON.stringify(signature(report.during.resources)) ===
    JSON.stringify(signature(apply(upstream.resources, events)));
  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: { windowState: "normal" },
  });
  await page.bringToFront();
  await sleep(900);
  report.after = await sample();
  const route = new HarborRoute();
  report.resumeProgressDelta =
    (report.after.fleet[0].progress -
      report.during.fleet[0].progress +
      route.length) %
    route.length;
  report.hiddenFrames =
    report.during.stats.frame - report.minimized.stats.frame;
  report.passed =
    report.canonicalCorrectWhileHidden &&
    report.during.waterTime === report.minimized.waterTime &&
    report.hiddenFrames <= 2 &&
    report.resumeProgressDelta < 18 &&
    report.after.stats.lifecycle.canonicalPods === 300 &&
    report.after.stats.lifecycle.queuedTransfers === 0;
  if (!report.passed) throw new Error("Visibility invariant failed");
} catch (e) {
  report.errors.push(e.stack);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  child.kill("SIGTERM");
  const out = path.join(root, "benchmarks/results", evidenceId);
  await mkdir(out, { recursive: true });
  await writeFile(
    path.join(out, "result.json"),
    JSON.stringify(report, null, 2),
  );
  console.log({
    passed: report.passed,
    hiddenMs: report.hiddenMs,
    hiddenFrames: report.hiddenFrames,
    resumeProgressDelta: report.resumeProgressDelta,
    errors: report.errors,
  });
}
