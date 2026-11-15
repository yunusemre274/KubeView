// One bounded, fixture-only backend worker job. No browser or real kubeconfig.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixture, signature, VERSION } from '../fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputArg = process.argv.indexOf('--out-dir');
const output = process.env.KUBEVIEW_WORKER_RESULT_DIR || (outputArg < 0 ? null : process.argv[outputArg + 1]);
if (!output) throw Error('Usage: node benchmarks/orchestration/backend-contract.mjs --out-dir NEW_RESULT_DIRECTORY');
const out = path.resolve(root, output);
await mkdir(out, { recursive: true });
try { await access(path.join(out, 'result.json')); throw Error('Result exists: choose a new output directory'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const binary = path.join(root, 'benchmarks/.build/panel-20261026T082540Z-logs/backend.test');
const expectedBinarySHA = 'e196536ac12762656d2b6d4397d1d2e2a5d9f28994f3039903f8670926417076';
const sha = data => createHash('sha256').update(data).digest('hex');
const base = 'http://127.0.0.1:5197';
const result = {
  started: new Date().toISOString(), status: 'running', job: 'backend-gated-contract',
  method: 'Single fixture-only contract job; existing frozen Go TestBenchmarkFixtureServer, real informer/WebSocket. No CPU/FPS acceptance claim.',
  binary, expectedBinarySHA, fixtureVersion: VERSION, node: process.version,
  port: 5197, checks: [], errors: [],
};
const signal = new AbortController(), sockets = new Set();
let child, logAbort, readerTask, fixtureOutput = '';
const stop = reason => {
  if (!signal.signal.aborted) signal.abort(reason);
  logAbort?.abort();
  for (const socket of sockets) socket.close();
  child?.kill('SIGTERM');
};
const onTermination = () => stop(Error('Worker interrupted'));
process.once('SIGTERM', onTermination);
process.once('SIGINT', onTermination);
const deadline = setTimeout(() => stop(Error('45 second backend contract deadline exceeded')), 45000);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, message, timeout = 7000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    signal.signal.throwIfAborted();
    const found = await check();
    if (found) return found;
    await sleep(40);
  }
  throw Error(message);
}
const json = async (url, options = {}) => {
  const response = await fetch(base + url, { ...options, signal: signal.signal });
  if (!response.ok) throw Error(`${url}: HTTP ${response.status}`);
  return response.json();
};
const upstream = () => json('/__benchmark/state');
const post = (url, value) => json(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
function check(name) { result.checks.push(name); console.log(`PASS ${name}`); }
async function connect() {
  const socket = new WebSocket(base.replace('http:', 'ws:') + '/ws?context=benchmark');
  const messages = [];
  sockets.add(socket);
  socket.addEventListener('message', event => messages.push(JSON.parse(event.data)));
  socket.addEventListener('error', () => {});
  const snapshot = await until(() => messages.find(message => message.type === 'SNAPSHOT'), 'WebSocket snapshot missing');
  assert.equal(snapshot.synced, true);
  assert.ok(snapshot.generation);
  return { socket, messages, snapshot };
}
async function disconnect(socket) {
  socket.close();
  await until(() => socket.readyState === WebSocket.CLOSED, 'Owned WebSocket did not close');
  sockets.delete(socket);
}
try {
  result.binarySHA = sha(await readFile(binary));
  assert.equal(result.binarySHA, expectedBinarySHA, 'Frozen log fixture binary changed');
  result.sourceSHA = Object.fromEntries(await Promise.all([
    'backend/pkg/server/server.go', 'backend/pkg/server/stream.go', 'backend/pkg/server/benchmark_test.go',
  ].map(async file => [file, sha(await readFile(path.join(root, file)))])));
  const reservation = createServer();
  await new Promise((resolve, reject) => { reservation.once('error', reject); reservation.listen(5197, '127.0.0.1', resolve); });
  await new Promise(resolve => reservation.close(resolve));
  const resources = fixture('S'), input = path.join(out, 'fixture.json');
  await writeFile(input, JSON.stringify(resources), { flag: 'wx' });
  result.fixtureSHA = sha(JSON.stringify(resources));
  child = spawn(binary, ['-test.run', '^TestBenchmarkFixtureServer$', '-test.timeout', '60s'], {
    cwd: root, env: {
      ...process.env, KUBECONFIG: '/dev/null', READ_ONLY: 'true',
      KUBEVIEW_BENCH_FIXTURE: input, KUBEVIEW_BENCH_STATIC: path.join(root, 'benchmarks/.build/panel-20261026T082540Z-candidate-v5-block'),
      KUBEVIEW_BENCH_ADDR: '127.0.0.1:5197', KUBEVIEW_BENCH_LOG_GATED: '1',
      KUBEVIEW_BENCH_LOG_BURST_LINES: '8', KUBEVIEW_BENCH_LOG_BYTES: '0',
    }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  result.fixturePID = child.pid;
  child.on('error', error => stop(error));
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { fixtureOutput = (fixtureOutput + chunk).slice(-65536); });
  await until(() => fixtureOutput.includes('BENCHMARK FIXTURE ready http://127.0.0.1:5197'), 'Own fixture did not bind its loopback port');
  await until(async () => { try { return await upstream(); } catch { return false; } }, 'Own fixture did not start');
  const first = await connect();
  assert.deepEqual(signature(first.snapshot.resources), signature(resources));
  check('Initial full snapshot equals the planned canonical fixture');

  logAbort = new AbortController();
  const response = await fetch(base + '/api/logs?namespace=bench-0&pod=app-0&container=app&follow=true', { signal: AbortSignal.any([signal.signal, logAbort.signal]) });
  assert.equal(response.status, 200);
  let received = '';
  const reader = response.body.getReader();
  readerTask = (async () => {
    const decoder = new TextDecoder();
    try {
      while (true) { const { done, value } = await reader.read(); if (done) break; received += decoder.decode(value, { stream: true }); assert.ok(received.length < 16384, 'Bounded diagnostic output exceeded'); }
    } catch (error) { if (!logAbort.signal.aborted && !signal.signal.aborted) throw error; }
  })();
  // Handle early rejection immediately; it is also awaited below.
  readerTask.catch(error => stop(error));
  await until(() => (received.match(/\n/g) || []).length === 8, 'Initial deterministic burst missing');
  await sleep(300);
  const paused = await upstream();
  assert.equal(paused.logFlow, false);
  assert.equal(paused.logWrittenLines, 8);
  assert.equal(paused.logOpened - paused.logClosed, 1);
  assert.ok(received.split('\n').filter(Boolean).every(line => line.startsWith('2026-10-23T00:00:00.000000000Z BENCHMARK synthetic log bench-0/app-0 container=app')));
  assert.deepEqual(paused.logRequests.at(-1), { namespace: 'bench-0', pod: 'app-0', container: 'app' });
  check('Gate starts closed, deterministic burst is exact, raw log address preserved');
  const getGate = await fetch(base + '/__benchmark/log-flow', { signal: signal.signal });
  assert.equal(getGate.status, 405);
  await getGate.text();
  const badGate = await fetch(base + '/__benchmark/log-flow', { method: 'POST', body: '{broken', signal: signal.signal });
  assert.equal(badGate.status, 400);
  await badGate.text();
  const largeGate = await fetch(base + '/__benchmark/log-flow', { method: 'POST', body: JSON.stringify({ enabled: true, pad: 'x'.repeat(1200) }), signal: signal.signal });
  assert.equal(largeGate.status, 400);
  await largeGate.text();
  check('Gated fixture endpoint rejects wrong method, malformed and oversized payload');
  await post('/__benchmark/log-flow', { enabled: true });
  await until(async () => (await upstream()).logWrittenLines >= 11, 'Enabled independent log producer did not progress');
  await post('/__benchmark/log-flow', { enabled: false });
  await sleep(150);
  const stopped = await upstream();
  await sleep(300);
  assert.equal((await upstream()).logWrittenLines, stopped.logWrittenLines);
  assert.ok(stopped.logWrittenBytes > paused.logWrittenBytes);
  result.logCounters = { before: paused.logWrittenLines, after: stopped.logWrittenLines, bytes: stopped.logWrittenBytes };
  check('Enable advances line/byte counters; disable leaves no empty producer writes');
  logAbort.abort();
  await readerTask;
  const logsClosed = await until(async () => { const state = await upstream(); return state.logOpened === state.logClosed && state; }, 'Aborted HTTP log did not close');
  result.logCleanup = { opened: logsClosed.logOpened, closed: logsClosed.logClosed };
  check('HTTP log abort closes the only stream');

  const created = structuredClone(resources.find(resource => resource.kind === 'Pod'));
  created.metadata = { ...created.metadata, uid: 'orchestration-contract-pod', name: 'orchestration-contract-pod', resourceVersion: 'opaque-one', ownerReferences: [] };
  delete created.metadata.deletionTimestamp;
  delete created.metadata.finalizers;
  const changed = structuredClone(created);
  changed.metadata.resourceVersion = 'opaque-two';
  changed.spec.nodeName = resources.find(resource => resource.kind === 'Node').metadata.name;
  changed.status.containerStatuses[0].restartCount += 7;
  let sequence = 0;
  for (const [action, object] of [['ADD', created], ['UPDATE', changed], ['DELETE', changed]]) {
    await until(async () => !(await upstream()).running, 'Previous replay not complete');
    await post('/__benchmark/replay', [{ action, object, sequence: ++sequence, atMs: 0 }]);
    const message = await until(() => first.messages.find(message => message.type === 'RESOURCE_EVENT' && message.action === action && message.object?.metadata.uid === created.metadata.uid), `${action} watch message missing`);
    assert.equal(message.generation, first.snapshot.generation);
    if (action === 'UPDATE') {
      assert.equal(message.object.spec.nodeName, changed.spec.nodeName);
      assert.equal(message.object.status.containerStatuses[0].restartCount, changed.status.containerStatuses[0].restartCount);
    }
  }
  check('Actual informer/WebSocket delivers ADD, scheduling UPDATE and confirmed UID DELETE');
  await disconnect(first.socket);
  const second = await connect(), final = await upstream();
  assert.notEqual(second.snapshot.generation, first.snapshot.generation);
  assert.deepEqual(signature(second.snapshot.resources), signature(final.resources));
  assert.deepEqual(signature(final.resources), signature(resources));
  assert.equal(second.snapshot.resources.some(resource => resource.metadata.uid === created.metadata.uid), false);
  await disconnect(second.socket);
  check('Reconnect has a new generation, full canonical signature restored, deleted UID stays absent');
  result.generations = [first.snapshot.generation, second.snapshot.generation];
  result.replay = final.samples;
  result.finalCanonicalSHA = sha(JSON.stringify(signature(final.resources)));
  result.initialCanonicalSHA = sha(JSON.stringify(signature(resources)));
  result.status = 'passed';
} catch (error) {
  result.status = 'failed'; result.errors.push(error.stack); process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  process.removeListener('SIGTERM', onTermination);
  process.removeListener('SIGINT', onTermination);
  logAbort?.abort();
  for (const socket of sockets) socket.close();
  if (readerTask) await Promise.race([readerTask.catch(() => {}), sleep(500)]);
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGTERM');
    await Promise.race([exited, sleep(1000)]);
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await Promise.race([exited, sleep(500)]); }
  }
  result.fixtureShutdown = child ? { exitCode: child.exitCode, signal: child.signalCode, ownProcessStopped: child.exitCode !== null || child.signalCode !== null } : null;
  if (result.fixtureShutdown && !result.fixtureShutdown.ownProcessStopped) { result.status = 'failed'; result.errors.push('Owned fixture did not terminate'); process.exitCode = 1; }
  result.finished = new Date().toISOString();
  await writeFile(path.join(out, 'fixture-output.txt'), fixtureOutput);
  await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ status: result.status, checks: result.checks.length, output: out, errors: result.errors }));
}
