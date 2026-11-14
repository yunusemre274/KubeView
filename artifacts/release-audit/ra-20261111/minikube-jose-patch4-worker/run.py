from pathlib import Path
import os,subprocess,json,time,datetime,signal,shutil,hashlib,difflib,urllib.parse
root=Path('/Users/yunusemre/Desktop/KubeView');private=root/'.git/release-audit/minikube-jose-patch4';src=private/'source';art=root/'artifacts/release-audit/ra-20261111/minikube-jose-patch4-worker';old=root/'.git/release-audit/patched-minikube-v1.38.1/source/kubernetes-minikube-c93a4cb';deadline=datetime.datetime.fromisoformat(json.loads((private/'deadline.json').read_text())['deadline_utc']).timestamp();stamp=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();env=os.environ.copy();env.update(GOTOOLCHAIN='go1.27.4',GOMAXPROCS='2',GOMEMLIMIT='1536MiB',CGO_ENABLED='1',GOFLAGS='-mod=mod -p=1');step='preflight'
def run(label,cmd,limit=60,customenv=env,cwd=src):
 global step
 step=label;start=time.monotonic();timeout=max(1,min(limit,int(deadline-time.time())));rec={'command':cmd,'started_at_utc':stamp(),'timeout_seconds':timeout,'cwd':str(cwd.relative_to(root))}
 with (art/(label+'.stdout')).open('w') as out,(art/(label+'.stderr')).open('w') as err:
  try:p=subprocess.run(cmd,cwd=cwd,env=customenv,stdout=out,stderr=err,timeout=timeout);rc=p.returncode;timed=False
  except subprocess.TimeoutExpired:rc=None;timed=True
 rec.update(exit_code=rc,timed_out=timed,duration_seconds=round(time.monotonic()-start,3),finished_at_utc=stamp());(art/(label+'.command.json')).write_text(json.dumps(rec,indent=2)+'\n');print(label,json.dumps(rec),flush=True)
 if rc!=0:raise RuntimeError(label+' failed; no retry')
 return rec
def versions(s):
 out={};block=False
 for line in s.splitlines():
  line=line.split('//')[0].strip()
  if line=='require (':block=True;continue
  if block and line==')':block=False;continue
  p=line.split()
  if block and len(p)>=2:out[p[0]]=p[1]
  elif len(p)>=3 and p[0]=='require':out[p[1]]=p[2]
 return out
