from pathlib import Path
import subprocess,os,json,sys,time,datetime,signal,shutil,hashlib,gzip,re,collections
root=Path('/Users/yunusemre/Desktop/KubeView');private=root/'.git/release-audit/provider-image-worker';art=root/'artifacts/release-audit/ra-20261111/provider-image-worker';label=sys.argv[1];pre=json.loads((art/'preflight.json').read_text());target=next(x for x in pre['targets_in_order'] if x['label']==label);deadline=datetime.datetime.fromisoformat(json.loads((private/'job.json').read_text())['deadline_utc']).timestamp();start=time.monotonic();stamp=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat();raw=private/(label+'.json');env={k:v for k,v in os.environ.items() if not k.startswith(('TRIVY_','AWS_','AZURE_','GOOGLE_','GCP_','REGISTRY_')) and k!='DOCKER_AUTH_CONFIG'};env.update(GOMAXPROCS='1',GOMEMLIMIT='1024MiB',DOCKER_CONFIG=str(private/'empty-auth'),REGISTRY_AUTH_FILE=str(private/'empty-registry-auth.json'),XDG_CONFIG_HOME=str(private/'empty-auth'),XDG_RUNTIME_DIR=str(private/'empty-auth'));timeout=min(150,max(1,int(deadline-time.time())));cmd=[pre['trivy_binary'],'--cache-dir',str(root/pre['cache_dir']),'--config',str(private/'trivy.yaml'),'image','--image-src','remote','--platform','linux/arm64','--scanners','vuln','--pkg-types','os,library','--parallel','1','--skip-db-update','--skip-java-db-update','--skip-check-update','--skip-version-check','--skip-vex-repo-update','--disable-telemetry','--offline-scan','--no-progress','--ignorefile',str(private/'empty.ignore'),'--module-dir',str(private/'modules'),'--format','json','--output',str(raw),'--timeout',str(timeout)+'s',target['ref']];record={'label':label,'target':target['ref'],'command':cmd,'started_at_utc':stamp(),'timeout_seconds':timeout,'rss_limit_bytes':1610612736,'minimum_free_bytes':10737418240,'GOMAXPROCS':1,'GOMEMLIMIT':'1024MiB','parallel':1,'image_executed':False,'credentials':'empty private config; credential environment removed'}
def table():
 out={}
 for line in subprocess.check_output(['ps','-axo','pid=,ppid=,rss=,comm='],text=True).splitlines():
  v=line.strip().split(None,3)
  if len(v)==4:
   try:out[int(v[0])]={'pid':int(v[0]),'ppid':int(v[1]),'rss_bytes':int(v[2])*1024,'comm':v[3]}
   except ValueError:pass
 return out
def children(t,pid):
 ids={pid}
 while True:
  new={k for k,v in t.items() if v['ppid'] in ids}
  if new.issubset(ids):return [t[k] for k in ids if k in t]
  ids.update(new)
peak=0;mindisk=shutil.disk_usage(private).free;samples=[];stop=None
with (private/(label+'.stdout')).open('w') as out,(private/(label+'.stderr')).open('w') as err:
 p=subprocess.Popen(cmd,cwd=private,env=env,stdout=out,stderr=err,start_new_session=True)
 while p.poll() is None:
  t=table();rows=children(t,p.pid);rss=sum(x['rss_bytes'] for x in rows)+t.get(os.getpid(),{}).get('rss_bytes',0);peak=max(peak,rss);free=shutil.disk_usage(private).free;mindisk=min(mindisk,free);elapsed=time.monotonic()-start;samples.append({'elapsed_seconds':round(elapsed,3),'owned_rss_bytes':rss,'free_disk_bytes':free})
  if (private/'STOP').exists():stop='ROOT_LEASE_STOP'
  elif rss>1610612736:stop='RSS1.5GiB'
  elif free<10737418240:stop='DISK10GiB'
  elif elapsed>=timeout or time.time()>=deadline:stop='TIMEOUT'
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
log=(private/(label+'.stderr')).read_text();log=re.sub(r'(?i)(authorization|password|token)([=: ]+)[^\s,]+',r'\1\2[REDACTED]',log);(art/(label+'.stderr')).write_text(log);record.update(finished_at_utc=stamp(),duration_seconds=round(time.monotonic()-start,3),exit_code=rc,stop_reason=stop,peak_owned_rss_bytes=peak,minimum_observed_free_bytes=mindisk);(art/(label+'-resources.json')).write_text(json.dumps(samples,indent=2)+'\n');findings=[]
if rc==0 and raw.is_file():
 try:
  data=json.loads(raw.read_text());metadata=data.get('Metadata',{});config=metadata.get('ImageConfig',{});platform={'os':config.get('os'),'architecture':config.get('architecture')};record['status']='PASS_SCAN_WITH_OR_WITHOUT_FINDINGS';record['platform_observed']=platform;record['metadata']={k:metadata.get(k) for k in ['ImageID','DiffIDs','RepoTags','RepoDigests','OS','Size']};record['scanner_created_at']=data.get('CreatedAt');record['raw_json_sha256']=hashlib.sha256(raw.read_bytes()).hexdigest()
  for result in data.get('Results',[]):
   for v in result.get('Vulnerabilities') or []:
    findings.append({'image':label,'digest_ref':target['ref'],'target':result.get('Target'),'class':result.get('Class'),'type':result.get('Type'),'id':v.get('VulnerabilityID'),'pkg':v.get('PkgName'),'pkg_path':v.get('PkgPath'),'installed':v.get('InstalledVersion'),'fixed':v.get('FixedVersion'),'status':v.get('Status'),'severity':v.get('Severity'),'severity_source':v.get('SeveritySource'),'title':v.get('Title'),'primary_url':v.get('PrimaryURL'),'references':v.get('References'),'data_source':v.get('DataSource'),'cvss':v.get('CVSS')})
  record.update(package_advisory_rows=len(findings),unique_advisory_ids=len({x['id'] for x in findings}),row_severity_counts=dict(collections.Counter(x['severity'] for x in findings)),high_critical_unique_ids=sorted({x['id'] for x in findings if x['severity'] in ['HIGH','CRITICAL']}));(art/(label+'-findings.json')).write_text(json.dumps(findings,indent=2)+'\n')
  with raw.open('rb') as source,gzip.open(art/(label+'-raw.json.gz'),'wb') as dest:shutil.copyfileobj(source,dest)
 except Exception as exc:record.update(status='BLOCKED_JSON_PARSE',parse_error_class=type(exc).__name__)
else:record['status']='BLOCKED_RESOURCE_OR_LEASE' if stop else 'BLOCKED_ACCESS_DB_OR_SCAN_ERROR'
(art/(label+'-manifest.json')).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2),flush=True)
