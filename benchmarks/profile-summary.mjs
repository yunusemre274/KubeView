// Small checked-in summaries accompany ignored, heavyweight CDP profiles.
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.resolve(
  root,
  process.argv[2] || "benchmarks/results/v3-diagnostic-baseline-cpu",
);
const results = [];
for (const file of await readdir(path.join(directory, "traces"))) {
  if (!/\.(cpuprofile|heapprofile)$/.test(file)) continue;
  const p = JSON.parse(
    await readFile(path.join(directory, "traces", file), "utf8"),
  );
  const totals = new Map();
  const add = (frame, size) => {
    const key = `${frame.functionName || "(anonymous)"} ${frame.url || "(native)"}:${frame.lineNumber + 1}:${frame.columnNumber + 1}`;
    totals.set(key, (totals.get(key) || 0) + size);
  };
  let unit, method;
  if (p.nodes) {
    const nodes = new Map(p.nodes.map((node) => [node.id, node]));
    for (let i = 0; i < p.samples.length; i++)
      add(nodes.get(p.samples[i]).callFrame, p.timeDeltas[i] || 0);
    unit = "sampled wall microseconds";
    method =
      "CDP sampled self time; idle/native included. Not total OS process CPU or GPU time.";
  } else {
    const visit = (node) => {
      add(node.callFrame, node.selfSize);
      for (const child of node.children) visit(child);
    };
    visit(p.head);
    unit = "estimated sampled V8 allocation bytes";
    method =
      "Sampling allocation profile with collected objects included; excludes native DOM/GPU memory and does not measure retained heap. Higher frame rate can increase total frame allocations.";
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  results.push({
    file,
    unit,
    method,
    total,
    top: [...totals]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([location, value]) => ({
        location,
        value,
        percent: total ? (value / total) * 100 : null,
      })),
  });
}
await writeFile(
  path.join(directory, "profile-summary.json"),
  JSON.stringify(results, null, 2),
);
console.log(
  results.map((result) => ({
    file: result.file,
    total: result.total,
    unit: result.unit,
    top: result.top.slice(0, 5),
  })),
);
