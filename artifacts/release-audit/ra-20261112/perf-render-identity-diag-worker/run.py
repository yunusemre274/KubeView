"""At most A then B render identity diagnostic, 120s including exact owned cleanup."""
from pathlib import Path
import datetime,hashlib,json,os,re,shutil,signal,subprocess,time
R=Path(__file__).resolve().parents[4];A=Path(__file__).resolve().parent;start=time.time();phaseStart=datetime.datetime(2026,11,12,19,57,27,tzinfo=datetime.timezone.utc).timestamp();deadline=phaseStart+600;jobDeadline=None
H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
backendTag='cat16-common-f32-20261112T113255Z';backend=R/'benchmarks/.build'/backendTag/'backend.test';expected='9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8';sourceReceipt=json.loads((A/'source-before.json').read_text());originalSource=sourceReceipt['repositoryRunSHA256'];privateSHA=sourceReceipt['privateRunSHA256']
node=Path.home()/'.nvm/versions/node/v24.16.0/bin/node';go=Path.home()/'go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin';env=dict(os.environ);env.update(GOMAXPROCS='2',GOMEMLIMIT='2GiB',PATH=str(go)+':'+str(node.parent)+':'+env['PATH'])
receipt={'status':'FAIL','startedAt':utc(),'phaseLimitSeconds':600,'eachJobLimitSeconds':120,'phaseStartedAt':'2026-11-12T19:57:27Z','mode':'INSTRUMENTED_RENDER_IDENTITY_NOT_PERFORMANCE_ACCEPTANCE','realKubernetesOrUserCLI':False,'jobs':[],'power':[],'samples':[],'cleanup':[]};captured={};p=None
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
def power(requireStart=False):
 raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);m=re.search(r'(\d+)%',raw);free=shutil.disk_usage(R).free;low=subprocess.check_output(['/usr/bin/pmset','-g','custom'],text=True,timeout=2);modes=re.findall(r'lowpowermode\s+(\d+)',low);receipt['power'].append({'at':utc(),'batteryPercent':int(m[1])if m else None,'diskBytes':free,'lowPowerModes':[int(x)for x in modes],'startGuard':requireStart});need(m is not None and int(m[1])>=(40 if requireStart else 35) and free>=10*1024**3 and modes and all(x=='0'for x in modes),'battery_start40_abort35_disk10GiB_lowPower0_guard')
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
 receipt['cleanup']=[{'pid':pid,'birthStartText':birth[:24],'exactBirthCommandSHA256':hashlib.sha256(birth.encode()).hexdigest(),'capturedIdentityAbsent':identity(pid)!=birth}for pid,birth in captured.items()]
try:
 need(not(A/'smoke-execution.json').exists(),'one_shot_no_rerun');need(H(R/'benchmarks/run.mjs')==originalSource and H(R/'.git/release-audit/perf-render-identity-diag-worker/run.mjs')==privateSHA,'exact_run_source_guard');need(H(backend)==expected,'common_backend_SHA_guard');power()
 for side,phase,tag in [('A','baseline','cat16-36d-20261112T113255Z'),('B','optimized','cat16-f32-20261112T113255Z')]:
  power(requireStart=True);need(time.time()<deadline-120,'phase_cleanup_report_reserve');jobStart=time.time();jobDeadline=jobStart+120
  port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:5192','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);need(port.returncode==1 and not port.stdout,'port5192_not_free')
  need(H(backend)==expected and H(R/'benchmarks/.build'/tag/'backend.test')==expected,'frozen_backend_identity')
  runid='cat16-render-identity-'+side+'-20261112T195727Z';argv=[str(node),str(R/'.git/release-audit/perf-render-identity-diag-worker/run.mjs'),'--phase',phase,'--build-tag',tag,'--backend-tag',backendTag,'--reuse-build','--reuse-binary','--profiles','M','--scenarios','panel-open-events','--panel-matrix','--repeats','1','--repeat-offset','3','--warmup','30','--seconds','15','--camera-fov','38','--dpr','1','--harbors','1','--lock-input','--lock-visual-start','--scene-inventory','--disable-browser-energy-saver','--max-minutes','1.7','--port','5192','--experiment-family','INSTRUMENTED_RENDER_IDENTITY_NOT_PERFORMANCE_ACCEPTANCE','--id',runid]
  job={'side':side,'id':runid,'argv':argv,'startedAt':utc()};receipt['jobs'].append(job)
  with(A/(side+'.stdout')).open('wb')as stdout,(A/(side+'.stderr')).open('wb')as stderr:
   p=subprocess.Popen(argv,cwd=R,env=env,stdout=stdout,stderr=stderr,start_new_session=True);job['PID']=p.pid;lastPower=0
   while p.poll()is None:
    need(time.time()<min(jobDeadline-15,deadline-30),'actual_job120_cleanup15_phase600_guard');capture(p.pid)
    if time.time()-lastPower>10:power();lastPower=time.time()
    time.sleep(.25)
  job['exitCode']=p.wait();job['finishedAt']=utc();cleanup();job['elapsedSecondsIncludingCleanup']=time.time()-jobStart;need(job['elapsedSecondsIncludingCleanup']<=120,'job_total120_guard');need(job['exitCode']==0,'existing_runner_'+side+'_failed_no_retry')
  summary=A/'runtime'/runid/'summary.json';data=json.loads(summary.read_text());need(data['manifest']['backendBinarySHA256']==expected,'measured_backend_SHA_guard');need(len(data['runs'])==1 and not data['errors'],'one_complete_instrumented_case');run=data['runs'][0];need(run['producer']['planned']==75 and run['producer']['completed']==75 and run['summary']['messages']==75 and run['producer']['valid'] and all(run['consistency'].values()),'actual75_events_fullcanonical_guard');(A/'progress.json').write_text(json.dumps({'at':utc(),'status':'JOBS_RUNNING_OR_COMPLETE','jobsCompleted':len(receipt['jobs']),'phaseElapsedSeconds':time.time()-phaseStart},indent=2)+'\n')
 receipt['status']='PASS_INSTRUMENTED_JOBS_REVIEW_PENDING'
except BaseException as error:receipt['firstFailure']={'class':type(error).__name__,'safeCategory':str(error)if isinstance(error,RuntimeError)else'details_omitted'}
finally:
 cleanup();port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:5192','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);receipt['port5192Free']=port.returncode==1 and not port.stdout;receipt.update(finishedAt=utc(),elapsedSeconds=time.time()-start,phaseElapsedSeconds=time.time()-phaseStart,backendUnchanged=H(backend)==expected,repositoryRunUnchanged=H(R/'benchmarks/run.mjs')==originalSource,privateRunUnchanged=H(R/'.git/release-audit/perf-render-identity-diag-worker/run.mjs')==privateSHA)
 if receipt['phaseElapsedSeconds']>600 or not receipt['port5192Free']or not all(x['capturedIdentityAbsent']for x in receipt['cleanup']):receipt['status']='FAIL'
 (A/'smoke-execution.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'elapsedSeconds':receipt['elapsedSeconds'],'jobs':[{'side':j['side'],'exitCode':j.get('exitCode')}for j in receipt['jobs']],'failure':receipt.get('firstFailure'),'port5192Free':receipt['port5192Free']}))
raise SystemExit(0 if receipt['status'].startswith('PASS')else 1)
