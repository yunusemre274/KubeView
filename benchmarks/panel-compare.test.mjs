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
test("paired comparison retains negative deltas and rejects a missing/duplicate cell", () => {
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
      before: { stats: { lifecycle: {} }, fleet: [] },
      after: {},
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
      },
    })),
  ).flat();
  const report = { manifest: m, runs, errors: [] };
  const result = comparePanels([report], [report]);
  assert.equal(result.comparable, true);
  assert.ok(result.deltas[0][0].signedDelta.p50 < 0);
  assert.equal(
    comparePanels([report], [{ ...report, runs: runs.slice(1) }]).comparable,
    false,
  );
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
