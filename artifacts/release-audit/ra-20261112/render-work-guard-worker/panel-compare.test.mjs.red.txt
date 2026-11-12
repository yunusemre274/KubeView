import test from "node:test";
import assert from "node:assert/strict";
import { processCoverage, comparePanels } from "./panel-compare.mjs";
const stableBackend = cpuSeconds => ({pid:99,ppid:50,birth:"2026-11-12T16:00:00.000Z",birthSource:"darwin-ps-lstart",cohort:"backend",role:"backend",command:"/frozen/backend.test",cpuSeconds,rssKiB:50});
test("process coverage flags even an intermediate browser child that exits before final sample", () => {
  const p = (pid, cpuSeconds) => ({
    pid, ppid: 50, birth: "2026-11-12T16:00:00.000Z", birthSource: "darwin-ps-lstart", cohort: "browser", role: pid === 1 ? "browser-main" : "browser-other",
    cpuSeconds,
    command: "/Google Chrome for Testing",
    rssKiB: 100,
  });
  const run = {
    summary: { durationMs: 1000 },
    osBefore: { time: 0, processes: [p(1, 0), stableBackend(0)] },
    osAfter: { time: 1000, processes: [p(1, 1), stableBackend(.1)] },
  };
  assert.equal(processCoverage(run).complete, true);
  const r = processCoverage(run, [
    { time: 500, processes: [p(1, 0.5), p(2, 0.2), stableBackend(.05)] },
  ]);
  assert.equal(r.complete, false);
  assert.deepEqual(r.churn, [2]);
});
test("sleep-diluted CPU is rejected even with stable browser PIDs", () => {
  const p = cpuSeconds => ({pid:1,ppid:50,birth:'2026-11-12T16:00:00.000Z',birthSource:'darwin-ps-lstart',cohort:'browser',role:'browser-main',cpuSeconds,command:'Chrome',rssKiB:100});
  const run = { osBefore:{time:0,processes:[p(0)]}, osAfter:{time:652699,processes:[p(30)]}, summary:{durationMs:60072.7} };
  const coverage=processCoverage(run);
  assert.deepEqual(coverage.churn,[]);
  assert.equal(coverage.complete,false);
  assert.equal(coverage.clockWindow.valid,false);
});
function panelReport() {
  const m = {
    id: "test",
    finishedAt: "now",
    params: { warmup: 30, seconds: 60 },
  };
  const scenarios = [
    "panel-closed",
    "panel-open",
    "panel-closed-events",
    "panel-open-events",
  ];
  const runs = Array.from({ length: 3 }, (_, repeat) =>
    scenarios.map((scenario) => ({
      scenario,
      repeat,
      before: { stats: { calls: 426, triangles: 71170, lines: 60, points: 0, memory: { geometries: 32, textures: 4 }, lifecycle: {} }, fleet: [] },
      after: { stats: { calls: 434, triangles: 72322, lines: 60, points: 0, memory: { geometries: 35, textures: 4 } } },
      osBefore: {
        time: 0,
        processes: [{pid:1,ppid:50,birth:"2026-11-12T16:00:00.000Z",birthSource:"darwin-ps-lstart",cohort:"browser",role:"browser-main",cpuSeconds:0,command:"Chrome",rssKiB:100}, stableBackend(0)],
      },
      osAfter: {
        time: 60000,
        processes: [
          {
            pid: 1, ppid:50, birth:"2026-11-12T16:00:00.000Z",birthSource:"darwin-ps-lstart",cohort:"browser",role:"browser-main",
            cpuSeconds: scenario.includes("open") ? 12 : 18,
            command: "Chrome",
            rssKiB: 100,
          }, stableBackend(.1),
        ],
      },
      summary: {
        durationMs: 60000,
        renderedFrames: 3600,
        renderedFPS: 60,
        renderIntervalMs: { p95: 17, p99: 18 },
        jsSubmitMs: { p95: 1 },
        callbackToStoreMs: { p95: null },
        drawProxyMs: { p95: null },
        calls: { n: 3600, p50: 434, p95: 438, p99: 443, min: 433, max: 444 },
        triangles: { n: 3600, p50: 72322, p95: 72538, p99: 72638, min: 72178, max: 72830 },
      },
    })),
  ).flat();
  return { manifest: m, runs, errors: [] };
}
test("paired comparison retains negative deltas and rejects a missing/duplicate cell", () => {
  const report = panelReport(), runs = report.runs;
  const result = comparePanels([report], [report]);
  assert.equal(result.comparable, true);
  assert.ok(result.deltas[0][0].signedDelta.p50 < 0);
  assert.equal(
    comparePanels([report], [{ ...report, runs: runs.slice(1) }]).comparable,
    false,
  );
});

