"""Root-approved start of the existing kubelet unit on the exact owned CP."""
from pathlib import Path
import datetime,errno,hashlib,importlib.util,json,re,shutil,signal,subprocess,sys,time,traceback
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
started=time.time();tx=None;step='exact_identity';proof={'status':'FAIL','startedAt':utc(),'rootClearance':'start existing kubelet unit only on exact CP, after identity+mount checks','noContainerRestart':True,'noBootstrap':True,'noMinikubeCLI':True,'noWorkerPOST':True}
def need(ok,reason):
    if not ok:raise RuntimeError(reason)
def alarm(*_):raise TimeoutError('existing_service_resume_45s_limit')
signal.signal(signal.SIGALRM,alarm);signal.setitimer(signal.ITIMER_REAL,45)
try:
    helper=ROOT/'scripts/release-provider-lab.py';need(sha(helper)=='4613d23a1efc216c4de4c2027cf164de77593e902fdb6ddc66da560b8aedbab5','helper_identity')
    spec=importlib.util.spec_from_file_location('exact_CP_service_resume_20261112',helper);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);tx=m.Transaction('check');tx.budget.limit=started+40;tx.budget.start_watchdog()
    raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);battery=re.search(r'(\d+)%',raw);need(battery is not None and int(battery[1])>=25 and shutil.disk_usage(ROOT).free>=10*1024**3,'battery25_disk10GiB_guard')
    cluster=tx.lab.state['clusters']['a'];need(tx.lab.state['labId']==m.LAB and cluster['uid']==m.SYSTEM and cluster['markerUid']==m.MARKER and cluster['nodeUids']==m.ORIGINAL,'stored_UID_binding')
    need({x['name']:x['id'] for x in cluster['containers']}==m.HOSTS,'exact_original_inventory');tx.lab.guard_cluster('a',api=False)
    record=next(x for x in cluster['containers'] if x['name']==m.PROFILE);actual=tx.lab.check_container(cluster,record);need(actual['State']['Running'],'exact_CP_not_running')
    host=tx.host(m.PROFILE);prior=json.loads((ROOT/'artifacts/release-audit/ra-20261111/provider-profile-lock-http-worker/before.json').read_text())['snapshot']['hosts'][m.PROFILE]
    need(host==prior,'exact_CP_metadata_mounts_do_not_match_stored_receipt')
    net=tx.docker('network','inspect',m.NETWORK)[0];need(net['Id']==m.NETWORK and net['Name']==m.PROFILE and net['Labels'].get(m.OWNER)==m.LAB,'owned_network_label_binding')
    profile=m.STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json';need(sha(profile)=='4733b8f4870354b6bd0404dfe3d912dca704d1e5f392eb9fe3f397516db8da1c','profile_identity')
    proof['identity']={'container':host,'networkID':net['Id'],'networkOwner':net['Labels'][m.OWNER],'mountsEqualStoredReceipt':True,'profileSHA256':sha(profile)}
    def status():
        output=tx.cmd(['/usr/local/bin/docker','exec',record['id'],'systemctl','show','kubelet','--property=ActiveState','--property=SubState','--property=Result','--property=ExecMainStatus'],5).decode()
        values=dict(line.split('=',1) for line in output.splitlines() if '=' in line);need(set(values)=={'ActiveState','SubState','Result','ExecMainStatus'},'service_show_fields');return values
    step='service_status_before';proof['before']=status();need(proof['before']['ActiveState']=='inactive','service_not_expected_inactive')
    step='start_existing_CP_kubelet';tx.lab.check_container(cluster,record);tx.cmd(['/usr/local/bin/docker','exec',record['id'],'systemctl','start','kubelet'],25)
    step='service_status_after';proof['after']=status();need(proof['after']['ActiveState']=='active','existing_kubelet_not_active');need(sha(profile)==proof['identity']['profileSHA256'],'profile_changed');proof['status']='PASS'
except BaseException as exc:
    proof['firstFailure']={'step':step,'errorClass':type(exc).__name__,'trace':[{'file':Path(f.filename).name,'line':f.lineno,'function':f.name} for f in traceback.extract_tb(exc.__traceback__)]}
    if isinstance(exc,OSError):proof['firstFailure'].update(errno=exc.errno,errnoSymbol=errno.errorcode.get(exc.errno))
    if type(exc).__name__ in ('Guard','LabError','RuntimeError','TimeoutError'):proof['firstFailure']['safeCategory']=str(exc)
finally:
    if tx:tx.budget.close()
    signal.setitimer(signal.ITIMER_REAL,0);proof.update(completedAt=utc(),elapsedSeconds=time.time()-started,limitSeconds=45);(OUT/'service-resume-result.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof),flush=True)
sys.exit(0 if proof['status']=='PASS' else 1)
