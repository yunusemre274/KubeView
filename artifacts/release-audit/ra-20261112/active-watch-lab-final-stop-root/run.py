"""Restore the two owned containers to the stopped state they had before audit."""
from pathlib import Path
import datetime,hashlib,importlib.util,json,time,sys
sys.dont_write_bytecode=True
out=Path(__file__).resolve().parent;root=out.parents[3]
if (out/'result.json').exists():raise SystemExit('one-shot result exists')
start=time.monotonic();end=start+60
result={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'FAIL','scope':'EXACT_TWO_OWNED_CONTAINERS_ONLY','limitSeconds':60,'before':[],'after':[]}
try:
 spec=importlib.util.spec_from_file_location('kv_manual_lab',root/'scripts/manual_lab.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);old=m.run
 def bounded(argv,**kw):
  remaining=end-time.monotonic()
  if remaining<=0:raise RuntimeError('stop60s budget')
  kw['timeout']=min(kw.get('timeout',10),10,remaining);return old(argv,**kw)
 m.run=bounded
 state=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
 lab=m.Lab(m.parser().parse_args(['status','--state-dir',str(state),'--minikube-binary',str(root/'.git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4')]))
 digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 with lab.lock():
  cluster=lab.guard_cluster('a');assert cluster['uid']=='e84bb50e-8d64-4bc2-905c-9b5ba193e53a'and cluster['markerUid']=='0cded75c-bc00-472f-b69f-39dfd43251f3'
  ns=lab.get('a','namespace','kvrel-secret-20261112-21bddadc');assert ns['metadata']['uid']=='56a3bd1d-cc63-4f7e-a3d0-b0114c99b58d'and ns['metadata']['annotations']['kubeview.io/audit-seal']=='db34037d06b44bddba8b63eb7c586ec1'
  pods=lab.get('a','pods',ns='kvrel-secret-20261112-21bddadc');assert pods['items']==[]
  nodes=lab.get('a','nodes');assert {n['metadata']['name']:n['metadata']['uid']for n in nodes['items']}==cluster['nodeUids']
  records=cluster['containers'];assert {r['id']for r in records}=={'97cc52cfe048288a01e4b84284b34e80ab2ea668fbe3a1dcc28309ab62a21599','c6f18a25a51468412d901a43c31f8e645df9af93a57cf886ac6d632bc52185b9'}
  profile=state/'minikube/.minikube/profiles'/cluster['name']/'config.json'
  before={'state':digest(state/'lab.json'),'profile':digest(profile)}
  result['before']=[{'id':r['id'],'name':r['name'],'running':lab.check_container(cluster,r)['State']['Running']}for r in records]
  for r in reversed(records):
   actual=lab.check_container(cluster,r)
   if actual['State']['Running']:bounded(['docker','stop','--time','5',r['id']])
  result['after']=[{'id':r['id'],'name':r['name'],'running':lab.check_container(cluster,r)['State']['Running']}for r in records]
  assert all(not r['running']for r in result['after'])
  assert before=={'state':digest(state/'lab.json'),'profile':digest(profile)}
  result.update(status='PASS_STOPPED_MANUAL_STATE_PRESERVED',stateProfileUnchanged=True,sealedNamespacePreserved=True,sealedNamespacePodsEmpty=True,originalNodeUIDsVerifiedBeforeStop=True)
except BaseException as error:result['failureType']=type(error).__name__
finally:
 result['elapsedSeconds']=time.monotonic()-start;result['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();result['within60Seconds']=result['elapsedSeconds']<=60
 (out/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result.get(k)for k in ['status','elapsedSeconds','failureType','sealedNamespacePodsEmpty']}))
raise SystemExit(0 if result['status'].startswith('PASS')else 1)
