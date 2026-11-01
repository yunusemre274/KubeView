// Freeze a new source/build identity without touching historical baseline assets.
import {
  readFile,
  writeFile,
  mkdir,
  cp,
  symlink,
  access,
  readdir,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tag = process.argv[2],
  profiling = process.argv.includes("--profile");
const sourceArgument = process.argv.indexOf('--source');
const sourceRoot = sourceArgument >= 0
  ? path.resolve(root, process.argv[sourceArgument + 1])
  : path.join(root, 'frontend');
if (!tag || !/^[\w.-]+$/.test(tag))
  throw Error("Usage: panel-build.mjs NEW_TAG [--profile] [--source SOURCE_COPY] [--baseline-from RUN_DIR]");
const out = path.join(root, "benchmarks/.build", tag),
  source = `${out}-source`;
try {
  await access(out);
  throw Error(`Frozen build exists: ${tag}`);
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await mkdir(source, { recursive: false });
for (const name of [
  "src",
  "public",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  "index.html",
])
  try {
    await cp(path.join(sourceRoot, name), path.join(source, name), {
      recursive: true,
    });
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
await symlink(
  path.join(root, "frontend/node_modules"),
  path.join(source, "node_modules"),
  "dir",
);
let files = {};
async function hashTree(directory, prefix = "") {
  for (const name of await readdir(directory, { withFileTypes: true })) {
    if (name.name === "node_modules") continue;
    const rel = path.join(prefix, name.name),
      file = path.join(directory, name.name);
    if (name.isDirectory()) await hashTree(file, rel);
    else if (name.isFile())
      files[rel] = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
  }
}
await hashTree(source);
const baselineArg = process.argv.indexOf('--baseline-from');
if (baselineArg >= 0) {
  const artifact = path.resolve(root,process.argv[baselineArg+1]);
  const frozen = JSON.parse(await readFile(path.join(artifact,'frozen-builds.json'),'utf8'));
  const sameFiles = (expected) => JSON.stringify(Object.entries(files).sort())===JSON.stringify(Object.entries(expected).sort());
  if (!sameFiles(frozen.candidate.files)) throw Error('Current source differs from the recorded candidate; baseline reversal is unsafe');
  const patch = path.join(artifact,'runtime-source-change.patch');
  if (createHash('sha256').update(await readFile(patch)).digest('hex')!==frozen.patchSHA256) throw Error('Baseline patch identity differs');
  execFileSync('patch',['-E','-R','-p1','-i',patch],{cwd:source,stdio:'inherit'});
  files={};await hashTree(source);
  if (!sameFiles(frozen.baseline.files)) throw Error('Reversed source does not match the complete baseline identity');
}
execFileSync(
  process.execPath,
  [
    path.join(root, "frontend/node_modules/vite/bin/vite.js"),
    "build",
    "--outDir",
    out,
  ],
  {
    cwd: source,
    stdio: "inherit",
    env: { ...process.env, VITE_REACT_PROFILE: profiling ? "1" : "0" },
  },
);
const provenance = {
  tag,
  source,
  inputSource: sourceRoot,
  date: new Date().toISOString(),
  profiling,
  sourceSHA256: createHash("sha256")
    .update(JSON.stringify(files))
    .digest("hex"),
  files,
};
await writeFile(`${out}.json`, JSON.stringify(provenance, null, 2));
console.log({ tag, sourceSHA256: provenance.sourceSHA256, profiling });
