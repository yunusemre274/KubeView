// Bounded supervision of one owned test job. No product import, global kill or
// process-name matching. Sampling/ownership bookkeeping is outside the browser.
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function within(promise, ms) {
  let timer;
  try { return await Promise.race([promise, new Promise(resolve => { timer = setTimeout(() => resolve(null), ms); })]); }
  finally { clearTimeout(timer); }
}
async function processes() {
  const { stdout } = await execute('ps', ['-axo', 'pid=,ppid=,pgid=,stat=,lstart=,comm='], {
    encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' }, maxBuffer: 4 * 1024 * 1024, timeout: 2000,
  });
  const rows = new Map();
  for (const line of stdout.split('\n')) {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(\S+\s+\S+\s+\d+\s+\d\d:\d\d:\d\d\s+\d{4})\s+(.+)$/);
    if (!match) continue;
    const [, pid, ppid, pgid, state, birth, command] = match;
    rows.set(Number(pid), { pid: Number(pid), ppid: Number(ppid), pgid: Number(pgid), state, birth: birth.replace(/\s+/g, ' '), command });
  }
  if (!rows.size) throw Error('Cannot parse process birth identities; refusing guessed ownership');
  return rows;
}
const liveMatch = (record, current) => Boolean(record?.birth && current?.birth === record.birth && !current.state?.includes('Z'));

// Exported for the small PID-reuse guard test; send defaults to positive-PID
// signalling only. A current process with the same PID but another birth is not
// owned. Unknown records are never signalled.
export function signalOwnedProcesses(owned, current, signal, send = process.kill.bind(process)) {
  const sent = [], refused = [], errors = [];
  for (const record of owned.values()) {
    const actual = current.get(record.pid);
    if (!actual || actual.state?.includes('Z')) continue;
    if (!liveMatch(record, actual)) { refused.push(record.pid); continue; }
    try { send(record.pid, signal); sent.push({ pid: record.pid, birth: record.birth, signal }); }
    catch (error) { if (error.code !== 'ESRCH') errors.push({ pid: record.pid, error: error.message }); }
  }
  return { sent, refused, errors };
}

/**
 * Execute exactly one argv. onOutput(chunk) may return an async write; pipe
 * draining and those writes finish before this resolves. onSpawn receives the
 * created child PID/PGID and its first observed birth identity for lease records.
 *
 * SIGINT/SIGTERM/SIGHUP are intercepted only while this job is active. The
 * returned interrupted value tells the worker to stop, rather than start another
 * job. Caller must keep its lease if cleanupComplete is false.
 *
 * ps ancestry sampling cannot discover an unknown process which detached AND
 * orphaned entirely between observations. Job-specific own-resource cleanup is
 * still required; never infer ownership from an executable name or open port.
 */
