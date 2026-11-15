"""Restore one missing, verified owned-worker control-plane host alias."""
from pathlib import Path
import datetime, hashlib, importlib.util, ipaddress, json, subprocess, sys, time
sys.dont_write_bytecode=True
out=Path(__file__).resolve().parent;root=out.parents[3]
if (out/'result.json').exists():raise SystemExit('one-shot result exists')
start=time.monotonic();end=start+120
utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
result={'startedAt':utc(),'status':'FAIL','scope':'OWNED_LAB_DNS_REPAIR_AND_FRESH_LEASE_PREREQUISITE_NOT_APP_E2E','limitSeconds':120,'rawKubeletLogsExported':False,'polls':[]}
try:
 spec=importlib.util.spec_from_file_location('kv_manual_lab',root/'scripts/manual_lab.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 original=m.run
 def bounded(argv,**kw):
  remaining=end-time.monotonic()
  if remaining<=0:raise RuntimeError('120s recovery deadline')
  kw['timeout']=min(kw.get('timeout',5),5,remaining)
  return original(argv,**kw)
 m.run=bounded
 state=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
 lab=m.Lab(m.parser().parse_args(['status','--state-dir',str(state),'--minikube-binary',str(root/'.git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4')]))
 with lab.lock():
  cluster=lab.guard_cluster('a')
  assert lab.state['labId']=='kvml-d32afbf634e8' and cluster['uid']=='e84bb50e-8d64-4bc2-905c-9b5ba193e53a' and cluster['markerUid']=='0cded75c-bc00-472f-b69f-39dfd43251f3'
  ns=lab.get('a','namespace','kvrel-secret-20261112-21bddadc');assert ns['metadata']['uid']=='56a3bd1d-cc63-4f7e-a3d0-b0114c99b58d' and ns['metadata']['annotations']['kubeview.io/audit-seal']=='db34037d06b44bddba8b63eb7c586ec1'
  cp=next(r for r in cluster['containers']if r['id']=='97cc52cfe048288a01e4b84284b34e80ab2ea668fbe3a1dcc28309ab62a21599')
  worker=next(r for r in cluster['containers']if r['id']=='c6f18a25a51468412d901a43c31f8e645df9af93a57cf886ac6d632bc52185b9')
  actual_cp=lab.check_container(cluster,cp);actual_worker=lab.check_container(cluster,worker)
  network=actual_cp['NetworkSettings']['Networks'][cluster['network']['name']];assert network['NetworkID']==cluster['network']['id']
  address=str(ipaddress.IPv4Address(network['IPAddress']));host='control-plane.minikube.internal'
  assert actual_cp['State']['Running']and actual_worker['State']['Running']
  before=lab.get('a','nodes');assert {n['metadata']['name']:n['metadata']['uid']for n in before['items']}==cluster['nodeUids']
  result['before']=[{'node':n['metadata']['name'],'uid':n['metadata']['uid'],'ready':next(c['status']for c in n['status']['conditions']if c['type']=='Ready')}for n in before['items']]
  rc,record,_=bounded(['docker','exec',worker['id'],'getent','hosts',host],check=False)
  result['lookupBeforeExit']=rc
  if rc==2 and not record.strip():
   _,old_hosts,_=bounded(['docker','exec',worker['id'],'cat','/etc/hosts'])
   lab.guard_cluster('a');lab.check_container(cluster,worker)
   # The shell program is fixed; only a validated owned IP and fixed hostname
   # are positional arguments. No browser-supplied command or interpolation.
   bounded(['docker','exec',worker['id'],'/bin/sh','-c','printf "%s %s\\n" "$1" "$2" >> /etc/hosts','kv-owned-host-repair',address,host])
   _,new_hosts,_=bounded(['docker','exec',worker['id'],'cat','/etc/hosts'])
   assert new_hosts.startswith(old_hosts)and new_hosts[len(old_hosts):].strip()==address+' '+host
   result['onlyOneOwnedHostEntryAppended']=True
   result['hostsBeforeSHA256']=hashlib.sha256(old_hosts.encode()).hexdigest();result['hostsAfterSHA256']=hashlib.sha256(new_hosts.encode()).hexdigest()
  else:
   assert rc==0 and record.split()[0]==address,'existing host entry mismatched; no overwrite'
   result['alreadyCorrect']=True
  rc,record,_=bounded(['docker','exec',worker['id'],'getent','hosts',host]);assert record.split()[0]==address
  result['lookupAfterMatchesOwnedControlPlaneIP']=True
  good=0
  while time.monotonic()<end:
   current=lab.get('a','nodes');assert {n['metadata']['name']:n['metadata']['uid']for n in current['items']}==cluster['nodeUids']
   now=datetime.datetime.now(datetime.timezone.utc);checks=[]
   for n in current['items']:
    ready=next(c['status']for c in n['status']['conditions']if c['type']=='Ready')
    lease=lab.get('a','lease',n['metadata']['name'],'kube-node-lease');renew=datetime.datetime.fromisoformat(lease['spec']['renewTime'].replace('Z','+00:00'));age=(now-renew).total_seconds()
    checks.append({'node':n['metadata']['name'],'uid':n['metadata']['uid'],'ready':ready,'leaseAgeSeconds':age})
   valid=all(x['ready']=='True'and -5<=x['leaseAgeSeconds']<=30 for x in checks)
   good=good+1 if valid else 0;result['polls'].append({'elapsedSeconds':time.monotonic()-start,'nodes':checks,'consecutiveValid':good})
   if good>=3:
    result['status']='PASS_ORIGINAL_UIDS_READY_WITH_FRESH_LEASES';break
   time.sleep(min(2,max(0,end-time.monotonic())))
  assert result['status'].startswith('PASS'),'fresh leases/readiness not stable by deadline'
except BaseException as error:
 result['failureType']=type(error).__name__
finally:
 result['finishedAt']=utc();result['elapsedSeconds']=time.monotonic()-start;result['within120Seconds']=result['elapsedSeconds']<=120
 (out/'result.json').write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:result.get(k)for k in ['status','elapsedSeconds','failureType','onlyOneOwnedHostEntryAppended','lookupAfterMatchesOwnedControlPlaneIP']}))
raise SystemExit(0 if result['status'].startswith('PASS')else 1)
