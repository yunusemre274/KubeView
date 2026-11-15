// Real production-binary HTTP/WS negatives. No browser, replay, cluster writes,
// runtime edits, public server logs, or secret values are part of this helper.
import fs from 'node:fs/promises';
import { constants as fsConstants, openSync, closeSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
const execute = promisify(execFile);
const root = process.cwd();
const out = path.join(root, 'artifacts/v1.1.0/v11-20261108/backend');
const resultPath = path.join(out, 'prod-security-result.json');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { ws: WebSocket } = require(path.join(path.dirname(require.resolve('playwright-core')), 'lib/utilsBundle.js'));
const expectedBinary = 'b7417ea5216a88de16e3a2307df55a32470f756a958681eac08643858fdc87cf';
const contextName = 'kv-repair-1101', namespace = 'kv-repair-v11-qa';
const clusterUID = 'a24740ba-cf3e-461d-b5b3-250deeb060d7';
const namespaceUID = '9e5b54f8-34fa-421d-9748-c5500224660c';
const started = Date.now(), deadline = started + 230000;
const runID = `prod-security-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
const privateDir = path.join(root, '.git/kv-v11-runtime', runID);
const originalBinary = path.join(root, '.git/kv-v11-runtime/install-macos/kubeview');
const frozenBinary = path.join(privateDir, 'kubeview');
const secrets = [], children = [], sockets = new Set();
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const fail = message => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };
const safeError = error => secrets.reduce((text, value) => value ? text.split(value).join('[REDACTED]') : text, String(error?.message || error)).slice(0, 700);
const result = { runID, startedAt: new Date().toISOString(), status: 'RUNNING', type: 'Real copied production binary / actual Kubernetes read / HTTP and WebSocket transport; no browser UI proof', command: 'node artifacts/v1.1.0/v11-20261108/backend/prod-security-test.mjs', checks: [], gateways: [], credentialValuesLogged: false, providerOperations: false, clusterMutations: 0 };
await fs.writeFile(resultPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
const save = () => fs.writeFile(resultPath, JSON.stringify(result, null, 2) + '\n');
async function step(name, action) {
  const check = { name, startedAt: new Date().toISOString(), status: 'RUNNING' };
  result.checks.push(check); await save();
  try { check.proof = await action(); check.status = 'PASS'; }
  catch (error) { check.status = 'FAIL'; check.error = safeError(error); throw error; }
  finally { check.finishedAt = new Date().toISOString(); await save(); }
}
function remaining() { const value = deadline - Date.now(); expect(value > 0, 'Global production-security timeout reached'); return value; }
async function guard() {
  const { stdout } = await execute('kubectl', ['--kubeconfig', path.join(root, '.git/kv-repair-runtime/kubeconfig'), '--context', contextName, 'get', 'namespaces', 'kube-system', namespace, '-o', 'json'], { timeout: Math.min(12000, remaining()), maxBuffer: 1 << 20 });
  const items = JSON.parse(stdout).items;
  const system = items.find(item => item.metadata.name === 'kube-system');
  const owned = items.find(item => item.metadata.name === namespace);
  expect(system?.metadata.uid === clusterUID && owned?.metadata.uid === namespaceUID, 'Owned cluster/namespace UID guard failed');
  expect(owned.metadata.labels?.['kubeview.io/v11-owner'] === 'v11-20261108' && owned.metadata.labels?.['kubeview.io/repair-owner'] === 'pre-v11', 'QA namespace ownership guard failed');
  return { context: contextName, clusterUID, namespace, namespaceUID, owner: 'v11-20261108' };
}
async function runtimeHashes() {
  const previous = JSON.parse(await fs.readFile(path.join(out, 'live-log-roles-metadata.json'), 'utf8'));
  const hashes = {};
  for (const [file, expected] of Object.entries(previous.runtime_source_files_before)) {
    hashes[file] = sha(await fs.readFile(path.join(root, file)));
    expect(hashes[file] === expected, `Gateway runtime source mismatch: ${file}`);
  }
  return hashes;
}
async function freePort(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer(); server.once('error', () => reject(new Error(`Required private test port ${port} already in use`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
async function http(gateway, method, pathname, { body, cookie, bearer, origin = gateway.url } = {}) {
  const headers = { Origin: origin };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const response = await fetch(gateway.url + pathname, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(Math.min(15000, remaining())) });
  const text = await response.text();
  let value = null; try { value = JSON.parse(text); } catch { /* health is text */ }
  return { status: response.status, value, cookies: response.headers.getSetCookie() };
}
function cookie(raw, name) {
  const header = raw.find(value => value.startsWith(name + '='));
  expect(header, `Expected private ${name} cookie missing`);
  const pair = header.split(';', 1)[0]; secrets.push(pair.slice(pair.indexOf('=') + 1));
  return { pair, flags: { name, httpOnly: /;\s*HttpOnly(?:;|$)/i.test(header), sameSiteStrict: /;\s*SameSite=Strict(?:;|$)/i.test(header), pathRoot: /;\s*Path=\/(?:;|$)/i.test(header), secure: /;\s*Secure(?:;|$)/i.test(header) } };
}
async function websocket(gateway, { origin = gateway.url, cookie: cookies, bearer, expectedStatus = 101 } = {}) {
  const headers = { Origin: origin };
  if (cookies) headers.Cookie = cookies;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const address = gateway.url.replace(/^http/, 'ws') + '/ws?' + new URLSearchParams({ context: contextName, namespace });
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(address, { headers, handshakeTimeout: Math.min(12000, remaining()) }); sockets.add(socket);
    let finished = false, upgraded = false;
    const timer = setTimeout(() => finish(new Error('Bounded actual WebSocket handshake/snapshot timeout')), Math.min(16000, remaining()));
    function finish(error, proof) {
      if (finished) return; finished = true; clearTimeout(timer); sockets.delete(socket);
      if (socket.readyState === WebSocket.OPEN) socket.close(1000); else socket.terminate();
      error ? reject(error) : resolve(proof);
    }
    socket.once('unexpected-response', (_request, response) => { const code = response.statusCode; response.resume(); finish(code === expectedStatus ? null : new Error(`Actual WebSocket expectedHTTP${expectedStatus} got${code}`), { handshakeStatus: code }); });
    socket.once('open', () => { upgraded = true; if (expectedStatus !== 101) finish(new Error(`Actual WebSocket unexpectedly upgraded; expectedHTTP${expectedStatus}`)); });
    socket.on('message', data => {
      if (finished) return;
      let value; try { value = JSON.parse(String(data)); } catch { return; }
      if (value.type === 'SNAPSHOT') {
        if (value.context !== contextName || !value.generation || !Array.isArray(value.scopes)) return finish(new Error('Actual WebSocket snapshot identity/scope missing'));
        finish(null, { handshakeStatus: 101, actualSnapshot: true, context: value.context, generationPresent: true, explicitScopeCount: value.scopes.length, resourceCount: value.resources?.length ?? 0 });
      }
    });
    socket.on('error', () => { if (!finished) finish(new Error(upgraded ? 'Actual WebSocket failed before snapshot' : 'Actual WebSocket transport error')); });
  });
}
async function startGateway(port, token) {
  await guard(); await runtimeHashes(); expect(sha(await fs.readFile(frozenBinary)) === expectedBinary, 'Frozen binary SHA changed before gateway launch'); await freePort(port);
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^KUBEVIEW_(REPAIR|TEST|BENCH)_/.test(key) || /^KV_(HUBBLE|MINIKUBE)_/.test(key) || ['API_TOKEN', 'KUBE_CONTEXT', 'WATCH_NAMESPACE', 'STATIC_DIR'].includes(key)) delete env[key];
  Object.assign(env, { READ_ONLY: 'true', KUBECONFIG: path.join(root, '.git/kv-repair-runtime/kubeconfig') + path.delimiter + path.join(root, '.git/kv-v11-runtime/kubeconfig-b') });
  if (token) env.API_TOKEN = token;
  const logPath = path.join(privateDir, `gateway-${port}.log`), logFD = openSync(logPath, 'wx', 0o600);
  const args = ['--bind', '127.0.0.1', '--port', String(port), '--context', contextName, '--namespace', namespace];
  const child = spawn(frozenBinary, args, { cwd: privateDir, env, stdio: ['ignore', logFD, logFD] }); closeSync(logFD);
  const gateway = { url: `http://127.0.0.1:${port}`, port, child, tokenRequired: Boolean(token) }; children.push(gateway);
  gateway.exited = false;
  child.once('exit', () => { gateway.exited = true; });
  child.once('error', () => { gateway.spawnFailed = true; });
  const publicGateway = { url: gateway.url, pid: child.pid, owner: 'backend-manager/prod-security-test', readOnlyEnvironment: true, writeFlagPassed: false, tokenRequired: Boolean(token), privateLog: path.relative(root, logPath), binarySHA256: expectedBinary, scope: { context: contextName, namespace } }; result.gateways.push(publicGateway); gateway.public = publicGateway;
  for (let i = 0; i < 100; i++) {
    if (gateway.exited || gateway.spawnFailed) fail('Owned readonly child exited during startup; logs kept private');
    try { if ((await http(gateway, 'GET', '/healthz')).status === 200) return gateway; } catch { /* bounded startup */ }
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  fail('Owned readonly child did not become healthy');
}
async function readonlyChecks(gateway, bearer, extraCookie = '') {
  const query = '?' + new URLSearchParams({ context: contextName, namespace });
  const diagnostic = await http(gateway, 'GET', '/api/connection' + query, { bearer, cookie: extraCookie });
  expect(diagnostic.status === 200 && diagnostic.value.readOnly === true && diagnostic.value.serverReadOnly === true && diagnostic.value.managementEnabled === false && diagnostic.value.managementAvailable === false, 'Production readonly diagnostic flags incorrect');
  const operator = cookie(diagnostic.cookies, 'kubeview_operator');
  expect(operator.flags.httpOnly && operator.flags.sameSiteStrict && operator.flags.pathRoot, 'Operator cookie flags incorrect');
  const cookies = [extraCookie, operator.pair].filter(Boolean).join('; '), nonce = diagnostic.value.connectionID; secrets.push(nonce);
  const management = await http(gateway, 'POST', '/api/management', { bearer, cookie: cookies, body: { enabled: true, context: contextName, namespace, connectionID: nonce } });
  expect(management.status === 403, 'Production READ_ONLY=true accepted management enable');
  const name = 'v11-readonly-denied-' + crypto.randomBytes(6).toString('hex');
  const resource = '/api/resources?' + new URLSearchParams({ context: contextName, namespace, version: 'v1', resource: 'configmaps', name });
  expect((await http(gateway, 'GET', resource, { bearer, cookie: cookies })).status === 404, 'Unique denied object unexpectedly exists');
  const response = await fetch(gateway.url + resource, { method: 'POST', headers: { Origin: gateway.url, 'Content-Type': 'application/json', Cookie: cookies, 'X-KubeView-Connection': nonce, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, body: JSON.stringify({ object: { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name, namespace, labels: { 'kubeview.io/v11-owner': 'v11-20261108', 'kubeview.io/prod-security-owner': runID } }, data: { probe: 'synthetic-denied-only' } } }), signal: AbortSignal.timeout(Math.min(12000, remaining())) });
  await response.arrayBuffer(); expect(response.status === 403, 'Production readonly resource CREATE was not denied403');
  expect((await http(gateway, 'GET', resource, { bearer, cookie: cookies })).status === 404, 'Denied ConfigMap changed actual API state');
  const target = await http(gateway, 'GET', '/api/resources?' + new URLSearchParams({ context: contextName, version: 'v1', resource: 'namespaces', name: namespace }), { bearer, cookie: cookies });
  expect(target.status === 200 && target.value.metadata.uid === namespaceUID, 'Readonly action identity target lookup failed');
  // Reach the shared actions authorization gate with an exact existing UID/RV.
  // dryRun is defense in depth; the READ_ONLY gate must reject before any API
  // mutation. No existing workload or namespace is changed.
  const action = await fetch(gateway.url + '/api/actions', { method: 'POST', headers: { Origin: gateway.url, 'Content-Type': 'application/json', Cookie: cookies, 'X-KubeView-Connection': nonce, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, body: JSON.stringify({ context: contextName, group: '', version: 'v1', resource: 'namespaces', namespace, name: namespace, uid: namespaceUID, resourceVersion: target.value.metadata.resourceVersion, action: 'restart', dryRun: true }), signal: AbortSignal.timeout(Math.min(12000, remaining())) });
  await action.arrayBuffer(); expect(action.status === 403, 'Production readonly shared actions authorization gate did not reject403');
  return { diagnostic: { readOnly: true, serverReadOnly: true, managementEnabled: false, managementAvailable: false, serverWriteAllowedDerivedFromServerReadOnly: false }, operatorCookieFlags: operator.flags, enableStatus: management.status, createStatus: response.status, deniedObjectGETBefore: 404, deniedObjectGETAfter: 404, actionStatus: action.status, actionProbe: 'identity-valid namespace, shared mutation authorization gate, dryRun=true; not a workload operation completion test', cookie: cookies };
}
async function stopGateway(gateway) {
  const waitExit = () => new Promise(resolve => {
    if (gateway.exited) return resolve();
    const done = () => { clearTimeout(timer); gateway.child.off('exit', done); resolve(); };
    const timer = setTimeout(done, 6000); gateway.child.once('exit', done);
  });
  if (!gateway.exited) gateway.child.kill('SIGTERM');
  await waitExit();
  if (!gateway.exited) { gateway.child.kill('SIGKILL'); await waitExit(); gateway.public.cleanupForcedKill = true; }
  let alive = true; try { process.kill(gateway.child.pid, 0); } catch { alive = false; }
  expect(!alive, 'Owned gateway PID remained alive after cleanup'); gateway.public.stopped = true; gateway.public.exitCode = gateway.child.exitCode; gateway.public.signalCode = gateway.child.signalCode;
}
try {
  await fs.mkdir(privateDir, { mode: 0o700 });
  result.guardBefore = await guard(); result.runtimeSourceBefore = await runtimeHashes();
  const originalSHA = sha(await fs.readFile(originalBinary)); expect(originalSHA === expectedBinary, 'Root install binary SHA is not the authorized current b741 candidate');
  await fs.copyFile(originalBinary, frozenBinary, fsConstants.COPYFILE_EXCL); await fs.chmod(frozenBinary, 0o700);
  expect(sha(await fs.readFile(frozenBinary)) === expectedBinary, 'Private binary copy SHA mismatch');
  result.binary = { source: path.relative(root, originalBinary), privateFrozenPath: path.relative(root, frozenBinary), sha256: expectedBinary, expectedCommit: '0f5a5ab', frontend: 'current root rebuilt frontend including focus fix; copied atomically before launch', sourceBeforeAfterGuard: true };
  const plain = await startGateway(18412);
  await step('current binary version and readonly server diagnostics/direct mutation denial', async () => {
    const version = await http(plain, 'GET', '/api/version'); expect(version.status === 200 && version.value.commit?.startsWith('0f5a5ab'), 'Copied production binary commit marker mismatch'); result.binary.reportedVersion = version.value;
    const proof = await readonlyChecks(plain); delete proof.cookie; return proof;
  });
  await step('actual readonly WebSocket same-origin SNAPSHOT and three hostile Origin handshakes', async () => {
    const positive = await websocket(plain);
    const negatives = [];
    for (const [name, origin] of [['foreign', 'https://foreign.invalid'], ['opaque', 'null'], ['wrong-scheme', plain.url.replace(/^http:/, 'https:')]]) negatives.push({ name, ...await websocket(plain, { origin, expectedStatus: 403 }) });
    return { positive, negatives };
  });
  const token = crypto.randomBytes(32).toString('hex'); secrets.push(token);
  const auth = await startGateway(18413, token);
  await step('actual API_TOKEN absent/wrong HTTP and WebSocket401; proper Bearer200', async () => {
    const missing = await http(auth, 'GET', '/api/contexts'), wrong = await http(auth, 'GET', '/api/contexts', { bearer: 'deliberately-wrong-test-token' });
    expect(missing.status === 401 && wrong.status === 401, 'Actual token HTTP missing/wrong did not return401');
    const wsMissing = await websocket(auth, { expectedStatus: 401 }), wsWrong = await websocket(auth, { bearer: 'deliberately-wrong-test-token', expectedStatus: 401 });
    const proper = await http(auth, 'GET', '/api/contexts', { bearer: token }); expect(proper.status === 200, 'Actual proper Bearer read failed');
    return { missingHTTP: 401, wrongHTTP: 401, missingWS: wsMissing.handshakeStatus, wrongWS: wsWrong.handshakeStatus, properBearerHTTP: 200 };
  });
  await step('actual token session login and HttpOnly SameSiteStrict cookie read/WS flow', async () => {
    const missing = await http(auth, 'POST', '/api/session', { body: {} }), wrong = await http(auth, 'POST', '/api/session', { body: { token: 'deliberately-wrong-test-token' } });
    expect(missing.status === 401 && wrong.status === 401, 'Actual token session missing/wrong did not return401');
    const login = await http(auth, 'POST', '/api/session', { body: { token } }); expect(login.status === 200, 'Actual token session login failed');
    const session = cookie(login.cookies, 'kubeview_session'); expect(session.flags.httpOnly && session.flags.sameSiteStrict && session.flags.pathRoot, 'Actual token session cookie flags incorrect');
    const read = await http(auth, 'GET', '/api/contexts', { cookie: session.pair }); expect(read.status === 200, 'Actual session-cookie-only read failed');
    const snapshot = await websocket(auth, { cookie: session.pair });
    const proof = await readonlyChecks(auth, undefined, session.pair); delete proof.cookie;
    return { missingSessionStatus: 401, wrongSessionStatus: 401, loginStatus: 200, cookieFlags: session.flags, cookieOnlyReadStatus: 200, cookieOnlyWS: snapshot, readonlyAfterAuthentication: proof, secureFlagScope: 'Secure=false is expected for direct loopback HTTP; code sets Secure for actual TLS' };
  });
  await step('proper authentication does not bypass actual WebSocket Origin boundary', async () => {
    const positive = await websocket(auth, { bearer: token }), negatives = [];
    for (const [name, origin] of [['foreign', 'https://foreign.invalid'], ['opaque', 'null'], ['wrong-scheme', auth.url.replace(/^http:/, 'https:')]]) negatives.push({ name, ...await websocket(auth, { bearer: token, origin, expectedStatus: 403 }) });
    return { positive, negatives };
  });
  result.status = 'PASS';
} catch (error) { result.status = 'FAIL'; result.error = safeError(error); }
finally {
  for (const socket of sockets) socket.terminate(); sockets.clear();
  result.cleanupErrors = [];
  for (const gateway of children.reverse()) try { await stopGateway(gateway); } catch (error) { result.cleanupErrors.push(safeError(error)); result.status = 'FAIL'; }
  try {
    result.guardAfter = await guard(); result.runtimeSourceAfter = await runtimeHashes();
    result.runtimeSourceUnchanged = JSON.stringify(result.runtimeSourceBefore) === JSON.stringify(result.runtimeSourceAfter);
    result.binaryCopySHAAfter = sha(await fs.readFile(frozenBinary)); expect(result.binaryCopySHAAfter === expectedBinary && result.runtimeSourceUnchanged, 'Final source/binary identity mismatch');
    result.allOwnedGatewayPIDsStopped = result.gateways.every(gateway => gateway.stopped);
  } catch (error) { result.cleanupErrors.push(safeError(error)); result.status = 'FAIL'; }
  result.finishedAt = new Date().toISOString(); result.wallSeconds = (Date.now() - started) / 1000;
  result.counts = { PASS: result.checks.filter(check => check.status === 'PASS').length, FAIL: result.checks.filter(check => check.status === 'FAIL').length, SKIP: 0 };
  result.limits = ['No normal browser UI acceptance is claimed', 'Actual HTTP loopback; no real TLS termination/cookie Secure transport test', 'Shared actions authorization probe is dryRun=true against identity-valid namespace, not a workload operation', 'Root main18410 and relay forwarding process were untouched', 'Raw production server logs remain private under .git, never a public artifact'];
  await save();
}
console.log(JSON.stringify({ status: result.status, counts: result.counts, runtimeSourceUnchanged: result.runtimeSourceUnchanged, binarySHA256: result.binaryCopySHAAfter, allOwnedGatewayPIDsStopped: result.allOwnedGatewayPIDsStopped, evidence: path.relative(root, resultPath) }, null, 2));
if (result.status !== 'PASS') process.exitCode = 1;