try:
 assert sha(private/'baseline/minikube-patched.3')=='0ea47b1aa27343751614b25f427771974bca6534365ab8ddee4bf7aee8ce0371';assert shutil.disk_usage(private).free>=10737418240
 run('graph',['go','get','github.com/go-jose/go-jose/v4@v4.1.6'],60)
 before=(art/'baseline-go.mod').read_text();after=(src/'go.mod').read_text();b=versions(before);a=versions(after);delta={k:{'before':b.get(k),'after':a.get(k)} for k in set(a)|set(b) if a.get(k)!=b.get(k)};assert delta=={'github.com/go-jose/go-jose/v4':{'before':'v4.1.4','after':'v4.1.6'}},'Unexpected module delta';assert [x for x in before.splitlines() if x.startswith(('go ','toolchain '))]==[x for x in after.splitlines() if x.startswith(('go ','toolchain '))];assert all(a[k]=='v0.35.1' for k in ['k8s.io/api','k8s.io/apimachinery','k8s.io/client-go','k8s.io/kubectl']);assert a['github.com/docker/docker']=='v28.5.2+incompatible' and a['google.golang.org/grpc']=='v1.83.2';(art/'graph-delta.json').write_text(json.dumps({'require_version_changes':delta,'other_require_versions_unchanged':True,'language_toolchain_unchanged':True,'go_mod_sha256':sha(src/'go.mod'),'go_sum_sha256':sha(src/'go.sum')},indent=2)+'\n')
 for name in ['go.mod','go.sum']:
  shutil.copyfile(src/name,art/('patched-'+name));(art/(name+'.patch')).write_text(''.join(difflib.unified_diff((art/('baseline-'+name)).read_text().splitlines(True),(src/name).read_text().splitlines(True),fromfile='patched.3/'+name,tofile='patched.4/'+name)))
 run('vendor',['go','mod','vendor'],60);sdk=src/'vendor/github.com/docker/docker/pkg/archive/archive_deprecated.go';original=sdk.read_text();assert sha(sdk)=='5b0ec960969be3fee3332f68543a5b211eee885b739a7ecfb7310e9492950081';assert original.count('archive.Compression')==2;sdk.write_text(original.replace('archive.Compression','Compression'));assert sha(sdk)=='c3a2fcd7bab86793ba247516a792e83e454724068a14b55784d7adf31196b420';(art/'sdk-alias.patch').write_text(''.join(difflib.unified_diff(original.splitlines(True),sdk.read_text().splitlines(True),fromfile='official-sdk/archive_deprecated.go',tofile='vendor-sdk/archive_deprecated.go')));shutil.copyfile(src/'vendor/modules.txt',art/'patched-vendor-modules.txt');paths={str(x.relative_to(old/'vendor')) for x in (old/'vendor').rglob('*') if x.is_file()}|{str(x.relative_to(src/'vendor')) for x in (src/'vendor').rglob('*') if x.is_file()};changes=[];treehash=hashlib.sha256()
 for rel in sorted(paths):
  l=old/'vendor'/rel;r=src/'vendor'/rel
  if not l.is_file() or not r.is_file() or sha(l)!=sha(r):changes.append(rel)
  if r.is_file():treehash.update((rel+'\0'+sha(r)+'\n').encode())
 assert all(x=='modules.txt' or x.startswith('github.com/go-jose/go-jose/v4/') for x in changes),'Unexpected vendor delta';(art/'vendor-delta.json').write_text(json.dumps({'changed_paths':changes,'only_jose_and_modules_txt':True,'sdk_alias_hash_preserved':sha(sdk),'vendor_tree_digest':treehash.hexdigest(),'modules_txt_sha256':sha(src/'vendor/modules.txt')},indent=2)+'\n');print('vendor delta',len(changes),flush=True)
 step='build';cmd=json.loads((root/'artifacts/release-audit/ra-20261111/runtime-binary-worker/patched-minikube/vendor-attempt/build.command.json').read_text())['command'];binary=private/'minikube-v1.38.1-kubeview-patched.4';cmd[cmd.index('-ldflags')+1]=cmd[cmd.index('-ldflags')+1].replace('patched.3','patched.4');cmd[cmd.index('-o')+1]=str(binary);env['GOFLAGS']='-mod=vendor -p=1';start=time.monotonic();buildlimit=max(1,min(240,int(deadline-time.time()-25)));rec={'command':cmd,'started_at_utc':stamp(),'cwd':str(src.relative_to(root)),'timeout_seconds':buildlimit,'GOTOOLCHAIN':'go1.27.4','GOMAXPROCS':2,'GOMEMLIMIT':'1536MiB','CGO_ENABLED':1,'GOFLAGS':'-mod=vendor -p=1','rss_limit_bytes':4294967296,'build_attempts':1};samples=[];peak=0;stop=None
 def table():
  t={}
  for line in subprocess.check_output(['ps','-axo','pid=,ppid=,rss='],text=True).splitlines():
   v=line.split()
   if len(v)==3:t[int(v[0])]=(int(v[1]),int(v[2])*1024)
  return t
 with (art/'build.stdout').open('w') as out,(art/'build.stderr').open('w') as err:
  p=subprocess.Popen(cmd,cwd=src,env=env,stdout=out,stderr=err,start_new_session=True)
  while p.poll() is None:
   t=table();ids={p.pid}
   while True:
    new={k for k,v in t.items() if v[0] in ids}
    if new.issubset(ids):break
    ids.update(new)
   rss=sum(t.get(k,(0,0))[1] for k in ids)+t.get(os.getpid(),(0,0))[1];peak=max(peak,rss);free=shutil.disk_usage(private).free;elapsed=time.monotonic()-start;samples.append({'elapsed_seconds':round(elapsed,3),'owned_rss_bytes':rss,'free_disk_bytes':free})
   if rss>4294967296:stop='RSS4GiB'
   elif free<10737418240:stop='DISK10GiB'
   elif elapsed>=buildlimit or time.time()>=deadline:stop='TIMEOUT'
   if stop:
    try:os.killpg(p.pid,signal.SIGTERM)
    except ProcessLookupError:pass
    try:p.wait(timeout=3)
    except subprocess.TimeoutExpired:
     try:os.killpg(p.pid,signal.SIGKILL)
     except ProcessLookupError:pass
     p.wait()
    break
   time.sleep(1)
  rc=p.wait()
 rec.update(exit_code=rc,stop_reason=stop,duration_seconds=round(time.monotonic()-start,3),peak_owned_rss_bytes=peak,finished_at_utc=stamp(),binary_produced=binary.is_file());(art/'build.command.json').write_text(json.dumps(rec,indent=2)+'\n');(art/'build-resources.json').write_text(json.dumps(samples,indent=2)+'\n');print('build',json.dumps(rec),flush=True)
 if rc!=0:raise RuntimeError('Build failed; no retry')
 (art/'binary-identity.json').write_text(json.dumps({'path':str(binary.relative_to(root)),'sha256':sha(binary),'bytes':binary.stat().st_size,'version':'v1.38.1-kubeview-patched.4','upstream_commit':'c93a4cb9311efc66b90d33ea03f75f2c4120e9b0'},indent=2)+'\n');print('binary_sha256',sha(binary),flush=True);run('buildinfo',['go','version','-m',str(binary)],15);info=(art/'buildinfo.stdout').read_text();assert 'github.com/go-jose/go-jose/v4\tv4.1.6' in info and 'go1.27.4' in info.splitlines()[0];home=private/'cli-home';home.mkdir(mode=0o700);clienv=env.copy();clienv.update(MINIKUBE_HOME=str(home),KUBECONFIG='/dev/null');run('version',[str(binary),'version'],10,clienv,private);run('help',[str(binary),'--help'],10,clienv,private);run('govulncheck',[str(root/'.git/release-audit/tools/govulncheck'),'-json','-mode=binary',str(binary)],45,env,root)
 step='sbom';components=[]
 for line in info.splitlines():
  v=line.strip().split('\t')
  if v[0]=='dep' and len(v)>=3:components.append({'type':'library','name':v[1],'version':v[2],'purl':'pkg:golang/'+v[1]+'@'+urllib.parse.quote(v[2],safe=''),'bom-ref':v[1]+'@'+v[2]})
  elif v[0]=='=>':raise RuntimeError('Unmapped replacement; no SBOM fabricated')
 components.append({'type':'library','name':'stdlib','version':'v1.27.4','purl':'pkg:golang/stdlib@v1.27.4','bom-ref':'stdlib@v1.27.4'});bom={'bomFormat':'CycloneDX','specVersion':'1.5','version':1,'metadata':{'timestamp':stamp(),'component':{'type':'application','name':'custom-minikube4','version':'v1.38.1-kubeview-patched.4','hashes':[{'alg':'SHA-256','content':sha(binary)}]}},'components':components};(art/'binary-components.cdx.json').write_text(json.dumps(bom,indent=2)+'\n');(art/'component-inventory.json').write_text(json.dumps({'component_count':len(components),'components':components,'main_module_purl':'OMITTED; custom/devel coverage gap retained','buildinfo_sha256':sha(art/'buildinfo.stdout'),'binary_sha256':sha(binary)},indent=2)+'\n');(private/'trivy.yaml').write_text('{}\n');(private/'empty.ignore').write_text('');tenv=env.copy();tenv['GOMAXPROCS']='1';run('trivy-sbom',['/opt/homebrew/bin/trivy','--cache-dir',str(root/'.git/release-audit/trivy-cache'),'--config',str(private/'trivy.yaml'),'sbom','--scanners','vuln','--pkg-types','library','--skip-db-update','--skip-java-db-update','--skip-version-check','--skip-vex-repo-update','--disable-telemetry','--offline-scan','--no-progress','--ignorefile',str(private/'empty.ignore'),'--format','json',str(art/'binary-components.cdx.json')],30,tenv,private);(art/'execution.json').write_text(json.dumps({'status':'BUILD_AND_SCANNERS_COMPLETED','completed_at_utc':stamp(),'deadline_utc':json.loads((private/'deadline.json').read_text())['deadline_utc']},indent=2)+'\n')
except Exception as exc:
 (art/'execution.json').write_text(json.dumps({'status':'FAIL_STOP_NO_RETRY','failed_step':step,'error_class':type(exc).__name__,'safe_reason':str(exc) if isinstance(exc,RuntimeError) else 'Invariant/preparation failure; no retry','completed_at_utc':stamp()},indent=2)+'\n');print('STOP',step,type(exc).__name__,flush=True)
