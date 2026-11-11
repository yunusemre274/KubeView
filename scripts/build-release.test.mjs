import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildRelease, parseReleaseArgs } from './build-release.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kubeview-packaging-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (file, text = 'synthetic fixture\n') => {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, text);
  };
  put('frontend/package.json', JSON.stringify({ version: '1.1.0' }));
  put('frontend/dist/index.html', '<html>synthetic prepared build</html>\n');
  put('README.md', '[guide](MANUAL_TEST_GUIDE.md)\n');
  for (const file of ['scripts/manual-lab.sh', 'scripts/manual_lab.py', 'manual-lab/profiles.json',
    'manual-lab/telemetry.py', 'manual-lab/DEPENDENCIES.md', 'manual-lab/templates/README.md',
    'manual-lab/templates/telemetry-values.json', 'manual-lab/tests/real_scenarios.py']) put(file);
  for (const file of ['manual-lab/evidence/historical.json', 'manual-lab/tests/test_runner.py',
    'manual-lab/__pycache__/telemetry.pyc', 'manual-lab/.pytest_cache/cache', 'manual-lab/developer-notes.txt']) put(file, 'DO NOT SHIP\n');
  const calls = [];
  let dirty = '';
  const execute = (command, args, options) => {
    calls.push({ command, args, options });
    if (command === 'git') return args[0] === 'rev-parse' ? 'fixture-source-commit\n' : dirty;
    if (command === 'npm' || command === process.execPath) return Buffer.alloc(0);
    if (command === 'go') {
      assert.equal(options.env.CGO_ENABLED, '0');
      writeFileSync(args[args.indexOf('-o') + 1], 'synthetic binary; no compilation\n');
      return Buffer.alloc(0);
    }
    if (command === 'tar') {
      writeFileSync(args[1], 'synthetic archive; no archiver invoked\n');
      return Buffer.alloc(0);
    }
    throw Error(`Unexpected real command ${command}`);
  };
  return { root, put, calls, execute, setDirty: value => { dirty = value; } };
}

test('strict argument parsing preserves prepared/clean/target and default targets', () => {
  assert.deepEqual(parseReleaseArgs(['--prepared', '--require-clean', '--output-dir=release dir', 'linux-arm64']),
    { skipFrontend: true, requireClean: true, outputDirectory: 'release dir', targets: ['linux-arm64'] });
  assert.deepEqual(parseReleaseArgs([]).targets, ['darwin-arm64', 'linux-amd64']);
  for (const args of [ ['--output-dir'], ['--output-dir='], ['--output-dir=a', '--output-dir=b'],
    ['--output-directory=a'], ['--unknown'], ['linux-unknown'], ['linux-amd64', 'linux-amd64'] ]) {
    assert.throws(() => parseReleaseArgs(args));
  }
});

test('existing explicit output directories and symlinks fail before any command', t => {
  const f = fixture(t);
  for (const name of ['empty', 'populated']) mkdirSync(path.join(f.root, name));
  f.put('populated/historical.txt', 'immutable evidence\n');
  symlinkSync(path.join(f.root, 'empty'), path.join(f.root, 'linked'));
  symlinkSync(path.join(f.root, 'absent'), path.join(f.root, 'dangling'));
  for (const name of ['empty', 'populated', 'linked', 'dangling']) {
    assert.throws(() => buildRelease([`--output-dir=${path.join(f.root, name)}`, 'linux-amd64'], f), /already exists/);
  }
  assert.equal(f.calls.length, 0);
  assert.equal(readFileSync(path.join(f.root, 'populated/historical.txt'), 'utf8'), 'immutable evidence\n');
});

