from pathlib import Path
import sys,os,json,time,datetime,hashlib,importlib.util,fcntl,subprocess,tempfile,shutil
sys.dont_write_bytecode=True
R=Path.cwd();A=R/'artifacts/release-audit/ra-20261111/real-minikube-add-fixed-worker/cleanup-case02';P=R/'.git/release-audit/real-minikube-add-fixed-worker';S=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01';pre=json.loads((A/'preflight.json').read_text());end=datetime.datetime.fromisoformat(pre['operationalDeadlineAt']).timestamp();NEW='kvml-d32afbf634e8-a-m03';PROFILE='kvml-d32afbf634e8-a';ID=pre['exactContainerID'];NETWORK='92dbd77db18d9e5e1ae1ccb0a76fd08a2f336908e1a8fa8469d23cefd50ed002';LABEL='name.minikube.sigs.k8s.io';H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();D=lambda v:hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':')).encode()).hexdigest();j=json.loads((P/'attempt-original-immutable.json').read_text());B=j['baseline'];original=(P/'profile-before-full.json').read_bytes();expected='c8266879d0e6ae53f2b6d9d255e2a8bfedf550a918f4d0988f2e447a1e7cc1a5';require=lambda ok,reason:None if ok else (_ for _ in ()).throw(RuntimeError(reason))
def cmd(argv,timeout=3,check=True):
 left=end-time.time();require(left>0,'cleanup_deadline');p=subprocess.run([str(x)for x in argv],capture_output=True,timeout=max(.1,min(timeout,left)));require(not check or p.returncode==0,'fixed_command_failed_'+str(argv[1]));return p
