from pathlib import Path
import sys,os,json,hashlib,importlib.util,time,datetime,threading,subprocess
sys.dont_write_bytecode=True
R=Path.cwd();A=R/'artifacts/release-audit/ra-20261111/real-minikube-add-racefixed-worker';pre=json.loads((A/'preflight.json').read_text());H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();C=R/'.git/release-audit/provider-live-clearance-03.json';clear=json.loads(C.read_text());helper=R/'scripts/release-provider-lab.py';spec=importlib.util.spec_from_file_location('one_cleared_provider_job',helper);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
require=m.require;require(not C.is_symlink() and C.stat().st_uid==os.getuid() and C.stat().st_mode&0o077==0 and H(C)==pre['clearanceSHA256'],'clearance_file_identity');require(H(helper)==clear['helperSHA256'] and H(m.APP)==clear['appSHA256'] and H(m.MINIKUBE)==m.MINI_SHA,'cleared_binary_helper_hashes');require(m.SYSTEM=='e84bb50e-8d64-4bc2-905c-9b5ba193e53a' and m.NEW=='kvml-d32afbf634e8-a-m03' and clear['maximumTransactions']==1 and clear['sameKeyPOSTs']==2 and clear['maxNodes']==3 and clear['familyActualAttemptNumber']==3 and clear['noFourthAttemptInThisPlan'],'clearance_scope')
old_control=m.CONTROL;control=Path(clear['newPrivateControl']);require(control==m.STATE/'private/release-provider-one-worker-20261111-03' and not control.exists(),'fresh_case03_control_guard');require(m.RUN_CLEARED is False,'source_run_gate_guard');m.CONTROL=control;m.JOURNAL=control/'attempt.json';profile=m.STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json';require(H(profile)==clear['profileBeforeSHA256'],'original_restored_profile_guard')
private=R/'.git/release-audit/real-minikube-add-racefixed-worker';private.mkdir(mode=0o700,parents=True,exist_ok=False);fd=os.open(private/'profile-before-full.json',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'wb')as f:f.write(profile.read_bytes());f.flush();os.fsync(f.fileno())

def safe_profile():
 d=json.loads(profile.read_text());return {'Name':d['Name'],'Driver':d['Driver'],'Memory':d['Memory'],'CPUs':d['CPUs'],'Nodes':[{k:x.get(k)for k in ['Name','IP','Port','ControlPlane','Worker']}for x in d['Nodes']]}
def dump(name,value):(A/name).write_text(json.dumps(value,indent=2)+'\n')
before_profile=safe_profile();dump('profile-before.json',{'profile':before_profile,'SHA256':H(profile)});dump('identity.json',{'helperSHA256':H(helper),'appSHA256':H(m.APP),'CLIPath':str(m.MINIKUBE),'CLISHA256':H(m.MINIKUBE),'sourceCommit':clear['runtimeSource'],'rootCheckpoint':'4450b5aa','privateClearanceSHA256':H(C),'RUN_CLEAREDSourceConstant':False,'override':'memory only, one main(run) call','expected':m.NEW})
old_event=m.Transaction.event;last={'event':'wrapper_start','at':time.time(),'status':None};halt=threading.Event()
def instrument(self,name,proof=None):
 old_event(self,name,proof);last.update(event=name,at=time.time())
 if name=='operation_observation' and proof and (proof.get('status')!=last['status'] or proof.get('nodeUID')):
  print(json.dumps({'at':m.utc(),'event':'operation_state','proof':proof}),flush=True);last['status']=proof.get('status')
 if name in {'first_POST_accepted','same_key_second_POST_same_operation','new_host_and_Node_adopted','cleanup_exact_target_and_DaemonSet_Pods_verified','cleanup_restored_exact_originals','pending_partial_cleanup','only_exact_adopted_new_host_stopped','transaction_pass_after_verified_cleanup'}:
  print(json.dumps({'at':m.utc(),'event':name,'proof':proof}),flush=True)
m.Transaction.event=instrument
# Heartbeat never performs an extra request or mutation.
def heartbeat():
 while not halt.wait(20):print(json.dumps({'at':m.utc(),'event':'bounded_progress','latest':last['event'],'secondsSinceLatest':round(time.time()-last['at'],1)}),flush=True)
thread=threading.Thread(target=heartbeat,daemon=True);thread.start();code=2;failure=None
try:
 m.RUN_CLEARED=True;sys.argv=[str(helper),'run','--confirm-owned',m.LAB+':add-exact-m03'];code=m.main()