test('default dist rejects every conflicting archive, binary folder or manifest before build', t => {
  for (const collision of ['kubeview_1.1.0_linux-amd64.tar.gz', 'kubeview_1.1.0_linux-amd64/kubeview', 'SHA256SUMS', 'build.json']) {
    const f = fixture(t);
    f.put(`dist/${collision}`, 'immutable prior output\n');
    assert.throws(() => buildRelease(['darwin-arm64', 'linux-amd64'], f), /already exists/);
    assert.equal(f.calls.length, 0);
    assert.equal(readFileSync(path.join(f.root, 'dist', collision), 'utf8'), 'immutable prior output\n');
    assert.equal(existsSync(path.join(f.root, 'dist/kubeview_1.1.0_darwin-arm64')), false);
  }
});

test('fresh relative output dry-run preserves prepared flow and packages only manual runtime', t => {
  const f = fixture(t);
  const out = path.join(f.root, 'fresh bundle');
  buildRelease(['--prepared', '--require-clean', `--output-dir=${path.relative(process.cwd(), out)}`, 'linux-amd64'], f);
  assert.equal(f.calls.some(call => call.command === 'npm'), false);
  assert.equal(f.calls.filter(call => call.command === process.execPath).length, 1);
  const go = f.calls.find(call => call.command === 'go');
  assert.equal(go.options.env.GOOS, 'linux');
  assert.equal(go.options.env.GOARCH, 'amd64');
  const bundle = path.join(out, 'kubeview_1.1.0_linux-amd64');
  assert.equal(existsSync(path.join(bundle, 'manual-lab/tests/real_scenarios.py')), true);
  assert.deepEqual(readdirSync(path.join(bundle, 'manual-lab/tests')), ['real_scenarios.py']);
  assert.deepEqual(readdirSync(path.join(bundle, 'manual-lab/evidence')), []);
  for (const file of ['manual-lab/__pycache__', 'manual-lab/.pytest_cache', 'manual-lab/developer-notes.txt']) {
    assert.equal(existsSync(path.join(bundle, file)), false);
  }
  assert.match(readFileSync(path.join(bundle, 'README.md'), 'utf8'), /fixture-source-commit\/MANUAL_TEST_GUIDE.md/);
  assert.deepEqual(JSON.parse(readFileSync(path.join(out, 'build.json'), 'utf8')).targets, ['linux-amd64']);
  assert.match(readFileSync(path.join(out, 'SHA256SUMS'), 'utf8'), /^[a-f0-9]{64}  kubeview_1\.1\.0_linux-amd64\.tar\.gz\n$/);
  assert.equal(existsSync(path.join(f.root, 'manual-lab/evidence/historical.json')), true);
});

test('fresh absolute output keeps both default targets isolated from historical dist', t => {
  const f = fixture(t);
  f.put('dist/build.json', 'historical build manifest\n');
  const out = path.join(f.root, 'fresh-absolute');
  buildRelease(['--prepared', `--output-dir=${out}`], f);
  assert.deepEqual(JSON.parse(readFileSync(path.join(out, 'build.json'), 'utf8')).targets, ['darwin-arm64', 'linux-amd64']);
  assert.equal(readFileSync(path.join(out, 'SHA256SUMS'), 'utf8').trim().split('\n').length, 2);
  assert.equal(readFileSync(path.join(f.root, 'dist/build.json'), 'utf8'), 'historical build manifest\n');
});

test('default output preserves unrelated historical files and keeps normal frontend flow', t => {
  const f = fixture(t);
  f.put('dist/older-evidence.tar.gz', 'immutable older evidence\n');
  buildRelease(['windows-amd64'], f);
  assert.deepEqual(f.calls.filter(call => call.command === 'npm').map(call => call.args), [['ci'], ['run', 'build']]);
  assert.equal(existsSync(path.join(f.root, 'dist/kubeview_1.1.0_windows-amd64/kubeview.exe')), true);
  assert.equal(readFileSync(path.join(f.root, 'dist/older-evidence.tar.gz'), 'utf8'), 'immutable older evidence\n');
});

test('require-clean rejection never reserves output or invokes frontend/build tools', t => {
  const f = fixture(t);
  f.setDirty(' M frontend/src/App.jsx\n');
  const out = path.join(f.root, 'new-output');
  assert.throws(() => buildRelease(['--require-clean', `--output-dir=${out}`, 'linux-amd64'], f), /must be committed/);
  assert.equal(existsSync(out), false);
  assert.equal(f.calls.every(call => call.command === 'git'), true);
});

