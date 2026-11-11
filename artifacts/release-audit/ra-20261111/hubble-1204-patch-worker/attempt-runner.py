import os,sys,json,subprocess,time,hashlib,shutil,signal,datetime,difflib
from pathlib import Path
root=Path.cwd(); private=root/'.git/release-audit/hubble-v1.20.4-patched1'; art=root/'artifacts/release-audit/ra-20261111/hubble-1204-patch-worker'; source=Path((private/'source-path.txt').read_text().strip()); job=json.loads((private/'job.json').read_text()); deadline=datetime.datetime.fromisoformat(job['deadline_utc']).timestamp()
env=os.environ.copy(); env.update(GOTOOLCHAIN='go1.27.4',GOMAXPROCS='2',GOMEMLIMIT='1GiB',CGO_ENABLED='0')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,x): (art/n).write_text(json.dumps(x,indent=2)+'\n')
def inventory(d):
 rows=[]
 for p in sorted(d.rglob('*')):
  if p.is_file() and not p.is_symlink(): rows.append({'path':str(p.relative_to(d)),'size':p.stat().st_size,'sha256':sha(p)})
 return rows
baseline=inventory(source); write('baseline-source-inventory.json',baseline)
licenses=[r for r in baseline if any(n in Path(r['path']).name.lower() for n in ['license','copying','notice'])]; write('licenses.json',licenses)
if (source/'LICENSE').exists(): shutil.copyfile(source/'LICENSE',art/'LICENSE')
write('version-marker-source.json',{'makefile':(source/'Makefile').read_text(),'main_go':(source/'main.go').read_text(),'note':'The official Makefile sets github.com/cilium/cilium/hubble/pkg variables, inherited from the versioned Cilium dependency.'})
def run(n,cmd,maxsec,limits=False,cwd=source,envrun=env):
 start=time.time(); end=min(deadline,start+maxsec); peak=0; reason=None
 with (art/(n+'.stdout')).open('wb') as out,(art/(n+'.stderr')).open('wb') as err:
  p=subprocess.Popen(cmd,cwd=cwd,env=envrun,stdout=out,stderr=err,start_new_session=True)
  while p.poll() is None:
   if limits:
    ps=subprocess.run(['ps','-axo','pid=,ppid=,rss='],capture_output=True,text=True).stdout.splitlines(); entries={}
    for l in ps:
     try:a,b,c=map(int,l.split());entries[a]=(b,c)
     except:pass
    children={p.pid}; changed=True
    while changed:
     old=len(children); children.update(k for k,(pp,r) in entries.items() if pp in children); changed=len(children)!=old
    rss=sum(entries.get(k,(0,0))[1]*1024 for k in children); peak=max(peak,rss)
    if rss>job['rss_limit_bytes']:reason='RSS_STOP_2GiB'
    if shutil.disk_usage(private).free<job['min_free_bytes']:reason='DISK_STOP_10GiB'
   if time.time()>=end:reason='DEADLINE_TIMEOUT'
   if reason:
    os.killpg(p.pid,signal.SIGTERM)
    try:p.wait(timeout=2)
    except:os.killpg(p.pid,signal.SIGKILL);p.wait()
    break
   time.sleep(.3)
  code=p.wait()
 result={'argv':cmd,'cwd':str(cwd.relative_to(root)) if cwd.is_relative_to(root) else str(cwd),'env':{k:envrun[k] for k in ['GOTOOLCHAIN','GOMAXPROCS','GOMEMLIMIT','CGO_ENABLED'] if k in envrun},'started_at_utc':datetime.datetime.fromtimestamp(start,datetime.timezone.utc).isoformat(),'elapsed_seconds':round(time.time()-start,3),'exit_code':code,'peak_owned_rss_bytes':peak,'stop_reason':reason,'stdout_sha256':sha(art/(n+'.stdout')),'stderr_sha256':sha(art/(n+'.stderr'))};write(n+'.json',result);print(n,code,reason,flush=True);return code==0 and not reason
# One graph request; no unrelated direct upgrades.
if not run('graph',['go','get','-p=1','golang.org/x/net@v0.62.0'],50,True):sys.exit(10)
subprocess.run(['go','mod','edit','-toolchain=go1.27.4'],cwd=source,env=env,check=True)
for n in ['go.mod','go.sum']:
 shutil.copyfile(source/n,art/('patched-'+n))
 (art/(n+'.patch')).write_text(''.join(difflib.unified_diff((art/('baseline-'+n)).read_text().splitlines(True),(source/n).read_text().splitlines(True),fromfile='a/'+n,tofile='b/'+n)))
commit=json.loads((art/'source-manifest.json').read_text())['commit']; binary=private/'hubble-v1.20.4-kubeview-patched.1'
flags='-w -s -X github.com/cilium/cilium/hubble/pkg.Version=v1.20.4-kubeview-patched.1 -X github.com/cilium/cilium/hubble/pkg.GitHash='+commit+' -X github.com/cilium/cilium/hubble/pkg.GitBranch=kubeview-audit-v1.20.4-patched.1'
# Reserve >=80s for safe checks and scanners; at most one compile.
budget=max(1,min(280,int(deadline-time.time()-80)))
if not run('build',['go','build','-trimpath','-buildvcs=false','-p=1','-mod=mod','-ldflags',flags,'-o',str(binary),'.'],budget,True):sys.exit(11)
write('binary-manifest.json',{'path':str(binary.relative_to(root)),'bytes':binary.stat().st_size,'sha256':sha(binary),'custom_version':'v1.20.4-kubeview-patched.1','upstream_commit':commit,'official_binary':False,'CGO_ENABLED':'0'})
run('buildinfo',['go','version','-m',str(binary)],5)
post=inventory(source);write('post-source-inventory.json',post)
write('source-changes.json',[{'path':r['path'],'before':next((b['sha256'] for b in baseline if b['path']==r['path']),None),'after':r['sha256']} for r in post if next((b['sha256'] for b in baseline if b['path']==r['path']),None)!=r['sha256']])
write('old-candidate-preserved.json',{'path':'.git/release-audit/patched-hubble-v1.20.2/hubble-v1.20.2-kubeview-patched.1','sha256':sha(root/'.git/release-audit/patched-hubble-v1.20.2/hubble-v1.20.2-kubeview-patched.1'),'matches_preflight':sha(root/'.git/release-audit/patched-hubble-v1.20.2/hubble-v1.20.2-kubeview-patched.1')==job['old_binary_sha256']})
cli_env=env.copy(); cli_env['HOME']=str(private/'isolated-home');cli_env['XDG_CONFIG_HOME']=str(private/'isolated-home/config');(private/'isolated-home/config').mkdir(parents=True,exist_ok=True)
for n,args in [('version',['version']),('help',['--help']),('status-help',['status','--help']),('observe-help',['observe','--help'])]:run(n,[str(binary),'--config','/dev/null']+args,5,envrun=cli_env)
run('govuln',[str(root/'.git/release-audit/tools/govulncheck'),'-json','-mode=binary',str(binary)],40,True)
print('READY_SCANNERS',flush=True)
