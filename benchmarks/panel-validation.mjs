// Finite, serial follow-up using the existing runner. Never starts beside the main matrix.
import { spawn, execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const session = JSON.parse(
  await readFile("benchmarks/panel-session.json", "utf8"),
);
const id = session.id,
  backendTag = `${id}-logs`;
const resume = process.argv.includes("--resume");
const out = path.join(session.results, resume ? "validation-v2" : "validation");
await mkdir(out, { recursive: true });
const state = {
  started: new Date().toISOString(),
  status: "waiting",
  jobs: [],
};
const save = () =>
  writeFile(path.join(out, "state.json"), JSON.stringify(state, null, 2));
const run = async (name, bin, args, extra = {}) => {
  const flags = args.filter((s) => s.startsWith("--"));
  if (new Set(flags).size !== flags.length)
    throw Error(`Duplicate option in ${name}`);
  const power = execFileSync("pmset", ["-g", "batt"], { encoding: "utf8" });
  if (
    power.includes("Battery Power") &&
    Number(power.match(/(\d+)%;/)?.[1]) < 10
  )
    throw Error("Battery resource guard: no further jobs below 10%");
  const job = {
    name,
    started: new Date().toISOString(),
    args,
    status: "running",
  };
  state.jobs.push(job);
  const child = spawn(bin, args, { cwd: root, stdio: "inherit", ...extra });
  job.pid = child.pid;
  await save();
  job.exitCode = await new Promise((r) => child.once("exit", r));
  job.finished = new Date().toISOString();
  job.status = job.exitCode === 0 ? "complete" : "failed";
  if (name === "native-safari" && job.exitCode === 2)
    job.status = "unavailable";
  await save();
  if (job.exitCode !== 0 && job.status !== "unavailable")
    throw Error(`${name}: exit ${job.exitCode}`);
};
const bench = async (name, phase, more = []) =>
  run(name, process.execPath, [
    "benchmarks/run.mjs",
    "--phase",
    phase,
    "--build-tag",
    phase === "baseline" ? session.baselineBuildTag : session.candidateBuildTag,
    "--reuse-build",
    "--reuse-binary",
    ...Object.entries({
      profiles: "M",
      repeats: "1",
      warmup: "5",
      seconds: "15",
    }).flatMap(([key, value]) =>
      more.includes(`--${key}`) ? [] : [`--${key}`, value],
    ),
    "--id",
    `${id}-${name}`,
    "--disable-browser-energy-saver",
    "--min-fps",
    "55",
    ...more,
  ]);
try {
  if (!resume) {
    const live = Number(process.argv[2]);
    if (!Number.isInteger(live))
      throw Error("Expected verified main runner PID");
    const command = execFileSync("ps", ["-p", String(live), "-o", "command="], {
      encoding: "utf8",
    });
    if (!command.includes(`--id ${id}-matrix-candidate`))
      throw Error("PID is not the expected matrix");
    state.waitingFor = { pid: live, command: command.trim() };
    await save();
    const deadline = Date.now() + 60 * 60000;
    while (true) {
      const result = JSON.parse(
        await readFile(
          `benchmarks/results/${id}-matrix-candidate/summary.json`,
          "utf8",
        ),
      );
      if (result.manifest.finishedAt) {
        if (result.errors.length || result.runs.length !== 20)
          throw Error("Main matrix incomplete");
        break;
      }
      if (Date.now() > deadline)
        throw Error("Main matrix wait deadline reached");
      await new Promise((r) => setTimeout(r, 5000));
    }
  } else {
    const main = JSON.parse(
      await readFile(
        `benchmarks/results/${id}-matrix-candidate/summary.json`,
        "utf8",
      ),
    );
    if (
      !main.manifest.finishedAt ||
      main.runs.length !== 20 ||
      main.errors.length
    )
      throw Error("Cannot resume before successful main matrix");
    for (const phase of ["baseline", "optimized"]) {
      const preflight = JSON.parse(
        await readFile(
          `benchmarks/results/${id}-log-preflight-${phase}/summary.json`,
          "utf8",
        ),
      );
      if (
        !preflight.manifest.finishedAt ||
        preflight.errors.length ||
        preflight.runs.length !== 4
      )
        throw Error("Cannot skip incomplete preflight");
    }
    state.resumedAfter =
      "Complete main matrix and both 5s warm/15s diagnostic log preflights; argument defaults fixed before repetitions";
  }
  state.status = "running";
  await save();
  await mkdir(`benchmarks/.build/${backendTag}`, { recursive: true });
  if (!resume)
    await run(
      "compile-log-fixture",
      "go",
      [
        "test",
        "-c",
        "-o",
        path.join(root, `benchmarks/.build/${backendTag}/backend.test`),
        "./pkg/server",
      ],
      { cwd: path.join(root, "backend") },
    );
  if (!resume)
    for (const phase of ["baseline", "optimized"])
      await bench(`log-preflight-${phase}`, phase, [
        "--backend-tag",
        backendTag,
        "--log-matrix",
        "--scenarios",
        "log-none,log-static,log-normal,log-long",
        "--warmup",
        "2",
        "--seconds",
        "5",
        "--lifecycle-counts",
        "--network-counts",
        ...(phase === "optimized" ? ["--reverse-order"] : []),
      ]);
  for (const phase of ["baseline", "optimized"])
    await bench(`alloc-${phase}`, phase, [
      "--scenarios",
      "panel-open-events",
      "--panel-matrix",
      "--profile-alloc",
      "--capture-start",
    ]);
  await bench("timeline-final", "optimized", [
    "--scenarios",
    "panel-open-events",
    "--panel-matrix",
    "--profile-frames",
  ]);
  for (const phase of ["baseline", "optimized"])
    await bench(`gpu-${phase}`, phase, [
      "--scenarios",
      "panel-open-events",
      "--panel-matrix",
      "--profile-gpu",
    ]);
  await run("native-safari", process.execPath, [
    "benchmarks/safari-check.mjs",
    "--id",
    `${id}-native-safari`,
  ]);
  await bench("final-long", "optimized", [
    "--scenarios",
    "long",
    "--long-seconds",
    "1200",
    "--warmup",
    "30",
    "--lifecycle-counts",
    "--network-counts",
  ]);
  for (const phase of ["baseline", "optimized"])
    await bench(`log-matrix-${phase}`, phase, [
      "--backend-tag",
      backendTag,
      "--log-matrix",
      "--scenarios",
      "log-none,log-static,log-normal,log-long",
      "--repeats",
      "3",
      "--warmup",
      "5",
      "--seconds",
      "30",
      "--lifecycle-counts",
      "--network-counts",
      ...(phase === "optimized" ? ["--reverse-order"] : []),
    ]);
  for (const phase of ["baseline", "optimized"])
    await bench(`SL-${phase}`, phase, [
      "--profiles",
      "S,L",
      "--scenarios",
      "living",
      "--repeats",
      "3",
      "--warmup",
      "5",
      "--seconds",
      "30",
    ]);
  for (const phase of ["baseline", "optimized"])
    await bench(`burst-${phase}`, phase, [
      "--scenarios",
      "events",
      "--repeats",
      "3",
      "--warmup",
      "5",
      "--seconds",
      "60",
    ]);
  await bench("interaction-idle", "optimized", [
    "--scenarios",
    "interaction,idle",
    "--repeats",
    "3",
    "--warmup",
    "5",
    "--seconds",
    "30",
    "--lifecycle-counts",
  ]);
  for (const target of ["pod", "center"])
    for (const phase of ["baseline", "optimized"])
      await run(`react-${target}-${phase}`, process.execPath, [
        "benchmarks/run.mjs",
        "--phase",
        phase,
        "--build-tag",
        `${phase === "baseline" ? session.baselineBuildTag : session.candidateBuildTag}-react-profile`,
        "--react-profile",
        "--disable-browser-energy-saver",
        "--min-fps",
        "55",
        "--reuse-build",
        "--reuse-binary",
        "--profiles",
        "M",
        "--scenarios",
        "panel-open-events",
        "--panel-target",
        target,
        "--panel-matrix",
        "--repeats",
        "1",
        "--warmup",
        "5",
        "--seconds",
        "15",
        "--id",
        `${id}-react-${target}-${phase}`,
      ]);
  for (const phase of ["baseline", "optimized"])
    await bench(`DPR2-${phase}`, phase, [
      "--panel-matrix",
      "--scenarios",
      "panel-closed,panel-open",
      "--dpr",
      "2",
      "--repeats",
      "3",
      "--warmup",
      "5",
      "--seconds",
      "30",
      ...(phase === "optimized" ? ["--reverse-order"] : []),
    ]);
  state.status = "complete";
} catch (error) {
  state.status = "stopped";
  state.error = error.stack;
  process.exitCode = 1;
} finally {
  state.finished = new Date().toISOString();
  await save();
  console.log({ validation: state.status, error: state.error });
}
