from pathlib import Path
import datetime,fcntl,hashlib,json,os,re,shutil,signal,subprocess,time
R=Path(__file__).resolve().parents[4]
A=Path(__file__).resolve().parent
S=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
phase=datetime.datetime.fromisoformat('2026-11-12T10:48:37+00:00').timestamp()
start=time.time();p=None;birth=None;reason=None
h=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
paths=['backend/pkg/server/release_secret_real_test.go','backend/pkg/server/server.go','backend/pkg/server/resources.go','backend/pkg/server/connection.go','backend/pkg/server/workspace_scope.go','backend/go.mod','backend/go.sum']
before={x:h(R/x) for x in paths}
(A/'source-before.json').write_text(json.dumps(before,indent=2)+'\n')
receipt=R/'artifacts/release-audit/ra-20261112/secret-purpose-real-root/namespace-receipt.json'
env=dict(os.environ);env.update(GOTOOLCHAIN='local',GOMAXPROCS='2',GOMEMLIMIT='2GiB',KUBEVIEW_RELEASE_REAL_SECRET='owned-secret-purpose-v1',KUBEVIEW_RELEASE_REAL_STATE=str(S/'lab.json'),KUBEVIEW_RELEASE_REAL_KUBECONFIG=str(S/'private/admin.json'),KUBEVIEW_RELEASE_REAL_SECRET_RECEIPT=str(receipt),KUBEVIEW_RELEASE_REAL_OUTPUT=str(A))
go=Path.home()/'go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin/go'
argv=[str(go),'test','-json','-count=1','-p=1','-parallel=1','-timeout=150s','-run','^TestReleaseOwnedSecretPurposeReal$','./pkg/server']
end=min(start+180,phase+340)
record={'startedAt':datetime.datetime.fromtimestamp(start,datetime.timezone.utc).isoformat(),'phaseStartedAt':'2026-11-12T10:48:37Z','phaseLimitSeconds':360,'commandLimitSeconds':end-start,'goTestTimeoutSeconds':150,'workSeconds':105,'cleanupSeconds':30,'argv':argv,'cwd':'backend','env':{k:env[k] for k in ('GOTOOLCHAIN','GOMAXPROCS','GOMEMLIMIT','KUBEVIEW_RELEASE_REAL_SECRET','KUBEVIEW_RELEASE_REAL_STATE','KUBEVIEW_RELEASE_REAL_KUBECONFIG','KUBEVIEW_RELEASE_REAL_SECRET_RECEIPT','KUBEVIEW_RELEASE_REAL_OUTPUT')},'sourceBefore':before,'namespaceReceiptSHA256':h(receipt),'power':[],'noAutomaticRetry':True}
def power():
 raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);m=re.search(r'(\d+)%',raw);free=shutil.disk_usage(R).free;row={'batteryPercent':int(m[1]) if m else None,'freeDiskBytes':free};record['power'].append(row)
 if not m or int(m[1])<25 or free<10*1024**3:raise RuntimeError('battery25_disk10GiB_guard')
def stop():
 if p is not None and p.poll() is None:
  actual=subprocess.check_output(['/bin/ps','-p',str(p.pid),'-o','lstart='],text=True,timeout=2).strip()
  if actual!=birth or os.getpgid(p.pid)!=p.pid:raise RuntimeError('owned_test_process_binding_changed')
  os.killpg(p.pid,signal.SIGTERM)
  try:p.wait(timeout=2)
  except subprocess.TimeoutExpired:
   actual=subprocess.check_output(['/bin/ps','-p',str(p.pid),'-o','lstart='],text=True,timeout=2).strip()
   if actual==birth and os.getpgid(p.pid)==p.pid:os.killpg(p.pid,signal.SIGKILL)
   p.wait(timeout=2)
try:
 assert not (A/'command-result.json').exists(),'single_job_no_retry'
 assert end-start>30,'remaining_phase_budget_insufficient'
 power()
 with (S/'.lock').open('a+') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  with (A/'test.jsonl').open('wb') as out,(A/'test.stderr').open('wb') as err:
   p=subprocess.Popen(argv,cwd=R/'backend',env=env,stdout=out,stderr=err,start_new_session=True);birth=subprocess.check_output(['/bin/ps','-p',str(p.pid),'-o','lstart='],text=True,timeout=2).strip();record.update(PID=p.pid,birth=birth,PGID=os.getpgid(p.pid))
   last=0
   while p.poll() is None:
    if time.time()>=end:reason='finite_outer_or_phase_deadline';stop();break
    if time.time()-last>=10:power();last=time.time()
    time.sleep(.1)
  record['exitCode']=p.wait()
except BaseException as e:
 record['failure']={'class':type(e).__name__,'category':str(e) if isinstance(e,(RuntimeError,AssertionError)) else 'details_omitted'};reason='wrapper_guard_failure'
 try:stop()
 except BaseException as cleanup:record['stopFailureClass']=type(cleanup).__name__
finally:
 record.update(completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),elapsedSeconds=time.time()-start,phaseElapsedSeconds=time.time()-phase,stopReason=reason,ownedProcessExited=p is None or p.poll() is not None)
 after={x:h(R/x) for x in paths};record['sourceUnchanged']=after==before;(A/'source-after.json').write_text(json.dumps(after,indent=2)+'\n');(A/'command-result.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
raise SystemExit(0 if record.get('exitCode')==0 and reason is None else 1)
