// Finite, serial acceptance jobs on the existing production runner.
// Each paired block is kept whole. Resume never replaces a previous run.
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
const stage = process.argv[2];
if (!['logs', 'logs-supplement', 'matrix', 'matrix-recovery', 'matrix-supplement', 'capacity', 'capacity-supplement', 'remaining', 'remaining-recovery', 'long'].includes(stage)) throw Error('Unknown finite stage; see panel-finish.mjs stage list');
const sessionFlag = process.argv.indexOf('--session');
const file = sessionFlag < 0 ? 'benchmarks/panel-final-session.json' : process.argv[sessionFlag + 1];
if (!file || file.startsWith('--')) throw Error('--session requires a session JSON path');
let session;
try { session = JSON.parse(await readFile(file, 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  session = {
    id: `panel-final-${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}Z`,
    baseline: 'panel-20261026T082540Z-baseline',
    logBaseline: 'panel-20261026T082540Z-candidate-v3',
    candidate: 'panel-20261026T082540Z-candidate-v5-block',
    backend: 'panel-20261026T082540Z-logs',
    created: new Date().toISOString(),
  };
  await writeFile(file, JSON.stringify(session, null, 2), { flag: 'wx' });
}
const directory = `benchmarks/results/${session.id}`;
const expectedPower = session.powerSource || 'AC';
if (!['AC', 'battery'].includes(expectedPower)) throw Error('Session powerSource must be AC or battery');
await mkdir(directory, { recursive: true });
const stateFile = path.join(directory, `${stage}-state.json`);
let state = { stage, started: new Date().toISOString(), status: 'running', jobs: [] };
try {
  await access(stateFile);
  if (!process.argv.includes('--resume')) throw Error('Stage exists; use --resume or a new session, never overwrite');
  state = JSON.parse(await readFile(stateFile, 'utf8'));
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const save = () => writeFile(stateFile, JSON.stringify(state, null, 2));
const jobs = [];
const add = (name, phase, build, more, repeat) => {
  const args = ['benchmarks/run.mjs', '--phase', phase, '--build-tag', build, '--reuse-build', '--reuse-binary', '--profiles', 'M', '--repeats', '1', '--repeat-offset', String(repeat), '--warmup', '30', '--seconds', '60', '--disable-browser-energy-saver', '--lock-input', '--id', `${session.id}-${name}-${phase}-b${repeat}`, ...more];
  const flags = args.filter(s => s.startsWith('--'));
  if (new Set(flags).size !== flags.length) throw Error(`Duplicate CLI flag: ${name}`);
  jobs.push({ name, phase, repeat, args });
};
const supplement = stage.endsWith('-supplement');
for (let block = supplement ? 3 : 0; block < (supplement ? 5 : stage === 'long' ? 1 : 3); block++) {
  const phases = block % 2 ? ['optimized', 'baseline'] : ['baseline', 'optimized'];
  for (const phase of phases) {
    if (stage === 'matrix-recovery' && block === 0 && phase === 'baseline') continue;
    const build = stage.startsWith('capacity')
      ? phase === 'baseline' ? session.candidate : `${session.id}-capacity-v1`
      : phase === 'baseline' ? session.baseline : session.candidate;
    if (stage.startsWith('capacity')) add('capacity-production', phase, build, ['--panel-matrix', '--scenarios', 'panel-closed-events'], block);
    if (stage === 'logs' || stage === 'logs-supplement') add('full-log', phase, phase === 'baseline' ? session.logBaseline : build, ['--backend-tag', session.backend, '--log-matrix', '--log-initial-lines', '5000', '--scenarios', 'log-normal', '--lifecycle-counts', '--network-counts'], block);
    if (stage.startsWith('matrix')) add(stage, phase, build, ['--panel-matrix', '--scenarios', stage === 'matrix-recovery' && block === 0 ? 'panel-closed,panel-open,panel-closed-events' : 'panel-closed,panel-open,panel-closed-events,panel-open-events', ...(phase === 'optimized' ? ['--reverse-order'] : [])], block);
    if (stage === 'remaining') {
      add('SL', phase, build, ['--scenarios', 'living'], block);
      // Override the single profile argument, not the parser's first match.
      jobs.at(-1).args[jobs.at(-1).args.indexOf('--profiles') + 1] = 'S,L';
      add('burst', phase, build, ['--scenarios', 'events'], block);
      add('interaction-idle', phase, build, ['--scenarios', 'interaction,idle', '--lifecycle-counts'], block);
      add('DPR2', phase, build, ['--panel-matrix', '--scenarios', 'panel-closed,panel-open', '--dpr', '2', ...(phase === 'optimized' ? ['--reverse-order'] : [])], block);
      add('log-controls', phase, build, ['--backend-tag', session.backend, '--log-matrix', '--log-initial-lines', '5000', '--scenarios', 'log-none,log-static,log-long', '--lifecycle-counts', '--network-counts', ...(phase === 'optimized' ? ['--reverse-order'] : [])], block);
    }
    if (stage === 'long' && phase === 'optimized') add('long', phase, build, ['--scenarios', 'long', '--long-seconds', '1200', '--lifecycle-counts', '--network-counts'], block);
  }
}
if (stage === 'remaining-recovery') {
  const build=session.candidate, block=2, phase='optimized';
  add('remaining-recovery-burst',phase,build,['--scenarios','events','--experiment-family','burst'],block);
  add('remaining-recovery-interaction-idle',phase,build,['--scenarios','interaction,idle','--lifecycle-counts','--experiment-family','interaction-idle'],block);
  add('remaining-recovery-DPR2',phase,build,['--panel-matrix','--scenarios','panel-closed,panel-open','--dpr','2','--reverse-order','--experiment-family','DPR2'],block);
  add('remaining-recovery-log-controls',phase,build,['--backend-tag',session.backend,'--log-matrix','--log-initial-lines','5000','--scenarios','log-none,log-static,log-long','--lifecycle-counts','--network-counts','--reverse-order','--experiment-family','log-controls'],block);
}
state.plan = jobs;
state.status = 'running';
await save();
try {
  for (const job of jobs) {
    const previous = state.jobs.find(j => JSON.stringify(j.args) === JSON.stringify(job.args));
    if (previous?.status === 'complete') {
      const id = job.args[job.args.indexOf('--id') + 1];
      const summary = JSON.parse(await readFile(`benchmarks/results/${id}/summary.json`, 'utf8'));
      if (!summary.manifest.finishedAt || summary.errors.length) throw Error(`Invalid completed result ${id}`);
      continue;
    }
    if (previous) throw Error('Failed/partial run is preserved. Inspect it and explicitly use a new run id; no automatic retry.');
    const power = execFileSync('pmset', ['-g', 'batt'], { encoding: 'utf8' });
    const actualPower = power.includes('AC Power') ? 'AC' : power.includes('Battery Power') ? 'battery' : null;
    if (actualPower !== expectedPower) throw Error(`This session is locked to ${expectedPower} power; stop without mixing sources`);
    const record = { ...job, started: new Date().toISOString(), status: 'running' };
    state.jobs.push(record);
    const child = spawn(process.execPath, job.args, { stdio: 'inherit' });
    record.pid = child.pid;
    await save();
    record.exitCode = await new Promise(resolve => child.once('exit', resolve));
    record.finished = new Date().toISOString();
    record.status = record.exitCode === 0 ? 'complete' : 'failed';
    await save();
    if (record.exitCode !== 0) throw Error(`Stopped at ${record.name}: exit ${record.exitCode}`);
  }
  state.status = 'complete';
} catch (error) { state.status = 'stopped'; state.error = error.stack; process.exitCode = 1; }
finally { state.finished = new Date().toISOString(); await save(); console.log({ stage, status: state.status, jobs: state.jobs.length, error: state.error }); }
