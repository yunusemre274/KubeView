// Resume from terminal artifacts; reuse only whole, valid, matching sets.
import { spawn, execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prefix = process.argv[2] || "v3",
  power = process.argv[3] || "AC";
if (!/^[\w.-]+$/.test(prefix) || !["AC", "battery"].includes(power))
  throw new Error("Usage: resume.mjs PREFIX AC|battery");
const stamp = new Date().toISOString().replace(/[^0-9]/g, "");
const out = path.join(root, "benchmarks/results", `${prefix}-resume-${stamp}`);
const exportDir = path.join(root, "benchmarks/results", `${prefix}-export`);
await mkdir(out, { recursive: true });
await mkdir(exportDir, { recursive: true });
const status = {
  pid: process.pid,
  power,
  started: new Date().toISOString(),
  status: "waiting-for-power",
  jobs: [],
};
const save = () =>
  writeFile(path.join(out, "state.json"), JSON.stringify(status, null, 2));
const accepted = await readFile(
  path.join(exportDir, "accepted-runs.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return {};
    throw error;
  });
const saveAccepted = () =>
  writeFile(
    path.join(exportDir, "accepted-runs.json"),
    JSON.stringify(accepted, null, 2),
  );
// A resource-guard failure is evidence, never a successful three-run set.
// Explicitly recorded unsafe cases are not retried by this controller.
const unavailable = await readFile(
  path.join(exportDir, "unavailable-runs.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return {};
    throw error;
  });
const source = () =>
  execFileSync("pmset", ["-g", "batt"], { encoding: "utf8" }).includes(
    "AC Power",
  )
    ? "AC"
    : "battery";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const read = async (id) =>
  JSON.parse(
    await readFile(
      path.join(root, `benchmarks/results/${id}/summary.json`),
      "utf8",
    ),
  );
const reference = (await read(`${prefix}-M-living-baseline`)).runs[0].before
  .camera;
const pose = (camera) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(camera).map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((n) => Number(n.toFixed(9)))
          : Number(value.toFixed(9)),
      ]),
    ),
  );
const canonical = pose(reference);
const scenarios = (profile) =>
  profile === "M"
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
    : ["living"];
