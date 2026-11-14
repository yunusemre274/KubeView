// One bounded preparation job; builds only the isolated experiment source.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const session = JSON.parse(await readFile('benchmarks/panel-final-session.json', 'utf8'));
const tag = `${session.id}-capacity-v1`;
const out = `benchmarks/results/${session.id}-capacity-build`;
await mkdir(out, { recursive: false });
const run = args => execFileSync(process.execPath, args, { stdio: 'inherit', timeout: 90000 });
run(['benchmarks/panel-build.mjs', tag, '--source', 'benchmarks/.build/panel-capacity-prototype-source']);
run(['--test', '--test-concurrency=1', 'benchmarks/buffer-probe.test.mjs', `benchmarks/.build/${tag}-source/src/harbor/instanceCapacity.test.js`]);
const provenance = JSON.parse(await readFile(`benchmarks/.build/${tag}.json`, 'utf8'));
await writeFile(`${out}/result.json`, JSON.stringify({ status: 'passed', tag, provenance, tests: 6, scope: 'Isolated prototype and opt-in diagnostic only; current production frontend unchanged' }, null, 2));
console.log({ status: 'passed', tag, tests: 6, sourceSHA256: provenance.sourceSHA256 });
