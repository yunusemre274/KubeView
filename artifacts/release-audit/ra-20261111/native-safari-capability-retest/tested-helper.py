from pathlib import Path
import subprocess,socket,urllib.request,urllib.error,json,time,datetime,re
out=Path('artifacts/release-audit/ra-20261111/native-safari-capability-retest');out.mkdir(exist_ok=False)
private=Path('.git/release-audit/native-safari-capability-retest');private.mkdir(exist_ok=False)
result={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Native Safari capability probe only; no app or user page navigation, performance or Retina app acceptance','status':'RUNNING','port':19845};start=time.monotonic();proc=None;session=None
def request(method,path,data=None,timeout=5):
    raw=None if data is None else json.dumps(data).encode();req=urllib.request.Request('http://127.0.0.1:19845'+path,data=raw,method=method,headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=timeout) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as e:return e.code,json.load(e)
try:
    existing=subprocess.run(['/usr/bin/pgrep','-x','safaridriver'],capture_output=True,text=True,timeout=3)
    if existing.returncode==0:
        result.update(status='BLOCKED',reason='An existing safaridriver process is present; not reused or stopped');raise RuntimeError('owned scope unavailable')
    with socket.socket() as s:s.bind(('127.0.0.1',19845))
    result['driverVersion']=subprocess.run(['/usr/bin/safaridriver','--version'],capture_output=True,text=True,timeout=3,check=True).stdout.strip()
    with (private/'driver.log').open('w') as stream:
        proc=subprocess.Popen(['/usr/bin/safaridriver','--port','19845'],stdout=stream,stderr=subprocess.STDOUT)
    until=time.monotonic()+6
    while time.monotonic()<until:
        if proc.poll() is not None:raise RuntimeError('owned driver exited before readiness')
        try:
            code,data=request('GET','/status',timeout=1)
            if code==200:break
        except (OSError,ValueError):pass
        time.sleep(.1)
    else:raise TimeoutError('driver readiness bound')
    result['launcherPID']=proc.pid
    check=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:19845','-sTCP:LISTEN','-Fpn'],capture_output=True,text=True,timeout=3)
    result['lsofExitCode']=check.returncode
    endpoints=[x[1:] for x in check.stdout.splitlines() if x.startswith('n')]
    listenerPIDs=[int(x[1:]) for x in check.stdout.splitlines() if x.startswith('p')]
    result['driverListenEndpoints']=endpoints;result['listenerPIDs']=listenerPIDs
    result['lsofStderrClass']='nonempty' if check.stderr else 'empty'
    if not endpoints or any(not (x.startswith('127.0.0.1:') or x.startswith('[::1]:') or x.startswith('localhost:')) for x in endpoints):
        result.update(status='BLOCKED',reason='Owned loopback listener addresses not established; no session sent')
        raise RuntimeError('loopback guard')
    chains=[]
    for owner in listenerPIDs:
        chain=[];pid=owner
        for hop in range(8):
            row=subprocess.run(['/bin/ps','-p',str(pid),'-o','ppid=','-o','comm='],capture_output=True,text=True,timeout=2)
            fields=row.stdout.strip().split(None,1)
            if len(fields)!=2:break
            parent=int(fields[0]);chain.append({'pid':pid,'ppid':parent,'comm':fields[1]})
            if pid==proc.pid:break
            if parent<=1:break
            pid=parent
        chains.append(chain)
    result['listenerParentChains']=chains
    if not listenerPIDs or any(not any(x['pid']==proc.pid for x in c) for c in chains):
        result.update(status='BLOCKED',reason='Listener ancestry to owned launcher not established; no session sent')
        raise RuntimeError('ownership guard')
    code,data=request('POST','/session',{'capabilities':{'alwaysMatch':{'browserName':'safari'}}},timeout=14)
    result['createSessionHTTPStatus']=code;value=data.get('value',{});session=value.get('sessionId')
    if code!=200 or not session:
        message=str(value.get('message',''));result['webdriverError']=value.get('error');result['errorMessage']=re.sub(r'https?://\S+','[redacted-url]',message)[:600];result['status']='BLOCKED';result['noEnableOrOSSettingChange']=True
    else:
        caps=value.get('capabilities',{});result['capabilities']={k:caps.get(k) for k in ['browserName','browserVersion','platformName']}
        code,url=request('GET','/session/'+session+'/url');result['newSessionAboutBlank']=code==200 and url.get('value')=='about:blank'
        if not result['newSessionAboutBlank']:raise RuntimeError('session not on owned blank page; no page contents read')
        code,display=request('POST','/session/'+session+'/execute/sync',{'script':'return {dpr:devicePixelRatio,width:innerWidth,height:innerHeight};','args':[]})
        result['blankPageDisplay']=display.get('value') if code==200 else None;result['status']='CAPABILITY_AVAILABLE'
except Exception as e:
    if result['status']=='RUNNING':result['status']='FAILED'
    result['probeErrorClass']=type(e).__name__
finally:
    if session:
        try:result['sessionDeleted']=request('DELETE','/session/'+session,timeout=5)[0]==200
        except Exception as e:result['deleteErrorClass']=type(e).__name__
    if proc is not None and proc.poll() is None:
        proc.terminate()
        try:proc.wait(timeout=5)
        except subprocess.TimeoutExpired:result['cleanupTimeout']=True
    result['ownedDriverExited']=proc is None or proc.poll() is not None
    with socket.socket() as s:
        try:s.bind(('127.0.0.1',19845));result['portFreeAfter']=True
        except OSError:result['portFreeAfter']=False
    tail=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:19845','-sTCP:LISTEN','-Fpn'],capture_output=True,text=True,timeout=3)
    result['listenerRecordsAfter']=tail.stdout.splitlines();result['noListenerAfter']=tail.returncode==1 and not tail.stdout
    result['elapsedSeconds']=time.monotonic()-start;result['within45s']=result['elapsedSeconds']<=45;result['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();(out/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
