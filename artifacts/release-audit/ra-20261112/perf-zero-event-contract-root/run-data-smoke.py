"""One B zero-event post-window canonical contract smoke; no performance acceptance."""
from pathlib import Path
import datetime,hashlib,json,os,re,shutil,signal,subprocess,time
R=Path(__file__).resolve().parents[4];A=Path(__file__).resolve().parent;start=time.time();deadline=start+30
H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
backendTag='cat16-common-f32-20261112T113255Z';backend=R/'benchmarks/.build'/backendTag/'backend.test';expected='9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8'
node=Path.home()/'.nvm/versions/node/v24.16.0/bin/node';go=Path.home()/'go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin';env=dict(os.environ);env.update(GOMAXPROCS='2',GOMEMLIMIT='2GiB',PATH=str(go)+':'+str(node.parent)+':'+env['PATH'])
initialPower=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2)
powerSource='AC' if 'AC Power' in initialPower else 'battery' if 'Battery Power' in initialPower else None
needSource = powerSource in ['AC','battery']
if not needSource:raise RuntimeError('unknown-power-source')
sourceFiles=['benchmarks/run.mjs','benchmarks/metrics.mjs','benchmarks/process-identity.mjs','benchmarks/panel-compare.mjs','benchmarks/camera-contract.mjs']
sourceHashes={f:H(R/f)for f in sourceFiles}
receipt={'sourceSHA256':sourceHashes,'powerSource':powerSource,'status':'FAIL','startedAt':utc(),'limitSeconds':30,'mode':'ZERO_EVENT_CANONICAL_CONTRACT_ONLY','realKubernetesOrUserCLI':False,'jobs':[],'power':[],'samples':[],'cleanup':[]};captured={};p=None
def need(ok,why):
 if not ok:raise RuntimeError(why)
def identity(pid):
 x=subprocess.run(['/bin/ps','-p',str(pid),'-o','lstart=','-o','command='],capture_output=True,text=True,timeout=2);return x.stdout.strip() if x.returncode==0 else None
def capture(anchor):
 lines=subprocess.check_output(['/bin/ps','-axo','pid=,ppid=,rss=,comm='],text=True,timeout=2).splitlines();rows={}
 for line in lines:
  b=line.strip().split(None,3)
  if len(b)==4:rows[int(b[0])]={'ppid':int(b[1]),'rssKiB':int(b[2]),'basename':Path(b[3]).name}
 owned={anchor}
 while True:
  n=len(owned);owned.update(pid for pid,row in rows.items()if row['ppid']in owned)
  if n==len(owned):break
 browserRSS=0;appRSS=0
 for pid in owned:
  if pid not in rows:continue
  if pid not in captured:
   birth=identity(pid)
   if birth:captured[pid]=birth
  if rows[pid]['basename']=='backend.test':appRSS+=rows[pid]['rssKiB']
  elif re.search('Chrome|Chromium|chrome|chromium',rows[pid]['basename']):browserRSS+=rows[pid]['rssKiB']
 receipt['samples'].append({'elapsedSeconds':time.time()-start,'ownedProcesses':len(owned),'browserSummedRSSKiB':browserRSS,'appRSSKiB':appRSS})
 need(browserRSS<=6*1024**2 and appRSS<=2*1024**2,'RSS_browser6GiB_app2GiB_guard')
def power():
 raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);m=re.search(r'(\d+)%',raw);free=shutil.disk_usage(R).free;source='AC' if 'AC Power' in raw else 'battery' if 'Battery Power' in raw else None;need(source==powerSource,'power-source-changed');receipt['power'].append({'at':utc(),'source':source,'batteryPercent':int(m[1])if m else None,'diskBytes':free});need(m is not None and int(m[1])>=30 and free>=10*1024**3,'battery30_disk10GiB_guard')
