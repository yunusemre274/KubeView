import os,sys,json,time,datetime,hashlib,zipfile,tarfile,stat,socket,subprocess,signal,re,urllib.request
from pathlib import Path,PurePosixPath
r=Path.cwd();a=r/'artifacts/release-audit/ra-20261114/native-ci114-form-scroll-retest-root';pre=json.loads((a/'preflight.json').read_text());assert not (a/'result.json').exists(), 'one-shot output exists'; work=time.time()+pre['workLimitSeconds'];ext=Path.home()/'Library/Application Support/KubeView/release-audit-clean-package-20261114-03';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();proc=None;birth=None;browser=None;proof={'status':'FAIL','checks':[],'cleanup':{},'externalRoot':str(ext),'appProcessSnapshots':[]};started=time.time()
def save(): (a/'result.json').write_text(json.dumps(proof,indent=2)+'\n')
def bounded(cmd,seconds=2):return subprocess.run(cmd,capture_output=True,text=True,timeout=seconds)
def birthof(pid):return bounded(['/bin/ps','-p',str(pid),'-o','lstart=']).stdout.strip()
browser_refs={}
def identityof(pid):
 response=bounded(['/bin/ps','-p',str(pid),'-o','lstart=','-o','command='])
 return response.stdout.strip() if response.returncode==0 else None
def capture_browser():
 if not browser:return
 entries={}
 for line in bounded(['/bin/ps','-axo','pid=,ppid=']).stdout.splitlines():
  parts=line.split()
  if len(parts)==2:entries[int(parts[0])]=int(parts[1])
 owned={browser.pid}
 while True:
  previous=len(owned);owned.update(pid for pid,pp in entries.items()if pp in owned)
  if len(owned)==previous:break
 for pid in owned:
  if pid not in browser_refs:
   ident=identityof(pid)
   if ident:browser_refs[pid]=ident
def snapshot():
 rows=bounded(['/bin/ps','-axo','pid=,ppid=,comm=']).stdout.splitlines();entries={}
 for x in rows:
  z=x.strip().split(None,2)
  if len(z)==3:entries[int(z[0])]=(int(z[1]),z[2])
 owned={proc.pid}
 while True:
  prev=len(owned);owned.update(p for p,(pp,c) in entries.items() if pp in owned)
  if len(owned)==prev:break
 children=[{'pid':p,'executableBasename':Path(entries[p][1]).name} for p in owned if p!=proc.pid and p in entries];proof['appProcessSnapshots'].append({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'children':children});assert not children,'Unexpected app subprocess';return children
