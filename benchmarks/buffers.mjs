// Focused real HTTP/watch test after the primary timings; no FPS claim.
import { createRequire } from "node:module";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fixture, replay, apply, signature, VERSION } from "./fixtures.mjs";
import { installProbe } from "./probe.mjs";
import { clickWorld } from "../frontend/e2e/world.helpers.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "frontend/package.json"));
const { chromium } = require("playwright");
const out = path.join(root, "benchmarks/results/buffer-limits");
await mkdir(out, { recursive: true });
const port = 5196,
  base = `http://127.0.0.1:${port}`;
const reservation = createServer();
await new Promise((resolve, reject) => {
  reservation.once("error", reject);
  reservation.listen(port, "127.0.0.1", resolve);
});
await new Promise((resolve) => reservation.close(resolve));
const binary = path.join(root, "benchmarks/.build/buffer-backend.test");
execFileSync("go", ["test", "-c", "-o", binary, "./pkg/server"], {
  cwd: path.join(root, "backend"),
  stdio: "inherit",
});
const data = fixture("M"),
  input = path.join(root, "benchmarks/.build/buffer-fixture.json");
await writeFile(input, JSON.stringify(data));
const child = spawn(
  binary,
  ["-test.run", "^TestBenchmarkFixtureServer$", "-test.timeout", "3m"],
  {
    cwd: root,
    stdio: "ignore",
    env: {
      ...process.env,
      KUBECONFIG: "/dev/null",
      READ_ONLY: "true",
      KUBEVIEW_BENCH_FIXTURE: input,
      KUBEVIEW_BENCH_STATIC: path.join(root, "benchmarks/.build/optimized"),
      KUBEVIEW_BENCH_ADDR: `127.0.0.1:${port}`,
      KUBEVIEW_BENCH_LOG_BYTES: "0",
      KUBEVIEW_BENCH_LOG_BURST_LINES: "6000",
    },
  },
);
const result = {
  date: new Date().toISOString(),
  fixture: VERSION,
  source:
    "Explicit synthetic 6000-line HTTP burst and 600 watch events; production Go/client/store/LogBuffer/App. Separate correctness case, never main FPS.",
  observer:
    "Retains only the latest actual state object passed to the opt-in message callback; no product state mutation.",
  errors: [],
};
let browser, context;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const upstream = () =>
  fetch(`${base}/__benchmark/state`).then((response) => response.json());
try {
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    try {
      ready = (await fetch(`${base}/__benchmark/state`)).ok;
    } catch {}
    if (!ready) await sleep(100);
  }
  if (!ready) throw new Error("Own fixture did not start");
  browser = await chromium.launch({
    headless: false,
    args: ["--use-angle=metal"],
  });
  result.browser = browser.version();
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(installProbe);
  await context.addInitScript(() => {
    const probe = globalThis.__KUBEVIEW_BENCHMARK__,
      message = probe.message;
    probe.message = function (event, times, state) {
      message.call(this, event, times, state);
      this.liveState = state;
    };
    localStorage.setItem(
      "kubeview.preferences.v1",
      JSON.stringify({
        version: 1,
        quality: "medium",
        motionPreference: "full",
        theme: "light",
      }),
    );
    localStorage.setItem("kubeview-world-guide", "seen");
    addEventListener("DOMContentLoaded", () => {
      const label = document.createElement("div");
      label.textContent =
        "BENCHMARK — sentetik buffer sınırı testi; canlı mutasyon yok";
      label.style.cssText =
        "position:fixed;bottom:8px;left:8px;background:#17212f;color:white;padding:6px 10px;font:12px sans-serif;z-index:9999;pointer-events:none";
      document.body.append(label);
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => result.errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.stats()?.lifecycle
        ?.canonicalPods === 300,
  );
  await clickWorld(page, {
    type: "container",
    uid: "pod-0",
    containerName: "app",
  });
  await page
    .locator(".details-tabs")
    .getByRole("button", { name: "Loglar", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.querySelector(".pod-logs")?.textContent.includes("5000 satır"),
  );
  const events = replay(data, {
    duration: 120,
    burst: false,
    startSequence: 10001,
  }).map((event) => ({ ...event, atMs: event.atMs / 20 }));
  const accepted = await fetch(`${base}/__benchmark/replay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(events),
  });
  if (accepted.status !== 202) throw new Error(await accepted.text());
  for (let i = 0; i < 100; i++) {
    const state = await upstream();
    if (!state.running && state.samples.length === events.length) break;
    await sleep(100);
  }
  await page.waitForFunction(
    () => __KUBEVIEW_BENCHMARK__.liveState.events.length === 500,
  );
  await sleep(1000);
  result.observed = await page.evaluate(() => {
    const state = __KUBEVIEW_BENCHMARK__.liveState,
      text = document.querySelector(".log-output").textContent;
    return {
      eventCount: state.events.length,
      logRows: text.split("\n").length,
      logUTF8Bytes: new TextEncoder().encode(text).length,
      oldestBurstRowEvicted: !text.includes("line=0 "),
      lastBurstRowRetained: text.includes("line=5999 "),
      truncationVisible: document
        .querySelector(".pod-logs")
        .textContent.includes("Görünüm sınırına ulaşıldı"),
      resources: Object.values(state.resources),
      stats: document.querySelector("canvas").__harbor.stats(),
    };
  });
  const end = await upstream();
  result.completedEvents = end.samples.length;
  result.canonicalMatchesReplay =
    JSON.stringify(signature(result.observed.resources)) ===
    JSON.stringify(signature(apply(data, events)));
  delete result.observed.resources;
  if (
    result.observed.eventCount !== 500 ||
    result.observed.logRows !== 5000 ||
    result.observed.logUTF8Bytes > 1024 * 1024 ||
    !result.observed.truncationVisible ||
    !result.observed.oldestBurstRowEvicted ||
    !result.observed.lastBurstRowRetained ||
    !result.canonicalMatchesReplay ||
    result.completedEvents !== 600
  )
    throw new Error("Actual buffer/replay limit invariant failed");
  await page.screenshot({ path: path.join(out, "5000-lines-500-events.png") });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await sleep(500);
  const closed = await upstream();
  result.logCleanup = {
    opened: closed.logOpened,
    closed: closed.logClosed,
    remaining: closed.logOpened - closed.logClosed,
  };
  if (result.logCleanup.remaining)
    throw new Error("Log stream remained after close");
  result.passed = !result.errors.length;
} catch (error) {
  result.errors.push(error.stack);
  process.exitCode = 1;
} finally {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  child.kill("SIGTERM");
  await writeFile(
    path.join(out, "result.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(result);
}
