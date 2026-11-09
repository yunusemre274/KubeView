import { createRequire } from "node:module";
import { spawn, execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdir,
  writeFile,
  readFile,
  access,
  mkdtemp,
  rm,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  fixture,
  replay,
  apply,
  signature,
  VERSION,
  PROFILES,
} from "./fixtures.mjs";
import { REPAIR_SCENARIOS, REPAIR_SCENARIO_VERSION, repairScenario, readRepairSnapshot, assessRepairRun, recordRepairPanelCycle } from "./repair-scenarios.mjs";
import { installProbe, installFrameMarks } from "./probe.mjs";
import { installGPUProbe } from "./gpu-probe.mjs";
import { installBufferProbe } from './buffer-probe.mjs';
import { installLifecycleProbe } from "./lifecycle-probe.mjs";
import { readSceneInventory } from "./scene-inventory.mjs";
import { buildLockIdentity } from './build-lock.mjs';
import { summarize, distribution, cpuSeconds, loadBands, measurementWindow } from "./metrics.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "frontend/package.json"));
const { chromium, webkit } = require("playwright");
const exec = promisify(execFile),
  args = process.argv.slice(2);
const option = (key, fallback) => {
  const i = args.indexOf(`--${key}`);
  return i < 0 ? fallback : args[i + 1];
};
const phase = option("phase", "baseline"),
  browserName = option("browser", "chromium"),
  profiles = option("profiles", "S,M,L").split(","),
  scenarios = option(
    "scenarios",
    "living,events,water-off,ships-off,idle,panel,interaction",
  ).split(","),
  repeats = Number(option("repeats", "3")),
  repeatOffset = Number(option("repeat-offset", "0")),
  warmup = Number(option("warmup", "30")),
  seconds = Number(option("seconds", "60")),
  longSeconds = Number(option("long-seconds", "1200")),
  port = Number(option("port", "5192")),
  dpr = Number(option("dpr", "1")),
  panelMatrix = args.includes("--panel-matrix");
const logMatrix = args.includes("--log-matrix"),
  panelTarget = option("panel-target", "node");
const lockInput = args.includes('--lock-input');
const logInitialLines = Number(option('log-initial-lines','1000'));
if (!Number.isInteger(logInitialLines) || logInitialLines<1 || logInitialLines>20000) throw Error('Log initial lines must be 1..20000');
const backendTag = option("backend-tag", "");
const harborCount = Number(option("harbors", "0"));
if (![0,1,5,10,20].includes(harborCount)) throw Error("--harbors must be 1, 5, 10 or 20 (omitted = historical legacy harness)");
if (backendTag && !/^[\w.-]+$/.test(backendTag))
  throw Error("Invalid backend tag");
const backendFile = path.join(
  root,
  "benchmarks/.build",
  ...(backendTag ? [backendTag] : []),
  "backend.test",
);
if (
  !["baseline", "optimized"].includes(phase) ||
  !profiles.every((x) => PROFILES[x]) ||
  !["chromium", "webkit", "safari"].includes(browserName) ||
  !scenarios.every((s) =>
    [
      "living",
      "events",
      "water-off",
      "ships-off",
      "idle",
      "panel",
      "interaction",
      "long",
      "log-stress",
      "panel-closed",
      "panel-open",
      "panel-closed-events",
      "panel-open-events",
      "log-none",
      "log-static",
      "log-normal",
      "log-long",
      ...REPAIR_SCENARIOS,
    ].includes(s),
  ) ||
  ![repeats, warmup, seconds, longSeconds, port, dpr].every(Number.isFinite) ||
  ![1, 2].includes(dpr) ||
  repeats < 1 ||
  warmup < 0 ||
  seconds <= 0 ||
  longSeconds <= 0
)
  throw new Error("Invalid phase/profile");
const smoke = warmup < 30 || seconds < 60 || repeats < 3;
const noProbe = args.includes("--no-probe");
if (
  [
    "--profile-cpu",
    "--profile-alloc",
    "--profile-gpu",
    "--profile-frames",
    "--profile-buffers",
  ].filter((flag) => args.includes(flag)).length > 1
)
  throw new Error("Use one diagnostic profiler per run");
if (noProbe && scenarios.some((s) => s !== "living"))
  throw new Error("--no-probe is the living-scene overhead control only");
const id = option(
  "id",
  `${new Date().toISOString().replace(/[:.]/g, "-")}-${phase}-${browserName}`,
);
const out = path.join(root, "benchmarks/results", id),
  buildTag = option("build-tag", phase),
  build = path.join(root, "benchmarks/.build", buildTag);
