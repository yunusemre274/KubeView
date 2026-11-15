// Reproduce the original runtime WITHOUT changing the user's checkout/branch.
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  symlink,
  readFile,
  readdir,
  writeFile,
  mkdir,
  access,
  cp,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidence = path.join(root, "benchmarks/results/baseline-living-3x");
const provenance = JSON.parse(
  await readFile(path.join(evidence, "provenance.json"), "utf8"),
);
const proof = JSON.parse(
  await readFile(path.join(evidence, "reproduction.json"), "utf8"),
);
await mkdir(path.join(root, "benchmarks/.build"), { recursive: true });
const temporary = await mkdtemp(
  path.join(root, "benchmarks/.build/reproduce-"),
);
const archive = execFileSync(
  "git",
  ["archive", provenance.initialCommit, "frontend"],
  { cwd: root, maxBuffer: 32 << 20 },
);
execFileSync("tar", ["-xf", "-", "-C", temporary], {
  input: archive,
  cwd: root,
});
execFileSync(
  "git",
  [
    "apply",
    `--directory=${path.relative(root, temporary)}`,
    path.join(evidence, "baseline-source.patch"),
  ],
  { cwd: root },
);
await symlink(
  path.join(root, "frontend/node_modules"),
  path.join(temporary, "frontend/node_modules"),
  "dir",
);
const output = path.join(temporary, "dist");
execFileSync(
  "npm",
  ["run", "build", "--", "--outDir", output, "--emptyOutDir"],
  { cwd: path.join(temporary, "frontend"), stdio: "inherit" },
);
const sums = async (dir) => {
  const files = [
      "index.html",
      ...(await readdir(path.join(dir, "assets"))).map((f) => `assets/${f}`),
    ],
    result = {};
  for (const file of files)
    result[file] = createHash("sha256")
      .update(await readFile(path.join(dir, file)))
      .digest("hex");
  return Object.fromEntries(Object.entries(result).sort());
};
const expected = proof.expected,
  actual = await sums(output);
const report = {
  date: new Date().toISOString(),
  temporary,
  expected,
  actual,
  identical: JSON.stringify(expected) === JSON.stringify(actual),
  method:
    "initial commit archive + recorded user/instrumentation runtime patch; user's working tree untouched",
};
await writeFile(
  path.join(evidence, "reproduction-latest.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  `Baseline artifact reproduction: ${report.identical ? "identical" : "DIFFERS; inspect reproduction.json"}`,
);
if (!report.identical) process.exitCode = 1;
else if (process.argv.includes("--install")) {
  const target = path.join(root, "benchmarks/.build/baseline");
  let exists = true;
  try {
    await access(target);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    exists = false;
  }
  if (exists) {
    if (JSON.stringify(await sums(target)) !== JSON.stringify(expected))
      throw new Error("Existing baseline differs; refusing to overwrite it");
  } else
    await cp(output, target, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  console.log(`Verified baseline ready: ${target}`);
}