export async function superviseJob({ argv, cwd, env, timeoutSeconds, onOutput = () => {}, onSpawn = () => {} }) {
  if (!Array.isArray(argv) || !argv.length || !argv.every(value => typeof value === 'string') || !Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0)
    throw Error('A single argv and finite positive timeoutSeconds are required');
  const began = Date.now(), owned = new Map(), signalLog = [], scanErrors = [];
  let child, exitResult, lastSnapshot = new Map(), pendingScan, outputTail = Promise.resolve();
  let timedOut = false, interrupted = null, error = null, stopped = false, overflow = false;
  let resolveStop, resolveExit, resolveClose, monitor, deadline;
  const stopPromise = new Promise(resolve => { resolveStop = resolve; });
  const exitPromise = new Promise(resolve => { resolveExit = resolve; });
  const closePromise = new Promise(resolve => { resolveClose = resolve; });
  const requestStop = () => { stopped = true; resolveStop(); };
  const handlers = Object.fromEntries(['SIGTERM', 'SIGINT', 'SIGHUP'].map(signal => [signal, () => { interrupted ||= signal; requestStop(); }]));
  for (const [signal, handler] of Object.entries(handlers)) process.on(signal, handler);
  async function scan() {
    if (pendingScan) return pendingScan;
    pendingScan = (async () => {
      const current = await processes();
      lastSnapshot = current;
      const leader = current.get(child?.pid);
      if (leader && !owned.has(leader.pid) && child.exitCode === null && child.signalCode === null)
        owned.set(leader.pid, leader);
      let changed;
      do {
        changed = false;
        for (const record of current.values()) {
          if (record.state.includes('Z')) continue;
          if (liveMatch(owned.get(record.pid), record)) continue;
          // Adopt descendants only while their actual parent birth still matches
          // a known owner. A recycled parent PID cannot acquire unrelated tasks.
          if (!liveMatch(owned.get(record.ppid), current.get(record.ppid))) continue;
          if (owned.size >= 4096) { overflow = true; requestStop(); break; }
          owned.set(record.pid, record); changed = true;
        }
      } while (changed && !overflow);
      return current;
    })().catch(cause => {
      if (scanErrors.length < 5) scanErrors.push(cause.message);
      error ||= cause.message; requestStop();
      return lastSnapshot;
    }).finally(() => { pendingScan = null; });
    return pendingScan;
  }
  const survivors = () => [...owned.values()].filter(record => liveMatch(record, lastSnapshot.get(record.pid)));
  async function signalCurrent(signal) {
    const snapshot = await scan();
    const result = signalOwnedProcesses(owned, snapshot, signal);
    signalLog.push(...result.sent);
    if (result.errors.length) error ||= JSON.stringify(result.errors);
  }
  try {
    child = spawn(argv[0], argv.slice(1), { cwd, env: env || process.env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.once('error', cause => {
      error ||= cause.message;
      exitResult = { code: null, signal: null, error: cause.message };
      resolveExit(); requestStop();
    });
    child.once('exit', (code, signal) => { exitResult = { code, signal }; resolveExit(); });
    child.once('close', () => resolveClose(true));
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
      stream.pause();
      outputTail = outputTail.then(() => onOutput(chunk)).catch(cause => {
        error ||= `Output: ${cause.message}`; requestStop();
      }).finally(() => stream.resume());
    });
    deadline = setTimeout(() => { timedOut = true; requestStop(); }, timeoutSeconds * 1000);
    if (child.pid) {
      await scan();
      await onSpawn({ pid: child.pid, pgid: child.pid, birth: owned.get(child.pid)?.birth || null, started: new Date(began).toISOString() });
      monitor = setInterval(() => { void scan(); }, 1000);
    }
    await Promise.race([exitPromise, stopPromise]);
  } catch (cause) { error ||= cause.message; requestStop(); }
  // One cleanup path for normal exit, timeout, callback failure and worker close.
  // Keep observing during the grace period so children in other PGIDs are also
  // tracked before their parent exits. Signal only fresh, verified identities.
  let closed = false, outputDrained = false;
  try {
    if (child?.pid) {
      await scan();
      if (!stopped) { await sleep(75); await scan(); }
      if (survivors().length) {
        await signalCurrent('SIGTERM');
        const grace = Date.now() + 2500;
        while (survivors().length && Date.now() < grace) { await sleep(100); await scan(); }
        if (survivors().length) await signalCurrent('SIGKILL');
        const killed = Date.now() + 1500;
        while (survivors().length && Date.now() < killed) { await sleep(100); await scan(); }
      }
      closed = await within(closePromise, 1000) === true;
    } else closed = true;
    outputDrained = await within(outputTail.then(() => true), 1000) === true;
  } catch (cause) { error ||= `Cleanup: ${cause.message}`; }
  finally {
    clearTimeout(deadline); clearInterval(monitor);
    for (const [signal, handler] of Object.entries(handlers)) process.removeListener(signal, handler);
  }
  const remaining = survivors().map(({ pid, birth, pgid, command }) => ({ pid, birth, pgid, command }));
  // Unknown members of the exact process group we created are reported, never
  // killed by a broad group signal. Separate unknown detached groups are outside
  // ancestry-sampling proof and require job-specific resource ownership checks.
  const unknownGroupMembers = [...lastSnapshot.values()].filter(record => record.pgid === child?.pid && !record.state.includes('Z') && !liveMatch(owned.get(record.pid), record));
  const cleanupComplete = !remaining.length && !unknownGroupMembers.length && !overflow && !scanErrors.length && closed && outputDrained;
  return {
    ...(exitResult || { code: child?.exitCode ?? null, signal: child?.signalCode ?? null }),
    pid: child?.pid || null, timedOut, interrupted, error, cleanupComplete, outputDrained,
    durationMs: Date.now() - began, ownership: [...owned.values()],
    cleanup: { complete: cleanupComplete, remaining, unknownGroupMembers, signals: signalLog, scanErrors, overflow, childPipesClosed: closed },
  };
}
