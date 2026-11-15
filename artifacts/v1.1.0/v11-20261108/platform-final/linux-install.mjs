// PREPARED ONLY. Run only with root's explicit final platform lease and exact
// final commit/binary/source-proof hashes. No build, cluster mutation or source
// tree mount is performed. Docker mutations target one uniquely labeled ID.
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
const execute = promisify(execFile), root = process.cwd();
const require = createRequire(path.join(root, 'frontend/package.json'));
const YAML = require('yaml');
const leaseName = 'v11-20261108-platform-final';
if (process.env.KUBEVIEW_PLATFORM_FINAL_LEASE !== leaseName) throw Error('Root final platform lease is required; helper was not run');
const expectedCommit = process.env.KUBEVIEW_PLATFORM_EXPECT_COMMIT || '';
const expectedBinary = process.env.KUBEVIEW_PLATFORM_EXPECT_BINARY_SHA256 || '';
const sourceProofInput = process.env.KUBEVIEW_PLATFORM_SOURCE_PROOF || '';
const expectedProof = process.env.KUBEVIEW_PLATFORM_EXPECT_SOURCE_PROOF_SHA256 || '';
if (!/^[0-9a-f]{40}$/.test(expectedCommit) || !/^[0-9a-f]{64}$/.test(expectedBinary) || !/^[0-9a-f]{64}$/.test(expectedProof) || !sourceProofInput) throw Error('Exact final commit/binary/source-proof identity is required');
const sourceProofPath = path.resolve(root, sourceProofInput);
if (!sourceProofPath.startsWith(path.join(root, 'artifacts') + path.sep)) throw Error('Source proof must be an existing public artifact');
const contextName = 'kv-repair-1101', clusterUID = 'a24740ba-cf3e-461d-b5b3-250deeb060d7';
const controlPlaneName = 'kv-repair-1101';
const controlPlaneID = '4d805a40fcfb9f6ac32fb551642d73685f65bd7210e7ad785cb0d9e5dc5ec851';
const privateRoot = path.join(root, '.git/kv-v11-runtime');
const hostConfig = path.join(privateRoot, 'kubeconfig-a');
const linuxConfig = path.join(privateRoot, 'kubeconfig-linux');
const tokenPath = path.join(privateRoot, 'linux-operator-token');
const binaryPath = path.join(root, 'dist/kubeview_1.1.0_linux-amd64/kubeview');
const runID = `linux-final-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
const privateDir = path.join(privateRoot, runID);
const out = path.join(root, 'artifacts/v1.1.0/v11-20261108/platform-final');
const resultPath = path.join(out, `${runID}.json`);
const dockerName = `kv-v11-platform-${crypto.randomBytes(6).toString('hex')}`;
const started = Date.now(), deadline = started + 190000, cleanupDeadline = started + 240000, port = 18511;
const knownSecrets = [], sha = data => crypto.createHash('sha256').update(data).digest('hex');
let dockerID = null, network = null, frozenBinary = null, token = null, cleaning = false, creationAttempted = false;
const result = { runID, status: 'RUNNING', startedAt: new Date().toISOString(), kind: 'Final Linux AMD64 production binary install/API smoke under Docker emulation on macOS ARM64; not native Intel or a browser/performance test', checks: [], clusterMutations: 0, providersEnabled: false, credentialValuesLogged: false, sourceBuildIdentity: { expectedCommit, expectedBinarySHA256: expectedBinary, sourceProof: path.relative(root, sourceProofPath), sourceProofSHA256: expectedProof }, privateLogsOnly: true };
const assert = (condition, message) => { if (!condition) throw Error(message); };
const remaining = () => { const value = (cleaning ? cleanupDeadline : deadline) - Date.now(); assert(value > 0, 'Bounded final platform timeout reached'); return value; };
const safeError = error => knownSecrets.reduce((text, secret) => secret ? text.split(secret).join('[REDACTED]') : text, String(error?.message || error)).slice(0, 700);
const save = () => fs.writeFile(resultPath, JSON.stringify(result, null, 2) + '\n');
async function command(program, args, timeout = 15000) {
  try { return await execute(program, args, { cwd: root, timeout: Math.min(timeout, remaining()), maxBuffer: 4 << 20 }); }
  catch { throw Error(`Bounded ${program} command failed; no raw command output published`); }
}
async function jsonCommand(program, args) { return JSON.parse((await command(program, args)).stdout); }
async function inspectContainer(id) { return (await jsonCommand('docker', ['inspect', id]))[0]; }
async function sourceIdentity() {
  const data = await fs.readFile(sourceProofPath); assert(sha(data) === expectedProof, 'Final source-proof hash changed');
  const proof = JSON.parse(data); assert(proof.commit === expectedCommit, 'Final source proof commit mismatch');
  const buildData = await fs.readFile(path.join(root, 'dist/build.json')), build = JSON.parse(buildData);
  assert(build.commit === expectedCommit && build.dirty === false && build.version === '1.1.0' && build.targets?.includes('linux-amd64'), 'Final dist build identity is not clean/matching');
  const bytes = await fs.readFile(binaryPath); assert(sha(bytes) === expectedBinary, 'Final Linux dist binary SHA mismatch');
  assert(bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])) && bytes[4] === 2 && bytes[5] === 1 && bytes.readUInt16LE(18) === 62, 'Expected ELF64 little-endian AMD64 binary');
  const previous = JSON.parse(await fs.readFile(path.join(root, 'artifacts/v1.1.0/v11-20261108/backend/live-log-roles-metadata.json'), 'utf8'));
  const runtime = {};
  for (const [file, value] of Object.entries(previous.runtime_source_files_before)) { runtime[file] = sha(await fs.readFile(path.join(root, file))); assert(runtime[file] === value, 'Gateway runtime16 source mismatch'); }
  const frontendFiles = proof.frontendProvenance?.files;
  assert(frontendFiles && Object.keys(frontendFiles).length > 0, 'Final proof must contain frozen frontend provenance files');
  for (const [file, value] of Object.entries(frontendFiles)) {
    const location = path.resolve(root, 'frontend', file); assert(location.startsWith(path.join(root, 'frontend') + path.sep), 'Frontend provenance path escaped root');
    assert(sha(await fs.readFile(location)) === value, 'Frozen frontend source/proof mismatch');
  }
  const assets = {};
  async function walk(folder, prefix = '') { for (const entry of await fs.readdir(folder, { withFileTypes: true })) { const name = path.posix.join(prefix, entry.name), location = path.join(folder, entry.name); if (entry.isDirectory()) await walk(location, name); else if (entry.isFile()) assets[name] = sha(await fs.readFile(location)); } }
  await walk(path.join(root, 'frontend/dist'));
  assert(assets['index.html'], 'Final frontend dist index missing');
  return { commit: expectedCommit, distBuildSHA256: sha(buildData), binarySHA256: expectedBinary, sourceProofSHA256: expectedProof, gatewayRuntime16: runtime, frozenFrontendFileCount: Object.keys(frontendFiles).length, frozenFrontendSourceSHA256: proof.frontendProvenance.sourceSHA256, frontendAssets: assets, frontendAssetsSHA256: sha(JSON.stringify(Object.entries(assets).sort(([a], [b]) => a.localeCompare(b)))) };
}
async function ownedGuard() {
  const namespaces = await jsonCommand('kubectl', ['--kubeconfig', hostConfig, '--context', contextName, 'get', 'namespace', 'kube-system', '-o', 'json']);
  assert(namespaces.metadata.uid === clusterUID, 'Actual owned A kube-system UID guard failed');
  const nodes = await jsonCommand('kubectl', ['--kubeconfig', hostConfig, '--context', contextName, 'get', 'nodes', '-o', 'json']);
  assert(nodes.items.length === 3, 'Owned A must have exactly3 actual Nodes');
  const cp = await inspectContainer(controlPlaneName);
  assert(cp.Id === controlPlaneID && cp.Name === '/' + controlPlaneName && cp.State.Running, 'Owned control-plane Docker ID/name/running guard failed');
  const labels = cp.Config.Labels || {};
  assert(Object.values(labels).includes(controlPlaneName), 'Owned minikube container profile label guard failed');
  const cfgText = await fs.readFile(linuxConfig, 'utf8'); let cfg;
  try { cfg = YAML.parse(cfgText); } catch { throw Error('Private Linux kubeconfig parsing failed; content omitted'); }
  const selected = cfg.contexts?.find(item => item.name === contextName)?.context;
  const cluster = cfg.clusters?.find(item => item.name === selected?.cluster)?.cluster;
  const user = cfg.users?.find(item => item.name === selected?.user)?.user;
  assert(selected && cluster && user, 'Private Linux selected trusted identity unavailable');
  const endpoint = new URL(cluster.server);
  assert(endpoint.protocol === 'https:' && endpoint.port === '8443' && !endpoint.username && !endpoint.password && !cluster['insecure-skip-tls-verify'] && cluster['certificate-authority-data'], 'Private Linux internal API/TLS guard failed');
  assert(!cluster['certificate-authority'] && !user['client-certificate'] && !user['client-key'] && !user['tokenFile'] && !user.exec && !user['auth-provider'], 'Private Linux identity must be self-contained; no extra host mounts/plugins');
  const matches = Object.entries(cp.NetworkSettings.Networks || {}).filter(([, value]) => value.IPAddress === endpoint.hostname);
  assert(matches.length === 1, 'Private Linux internal API IP does not match exact owned Docker network IP');
  const [name, details] = matches[0], actualNetwork = (await jsonCommand('docker', ['network', 'inspect', name]))[0];
  assert(actualNetwork.Id === details.NetworkID && actualNetwork.Containers?.[controlPlaneID]?.IPv4Address?.split('/')[0] === endpoint.hostname, 'Owned network membership/IP guard failed');
  const privateToken = (await fs.readFile(tokenPath, 'utf8')).trim(); assert(privateToken.length >= 32 && !/[\r\n]/.test(privateToken), 'Private application token invalid');
  knownSecrets.push(privateToken); token = privateToken;
  network = { name, id: actualNetwork.Id, internalAPIHost: endpoint.hostname, internalAPIPort: 8443 };
  return { context: contextName, clusterUID, controlPlaneID, network, actualNodeUIDs: Object.fromEntries(nodes.items.map(item => [item.metadata.name, item.metadata.uid]).sort(([a], [b]) => a.localeCompare(b))), CAValidationRetained: true, identityContentPublished: false };
}
async function portAvailable() { await new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', () => reject(Error('Reserved platform port18511 is in use'))); server.listen(port, '127.0.0.1', () => server.close(resolve)); }); }
async function http(pathname, authenticated = false) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, { headers: { Origin: `http://127.0.0.1:${port}`, ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) }, signal: AbortSignal.timeout(Math.min(12000, remaining())) });
  return { status: response.status, mime: response.headers.get('content-type') || '', bytes: Buffer.from(await response.arrayBuffer()) };
}
async function step(name, action) { const item = { name, status: 'RUNNING', startedAt: new Date().toISOString() }; result.checks.push(item); await save(); try { item.proof = await action(); item.status = 'PASS'; } catch (error) { item.status = 'FAIL'; item.error = safeError(error); throw error; } finally { item.finishedAt = new Date().toISOString(); await save(); } }
async function verifyOwnContainer() { const item = await inspectContainer(dockerID); assert(item.Id === dockerID && item.Name === '/' + dockerName && item.Config.Labels?.owner === 'v11-20261108' && item.Config.Labels?.['kubeview.io/platform-run'] === runID, 'Refusing mutation of non-owned Docker ID/labels/name'); return item; }
result.helperSHA256 = sha(await fs.readFile(new URL(import.meta.url)));
await fs.mkdir(out, { recursive: true }); await fs.mkdir(privateDir, { mode: 0o700 }); await fs.writeFile(resultPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
try {
  result.sourceBefore = await sourceIdentity(); result.guardBefore = await ownedGuard(); await portAvailable();
  frozenBinary = path.join(privateDir, 'kubeview'); const frozenConfig = path.join(privateDir, 'kubeconfig'), frozenToken = path.join(privateDir, 'operator-token');
  for (const [source, destination, mode] of [[binaryPath, frozenBinary, 0o700], [linuxConfig, frozenConfig, 0o600], [tokenPath, frozenToken, 0o600]]) { await fs.copyFile(source, destination, fsConstants.COPYFILE_EXCL); await fs.chmod(destination, mode); }
  assert(sha(await fs.readFile(frozenBinary)) === expectedBinary, 'Private frozen Linux binary copy mismatch');
  creationAttempted = true;
  const created = await command('docker', ['create', '--platform', 'linux/amd64', '--name', dockerName, '--label', 'owner=v11-20261108', '--label', `kubeview.io/platform-run=${runID}`, '--read-only', '--tmpfs', '/tmp:rw,nosuid,nodev,noexec,size=16777216', '--workdir', '/tmp', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--network', network.name, '--publish', '127.0.0.1:18511:18511', '--mount', `type=bind,src=${frozenBinary},dst=/opt/kubeview,readonly`, '--mount', `type=bind,src=${frozenConfig},dst=/run/identity/kubeconfig,readonly`, '--mount', `type=bind,src=${frozenToken},dst=/run/identity/operator-token,readonly`, '--env', 'READ_ONLY=true', '--env', 'KUBECONFIG=/run/identity/kubeconfig', '--env', 'KV_HUBBLE_ENABLED=false', '--env', 'KV_MINIKUBE_ENABLED=false', '--entrypoint', '/opt/kubeview', 'alpine:3.21', '--bind', '0.0.0.0', '--port', '18511', '--context', contextName, '--api-token-file', '/run/identity/operator-token'], 45000);
  dockerID = created.stdout.trim(); assert(/^[a-f0-9]{64}$/.test(dockerID), 'Owned Docker create did not return exact ID');
  const beforeStart = await verifyOwnContainer(); assert(beforeStart.HostConfig.ReadonlyRootfs && beforeStart.Config.WorkingDir === '/tmp', 'Container readonly rootfs/cwd mismatch');
  assert(beforeStart.Mounts.length === 3 && beforeStart.Mounts.every(item => !item.RW && ['/opt/kubeview', '/run/identity/kubeconfig', '/run/identity/operator-token'].includes(item.Destination)), 'Unexpected source/identity mount exposure');
  assert(beforeStart.HostConfig.PortBindings?.['18511/tcp']?.length === 1 && beforeStart.HostConfig.PortBindings['18511/tcp'][0].HostIp === '127.0.0.1', 'Platform port binding is not loopback only');
  await command('docker', ['start', dockerID]); result.container = { id: dockerID, name: dockerName, owner: 'v11-20261108', platform: 'linux/amd64', image: 'alpine:3.21', readonlyRootFilesystem: true, cwd: '/tmp', bindMountCount: 3, sourceTreeMounted: false, publishedHostIP: '127.0.0.1', port, privateRuntime: path.relative(root, privateDir) };
  for (let i = 0; i < 150; i++) { try { if ((await http('/healthz')).status === 200) break; } catch { /* bounded startup */ } if (i === 149) throw Error('Bounded emulated binary startup failed'); await new Promise(resolve => setTimeout(resolve, 100)); }
  await step('actual Linux AMD64 binary version and isolated runtime', async () => {
    const value = (await command('docker', ['exec', dockerID, '/opt/kubeview', '--version'])).stdout.trim(); assert(value.includes(expectedCommit) && value.endsWith('linux/amd64'), 'Actual Linux binary version/commit/architecture mismatch');
    await command('docker', ['exec', '--workdir', '/tmp', dockerID, 'sh', '-c', 'test "$(pwd)" = /tmp && ! command -v go >/dev/null && ! command -v node >/dev/null && ! command -v vite >/dev/null']);
    const inspected = await verifyOwnContainer();
    // Docker's content store can report an OCI index in container.Image. Its
    // generic inspect has blank OS/Arch; select the actual requested platform.
    const image = (await jsonCommand('docker', ['image', 'inspect', '--platform', 'linux/amd64', inspected.Image]))[0];
    const architecture = (await command('docker', ['exec', dockerID, 'uname', '-m'])).stdout.trim();
    const alpineRelease = (await command('docker', ['exec', dockerID, 'cat', '/etc/alpine-release'])).stdout.trim();
    assert(image.Os === 'linux' && image.Architecture === 'amd64' && architecture === 'x86_64' && /^3\.21\.[0-9]+$/.test(alpineRelease), 'Selected image/runtime architecture or Alpine release mismatch');
    return { version: value, containerImageDescriptorID: inspected.Image, selectedPlatformImageID: image.Id, imageSelection: 'docker image inspect --platform linux/amd64; container.Image may identify an OCI index', actualImageOS: image.Os, actualImageArchitecture: image.Architecture, unameMachine: architecture, alpineRelease, ELFMachine: 62, host: { os: process.platform, arch: process.arch }, emulatedOnMacOSARM64: process.platform === 'darwin' && process.arch === 'arm64', nativeIntelProof: false, noGoNodeVite: true, cwd: '/tmp' };
  });
  await step('embedded HTML/assets exact hashes and MIME under clean cwd', async () => {
    const index = await http('/'); assert(index.status === 200 && index.mime.includes('text/html') && sha(index.bytes) === result.sourceBefore.frontendAssets['index.html'], 'Embedded current HTML hash/MIME mismatch');
    const assets = [...new Set([...index.bytes.toString('utf8').matchAll(/\b(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map(match => match[1]))]; assert(assets.some(name => name.endsWith('.js')) && assets.some(name => name.endsWith('.css')), 'Embedded HTML missing actual JS/CSS asset references');
    const proofs = [];
    for (const name of assets) { const response = await http(name), relative = name.slice(1); assert(response.status === 200 && result.sourceBefore.frontendAssets[relative] === sha(response.bytes), 'Embedded asset is not exact frozen final dist'); if (name.endsWith('.js')) assert(/javascript/.test(response.mime), 'JS MIME mismatch'); if (name.endsWith('.css')) assert(response.mime.includes('text/css'), 'CSS MIME mismatch'); proofs.push({ file: relative, sha256: sha(response.bytes), mime: response.mime }); }
    const missing = await http('/assets/owned-final-missing.js'); assert(missing.status === 404 && !missing.mime.includes('text/html'), 'Missing asset incorrectly returned SPA HTML');
    return { HTMLSHA256: sha(index.bytes), assets: proofs, missingAssetStatus: 404 };
  });
  await step('missing auth401 and actual trusted contexts/connection readonly API', async () => {
    const denied = await http('/api/contexts'); assert(denied.status === 401, 'Missing application token did not return401');
    const contexts = await http('/api/contexts', true), list = JSON.parse(contexts.bytes); assert(contexts.status === 200 && list.contexts?.some(value => value.name === contextName), 'Actual trusted context unavailable');
    const connection = await http('/api/connection?' + new URLSearchParams({ context: contextName, namespace: 'kv-repair-v11-backend' }), true), value = JSON.parse(connection.bytes);
    assert(connection.status === 200 && value.context === contextName && value.checks?.api?.status === 'ok' && value.readOnly && value.serverReadOnly && !value.managementAvailable && !value.managementEnabled, 'Actual Linux API connection/read-only diagnostics failed');
    return { missingAuthStatus: 401, authenticatedContextsStatus: 200, authenticatedConnectionStatus: 200, apiStatus: value.checks.api.status, context: contextName, readOnly: true, serverReadOnly: true, managementEnabled: false, providersEnabled: false };
  });
  await step('actual owned3 Node UIDs and kube-system UID via Linux gateway', async () => {
    const nodeResponse = await http('/api/resources?' + new URLSearchParams({ context: contextName, version: 'v1', resource: 'nodes' }), true), nodes = JSON.parse(nodeResponse.bytes);
    const actual = Object.fromEntries((nodes.items || []).map(item => [item.metadata.name, item.metadata.uid])); assert(nodeResponse.status === 200 && Object.keys(actual).length === 3 && JSON.stringify(Object.entries(actual).sort()) === JSON.stringify(Object.entries(result.guardBefore.actualNodeUIDs).sort()), 'Linux gateway actual Node UID set differs from guarded A');
    const namespaceResponse = await http('/api/resources?' + new URLSearchParams({ context: contextName, version: 'v1', resource: 'namespaces', name: 'kube-system' }), true), namespace = JSON.parse(namespaceResponse.bytes); assert(namespaceResponse.status === 200 && namespace.metadata.uid === clusterUID, 'Linux gateway real cluster UID mismatch');
    return { actualNodeCount: 3, actualNodeUIDs: actual, actualKubeSystemUID: namespace.metadata.uid, CAValidationRetained: true, insecureTLSBypass: false };
  });
  result.status = 'PASS';
} catch (error) { result.status = 'FAIL'; result.error = safeError(error); }
finally {
  cleaning = true;
  result.cleanup = {};
  if (!dockerID && creationAttempted) {
    // A timed-out create may have succeeded in the daemon. Recover only this
    // unique run's exact labeled ID before attempting cleanup; never rm a name.
    try { const candidate = await inspectContainer(dockerName); if (candidate.Name === '/' + dockerName && candidate.Config.Labels?.owner === 'v11-20261108' && candidate.Config.Labels?.['kubeview.io/platform-run'] === runID) dockerID = candidate.Id; } catch { /* no matching container was found */ }
  }
  if (dockerID) {
    try {
      await verifyOwnContainer();
      try { const logs = await command('docker', ['logs', dockerID]); await fs.writeFile(path.join(privateDir, 'gateway.log'), logs.stdout + logs.stderr, { mode: 0o600 }); } catch { result.cleanup.privateLogCaptureUnavailable = true; }
      await command('docker', ['stop', '--time', '5', dockerID], 12000); await verifyOwnContainer(); await command('docker', ['rm', dockerID]);
      const check = await execute('docker', ['inspect', dockerID], { cwd: root, timeout: 8000, maxBuffer: 1 << 20 }).then(() => false, () => true); assert(check, 'Owned Docker ID remained after removal');
      result.cleanup.exactOwnedID = dockerID; result.cleanup.ownerLabelsVerifiedBeforeStopAndRemove = true; result.cleanup.removed = true; await portAvailable(); result.cleanup.port18511Free = true;
    } catch (error) { result.status = 'FAIL'; result.cleanup.error = safeError(error); }
  }
  try { result.sourceAfter = await sourceIdentity(); result.sourceUnchanged = JSON.stringify(result.sourceBefore) === JSON.stringify(result.sourceAfter); assert(result.sourceUnchanged, 'Final source/build/binary identity changed during smoke'); result.guardAfter = await ownedGuard(); assert(JSON.stringify(result.guardBefore) === JSON.stringify(result.guardAfter), 'Owned cluster/node/network identity changed during smoke'); result.guardUnchanged = true; if (frozenBinary) assert(sha(await fs.readFile(frozenBinary)) === expectedBinary, 'Private binary copy changed'); } catch (error) { result.status = 'FAIL'; result.finalGuardError = safeError(error); }
  result.finishedAt = new Date().toISOString(); result.wallSeconds = (Date.now() - started) / 1000; result.counts = { PASS: result.checks.filter(check => check.status === 'PASS').length, FAIL: result.checks.filter(check => check.status === 'FAIL').length, SKIP: 0 }; result.noOtherContainersMutated = true; result.nativeLinuxBrowserOrIntelPerformanceProof = false; await save();
}
console.log(JSON.stringify({ status: result.status, counts: result.counts, binarySHA256: expectedBinary, sourceUnchanged: result.sourceUnchanged, ownedContainerRemoved: result.cleanup.removed, portFree: result.cleanup.port18511Free, evidence: path.relative(root, resultPath) }, null, 2));
if (result.status !== 'PASS') process.exitCode = 1;