except Exception as exc:
 import traceback
 failure={'errorClass':type(exc).__name__,'safeCategory':str(exc)if isinstance(exc,m.Guard)else'details_omitted','frames':[{'file':frame.filename,'function':frame.name,'line':frame.lineno}for frame in traceback.extract_tb(exc.__traceback__)]}
 if isinstance(exc,KeyError):
  key=exc.args[0]if exc.args else None;failure['structuralKey']=key if isinstance(key,str)and __import__('re').fullmatch(r'[A-Za-z_][A-Za-z0-9_]{0,80}',key)else'OMITTED'
finally:
 halt.set();thread.join(timeout=1);m.RUN_CLEARED=False
 def redact(value):
  if isinstance(value,dict):return {k:('[REDACTED]'if k.lower()in{'nonce','token','headers','authorization','env','idempotencykey'}else redact(v))for k,v in value.items()if k.lower()!='keyhash'}
  if isinstance(value,list):return[redact(x)for x in value]
  return value
 journal=json.loads(m.JOURNAL.read_text())if m.JOURNAL.exists()else None
 if journal:
  dump('journal-redacted.json',redact(journal));fd=os.open(private/'attempt-full-private.json',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
  with os.fdopen(fd,'wb')as f:f.write(m.JOURNAL.read_bytes());f.flush();os.fsync(f.fileno())
 post={'status':'NOT_RUN_AFTER_FAILURE'}
 if code==0 and journal and journal.get('cleanupComplete'):
  try:
   tx=m.Transaction('check');tx.budget.limit=min(time.time()+30,datetime.datetime.fromisoformat(pre['deadlineAt']).timestamp()-60);tx.budget.start_watchdog()
   with tx.lab.lock():
    nodes=tx.guard();require({x['metadata']['name']:x['metadata']['uid']for x in nodes}==m.ORIGINAL and all(any(c['type']=='Ready'and c['status']=='True'for c in x['status']['conditions'])for x in nodes),'post_original2Ready_guard')
    until=min(time.time()+20,tx.budget.deadline())
    while True:
     pods=json.loads(tx.lab.kubectl('a',['get','pods','--all-namespaces','--field-selector','spec.nodeName='+m.NEW,'-o','json'],timeout=2)[1])['items']
     if not pods:break
     require(time.time()<until,'new_Node_Pod_GC_deadline');time.sleep(.5)
    require(H(profile)==clear['profileBeforeSHA256'],'post_exact_profile_SHA_guard');require(tx.snapshot()==journal['baseline'],'post_original_fixture_Cilium_guard');post={'status':'PASS','newNodeAssignedPodCount':0,'original2UIDs':m.ORIGINAL,'bothReady':True,'profileSHA256':H(profile),'baselineEqual':True}
  except Exception as exc:post={'status':'FAIL','errorClass':type(exc).__name__,'safeCategory':str(exc)if isinstance(exc,m.Guard)else'details_omitted'}
  finally:tx.budget.close()
 dump('post-cleanup-guarded-reads.json',post)
 after_profile=safe_profile();dump('profile-after.json',{'profile':after_profile,'SHA256':H(profile)});end=time.time();total=end-datetime.datetime.fromisoformat(pre['startedAt']).timestamp();result={'status':'PASS'if code==0 and journal and journal.get('result')=='PASS'and journal.get('cleanupComplete')and before_profile==after_profile and post['status']=='PASS' and H(profile)==clear['profileBeforeSHA256'] and total<=720 else'FAIL','mainExitCode':code,'failure':failure,'journalResult':journal.get('result')if journal else None,'readyVerified':bool(journal and journal.get('readyVerified')),'cleanupComplete':bool(journal and journal.get('cleanupComplete')),'pendingCleanup':bool(journal and journal.get('pendingCleanup')),'profileOriginalNodesAndSettingsEqual':before_profile==after_profile,'profileFullSHAEqual':H(profile)==clear['profileBeforeSHA256'],'postCleanupGuardedReads':post['status'],'helperUnchanged':H(helper)==clear['helperSHA256'],'RUN_CLEAREDSourceStillFalse':'RUN_CLEARED = False'in helper.read_text(),'RUN_CLEAREDMemoryResetFalse':not m.RUN_CLEARED,'totalElapsedSeconds':total,'within720s':total<=720,'completedAt':m.utc()};dump('result.json',result);print(json.dumps(result),flush=True)
sys.exit(0 if result['status']=='PASS' else 1)
