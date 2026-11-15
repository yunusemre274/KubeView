"""One serial A/B existing-runner smoke, 120s including owned cleanup."""
from pathlib import Path
import datetime,hashlib,json,os,re,shutil,signal,subprocess,time
R=Path(__file__).resolve().parents[4];A=Path(__file__).resolve().parent;start=time.time();deadline=start+120
H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
backendTag='cat16-common-f32-20261112T113255Z';backend=R/'benchmarks/.build'/backendTag/'backend.test';expected='9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8'
node=Path.home()/'.nvm/versions/node/v24.16.0/bin/node';go=Path.home()/'go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin';env=dict(os.environ);env.update(GOMAXPROCS='2',GOMEMLIMIT='2GiB',PATH=str(go)+':'+str(node.parent)+':'+env['PATH'])
receipt={'status':'FAIL','startedAt':utc(),'limitSeconds':120,'mode':'COMPARABILITY_SMOKE_NO_PERFORMANCE_WINDOW','realKubernetesOrUserCLI':False,'jobs':[],'power':[],'samples':[],'cleanup':[]};captured={};p=None
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
 raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);m=re.search(r'(\d+)%',raw);free=shutil.disk_usage(R).free;receipt['power'].append({'at':utc(),'batteryPercent':int(m[1])if m else None,'diskBytes':free});need(m is not None and int(m[1])>=30 and free>=10*1024**3,'battery30_disk10GiB_guard')
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
 need(not(A/'smoke-execution.json').exists(),'one_shot_no_rerun');need(H(backend)==expected,'common_backend_SHA_guard');power()
 for side,phase,tag in [('A','baseline','cat16-36d-20261112T113255Z'),('B','optimized','cat16-f32-20261112T113255Z')]:
  port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:5192','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);need(port.returncode==1 and not port.stdout,'port5192_not_free')
  need(H(backend)==expected and H(R/'benchmarks/.build'/tag/'backend.test')==expected,'frozen_backend_identity')
  runid='cat16-camera24-'+side+'-20261112T114404Z';argv=[str(node),'benchmarks/run.mjs','--phase',phase,'--build-tag',tag,'--backend-tag',backendTag,'--reuse-build','--reuse-binary','--profiles','M','--scenarios','panel-open','--panel-matrix','--repeats','1','--warmup','30','--seconds','1','--camera-fov','24','--dpr','1','--harbors','1','--lock-input','--lock-visual-start','--comparability-smoke','--capture-start','--disable-browser-energy-saver','--max-minutes','1.7','--port','5192','--experiment-family','frontend-browser-common-backend-COMPARABILITY_SMOKE','--id',runid]
  job={'side':side,'id':runid,'argv':argv,'startedAt':utc()};receipt['jobs'].append(job)
  with(A/(side+'.stdout')).open('wb')as stdout,(A/(side+'.stderr')).open('wb')as stderr:
   p=subprocess.Popen(argv,cwd=R,env=env,stdout=stdout,stderr=stderr,start_new_session=True);job['PID']=p.pid;lastPower=0
   while p.poll()is None:
    need(time.time()<deadline-8,'actual_smoke_120s_cleanup_reserve');capture(p.pid)
    if time.time()-lastPower>10:power();lastPower=time.time()
    time.sleep(.25)
  job['exitCode']=p.wait();job['finishedAt']=utc();cleanup();need(job['exitCode']==0,'existing_runner_'+side+'_failed_no_retry')
  summary=R/'benchmarks/results'/runid/'summary.json';data=json.loads(summary.read_text());need(data['manifest']['backendBinarySHA256']==expected,'measured_backend_SHA_guard');need(len(data['runs'])==1 and not data['errors'],'one_complete_smoke_case')
 receipt['status']='PASS_RUNS_COMPLETED_COMPARABILITY_REVIEW_PENDING'
except BaseException as error:receipt['firstFailure']={'class':type(error).__name__,'safeCategory':str(error)if isinstance(error,RuntimeError)else'details_omitted'}
finally:
 cleanup();port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:5192','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);receipt['port5192Free']=port.returncode==1 and not port.stdout;receipt.update(finishedAt=utc(),elapsedSeconds=time.time()-start,backendUnchanged=H(backend)==expected)
 if receipt['elapsedSeconds']>120 or not receipt['port5192Free']or not all(x['capturedIdentityAbsent']for x in receipt['cleanup']):receipt['status']='FAIL'
 (A/'smoke-execution.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'elapsedSeconds':receipt['elapsedSeconds'],'jobs':[{'side':j['side'],'exitCode':j.get('exitCode')}for j in receipt['jobs']],'failure':receipt.get('firstFailure'),'port5192Free':receipt['port5192Free']}))
raise SystemExit(0 if receipt['status'].startswith('PASS')else 1)