test('require-clean includes the manual runtime, shipped docs and RBAC inputs', t => {
  for (const changed of ['manual-lab/telemetry.py', 'manual-lab/profiles.json',
    'manual-lab/templates/telemetry-values.json', 'manual-lab/tests/real_scenarios.py',
    'MANUAL_TEST_GUIDE.md', 'docs/SECURITY.md', 'deploy/rbac-namespace-readonly.yaml']) {
    const f = fixture(t);
    const out = path.join(f.root, 'new-output');
    const execute = (command, args, options) => {
      if (command === 'git' && args[0] === 'status') return args.includes(changed) ? ` M ${changed}\n` : '';
      return f.execute(command, args, options);
    };
    assert.throws(() => buildRelease(['--require-clean', `--output-dir=${out}`, 'linux-amd64'],
      { root: f.root, execute }), /must be committed/, changed);
    assert.equal(existsSync(out), false);
    assert.equal(f.calls.every(call => call.command === 'git'), true);
  }
});

test('bundle provenance binds shipped inputs and prepared frontend bytes', t => {
  const f = fixture(t);
  f.put('frontend/dist/index.html', '<html>synthetic prepared build</html>\n');
  f.put('frontend/dist/assets/app.js', 'synthetic prepared module\n');
  const out = path.join(f.root, 'fresh-provenance');
  buildRelease(['--prepared', `--output-dir=${out}`, 'linux-amd64'], f);
  const manifest = JSON.parse(readFileSync(path.join(out, 'build.json'), 'utf8'));
  assert.match(manifest.inputs['manual-lab/telemetry.py'], /^[a-f0-9]{64}$/);
  assert.match(manifest.frontendAssets['assets/app.js'], /^[a-f0-9]{64}$/);
  const inner = JSON.parse(readFileSync(path.join(out, 'kubeview_1.1.0_linux-amd64/build-provenance.json'), 'utf8'));
  assert.deepEqual(inner.inputs, manifest.inputs);
  assert.deepEqual(inner.frontendAssets, manifest.frontendAssets);
  assert.match(inner.binarySHA256, /^[a-f0-9]{64}$/);
  assert.equal(inner.commit, 'fixture-source-commit');
  assert.equal(inner.signed, false);
});

test('missing or symlinked prepared frontend cannot reach embed or compilation', t => {
  for (const variant of ['missing', 'symlink']) {
    const f = fixture(t);
    if (variant === 'missing') rmSync(path.join(f.root, 'frontend/dist/index.html'));
    else {
      f.put('outside.txt', 'DO NOT EMBED\n');
      symlinkSync(path.join(f.root, 'outside.txt'), path.join(f.root, 'frontend/dist/external.txt'));
    }
    assert.throws(() => buildRelease(['--prepared', `--output-dir=${path.join(f.root, 'fresh')}`, 'linux-amd64'], f), /missing|symlink/);
    assert.equal(f.calls.every(call => call.command === 'git'), true);
  }
});

test('archive published during build cannot be overwritten and temporary output is removed', t => {
  const f = fixture(t);
  const out = path.join(f.root, 'fresh');
  const execute = (command, args, options) => {
    if (command === 'tar') {
      writeFileSync(path.join(out, 'kubeview_1.1.0_linux-amd64.tar.gz'), 'concurrent immutable archive\n');
    }
    return f.execute(command, args, options);
  };
  assert.throws(() => buildRelease(['--prepared', `--output-dir=${out}`, 'linux-amd64'], { root: f.root, execute }), /EEXIST/);
  assert.equal(readFileSync(path.join(out, 'kubeview_1.1.0_linux-amd64.tar.gz'), 'utf8'), 'concurrent immutable archive\n');
  assert.equal(readdirSync(out).some(name => name.endsWith('.tmp')), false);
});
