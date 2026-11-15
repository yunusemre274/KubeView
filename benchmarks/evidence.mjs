// Separate from performance sampling: real production canvas picks, screenshots/video.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { installProbe } from "./probe.mjs";
import { fixture } from "./fixtures.mjs";
import { clickWorld, closeWindow } from "../frontend/e2e/world.helpers.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "frontend/package.json"));
const { chromium } = require("playwright");
const option = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};
const evidenceId = option("id", `evidence-${Date.now()}`),
  buildTag = option("build-tag", "optimized");
if (![evidenceId, buildTag].every((s) => /^[\w.-]+$/.test(s)))
  throw Error("Invalid evidence/build identity");
const directory = path.join(root, "benchmarks/results", evidenceId);
await mkdir(directory, { recursive: true });
const input = path.join(root, "benchmarks/.build/evidence-fixture.json");
await writeFile(input, JSON.stringify(fixture("M")));
const base = "http://127.0.0.1:5195";
try {
  await fetch(`${base}/__benchmark/state`);
  throw new Error(
    "Port 5195 already in use; will not reuse or stop another server",
  );
} catch (error) {
  if (!error.message.includes("fetch failed")) throw error;
}
const child = spawn(
  path.join(root, "benchmarks/.build/backend.test"),
  ["-test.run", "^TestBenchmarkFixtureServer$", "-test.timeout", "10m"],
  {
    cwd: root,
    stdio: "ignore",
    env: {
      ...process.env,
      KUBECONFIG: "/dev/null",
      KUBEVIEW_BENCH_FIXTURE: input,
      KUBEVIEW_BENCH_STATIC: path.join(root, "benchmarks/.build", buildTag),
      KUBEVIEW_BENCH_ADDR: "127.0.0.1:5195",
      KUBEVIEW_BENCH_LOG_BYTES: "65536",
    },
  },
);
let browser, context;
const result = {
  date: new Date().toISOString(),
  source:
    "Explicit synthetic read-only upstream through production Go informer/WebSocket/App. Visual QA, video on; excluded from FPS benchmarks.",
  errors: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    try {
      ready = (await fetch(`${base}/__benchmark/state`)).ok;
    } catch {}
    if (!ready) await sleep(100);
  }
  if (!ready) throw new Error("Own fixture did not start");
  const testOutput = [];
  const tests = spawn(
    process.execPath,
    [
      "frontend/node_modules/@playwright/test/cli.js",
      "test",
      "--config",
      "frontend/playwright.config.js",
      "benchmark.spec.js",
      "camera.spec.js",
      ...(process.argv.includes('--capacity') ? ['capacity.spec.js'] : []),
      "--reporter=line",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        BASE_URL: base,
        KUBEVIEW_BENCH_BROWSER: "1",
        KUBEVIEW_BENCH_CAPACITY: process.argv.includes('--capacity') ? '1' : '0',
        KUBEVIEW_BENCH_EVIDENCE_DIR: path.join(directory, "functional"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [tests.stdout, tests.stderr])
    stream.on("data", (chunk) => {
      testOutput.push(chunk);
      process.stdout.write(chunk);
    });
  const exitCode = await new Promise((resolve) => tests.once("exit", resolve));
  await writeFile(
    path.join(directory, "browser-tests.txt"),
    Buffer.concat(testOutput),
  );
  if (exitCode !== 0) throw new Error(`Functional tests exited ${exitCode}`);
  result.functionalTests = `${
    Buffer.concat(testOutput)
      .toString()
      .match(/(\d+) passed/)?.[1] || "unknown"
  } passed: Chromium + Playwright WebKit; not installed Safari`;
  browser = await chromium.launch({
    headless: false,
    args: ["--use-angle=metal"],
  });
  result.browser = browser.version();
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: directory, size: { width: 1440, height: 900 } },
  });
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
        theme: "light",
      }),
    );
    localStorage.setItem("kubeview-world-guide", "seen");
    addEventListener("DOMContentLoaded", () => {
      const label = document.createElement("div");
      label.textContent =
        "BENCHMARK — sentetik replay · gerçek küme mutasyonu yok";
      label.style.cssText =
        "position:fixed;bottom:8px;left:8px;background:#17212f;color:white;padding:6px 10px;font:12px sans-serif;z-index:9999;pointer-events:none";
      document.body.append(label);
    });
  });
  const page = await context.newPage(),
    video = page.video();
  await page.goto(base);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.stats()?.lifecycle
        ?.canonicalPods === 300,
  );
  await sleep(2000);
  await page.screenshot({ path: path.join(directory, "world-1440.png") });
  await clickWorld(page, { type: "facility", id: "center" });
  await sleep(500);
  await page.screenshot({ path: path.join(directory, "center.png") });
  await closeWindow(page);
  await clickWorld(page, { type: "node", uid: "node-0" });
  await sleep(500);
  await page.screenshot({ path: path.join(directory, "node.png") });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  const pod = await page.evaluate(() =>
    Object.values(__KUBEVIEW_BENCHMARK__.resources).find(
      (r) => r.kind === "Pod" && r.metadata.name === "app-0",
    ),
  );
  await clickWorld(page, {
    type: "container",
    uid: pod.metadata.uid,
    containerName: "app",
  });
  await sleep(300);
  await page.screenshot({ path: path.join(directory, "container.png") });
  await page
    .locator(".details-tabs")
    .getByRole("button", { name: "Loglar", exact: true })
    .click();
  await sleep(2500);
  await page.screenshot({ path: path.join(directory, "bounded-logs.png") });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  await sleep(300);
  await page.screenshot({ path: path.join(directory, "settings.png") });
  await closeWindow(page);
  await sleep(4000);
  await page.screenshot({ path: path.join(directory, "world-restored.png") });
  result.inventory = await page.locator("canvas").evaluate((c) => ({
    stats: c.__harbor.stats(),
    camera: c.__harbor.camera.position.toArray(),
  }));
  result.video = "world-panels.webm";
  await context.close();
  context = null;
  await rename(await video.path(), path.join(directory, result.video));
} catch (error) {
  result.errors.push(error.stack);
  process.exitCode = 1;
} finally {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  child.kill("SIGTERM");
  await writeFile(
    path.join(directory, "result.json"),
    JSON.stringify(result, null, 2),
  );
  console.log({ directory, ...result, inventory: undefined });
}
