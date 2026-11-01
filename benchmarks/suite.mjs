// Serial GPU jobs only. Terminal artifacts, not an old lock, determine progress.
import { spawn, execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2),
  option = (k, d) => {
    const i = args.indexOf(`--${k}`);
    return i < 0 ? d : args[i + 1];
  };
const prefix = option("prefix", "v2"),
  waitPid = Number(option("wait-pid", "0")),
  existing = option("existing", "v2-M-living-baseline");
const directory = path.join(root, "benchmarks/results", `${prefix}-suite`);
await mkdir(directory, { recursive: true });
const state = {
  started: new Date().toISOString(),
  pid: process.pid,
  jobs: [],
  status: "active",
};
const save = () =>
  writeFile(path.join(directory, "state.json"), JSON.stringify(state, null, 2));
const valid = async (id) => {
  const r = JSON.parse(
    await readFile(
      path.join(root, "benchmarks/results", id, "summary.json"),
      "utf8",
    ),
  );
  if (
    !r.manifest.finishedAt ||
    r.errors.length ||
    r.runs.length <
      r.manifest.params.repeats * r.manifest.params.scenarios.length
  )
    throw new Error(`Incomplete/failed run ${id}`);
  for (const run of r.runs)
    if (
      run.producer &&
      (!run.producer.valid ||
        !run.consistency.clientMatchesUpstream ||
        !run.consistency.upstreamMatchesPlanned)
    )
      throw new Error(`Invalid producer/state ${id}`);
  return r;
};
await save();
if (waitPid) {
  const text = execFileSync("ps", ["-p", String(waitPid), "-o", "args="], {
    encoding: "utf8",
  });
  if (!text.includes(existing))
    throw new Error("Wait PID does not match the known benchmark job");
  console.log(`Waiting for verified live PID ${waitPid}`);
  while (true) {
    try {
      process.kill(waitPid, 0);
    } catch {
      break;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}
await valid(existing);
const runProcess = async (id, script, args = []) => {
  const job = {
    id,
    script,
    args,
    status: "running",
    started: new Date().toISOString(),
  };
  state.jobs.push(job);
  const child = spawn(
    process.execPath,
    [path.join(root, "benchmarks", script), ...args],
    { cwd: root, stdio: "inherit" },
  );
  job.pid = child.pid;
  await save();
  const code = await new Promise((resolve) => child.once("exit", resolve));
  job.exitCode = code;
  job.finished = new Date().toISOString();
  job.status = code === 0 ? "complete" : "failed";
  await save();
  if (code !== 0) throw new Error(`${id} exited ${code}`);
};
const browser = async (phase, profile, scenario, extra = []) => {
  const id = `${prefix}-${profile}-${scenario}-${phase}`;
  await runProcess(id, "run.mjs", [
    "--phase",
    phase,
    "--profiles",
    profile,
    "--scenarios",
    scenario,
    "--repeats",
    "3",
    "--warmup",
    "30",
    "--seconds",
    "60",
    "--reuse-build",
    "--reuse-binary",
    "--id",
    id,
    ...extra,
  ]);
  await valid(id);
};
try {
  if (!args.includes("--skip-backend"))
    await runProcess(`${prefix}-backend`, "backend.mjs", [`${prefix}-backend`]);
  await browser("optimized", "M", "living");
  const longId = `${prefix}-M-long-optimized`;
  await runProcess(longId, "run.mjs", [
    "--phase",
    "optimized",
    "--profiles",
    "M",
    "--scenarios",
    "long",
    "--repeats",
    "1",
    "--warmup",
    "30",
    "--seconds",
    "60",
    "--long-seconds",
    "1200",
    "--reuse-build",
    "--reuse-binary",
    "--id",
    longId,
  ]);
  await valid(longId);
  for (const profile of ["S", "L"])
    for (const phase of ["baseline", "optimized"])
      await browser(phase, profile, "living");
  for (const scenario of [
    "events",
    "water-off",
    "ships-off",
    "idle",
    "panel",
    "interaction",
  ])
    for (const phase of ["baseline", "optimized"])
      await browser(phase, "M", scenario);
  for (const phase of ["baseline", "optimized"])
    await browser(phase, "M", "log-stress", ["--log-bytes", "65536"]);
  await runProcess(`${prefix}-M-overhead-control`, "run.mjs", [
    "--phase",
    "optimized",
    "--profiles",
    "M",
    "--scenarios",
    "living",
    "--repeats",
    "3",
    "--warmup",
    "30",
    "--seconds",
    "60",
    "--reuse-build",
    "--reuse-binary",
    "--no-probe",
    "--id",
    `${prefix}-M-overhead-control`,
  ]);
  // Heavy profilers and visual recordings are strictly after primary timings.
  for (const phase of ["baseline", "optimized"])
    for (const profiler of ["cpu", "alloc"])
      await runProcess(
        `${prefix}-final-diagnostic-${phase}-${profiler}`,
        "run.mjs",
        [
          "--phase",
          phase,
          "--profiles",
          "M",
          "--scenarios",
          "log-stress",
          "--repeats",
          "1",
          "--warmup",
          "5",
          "--seconds",
          "15",
          "--reuse-build",
          "--reuse-binary",
          "--log-bytes",
          "65536",
          `--profile-${profiler}`,
          "--capture",
          "--id",
          `${prefix}-final-diagnostic-${phase}-${profiler}`,
        ],
      );
  for (const profiler of ["gpu", "frames"])
    await runProcess(`${prefix}-diagnostic-${profiler}`, "run.mjs", [
      "--phase",
      "optimized",
      "--profiles",
      "M",
      "--scenarios",
      profiler === "frames" ? "events" : "living",
      "--repeats",
      "1",
      "--warmup",
      "5",
      "--seconds",
      "15",
      "--reuse-build",
      "--reuse-binary",
      `--profile-${profiler}`,
      "--id",
      `${prefix}-diagnostic-${profiler}`,
    ]);
  await runProcess(`${prefix}-export`, "export.mjs", [prefix]);
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
        ]
      : ["living"])
      await runProcess(
        `${prefix}-${profile}-${scenario}-compare`,
        "compare.mjs",
        [
          `benchmarks/results/${prefix}-${profile}-${scenario}-baseline`,
          `benchmarks/results/${prefix}-${profile}-${scenario}-optimized`,
          `benchmarks/results/${prefix}-export/${profile}-${scenario}-comparison.json`,
        ],
      );
  await runProcess(`${prefix}-visual-evidence`, "evidence.mjs");
  state.status = "complete";
} catch (e) {
  state.status = "failed";
  state.error = e.stack;
  process.exitCode = 1;
} finally {
  state.finished = new Date().toISOString();
  await save();
}
