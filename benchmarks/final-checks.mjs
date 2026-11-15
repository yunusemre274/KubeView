// Follow the verified serial suite; additional GPU jobs start only after it exits.
import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pid = Number(process.argv[2]),
  prefix = process.argv[3] || "v3";
if (!Number.isInteger(pid) || pid < 2 || !/^[\w.-]+$/.test(prefix))
  throw new Error("Usage: final-checks.mjs LIVE_SUITE_PID PREFIX");
const command = execFileSync("ps", ["-p", String(pid), "-o", "args="], {
  encoding: "utf8",
});
if (!command.includes(`benchmarks/suite.mjs --prefix ${prefix}`))
  throw new Error("PID is not the expected live suite");
const out = path.join(root, "benchmarks/results", `${prefix}-final-checks`);
await mkdir(out, { recursive: true });
const state = {
  pid: process.pid,
  suitePid: pid,
  verifiedCommand: command.trim(),
  started: new Date().toISOString(),
  status: "waiting",
  jobs: [],
};
const save = () =>
  writeFile(path.join(out, "state.json"), JSON.stringify(state, null, 2));
await save();
const run = async (id, script, args = []) => {
  const job = { id, started: new Date().toISOString(), status: "running" };
  state.jobs.push(job);
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
  if (job.exitCode) throw new Error(`${id} failed: ${job.exitCode}`);
};
const budget = Date.now() + 180 * 60000;
try {
  while (true) {
    try {
      process.kill(pid, 0);
    } catch {
      break;
    }
    if (Date.now() > budget)
      throw new Error("Verified suite wait exceeded three hours");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  const suite = JSON.parse(
    await readFile(
      path.join(root, "benchmarks/results", `${prefix}-suite/state.json`),
      "utf8",
    ),
  );
  const last = suite.jobs.at(-1);
  // The old optimized M set has one genuinely different startup camera. Keep
  // its rejected raw data, and replace the entire set, never its worst sample.
  if (
    suite.status !== "complete" &&
    !(
      suite.status === "failed" &&
      last.id === `${prefix}-M-living-compare` &&
      last.exitCode === 2
    )
  )
    throw new Error(`Suite ended unexpectedly: ${suite.status} / ${last?.id}`);
  state.status = "running";
  await save();
  const exportDir = path.join(root, "benchmarks/results", `${prefix}-export`);
  await mkdir(exportDir, { recursive: true });
  const camera = (pose) =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(pose).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? value.map((number) => Number(number.toFixed(9)))
            : Number(value.toFixed(9)),
        ]),
      ),
    );
  const reference = JSON.parse(
    await readFile(
      path.join(
        root,
        `benchmarks/results/${prefix}-M-living-baseline/summary.json`,
      ),
      "utf8",
    ),
  );
  const canonical = camera(reference.runs[0].before.camera);
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
  const accepted = {};
  for (const profile of ["S", "M", "L"])
    for (const scenario of scenarios(profile))
      for (const phase of ["baseline", "optimized"]) {
        const original = `${prefix}-${profile}-${scenario}-${phase}`;
        const report = JSON.parse(
          await readFile(
            path.join(root, `benchmarks/results/${original}/summary.json`),
            "utf8",
          ),
        );
        if (
          report.errors.length ||
          !report.manifest.finishedAt ||
          report.runs.length !== 3
        )
          throw new Error(`Primary set incomplete: ${original}`);
        if (
          !report.runs.some(
            (run) =>
              camera(run.before.camera) !== canonical ||
              (scenario !== "interaction" &&
                camera(run.after.camera) !== canonical),
          )
        )
          continue;
        const corrected = `${original}-fixed`;
        await run(corrected, "run.mjs", [
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
          corrected,
          ...(scenario === "log-stress" ? ["--log-bytes", "65536"] : []),
        ]);
        accepted[`${profile}/${scenario}/${phase}`] = {
          id: corrected,
          supersedes: original,
          reason:
            "Startup pose or native input changed the camera. Entire three-run set repeated with camera settled after warmup and fixed-case input isolated; original data retained, no individual samples selected.",
        };
      }
  await writeFile(
    path.join(exportDir, "accepted-runs.json"),
    JSON.stringify(accepted, null, 2),
  );
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
      await run(`${profile}-${scenario}-compare`, "compare.mjs", [
        `benchmarks/results/${accepted[`${profile}/${scenario}/baseline`]?.id || `${prefix}-${profile}-${scenario}-baseline`}`,
        `benchmarks/results/${accepted[`${profile}/${scenario}/optimized`]?.id || `${prefix}-${profile}-${scenario}-optimized`}`,
        `benchmarks/results/${prefix}-export/${profile}-${scenario}-comparison.json`,
      ]);
  await run("export", "export.mjs", [prefix]);
  await run("event-timeline", "run.mjs", [
    "--phase",
    "optimized",
    "--profiles",
    "M",
    "--scenarios",
    "events",
    "--repeats",
    "1",
    "--warmup",
    "5",
    "--seconds",
    "15",
    "--reuse-build",
    "--reuse-binary",
    "--profile-frames",
    "--id",
    `${prefix}-diagnostic-event-timeline`,
  ]);
  await run("buffer-limits", "buffers.mjs");
  if (suite.status !== "complete") await run("visual-evidence", "evidence.mjs");
  state.status = "complete";
} catch (error) {
  state.status = "failed";
  state.error = error.stack;
  process.exitCode = 1;
} finally {
  state.finished = new Date().toISOString();
  await save();
}
