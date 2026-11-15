// Availability is a completed check even when installed Safari is unavailable.
// Exit2 from the existing probe means N/A, never a Safari benchmark pass.
import { spawn } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const session = JSON.parse(await readFile(path.join(root, 'benchmarks/panel-final-session.json'), 'utf8'));
const id = `${session.id}-native-safari`, out = path.join(root, 'benchmarks/results', id);
try {
  await access(path.join(out, 'availability.json'));
  throw Error('Safari availability result already exists; preserve it and choose an explicit new run id');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await new Promise((resolve, reject) => {
  const socket = createServer();
  socket.once('error', reject);
  socket.listen(6199, '127.0.0.1', () => socket.close(resolve));
});
const child = spawn(process.execPath, ['benchmarks/safari-check.mjs', '--id', id], { cwd: root, stdio: 'inherit', detached: true });
const stopOwnGroup = () => {
  if (!child.pid) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch (e) { if (e.code !== 'ESRCH') throw e; }
};
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stopOwnGroup);
const timeout = setTimeout(stopOwnGroup, 90000);
const result = await new Promise(resolve => {
  child.once('error', error => resolve({ error: error.message }));
  child.once('exit', (code, signal) => resolve({ code, signal }));
});
clearTimeout(timeout);
stopOwnGroup();
const availability = await readFile(path.join(out, 'availability.json'), 'utf8').then(JSON.parse).catch(() => null);
const unavailable = result.code === 2 && availability?.status === 'unavailable';
const available = result.code === 0 && availability?.status === 'available';
const report = { finished: new Date().toISOString(), result, status: available ? 'available' : unavailable ? 'unavailable' : 'failed', availabilityCheckCompleted: available || unavailable, nativeSafariPerformance: 'N/A — availability probe is not a performance measurement', manualFallback: 'Owned manual benchmark entry remains a separate root-operated check; no user Safari setting or tab was modified' };
if (availability) await writeFile(path.join(out, 'contract.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report));
if (!available && !unavailable) process.exitCode = 1;
