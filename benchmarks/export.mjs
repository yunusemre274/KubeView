// Export completed primary runs. Never infer a successful run from partial files.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { distribution, processMetrics } from "./metrics.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prefix = process.argv[2] || "v3";
if (!/^[\w.-]+$/.test(prefix)) throw new Error("Invalid result prefix");
const directory = path.join(root, "benchmarks/results", `${prefix}-export`);
await mkdir(directory, { recursive: true });
const accepted = await readFile(
  path.join(directory, "accepted-runs.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return {};
    throw error;
  });
const excluded = await readFile(
  path.join(directory, "unavailable-runs.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return {};
    throw error;
  });
const rows = [],
  unavailable = [];
for (const profile of ["S", "M", "L"])
  for (const scenario of profile === "M"
    ? [
        "living",
        "events",
        "water-off",
        "ships-off",
        "idle",
        "panel",
        "interaction",
        "log-stress",
        "long",
      ]
    : ["living"])
    for (const phase of scenario === "long"
      ? ["optimized"]
      : ["baseline", "optimized"]) {
      const id =
        accepted[`${profile}/${scenario}/${phase}`]?.id ||
        excluded[`${profile}/${scenario}/${phase}`]?.id ||
        `${prefix}-${profile}-${scenario}-${phase}`;
      let report;
      try {
        report = JSON.parse(
          await readFile(
            path.join(root, "benchmarks/results", id, "summary.json"),
            "utf8",
          ),
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        unavailable.push({ id, reason: "not run" });
        continue;
      }
      if (!report.manifest.finishedAt || report.errors.length) {
        unavailable.push({
          id,
          reason: "incomplete/errors",
          errors: report.errors,
        });
        continue;
      }
      for (const run of report.runs) {
        const base = {
          id,
          profile,
          scenario,
          phase,
          repeat: run.repeat,
          power: report.manifest.powerSource,
          canonicalNodes: run.before.stats.lifecycle.canonicalNodes,
          canonicalPods: run.before.stats.lifecycle.canonicalPods,
          visibleNodes: run.before.stats.lifecycle.visibleNodes,
          visiblePods: run.before.stats.lifecycle.visiblePods,
        };
        const values = {
          renderedFPS: run.summary.renderedFPS,
          intervalP50Ms: run.summary.renderIntervalMs.p50,
          intervalP95Ms: run.summary.renderIntervalMs.p95,
          intervalP99Ms: run.summary.renderIntervalMs.p99,
          jsSubmitP50Ms: run.summary.jsSubmitMs.p50,
          jsSubmitP95Ms: run.summary.jsSubmitMs.p95,
          gapsOver50Ms: run.summary.gapsOver50Ms,
          gapsOver100Ms: run.summary.gapsOver100Ms,
          callsP50: run.summary.calls.p50,
          trianglesP50: run.summary.triangles.p50,
          panelDomP95Ms: run.summary.panelDomProxyMs.p95,
          panelRafP95Ms: run.summary.panelRafProxyMs.p95,
          storeP95Ms: run.summary.callbackToStoreMs.p95,
          drawProxyP95Ms: run.summary.drawProxyMs.p95,
          heapBeforeBytes: run.before.heap?.used ?? null,
          heapAfterBytes: run.after.heap?.used ?? null,
          geometries: run.after.stats.memory.geometries,
          textures: run.after.stats.memory.textures,
          producerDelayP95Ms: run.producer?.delayMs.p95 ?? null,
          producerApplyP95Ms: run.producer?.applyMs.p95 ?? null,
          ...processMetrics(run.osBefore, run.osAfter),
        };
        for (const [band, metrics] of Object.entries(run.loadBands || {})) {
          values[`${band}Received`] = metrics.received;
          values[`${band}StoreP95Ms`] = metrics.callbackToStoreMs.p95;
          values[`${band}DrawP95Ms`] = metrics.drawProxyMs.p95;
        }
        for (const [metric, value] of Object.entries(values))
          rows.push({ ...base, metric, value });
      }
    }
const groups = new Map();
for (const row of rows) {
  const key = `${row.profile}/${row.scenario}/${row.phase}/${row.metric}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row.value);
}
const medians = [...groups].map(([key, values]) => ({
  key,
  ...distribution(values),
}));
const quote = (value) =>
  value === null || value === undefined
    ? "N/A"
    : `"${String(value).replaceAll('"', '""')}"`;
const csv = (list) => {
  if (!list.length) return "";
  const keys = Object.keys(list[0]);
  return (
    [
      keys.join(","),
      ...list.map((row) => keys.map((key) => quote(row[key])).join(",")),
    ].join("\n") + "\n"
  );
};
await Promise.all([
  writeFile(path.join(directory, "runs.csv"), csv(rows)),
  writeFile(path.join(directory, "medians.csv"), csv(medians)),
  writeFile(
    path.join(directory, "summary.json"),
    JSON.stringify(
      {
        prefix,
        generated: new Date().toISOString(),
        rows,
        medians,
        unavailable,
        note: "Per-repetition p95 summarized across runs, not a pooled percentile. FPS counts actual JS WebGL submits, not presentation. Idle long intervals are intentional. Heap has no forced GC. RSS per PID, never sum as physical RAM.",
      },
      null,
      2,
    ),
  ),
]);
console.log({
  directory,
  measurements: rows.length,
  groups: medians.length,
  unavailable,
});