const check = (report, scenario, expectedPower) => {
  if (
    !report.manifest.finishedAt ||
    report.errors.length ||
    report.manifest.powerSource !== expectedPower ||
    report.manifest.smoke ||
    report.manifest.profiler ||
    report.runs.length !== 3
  )
    return false;
  return report.runs.every(
    (run) =>
      pose(run.before.camera) === canonical &&
      (scenario === "interaction" || pose(run.after.camera) === canonical) &&
      !run.before.connectionStale &&
      !run.after.connectionStale &&
      !run.before.contextLost &&
      !run.after.contextLost &&
      (!run.producer ||
        (run.producer.valid &&
          run.consistency.clientMatchesUpstream &&
          run.consistency.upstreamMatchesPlanned)),
  );
};
const run = async (id, script, args = []) => {
  const job = { id, status: "running", started: new Date().toISOString() };
  status.jobs.push(job);
  const child = spawn(
    process.execPath,
    [path.join(root, "benchmarks", script), ...args],
    { cwd: root, stdio: "inherit" },
  );
  job.pid = child.pid;
  await save();
  job.exitCode = await new Promise((resolve) => child.once("exit", resolve));
  job.status = job.exitCode === 0 ? "complete" : "failed";
  job.finished = new Date().toISOString();
  await save();
  if (job.exitCode) throw new Error(`${id} failed ${job.exitCode}`);
};
const browserArgs = (phase, profile, scenario, id, extra = []) => [
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
];
try {
  await save();
  const deadline = Date.now() + 30 * 60000;
  while (source() !== power) {
    if (Date.now() > deadline)
      throw new Error("Requested power source unavailable for 30 minutes");
    await sleep(5000);
  }
  status.status = "running";
  await save();
  for (const profile of ["S", "M", "L"])
    for (const scenario of scenarios(profile)) {
      let groupPower = power;
      // An already completed independent S pair remains useful in its recorded power mode.
      if (profile === "S") {
        const b = await read(`${prefix}-S-living-baseline`),
          a = await read(`${prefix}-S-living-optimized`);
        if (
          check(b, scenario, b.manifest.powerSource) &&
          check(a, scenario, b.manifest.powerSource)
        )
          groupPower = b.manifest.powerSource;
      }
      for (const phase of ["baseline", "optimized"]) {
        const key = `${profile}/${scenario}/${phase}`,
          original = `${prefix}-${profile}-${scenario}-${phase}`;
        if (unavailable[key]) {
          const failed = await read(unavailable[key].id);
          if (
            profile !== "M" ||
            scenario !== "log-stress" ||
            phase !== "baseline" ||
            failed.runs.length ||
            !failed.errors.some((error) =>
              error.includes("one owned process exceeds 6 GiB RSS"),
            )
          )
            throw new Error(`Unverified unsafe-case exclusion: ${key}`);
          console.log(
            `Not retried: ${key}; recorded 6 GiB resource guard failure`,
          );
          continue;
        }
        const candidate = accepted[key]?.id || original;
        let valid = false;
        try {
          valid = check(await read(candidate), scenario, groupPower);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        if (valid) {
          accepted[key] = {
            id: candidate,
            power: groupPower,
            decision: "Reused entire valid three-run set",
          };
          await saveAccepted();
          console.log(`Reused ${candidate}`);
          continue;
        }
        if (source() !== power)
          throw new Error(
            "Power changed between jobs; retained completed sets",
          );
        const id = `${original}-resume-${stamp}`;
        await run(
          id,
          "run.mjs",
          browserArgs(
            phase,
            profile,
            scenario,
            id,
            scenario === "log-stress" ? ["--log-bytes", "65536"] : [],
          ),
        );
        if (!check(await read(id), scenario, power))
          throw new Error(
            `Whole-set camera/state/power validation failed: ${id}`,
          );
        accepted[key] = {
          id,
          power,
          supersedes: candidate,
          decision:
            "Previous set missing, interrupted, differently powered or camera mismatched; repeated all three runs, never individual samples",
        };
        await saveAccepted();
      }
    }
  const control = `${prefix}-overhead-control-${stamp}`;
  await run(
    control,
    "run.mjs",
    browserArgs("optimized", "M", "living", control, ["--no-probe"]),
  );
  status.control = control;
  for (const phase of ["baseline", "optimized"])
    for (const profiler of ["cpu", "alloc"]) {
      const id = `${prefix}-diagnostic-${phase}-${profiler}-${stamp}`;
      await run(id, "run.mjs", [
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
        id,
      ]);
      await run(`${id}-summary`, "profile-summary.mjs", [
        `benchmarks/results/${id}`,
      ]);
    }
  for (const profiler of ["gpu", "frames"]) {
    const id = `${prefix}-diagnostic-${profiler}-${stamp}`;
    await run(id, "run.mjs", [
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
      id,
    ]);
  }
  for (const profile of ["S", "M", "L"])
    for (const scenario of scenarios(profile)) {
      const missing = unavailable[`${profile}/${scenario}/baseline`];
      if (missing) {
        await writeFile(
          path.join(exportDir, `${profile}-${scenario}-comparison.json`),
          JSON.stringify(
            {
              comparable: false,
              reasons: [
                "Baseline stopped by 6 GiB per-process resource guard during warm-up; no accepted baseline repetitions and no before/after ratio",
              ],
              baseline: missing.id,
              optimized: accepted[`${profile}/${scenario}/optimized`].id,
            },
            null,
            2,
          ),
        );
        continue;
      }
      await run(`${profile}-${scenario}-compare`, "compare.mjs", [
        `benchmarks/results/${accepted[`${profile}/${scenario}/baseline`].id}`,
        `benchmarks/results/${accepted[`${profile}/${scenario}/optimized`].id}`,
        `benchmarks/results/${prefix}-export/${profile}-${scenario}-comparison.json`,
      ]);
    }
  await run("export", "export.mjs", [prefix]);
  await run("buffer-limits", "buffers.mjs");
  await run("visual-evidence", "evidence.mjs");
  status.status = "complete";
} catch (error) {
  status.status = "failed";
  status.error = error.stack;
  process.exitCode = 1;
} finally {
  status.finished = new Date().toISOString();
  await save();
  console.log(out);
}
