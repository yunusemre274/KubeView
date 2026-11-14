// Build installable, same-origin single binaries from the current source.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync, copyFileSync, writeFileSync, existsSync, lstatSync, rmSync, constants } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supportedTargets = ['darwin-arm64','linux-amd64','linux-arm64','darwin-amd64','windows-amd64'];

export function parseReleaseArgs(args) {
  let skipFrontend = false, requireClean = false, outputDirectory;
  const targets = [];
  for (const arg of args) {
    if (arg === '--prepared') skipFrontend = true;
    else if (arg === '--require-clean') requireClean = true;
    else if (arg.startsWith('--output-dir=')) {
      if (outputDirectory !== undefined) throw Error('Duplicate --output-dir option');
      outputDirectory = arg.slice('--output-dir='.length);
      if (!outputDirectory || outputDirectory.includes('\0')) throw Error('--output-dir requires a nonempty path');
    } else if (arg.startsWith('--')) throw Error(`Unknown option ${arg}; use --output-dir=ABS_OR_REL`);
    else {
      if (!supportedTargets.includes(arg)) throw Error(`Unknown target ${arg}`);
      if (targets.includes(arg)) throw Error(`Duplicate target ${arg}`);
      targets.push(arg);
    }
  }
  if (!targets.length) targets.push('darwin-arm64', 'linux-amd64');
  return { skipFrontend, requireClean, outputDirectory, targets };
}

