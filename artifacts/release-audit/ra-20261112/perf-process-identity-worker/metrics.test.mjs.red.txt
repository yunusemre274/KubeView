import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize, cpuSeconds, loadBands, measurementWindow, processMetrics } from "./metrics.mjs";
test('measurement windows allow boundary IPC overhead and reject sleep/time jumps',()=>{
  const run=(wall,active=60044)=>({osBefore:{time:100},osAfter:{time:wall+100},summary:{durationMs:active}});
  assert.equal(measurementWindow(run(60273)).valid,true);
  assert.equal(measurementWindow(run(652699,60072.7)).valid,false);
  assert.equal(measurementWindow(run(30000)).valid,false);
  assert.equal(measurementWindow(run(0,0)).valid,false);
});
test("render rate is total frames/active wall time; missing metrics stay null", () => {
  const s = summarize({
    durationMs: 1000,
    frames: [
      { start: 0, jsSubmitMs: 2, calls: 10, triangles: 100 },
      { start: 100, jsSubmitMs: 3, calls: 10, triangles: 100 },
    ],
    messages: [],
    inputs: [],
    longTasks: [],
    errors: [],
  });
  assert.equal(s.renderedFPS, 2);
  assert.equal(s.renderIntervalMs.p95, 100);
  assert.equal(s.callbackToStoreMs.p95, null);
  assert.equal(s.presentedFPS, null);
  assert.equal(cpuSeconds("01:02.50"), 62.5);
});
test("load correlation uses opaque RV equality and handles DELETE's last stored version", () => {
  const events = [
    {
      action: "ADD",
      object: { metadata: { uid: "u", resourceVersion: "opaque-a" } },
      atMs: 25100,
      sequence: 1,
    },
    {
      action: "DELETE",
      object: {
        metadata: { uid: "u", resourceVersion: "request-only-version" },
      },
      atMs: 25200,
      sequence: 2,
    },
  ];
  const rows = [
    { action: "ADD", uid: "u", version: "opaque-a", callbackToStoreMs: 2 },
    { action: "DELETE", uid: "u", version: "opaque-a", callbackToStoreMs: 3 },
  ];
  const bands = loadBands(events, rows);
  assert.equal(bands.burst.received, 2);
  assert.equal(rows[1].sequence, 2);
});

// Deterministic regressions: no OS child or performance window in these cases.
const identityRow = (pid, cpuSeconds, extra = {}) => ({ pid, ppid: 50, birth: "2026-11-12T16:00:00.000Z", birthSource: "darwin-ps-lstart", command: "/Google Chrome for Testing", cohort: "browser", role: "browser-main", cpuSeconds, rssKiB: 100, ...extra });
const processPair = (a, b, end = 1000) => [{ time: 0, processes: a }, { time: end, processes: b }];
test("identity regression rejects same PID with a new OS birth", () => {
  const [a,b] = processPair([identityRow(1, 2)], [identityRow(1, 3, { birth: "2026-11-12T16:00:01.000Z" })]);
  assert.equal(processMetrics(a,b).browserCores, null);
});
test("identity regression never publishes a falling CPU counter", () => {
  const [a,b] = processPair([identityRow(1, 2)], [identityRow(1, 1)]);
  assert.equal(processMetrics(a,b).browserCores, null);
});
test("identity regression rejects zero span and missing OS birth", () => {
  const [a,b] = processPair([identityRow(1, 2)], [identityRow(1, 3)], 0);
  assert.equal(processMetrics(a,b).browserCores, null);
  b.time = 1000; delete a.processes[0].birth;
  assert.equal(processMetrics(a,b).browserCores, null);
});
test("identity regression unknown role metrics are null rather than synthetic zero", () => {
  const [a,b] = processPair([identityRow(1, 0, {command:"/frozen/backend.test", cohort:"backend", role:"backend"})], [identityRow(1, 1, {command:"/frozen/backend.test", cohort:"backend", role:"backend"})]);
  assert.equal(processMetrics(a,b).browserCores, null);
  assert.equal(processMetrics(a,b).maxBrowserProcessRSSKiB, null);
});