try:
 assert time.time()<work and not ext.exists(),'Existing external target/deadline guard'
 assert r not in ext.parents and ext not in r.parents and all(not (x/'.git').exists() for x in ext.parents),'Repo ancestry guard'
 zpath=r/'.git/release-audit/ci114-package/ci114-tested-builds.zip';assert sha(zpath)=='15b43aef1c8038cf33cdd0fe8b0581fead498b550b1bf468488b34fda818cb4d'
 expected={x['path']:x for x in json.loads((a/'all-members.json').read_text())};ext.mkdir(mode=0o700);total=0;count=0;seen=set()
 with zipfile.ZipFile(zpath) as z,z.open('kubeview_1.1.0_darwin-arm64.tar.gz') as src,tarfile.open(fileobj=src,mode='r|gz') as tar:
  for m in tar:
   q=PurePosixPath(m.name);assert not q.is_absolute() and '..' not in q.parts and '\\' not in m.name and m.name in expected and m.name not in seen and (m.isdir() or m.isreg());seen.add(m.name);count+=1;total+=m.size;assert count<=1000 and total<=268435456
   dest=ext.joinpath(*q.parts)
   if m.isdir():dest.mkdir(mode=0o700,parents=True,exist_ok=True)
   else:
    dest.parent.mkdir(mode=0o700,parents=True,exist_ok=True);f=tar.extractfile(m)
    with dest.open('xb') as o:
     while b:=f.read(65536):o.write(b)
    assert sha(dest)==expected[m.name]['sha256'];dest.chmod(m.mode&0o755)
 assert seen==set(expected);bundle=ext/'kubeview_1.1.0_darwin-arm64';binary=bundle/'kubeview';assert sha(binary)==pre['binarySHA256'];tools=ext/'empty-tools';tools.mkdir(mode=0o700);data=ext/'app-data';missing=ext/'nonexistent-kubeconfig';assert not data.exists() and not missing.exists();guard=socket.socket();guard.bind(('127.0.0.1',19849));guard.close();proof['checks'].append('CI114 full verified bundle extracted outside repo into new0700 root; port initially free');env={'HOME':os.environ['HOME'],'PATH':str(tools),'READ_ONLY':'true','KV_MINIKUBE_ENABLED':'false','KV_HUBBLE_ENABLED':'false'};argv=[str(binary),'--kubeconfig',str(missing),'--data-dir',str(data),'--bind','127.0.0.1','--port','19849'];proof['appInvocation']={'argv':argv,'cwd':str(bundle),'env':env,'HOME_preserved':True,'inheritedOverridesExcluded':True,'runtimeToolsDirectoryEmpty':not any(tools.iterdir()),'binarySHA256':sha(binary)}
 out=(a/'app.stdout').open('wb');err=(a/'app.stderr').open('wb');proc=subprocess.Popen(argv,cwd=bundle,env=env,stdout=out,stderr=err,start_new_session=True);birth=birthof(proc.pid);assert birth;proof['pid']=proc.pid;proof['birth']=birth
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}));origin='http://127.0.0.1:19849'
 for _ in range(30):
  assert proc.poll() is None and time.time()<work
  try:
   health=opener.open(origin+'/healthz',timeout=1).read();break
  except Exception:time.sleep(.1)
 else:raise RuntimeError('health unavailable')
 listeners=bounded(['/usr/sbin/lsof','-nP','-iTCP:19849','-sTCP:LISTEN','-t']).stdout.split();assert set(listeners)=={str(proc.pid)},'Owned listener identity mismatch';assert birthof(proc.pid)==birth;snapshot();assert health==b'OK'
 def read(path):
  with opener.open(origin+path,timeout=3) as f:return f.read(),f.headers.get('Content-Type')
 version=json.loads(read('/api/version')[0]);assert version['commit']==pre['sourceMerge'] and version['os']=='darwin' and version['arch']=='arm64';workspace=json.loads(read('/api/workspace')[0]);contexts=json.loads(read('/api/contexts')[0]);assert workspace['harbors']==[] and workspace['connections']==[] and contexts['contexts']==[];html,ct=read('/');assert b'<div id="root"' in html and 'html' in ct;assets=re.findall(rb'(?:src|href)="(/assets/[^\"]+)"',html);assetRows=[]
 for asset in assets:
  b,c=read(asset.decode());assert b;assetRows.append({'path':asset.decode(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'contentType':c})
 assert any(x['path'].endswith('.js') for x in assetRows);proof['http']={'healthOK':True,'version':version,'workspaceHarborCount':0,'workspaceConnectionCount':0,'contextCount':0,'htmlSHA256':hashlib.sha256(html).hexdigest(),'assets':assetRows,'missingKubeconfigStillAbsent':not missing.exists(),'auth':'empty configured token; loopback only; no token cookie recorded'};save()
 node=Path.home()/'.nvm/versions/node/v24.16.0/bin/node';assert node.exists();benv=os.environ.copy();benv['KV_PACKAGED_EVIDENCE']=str(a);browser=subprocess.Popen([str(node),str(a/'release-packaged-startup.mjs')],cwd=r/'frontend',env=benv,stdout=(a/'browser.stdout').open('wb'),stderr=(a/'browser.stderr').open('wb'),start_new_session=True)
 while browser.poll() is None:
  assert time.time()<work,'120s work deadline';snapshot();capture_browser();time.sleep(.5)
 snapshot();assert browser.returncode==0,'Browser first failure';proof['browser']=json.loads((a/'browser-result.json').read_text());proof['status']='PASS'
except Exception as e:proof['failure']=str(e)[:500]
finally:
 if browser and browser.poll() is None:
  os.killpg(browser.pid,signal.SIGTERM)
  try:browser.wait(timeout=3)
  except Exception:proof['browserCleanup']='TIMEOUT'
 for sig in [signal.SIGTERM,signal.SIGKILL]:
  for pid,ident in reversed(list(browser_refs.items())):
   if identityof(pid)==ident:
    try:os.kill(pid,sig)
    except ProcessLookupError:pass
  time.sleep(.2)
 proof['browserCapturedCleanup']=[{'pid':pid,'identitySHA256':hashlib.sha256(ident.encode()).hexdigest(),'capturedIdentityAbsent':identityof(pid)!=ident}for pid,ident in browser_refs.items()]
 if any(not row['capturedIdentityAbsent']for row in proof['browserCapturedCleanup']):proof['status']='FAIL';proof['browserCleanup']='owned captured identity remained'
 if proc:
  if proc.poll() is None:
   if birth and birthof(proc.pid)==birth:
    proc.send_signal(signal.SIGTERM)
    try:proc.wait(timeout=8);proof['cleanup']['ownedPIDExited']=True
    except Exception:proof['cleanup']['ownedPIDExited']=False
   else:proof['cleanup']['identityRefused']=True
  else:proof['cleanup']['ownedPIDExited']=True
  proof['cleanup']['exitCode']=proc.returncode
  listeners=bounded(['/usr/sbin/lsof','-nP','-iTCP:19849','-sTCP:LISTEN','-t']).stdout.split();proof['cleanup']['portNoListener']=not listeners
 proof['externalBundleAndStatePreserved']=ext.exists();proof['elapsedSeconds']=time.time()-started;proof['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();save();print(json.dumps({'status':proof['status'],'failure':proof.get('failure'),'cleanup':proof['cleanup'],'elapsedSeconds':proof['elapsedSeconds']}))