test("submitted-work differences require review without changing CPU or signed deltas", () => {
  const before = panelReport(), after = panelReport();
  const reference = comparePanels([before], [after]);
  after.runs[7].before.stats.calls += 1;
  after.runs[7].before.stats.lines += 12;
  const result = comparePanels([before], [after]);
  assert.equal(result.comparable, false);
  assert.equal(result.renderWorkReview.status, "REQUIRES_RENDER_EQUIVALENCE_REVIEW");
  assert.ok(result.reasons.some(reason => reason.includes("REQUIRES_RENDER_EQUIVALENCE_REVIEW")));
  assert.ok(result.renderWorkReview.pairs.some(pair => pair.differences.some(row => row.path === "before.stats.lines" && row.after - row.before === 12)));
  assert.deepEqual(result.table, reference.table);
  assert.deepEqual(result.deltas, reference.deltas);
});

test("submitted-work comparison pairs the same block and scenario", () => {
  const before = panelReport(), after = panelReport();
  for (const report of [before, after]) report.runs[1].before.stats.calls += 4;
  const result = comparePanels([before], [after]);
  assert.equal(result.comparable, true);
  assert.equal(result.renderWorkReview.status, "MATCHED_COUNTERS_ONLY");
});

test("render distribution sample counts may differ but must be positive", () => {
  const before = panelReport(), after = panelReport();
  after.runs[0].summary.calls.n += 1;
  after.runs[0].summary.triangles.n += 1;
  assert.equal(comparePanels([before], [after]).comparable, true);
  after.runs[0].summary.calls.n = 0;
  const result = comparePanels([before], [after]);
  assert.equal(result.comparable, false);
  assert.equal(result.renderWorkReview.status, "UNKNOWN");
});

test("missing or nonfinite submitted-work metadata is UNKNOWN rather than zero", () => {
  const mutations = [
    run => { delete run.before.stats.calls; },
    run => { run.after.stats.triangles = NaN; },
    run => { delete run.after.stats.points; },
    run => { delete run.summary.calls.p95; },
    run => { run.summary.triangles.max = Infinity; },
    run => { delete run.summary.triangles; },
  ];
  for (const mutate of mutations) {
    const before = panelReport(), after = panelReport();
    mutate(after.runs[0]);
    const result = comparePanels([before], [after]);
    assert.equal(result.comparable, false);
    assert.equal(result.renderWorkReview.status, "UNKNOWN");
    assert.ok(result.renderWorkReview.pairs[0].unknowns.length);
    assert.ok(result.deltas[0][0].signedDelta.p50 < 0);
  }
});

test("legacy inputs missing render counters on both sides cannot pass automatically", () => {
  const before = panelReport(), after = panelReport();
  delete before.runs[0].before.stats.calls;
  delete after.runs[0].before.stats.calls;
  const result = comparePanels([before], [after]);
  assert.equal(result.comparable, false);
  assert.equal(result.renderWorkReview.status, "UNKNOWN");
});

test("allocation-only differences are observations and do not imply extra submitted work", () => {
  const before = panelReport(), after = panelReport();
  after.runs[0].after.stats.memory.geometries += 1;
  after.runs[0].after.stats.memory.textures += 1;
  const result = comparePanels([before], [after]);
  assert.equal(result.comparable, true);
  assert.equal(result.renderWorkReview.status, "MATCHED_COUNTERS_ONLY");
  assert.equal(result.renderWorkReview.allocationObservations.filter(row => row.status === "DIFFERENT").length, 2);
});

test("batching changes require semantic and visual review without a performance verdict", () => {
  const before = panelReport(), after = panelReport();
  const reference = comparePanels([before], [after]);
  const run = after.runs[0];
  run.before.stats.calls -= 10;
  run.after.stats.calls -= 10;
  for (const key of ["p50", "p95", "p99", "min", "max"]) run.summary.calls[key] -= 10;
  const result = comparePanels([before], [after]);
  assert.equal(result.comparable, false);
  assert.equal(result.renderWorkReview.status, "REQUIRES_RENDER_EQUIVALENCE_REVIEW");
  assert.match(result.renderWorkReview.interpretation, /semantic.*visual/);
  assert.deepEqual(result.table, reference.table);
  assert.deepEqual(result.deltas, reference.deltas);
});

const born = (pid, cpuSeconds, birth="2026-11-12T16:00:00.000Z") => ({pid,ppid:50,birth,birthSource:"darwin-ps-lstart",command:"/Google Chrome for Testing",cohort:"browser",role:"browser-main",cpuSeconds,rssKiB:100});
test("identity regression rejects simultaneous child exit and PID reuse",()=>{
 const run={summary:{durationMs:1000},osBefore:{time:0,processes:[born(1,0),born(2,0),stableBackend(0)]},osAfter:{time:1000,processes:[born(1,1),born(2,1,"2026-11-12T16:00:01.000Z"),stableBackend(.1)]}};
 assert.equal(processCoverage(run).complete,false);
 assert.equal(processCoverage(run).browserCores,null);
});
test("identity regression rejects a sampled cohort disappearance even when endpoints match",()=>{
 const run={summary:{durationMs:1000},osBefore:{time:0,processes:[born(1,0),born(2,0),stableBackend(0)]},osAfter:{time:1000,processes:[born(1,1),born(2,1),stableBackend(.1)]}};
 assert.equal(processCoverage(run,[{time:500,processes:[born(1,.5),stableBackend(.05)]}]).complete,false);
});
