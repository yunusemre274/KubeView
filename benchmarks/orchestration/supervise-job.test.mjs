import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { superviseJob, signalOwnedProcesses } from './supervise-job.mjs';
const moduleURL = new URL('./supervise-job.mjs', import.meta.url).href;
const run = (script, more = {}) => superviseJob({ argv: [process.execPath, '-e', script], cwd: process.cwd(), timeoutSeconds: 8, ...more });

test('one graceful job drains both pipes and awaited output callbacks', async () => {
  let output = '';
  const result = await run("process.stdout.write('x'.repeat(262144),()=>process.stderr.write('END',()=>process.exit(0)))", {
    onOutput: async chunk => { await Promise.resolve(); output += chunk; },
  });
  assert.equal(result.code, 0);
  assert.equal(result.error, null);
  assert.equal(result.cleanupComplete, true);
  assert.equal(result.outputDrained, true);
  // The two OS pipes have no shared ordering contract; neither may lose bytes.
  assert.equal(output.replace('END', ''), 'x'.repeat(262144));
  assert.equal(output.length, 262147);
});

test('timeout escalates only the owned TERM-ignoring child to KILL', async () => {
  const result = await run("process.on('SIGTERM',()=>{});console.log('READY');setInterval(()=>{},1000)", { timeoutSeconds: 0.8 });
  assert.equal(result.timedOut, true);
  assert.equal(result.signal, 'SIGKILL');
  assert.equal(result.cleanupComplete, true);
  assert.ok(result.cleanup.signals.some(row => row.pid === result.pid && row.signal === 'SIGKILL'));
});

test('isolated worker SIGTERM cleans its active job before returning interruption', async () => {
  const script = `import { superviseJob } from ${JSON.stringify(moduleURL)};
    const result=await superviseJob({argv:[process.execPath,'-e',"process.on('SIGTERM',()=>{});console.log('READY');setInterval(()=>{},1000)"],cwd:process.cwd(),timeoutSeconds:8,onOutput:chunk=>process.stdout.write(chunk)});
    console.log('RESULT:'+JSON.stringify(result));`;
  const worker = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', sent = false;
  worker.stdout.on('data', chunk => {
    output += chunk;
    if (!sent && output.includes('READY')) { sent = true; worker.kill('SIGTERM'); }
  });
  let stderr = '';
  worker.stderr.on('data', chunk => { stderr += chunk; });
  const timeout = setTimeout(() => worker.kill('SIGKILL'), 12000);
  try {
    const code = await new Promise((resolve, reject) => { worker.once('error', reject); worker.once('close', resolve); });
    assert.equal(code, 0, stderr);
    const result = JSON.parse(output.split('RESULT:')[1].trim());
    assert.equal(result.interrupted, 'SIGTERM');
    assert.equal(result.cleanupComplete, true);
    assert.equal(result.cleanup.remaining.length, 0);
  } finally { clearTimeout(timeout); if (worker.exitCode === null && worker.signalCode === null) worker.kill('SIGTERM'); }
});

test('known detached descendant in another PGID is verified and cleaned', async () => {
  let output = '';
  const script = `const{spawn}=require('node:child_process');
    const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{detached:true,stdio:'ignore'});
    console.log('DETACHED:'+child.pid);process.on('SIGTERM',()=>{});setInterval(()=>{},1000);`;
  const result = await run(script, { timeoutSeconds: 2.2, onOutput: chunk => { output += chunk; } });
  const pid = Number(output.match(/DETACHED:(\d+)/)?.[1]);
  assert.ok(pid > 0);
  assert.ok(result.ownership.some(record => record.pid === pid && record.pgid === pid));
  assert.ok(result.cleanup.signals.some(record => record.pid === pid && record.signal === 'SIGKILL'));
  assert.equal(result.cleanupComplete, true);
});

test('unknown and recycled PIDs cannot reach the signalling primitive', () => {
  const calls = [];
  const owned = new Map([[101, { pid: 101, birth: 'old' }], [102, { pid: 102, birth: 'same' }]]);
  const current = new Map([[101, { pid: 101, birth: 'new', state: 'S' }], [102, { pid: 102, birth: 'same', state: 'S' }], [103, { pid: 103, birth: 'unknown', state: 'S' }]]);
  const result = signalOwnedProcesses(owned, current, 'SIGTERM', (pid, signal) => calls.push([pid, signal]));
  assert.deepEqual(calls, [[102, 'SIGTERM']]);
  assert.deepEqual(result.refused, [101]);
  assert.equal(result.errors.length, 0);
});
