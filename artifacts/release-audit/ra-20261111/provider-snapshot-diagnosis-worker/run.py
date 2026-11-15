from pathlib import Path
import sys,importlib.util,json,time,datetime,hashlib,copy
sys.dont_write_bytecode=True
r=Path.cwd();a=r/'artifacts/release-audit/ra-20261111/provider-snapshot-diagnosis-worker';start=time.time();h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();helper=r/'scripts/release-provider-lab.py';expected='723af5a6c875588cde14e418e46ba0e681c293f3eaf92029354d56d9c27d677b';pre={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'workBudgetSeconds':120,'totalBudgetSeconds':240,'helperSHA256':h(helper),'expectedHelperSHA256':expected,'readOnly':True,'noAppHTTPManagerMutation':True};(a/'preflight.json').write_text(json.dumps(pre,indent=2)+'\n');assert h(helper)==expected
spec=importlib.util.spec_from_file_location('snapshot_readonly',helper);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);assert not m.RUN_CLEARED and not m.CONTROL.exists();tx=m.Transaction('check');tx.budget.limit=min(tx.budget.limit,start+115);tx.budget.start_watchdog();result={'status':'FAIL','realCONTROLAbsentBefore':True,'RUN_CLEARED':False};profile=m.STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json'
def save(n,x):(a/n).write_text(json.dumps(x,indent=2)+'\n')
def pointer(p,k):return p+'/'+str(k).replace('~','~0').replace('/','~1')
def diff(left,right,p=''):
 if type(left)!=type(right):return [{'path':p or '/','old':left,'new':right,'kind':'type_or_value'}]
 if isinstance(left,dict):
  out=[]
  for key in sorted(set(left)|set(right)):
   if key not in left:out.append({'path':pointer(p,key),'oldMissing':True,'new':right[key]})
   elif key not in right:out.append({'path':pointer(p,key),'old':left[key],'newMissing':True})
   else:out.extend(diff(left[key],right[key],pointer(p,key)))
  return out
 if isinstance(left,list):
  out=[]
  for i in range(max(len(left),len(right))):
   if i>=len(left):out.append({'path':pointer(p,i),'oldMissing':True,'new':right[i]})
   elif i>=len(right):out.append({'path':pointer(p,i),'old':left[i],'newMissing':True})
   else:out.extend(diff(left[i],right[i],pointer(p,i)))
  return out
 return [] if left==right else [{'path':p or '/','old':left,'new':right,'kind':'value'}]
def snapshot(n):
 value={'takenAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'snapshot':tx.snapshot(),'profileSHA256':h(profile)};save(n,value);return value
try:
 with tx.lab.lock():
  nodes=tx.guard();identity={'nodeCount':len(nodes),'actualNodeUIDs':{x['metadata']['name']:x['metadata']['uid']for x in nodes},'allReady':all(any(c['type']=='Ready'and c['status']=='True'for c in x['status']['conditions'])for x in nodes),'realCONTROLAbsent':not m.CONTROL.exists()};assert identity['nodeCount']==2 and identity['actualNodeUIDs']==m.ORIGINAL and identity['realCONTROLAbsent'];save('actual-identity.json',identity)
  before=snapshot('before.json');time.sleep(.15);after=snapshot('after.json');changes=diff(before['snapshot'],after['snapshot']);profile_changed=before['profileSHA256']!=after['profileSHA256'];save('exact-diff.json',{'snapshotDifferences':changes,'profileHashChanged':profile_changed,'beforeProfileSHA256':before['profileSHA256'],'afterProfileSHA256':after['profileSHA256'],'rawListOrderPreserved':True});third=None
  if changes or profile_changed:
   time.sleep(.15);third=snapshot('additional.json');save('additional-exact-diff.json',{'beforeToAdditional':diff(before['snapshot'],third['snapshot']),'afterToAdditional':diff(after['snapshot'],third['snapshot']),'profileSHA256':third['profileSHA256']})
  # Diagnostic copy only: preserve original lists and never use normalization
  # as an acceptance gate. Only the Mounts field is compared as an unordered bag.
  normalized_before=copy.deepcopy(before['snapshot']);normalized_after=copy.deepcopy(after['snapshot']);mounts=[]
  for name in sorted(normalized_before['hosts']):
   l=before['snapshot']['hosts'][name]['mounts'];rr=after['snapshot']['hosts'][name]['mounts'];bag=lambda v:sorted(json.dumps(x,sort_keys=True)for x in v)
   mounts.append({'host':name,'rawListEqual':l==rr,'sameMountObjectsIgnoringOrder':bag(l)==bag(rr)})
   normalized_before['hosts'][name]['mounts']=sorted(l,key=lambda x:json.dumps(x,sort_keys=True));normalized_after['hosts'][name]['mounts']=sorted(rr,key=lambda x:json.dumps(x,sort_keys=True))
  normalized_changes=diff(normalized_before,normalized_after);save('mount-order-diagnostic.json',{'diagnosticCopyOnly':True,'notAnAcceptanceNormalization':True,'mountComparisons':mounts,'remainingDifferencesAfterMountOrderOnlySort':normalized_changes,'currentPairOnlyConclusion':'mount_order_only' if changes and not normalized_changes and not profile_changed else 'no_pair_difference' if not changes and not profile_changed else 'other_or_profile_difference'})
  result.update({'status':'READ_ONLY_DIAGNOSIS_COMPLETE','identity':identity,'firstPairSnapshotDifferenceCount':len(changes),'profileHashChanged':profile_changed,'differencePaths':[x['path']for x in changes],'additionalSnapshotTaken':third is not None,'mountOrderOnlyForCurrentPair':bool(changes)and not normalized_changes and not profile_changed,'pastFailedPreflightCause':'UNPROVEN; its before/after snapshots were not retained','originalsNotMutated':True})
except Exception as exc:result['failure']={'errorClass':type(exc).__name__,'safeCategory':str(exc)if isinstance(exc,m.Guard)else'details_omitted'}
finally:
 tx.budget.close();result.update({'realCONTROLStillAbsent':not m.CONTROL.exists(),'helperUnchanged':h(helper)==expected,'workElapsedSeconds':round(time.time()-start,6),'workWithin120s':time.time()-start<=120,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()});save('result.json',result);print(json.dumps(result))
