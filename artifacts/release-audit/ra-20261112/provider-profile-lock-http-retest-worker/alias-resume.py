"""One existing-helper exact-owned offline CP-alias repair, root cleared."""
from pathlib import Path
import datetime,errno,hashlib,importlib.util,json,re,shutil,subprocess,sys,time,traceback
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
STATE=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
started=time.time();step='exact_identity';proof={'status':'FAIL','startedAt':utc(),'rootClearance':'one existing repair_owned_worker_hosts offline call; original exact2 owned containers only','noContainerStart':True,'noBootstrap':True,'noMinikubeCLI':True,'noWorkerPOST':True,'helperCalls':0,'aliasWrites':[]}
def need(ok,reason):
    if not ok:raise RuntimeError(reason)
try:
    raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);match=re.search(r'(\d+)%',raw);need(match is not None and int(match[1])>=25 and shutil.disk_usage(ROOT).free>=10*1024**3,'battery25_disk10GiB_guard')
    spec=importlib.util.spec_from_file_location('owned_alias_manual_lab_20261112',ROOT/'scripts/manual_lab.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    lab=mod.Lab(mod.parser().parse_args(['up','--profile','06-limanlar-arasi-ag','--state-dir',str(STATE),'--minikube-binary',str(ROOT/'.git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4')]))
    expected={'kvml-d32afbf634e8-a':'97cc52cfe048288a01e4b84284b34e80ab2ea668fbe3a1dcc28309ab62a21599','kvml-d32afbf634e8-a-m02':'c6f18a25a51468412d901a43c31f8e645df9af93a57cf886ac6d632bc52185b9'};profile='kvml-d32afbf634e8-a';cluster=lab.state['clusters']['a']
    need(lab.state['labId']=='kvml-d32afbf634e8' and cluster['uid']=='e84bb50e-8d64-4bc2-905c-9b5ba193e53a' and cluster['markerUid']=='0cded75c-bc00-472f-b69f-39dfd43251f3','stored_UID_binding');need({x['name']:x['id'] for x in cluster['containers']}==expected,'exact_original_inventory')
    original_run=mod.run;expected_ip=None
    def finite_owned_run(argv,*,env=None,payload=None,timeout=45,check=True):
        argv=[str(x) for x in argv];remaining=started+40-time.time();need(remaining>0,'alias_repair_40s_deadline')
        need(argv[0]=='docker','only_owned_docker_inspection_or_alias_repair')
        read=False;write=False
        if argv[1:3]==['container','inspect']:read=len(argv)==4 and argv[3] in expected.values()
        elif argv[1:3]==['network','inspect']:read=len(argv)==4 and argv[3]==cluster['network']['id']
        elif argv[1]=='exec' and len(argv)>=4:
            if argv[2] in expected.values():read=argv[3:] in (['cat','/etc/hosts'],['getent','hosts','control-plane.minikube.internal'])
            if argv[2]=='-i' and len(argv)==7 and argv[3] in expected.values() and argv[4:]==['/bin/sh','-c','cat >> /etc/hosts']:
                write=expected_ip is not None and payload=='\n'+expected_ip+'\tcontrol-plane.minikube.internal\n'
        need((read and payload is None) or write,'exact_owned_alias_command_payload_allowlist')
        result=original_run(argv,env=env,payload=payload,timeout=min(timeout,5,remaining),check=check)
        if write:proof['aliasWrites'].append({'containerID':argv[3],'alias':'control-plane.minikube.internal','IP':expected_ip})
        return result
    mod.run=finite_owned_run;lab.guard_cluster('a',api=False)
    prior=json.loads((ROOT/'artifacts/release-audit/ra-20261111/provider-profile-lock-http-worker/before.json').read_text())['snapshot'];identities=[]
    for item in cluster['containers']:
        actual=lab.check_container(cluster,item);mounts=sorted([{'type':m['Type'],'name':m.get('Name')} for m in actual['Mounts']],key=lambda x:json.dumps(x,sort_keys=True));old=prior['hosts'][item['name']]
        need(actual['State']['Running'] and actual['Id']==old['id'] and actual['Created']==old['created'] and actual['Config']['Labels']==old['labels'] and mounts==old['mounts'],'exact_original_metadata_mounts_guard')
        identities.append({'name':item['name'],'id':actual['Id'],'mountsEqualStoredReceipt':True})
        if item['name']==profile:expected_ip=actual['NetworkSettings']['Networks'][profile]['IPAddress']
    need(expected_ip=='172.29.232.2','known_owned_CP_IP');_,network,_=mod.run(['docker','network','inspect',cluster['network']['id']]);net=json.loads(network)[0];need(net['Labels'].get(mod.OWNER)==lab.state['labId'],'network_owner_label')
    profile_file=STATE/'minikube/.minikube/profiles'/profile/'config.json';need(sha(profile_file)=='4733b8f4870354b6bd0404dfe3d912dca704d1e5f392eb9fe3f397516db8da1c','profile_bytes_guard');proof['identity']=identities
    def aliases():
        rows=[]
        for item in cluster['containers']:
            rc,out,_=mod.run(['docker','exec',item['id'],'getent','hosts','control-plane.minikube.internal'],check=False);ip=out.split()[0] if out.split() else None;rows.append({'containerID':item['id'],'exitCode':rc,'resolvedIP':ip,'matchesOwnedCP':ip==expected_ip})
        return rows
    step='alias_before';proof['before']=aliases();step='one_existing_helper_repair';proof['helperCalls']=1;proof['changed']=lab.repair_owned_worker_hosts('a',include_control_plane=True,offline=True)
    step='alias_after';proof['after']=aliases();need(all(x['matchesOwnedCP'] for x in proof['after']),'alias_resolution_not_owned_CP');need(sha(profile_file)=='4733b8f4870354b6bd0404dfe3d912dca704d1e5f392eb9fe3f397516db8da1c','profile_bytes_after');proof.update(status='PASS',profileSHA256=sha(profile_file))
except BaseException as exc:
    proof['firstFailure']={'step':step,'errorClass':type(exc).__name__,'trace':[{'file':Path(f.filename).name,'line':f.lineno,'function':f.name} for f in traceback.extract_tb(exc.__traceback__)]}
    if isinstance(exc,OSError):proof['firstFailure'].update(errno=exc.errno,errnoSymbol=errno.errorcode.get(exc.errno))
    if type(exc).__name__ in ('LabError','RuntimeError','TimeoutError'):proof['firstFailure']['safeCategory']=str(exc)
finally:
    proof.update(completedAt=utc(),elapsedSeconds=time.time()-started,limitSeconds=40);(OUT/'alias-resume-result.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof),flush=True)
sys.exit(0 if proof['status']=='PASS' else 1)
