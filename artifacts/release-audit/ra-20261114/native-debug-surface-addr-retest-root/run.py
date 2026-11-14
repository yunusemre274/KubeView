"""Bounded owned release-binary debug-route probe; no Kubernetes credentials."""
from pathlib import Path
import datetime,hashlib,http.client,json,os,shutil,signal,socket,subprocess,time
root=Path.cwd();out=Path(__file__).resolve().parent;plan=json.loads((out/'preflight.json').read_text());assert not(out/'result.json').exists()
start=time.monotonic();deadline=start+45;count=0;last=0;proc=None;birth=None;results={'status':'FAIL','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'modes':[],'requests':[]};private=Path.home()/'Library/Application Support/KubeView/release-audit-debug-surface-addr-retest-20261114';binary=Path.home()/'Library/Application Support/KubeView/release-audit-clean-package-20261114-01/kubeview_1.1.0_darwin-arm64/kubeview';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def command(argv):return subprocess.run(argv,capture_output=True,text=True,timeout=2)
def identity(pid):
 r=command(['/bin/ps','-p',str(pid),'-o','lstart=','-o','command=']);return r.stdout.strip()if r.returncode==0 else None
def guard():
 assert time.monotonic()<deadline,'work deadline';assert shutil.disk_usage(out).free>=10*1024**3,'disk budget'
 if proc and proc.poll()is None:
  assert identity(proc.pid)==birth,'app identity changed'
  p=command(['/bin/ps','-p',str(proc.pid),'-o','rss=']);assert int(p.stdout.strip())<=1024*1024,'app RSS1GiB'
  r=command(['/bin/ps','-axo','pid=,ppid=']);children=[int(x.split()[0])for x in r.stdout.splitlines()if len(x.split())==2 and int(x.split()[1])==proc.pid];assert not children,'unexpected direct app child'
def call(method,path,body=None):
 global count,last
 guard();assert count<50,'50 request cap';time.sleep(max(0,.105-(time.monotonic()-last)));guard();count+=1;last=time.monotonic()
 c=http.client.HTTPConnection('127.0.0.1',19849,timeout=2)
 try:
  c.request(method,path,body=body,headers={'Content-Type':'application/json','Origin':'http://127.0.0.1:19849'});r=c.getresponse();b=r.read(2*1024*1024+1);assert len(b)<=2*1024*1024,'response cap';row={'mode':current['name'],'method':method,'path':path,'status':r.status,'contentType':r.getheader('Content-Type'),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};results['requests'].append(row);return r.status,b
 finally:c.close()
def stop():
 global proc
 if not proc:return
 if proc.poll()is None:
  assert identity(proc.pid)==birth,'cleanup identity changed';proc.send_signal(signal.SIGTERM)
  try:proc.wait(timeout=8)
  except subprocess.TimeoutExpired:
   if identity(proc.pid)==birth:proc.kill();proc.wait(timeout=2)
 current['cleanup']={'exitCode':proc.returncode,'ownedIdentityAbsent':identity(proc.pid)!=birth,'portNoListener':not command(['/usr/sbin/lsof','-nP','-iTCP:19849','-sTCP:LISTEN','-t']).stdout.strip()};assert current['cleanup']=={'exitCode':0,'ownedIdentityAbsent':True,'portNoListener':True};proc=None
try:
 assert sha(binary)==plan['binarySHA256'] and all(sha(root/p)==h for p,h in plan['sourceSHA256'].items()),'source/binary guard';assert not private.exists();private.mkdir(mode=0o700);tools=private/'empty-tools';tools.mkdir(mode=0o700);(private/'fixture.json').write_text('[]\n');(private/'bootstrap.js').write_text('/* owned unused benchmark canary */\n')
 for name in plan['modes']:
  current={'name':name,'status':'FAIL'};results['modes'].append(current);guard();sock=socket.socket();sock.bind(('127.0.0.1',19849));sock.close();mode=private/name;mode.mkdir(mode=0o700);env={'HOME':os.environ['HOME'],'PATH':str(tools),'READ_ONLY':'true','KV_HUBBLE_ENABLED':'false','KV_MINIKUBE_ENABLED':'false'}
  if name=='benchmark-test-environment-set':
   env.update(KUBEVIEW_BENCH_FIXTURE=str(private/'fixture.json'),KUBEVIEW_BENCH_ADDR='127.0.0.1:19848',KUBEVIEW_BENCH_STATIC=str(mode),KUBEVIEW_BENCH_RESULT_DIR=str(mode/'unexpected-result'),KUBEVIEW_BENCH_BOOTSTRAP=str(private/'bootstrap.js'),KUBEVIEW_BENCH_LOG_GATED='1')
  current['testEnvKeysSet']=[x for x in env if x.startswith('KUBEVIEW_BENCH')];argv=[str(binary),'--kubeconfig',str(mode/'absent-kubeconfig'),'--data-dir',str(mode/'app-data'),'--bind','127.0.0.1','--port','19849'];current['argv']=argv
  with(out/(name+'.stdout')).open('xb')as stdout,(out/(name+'.stderr')).open('xb')as stderr:proc=subprocess.Popen(argv,cwd=binary.parent,env=env,stdout=stdout,stderr=stderr,start_new_session=True)
  birth=identity(proc.pid);assert birth;current['pid']=proc.pid
  for i in range(5):
   try:status,b=call('GET','/healthz');assert status==200 and b==b'OK';break
   except(ConnectionRefusedError,ConnectionResetError):guard();time.sleep(.1)
  else:raise RuntimeError('health unavailable')
  assert set(command(['/usr/sbin/lsof','-nP','-iTCP:19849','-sTCP:LISTEN','-t']).stdout.split())=={str(proc.pid)}
  code,index=call('GET','/');assert code==200 and hashlib.sha256(index).hexdigest()=='d0b09c58e230d899fe974a215412826df7a8507c052b63d6a4de174fe3b7a5bb'
  code,b=call('GET','/api/version');assert code==200 and json.loads(b)['commit']==plan['sourceBuild']
  code,b=call('GET','/api/workspace');workspace=json.loads(b);assert code==200 and workspace['harbors']==[] and workspace['connections']==[]
  code,b=call('GET','/api/contexts');assert code==200 and json.loads(b)['contexts']==[]
  for path in ['/__benchmark/manual','/__benchmark/state','/__benchmark/replay','/__benchmark/log-flow','/__benchmark/result','/debug/pprof/','/debug/vars','/metrics']:
   code,b=call('GET',path);assert code==200 and b==index,'unexpected endpoint response: '+path
  for path,body in [('/__benchmark/result','{}'),('/__benchmark/replay','[]'),('/__benchmark/log-flow','{"enabled":false}'),('/debug/pprof/','{}')]:
   code,b=call('POST',path,body);assert code==405,'POST is not SPA405: '+path
  for method,path in [('GET','/api/replay/status'),('POST','/api/replay/scenario'),('GET','/api/benchmark'),('GET','/api/debug')]:
   code,b=call(method,path,'{}'if method=='POST'else None);assert code==(405 if method=='POST' else 404),'disabled/absent API fallback mismatch: '+path
  listens=command(['/usr/sbin/lsof','-nP','-a','-p',str(proc.pid),'-iTCP','-sTCP:LISTEN','-Fn']).stdout.splitlines();ownedListeners=[x[1:]for x in listens if x.startswith('n')];assert ownedListeners==['127.0.0.1:19849'],'unexpected owned listening endpoint';current['ownedTCPListenEndpoints']=ownedListeners
  assert not(mode/'unexpected-result').exists()and not(mode/'absent-kubeconfig').exists();guard();current.update(status='PASS',spaFallbackIsNotDebugAPI=True,noTestResultWrites=True,noKubeconfigCreated=True);stop()
 results.update(status='PASS',binarySHA256=sha(binary),sourceAfterMatches=all(sha(root/p)==h for p,h in plan['sourceSHA256'].items()),privateStatePreserved=True)
except BaseException as e:results['failure']={'type':type(e).__name__,'reason':str(e)[:400]}
finally:
 try:stop()
 except BaseException as e:results['status']='FAIL';results['cleanupFailure']=str(e)[:200]
 results['totalHTTPAttempts']=count;results['elapsedSeconds']=time.monotonic()-start;results['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();results['privateRoot']=str(private)
 if results['elapsedSeconds']>60 or not results.get('sourceAfterMatches',False):results['status']='FAIL'
 (out/'result.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps({k:results.get(k)for k in ['status','totalHTTPAttempts','elapsedSeconds','failure','cleanupFailure']}))
raise SystemExit(0 if results['status']=='PASS'else 1)