if (!/^[\w.-]+$/.test(buildTag)) throw new Error("Invalid build tag");
if (!/^[\w.-]+$/.test(id)) throw new Error("Invalid run id");
try {
  await access(path.join(out, "manifest.json"));
  throw new Error(`Run already exists: ${id}; choose a new id`);
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const command = (bin, args, extra = {}) =>
  (execFileSync(bin, args, { cwd: root, encoding: "utf8", ...extra }) ?? "").trim();
const hash = (data) => createHash("sha256").update(data).digest("hex");
const maybe = (bin, args) => {
  try {
    return command(bin, args);
  } catch {
    return null;
  }
};
const nativeDisplay = await readFile(
  path.join(root, "benchmarks/results/environment/display.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch(() => null);
const manifest = {
  id,
  phase,
  buildTag,
  date: new Date().toISOString(),
  fixtureVersion: VERSION,
  workspaceMode: harborCount > 0,
  registeredHarbors: harborCount || null,
  workspaceInterpretation: harborCount ? "Same canonical fixture and active detailed world; registered harbors share one compatible connection/scope. Far-harbor render inventory is reported, not silently treated as byte-equivalent work." : "Historical legacy single-source harness",
  repairScenarioVersion: REPAIR_SCENARIO_VERSION,
  repairHarnessSHA256: hash(await readFile(path.join(root, "benchmarks/repair-scenarios.mjs"))),
  scenarioVersion: (panelMatrix || logMatrix) ? (lockInput ? 4 : 3) : 2,
  replaySHA256: hash(replay.toString()),
  snapshotOrder:
    "kind/namespace/name/UID before serialization; deterministic fixture-only initial slot allocation",
  instrumentationSHA256: noProbe
    ? "disabled-control"
    : hash(installProbe.toString()),
  lifecycleInstrumentationSHA256: args.includes("--lifecycle-counts")
    ? hash(installLifecycleProbe.toString())
    : null,
  sceneInventoryDiagnostic: args.includes("--scene-inventory"),
  sceneInventorySHA256: args.includes("--scene-inventory") ? hash(readSceneInventory.toString()) : null,
  networkDiagnostic: args.includes("--network-counts"),
  fixtureSHA256: Object.fromEntries(
    profiles.map((profile) => [
      profile,
      hash(JSON.stringify(fixture(profile))),
    ]),
  ),
  nodeVersion: process.version,
  goVersion: maybe("go", ["version"]),
  commit: command("git", ["rev-parse", "HEAD"]),
  trackedDiffSHA256: hash(command("git", ["diff", "--binary"])),
  lockSHA256: hash(
    await readFile(path.join(root, "frontend/package-lock.json")),
  ),
  hardware: maybe("system_profiler", ["SPHardwareDataType"])
    ?.split("Serial Number")[0]
    .trim(),
  os: maybe("sw_vers", []),
  displays: maybe("system_profiler", ["SPDisplaysDataType"]),
  power: maybe("pmset", ["-g", "batt"]),
  powerSettings: maybe("pmset", ["-g", "custom"]),
  displayRefreshHz: nativeDisplay?.RefreshRate || null,
  nativeDisplay,
  deviceScaleFactorOverride: dpr,
  panelMatrix,
  logMatrix,
  logInitialLines,
  panelTarget,
  inputLocked: lockInput,
  backendTag,
  repeatOffset,
  balancedOrder: panelMatrix
    ? "reverse each odd block; same selected Node UID, fresh upstream per cell, reset visual phase at measurement boundary"
    : null,
  displayRefreshNote:
    "CoreGraphics environment/display.json observation; frame timing and renderer DPR are measured separately",
  browserRequested: browserName,
  browserVersion: null,
  viewport: { width: 1440, height: 900 },
  quality: "medium",
  shadows: true,
  water: true,
  patrol: true,
  fpsCap: null,
  adaptiveQuality: false,
  logPayloadBytes: Number(option("log-bytes", "0")),
  production: true,
  profiler: args.includes("--react-profile"),
  bufferDiagnostic: args.includes('--profile-buffers'),
  bufferInstrumentationSHA256: args.includes('--profile-buffers') ? hash(installBufferProbe.toString()) : null,
  reactProfilingBuild: args.includes("--react-profile"),
  gpuProfiler: args.includes("--profile-gpu"),
  video: false,
  cpuThrottling: false,
  sleepInhibition:
    process.platform === "darwin"
      ? "own caffeinate -di process, benchmark lifetime only"
      : null,
  smoke,
  params: { profiles, scenarios, repeats, warmup, seconds, longSeconds, harborCount },
  source:
    "Explicit synthetic read-only upstream using production Go dynamic informers, websocket, frontend store and App; never uses kubeconfig",
  backend:
    "Local test binary; fake Kubernetes tracker/generator lives inside same Go process. Producer apply wall time reported separately; CPU cannot be separated from Go backend CPU in this fixture.",
  safari: {
    version: maybe("/usr/bin/safaridriver", ["--version"]),
    status:
      "N/A in this runner: native Safari availability and manual production measurements are separate; Playwright WebKit is a separate engine",
  },
  cpuDefinition:
    "delta process CPU time / wall seconds; 1.0 core = 100% of one core. RSS reported per PID, not summed as unique physical memory.",
  instrumentation:
    "Opt-in on real callback, App commit and renderer.render; no product metrics dashboard. Draw start intervals and next-draw/DOM/rAF are proxies, NOT GPU presentation/INP.",
};
manifest.powerSource = manifest.power?.includes("AC Power")
  ? "AC"
  : manifest.power?.includes("Battery Power")
    ? "battery"
    : null;
const report = { manifest, runs: [], errors: [] };
if (option('experiment-family', '')) manifest.experimentFamily = option('experiment-family', '');
const save = async () => {
  await writeFile(
    path.join(out, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  await writeFile(
    path.join(out, "summary.json"),
    JSON.stringify(report, null, 2),
  );
};
await save();
if (browserName === "safari") {
  report.errors.push(manifest.safari.status);
  await save();
  console.log(`Safari unavailable: ${out}`);
  process.exit(2);
}
if (!args.includes("--reuse-build")) {
  try {
    await access(path.join(build, "index.html"));
    if (!args.includes("--replace-build"))
      throw new Error(
        `Frozen ${phase} build exists: use --reuse-build or explicitly --replace-build`,
      );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  command(
    "npm",
    [
      "--prefix",
      "frontend",
      "run",
      "build",
      "--",
      "--outDir",
      build,
      "--emptyOutDir",
    ],
    { stdio: "inherit" },
  );
}
manifest.buildIndexSHA256 = hash(
  await readFile(path.join(build, "index.html")),
);
manifest.buildProvenance = await readFile(`${build}.json`, "utf8")
  .then(JSON.parse)
  .catch((e) => {
    if (e.code === "ENOENT") return null;
    throw e;
  });
// Report the measured frozen build's lock, not the checkout used to launch it.
manifest.harnessLockSHA256 = manifest.lockSHA256;
const frozenLock = await readFile(path.join(manifest.buildProvenance?.source || path.join(root,'frontend'), 'package-lock.json'), 'utf8');
Object.assign(manifest, buildLockIdentity(frozenLock));
if (manifest.buildProvenance && manifest.lockSHA256 !== manifest.buildProvenance.files?.['package-lock.json'])
  throw Error('Frozen build source lock changed; refusing CPU measurement');
manifest.dependencyComparison = 'Exact frozen lock SHA retained; comparison excludes only root version and packages[empty].version release metadata';
if (
  Boolean(manifest.buildProvenance?.profiling) !== manifest.reactProfilingBuild
)
  throw new Error("React profiling build/runner flags disagree");
manifest.buildSourceNote =
  "With --reuse-build, invocation trackedDiffSHA256 is not the frozen build source hash. See baseline runtime patch/provenance.";
if (!args.includes("--reuse-binary")) {
  await mkdir(path.dirname(backendFile), { recursive: true });
  command("go", ["test", "-c", "-o", backendFile, "./pkg/server"], {
    cwd: path.join(root, "backend"),
    stdio: "inherit",
  });
}
manifest.backendBinarySHA256 = hash(await readFile(backendFile));
let child, browser, browserServer, browserPID, context, page, cdp, awake;
let ownedBrowserProfile;
let network;
const base = `http://127.0.0.1:${port}`;
const owned = new Set(),
  samples = [];
let lastPressure = 0;
async function sampleOS() {
  try {
    const { stdout } = await exec(
      "ps",
      ["-axo", "pid=,ppid=,time=,rss=,comm="],
      { maxBuffer: 4 << 20 },
    );
    const rows = stdout
      .trim()
      .split("\n")
      .map((line) => {
        const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(.+)$/);
        return m
          ? {
              pid: +m[1],
              ppid: +m[2],
              cpuSeconds: cpuSeconds(m[3]),
              rssKiB: +m[4],
              command: m[5],
            }
          : null;
      })
      .filter(Boolean);
    const parents = new Set([browserPID, child?.pid, process.pid]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const r of rows)
        if (parents.has(r.ppid) && !parents.has(r.pid)) {
          parents.add(r.pid);
          changed = true;
        }
    }
    const selected = rows.filter((r) => parents.has(r.pid));
    for (const r of selected) owned.add(r.pid);
    const record = { time: Date.now(), processes: selected };
    if (Date.now() - lastPressure > 30000) {
      lastPressure = Date.now();
      const pressure = await exec("memory_pressure", ["-Q"])
        .then((r) => r.stdout)
        .catch(() => null);
      record.memoryFreePercent = pressure
        ? Number(pressure.match(/memory free percentage:\s*(\d+)%/)?.[1])
        : null;
      record.swap = await exec("sysctl", ["-n", "vm.swapusage"])
        .then((r) => r.stdout.trim())
        .catch(() => null);
      record.power = await exec("pmset", ["-g", "batt"])
        .then((r) => r.stdout)
        .catch(() => null);
      const source = record.power?.includes("AC Power")
        ? "AC"
        : record.power?.includes("Battery Power")
          ? "battery"
          : null;
      if (source && manifest.powerSource && source !== manifest.powerSource)
        throw new Error(
          "Resource guard: power source changed during run; repeat under fixed power",
        );
      if (
        source === "battery" &&
        Number(record.power?.match(/(\d+)%;/)?.[1] ?? 100) < 10
      )
        throw new Error(
          "Resource guard: battery below 10%; stopped before depletion",
        );
      if (record.memoryFreePercent !== null && record.memoryFreePercent < 8)
        throw new Error(
          "Resource guard: system memory free percentage below 8%",
        );
    }
    samples.push(record);
    if (selected.some((r) => r.rssKiB > 6 * 1024 * 1024))
      throw new Error("Resource guard: one owned process exceeds 6 GiB RSS");
    return record;
  } catch (e) {
    if (e.message.startsWith("Resource guard")) throw e;
    return { error: e.message };
  }
}
const state = async () => {
  const r = await fetch(`${base}/__benchmark/state`);
  if (!r.ok) throw new Error(`fixture state ${r.status}`);
  return r.json();
};
const ready = async () =>
  page.waitForFunction(
    () => {
      const p = globalThis.__KUBEVIEW_BENCHMARK__,
        c = document.querySelector("canvas");
      return (
        (!p || p.snapshots > 0) &&
        c?.__harbor?.stats()?.lifecycle?.canonicalPods > 0
      );
    },
    {},
    { timeout: 90000 },
  );
async function inventory() {
  const result = await page.evaluate(async () => {
    const p = globalThis.__KUBEVIEW_BENCHMARK__,
      c = document.querySelector("canvas"),
      g = c.getContext("webgl2"),
      ext = g.getExtension("WEBGL_debug_renderer_info");
    const logText = document.querySelector(".log-output")?.textContent;
    const logBytes =
      logText === undefined ? null : new TextEncoder().encode(logText);
    const logHash = logBytes
      ? [...new Uint8Array(await crypto.subtle.digest("SHA-256", logBytes))]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      : null;
    return {
      visibility: document.visibilityState,
      dpr: devicePixelRatio,
      rendererPixelRatio:
        p?.gl.getPixelRatio() ?? c.width / c.getBoundingClientRect().width,
      buffer: { width: c.width, height: c.height },
      renderer: ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
      gpuTimerSupported: !!g.getExtension("EXT_disjoint_timer_query_webgl2"),
      camera: {
        position: c.__harbor.camera.position.toArray(),
        quaternion: c.__harbor.camera.quaternion.toArray(),
        zoom: c.__harbor.camera.zoom,
      },
      stats: c.__harbor.stats(),
      sceneResources: globalThis.__KUBEVIEW_SCENE_INVENTORY__?.(c.__harbor.scene, p?.gl),
      preferences: JSON.parse(localStorage.getItem("kubeview.preferences.v1")),
      connectionStale: document
        .querySelector(".world-brand-control")
        ?.classList.contains("is-stale"),
      contextLost: g.isContextLost(),
      fleet: c.__harbor.fleetStates(),
      panel: {
        open: Boolean(document.querySelector(".resource-details, .world-window")),
        title: (document.querySelector(".resource-details h2") || document.querySelector('.world-window h1'))?.textContent,
        tab: document.querySelector(".details-tabs button.active")?.textContent,
      },
      inputGuard: globalThis.__KUBEVIEW_INPUT_GUARD__ ? {...globalThis.__KUBEVIEW_INPUT_GUARD__.counts} : null,
      cargoBuffers: globalThis.__KUBEVIEW_BUFFER_PROBE__ ? (() => {
        let body;
        c.__harbor.scene.traverse(object => {
          if (!body && object.isInstancedMesh && object.userData.harborTargets?.().some(target => target.type === 'container')) body = object;
        });
        return body ? body.parent.children.filter(object => object.isInstancedMesh).map((object, index) => ({
          role: ['body', 'details', 'status'][index], uuid: object.uuid, active: object.count,
          matrixUUID: object.instanceMatrix.uuid, matrixCapacity: object.instanceMatrix.count,
          colorCapacity: object.instanceColor?.count || 0,
          typedArrayBytes: object.instanceMatrix.array.byteLength + (object.instanceColor?.array.byteLength || 0),
        })) : [];
      })() : undefined,
      logView: logBytes
        ? {
            rows: logText.split("\n").length,
            utf8Bytes: logBytes.length,
            sha256: logHash,
          }
        : null,
      lifecycle: globalThis.__KUBEVIEW_LIFECYCLE__?.read() || null,
      heap: performance.memory
        ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
          }
        : null,
    };
  });
  if (cdp) result.dom = await cdp.send("Memory.getDOMCounters");
  return result;
}
async function launchProfile(profile, scenario = "") {
  if (context) await context.close();
  if (child) {
    child.kill("SIGTERM");
    await new Promise((r) => child.once("exit", r));
  }
  const file = path.join(root, `benchmarks/.build/fixture-${profile}.json`);
  await writeFile(file, JSON.stringify(fixture(profile)));
  child = spawn(
    backendFile,
    ["-test.run", "^TestBenchmarkFixtureServer$", "-test.timeout", "90m"],
    {
      cwd: root,
      env: {
        ...process.env,
        KUBEVIEW_BENCH_FIXTURE: file,
		KUBEVIEW_BENCH_HARBORS: harborCount ? String(harborCount) : "",
        KUBEVIEW_BENCH_STATIC: build,
        KUBEVIEW_BENCH_ADDR: `127.0.0.1:${port}`,
        KUBEVIEW_BENCH_LOG_BYTES: logMatrix
          ? scenario === "log-long"
            ? "65536"
            : "0"
          : option("log-bytes", "0"),
        KUBEVIEW_BENCH_LOG_BURST_LINES: logMatrix
          ? scenario === "log-long"
            ? "80"
            : String(logInitialLines)
          : "0",
        KUBEVIEW_BENCH_LOG_GATED: logMatrix ? "1" : "0",
        KUBECONFIG: "/dev/null",
        KUBE_CONTEXT: "benchmark",
        WATCH_NAMESPACE: "",
        READ_ONLY: "true",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (b) => process.stdout.write(b));
  child.stderr.on("data", (b) => {
    report.errors.push(b.toString());
  });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null)
      throw new Error(`Go fixture exited ${child.exitCode}`);
    try {
      await state();
      break;
    } catch {
      await sleep(100);
    }
  }
  context = await browser.newContext({
    viewport: manifest.viewport,
    deviceScaleFactor: dpr,
    reducedMotion: "no-preference",
  });
  if (!noProbe)
    await context.addInitScript({
      content: `${args.includes("--lifecycle-counts") ? `(${installLifecycleProbe.toString()})();` : ""}(${installProbe.toString()})();${args.includes("--profile-gpu") ? `(${installGPUProbe.toString()})();` : ""}${args.includes("--profile-frames") ? `(${installFrameMarks.toString()})();` : ""}${args.includes("--scene-inventory") ? `globalThis.__KUBEVIEW_SCENE_INVENTORY__=(${readSceneInventory.toString()});` : ""}`,
    });
  if (args.includes('--profile-buffers')) {
    manifest.profiler = true;
    await context.addInitScript({ content: `(${installBufferProbe.toString()})();` });
  }
  await context.addInitScript(() => {
    if (!localStorage.getItem("kubeview.preferences.v1"))
      localStorage.setItem(
        "kubeview.preferences.v1",
        JSON.stringify({
          version: 1,
          quality: "medium",
          theme: "light",
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
        "position:fixed;bottom:8px;left:8px;z-index:99999;background:#e6edf1;color:#20313f;padding:5px 8px;font:12px system-ui;pointer-events:none";
      document.body.append(label);
    });
  });
  page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  const start = Date.now();
  await page.goto(base);
  await page.bringToFront();
  await ready();
  const initialReadyMs = Date.now() - start;
  await page.waitForFunction(() =>
    document
      .querySelector("canvas")
      .__harbor.projectTargets({ type: "node", uid: "node-0" })
      .some((t) => t.visible),
  );
  manifest.coldStarts ??= [];
  manifest.coldStarts.push({
    profile,
    firstReadyMs: Date.now() - start,
    canonicalAndCanvasReadyMs: initialReadyMs,
    method:
      "navigation -> actual Node mesh raycast-visible target; fresh browser context; OS/GPU caches not flushed. Panel interaction measured separately",
  });
  if (browserName === "chromium") cdp = await context.newCDPSession(page);
  if (cdp && args.includes("--network-counts")) {
    await cdp.send("Network.enable");
    const requestPaths = new Map();
    const increment = (key, n = 1) => {
      if (network?.active) network[key] = (network[key] || 0) + n;
    };
    cdp.on("Network.requestWillBeSent", ({ requestId, request }) => {
      requestPaths.set(requestId, new URL(request.url).pathname);
      increment("requests");
    });
    cdp.on(
      "Network.dataReceived",
      ({ requestId, dataLength, encodedDataLength }) => {
        increment("dataCallbacks");
        increment("decodedBytes", dataLength);
        increment("encodedChunkBytes", encodedDataLength);
        if (requestPaths.get(requestId) === "/api/logs") {
          increment("logDataCallbacks");
          increment("logDecodedBytes", dataLength);
        }
      },
    );
    cdp.on("Network.loadingFinished", ({ requestId }) => {
      increment("finished");
      requestPaths.delete(requestId);
    });
    cdp.on("Network.loadingFailed", ({ requestId }) => {
      increment("failed");
      requestPaths.delete(requestId);
    });
    cdp.on("Network.webSocketFrameReceived", () =>
      increment("websocketCallbacks"),
    );
  }
  manifest.actual = await inventory();
  await save();
}
async function setInputGuard(enabled) {
  await page.evaluate((enabled) => {
    globalThis.__KUBEVIEW_INPUT_GUARD__?.cleanup();
    if (!enabled) return;
    const counts = {};
    const handler = (event) => {
      if (!event.isTrusted) return;
      counts[event.type] = (counts[event.type] || 0) + 1;
      event.stopImmediatePropagation();
      if (event.cancelable) event.preventDefault();
    };
    const names = ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click', 'dblclick', 'wheel', 'contextmenu', 'touchstart', 'touchmove'];
    for (const name of names) window.addEventListener(name, handler, { capture: true, passive: false });
    globalThis.__KUBEVIEW_INPUT_GUARD__ = { counts, cleanup() {
      for (const name of names) window.removeEventListener(name, handler, true);
      delete globalThis.__KUBEVIEW_INPUT_GUARD__;
    } };
  }, enabled);
}
async function prepareCamera(interactive = true) {
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.scene.__r3f?.root?.getState()
        .controls,
  );
  await setInputGuard(!interactive && lockInput);
  await page.evaluate(({interactive}) => {
    const canvas = document.querySelector("canvas"),
      harbor = canvas.__harbor;
    const controls = harbor.scene.__r3f.root.getState().controls;
    controls.enableRotate = interactive;
    controls.enablePan = interactive;
    controls.enableZoom = interactive;
    canvas.style.pointerEvents = interactive ? "auto" : "none";
    if (!interactive && document.activeElement === canvas) canvas.blur();
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    const position = [
      155.32070332934845, 297.3149971650057, 468.72488860383254,
    ];
    const q = [
      -0.32546078412600804, 0.19405942434202558, 0.06843554348917548,
      0.9228937068847457,
    ];
    const forward = [
      -2 * (q[0] * q[2] + q[3] * q[1]),
      -2 * (q[1] * q[2] - q[3] * q[0]),
      -(1 - 2 * (q[0] ** 2 + q[1] ** 2)),
    ];
    const distance = -position[1] / forward[1];
    controls.target.set(
      position[0] + forward[0] * distance,
      0,
      position[2] + forward[2] * distance,
    );
    harbor.camera.position.fromArray(position);
    harbor.camera.zoom = 1;
    harbor.camera.fov = 38;
    harbor.camera.near = 0.5;
    harbor.camera.far = 2000;
    controls.update();
    controls.enableDamping = damping;
    harbor.camera.updateProjectionMatrix();
    harbor.camera.updateMatrixWorld(true);
    harbor.invalidate();
  }, {interactive});
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function preferences(patch) {
  await page.evaluate(() => {
    const pref = JSON.parse(localStorage.getItem("kubeview.preferences.v1"));
    localStorage.setItem(
      "kubeview.preferences.v1",
      JSON.stringify({ ...pref, patrol: true, sea: true }),
    );
  });
  // Fresh page/store outside timing. Real settings preserve the fleet's pose.
  await page.reload();
  await ready();
  await prepareCamera();
  if (patch.patrol === false || patch.sea === false) {
    await page
      .locator("canvas")
      .evaluate((canvas) => (canvas.dataset.preferenceIdentity = "preserved"));
    await page
      .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
      .click();
    if (patch.patrol === false)
      await page
        .getByRole("checkbox", { name: "Gemi devriyesi", exact: true })
        .uncheck();
    if (patch.sea === false)
      await page
        .getByRole("checkbox", { name: "Deniz yüzeyi hareketi", exact: true })
        .uncheck();
    await page
      .getByRole("button", { name: "Pencereyi kapat", exact: true })
      .click();
    if (
      (await page
        .locator("canvas")
        .getAttribute("data-preference-identity")) !== "preserved"
    )
      throw new Error("Preference toggle remounted the canvas");
  }
}
async function pick(match) {
  for (let i = 0; i < 25; i++) {
    const target = await page
      .locator("canvas")
      .evaluate(
        (c, match) =>
          c.__harbor
            .projectTargets(match)
            .find(
              (t) =>
                t.visible &&
                Object.entries(match).every(([k, v]) => t[k] === v),
            ),
        match,
      );
    if (target) {
      const expected =
        target.type === "facility"
          ? "Liman Yönetim Merkezi"
          : target.containerName || target.name;
      await arm(expected, target.uid);
      await page.mouse.click(target.x, target.y);
      await page.waitForFunction(
        ({ selector, expected }) =>
          document.querySelector(selector)?.textContent.trim() === expected,
        {
          selector:
            target.type === "facility"
              ? ".world-window h1"
              : ".resource-details h2",
          expected,
        },
        { timeout: 5000 },
      );
      return target;
    }
    await sleep(100);
  }
  throw new Error(`No clickable world target ${JSON.stringify(match)}`);
}
async function arm(expectedTitle, uid) {
  await page.evaluate(
    (value) => {
      globalThis.__KUBEVIEW_BENCHMARK__.nextInput = value;
    },
    { expectedTitle, uid },
  );
}
async function closePanel() {
  const close = page.getByRole("button", {
    name: /^(Ayrıntı panelini kapat|Pencereyi kapat)$/,
  });
  if (await close.count()) {
    await close.last().click();
    await page.locator('.resource-details, .world-window').waitFor({ state: 'hidden', timeout: 5000 });
  }
}
async function openPodLogs() {
  await closePanel();
  await arm("Dünyada bul");
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  await page.locator(".world-window input").first().fill("app-0");
  await arm("app-0");
  await page
    .locator(".finder-result")
    .filter({ has: page.locator("small", { hasText: "Pod · bench-0" }) })
    .filter({ has: page.locator("strong", { hasText: /^app-0$/ }) })
    .click();
  await page.locator(".resource-details h2").waitFor();
  await page
    .locator(".details-tabs")
    .getByRole("button", { name: "Loglar", exact: true })
    .click();
  await page.locator(".log-output").waitFor();
}
async function interactions(stopAt) {
  const began = Date.now(),
    schedule = [];
  for (let cycle = 0; began + cycle * 5000 < stopAt; cycle++) {
    const planned = cycle * 5000;
    await sleep(Math.max(0, began + planned - Date.now()));
    const started = Date.now();
    try {
      await closePanel();
      if (cycle % 3 === 0) {
        await pick({ type: "facility", id: "center" });
        await page.locator(".world-window h1").first().waitFor();
        await arm("Kaynak oluştur");
        await page
          .getByRole("button", { name: "Uygulama oluştur", exact: true })
          .click();
        await page
          .getByLabel("Kaynak adı", { exact: true })
          .pressSequentially("benchmark-typing", { delay: 25 });
        await page
          .getByLabel(/^Ana container image/)
          .pressSequentially("fixture.invalid/app:v1", { delay: 25 });
        await page
          .getByRole("button", { name: "Formu kapat", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Taslağı bırak ve kapat", exact: true })
          .click();
      } else if (cycle % 3 === 1) {
        await pick({ type: "node", uid: "node-0" });
        await page.locator(".resource-details h2").waitFor();
      } else {
        await pick({ type: "container", uid: "pod-0", containerName: "app" });
        await page.locator(".resource-details h2").waitFor();
      }
      await sleep(150);
      await closePanel();
      await arm("Dünyada bul");
      await page.getByRole("button", { name: "Bul", exact: true }).click();
      const input = page.locator(".world-window input").first();
      await input.pressSequentially("app-0", { delay: 25 });
      await sleep(100);
      await closePanel();
      await page
        .getByRole("button", { name: "Limana dön", exact: true })
        .click();
      if (cycle % 3 === 1) {
        await openPodLogs();
        await page.waitForFunction(() =>
          document
            .querySelector(".log-output")
            ?.textContent.includes("BENCHMARK"),
        );
        await closePanel();
      }
      if (cycle % 3 === 2) {
        await page.locator("canvas").focus();
        await page.keyboard.down("ArrowRight");
        await sleep(200);
        await page.keyboard.up("ArrowRight");
        await page.mouse.move(500, 700);
        await page.mouse.down();
        await page.mouse.move(550, 710, { steps: 8 });
        await page.mouse.up();
        await page
          .getByRole("button", { name: "Limana dön", exact: true })
          .click();
      }
      schedule.push({
        cycle,
        plannedMs: planned,
        actualMs: started - began,
        completedMs: Date.now() - began,
      });
    } catch (e) {
      await page
        .screenshot({ path: path.join(out, "interaction-failure.png") })
        .catch(() => {});
      await writeFile(
        path.join(out, "interaction-failure.html"),
        await page.content(),
      );
      throw e;
    }
  }
  return schedule;
}
async function run(profile, scenario, repeat) {
  // Independent event repetitions start from the same upstream objects/status.
  if (
    (scenario === "events" && repeat > 0) ||
    scenario.startsWith("panel-") ||
    REPAIR_SCENARIOS.includes(scenario) ||
    logMatrix
  )
    await launchProfile(profile, scenario);
  await closePanel();
  await preferences({
    patrol: scenario !== "ships-off" && scenario !== "idle",
    sea: scenario !== "water-off" && scenario !== "idle",
  });
  if (scenario === "panel" || scenario.startsWith("panel-")) {
    await pick({ type: "node", uid: "node-0" });
    if (panelTarget === "pod")
      await pick({ type: "container", uid: "pod-0", containerName: "app" });
    if (panelTarget === "center")
      await pick({ type: "facility", id: "center" });
    if (scenario.startsWith("panel-closed")) await closePanel();
    await page.mouse.move(8, 8);
  }
  if (logMatrix) {
    await pick({ type: "container", uid: "pod-0", containerName: "app" });
    if (scenario !== "log-none") {
      await page
        .locator(".details-tabs")
        .getByRole("button", { name: "Loglar", exact: true })
        .click();
      await page.waitForFunction(
        threshold =>
          (document.querySelector(".log-output")?.textContent.length || 0) >
          threshold,
        Math.min(50000,(scenario==='log-long'?80:logInitialLines)*50),
      );
    }
    await page.mouse.move(8, 8);
  }
  if (scenario === "long" || scenario === "log-stress") await openPodLogs();
  // Protect the warm-up too. Native input there can otherwise change the panel
  // before the steady window, even when the steady-window guard is correct.
  await setInputGuard(lockInput && scenario !== 'interaction');
  const setupBeforeWarm = (panelMatrix || logMatrix) ? await inventory() : null;
  if (setupBeforeWarm) {
    const expectedOpen = logMatrix || !scenario.startsWith('panel-closed');
    if (setupBeforeWarm.panel.open !== expectedOpen)
      throw Error('Panel setup differs before warm-up; no CPU window started');
  }
  const initialResources = (await state()).resources;
  const duration = scenario === "long" ? longSeconds : seconds;
  const repairPlan = REPAIR_SCENARIOS.includes(scenario)
    ? repairScenario(initialResources, scenario, { duration, startSequence: 1 + repeat * 10000 }) : null;
  const events = repairPlan ? repairPlan.events :
    scenario === "events" || scenario === "long" || scenario.endsWith("-events")
      ? replay(initialResources, {
          duration,
          burst: scenario === "events",
          startSequence: 1 + repeat * 10000,
        }).filter((event) => scenario !== "long" || event.atMs % 30000 < 28000)
      : [];
  await sleep(warmup * 1000);
  if (args.includes("--min-fps") && scenario !== "idle") {
    const began = await page.evaluate(() => ({
      frame: document.querySelector("canvas").__harbor.stats().frame,
      time: performance.now(),
    }));
    await sleep(2000);
    const end = await page.evaluate(() => ({
      frame: document.querySelector("canvas").__harbor.stats().frame,
      time: performance.now(),
    }));
    const rate = ((end.frame - began.frame) * 1000) / (end.time - began.time);
    if (rate < Number(option("min-fps", "55")))
      throw Error(
        `Cadence preflight ${rate.toFixed(2)} JS draws/s below requested guard; no CPU acceptance window started`,
      );
  }
  // Settle startup effects, then protect noninteractive cases from native input.
  // OrbitControls.update remains enabled, so the normal per-frame work is kept.
  await prepareCamera(scenario === "interaction");
  if (panelMatrix || logMatrix || repairPlan) {
    await page.evaluate(() => {
      const p = globalThis.__KUBEVIEW_BENCHMARK__;
      if (!p.resetVisual)
        throw new Error(
          "Panel matrix requires the visual-reset diagnostic hook",
        );
      p.resetVisual();
    });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  }
  if (args.includes("--capture-start"))
    await page.screenshot({
      path: path.join(out, `${profile}-${scenario}-${repeat}-start.png`),
    });
  const repairBefore = repairPlan ? await page.evaluate(readRepairSnapshot) : null;
  const repairObservations = [], repairPanelCycles = [];
  const before = await inventory(),
    osBefore = await sampleOS();
  const logBefore = logMatrix ? await state() : null;
  if (args.includes("--profile-cpu") && cdp) {
    manifest.profiler = true;
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.start");
  }
  if (args.includes("--profile-alloc") && cdp) {
    manifest.profiler = true;
    await cdp.send("HeapProfiler.startSampling", {
      samplingInterval: 32768,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true,
    });
  }
  if (args.includes("--profile-frames") && cdp) {
    manifest.profiler = true;
    await cdp.send("Tracing.start", {
      categories:
        "devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,toplevel",
      transferMode: "ReturnAsStream",
    });
  }
  const countStart = await page.evaluate(() => {
    globalThis.__KUBEVIEW_BUFFER_PROBE__?.start();
    if (globalThis.__KUBEVIEW_BENCHMARK__) {
      globalThis.__KUBEVIEW_BENCHMARK__.visualHold = false;
      document.querySelector("canvas").__harbor.invalidate();
      globalThis.__KUBEVIEW_BENCHMARK__.start();
      return null;
    }
    return {
      time: performance.now(),
      frame: document.querySelector("canvas").__harbor.stats().frame,
    };
  });
  network = args.includes("--network-counts")
    ? {
        active: true,
        scope:
          "CDP callbacks during measured window; encoded chunk bytes exclude headers and may omit buffered chunks. Not total wire traffic.",
      }
    : null;
  if (events.length) {
    const res = await fetch(`${base}/__benchmark/replay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(events),
    });
    if (res.status !== 202) throw new Error(await res.text());
  }
  const start = Date.now();
  if (logMatrix && ["log-normal", "log-long"].includes(scenario)) {
    const response = await fetch(`${base}/__benchmark/log-flow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: true }),
    });
    if (!response.ok) throw Error("Fixture log flow could not start");
  }
  let interactionError;
  const action =
    scenario === "interaction"
      ? interactions(start + duration * 1000).catch((error) => {
          interactionError = error;
          return [];
        })
      : null;
  const checkpoints = [];
  const chunks = [];
  const reconnectAtMs = [];
  // Sample inside the 28..30 second quiet window, before the next ADD can run.
  let nextCheckpoint = 29000,
    repairCheckpoint = 1,
    reconnects = 0;
  while (Date.now() - start < duration * 1000) {
    const remainingRepairCheckpoint = repairPlan && repairCheckpoint < repairPlan.checkpoints.length
      ? Math.max(0, repairPlan.checkpoints[repairCheckpoint].atMs - (Date.now() - start)) : Infinity;
    const remainingToCheckpoint =
      scenario === "long"
        ? Math.max(0, nextCheckpoint - (Date.now() - start))
        : Infinity;
    await sleep(
      Math.max(
        0,
        Math.min(
          5000,
          remainingToCheckpoint,
          remainingRepairCheckpoint,
          duration * 1000 - (Date.now() - start),
        ),
      ),
    );
    await sampleOS();
    if (interactionError) throw interactionError;
    const elapsed = Date.now() - start;
    if (repairPlan && repairCheckpoint < repairPlan.checkpoints.length && elapsed >= repairPlan.checkpoints[repairCheckpoint].atMs) {
      repairObservations.push({ ...await page.evaluate(readRepairSnapshot), plannedAtMs: repairPlan.checkpoints[repairCheckpoint++].atMs, actualAtMs: elapsed });
    }
    if (scenario === "long" && elapsed >= nextCheckpoint) {
      const chunk = await page.evaluate(() =>
        globalThis.__KUBEVIEW_BENCHMARK__.drain(),
      );
      chunks.push(chunk);
      await writeFile(
        path.join(out, `long-chunk-${chunks.length}.json`),
        JSON.stringify(chunk),
      );
      const upstream = await state(),
        inv = await inventory();
      if (!inv.logView || upstream.logOpened - upstream.logClosed !== 1)
        throw Error('Long-run log panel or its single stream disappeared');
      const heap = cdp ? await cdp.send("Runtime.getHeapUsage") : null;
      const sockets = await page.evaluate(
        () => globalThis.__KUBEVIEW_BENCHMARK__.sockets.size,
      );
      checkpoints.push({
        elapsedMs: elapsed,
        quiescentResourceCounts:
          upstream.resources.length === initialResources.length &&
          inv.stats.lifecycle.canonicalPods ===
            initialResources.filter((resource) => resource.kind === "Pod")
              .length,
        upstream: {
          go: upstream.go,
          logOpened: upstream.logOpened,
          logClosed: upstream.logClosed,
          resources: upstream.resources.length,
          samples: upstream.samples.length,
          sameVersionResyncs: upstream.sameVersionResyncs,
        },
        inventory: inv,
        heap,
        sockets,
      });
      await writeFile(
        path.join(out, "long-checkpoints.json"),
        JSON.stringify(checkpoints, null, 2),
      );
      console.log(
        `long checkpoint ${Math.round(elapsed / 1000)}s; sockets=${sockets}; logs=${upstream.logOpened - upstream.logClosed}; geometry=${inv.stats.memory.geometries}`,
      );
      if (elapsed > 600000) {
        await setInputGuard(false);
        repairPanelCycles.push(await recordRepairPanelCycle({ cycle: repairPanelCycles.length + 1, closePanel, openPanel: openPodLogs, inventory, upstreamState: state }));
        await setInputGuard(lockInput);
      }
      // Informers belong to each socket: keep the last connection >10 minutes,
      // otherwise three 4-minute reconnects would never exercise resync at all.
      if (elapsed >= (reconnects + 1) * 90000 - 1000 && reconnects < 3) {
        await page.evaluate(() =>
          globalThis.__KUBEVIEW_BENCHMARK__.latestSocket.close(),
        );
        reconnectAtMs.push(Date.now() - start);
        reconnects++;
      }
      nextCheckpoint += 30000;
    }
  }
  const interactionSchedule = action ? await action : null;
  if (logMatrix)
    await fetch(`${base}/__benchmark/log-flow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
  if (interactionError) throw interactionError;
  if (network) network.active = false;
  const raw = await page.evaluate((start) => {
      if (globalThis.__KUBEVIEW_BENCHMARK__) {
        const raw = globalThis.__KUBEVIEW_BENCHMARK__.stop();
        const buffers = globalThis.__KUBEVIEW_BUFFER_PROBE__?.stop();
        if (buffers) raw.bufferActivity = buffers;
        return raw;
      }
      return {
        durationMs: performance.now() - start.time,
        renderCount:
          document.querySelector("canvas").__harbor.stats().frame - start.frame,
        frames: [],
        messages: [],
        inputs: [],
        longTasks: [],
        errors: [],
      };
    }, countStart),
    after = await inventory(),
    osAfter = await sampleOS();
  await page.evaluate(()=>globalThis.__KUBEVIEW_INPUT_GUARD__?.cleanup());
  if (chunks.length)
    for (const key of ["frames", "messages", "inputs", "longTasks"])
      raw[key] = chunks.flatMap((chunk) => chunk[key]).concat(raw[key]);
  if (args.includes("--profile-cpu") && cdp) {
    const { profile: cpu } = await cdp.send("Profiler.stop");
    await mkdir(path.join(out, "traces"), { recursive: true });
    await writeFile(
      path.join(out, "traces", `${profile}-${scenario}-${repeat}.cpuprofile`),
      JSON.stringify(cpu),
    );
  }
  if (args.includes("--profile-alloc") && cdp) {
    const { profile: alloc } = await cdp.send("HeapProfiler.stopSampling");
    await mkdir(path.join(out, "traces"), { recursive: true });
    await writeFile(
      path.join(out, "traces", `${profile}-${scenario}-${repeat}.heapprofile`),
      JSON.stringify(alloc),
    );
  }
  if (args.includes("--profile-frames") && cdp) {
    const complete = new Promise((resolve) =>
      cdp.once("Tracing.tracingComplete", resolve),
    );
    await cdp.send("Tracing.end");
    const { stream } = await complete;
    let trace = "";
    while (true) {
      const chunk = await cdp.send("IO.read", { handle: stream });
      trace += chunk.base64Encoded
        ? Buffer.from(chunk.data, "base64").toString()
        : chunk.data;
      if (chunk.eof) break;
    }
    await cdp.send("IO.close", { handle: stream });
    await mkdir(path.join(out, "traces"), { recursive: true });
    await writeFile(
      path.join(out, "traces", `${profile}-${scenario}-${repeat}.trace.json`),
      trace,
    );
  }
  const result = {
    profile,
    scenario,
    repeat,
    before,
    after,
    summary: summarize(raw),
    osBefore,
    osAfter,
    checkpoints,
    reconnects,
    reconnectAtMs,
    repairPanelCycles,
    interactionSchedule,
    network,
    setupBeforeWarm,
    bufferActivity: raw.bufferActivity,
  };
  if(args.includes('--verify-log-ui') && logMatrix && scenario!=='log-none') {
    const original=await page.locator('.log-output').textContent();
    const selection=await page.locator('.log-output').evaluate(pre=>{const s=getSelection();s.selectAllChildren(pre);const text=s.toString();s.removeAllRanges();return text;});
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Logları indir',exact:true}).click();
    const downloaded=await readFile(await (await downloadPromise).path(),'utf8');
    const query='line=10';
    await page.getByRole('textbox',{name:'Loglarda ara ve filtrele'}).fill(query);
    const filtered=original.split('\n').filter(line=>line.toLocaleLowerCase('tr-TR').includes(query)).join('\n');
    await page.waitForFunction(expected=>document.querySelector('.log-output').textContent===expected,filtered);
    await page.getByRole('textbox',{name:'Loglarda ara ve filtrele'}).fill('');
    await page.waitForFunction(expected=>document.querySelector('.log-output').textContent===expected,original);
    await page.getByRole('checkbox',{name:'Satırları sar',exact:true}).uncheck();
    const unwrapped=await page.locator('.log-output').evaluate(pre=>({text:pre.textContent,whiteSpace:getComputedStyle(pre).whiteSpace}));
    await page.getByRole('checkbox',{name:'Satırları sar',exact:true}).check();
    result.logUI={selectionExact:selection===original,downloadExact:downloaded===original,filterExact:true,restoredExact:await page.locator('.log-output').textContent()===original,unwrapExact:unwrapped.text===original && unwrapped.whiteSpace==='pre',chunkNodes:await page.locator('.log-output > span').count()};
    if(Object.values(result.logUI).some(value=>value===false)) throw Error('Log UI content/selection verification failed');
  }
  if (scenario === "long" || scenario === "log-stress" || logMatrix) {
    await closePanel();
    await sleep(500);
    const upstream = await state();
    result.logCleanup = {
      opened: upstream.logOpened,
      closed: upstream.logClosed,
      remaining: upstream.logOpened - upstream.logClosed,
    };
    result.closedInventory = await inventory();
    result.goAfter = upstream.go;
    result.informerResyncs = upstream.sameVersionResyncs;
    if (scenario === "long" && duration >= 1200 && !result.informerResyncs)
      throw new Error(
        "Long run did not observe an actual informer resync boundary",
      );
  }
  if (
    scenario === "long" &&
    checkpoints.some((checkpoint) => !checkpoint.quiescentResourceCounts)
  ) {
    report.errors.push(
      "Long-run checkpoint did not return to the initial resource counts; inspect long-checkpoints.json",
    );
    process.exitCode = 1;
  }
  if (logMatrix) {
    const end = await state();
    result.logSource = {
      requestedLinePayloadBytes: scenario === "log-long" ? 65536 : 0,
      requestedInitialLines: scenario === 'log-long' ? 80 : logInitialLines,
      initial: {
        lines: logBefore.logWrittenLines,
        bytes: logBefore.logWrittenBytes,
      },
      producedLines: end.logWrittenLines - logBefore.logWrittenLines,
      producedBytes: end.logWrittenBytes - logBefore.logWrittenBytes,
      source:
        "Independent Go fixture, deterministic initial burst; gated until measured window",
    };
  }
  const integrity=[];
  result.clockWindow = measurementWindow(result);
  if (!result.clockWindow.valid) integrity.push('OS/browser measurement clocks differ; sleep or clock discontinuity invalidates this window');
  if(panelMatrix || logMatrix) {
    const expectedOpen=logMatrix || !scenario.startsWith('panel-closed');
    if(before.panel.open!==expectedOpen || after.panel.open!==expectedOpen || before.panel.title!==after.panel.title || before.panel.tab!==after.panel.tab) integrity.push('Panel title/tab/open state changed during steady window');
    const expectedLog=logMatrix && scenario!=='log-none';
    if(logMatrix && (Boolean(before.logView)!==expectedLog || Boolean(after.logView)!==expectedLog)) integrity.push('Log view disappeared during window');
    if(logMatrix && ['log-normal','log-long'].includes(scenario) && Math.abs(result.logSource.producedLines-duration*10)>2) integrity.push('Independent log producer did not maintain the planned 10 lines/s');
  }
  result.workloadIntegrity={valid:!integrity.length,reasons:integrity};
  if (events.length) {
    const upstream = await state();
    result.loadBands = loadBands(events, raw.messages, {
      burst: scenario === "events",
    });
    const expected = apply(initialResources, events);
    result.producer = {
      planned: events.length,
      completed: upstream.samples.length,
      errors: upstream.samples.filter((e) => e.error),
      delayMs: distribution(
        upstream.samples.map((e) => e.actualMs - e.plannedMs),
      ),
      applyMs: distribution(upstream.samples.map((e) => e.applyMs)),
      samples: upstream.samples,
    };
    const actual = Object.values(
      await page.evaluate(() => globalThis.__KUBEVIEW_BENCHMARK__.resources),
    );
    result.consistency = {
      clientMatchesUpstream:
        JSON.stringify(signature(actual)) ===
        JSON.stringify(signature(upstream.resources)),
      upstreamMatchesPlanned:
        JSON.stringify(signature(expected)) ===
        JSON.stringify(signature(upstream.resources)),
    };
    result.producer.valid =
      result.producer.completed === events.length &&
      !result.producer.errors.length &&
      result.producer.delayMs.p95 < 100;
  }
  if (repairPlan) {
    const repairAfter = await page.evaluate(readRepairSnapshot);
    const upstream = await state();
    const actualResources = Object.values(await page.evaluate(() => globalThis.__KUBEVIEW_BENCHMARK__.resources));
    result.repair = { eventsSHA256: hash(JSON.stringify(repairPlan.events)), plan: repairPlan, before: repairBefore, observations: repairObservations, after: repairAfter,
      acceptance: assessRepairRun(repairPlan, initialResources, { before: repairBefore, after: repairAfter, observations: repairObservations, upstream, actualResources, expectedVisible: { nodes: repairBefore.stats.lifecycle.visibleNodes, pods: repairBefore.stats.lifecycle.visiblePods } }) };
    if (!result.repair.acceptance.valid || (phase === "optimized" && result.repair.acceptance.visual.valid !== true)) { report.errors.push(`Repair canonical/visual gate failed ${profile}/${scenario}/${repeat}`); process.exitCode = 1; }
  }
  if (scenario === "long" && duration >= 1200 && ((duration === 1200 ? repairPanelCycles.length !== 20 : repairPanelCycles.length < 20) || repairPanelCycles.some(c => !c.valid))) {
    report.errors.push("Long run did not complete twenty verified panel/stream close-reopen cycles"); process.exitCode = 1;
  }
  await writeFile(
    path.join(out, `${profile}-${scenario}-${repeat}-raw.json`),
    JSON.stringify(raw),
  );
  if (args.includes("--capture"))
    await page.screenshot({
      path: path.join(out, `${profile}-${scenario}-${repeat}.png`),
    });
  report.runs.push(result);
  await save();
  if(integrity.length) throw Error(`Workload integrity: ${integrity.join('; ')}`);
  console.log(
    JSON.stringify({
      profile,
      scenario,
      repeat,
      fps: result.summary.renderedFPS,
      p95: result.summary.renderIntervalMs.p95,
      messages: result.summary.messages,
    }),
  );
}
const budget = setTimeout(
  () => {
    report.errors.push("Wall-time guard exceeded configured maximum");
    child?.kill("SIGTERM");
    if (browserServer) browserServer.kill().catch(() => {});
    else browser?.close().catch(() => {});
  },
  Number(option("max-minutes", "120")) * 60000,
);
try {
  if (process.platform === "darwin")
    awake = spawn("/usr/bin/caffeinate", ["-di", "-w", String(process.pid)], {
      stdio: "ignore",
    });
  const launcher = browserName === "webkit" ? webkit : chromium;
  if (
    browserName === "chromium" &&
    args.includes("--disable-browser-energy-saver")
  ) {
    ownedBrowserProfile = await mkdtemp(
      path.join(os.tmpdir(), "kubeview-benchmark-power-"),
    );
    const initialContext = await launcher.launchPersistentContext(
      ownedBrowserProfile,
      {
        headless: false,
        args: ["--use-angle=metal", "--enable-precise-memory-info"],
      },
    );
    browser = initialContext.browser();
    const powerPage =
      initialContext.pages()[0] || (await initialContext.newPage());
    await powerPage.goto("chrome://settings/performance");
    manifest.browserEnergySaver = await powerPage.evaluate(async () => {
      const key = "performance_tuning.battery_saver_mode.state";
      const get = () =>
        new Promise((resolve) => chrome.settingsPrivate.getPref(key, resolve));
      const before = await get();
      const ok = await new Promise((resolve) =>
        chrome.settingsPrivate.setPref(key, 0, "", resolve),
      );
      const after = await get();
      return {
        before,
        after,
        ok,
        scope:
          "Owned temporary benchmark profile only; separate launcher protocol, not comparable to default-state auxiliary runs",
      };
    });
    if (
      !manifest.browserEnergySaver.ok ||
      manifest.browserEnergySaver.after.value !== 0
    )
      throw Error("Cannot fix benchmark browser energy saver state");
    await powerPage.close();
    const rows = command("ps", ["-axo", "pid=,ppid=,command="]).split("\n");
    const own = rows.find(
      (row) =>
        row.includes(`--user-data-dir=${ownedBrowserProfile}`) &&
        Number(row.trim().split(/\s+/)[1]) === process.pid,
    );
    if (!own) throw Error("Owned Chromium PID unavailable");
    browserPID = Number(own.trim().split(/\s+/)[0]);
  } else {
    browserServer = await launcher.launchServer({
      headless: false,
      args:
        browserName === "chromium"
          ? ["--use-angle=metal", "--enable-precise-memory-info"]
          : [],
    });
    browserPID = browserServer.process().pid;
    browser = await launcher.connect(browserServer.wsEndpoint());
  }
  manifest.browserVersion = browser.version();
  for (const profile of profiles) {
    await launchProfile(profile);
    for (let repeat = repeatOffset; repeat < repeats + repeatOffset; repeat++)
      for (const scenario of (panelMatrix || logMatrix) &&
      (repeat + Number(args.includes("--reverse-order"))) % 2
        ? [...scenarios].reverse()
        : scenarios)
        await run(profile, scenario, repeat);
  }
} catch (e) {
  report.errors.push(e.stack);
  process.exitCode = 1;
} finally {
  clearTimeout(budget);
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (browserServer) await browserServer.close().catch(() => {});
  if (ownedBrowserProfile)
    await rm(ownedBrowserProfile, { recursive: true, force: true });
  if (child) child.kill("SIGTERM");
  awake?.kill("SIGTERM");
  manifest.finishedAt = new Date().toISOString();
  manifest.powerAfter = maybe("pmset", ["-g", "batt"]);
  const finalSource = manifest.powerAfter?.includes("AC Power")
    ? "AC"
    : manifest.powerAfter?.includes("Battery Power")
      ? "battery"
      : null;
  if (
    manifest.powerSource &&
    finalSource &&
    manifest.powerSource !== finalSource
  ) {
    report.errors.push(
      "Power source changed before final sample; repeat under fixed power",
    );
    process.exitCode = 1;
  }
  await writeFile(
    path.join(out, "process-samples.json"),
    JSON.stringify(samples),
  );
  await save();
  console.log(`Results: ${out}`);
}
