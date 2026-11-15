import os,sys,json,subprocess,time,hashlib,shutil,signal,datetime,difflib,gzip,re,urllib.parse
from pathlib import Path
root=Path.cwd(); private=root/'.git/release-audit/hubble-v1.20.4-patched1'; art=root/'artifacts/release-audit/ra-20261111/hubble-1204-warm-retest-worker'; oldart=root/'artifacts/release-audit/ra-20261111/hubble-1204-patch-worker'; art.mkdir(parents=True,exist_ok=False); source=Path((private/'source-path.txt').read_text().strip()); start=time.time(); deadline=start+360
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,x): (art/n).write_text(json.dumps(x,indent=2)+'\n')
def inventory(d):
 return [{'path':str(p.relative_to(d)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(d.rglob('*')) if p.is_file() and not p.is_symlink()]
def run(n,cmd,maxsec,limits=False,envrun=None,cwd=source):
 begun=time.time(); end=min(deadline,begun+maxsec); peak=0; reason=None
 with (art/(n+'.stdout')).open('wb') as out,(art/(n+'.stderr')).open('wb') as err:
  p=subprocess.Popen(cmd,cwd=cwd,env=envrun or env,stdout=out,stderr=err,start_new_session=True)
  while p.poll() is None:
   if limits:
    rows=subprocess.run(['ps','-axo','pid=,ppid=,rss='],capture_output=True,text=True).stdout.splitlines(); entries={}
    for l in rows:
     try:a,b,c=map(int,l.split());entries[a]=(b,c)
     except:pass
    children={p.pid}
    while True:
     n0=len(children);children.update(k for k,(pp,r) in entries.items() if pp in children)
     if len(children)==n0:break
    rss=sum(entries.get(k,(0,0))[1]*1024 for k in children);peak=max(peak,rss)
    if rss>2147483648:reason='RSS_STOP_2GiB'
    if shutil.disk_usage(private).free<10737418240:reason='DISK_STOP_10GiB'
   if time.time()>=end:reason='TIMEOUT'
   if reason:
    os.killpg(p.pid,signal.SIGTERM)
    try:p.wait(timeout=2)
    except:os.killpg(p.pid,signal.SIGKILL);p.wait()
    break
   time.sleep(.25)
  code=p.wait()
 receipt={'argv':cmd,'cwd':str(cwd.relative_to(root)),'started_at_utc':datetime.datetime.fromtimestamp(begun,datetime.timezone.utc).isoformat(),'elapsed_seconds':round(time.time()-begun,3),'exit_code':code,'stop_reason':reason,'max_seconds':maxsec,'peak_owned_rss_bytes':peak,'env':{k:(envrun or env)[k] for k in ['GOTOOLCHAIN','GOMAXPROCS','GOMEMLIMIT','CGO_ENABLED']},'stdout_sha256':sha(art/(n+'.stdout')),'stderr_sha256':sha(art/(n+'.stderr'))};write(n+'.json',receipt);print(n,code,reason,receipt['elapsed_seconds'],flush=True);return code==0 and not reason
source_manifest=json.loads((oldart/'source-manifest.json').read_text()); binary=private/'hubble-v1.20.4-kubeview-patched.1'; baseline=inventory(source); previous=json.loads((oldart/'post-source-inventory.json').read_text()); eq={r['path']:r['sha256'] for r in baseline}=={r['path']:r['sha256'] for r in previous}; oldchecks=inventory(oldart)
write('preflight.json',{'started_at_utc':datetime.datetime.fromtimestamp(start,datetime.timezone.utc).isoformat(),'total_budget_seconds':360,'compile_budget_seconds':240,'source_matches_failed_attempt_post_snapshot':eq,'binary_absent_before_build':not binary.exists(),'free_disk_bytes':shutil.disk_usage(private).free,'source_manifest':source_manifest,'GOTOOLCHAIN':'go1.27.4','GOMAXPROCS':2,'GOMEMLIMIT':'1GiB','RSS_limit_bytes':2147483648,'no_graph_get_download_command':True});write('source-before.json',baseline);write('failed-attempt-before.json',oldchecks)
env=os.environ.copy();env.update(GOTOOLCHAIN='go1.27.4',GOMAXPROCS='2',GOMEMLIMIT='1GiB',CGO_ENABLED='0')
if not eq or binary.exists() or shutil.disk_usage(private).free<10737418240:write('result.json',{'status':'BLOCKED','reason':'Preflight identity, absent-binary or disk guard failed'});sys.exit(12)
commit=source_manifest['commit'];flags='-w -s -X github.com/cilium/cilium/hubble/pkg.Version=v1.20.4-kubeview-patched.1 -X github.com/cilium/cilium/hubble/pkg.GitHash='+commit+' -X github.com/cilium/cilium/hubble/pkg.GitBranch=kubeview-audit-v1.20.4-patched.1'
cmd=['go','build','-trimpath','-buildvcs=false','-p=1','-mod=mod','-ldflags',flags,'-o',str(binary),'.']
success=run('build',cmd,240,True)
post=inventory(source);write('source-after.json',post);write('source-comparison.json',{'unchanged':{r['path']:r['sha256'] for r in baseline}=={r['path']:r['sha256'] for r in post},'changed':[r['path'] for r in post if next((b['sha256'] for b in baseline if b['path']==r['path']),None)!=r['sha256']]});write('failed-attempt-preservation.json',{'unchanged':oldchecks==inventory(oldart),'file_count':len(oldchecks)})
if not success:write('result.json',{'status':'FAIL','reason':'Single warm build failed or resource/time stopped','binary_exists':binary.exists(),'no_retry':True,'elapsed_seconds':round(time.time()-start,3)});sys.exit(11)
write('binary-manifest.json',{'path':str(binary.relative_to(root)),'sha256':sha(binary),'bytes':binary.stat().st_size,'version':'v1.20.4-kubeview-patched.1','upstream_commit':commit,'official_binary':False})
run('buildinfo',['go','version','-m',str(binary)],5)
child=env.copy();child['HOME']=str(private/'warm-isolated-home');child['XDG_CONFIG_HOME']=str(private/'warm-isolated-home/config');(private/'warm-isolated-home/config').mkdir(parents=True,exist_ok=True)
for n,args in [('version',['version']),('help',['--help']),('status-help',['status','--help']),('observe-help',['observe','--help'])]:run(n,[str(binary),'--config','/dev/null']+args,5,envrun=child)
scanenv=env.copy();scanenv['GOMAXPROCS']='1'
run('govuln',[str(root/'.git/release-audit/tools/govulncheck'),'-json','-mode=binary',str(binary)],45,True,envrun=scanenv)
raw=(art/'govuln.stdout').read_text();dec=json.JSONDecoder();pos=0;events=[]
while pos<len(raw):
 while pos<len(raw) and raw[pos].isspace():pos+=1
 if pos==len(raw):break
 o,j=dec.raw_decode(raw,pos);events.append(o);pos=j
findings=[e['finding'] for e in events if 'finding' in e];write('govuln-summary.json',{'actual_matched_ids':sorted({f['osv'] for f in findings}),'finding_event_count':len(findings),'osv_catalog_count':sum('osv' in e for e in events),'finding_events':findings,'warning':'Stripped binaries may cause conservative allKnownVulnerableSymbols fallback; a finding symbol name is not by itself observed linkage.'})
components=[]
for l in (art/'buildinfo.stdout').read_text().splitlines():
 fields=l.strip().split('\t')
 if len(fields)>2 and fields[0]=='dep':
  mod,ver=fields[1:3]
  if ver!='(devel)':components.append({'type':'library','name':mod,'version':ver,'purl':'pkg:golang/'+urllib.parse.quote(mod,safe='/')+'@'+urllib.parse.quote(ver,safe=''),'bom-ref':mod+'@'+ver})
components.append({'type':'library','name':'stdlib','version':'v1.27.4','purl':'pkg:golang/stdlib@v1.27.4','bom-ref':'stdlib@v1.27.4'})
sbom={'bomFormat':'CycloneDX','specVersion':'1.5','version':1,'metadata':{'component':{'type':'application','name':'hubble-custom-binary','version':'v1.20.4-kubeview-patched.1','hashes':[{'alg':'SHA-256','content':sha(binary)}]},'properties':[{'name':'kubeview:audit:coverage','value':'buildinfo Go dependency modules plus stdlib; main(devel), native code and source-only modules not represented'}]},'components':components};write('binary-buildinfo.cdx.json',sbom)
(private/'empty-trivy.yaml').write_text('{}\n');(private/'empty-trivy.ignore').write_text('')
run('trivy-sbom',['/opt/homebrew/bin/trivy','--cache-dir',str(root/'.git/release-audit/trivy-cache'),'--config',str(private/'empty-trivy.yaml'),'sbom','--scanners','vuln','--pkg-types','library','--skip-db-update','--skip-java-db-update','--skip-version-check','--skip-vex-repo-update','--disable-telemetry','--offline-scan','--no-progress','--ignorefile',str(private/'empty-trivy.ignore'),'--format','json',str(art/'binary-buildinfo.cdx.json')],35,True,envrun=scanenv)
try:
 tr=json.loads((art/'trivy-sbom.stdout').read_text()); rows=[{'target':r.get('Target'),'type':r.get('Type'),**v} for r in tr.get('Results',[]) for v in r.get('Vulnerabilities',[])];write('trivy-summary.json',{'component_count':len(components),'result_count':len(tr.get('Results',[])),'vulnerability_rows':len(rows),'distinct_ids':sorted({v['VulnerabilityID'] for v in rows}),'severity_counts':{s:sum(v.get('Severity')==s for v in rows) for s in ['CRITICAL','HIGH','MEDIUM','LOW','UNKNOWN']},'findings':rows})
except Exception as e:write('trivy-summary.json',{'status':'BLOCKED','parse_error_type':type(e).__name__})
for n in ['govuln.stdout','trivy-sbom.stdout']:
 with gzip.open(art/(n+'.json.gz'),'wb') as f:f.write((art/n).read_bytes())
write('result.json',{'status':'BUILD_PASS_VERIFY_RECORDED','elapsed_seconds':round(time.time()-start,3),'binary_sha256':sha(binary),'one_build_only':True,'no_graph_get_download_command':True})
print('DONE',flush=True)