def cleanup():
 for pid,birth in reversed(list(captured.items())):
  if identity(pid)==birth:
   try:os.kill(pid,signal.SIGTERM)
   except ProcessLookupError:pass
 time.sleep(.2)
 for pid,birth in reversed(list(captured.items())):
  if identity(pid)==birth:
   try:os.kill(pid,signal.SIGKILL)
   except ProcessLookupError:pass
 receipt['cleanup']=[{'pid':pid,'capturedIdentityAbsent':identity(pid)!=birth}for pid,birth in captured.items()]
try:
 need(not(A/'smoke-execution.json').exists(),'one_shot_no_rerun');need(H(backend)==expected,'common_backend_SHA_guard');need(all(H(R/f)==h for f,h in sourceHashes.items()),'harness_sources_changed');power()
 for side,phase,tag in [('B','optimized','cat16-f32-20261112T113255Z')]:
  port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:5192','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);need(port.returncode==1 and not port.stdout,'port5192_not_free')
  need(H(backend)==expected and H(R/'benchmarks/.build'/tag/'backend.test')==expected,'frozen_backend_identity');need(all(H(R/f)==h for f,h in sourceHashes.items()),'harness_sources_changed')
  runid='cat16-zero-contract-'+side+'-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ');argv=[str(node),'benchmarks/run.mjs','--phase',phase,'--build-tag',tag,'--backend-tag',backendTag,'--reuse-build','--reuse-binary','--profiles','M','--scenarios','panel-open','--panel-matrix','--repeats','1','--warmup','0','--seconds','1','--camera-fov','38','--dpr','1','--harbors','1','--lock-input','--lock-visual-start','--disable-browser-energy-saver','--max-minutes','0.4','--port','5192','--experiment-family','ZERO_EVENT_CANONICAL_DATA_ONLY','--id',runid]
  job={'side':side,'id':runid,'argv':argv,'startedAt':utc()};receipt['jobs'].append(job)
  with(A/(side+'.stdout')).open('wb')as stdout,(A/(side+'.stderr')).open('wb')as stderr:
   p=subprocess.Popen(argv,cwd=R,env=env,stdout=stdout,stderr=stderr,start_new_session=True);job['PID']=p.pid;lastPower=0
   while p.poll()is None:
    need(time.time()<deadline-8,'data_smoke_30s_cleanup_reserve');capture(p.pid)
    if time.time()-lastPower>10:power();lastPower=time.time()
    time.sleep(.25)
  job['exitCode']=p.wait();job['finishedAt']=utc();cleanup();need(job['exitCode']==0,'existing_runner_'+side+'_failed_no_retry')
  summary=R/'benchmarks/results'/runid/'summary.json';data=json.loads(summary.read_text());(A/(side+'-runner-summary.json')).write_bytes(summary.read_bytes());(A/(side+'-process-samples.json')).write_bytes((summary.parent/'process-samples.json').read_bytes());need(data['manifest']['backendBinarySHA256']==expected,'measured_backend_SHA_guard');need(len(data['runs'])==1 and not data['errors'],'one_complete_validation_case')
 receipt['status']='PASS_DATA_CONTRACT_EXECUTED_REVIEW_PENDING'
except BaseException as error:receipt['firstFailure']={'class':type(error).__name__,'safeCategory':str(error)if isinstance(error,RuntimeError)else'details_omitted'}
finally:
 cleanup();port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:5192','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);receipt['port5192Free']=port.returncode==1 and not port.stdout;receipt.update(finishedAt=utc(),elapsedSeconds=time.time()-start,backendUnchanged=H(backend)==expected)
 if not all(H(R/f)==h for f,h in sourceHashes.items()) or receipt['elapsedSeconds']>30 or not receipt['port5192Free']or not all(x['capturedIdentityAbsent']for x in receipt['cleanup']):receipt['status']='FAIL'
 (A/'smoke-execution.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'elapsedSeconds':receipt['elapsedSeconds'],'jobs':[{'side':j['side'],'exitCode':j.get('exitCode')}for j in receipt['jobs']],'failure':receipt.get('firstFailure'),'port5192Free':receipt['port5192Free']}))
raise SystemExit(0 if receipt['status'].startswith('PASS')else 1)
