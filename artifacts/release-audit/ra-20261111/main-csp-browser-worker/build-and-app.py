import contextlib,datetime,hashlib,importlib.util,io,json,os,subprocess,time
from pathlib import Path
root=Path.cwd();out=root/'artifacts/release-audit/ra-20261111/main-csp-browser-worker';binary=root/'.git/release-audit/candidate-runtime-csp07/kubeview';profile='07-yuk-ve-gecis';state=Path.home()/'Library/Application Support/KubeView/release-audit-lab-20261111';hubble=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
assert not binary.exists();binary.parent.mkdir(parents=True,exist_ok=True)
subprocess.run(['git','diff','--quiet','550400a3','--','frontend/src','frontend/index.html','frontend/vite.config.js'],check=True)
subprocess.run(['git','diff','--quiet','4a05095a','--','backend/pkg/server'],check=True)
index=root/'frontend/dist/index.html';embed=root/'backend/internal/webui/dist/index.html';assert sha(index)==sha(embed) and sha(index).startswith('0e478e0c')
# Assert each embedded production byte, without preparing/rebuilding frontend.
files=[p for p in(root/'frontend/dist').rglob('*')if p.is_file()]
for p in files:assert p.read_bytes()==(root/'backend/internal/webui/dist'/p.relative_to(root/'frontend/dist')).read_bytes()
d={'startedAt':now(),'sourceHEAD':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'frontendReference':'550400a3','runtimeReference':'4a05095a','version':'1.1.0-csp07-4a05095a','indexSHA256':sha(index),'distEmbedAllFilesEqual':True,'serverRuntimeMatchesReference':True,'binary':str(binary),'sourceSHA256':{str(p.relative_to(root)):sha(p)for p in[root/'backend/main.go',root/'scripts/manual_lab.py',root/'backend/pkg/server/portforward.go']}}
(out/'source.diff').write_bytes(subprocess.check_output(['git','diff','--','backend/main.go','scripts/manual_lab.py']))
cmd=['/Users/yunusemre/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin/go','-C','backend','build','-p','1','-trimpath','-ldflags','-s -w -X main.version='+d['version']+' -X main.commit='+d['sourceHEAD']+'-main-csp-working-diff','-o',str(binary),'.'];d['buildCommand']=cmd
with(out/'build.log').open('wb')as f:subprocess.run(cmd,env={**os.environ,'GOMAXPROCS':'1','GOTOOLCHAIN':'local','CGO_ENABLED':'0'},stdout=f,stderr=subprocess.STDOUT,timeout=120,check=True)
d['binarySHA256']=sha(binary);d['buildFinishedAt']=now();(out/'candidate.json').write_text(json.dumps(d,indent=2)+'\n')
s=importlib.util.spec_from_file_location('r',root/'scripts/manual_lab.py');r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
l=r.Lab(r.parser().parse_args(['status','--state-dir',str(state)]));assert l.state['labId']=='kvml-aed6bc565b30';p=l.state['processes'][profile];assert p['pid']==925 and p['port']==19847 and p['binarySha256']=='e582a5bd4a274ae5e6627eacc2d4866760a03c6763e51593531dd744f5d2b0ef';assert r.digest(Path(p['binary']))==p['binarySha256'] and r.process_identity(925)==p['identity'] and r.pid_owns_port(925,19847)
normalBefore={k:v for k,v in l.state['processes'].items()if k!=profile}
h=r.Lab(r.parser().parse_args(['status','--state-dir',str(hubble)]));assert h.state['labId']=='kvml-d32afbf634e8';hubbleBefore=h.state['processes']
for q in hubbleBefore.values():assert r.process_identity(q['pid'])==q['identity'] and r.pid_owns_port(q['pid'],q['port'])
with contextlib.redirect_stdout(io.StringIO()):
 down=r.Lab(r.parser().parse_args(['down','--state-dir',str(state),'--profile',profile]));down.down()
 app=r.Lab(r.parser().parse_args(['app','--state-dir',str(state),'--profile',profile,'--binary',str(binary),'--replay','M','--harbors','5']));app.app()
l=r.Lab(r.parser().parse_args(['status','--state-dir',str(state)]));h=r.Lab(r.parser().parse_args(['status','--state-dir',str(hubble)]));assert {k:v for k,v in l.state['processes'].items()if k!=profile}==normalBefore and h.state['processes']==hubbleBefore
p=l.state['processes'][profile];assert p['binarySha256']==d['binarySHA256'] and p['variant']=='M-h05' and r.process_identity(p['pid'])==p['identity'] and r.pid_owns_port(p['pid'],19847)
d.update(appPID=p['pid'],port=19847,variant=p['variant'],non07ProcessRecordsUnchanged=True,hubbleProcessRecordsAndIdentityUnchanged=True,appFinishedAt=now());(out/'candidate.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({'status':'PASS','pid':p['pid'],'binarySHA256':d['binarySHA256'],'indexSHA256':d['indexSHA256']}))
