// Pure harness helpers. lstart is second-resolution OS evidence, not PID alone.
export function parseCpuTime(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(?:(\d+)-)?(\d+):([0-5]\d)(?::([0-5]\d(?:\.\d+)?))?(\.\d+)?$/);
  if (!match || (match[4] !== undefined && match[5] !== undefined) || match[1] !== undefined && match[4] === undefined) return null;
  const days = Number(match[1] || 0);
  const seconds = match[4] === undefined
    ? Number(match[2]) * 60 + Number(match[3] + (match[5] || ''))
    : Number(match[2]) * 3600 + Number(match[3]) * 60 + Number(match[4]);
  const total = days * 86400 + seconds;
  return Number.isFinite(total) && total >= 0 ? total : null;
}
export function parseProcessRows(text, platform = 'darwin') {
  if (!['darwin', 'linux'].includes(platform)) throw Error('Unsupported ps birth format');
  const rows = [];
  for (const line of text.split('\n').filter(line => line.trim())) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(\S+)\s+(\d+)\s+(.+)$/);
    if (!m || !Number.isFinite(Date.parse(m[3])) || parseCpuTime(m[4]) === null) throw Error('Malformed ps identity row');
    rows.push({ pid: Number(m[1]), ppid: Number(m[2]), birth: new Date(m[3]).toISOString(), birthRaw: m[3].replace(/\s+/g, ' '), birthSource: platform + '-ps-lstart', birthResolutionMs: 1000, cpuSeconds: parseCpuTime(m[4]), rssKiB: Number(m[5]), command: m[6] });
  }
  if (!rows.length) throw Error('Empty ps identity snapshot');
  return rows;
}
export function processRole(command, cohort, main = false) {
  if (cohort === 'observer') return 'observer';
  if (cohort === 'backend') return main ? 'backend' : 'backend-child';
  if (cohort !== 'browser') return null;
  if (main) return /(?:^|\/)(?:Google Chrome for Testing|Google Chrome|Chrome|Chromium|MiniBrowser)$/i.test(command) ? 'browser-main' : null;
  if (/Helper \(GPU\)|GPUProcess/.test(command)) return 'browser-gpu';
  if (/Helper \(Renderer\)|WebContent/.test(command)) return 'browser-renderer';
  return 'browser-other';
}
export function processIdentity(row) {
  if (!row || !Number.isSafeInteger(row.pid) || row.pid <= 0 || !Number.isSafeInteger(row.ppid) || row.ppid < 0 || typeof row.birth !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(row.birth) || !Number.isFinite(Date.parse(row.birth)) || !['darwin-ps-lstart', 'linux-ps-lstart'].includes(row.birthSource) || typeof row.command !== 'string' || !row.command || !['browser','backend','observer'].includes(row.cohort)) return null;
  const expected = processRole(row.command, row.cohort, row.role === 'browser-main' || row.role === 'backend');
  if (!expected || expected !== row.role || row.role === 'backend' && !row.command.endsWith('backend.test')) return null;
  return JSON.stringify([row.pid,row.ppid,row.birth,row.birthSource,row.command,row.cohort,row.role]);
}
export function collectScopedProcesses(rows, roots, bindings = new Map()) {
  if (!Object.keys(roots).length || Object.values(roots).some(pid => !Number.isSafeInteger(pid) || pid <= 0) || new Set(Object.values(roots)).size !== Object.values(roots).length) throw Error('Invalid or duplicate owned process roots');
  const byPid = new Map(rows.map(row => [row.pid,row]));
  if (byPid.size !== rows.length) throw Error('Duplicate PID in ps snapshot');
  const scopes = new Map();
  for (const [cohort,pid] of Object.entries(roots)) {
    const root = byPid.get(pid);
    if (!root) throw Error('Missing owned '+cohort+' root');
    const key = JSON.stringify([root.pid,root.birth,root.command]);
    const binding = bindings.get(cohort);
    if (binding?.pid === pid && binding.key !== key) throw Error('Owned root PID reused or executable changed');
    if (!binding || binding.pid !== pid) bindings.set(cohort,{pid,key});
    const found = new Set([pid]); let changed = true;
    while (changed) { changed = false; for (const row of rows) if (found.has(row.ppid) && !found.has(row.pid)) {found.add(row.pid);changed = true;} }
    for (const foundPid of found) if (!scopes.has(foundPid)) scopes.set(foundPid,cohort);
  }
  // Preserve previously observed orphaned child identity; parent death must not
  // silently erase owned CPU from a later boundary snapshot.
  const previous = bindings.get('children') || new Map();
  const activeKeys = new Set(rows.map(row => JSON.stringify([row.pid,row.birth,row.command])));
  for (const key of previous.keys()) if (!activeKeys.has(key)) previous.delete(key);
  for (const row of rows) {
    const key = JSON.stringify([row.pid,row.birth,row.command]);
    if (!scopes.has(row.pid) && previous.has(key)) scopes.set(row.pid,previous.get(key));
  }
  const selected = rows.filter(row => scopes.has(row.pid)).map(row => {
    const cohort = scopes.get(row.pid), main = roots[cohort] === row.pid;
    const value = {...row,cohort,role:processRole(row.command,cohort,main)};
    if (!processIdentity(value)) throw Error('Invalid owned process identity or role');
    if (cohort !== 'observer') previous.set(JSON.stringify([row.pid,row.birth,row.command]),cohort);
    return value;
  });
  bindings.set('children',previous);
  return selected;
}
export function inspectProcessCohort(snapshots) {
  const reasons = [], churn = new Set(); let initial, previous, lastTime;
  if (!Array.isArray(snapshots) || snapshots.length < 2) return {valid:false,reasons:['Missing process boundaries'],churn:[]};
  for (const snapshot of snapshots) {
    if (!snapshot || !Number.isFinite(snapshot.time) || lastTime !== undefined && snapshot.time <= lastTime) reasons.push('Invalid process sample time/order');
    lastTime = snapshot?.time;
    if (!Array.isArray(snapshot?.processes) || !snapshot.processes.length || snapshot.error) { reasons.push('Missing process snapshot'); continue; }
    const current = new Map(), pids = new Set();
    for (const row of snapshot.processes) {
      const key = processIdentity(row);
      if (!key || pids.has(row.pid) || !Number.isFinite(row.cpuSeconds) || row.cpuSeconds < 0 || !Number.isFinite(row.rssKiB) || row.rssKiB < 0) {reasons.push('Missing/invalid/duplicate process identity or counters');continue;}
      pids.add(row.pid);
      if (row.cohort !== 'observer') current.set(key,row);
    }
    if (!current.size) reasons.push('Empty accounting cohort');
    if (!initial) initial = current;
    for (const [key,row] of current) if (!initial.has(key)) {reasons.push('New/reused/reparented process identity');churn.add(row.pid);}
    for (const [key,row] of initial) if (!current.has(key)) {reasons.push('Missing/exited process identity');churn.add(row.pid);}
    if (previous) for (const [key,row] of current) if (previous.has(key) && row.cpuSeconds < previous.get(key).cpuSeconds) reasons.push('CPU counter decreased');
    previous = current;
  }
  return {valid:reasons.length===0,reasons:[...new Set(reasons)],churn:[...churn].sort((a,b)=>a-b)};
}
