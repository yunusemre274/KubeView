"""Single finite exact-owned resume; no bootstrap/minikube/add request."""
from pathlib import Path
import datetime, errno, hashlib, importlib.util, json, os, re, shutil, signal, subprocess, sys, time, traceback
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
STATE = Path.home() / 'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
HELPER_SHA = '4613d23a1efc216c4de4c2027cf164de77593e902fdb6ddc66da560b8aedbab5'
PROFILE_SHA = '4733b8f4870354b6bd0404dfe3d912dca704d1e5f392eb9fe3f397516db8da1c'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
utc = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
def need(ok, reason):
    if not ok: raise RuntimeError(reason)
def safe_error(exc):
    result = {'errorClass': type(exc).__name__, 'trace': [{'file': Path(f.filename).name, 'line': f.lineno, 'function': f.name} for f in traceback.extract_tb(exc.__traceback__)]}
    if isinstance(exc, OSError): result.update(errno=exc.errno, errnoSymbol=errno.errorcode.get(exc.errno))
    if type(exc).__name__ in ('Guard', 'LabError', 'RuntimeError', 'TimeoutError'): result['safeCategory'] = str(exc)
    return result
def global_stats():
    files = {Path.home()/'.kube/config'} | {Path(p).expanduser() for p in os.environ.get('KUBECONFIG', '').split(os.pathsep) if p}
    result = {}
    for p in files:
        try:
            s=p.stat(); result[str(p.absolute())]={'exists':True,'device':s.st_dev,'inode':s.st_ino,'bytes':s.st_size,'mtimeNs':s.st_mtime_ns,'ctimeNs':s.st_ctime_ns}
        except FileNotFoundError: result[str(p.absolute())]={'exists':False}
    return result
def alarm(*_): raise TimeoutError('exact_owned_resume_180s_limit')
started = time.time(); proof = {'status':'FAIL','startedAt':utc(),'rootClearance':'2026-11-12 root approved only exact original two-container resume and private API port refresh','noBootstrap':True,'noMinikubeCLI':True,'noWorkerPOST':True,'events':[]}; tx=None; step='identity'
signal.signal(signal.SIGALRM,alarm); signal.setitimer(signal.ITIMER_REAL,180)
try:
    helper=ROOT/'scripts/release-provider-lab.py'; need(sha(helper)==HELPER_SHA,'helper_identity')
    spec=importlib.util.spec_from_file_location('resume_profile_lock_helper_20261112',helper);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    tx=m.Transaction('check');tx.budget.limit=started+170;tx.budget.hard=started+175;tx.budget.start_watchdog()
    def power():
        raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);match=re.search(r'(\d+)%',raw);free=shutil.disk_usage(ROOT).free
        need(match is not None and int(match[1])>=25 and free>=10*1024**3,'battery25_disk10GiB_guard')
        return {'at':utc(),'batteryPercent':int(match[1]),'AC':'AC Power'in raw,'freeDiskBytes':free}
    tx.power=power;tx.mod.global_configs=global_stats
    proof['powerBefore']=power(); before_global=global_stats();profile=STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json'
    need(sha(profile)==PROFILE_SHA,'original_profile_bytes');labsha=sha(tx.lab.file)
    with tx.lab.lock():
        d=tx.lab.state;c=d['clusters']['a']
        need(d['labId']==m.LAB and c['name']==m.PROFILE and c['uid']==m.SYSTEM and c['markerUid']==m.MARKER and c['nodeUids']==m.ORIGINAL,'stored_lab_UID_identity')
        need({x['name']:x['id'] for x in c['containers']}==m.HOSTS,'exact_original_host_inventory')
        step='offline_exact_owned_guard'; tx.lab.guard_cluster('a',api=False)
        initial=[]
        for item in c['containers']:
            actual=tx.lab.check_container(c,item);initial.append({'id':actual['Id'],'name':actual['Name'].lstrip('/'),'created':actual['Created'],'running':actual['State']['Running']})
        need(all(not x['running'] for x in initial),'expected_exact_originals_stopped')
        proof['originalContainersBefore']=initial
        step='start_exact_original_containers'
        for item in c['containers']:
            tx.lab.check_container(c,item);tx.cmd(['/usr/local/bin/docker','start',item['id']],40)
            proof['events'].append({'at':utc(),'event':'exact_original_container_started','id':item['id']})
        step='refresh_private_admin_API_port';tx.lab.refresh_admin_server('a')
        proof['events'].append({'at':utc(),'event':'private_admin_API_refreshed_by_existing_helper','globalConfigContentsNotRead':True})
        step='live_UID_marker_NodeReady_guard';ready_deadline=min(started+160,time.time()+120)
        while True:
            try:
                nodes=tx.guard()
                need(len(nodes)==2 and all(any(v['type']=='Ready' and v['status']=='True' for v in n.get('status',{}).get('conditions',[])) for n in nodes),'original_two_Node_not_Ready_yet')
                break
            except (m.Guard,m.mod.LabError,RuntimeError) as exc:
                if any(word in str(exc) for word in ('UID','owner','auth/CA','inventory','binding')) or time.time()>=ready_deadline: raise
                time.sleep(.5)
        proof['originalNodeUIDs']={n['metadata']['name']:n['metadata']['uid'] for n in nodes}
        proof['originalContainersAfter']=[{'id':tx.lab.check_container(c,item)['Id'],'running':tx.lab.check_container(c,item)['State']['Running']} for item in c['containers']]
        need(sha(profile)==PROFILE_SHA and sha(tx.lab.file)==labsha and global_stats()==before_global,'resume_original_profile_lab_global_metadata_changed')
        proof.update(status='PASS',systemUID=m.SYSTEM,ownerMarkerUID=m.MARKER,originalTwoReady=True,profileSHA256=sha(profile),labFileUnchanged=True,globalConfigStatEqual=True,globalConfigContentsNotRead=True,helperSHA256=sha(helper),powerAfter=power())
except BaseException as exc:
    proof['firstFailure']={'step':step,**safe_error(exc)}
finally:
    if tx:tx.budget.close()
    signal.setitimer(signal.ITIMER_REAL,0)
    proof.update(completedAt=utc(),elapsedSeconds=time.time()-started,limitSeconds=180)
    (OUT/'resume-result.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof),flush=True)
sys.exit(0 if proof['status']=='PASS' else 1)
