// Build installable, same-origin single binaries from the current source.
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const skipFrontend = args.includes('--prepared');
const targets = args.filter(x => !x.startsWith('--'));
if (!targets.length) targets.push('darwin-arm64', 'linux-amd64');
const version = JSON.parse(readFileSync(path.join(root,'frontend/package.json'))).version;
const commit = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const dirty = execFileSync('git',['status','--porcelain','--untracked-files=all','--','backend','frontend/src','frontend/package.json','frontend/package-lock.json','frontend/vite.config.js','scripts'],{cwd:root,encoding:'utf8'}).trim();
if (dirty && args.includes('--require-clean')) throw Error('Release runtime sources must be committed before packaging');
const run = (cmd, values, options={}) => execFileSync(cmd,values,{cwd:root,stdio:'inherit',...options});
if (!skipFrontend) {
  run('npm',['ci'],{cwd:path.join(root,'frontend')});
  run('npm',['run','build'],{cwd:path.join(root,'frontend')});
}
run(process.execPath,['scripts/prepare-webui.mjs']);
const out = path.join(root,'dist'); mkdirSync(out,{recursive:true});
const sums=[];
for(const target of targets) {
  if(!['darwin-arm64','linux-amd64','linux-arm64','darwin-amd64','windows-amd64'].includes(target)) throw Error(`Unknown target ${target}`);
  const [GOOS,GOARCH]=target.split('-');
  const name=`kubeview_${version}_${target}`, folder=path.join(out,name);
  mkdirSync(folder,{recursive:true});
  const binary=path.join(folder,GOOS==='windows'?'kubeview.exe':'kubeview');
  run('go',['build','-trimpath','-ldflags',`-s -w -X main.version=${version} -X main.commit=${commit}${dirty?'-dirty':''}`,'-o',binary,'.'],
    {cwd:path.join(root,'backend'),env:{...process.env,CGO_ENABLED:'0',GOOS,GOARCH}});
  for(const file of ['LICENSE','README.md','docs/SECURITY.md','docs/RELEASE_NOTES_v1.1.0.md','docs/V11_ACCEPTANCE_REPORT.md',
    'deploy/rbac-namespace-readonly.yaml','deploy/rbac-namespace-write.yaml','deploy/rbac-namespace-observability.yaml','deploy/rbac-node-observability.yaml']) {
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
  const archive=`${name}.tar.gz`;
  run('tar',['-czf',path.join(out,archive),'-C',out,name]);
  sums.push(`${createHash('sha256').update(readFileSync(path.join(out,archive))).digest('hex')}  ${archive}`);
}
writeFileSync(path.join(out,'SHA256SUMS'),sums.join('\n')+'\n');
writeFileSync(path.join(out,'build.json'),JSON.stringify({version,commit,dirty:!!dirty,targets,builtAt:new Date().toISOString(),
  note:'Cross-compilation is not a runtime platform test. See V11_ACCEPTANCE_REPORT.'},null,2)+'\n');
