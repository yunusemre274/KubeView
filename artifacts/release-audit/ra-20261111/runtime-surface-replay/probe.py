from pathlib import Path
import datetime, hashlib, json, os, re, secrets, signal, socket, subprocess, time, urllib.request, urllib.error

root=Path('/Users/yunusemre/Desktop/KubeView')
out=root/'artifacts/release-audit/ra-20261111/runtime-surface-replay'
out.mkdir(exist_ok=False)
private=root/'.git/release-audit/runtime-surface-private03'
private.mkdir(mode=0o700,exist_ok=False)
app=root/'.git/release-audit/candidate-runtime-provider09/kubeview'
expected='f9e70b607c1689800f253ccaa6841d05e3a6951e6c032f837b7cf78f1dd4ecd4'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(app)==expected
sourceFiles=['backend/main.go','backend/pkg/server/server.go','backend/pkg/server/provider_handlers.go','backend/pkg/server/replay_source.go','backend/pkg/server/workspace.go']
normal={}
for filename in sourceFiles[:3]:
    text=(root/filename).read_text()
    for match in re.finditer(r'mux\.Handle(?:Func)?\("([^"\n]+)"\s*,\s*([^\n]+)',text):
        route=match[1]
        normal[route]={'pattern':route,'source':filename,'line':text[:match.start()].count('\n')+1,'registration':match[2].rstrip(), 'protected': 's.protect(' in match[2]}
    if filename.endswith('/server.go'):
        for match in re.finditer(r'"(/(?:api/[^" ]+|ws))":\s*s\.(\w+)',text):
            route=match[1];normal[route]={'pattern':route,'source':filename,'line':text[:match.start()].count('\n')+1,'registration':'Register map → s.protect(s.'+match[2]+')','protected':True}
assert len(normal)==25,len(normal)
protected=[r for r,x in normal.items() if x['protected']]
assert len(protected)==21,len(protected)
result={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'FAIL','sourceCommit':'4c6c2ac57edc3b6634aecd86f6c927782de01f37','binarySHA256':expected,'routeCount':len(normal),'protectedRouteCount':len(protected),'sourceSHA256':{p:sha(root/p) for p in sourceFiles},'probes':[],'dataSource':'NO_KUBERNETES; fresh empty workspace, explicit missing kubeconfig, providers disabled'}
base='http://127.0.0.1:19844';token=secrets.token_hex(32);proc=None;start=time.monotonic()
def birth(pid):
    p=subprocess.run(['/bin/ps','-p',str(pid),'-o','lstart='],capture_output=True,text=True,timeout=2)
    return p.stdout.strip() if p.returncode==0 else None
def req(path,auth=False,origin=None):
    headers={'Origin':base if origin is None else origin}
    if auth:headers['Authorization']='Bearer '+token
    request=urllib.request.Request(base+path,headers=headers)
    try:r=urllib.request.urlopen(request,timeout=2)
    except urllib.error.HTTPError as e:r=e
    with r:
        data=r.read(2*1024*1024+1);assert len(data)<=2*1024*1024
        return r.status,r.headers.get('Content-Type',''),data
def record(path,expected_status,auth=False,origin=None,bodySHA=None):
    code,mime,data=req(path,auth,origin)
    item={'path':path,'method':'GET','authenticatedSyntheticKey':auth,'originKind':'owned' if origin is None else 'foreign-canary','status':code,'expectedStatus':expected_status,'contentType':mime,'bodyBytes':len(data),'bodySHA256':hashlib.sha256(data).hexdigest()}
    result['probes'].append(item)
    assert code==expected_status,item
    if bodySHA:assert item['bodySHA256']==bodySHA,item
    return data
try:
    s=socket.socket();s.bind(('127.0.0.1',19844));s.close()
    env={'HOME':str(Path.home()),'PATH':'/usr/bin:/bin','READ_ONLY':'true','API_TOKEN':token,'KV_MINIKUBE_ENABLED':'false','KV_HUBBLE_ENABLED':'false'}
    args=[str(app),'--bind','127.0.0.1','--port','19844','--kubeconfig',str(private/'does-not-exist'),'--data-dir',str(private/'app-data'),'--replay-profile','M']
    proc=subprocess.Popen(args,cwd=private,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
    owner_birth=birth(proc.pid);assert owner_birth and os.getpgid(proc.pid)==proc.pid
    result['app']={'pid':proc.pid,'birth':owner_birth,'PGID':proc.pid,'bind':'127.0.0.1:19844'}
    for _ in range(50):
        assert proc.poll() is None
        try:
            if req('/healthz')[0]==200:break
        except urllib.error.URLError:time.sleep(.05)
    else:raise AssertionError('not ready')
    listeners=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:19844','-sTCP:LISTEN','-t'],capture_output=True,text=True,timeout=2)
    assert set(listeners.stdout.split())=={str(proc.pid)}
    record('/',200);record('/healthz',200)
    version=json.loads(record('/api/version',200));assert version['commit']==result['sourceCommit']
    record('/api/replay/status',401);record('/api/replay/scenario',401)
    status=json.loads(record('/api/replay/status',200,True))
    assert status['dataSource']=='test-replay' and status['profile']=='M' and status['running'] is False and isinstance(status['controlNonce'],str)
    record('/api/replay/scenario',405,True)
    result['replay']={'explicitFlag':'M','dataSource':status['dataSource'],'profile':status['profile'],'running':status['running'],'controlNoncePresentNotRetained':True,'additionalPatterns':2,'scenarioInvoked':False}
    result['dataSource']='EXPLICIT_TEST_REPLAY; no Kubernetes/traffic/scenario mutation'
    result['status']='PASS'
except Exception as e:
    result['failureClass']=type(e).__name__
    result['failure']=str(e)[:1024]
finally:
    if proc and proc.poll() is None:
        assert birth(proc.pid)==owner_birth and os.getpgid(proc.pid)==proc.pid
        proc.send_signal(signal.SIGTERM)
        try:proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            assert birth(proc.pid)==owner_birth and os.getpgid(proc.pid)==proc.pid
            os.killpg(proc.pid,signal.SIGKILL);proc.wait(timeout=2)
    result['appExitCode']=proc.returncode if proc else None
    check=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:19844','-sTCP:LISTEN','-t'],capture_output=True,text=True,timeout=2)
    result['noListenAfter']=not check.stdout.split();result['elapsedSeconds']=time.monotonic()-start
    if not result['noListenAfter'] or result['elapsedSeconds']>30:result['status']='FAIL'
    result['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    (out/'result.json').write_text(json.dumps(result,indent=2)+'\n')
    (out/'routes.json').write_text(json.dumps(sorted(normal.values(),key=lambda x:x['pattern']),indent=2)+'\n')
    (out/'probe.py').write_bytes(Path(__file__).read_bytes())
print(json.dumps({'status':result['status'],'probes':len(result['probes']),'elapsedSeconds':result['elapsedSeconds'],'failure':result.get('failure')}))
raise SystemExit(0 if result['status']=='PASS' else 1)
