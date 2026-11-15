// Local test supervision. Managers delegate; workers run one bounded job.
// Root alone approves jobs. One exclusive lease prevents CPU/GPU contamination.
import { readFile, writeFile, mkdir, rm, open, appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { superviseJob } from './supervise-job.mjs';
const root = process.cwd(), directory = path.join(root, 'benchmarks/orchestration');
const queueFile = path.join(directory, 'queue.json'), lock = path.join(directory, 'queue.lock');
const [mode, role] = process.argv.slice(2);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const log = message => console.log(`${new Date().toISOString()} ${message}`);
async function change(callback) {
  const deadline = Date.now() + 5000;
  while (true) {
    try { await mkdir(lock); break; } catch (e) {
      if (e.code !== 'EEXIST' || Date.now() > deadline) throw e;
      await sleep(100);
    }
  }
  try {
    const q = JSON.parse(await readFile(queueFile, 'utf8'));
    const result = await callback(q);
    await writeFile(`${queueFile}.tmp`, JSON.stringify(q, null, 2));
    const { rename } = await import('node:fs/promises');
    await rename(`${queueFile}.tmp`, queueFile);
    return result;
  } finally { await rm(lock, { recursive: true }); }
}
const read = async () => JSON.parse(await readFile(queueFile, 'utf8'));
if (mode === 'add-plan') {
  const plan = JSON.parse(await readFile(process.argv[4], 'utf8'));
  await change(q => {
    for (const item of plan.jobs) {
      if (q.jobs.some(j => j.id === item.id)) throw Error(`Job already exists: ${item.id}`);
      q.jobs.push({ ...item, argv: item.argv || item.command, role, status: 'held' });
    }
  });
  log(`Added ${plan.jobs.length} ${role} job(s)`);
} else if (mode === 'grant') {
  await change(async q => {
    if (q.lease || q.shutdown) throw Error('Resource lease or shutdown prevents a new grant; no automatic stale-lease expiry');
    const job = q.jobs.find(j => j.id === role);
    if (!job || job.status !== 'held') throw Error('Only an existing held job may be granted');
    if (q.jobs.some(j => ['approved', 'assigned', 'running'].includes(j.status))) throw Error('Another job already holds the exclusive budget');
    const processes = execFileSync('ps', ['-axo', 'command='], { encoding: 'utf8' });
    if (processes.split('\n').some(line => /(?:^|\s)(?:node|\S+\/node) benchmarks\/(?:run|panel-finish|evidence)\.mjs\b/.test(line))) throw Error('External benchmark is running: leave it untouched and wait for its checkpoint');
    const session = JSON.parse(await readFile(path.join(root, 'benchmarks/panel-final-session.json'), 'utf8'));
    const source = JSON.parse(await readFile(path.join(root, `benchmarks/.build/${session.candidate}.json`), 'utf8'));
    for (const [file, expected] of Object.entries(source.files)) {
      const sha = createHash('sha256').update(await readFile(path.join(root, 'frontend', file))).digest('hex');
      if (sha !== expected) throw Error(`Frozen production source changed: ${file}; do not mix measurements`);
    }
    job.verifiedSourceSHA256 = source.sourceSHA256;
    job.status = 'approved'; job.approvedAt = new Date().toISOString();
  });
  log(`Granted ${role}`);
} else if (mode === 'manager' || mode === 'worker') {
  if (!['frontend', 'backend', 'perf'].includes(role)) throw Error('Unknown role');
  process.title = mode === 'manager' ? `KV-${role.toUpperCase()}-MANAGER` : `KV-WORKER-0${{frontend:1,backend:2,perf:3}[role]}`;
  const name = `${mode.toUpperCase()}:${role}`, began = Date.now();
  const pidFile = path.join(directory, `${role}-${mode}-process.json`);
  await writeFile(pidFile, JSON.stringify({ pid: process.pid, role, mode, started: new Date().toISOString() }, null, 2));
  log(`${name} PID=${process.pid}; one job at a time; waiting for root resource grant`);
  let seen = '', managerBytes = 0;
  while (Date.now() - began < 4 * 60 * 60 * 1000) {
    const q = await read();
    if (q.shutdown) { log(`${name} stopped by root after collecting results`); break; }
    if (mode === 'manager') {
      const history = await readFile(path.join(directory, `${role}-manager.log`), 'utf8').catch(() => '');
      if (history.length > managerBytes) process.stdout.write(history.slice(managerBytes));
      managerBytes = history.length;
    }
    const jobs = q.jobs.filter(j => j.role === role);
    const state = jobs.map(j => `${j.id}=${j.status}`).join(' | ');
    if (state !== seen) { log(`${name} ${state}`); seen = state; }
    if (mode === 'manager') {
      if (jobs.some(j => j.status === 'approved')) await change(current => {
        for (const job of current.jobs.filter(j => j.role === role && j.status === 'approved')) {
          job.status = 'assigned'; job.managerPID = process.pid;
          job.delegatedAt = new Date().toISOString();
          log(`Delegated ${job.id} to ${job.worker}: ${JSON.stringify(job.argv)}`);
        }
      });
    } else {
      const next = jobs.find(j => j.status === 'assigned');
      if (next) {
        await change(current => {
          if (current.lease) throw Error('Exclusive resource lease occupied');
          const job = current.jobs.find(j => j.id === next.id);
          if (job.status !== 'assigned') throw Error('Job already claimed');
          current.lease = { job: job.id, workerPID: process.pid, started: new Date().toISOString() };
          job.status = 'running'; job.workerPID = process.pid; job.started = new Date().toISOString();
        });
        const output = path.join(directory, `${next.id}.stdout.log`);
        let fd, result;
        try {
          fd = await open(output, 'wx');
          log(`RUN ${next.id} output=${output}\n${JSON.stringify(next.argv)}`);
          result = await superviseJob({ argv: next.argv, cwd: root, env: { ...process.env, ...(next.env || {}) }, timeoutSeconds: next.timeoutSeconds,
            onOutput: async data => { process.stdout.write(data); await fd.write(data); },
            onSpawn: identity => change(current => { current.lease.child = identity; current.jobs.find(j => j.id === next.id).child = identity; }),
          });
        } catch (error) { result = { code: null, error: error.stack, cleanupComplete: false }; }
        finally { await fd?.close(); }
        await change(current => {
          const job = current.jobs.find(j => j.id === next.id);
          const passed = result.code === 0 && !result.error && !result.timedOut && !result.interrupted && result.cleanupComplete && result.outputDrained;
          Object.assign(job, { status: passed ? 'complete' : 'failed', result, finished: new Date().toISOString(), output });
          if (result.cleanupComplete) current.lease = null;
          else current.lease.cleanupRequired = true;
        });
        log(`RESULT ${next.id}: ${JSON.stringify(result)}; no automatic retry`);
        if (result.interrupted || !result.cleanupComplete) break;
      }
    }
    await sleep(2000);
  }
} else if (mode === 'status') {
  const q = await read(); log(JSON.stringify({ lease: q.lease, jobs: q.jobs.map(({ id, role, status, result }) => ({ id, role, status, result })) }, null, 2));
} else if (mode === 'shutdown') {
  await change(q => { if (q.lease) throw Error('Do not shut down a valid active job'); q.shutdown = true; });
} else throw Error('Usage: control.mjs manager|worker ROLE; grant JOB_ID; status; shutdown');
