// Run separately from browser FPS: exact production cache/sanitize/marshal path.
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fixture, VERSION } from "./fixtures.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = process.argv[2] || `backend-${Date.now()}`,
  out = path.join(root, "benchmarks/results", id),
  data = path.join(root, "benchmarks/.build");
if (!/^[\w.-]+$/.test(id)) throw new Error("Invalid run id");
try {
  await access(path.join(out, "manifest.json"));
  throw new Error(`Run already exists: ${id}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(path.join(out, "traces"), { recursive: true });
await mkdir(data, { recursive: true });
for (const profile of ["S", "M", "L"])
  await writeFile(
    path.join(data, `fixture-${profile}.json`),
    JSON.stringify(fixture(profile)),
  );
const command = (bin, args) =>
  execFileSync(bin, args, { cwd: root, encoding: "utf8" }).trim();
const hash = (value) => createHash("sha256").update(value).digest("hex");
const metadata = {
  started: new Date().toISOString(),
  status: "running",
  fixtureVersion: VERSION,
  fixtureSHA256: Object.fromEntries(
    await Promise.all(
      ["S", "M", "L"].map(async (profile) => [
        profile,
        hash(await readFile(path.join(data, `fixture-${profile}.json`))),
      ]),
    ),
  ),
  commit: command("git", ["rev-parse", "HEAD"]),
  trackedDiffSHA256: hash(command("git", ["diff", "--binary"])),
  hardware: command("system_profiler", ["SPHardwareDataType"])
    .split("Serial Number")[0]
    .trim(),
  os: command("sw_vers", []),
  powerBefore: command("pmset", ["-g", "batt"]),
  powerSettings: command("pmset", ["-g", "custom"]),
  go: command("go", ["version"]),
  source:
    "Seeded complete resources, actual cache/sanitize/marshal. Go generator and fake upstream share one process. CPU/heap diagnostic and race are separate from timing micro results.",
  raceIsNotPerformance: true,
};
await writeFile(
  path.join(out, "manifest.json"),
  JSON.stringify(metadata, null, 2),
);
const env = {
  ...process.env,
  KUBEVIEW_TEST_CONTEXT: "",
  KUBEVIEW_TEST_NAMESPACE: "",
  KUBEVIEW_BENCH_FIXTURE: "",
  KUBEVIEW_BENCH_FIXTURES: data,
  KUBEVIEW_BENCH_RESULT_DIR: out,
  KUBEVIEW_BENCH_NETWORK: "1",
};
const run = async (name, args, extraEnv = {}) => {
  console.log(`Go ${name} started`);
  const output = execFileSync("go", ["-C", "backend", "test", ...args], {
    cwd: root,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    maxBuffer: 16 << 20,
  });
  await writeFile(path.join(out, `${name}.txt`), output);
  console.log(output);
};
await run("micro", [
  "./pkg/server",
  "-run",
  "^$",
  "-bench",
  "BenchmarkSnapshotCacheSanitizeMarshal",
  "-benchmem",
  "-count",
  "5",
  "-benchtime",
  "1s",
]);
await run("cpu-heap-profile", [
  "./pkg/server",
  "-run",
  "^$",
  "-bench",
  "BenchmarkSnapshotCacheSanitizeMarshal/300$",
  "-benchtime",
  "3s",
  "-cpuprofile",
  path.join(out, "traces/cpu.pprof"),
  "-memprofile",
  path.join(out, "traces/heap.pprof"),
  "-o",
  path.join(data, "profile.test"),
]);
await run("network", [
  "./pkg/server",
  "-run",
  "^TestBenchmarkSlowReaderReconnect$",
  "-v",
]);
await run(
  "race",
  [
    "-race",
    "./pkg/server",
    "-run",
    "TestBenchmarkSlowReaderReconnect|TestInformerWebSocketSnapshotAddUpdateDelete",
    "-v",
  ],
  { KUBEVIEW_BENCH_RESULT_DIR: path.join(out, "race") },
);
await run("tests", ["./..."]);
for (const [type, file] of [
  ["cpu", "cpu.pprof"],
  ["heap", "heap.pprof"],
]) {
  const text = execFileSync(
    "go",
    [
      "tool",
      "pprof",
      "-top",
      path.join(data, "profile.test"),
      path.join(out, "traces", file),
    ],
    { cwd: root, encoding: "utf8" },
  );
  await writeFile(path.join(out, `${type}-top.txt`), text);
}
await writeFile(
  path.join(out, "manifest.json"),
  JSON.stringify(
    {
      ...metadata,
      date: new Date().toISOString(),
      status: "complete",
      powerAfter: command("pmset", ["-g", "batt"]),
      source:
        "Seeded S/M/L complete resources, cache->sanitize->marshal; diagnostic profiles and race are separate from timing micro results",
      go: execFileSync("go", ["version"], { encoding: "utf8" }).trim(),
      raceIsNotPerformance: true,
    },
    null,
    2,
  ),
);
