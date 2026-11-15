"""Resume only two already-owned containers, never recreate/bootstrap a cluster."""
from pathlib import Path
import datetime, hashlib, importlib.util, json, re, shutil, subprocess, sys, time
sys.dont_write_bytecode = True
out=Path(__file__).resolve().parent;root=out.parents[3]
if (out/'result.json').exists():raise SystemExit('one-shot result exists')
began=time.monotonic();main_end=began+120;hard_end=began+180
utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
state=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
expected={'97cc52cfe048288a01e4b84284b34e80ab2ea668fbe3a1dcc28309ab62a21599','c6f18a25a51468412d901a43c31f8e645df9af93a57cf886ac6d632bc52185b9'}
result={'startedAt':utc(),'status':'FAIL','purpose':'owned lab resume prerequisite, NOT cold bootstrap or feature test','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'mainLimitSeconds':120,'wholeLimitSeconds':180,'startedContainers':[],'polls':[]};lab=None;records=[]
def need(ok,reason):
 if not ok:raise RuntimeError(reason)
def filehash(p):return hashlib.sha256(p.read_bytes()).hexdigest()
spec=importlib.util.spec_from_file_location('kv_manual_lab',root/'scripts/manual_lab.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
original_run=m.run
# Every I/O call fits the remaining stage budget. Neither stderr nor private config is recorded.
def bounded_run(argv,**kw):
 end=hard_end if result.get('cleanupActive') else main_end
 need(time.monotonic()<end,'bounded_io_stage_expired')
 kw['timeout']=min(kw.get('timeout',10),10,max(.1,end-time.monotonic()))
 return original_run(argv,**kw)
m.run=bounded_run
try:
 power=subprocess.check_output(['pmset','-g','batt'],text=True,timeout=3)
 percent=int(re.search(r'(\d+)%;',power)[1]);need(percent>=30,'battery_below_30_before_short_setup')
 need(shutil.disk_usage(root).free>=10*1024**3,'disk_below_10GiB')
 result['powerStart']={'batteryPercent':percent,'batteryPower':'Battery Power' in power}
 args=m.parser().parse_args(['status','--state-dir',str(state),'--minikube-binary',str(root/'.git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4')]);lab=m.Lab(args)
 with lab.lock():
  need(lab.state['labId']=='kvml-d32afbf634e8','lab_id_guard')
  cluster=lab.guard_cluster('a',api=False);need(cluster['uid']=='e84bb50e-8d64-4bc2-905c-9b5ba193e53a' and cluster['markerUid']=='0cded75c-bc00-472f-b69f-39dfd43251f3','cluster_record_guard')
  records=cluster['containers'];need({x['id'] for x in records}==expected and len(records)==2,'exact_container_set_guard')
  result['stateBeforeSHA256']=filehash(state/'lab.json')
  result['profileBeforeSHA256']=filehash(state/'minikube/.minikube/profiles'/cluster['name']/'config.json')
  for record in records:
   actual=lab.check_container(cluster,record)
   need(not actual['State']['Running'],'expected_initially_stopped_no_other_owner')
  for record in records:
   lab.check_container(cluster,record)
   # Capture ownership before sending an explicit command to that exact ID.
   result['startedContainers'].append(record['id'])
   bounded_run(['docker','start',record['id']])
  # Correct the preparation helper's stale port assumption using the existing
  # owned-only refresh path. No minikube update-context or auth replacement.
  config_before=lab.admin_document()
  neutral=lambda value:{**value,'clusters':[{**entry,'cluster':{**entry['cluster'],'server':'OWNED_LOOPBACK_PORT'}}if entry['name']==cluster['name']else entry for entry in value.get('clusters',[])]}
  config_content_hash=lambda value:hashlib.sha256(json.dumps(neutral(value),sort_keys=True,separators=(',',':')).encode()).hexdigest()
  current=lab.check_container(cluster,next(r for r in records if r['name']==cluster['name']))
  binding=next(b for b in current['NetworkSettings']['Ports']['8443/tcp']if b['HostIp']=='127.0.0.1')
  old_server=next(c['cluster']['server']for c in config_before['clusters']if c['name']==cluster['name'])
  new_server='https://127.0.0.1:'+binding['HostPort']
  result['portDiagnosis']={'previousConfiguredAPI':old_server,'actualOwnedLoopbackAPI':new_server,'changed':old_server!=new_server,'firstAttemptOmittedExistingRefresh':True}
  lab.refresh_admin_server('a')
  config_after=lab.admin_document()
  need(config_content_hash(config_before)==config_content_hash(config_after),'only_owned_server_endpoint_may_change')
  result['credentialsAndOtherContextsUnchanged']=True
  def fetch(resource,name=None,namespace=None):
   argv=['get',resource]+([name]if name else[])+(['-n',namespace]if namespace else[])+['-o','json']
   try:
    rc,body,_=lab.kubectl('a',argv,check=False,timeout=6)
   except m.LabError:
    result['transientStartupIOErrors']=result.get('transientStartupIOErrors',0)+1
    return None
   return json.loads(body)if rc==0 else None
  while time.monotonic()<main_end:
   system=fetch('namespace','kube-system');marker=fetch('configmap','kubeview-manual-lab-owner','kube-system');nodes=fetch('nodes')
   valid=bool(system and marker and nodes)
   if valid:
    need(system['metadata']['uid']==cluster['uid'],'live_cluster_uid_guard')
    need(marker['metadata']['uid']==cluster['markerUid'] and marker['metadata'].get('labels',{}).get(m.OWNER)==lab.state['labId'],'live_owner_marker_guard')
    actual_nodes={n['metadata']['name']:{'uid':n['metadata']['uid'],'ready':any(c.get('type')=='Ready'and c.get('status')=='True'for c in n.get('status',{}).get('conditions',[]))}for n in nodes['items']}
    need({k:v['uid']for k,v in actual_nodes.items()}==cluster['nodeUIDs'],'original_node_uids_guard')
    valid=all(v['ready']for v in actual_nodes.values())
   result['polls'].append({'elapsedSeconds':time.monotonic()-began,'apiObjectsAvailable':bool(system and marker and nodes),'bothNodesReady':valid})
   if valid:
    ns=fetch('namespace','kvrel-secret-20261112-21bddadc');need(ns and ns['metadata']['uid']=='56a3bd1d-cc63-4f7e-a3d0-b0114c99b58d' and ns['metadata'].get('labels',{}).get(m.OWNER)==lab.state['labId'] and ns['metadata'].get('annotations',{}).get('kubeview.io/audit-seal')=='db34037d06b44bddba8b63eb7c586ec1','qa_uid_owner_seal_guard')
    result['nodes']=actual_nodes;result['sealedNamespaceVerified']=True
    result['stateAfterSHA256']=filehash(state/'lab.json');result['profileAfterSHA256']=filehash(state/'minikube/.minikube/profiles'/cluster['name']/'config.json')
    need(result['stateAfterSHA256']==result['stateBeforeSHA256'] and result['profileAfterSHA256']==result['profileBeforeSHA256'],'state_profile_unchanged_guard')
    result['status']='PASS_OWNED_RESUME_READY_NOT_COLD_START';break
   time.sleep(min(2,max(0,main_end-time.monotonic())))
  need(result['status'].startswith('PASS'),'ready_deadline_not_met')
except BaseException as error:
 result['failureCategory']=str(error)if isinstance(error,RuntimeError)else type(error).__name__
 result['cleanupActive']=True;result['cleanup']=[]
 if lab and records:
  for record in reversed(records):
   if record['id']not in result['startedContainers']:continue
   try:
    actual=lab.check_container(lab.state['clusters']['a'],record)
    if actual['State']['Running']:bounded_run(['docker','stop','--time','10',record['id']])
    result['cleanup'].append({'id':record['id'],'stopped':not lab.check_container(lab.state['clusters']['a'],record)['State']['Running']})
   except BaseException as cleanup_error:result['cleanup'].append({'id':record['id'],'errorCategory':type(cleanup_error).__name__})
finally:
 result['elapsedSeconds']=time.monotonic()-began;result['finishedAt']=utc();result['within180Seconds']=result['elapsedSeconds']<=180
 (out/'result.json').write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:result.get(k)for k in ['status','elapsedSeconds','failureCategory','sealedNamespaceVerified','within180Seconds']}))
raise SystemExit(0 if result['status'].startswith('PASS')else 1)
