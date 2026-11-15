"""Read-only continuation after recorded resume harness failure; no start/refresh."""
from pathlib import Path
import datetime,errno,hashlib,importlib.util,json,re,shutil,signal,subprocess,sys,time,traceback
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
started=time.time();tx=None;proof={'status':'FAIL','startedAt':utc(),'mode':'read-only guard continuation; no second resume','priorResumeResultPreserved':'resume-result.json','priorHarnessError':'except tuple m.mod.LabError; helper module has no mod attribute, correct owner is tx.mod','mutations':False}
def need(ok,reason):
    if not ok:raise RuntimeError(reason)
def alarm(*_):raise TimeoutError('read_only_resume_guard_90s_limit')
signal.signal(signal.SIGALRM,alarm);signal.setitimer(signal.ITIMER_REAL,90)
try:
    helper=ROOT/'scripts/release-provider-lab.py';need(sha(helper)=='4613d23a1efc216c4de4c2027cf164de77593e902fdb6ddc66da560b8aedbab5','helper_identity')
    spec=importlib.util.spec_from_file_location('readonly_resume_guard_20261112',helper);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);tx=m.Transaction('check');tx.budget.limit=started+85;tx.budget.start_watchdog()
    def power():
        raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);v=re.search(r'(\d+)%',raw);free=shutil.disk_usage(ROOT).free;need(v is not None and int(v[1])>=25 and free>=10*1024**3,'battery25_disk10GiB_guard');return {'batteryPercent':int(v[1]),'freeDiskBytes':free}
    tx.power=power;proof['powerBefore']=power();last=None
    while time.time()<started+80:
        try:
            nodes=tx.guard();need(len(nodes)==2 and all(any(c['type']=='Ready' and c['status']=='True' for c in n['status']['conditions']) for n in nodes),'original_two_not_Ready_yet');break
        except (m.Guard,tx.mod.LabError,RuntimeError) as exc:
            last=exc
            if any(w in str(exc) for w in ('UID','owner','auth/CA','inventory','binding')):raise
            time.sleep(.5)
    else:raise last or TimeoutError('read_only_guard_not_Ready')
    profile=m.STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json';need(sha(profile)=='4733b8f4870354b6bd0404dfe3d912dca704d1e5f392eb9fe3f397516db8da1c','profile_bytes_changed')
    proof.update(status='PASS',systemUID=m.SYSTEM,ownerMarkerUID=m.MARKER,originalNodeUIDs={n['metadata']['name']:n['metadata']['uid'] for n in nodes},originalTwoReady=True,profileSHA256=sha(profile),powerAfter=power())
except BaseException as exc:
    proof['firstFailure']={'errorClass':type(exc).__name__,'trace':[{'file':Path(f.filename).name,'line':f.lineno,'function':f.name} for f in traceback.extract_tb(exc.__traceback__)]}
    if isinstance(exc,OSError):proof['firstFailure'].update(errno=exc.errno,errnoSymbol=errno.errorcode.get(exc.errno))
    if type(exc).__name__ in ('Guard','LabError','RuntimeError','TimeoutError'):proof['firstFailure']['safeCategory']=str(exc)
finally:
    if tx:tx.budget.close()
    signal.setitimer(signal.ITIMER_REAL,0);proof.update(completedAt=utc(),elapsedSeconds=time.time()-started,limitSeconds=90);(OUT/'resume-guard-result.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof),flush=True)
sys.exit(0 if proof['status']=='PASS' else 1)
