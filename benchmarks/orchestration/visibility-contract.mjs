// One finite worker job: owned fixture -> native hidden-window test -> cleanup.
// No build, live kubeconfig or unrelated process ownership.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile, writeFile, mkdir, access, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const session = JSON.parse(await readFile(path.join(root, 'benchmarks/panel-final-session.json'), 'utf8'));
const id = `${session.id}-visibility`, fixtureID = `${id}-fixture`;
const out = path.join(root, 'benchmarks/results', id), base = 'http://127.0.0.1:5195';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { started: new Date().toISOString(), sourceBuild: session.candidate, fixtureID, status: 'running', method: 'Owned fixture and genuine native Chrome minimization; function/canonical contract, not a CPU measurement' };
let server, visibility, serverExit, visibilityExit, temporary, serverLog = '', createdOutput = false, interrupted;
const exited = child => new Promise(resolve => {
  child.once('error', error => resolve({ error: error.message }));
  child.once('exit', (code, signal) => resolve({ code, signal }));
});
const alive = child => child && child.exitCode === null && child.signalCode === null;
const groupAlive = child => {
  if (!child?.pid) return false;
  try { process.kill(-child.pid, 0); return true; } catch { return false; }
};
const killOwnGroup = (child, signal) => {
  if (!child?.pid) return;
  try { process.kill(-child.pid, signal); } catch (e) { if (e.code !== 'ESRCH') throw e; }
};
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  interrupted = signal;
  killOwnGroup(visibility, 'SIGTERM');
  killOwnGroup(server, 'SIGTERM');
});
async function stopOwn(child, done) {
  if (!child) return null;
  killOwnGroup(child, 'SIGTERM');
  const result = await Promise.race([done, sleep(5000).then(() => null)]);
  // The process group was created only by this wrapper, including its browser
  // or fixture children. Never inspect or kill another listener/process group.
  if (groupAlive(child)) killOwnGroup(child, 'SIGKILL');
  for (let n = 0; n < 10 && groupAlive(child); n++) await sleep(100);
  return result || await done;
}
try {
  await mkdir(out, { recursive: false });
  createdOutput = true;
  await access(path.join(root, 'benchmarks/.build', session.candidate, 'index.html'));
  await access(path.join(root, 'benchmarks/.build', session.backend, 'backend.test'));
  report.provenance = JSON.parse(await readFile(path.join(root, 'benchmarks/.build', `${session.candidate}.json`), 'utf8'));
  await new Promise((resolve, reject) => {
    const socket = createServer();
    socket.once('error', reject);
    socket.listen(5195, '127.0.0.1', () => socket.close(resolve));
  });
  if (interrupted) throw Error(`Interrupted before fixture startup: ${interrupted}`);
  server = spawn(process.execPath, ['benchmarks/serve.mjs', '--phase', 'optimized', '--build-tag', session.candidate, '--backend-tag', session.backend, '--reuse-build', '--reuse-binary', '--profile', 'M', '--port', '5195', '--id', fixtureID], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  serverExit = exited(server);
  report.serverPID = server.pid;
  for (const stream of [server.stdout, server.stderr]) stream.on('data', value => { serverLog += value; process.stdout.write(value); });
  const deadline = Date.now() + 10000;
  while (!serverLog.includes(`BENCHMARK FIXTURE ready ${base}`)) {
    if (interrupted || !alive(server) || Date.now() > deadline) throw Error('Owned fixture did not announce readiness; refusing to reuse any other server');
    await sleep(100);
  }
  const state = await fetch(`${base}/__benchmark/state`, { signal: AbortSignal.timeout(3000) }).then(response => response.json());
  if (state.resources.filter(r => r.kind === 'Pod').length !== 300 || state.resources.filter(r => r.kind === 'Node').length !== 20) throw Error('Owned fixture does not match the M workload');
  if (interrupted) throw Error(`Interrupted before browser startup: ${interrupted}`);
  temporary = await mkdtemp(path.join(os.tmpdir(), 'kubeview-owned-visibility-job-'));
  visibility = spawn(process.execPath, ['benchmarks/visibility.mjs', '--id', id], { cwd: root, env: { ...process.env, BASE_URL: base, TMPDIR: temporary }, stdio: 'inherit', detached: true });
  visibilityExit = exited(visibility);
  report.visibilityPID = visibility.pid;
  const timeout = setTimeout(() => killOwnGroup(visibility, 'SIGTERM'), 110000);
  const result = await visibilityExit;
  clearTimeout(timeout);
  report.workerResult = result;
  if (result.code !== 0) throw Error(`Visibility contract failed: ${JSON.stringify(result)}`);
  const actual = JSON.parse(await readFile(path.join(out, 'result.json'), 'utf8'));
  if (!actual.passed || actual.errors.length) throw Error('Native visibility result did not pass its invariants');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = error.stack; process.exitCode = 1;
} finally {
  report.visibilityCleanup = await stopOwn(visibility, visibilityExit);
  report.serverCleanup = await stopOwn(server, serverExit);
  report.ownedServerStopped = !groupAlive(server);
  report.ownedVisibilityGroupStopped = !groupAlive(visibility);
  if (temporary && report.ownedVisibilityGroupStopped) {
    await rm(temporary, { recursive: true, force: true });
    report.ownedTemporaryDirectoryRemoved = true;
  }
  if (!report.ownedServerStopped || !report.ownedVisibilityGroupStopped) {
    report.status = 'failed'; report.cleanupError = 'Owned process group remains alive'; process.exitCode = 1;
  }
  report.finished = new Date().toISOString();
  // A collision must never replace historical results.
  if (createdOutput) {
    await writeFile(path.join(out, 'fixture-output.txt'), serverLog, { flag: 'wx' });
    await writeFile(path.join(out, 'contract.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  }
  console.log(JSON.stringify({ id, status: report.status, ownedServerStopped: report.ownedServerStopped, error: report.error }));
}