spec=importlib.util.spec_from_file_location('fixed_cleanup_manual',R/'scripts/manual_lab.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def guarded_run(argv,env=None,payload=None,timeout=45,check=True):
 require(payload is None,'no_API_payload_mutation');left=end-time.time();require(left>0,'cleanup_deadline');p=subprocess.run([str(x)for x in argv],capture_output=True,env=env,timeout=max(.1,min(4,timeout,left)));require(not check or p.returncode==0,'owned_guard_command_failed');return p.returncode,p.stdout.decode(),p.stderr.decode()
m.run=guarded_run;args=m.parser().parse_args(['status','--state-dir',str(S),'--minikube-binary',str(R/'.git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4')]);lab=m.Lab(args);profile=S/'minikube/.minikube/profiles'/PROFILE/'config.json';control=S/'private/release-provider-one-worker-20261111-02';res={'status':'FAIL','operationRemainsFAIL':True,'containerStopped':False,'containerRemoved':False,'volumeRemoved':False,'profileRestored':False}
def docker(*args):return json.loads(cmd(['/usr/local/bin/docker',*args]).stdout)
def targets():return {k:cmd(['/usr/local/bin/docker',*a,'--filter','label='+LABEL+'='+NEW]).stdout.decode().split()for k,a in [('containers',['container','ls','-aq','--no-trunc']),('volumes',['volume','ls','-q']),('networks',['network','ls','-q'])]}
def no_node_pods():
 require(lab.get('a','node',NEW)is None,'new_Node_appeared_STOP');pods=json.loads(lab.kubectl('a',['get','pods','--all-namespaces','--field-selector','spec.nodeName='+NEW,'-o','json'],timeout=3)[1])['items'];require(not pods,'new_Node_Pods_appeared_STOP')
def snapshot():
 lab.guard_cluster('a');lab.ns_guard('06-limanlar-arasi-ag','a','kvml-fbf634e8-06-client');nodes=lab.get('a','nodes')['items'];require({x['metadata']['name']:x['metadata']['uid']for x in nodes}==lab.state['clusters']['a']['nodeUids']and all(any(c['type']=='Ready'and c['status']=='True'for c in x['status']['conditions'])for x in nodes),'original2Ready_UID_guard');hosts={};vols={}
 for name in B['hosts']:
  x=docker('container','inspect',name)[0];net=x['NetworkSettings']['Networks'][PROFILE];mounts=sorted([{'type':v['Type'],'name':v.get('Name')}for v in x['Mounts']],key=lambda v:json.dumps(v,sort_keys=True));hosts[name]={'name':x['Name'].lstrip('/'),'id':x['Id'],'created':x['Created'],'labels':x['Config']['Labels'],'networkID':net['NetworkID'],'IP':net['IPAddress'],'mounts':mounts}
 for name in B['volumes']:
  v=docker('volume','inspect',name)[0];vols[name]={k:v.get(k)for k in ['Name','CreatedAt','Driver','Labels']}
 net=docker('network','inspect',NETWORK)[0];ds=json.loads(lab.kubectl('a',['get','daemonsets','--all-namespaces','-o','json'],timeout=3)[1])['items'];known={};cilium={}
 for x in ds:
  key=x['metadata']['namespace']+'/'+x['metadata']['name']
  if key in B['knownDaemonSets']:known[key]=x['metadata']['uid'];cilium[key]={'uid':x['metadata']['uid'],'specSHA256':D(x['spec'])}
 fixtures={}
 for key in B['fixtures']:
  ns,name=key.split('/');x=lab.get('a','deployment',name,ns);pods=lab.get('a','pods',ns=ns)['items'];fixtures[key]={'uid':x['metadata']['uid'],'specSHA256':D(x['spec']),'podUIDs':sorted(p['metadata']['uid']for p in pods)}
 return {'hosts':hosts,'network':{'id':net['Id'],'created':net['Created'],'labels':net['Labels']},'volumes':vols,'knownDaemonSets':known,'Cilium':cilium,'fixtures':fixtures,'labFileSHA256':H(lab.file)}
try:
 with lab.lock(),(control/'provider-journal'/('minikube-'+PROFILE+'.lock')).open('a+')as lock:
  fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB);require(hashlib.sha256(original).hexdigest()==expected,'private_original_full_SHA');require(snapshot()==B,'original_baseline_changed');no_node_pods();x=docker('container','inspect',ID)[0];net=x['NetworkSettings']['Networks'][PROFILE];require(x['Id']==ID and x['Name']=='/'+NEW and x['Created']=='2026-11-11T19:14:13.970380554Z'and net['NetworkID']==NETWORK and net['IPAddress']=='172.29.232.4'and x['Config']['Labels'].get(LABEL)==NEW and x['Config']['Labels'].get('created_by.minikube.sigs.k8s.io')=='true','exact_new_container_guard');require([v['Name']for v in x['Mounts']if v['Type']=='volume']==[NEW],'exact_new_mount_guard');current=profile.read_bytes();currentSHA=H(profile);require(currentSHA=='da28c0b820f7d4c870bce1ad32c6849cf26f2e3f61b5ebc8b2b9e7f1f79f1dea','current_profile_expected_SHA');parsed=json.loads(current);pending=[i for i,n in enumerate(parsed['Nodes'])if n.get('Name')=='m03'];require(len(pending)==1,'sole_pending_profile_entry');n=parsed['Nodes'][pending[0]];require(not n.get('ControlPlane')and n.get('IP')==''and n.get('Port')==0,'pending_nonCP_guard');without=dict(parsed);without['Nodes']=parsed['Nodes'][:pending[0]]+parsed['Nodes'][pending[0]+1:];require(without==json.loads(original),'full_profile_minus_m03_not_original');require(targets()=={'containers':[ID],'volumes':[NEW],'networks':[]},'exclusive_new_label_targets');mode=profile.stat().st_mode&0o777;require(mode==0o600 and not profile.is_symlink(),'profile_mode_guard')
  # Copy only this owned machine directory privately; never remove its files.
  machine=S/'minikube/.minikube/machines'/NEW;forensic={'existsBefore':machine.exists(),'files':[]}
  if machine.exists():
   require(not machine.is_symlink(),'machine_dir_symlink');dest=P/'machine-forensic-before';dest.mkdir(mode=0o700);total=0
   for f in machine.iterdir():
    st=f.lstat();item={'name':f.name,'bytes':st.st_size,'mtimeNs':st.st_mtime_ns,'birthTime':getattr(st,'st_birthtime',None),'isSymlink':f.is_symlink()};forensic['files'].append(item)
    if f.is_file()and not f.is_symlink():
     total+=st.st_size;require(total<=2*1024*1024 and len(forensic['files'])<=32,'forensic_size_bound');out=dest/f.name;fd=os.open(out,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
     with os.fdopen(fd,'wb')as o:o.write(f.read_bytes())
   cfg=machine/'config.json'
   if cfg.is_file()and not cfg.is_symlink():
    data=json.loads(cfg.read_text());driver=data.get('Driver',{});forensic['safeIdentity']={'name':data.get('Name'),'driverName':data.get('DriverName'),'driverDockerID':driver.get('ContainerId',driver.get('ContainerID',driver.get('MachineId')))}
  (A/'machine-forensic.json').write_text(json.dumps(forensic,indent=2)+'\n');(A/'pre-mutation-guards.json').write_text(json.dumps({'guardsPassed':True,'currentProfileSHA256':currentSHA,'originalProfileSHA256':expected,'onlyPendingEntry':n,'exactContainerID':ID,'NodeAbsentPods0':True,'targets':targets()},indent=2)+'\n')
  cmd(['/usr/local/bin/docker','container','stop','--time','5',ID],10);res['containerStopped']=True;no_node_pods();x=docker('container','inspect',ID)[0];require(x['Id']==ID and not x['State']['Running'],'stopped_exact_container_guard');cmd(['/usr/local/bin/docker','container','rm',ID],5);res['containerRemoved']=True
  volume=docker('volume','inspect',NEW)[0];require(volume['Name']==NEW and volume['Driver']=='local'and volume['CreatedAt']=='2026-11-11T19:14:12Z'and volume['Labels'].get(LABEL)==NEW and volume['Labels'].get('created_by.minikube.sigs.k8s.io')=='true','exact_volume_birth_labels');require(not cmd(['/usr/local/bin/docker','container','ls','-aq','--filter','volume='+NEW]).stdout.split(),'volume_in_use');require(targets()=={'containers':[],'volumes':[NEW],'networks':[]},'post_container_exclusive_volume');cmd(['/usr/local/bin/docker','volume','rm',NEW],5);res['volumeRemoved']=True;require(H(profile)==currentSHA,'profile_CAS_before_restore');fd,tmp=tempfile.mkstemp(prefix='.case02-exact-rollback-',dir=profile.parent);os.fchmod(fd,mode)
  try:
   with os.fdopen(fd,'wb')as f:f.write(original);f.flush();os.fsync(f.fileno())
   require(H(profile)==currentSHA,'profile_CAS_immediate');os.replace(tmp,profile);directory=os.open(profile.parent,os.O_RDONLY)
   try:os.fsync(directory)
   finally:os.close(directory)
  finally:
   if os.path.exists(tmp):os.unlink(tmp)
  res['profileRestored']=True;require(H(profile)==expected and all(not v for v in targets().values()),'postcleanup_profile_or_labels');no_node_pods();require(snapshot()==B,'postcleanup_original_baseline');res.update({'status':'EXACT_CLEANUP_PASS_OPERATION_FAIL','profileSHA256':H(profile),'originalBaselineEqual':True,'newNodeAbsentPods0':True,'newLabelTargetsEmpty':True,'residualMachineDirectory':machine.exists(),'machineDirectoryNotDeleted':True})
except Exception as exc:res['failure']={'errorClass':type(exc).__name__,'safeCategory':str(exc)if isinstance(exc,RuntimeError)else'details_omitted'}
finally:res['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();res['operationalElapsedSeconds']=time.time()-datetime.datetime.fromisoformat(pre['startedAt']).timestamp();res['within120s']=time.time()<end;(A/'result.json').write_text(json.dumps(res,indent=2)+'\n');print(json.dumps(res))
sys.exit(0 if res['status']=='EXACT_CLEANUP_PASS_OPERATION_FAIL'else 1)