function entryExists(file) {
  try { lstatSync(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

function validateDestination(out, explicit, version, targets) {
  if (entryExists(out)) {
    if (explicit) throw Error(`Explicit output directory already exists: ${out}`);
    const info = lstatSync(out);
    if (!info.isDirectory() || info.isSymbolicLink()) throw Error(`Output must be a real directory: ${out}`);
  }
  for (const name of ['SHA256SUMS', 'build.json', ...targets.flatMap(target => {
    const base = `kubeview_${version}_${target}`;
    return [base, `${base}.tar.gz`];
  })]) {
    if (entryExists(path.join(out, name))) throw Error(`Release output already exists: ${path.join(out, name)}`);
  }
}

const manualAssets = ['profiles.json', 'telemetry.py', 'DEPENDENCIES.md',
  'templates/README.md', 'templates/telemetry-values.json', 'tests/real_scenarios.py'];
const manualRuntime = ['scripts/manual-lab.sh', 'scripts/manual_lab.py', ...manualAssets.map(file => `manual-lab/${file}`)];
const packageFiles = ['LICENSE','README.md','MANUAL_TEST_GUIDE.md','docs/SECURITY.md','docs/RELEASE_NOTES_v1.1.0.md','docs/V11_ACCEPTANCE_REPORT.md','docs/WORKSPACE_ACCEPTANCE.md',
  'deploy/rbac-namespace-readonly.yaml','deploy/rbac-namespace-write.yaml','deploy/rbac-namespace-observability.yaml','deploy/rbac-node-observability.yaml'];
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');

function frontendHashes(folder, relative = '') {
  const hashes = {};
  if (!existsSync(folder)) throw Error('Prepared frontend build is missing');
  for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const name = path.posix.join(relative, entry.name), absolute = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) throw Error(`Frontend build contains a symlink: ${name}`);
    if (entry.isDirectory()) Object.assign(hashes, frontendHashes(absolute, name));
    else if (entry.isFile()) hashes[name] = sha256(absolute);
    else throw Error(`Frontend build contains a non-file: ${name}`);
  }
  return hashes;
}

function copyManualRuntime(root, folder) {
  for (const file of manualRuntime) {
    const destination = path.join(folder, file);
    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(path.join(root, file), destination);
  }
  // The opt-in real-scenarios runner writes new evidence here; no developer or
  // historical evidence files belong in a fresh delivery archive.
  mkdirSync(path.join(folder, 'manual-lab/evidence'), { recursive: true });
}

export function buildRelease(args = process.argv.slice(2), { root = sourceRoot, execute = execFileSync } = {}) {
  const { skipFrontend, requireClean, outputDirectory, targets } = parseReleaseArgs(args);
  const version = JSON.parse(readFileSync(path.join(root,'frontend/package.json'))).version;
  const out = outputDirectory === undefined ? path.join(root,'dist') : path.resolve(outputDirectory);
  validateDestination(out, outputDirectory !== undefined, version, targets);
  const commit = execute('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const dirty = execute('git',['status','--porcelain','--untracked-files=all','--','backend','frontend/src','frontend/public','frontend/index.html','frontend/package.json','frontend/package-lock.json','frontend/vite.config.js','frontend/postcss.config.js','frontend/tailwind.config.js','scripts',...manualRuntime,...packageFiles],{cwd:root,encoding:'utf8'}).trim();
  if (dirty && requireClean) throw Error('Release runtime sources must be committed before packaging');
  mkdirSync(path.dirname(out), { recursive: true });
  if (outputDirectory !== undefined || !entryExists(out)) mkdirSync(out);
  const run = (cmd, values, options={}) => execute(cmd,values,{cwd:root,stdio:'inherit',...options});
  if (!skipFrontend) {
    run('npm',['ci'],{cwd:path.join(root,'frontend')});
    run('npm',['run','build'],{cwd:path.join(root,'frontend')});
  }
  const frontendAssets = frontendHashes(path.join(root, 'frontend/dist'));
  if (!frontendAssets['index.html']) throw Error('Prepared frontend index.html is missing');
  run(process.execPath,['scripts/prepare-webui.mjs']);
  const inputs = Object.fromEntries([...new Set([...packageFiles, ...manualRuntime,
    'backend/go.mod', 'backend/go.sum', 'frontend/package.json', 'frontend/package-lock.json'])]
    .filter(file => existsSync(path.join(root, file))).map(file => [file, sha256(path.join(root, file))]));
  const sums=[];
  for(const target of targets) {
    const [GOOS,GOARCH]=target.split('-');
    const name=`kubeview_${version}_${target}`, folder=path.join(out,name);
    mkdirSync(folder);
    const binary=path.join(folder,GOOS==='windows'?'kubeview.exe':'kubeview');
    run('go',['build','-trimpath','-ldflags',`-s -w -X main.version=${version} -X main.commit=${commit}${dirty?'-dirty':''}`,'-o',binary,'.'],
      {cwd:path.join(root,'backend'),env:{...process.env,CGO_ENABLED:'0',GOOS,GOARCH}});
    for(const file of packageFiles) {
      if(!existsSync(path.join(root,file))) continue;
      const destination=path.join(folder,file); mkdirSync(path.dirname(destination),{recursive:true});
      if(file.endsWith('.md')) {
        // Historical screenshots/videos/docs remain in the repository rather than
        // bloating every binary download. Keep their links valid for this source.
        const text=readFileSync(path.join(root,file),'utf8').replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g,(all,image,label,url)=>{
          if(/^(?:[a-z]+:|#|\/)/i.test(url))return all;
          const relative=path.posix.normalize(path.posix.join(path.posix.dirname(file),url));
          const base=image?'https://raw.githubusercontent.com/yunusemre274/KubeView/':'https://github.com/yunusemre274/KubeView/blob/';
          return `${image}[${label}](${base}${commit}/${relative})`;
        });
        writeFileSync(destination,text);
      } else copyFileSync(path.join(root,file),destination);
    }
    // The manual candidate is runnable from an extracted bundle, without the
    // repository, a Go/Node toolchain, .git or historical developer artifacts.
    // Private lab state is created at runtime outside this public bundle.
    copyManualRuntime(root, folder);
    writeFileSync(path.join(folder, 'build-provenance.json'), JSON.stringify({version, commit, dirty: !!dirty,
      target, inputs, frontendAssets, binarySHA256: sha256(binary), signed: false,
      note: 'Byte identities, not a publisher signature or proof that a prepared frontend matches source.'}, null, 2)+'\n', {flag:'wx'});
    const archive=`${name}.tar.gz`;
    const temporary = path.join(out, `.${archive}.${randomUUID()}.tmp`);
    try {
      run('tar',['-czf',temporary,'-C',out,name]);
      copyFileSync(temporary, path.join(out, archive), constants.COPYFILE_EXCL);
    } finally { rmSync(temporary, { force: true }); }
    sums.push(`${createHash('sha256').update(readFileSync(path.join(out,archive))).digest('hex')}  ${archive}`);
  }
  writeFileSync(path.join(out,'SHA256SUMS'),sums.join('\n')+'\n', { flag: 'wx' });
  writeFileSync(path.join(out,'build.json'),JSON.stringify({version,commit,dirty:!!dirty,targets,inputs,frontendAssets,builtAt:new Date().toISOString(),
    note:'Cross-compilation is not a runtime platform test. See V11_ACCEPTANCE_REPORT.'},null,2)+'\n', { flag: 'wx' });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildRelease();
