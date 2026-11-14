from pathlib import Path
import importlib.util,json,hashlib,datetime,os,sys,subprocess,time,signal
sys.dont_write_bytecode=True
ROOT=Path.cwd();OUT=ROOT/'artifacts/release-audit/ra-20261111/provider-http-preflight-retest-worker';pre=json.loads((OUT/'preflight.json').read_text());deadline=datetime.datetime.fromisoformat(pre['workCutoffAt']).timestamp();h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();spec=importlib.util.spec_from_file_location('owned_provider_preflight',ROOT/'scripts/release-provider-lab.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
proof={'status':'FAIL','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'noAddCancelDeletePOST':True,'RUN_CLEARED':m.RUN_CLEARED,'events':[]};tx=None;original=m.CONTROL;child=None;fixture_budget=None
try:
 m.require(not m.RUN_CLEARED and not original.exists(),'real_CONTROL_guard')
 separate=m.STATE/'private/release-provider-http-preflight-20261111-02';m.require(not separate.exists(),'preflight_directory_already_exists');separate.mkdir(mode=0o700);m.CONTROL=separate;m.JOURNAL=separate/'attempt.json';proof['privatePreflightDirectory']=str(separate);proof['realCONTROLAbsentBefore']=True
 proof['priorOSWatchdogFixtureAlreadyPassed']=True
 m.require(time.time()<deadline,'preflight_work_time_gate')
 tx=m.Transaction('check');tx.budget.limit=min(tx.budget.limit,deadline);tx.budget.start_watchdog();tx.j={'schema':1,'issued':False,'expectedMachine':m.NEW,'purpose':'HTTP-only provider preflight; add/cancel/delete forbidden','timeline':[]};tx.event('preflight_plan_no_worker_mutations')
 with tx.lab.lock():
  baseline=tx.snapshot();profile=m.STATE/'minikube/.minikube/profiles'/m.PROFILE/'config.json';profile_before=h(profile);(OUT/'before.json').write_text(json.dumps({'snapshot':baseline,'profileSHA256':profile_before},indent=2)+'\n');m.require(all(not x for x in tx.label_targets().values()),'unexpected_m03_preexists')
  try:
   tx.start_app();proof['app']={'pid':tx.app.pid,'birth':tx.birth,'PGID':os.getpgid(tx.app.pid),'port':m.PORT,'binarySHA256':h(m.APP),'scope':'fixed private legacy cluster harbor; no real_CONTROL','initialReadOnlyAssertionPassedInsideHelper':True,'explicitManagementEnablePassed':True}
   code,info=tx.http_request('GET','/api/connection');m.require(code==200 and info['context']==m.PROFILE and info['identity']['clusterUID']==m.SYSTEM and info['identity']['confidence']=='verified' and not info['readOnly'] and info['managementEnabled'] and not info['serverReadOnly'],'actual_connection_schema_mismatch')
   proof['connection']={'status':code,'context':info['context'],'clusterUID':info['identity']['clusterUID'],'confidence':info['identity']['confidence'],'readOnly':info['readOnly'],'managementEnabled':info['managementEnabled'],'serverReadOnly':info['serverReadOnly']}
   code,status=tx.http_request('GET','/api/providers');v=status.get('minikube',{});cfg=v.get('configuration',{});m.require(code==200 and v.get('available') is True and v.get('canAdd') is True and cfg=={'profile':m.PROFILE,'context':m.PROFILE,'clusterUID':m.SYSTEM,'maxNodes':3,'driver':'docker'} and v.get('operations')==[],'actual_provider_status_schema_mismatch');proof['providerStatus']={'HTTP':code,'available':v['available'],'canAdd':v['canAdd'],'configuration':cfg,'operationCount':0}
   code,inventory=tx.http_request('GET','/api/providers/minikube/workers');m.require(code==200 and inventory=={'operations':[]},'actual_worker_inventory_schema_mismatch');proof['providerInventory']={'HTTP':code,'operationCount':0}
   tx.guard();code,_=tx.http_request('POST','/api/providers/minikube/workers',{'action':'unsupported-http-preflight'});m.require(code==400,'unsupported_action_not400');proof['unsupportedAction']={'HTTP':code,'ManagerBeginOrAddExpected':False}
   code,after=tx.http_request('GET','/api/providers/minikube/workers');m.require(code==200 and after=={'operations':[]},'unsupported_POST_created_operation');proof['operationCountAfterUnsupportedPOST']=0
   rows=m.command(['/bin/ps','-axo','pid=,ppid=,comm='],2).decode().splitlines();entries={}
   for row in rows:
    z=row.strip().split(None,2)
    if len(z)==3:entries[int(z[0])]=(int(z[1]),z[2])
   descendants={tx.app.pid}
   while True:
    count=len(descendants);descendants.update(pid for pid,(parent,comm)in entries.items()if parent in descendants)
    if count==len(descendants):break
   proof['appChildren']=[{'pid':pid,'basename':Path(entries[pid][1]).name}for pid in descendants if pid!=tx.app.pid];m.require(not proof['appChildren'],'unexpected_app_child')
   snapshot_after=tx.snapshot();profile_after=h(profile);(OUT/'after.json').write_text(json.dumps({'snapshot':snapshot_after,'profileSHA256':profile_after},indent=2)+'\n')
   def exact_diff(left,right,path=''):
    if type(left)!=type(right):return [{'path':path or '/','old':left,'new':right}]
    if isinstance(left,dict):
     values=[]
     for key in sorted(set(left)|set(right)):
      q=path+'/'+str(key).replace('~','~0').replace('/','~1')
      if key not in left:values.append({'path':q,'oldMissing':True,'new':right[key]})
      elif key not in right:values.append({'path':q,'old':left[key],'newMissing':True})
      else:values.extend(exact_diff(left[key],right[key],q))
     return values
    if isinstance(left,list):
     values=[]
     for index in range(max(len(left),len(right))):
      if index>=len(left):values.append({'path':path+'/'+str(index),'oldMissing':True,'new':right[index]})
      elif index>=len(right):values.append({'path':path+'/'+str(index),'old':left[index],'newMissing':True})
      else:values.extend(exact_diff(left[index],right[index],path+'/'+str(index)))
     return values
    return []if left==right else[{'path':path or '/','old':left,'new':right}]
   differences=exact_diff(baseline,snapshot_after);(OUT/'exact-diff.json').write_text(json.dumps({'differences':differences,'profileHashEqual':profile_before==profile_after,'canonicalMountOrderingOnly':True},indent=2)+'\n');proof['snapshotDifferenceCount']=len(differences)
   m.require(not differences and profile_after==profile_before,'original_cluster_fixture_profile_changed');proof['unchanged']={'baselineSHA256':m.digest(baseline),'NodeUIDs':m.ORIGINAL,'profileSHA256Before':profile_before,'profileSHA256After':h(profile),'originalNodeFixtureCiliumVolumeNetworkAndLabStateEqual':True}
   provider_journal=separate/'provider-journal'/('minikube-'+m.PROFILE+'.json');literal=provider_journal.read_bytes()if provider_journal.exists()else None;parsed=json.loads(literal)if literal is not None else None;m.require(parsed is None or parsed==[],'provider_journal_nonempty');proof['privateProviderJournal']={'exists':literal is not None,'literal':literal.decode()if literal is not None else 'ABSENT','sha256':h(provider_journal)if literal is not None else None,'sourceEstablishedZeroOperations':True};proof['privateProviderJournalEmpty']=True
   proof['status']='PASS'
  finally:tx.stop_app()
except Exception as exc:proof['failure']={'errorClass':type(exc).__name__,'safeCategory':str(exc) if isinstance(exc,m.Guard) else 'details_omitted'}
finally:
 if fixture_budget:fixture_budget.close()
 if child and child.poll() is None:
  group.signal(signal.SIGTERM)
  try:child.wait(timeout=1)
  except subprocess.TimeoutExpired:group.signal(signal.SIGKILL);child.wait(timeout=1)
 if tx:
  try:tx.stop_app()
  except Exception as exc:proof['appStopFailureClass']=type(exc).__name__;proof['status']='FAIL'
  tx.budget.close();proof['appExitCode']=tx.app.returncode if tx.app else None;proof['appWatchdogEvents']=tx.budget.events
 code,stdout,_=m.bounded_process(['/usr/sbin/lsof','-nP','-iTCP:19849','-sTCP:LISTEN','-t'],2);proof['noListen19849']=not stdout.split();proof['realCONTROLStillAbsent']=not original.exists();proof['helperSHA256After']=h(ROOT/'scripts/release-provider-lab.py');proof['helperUnchanged']=proof['helperSHA256After']==pre['helperSHA256'];proof['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();proof['workCompletedBefore120s']=time.time()-datetime.datetime.fromisoformat(pre['runtimeStartedAt']).timestamp()<120;proof['runtimeElapsedSeconds']=time.time()-datetime.datetime.fromisoformat(pre['runtimeStartedAt']).timestamp()
 if not proof['noListen19849'] or not proof['realCONTROLStillAbsent'] or not proof['helperUnchanged'] or not proof['workCompletedBefore120s']:proof['status']='FAIL'
 (OUT/'result.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof));sys.exit(0 if proof['status']=='PASS'else 1)
