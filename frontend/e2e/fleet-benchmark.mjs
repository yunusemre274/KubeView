// Explicit synthetic fixture; no real API mutations. Headed Metal is verified in report.
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import {
  HarborRoute,
  vesselHitsLand,
  vesselsOverlap,
} from "../src/harbor/fleet.js";
const base = process.env.BASE_URL || "http://127.0.0.1:5173",
  out = "../docs/evidence/motion/fleet-performance.json";
const browser = await chromium.launch({
  headless: false,
  args:
    process.platform === "darwin"
      ? ["--use-angle=metal", "--enable-precise-memory-info"]
      : ["--enable-precise-memory-info"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  }),
  page = await context.newPage(),
  cdp = await context.newCDPSession(page);
const report = {
  date: new Date().toISOString(),
  browser: browser.version(),
  viewport: "1440×900 CSS px",
  quality: "medium",
  device: {
    platform: os.platform(),
    release: os.release(),
    cpu: os.cpus()[0].model,
    threads: os.cpus().length,
    memoryMiB: os.totalmem() / 1048576,
  },
  inputSuppressed: true,
  sameUIDResyncs: 0,
  source: "Synthetic fixture; no Kubernetes mutations",
  matrix: [],
  churn: [],
  errors: [],
  collisions: [],
  hidden: null,
};
page.on("pageerror", (e) => report.errors.push(e.message));
const dump = () => writeFile(out, JSON.stringify(report, null, 2));
async function ready(nodes, pods) {
  await page.goto(
    `${base}/src/harbor/qa.html?fullscreen=1&nodes=${nodes}&pods=${pods}`,
  );
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.fleetStates?.().length > 0,
  );
  await page.addStyleTag({
    content: "html,body,* {pointer-events:none!important}",
  });
  await page.waitForTimeout(700);
}
async function sample() {
  return page.evaluate(() => {
    const c = document.querySelector("canvas"),
      h = c.__harbor,
      g = c.getContext("webgl2"),
      e = g.getExtension("WEBGL_debug_renderer_info");
    return {
      stats: h.stats(),
      fleet: h.fleetStates(),
      renderer: g.getParameter(e.UNMASKED_RENDERER_WEBGL),
      water: {
        time: h.scene.getObjectByName("harbor:ocean").material.userData
          .oceanUniforms.uWaterTime.value,
        strength:
          h.scene.getObjectByName("harbor:ocean").material.userData
            .oceanUniforms.uWaterStrength.value,
      },
      visible: !document.hidden,
    };
  });
}
try {
  for (const [nodes, pods] of [
    [20, 300],
    [50, 1500],
  ]) {
    await ready(nodes, pods);
    for (const [patrol, sea, panel] of [
      [true, true, false],
      [true, false, false],
      [false, true, false],
      [false, false, false],
      [true, true, true],
    ]) {
      await page.evaluate(
        ({ patrol, sea, panel }) => {
          window.harborQA.setPreferences({ patrol, sea });
          window.harborQA.setPanelOpen(panel);
        },
        { patrol, sea, panel },
      );
      await page.waitForTimeout(1700);
      const before = await sample(),
        start = Date.now();
      await page.waitForTimeout(3000);
      const after = await sample(),
        elapsed = Date.now() - start;
      report.matrix.push({
        nodes,
        pods,
        patrol,
        sea,
        panel,
        elapsedMs: elapsed,
        renderedFrames: after.stats.frame - before.stats.frame,
        renderedFPS:
          (after.stats.frame - before.stats.frame) / (elapsed / 1000),
        before,
        after,
      });
      await dump();
    }
  }
  await ready(20, 300);
  const start = Date.now(),
    route = new HarborRoute();
  let previous = null,
    totalDistance = 0,
    cycle = 0,
    lastSample = 0,
    hiddenDone = false;
  const duration = Number(process.env.CHURN_MS || 600000);
  const shipDistances = new Map(), priorShips = new Map();
  report.routeLength = route.length;
  report.periodAtNormalSpeed = route.length / 9;
  while (Date.now() - start < duration) {
    const elapsed = Date.now() - start;
    if (!hiddenDone && elapsed > 500000) {
      const before = await sample(),
        cover = await context.newPage();
      await cover.goto("about:blank");
      await cover.bringToFront();
      await page.waitForTimeout(500);
      const actuallyHidden = await page.evaluate(() => document.hidden);
      await page.evaluate(() => {
        window.__backgroundCounts = [];
        for (let i = 0; i < 200; i++) {
          const uid = `background-${i}`;
          window.harborQA.flush(() => window.harborQA.pending(uid));
          if (i === 0)
            window.__backgroundCounts.push(
              window.harborQA.stats().lifecycle.canonicalPods,
            );
          window.harborQA.flush(() =>
            window.harborQA.schedule(uid, "worker-08"),
          );
          window.harborQA.flush(() => window.harborQA.remove(uid));
        }
        window.__backgroundCounts.push(
          window.harborQA.stats().lifecycle.canonicalPods,
        );
      });
      await new Promise((resolve) => setTimeout(resolve, 60000));
      await page.bringToFront();
      await cover.close();
      await page.waitForTimeout(500);
      const after = await sample();
      report.hidden = {
        actuallyHidden,
        before,
        after,
        updates: 600,
        canonicalCounts: await page.evaluate(() => window.__backgroundCounts),
      };
      hiddenDone = true;
    }
    if (cycle % 20 === 0) {
      const uid = `motion-churn-${cycle}`;
      await page.evaluate((uid) => window.harborQA.pending(uid), uid);
      await page.waitForTimeout(80);
      await page.evaluate(
        (uid) => window.harborQA.schedule(uid, "worker-08"),
        uid,
      );
      await page.waitForTimeout(100);
      await page.evaluate((uid) => window.harborQA.remove(uid), uid);
    }
    if (cycle > 0 && cycle % 60 === 0) {
      await page.evaluate(
        (cycle) =>
          window.harborQA.setResources((list) =>
            list.map((r) => ({
              ...r,
              metadata: {
                ...r.metadata,
                resourceVersion: `qa-resync-${cycle}`,
              },
            })),
          ),
        cycle,
      );
      report.sameUIDResyncs++;
    }
    if (cycle % 40 === 0) {
      await page.evaluate(
        (open) => window.harborQA.setPanelOpen(open),
        cycle % 80 === 0,
      );
    }
    const current = await sample(),
      first = current.fleet.find((s) => s.uid === "fixture-node-0");
    for(const ship of current.fleet){const prior=priorShips.get(ship.uid);if(prior&&["patrolling","route-hold"].includes(prior.state)&&["patrolling","route-hold"].includes(ship.state)){const advance=(ship.progress-prior.progress+route.length)%route.length;if(advance<100)shipDistances.set(ship.uid,(shipDistances.get(ship.uid)||0)+advance)}priorShips.set(ship.uid,ship)}
    report.perShipLaps=Object.fromEntries([...shipDistances].map(([uid,metres])=>[uid,metres/route.length]));
    if (first && previous) {
      const advance = (first.progress - previous + route.length) % route.length;
      if (advance < 100) totalDistance += advance;
      else report.errors.push(`unexpected route jump ${advance}`);
    }
    if (first) previous = first.progress;
    for (let i = 0; i < current.fleet.length; i++) {
      const ship = current.fleet[i];
      if (vesselHitsLand(ship))
        report.collisions.push({ at: elapsed, type: "land", uid: ship.uid });
      for (let j = i + 1; j < current.fleet.length; j++)
        if (vesselsOverlap(ship, current.fleet[j]))
          report.collisions.push({
            at: elapsed,
            type: "ship",
            uids: [ship.uid, current.fleet[j].uid],
          });
    }
    if (elapsed - lastSample > 10000) {
      await cdp.send("HeapProfiler.collectGarbage");
      report.churn.push({
        elapsedMs: elapsed,
        cycle,
        totalDistance,
        laps: totalDistance / route.length,
        heap: await cdp.send("Runtime.getHeapUsage"),
        ...current,
      });
      lastSample = elapsed;
      await dump();
    }
    cycle++;
    await page.waitForTimeout(900);
  }
  await page.evaluate(() => window.harborQA.setPanelOpen(false));
  await page.waitForTimeout(1200);
  report.durationMs = Date.now() - start;
  report.cycles = cycle;
  report.totalLaps = totalDistance / route.length;
  report.final = await sample();
  await dump();
  console.log({
    matrix: report.matrix.map(
      ({ nodes, pods, patrol, sea, panel, renderedFPS }) => ({
        nodes,
        pods,
        patrol,
        sea,
        panel,
        renderedFPS,
      }),
    ),
    laps: report.totalLaps,
    collisions: report.collisions.length,
    errors: report.errors,
  });
} finally {
  await dump();
  await browser.close();
}
