from pathlib import Path
import sys,os,json,hashlib,importlib.util,time,datetime,threading,subprocess
sys.dont_write_bytecode=True
R=Path.cwd();A=R/'artifacts/release-audit/ra-20261111/real-minikube-add-current-worker';pre=json.loads((A/'preflight.json').read_text());H=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();C=R/'.git/release-audit/provider-live-clearance-01.json';clear=json.loads(C.read_text());helper=R/'scripts/release-provider-lab.py';spec=importlib.util.spec_from_file_location('one_cleared_provider_job',helper);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
require=m.require;require(not C.is_symlink() and C.stat().st_uid==os.getuid() and H(C)==pre['clearanceSHA256'],'clearance_file_identity');require(H(helper)==clear['helperSHA256'] and H(m.APP)==clear['appSHA256'] and H(m.MINIKUBE)==m.MINI_SHA,'cleared_binary_helper_hashes');require(clear['systemUID']==m.SYSTEM and clear['expectedNewMachine']==m.NEW and clear['maximumTransactions']==1 and clear['sameKeyPOSTs']==2 and clear['maxNodes']==3 and clear['privateWrapperOverrideForThisSingleJobOnly'] and clear['sourceRUN_CLEAREDRemainsFalse'],'clearance_scope');require(m.RUN_CLEARED is False and not m.CONTROL.exists(),'source_gate_or_existing_transaction');profile=m.STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json'
def safe_profile():
 d=json.loads(profile.read_text());return {'Name':d['Name'],'Driver':d['Driver'],'Memory':d['Memory'],'CPUs':d['CPUs'],'Nodes':[{k:x.get(k)for k in ['Name','IP','Port','ControlPlane','Worker']}for x in d['Nodes']]}
def dump(name,value):(A/name).write_text(json.dumps(value,indent=2)+'\n')
before_profile=safe_profile();dump('profile-before.json',{'profile':before_profile,'SHA256':H(profile)});dump('identity.json',{'helperSHA256':H(helper),'appSHA256':H(m.APP),'CLIPath':str(m.MINIKUBE),'CLISHA256':H(m.MINIKUBE),'sourceCommit':clear['sourceCommit'],'rootCheckpoint':clear['rootCheckpoint'],'privateClearanceSHA256':H(C),'RUN_CLEAREDSourceConstant':False,'override':'memory only, one main(run) call','expected':m.NEW})
old_event=m.Transaction.event;last={'event':'wrapper_start','at':time.time()};halt=threading.Event()
def instrument(self,name,proof=None):
 old_event(self,name,proof);last.update(event=name,at=time.time())
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
 failure={'errorClass':type(exc).__name__,'safeCategory':str(exc)if isinstance(exc,m.Guard)else'details_omitted'}
finally:
 halt.set();thread.join(timeout=1);m.RUN_CLEARED=False
 def redact(value):
  if isinstance(value,dict):return {k:('[REDACTED]'if k.lower()in{'nonce','token','headers','authorization','env','idempotencykey'}else redact(v))for k,v in value.items()}
  if isinstance(value,list):return[redact(x)for x in value]
  return value
 journal=json.loads(m.JOURNAL.read_text())if m.JOURNAL.exists()else None
 if journal:dump('journal-redacted.json',redact(journal))
 after_profile=safe_profile();dump('profile-after.json',{'profile':after_profile,'SHA256':H(profile)});end=time.time();total=end-datetime.datetime.fromisoformat(pre['startedAt']).timestamp();result={'status':'PASS'if code==0 and journal and journal.get('result')=='PASS'and journal.get('cleanupComplete')and before_profile==after_profile and total<=720 else'FAIL','mainExitCode':code,'failure':failure,'journalResult':journal.get('result')if journal else None,'readyVerified':bool(journal and journal.get('readyVerified')),'cleanupComplete':bool(journal and journal.get('cleanupComplete')),'pendingCleanup':bool(journal and journal.get('pendingCleanup')),'profileOriginalNodesAndSettingsEqual':before_profile==after_profile,'helperUnchanged':H(helper)==clear['helperSHA256'],'RUN_CLEAREDSourceStillFalse':'RUN_CLEARED = False'in helper.read_text(),'RUN_CLEAREDMemoryResetFalse':not m.RUN_CLEARED,'totalElapsedSeconds':total,'within720s':total<=720,'completedAt':m.utc()};dump('result.json',result);print(json.dumps(result),flush=True)
sys.exit(0 if code==0 and failure is None else 1)
