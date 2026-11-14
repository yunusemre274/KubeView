from pathlib import Path
import datetime,fcntl,hashlib,importlib.util,json,os,stat,time
root=Path.cwd();out=root/'artifacts/release-audit/ra-20261111/provider-machine-quarantine';out.mkdir(exist_ok=False)
spec=importlib.util.spec_from_file_location('h',root/'scripts/release-provider-lab.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
tx=m.Transaction('check');tx.budget.limit=time.time()+40;tx.budget.start_watchdog()
control=m.STATE/'private/release-provider-one-worker-20261111-02'
source=m.STATE/'minikube/.minikube/machines'/m.NEW;target=control/'quarantined-machine-m03'
profile=m.STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
r={'startedAt':m.utc(),'status':'FAIL','action':'Atomic quarantine of proven failed audit machine directory; no deletion','moved':False}
try:
    with tx.lab.lock(),(control/'provider-journal'/('minikube-'+m.PROFILE+'.lock')).open('a+') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        tx.guard();before=tx.snapshot();m.require(tx.host(m.NEW) is None and tx.lab.get('a','node',m.NEW) is None and all(not v for v in tx.label_targets().values()),'new_live_resource_remains')
        m.require(sha(profile)=='c8266879d0e6ae53f2b6d9d255e2a8bfedf550a918f4d0988f2e447a1e7cc1a5','original_profile_not_restored')
        m.require(source.is_dir() and not source.is_symlink() and source.parent.resolve()==(m.STATE/'minikube/.minikube/machines').resolve() and not target.exists(),'machine_path_guard')
        started=m.epoch(json.loads((control/'attempt.json').read_text())['operationStartedAt'])
        files=sorted(source.iterdir());m.require({p.name for p in files}=={'config.json','id_rsa','id_rsa.pub'},'unexpected_machine_file')
        metadata=[]
        for p in files:
            st=p.lstat();m.require(stat.S_ISREG(st.st_mode) and st.st_uid==os.getuid() and st.st_birthtime>=started-1,'file_birth_owner_or_type_guard')
            metadata.append({'name':p.name,'bytes':st.st_size,'birthTime':st.st_birthtime,'mode':oct(stat.S_IMODE(st.st_mode))})
        cfg=json.loads((source/'config.json').read_text());m.require(cfg.get('Name')==m.NEW and cfg.get('DriverName')=='docker','machine_config_identity')
        r['proof']={'files':metadata,'name':cfg['Name'],'driver':cfg['DriverName'],'configSHA256':sha(source/'config.json'),'newLiveResourcesAbsent':True,'profileBeforeSHA256':sha(profile),'sourceRelative':'minikube/.minikube/machines/'+m.NEW,'targetRelative':'private/release-provider-one-worker-20261111-02/quarantined-machine-m03'}
        (out/'before-move.json').write_text(json.dumps(r,indent=2)+'\n')
        os.rename(source,target);r['moved']=True;os.chmod(target,0o700)
        m.require(not source.exists() and target.is_dir() and sha(target/'config.json')==r['proof']['configSHA256'],'archive_not_preserved')
        m.require(tx.snapshot()==before and sha(profile)==r['proof']['profileBeforeSHA256'],'original_resources_changed')
        m.require(not tx.budget.events,'watchdog_event');r['status']='PASS';r['originalSnapshotUnchanged']=True;r['keyContentsNeverEmitted']=True
finally:
    tx.budget.close();r['finishedAt']=m.utc();(out/'result.json').write_text(json.dumps(r,indent=2)+'\n');(out/'tested-helper.py').write_bytes(Path(__file__).read_bytes())
print(json.dumps(r))
