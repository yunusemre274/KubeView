"""One sealed owned Secret + private app + finite browser; no raw values logged."""
from pathlib import Path
import base64,datetime,fcntl,hashlib,json,os,re,secrets,shutil,signal,socket,ssl,subprocess,time,urllib.error,urllib.parse,urllib.request
R=Path(__file__).resolve().parents[4];A=Path(__file__).resolve().parent
S=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
APP=R/'.git/release-audit/candidate-runtime-profilelock10/kubeview';APP_SHA='5f1c22b90297f6ab870ce235faaa73e1591d324ff77bf9cc4d8b4ed18cefb097'
PHASE=time.time()
PRIVATE=S/'private/secret-purpose-ui-20261112-two';NS='kvrel-secret-20261112-21bddadc';NSUID='56a3bd1d-cc63-4f7e-a3d0-b0114c99b58d';SEAL='db34037d06b44bddba8b63eb7c586ec1';LAB='kvml-d32afbf634e8';PROFILE=LAB+'-a';SYSTEM='e84bb50e-8d64-4bc2-905c-9b5ba193e53a';MARKER='0cded75c-bc00-472f-b69f-39dfd43251f3'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
proof={'status':'FAIL','phaseStartedAt':datetime.datetime.fromtimestamp(PHASE,datetime.timezone.utc).isoformat(),'phaseLimitSeconds':240,'events':[],'valuesExported':False,'appCleanup':[]};app=None;browser=None;ownedUID=None;opener=None;step='preflight';captured={}
def need(ok,category):
 if not ok:raise RuntimeError(category)
def save(name,obj):(A/name).write_text(json.dumps(obj,indent=2)+'\n')
def event(name,**safe):proof['events'].append({'at':utc(),'event':name,**safe})
def power():
 raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);m=re.search(r'(\d+)%',raw);free=shutil.disk_usage(R).free;need(m is not None and int(m[1])>=25 and free>=10*1024**3,'battery25_disk10GiB_guard');return {'batteryPercent':int(m[1]),'freeDiskBytes':free}
def api(method,path,body=None,metadata=False):
 data=json.dumps(body).encode() if body is not None else None
 headers={'Accept':'application/json;as=PartialObjectMetadataList;g=meta.k8s.io;v=v1' if metadata and path.endswith('/secrets') else 'application/json;as=PartialObjectMetadata;g=meta.k8s.io;v=v1' if metadata else 'application/json'}
 if data is not None:headers['Content-Type']='application/json'
 req=urllib.request.Request(apiBase+path,data=data,method=method,headers=headers)
 try:
  with opener.open(req,timeout=5) as response:return response.status,json.loads(response.read(2*1024*1024))
 except urllib.error.HTTPError as error:code=error.code;error.close();return code,{}
def guard():
 code,system=api('GET','/api/v1/namespaces/kube-system');need(code==200 and system['metadata']['uid']==SYSTEM,'cluster_UID_guard')
 code,marker=api('GET','/api/v1/namespaces/kube-system/configmaps/kubeview-manual-lab-owner');need(code==200 and marker['metadata']['uid']==MARKER and marker['metadata']['labels']['manual.kubeview.local/lab-id']==LAB,'cluster_owner_marker_guard')
 code,ns=api('GET','/api/v1/namespaces/'+NS);need(code==200 and ns['metadata']['uid']==NSUID and ns['metadata']['labels']['manual.kubeview.local/lab-id']==LAB and ns['metadata']['annotations']['kubeview.io/audit-seal']==SEAL and not ns['metadata'].get('deletionTimestamp'),'namespace_UID_owner_seal_guard')
def birth(pid):
 p=subprocess.run(['/bin/ps','-p',str(pid),'-o','lstart=','-o','command='],capture_output=True,text=True,timeout=2);return p.stdout.strip() if p.returncode==0 else None
def process_tree(anchor):
 raw=subprocess.check_output(['/bin/ps','-axo','pid=,ppid='],text=True,timeout=2);parents={int(b[0]):int(b[1]) for row in raw.splitlines() if len(b:=row.split())==2};found={anchor}
 while True:
  n=len(found);found.update(p for p,parent in parents.items() if parent in found)
  if len(found)==n:break
 for pid in found:
  if pid not in captured:
   identity=birth(pid)
   if identity:captured[pid]=identity
def stop_owned(p,identity):
 if p and p.poll() is None:
  need(birth(p.pid)==identity and os.getpgid(p.pid)==p.pid,'owned_PID_birth_PGID_guard');os.killpg(p.pid,signal.SIGTERM)
  try:p.wait(timeout=3)
  except subprocess.TimeoutExpired:
   need(birth(p.pid)==identity and os.getpgid(p.pid)==p.pid,'owned_PID_birth_PGID_recheck');os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=2)
try:
 need(not (A/'execution-result.json').exists() and not PRIVATE.exists(),'one_shot_fresh_state')
 need(sha(APP)==APP_SHA,'app_hash');proof['powerBefore']=power()
 files=['frontend/e2e/release-secret-purpose-browser.mjs','frontend/src/workbench/ResourceDetails.jsx','frontend/src/workbench/ResourceForms.jsx','frontend/src/workbench/secretPayload.js','frontend/dist/index.html','backend/internal/webui/dist/index.html','backend/pkg/server/server.go','backend/pkg/server/resources.go']
 hashes={p:sha(R/p) for p in files};save('source-before.json',hashes)
 port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:19843','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);need(port.returncode==1 and not port.stdout,'owned_app_port_not_free')
 PRIVATE.mkdir(mode=0o700);dataDir=PRIVATE/'app-data';dataDir.mkdir(mode=0o700)
 config=json.loads((S/'private/admin.json').read_text());cc=next(c['context'] for c in config['contexts'] if c['name']==PROFILE);cl=next(c['cluster'] for c in config['clusters'] if c['name']==cc['cluster']);auth=next(c['user'] for c in config['users'] if c['name']==cc['user']);apiBase=cl['server'];u=urllib.parse.urlparse(apiBase)
 need(u.scheme=='https' and u.hostname=='127.0.0.1' and not cl.get('insecure-skip-tls-verify') and not auth.get('exec') and not auth.get('auth-provider'),'verified_private_loopback_static_config')
 tls=ssl.create_default_context(cadata=base64.b64decode(cl['certificate-authority-data']).decode())
 for key,name in [('client-certificate-data','cert.pem'),('client-key-data','key.pem')]:
  path=PRIVATE/name;fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
  with os.fdopen(fd,'wb') as f:f.write(base64.b64decode(auth[key]))
 tls.load_cert_chain(PRIVATE/'cert.pem',PRIVATE/'key.pem');opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPSHandler(context=tls))
 guard();code,inventory=api('GET','/api/v1/namespaces/'+NS+'/secrets',metadata=True);need(code==200 and inventory.get('kind')=='PartialObjectMetadataList' and 'items' in inventory and (inventory['items'] is None or isinstance(inventory['items'],list) and len(inventory['items'])==0),'fresh_namespace_metadata_only_Secret_inventory')
 profile=S/'minikube/.minikube/profiles'/PROFILE/'config.json';profileBefore=sha(profile);labBefore=sha(S/'lab.json')
 code,nodes=api('GET','/api/v1/nodes');need(code==200,'original_nodes_read');nodeBefore={n['metadata']['name']:n['metadata']['uid'] for n in nodes['items']};need(nodeBefore=={PROFILE:'a80b27ed-deed-43de-9554-8309fe9b03b3',PROFILE+'-m02':'90103b01-6c31-4690-8bd0-31fa968af1ce'},'original_Node_UIDs')
 run=secrets.token_hex(8);name='kv-secret-ui-'+run;value=secrets.token_hex(24);privateAnnotation='private-synthetic-'+secrets.token_hex(24);labelKey='kubeview.io/secret-ui-run';secretPath='/api/v1/namespaces/'+NS+'/secrets/'+name
 step='create_unique_synthetic_Secret';guard();code,secret=api('POST','/api/v1/namespaces/'+NS+'/secrets',{'apiVersion':'v1','kind':'Secret','metadata':{'name':name,'namespace':NS,'labels':{labelKey:run,'manual.kubeview.local/lab-id':LAB,'unknown-label':'keep'},'annotations':{'unknown.example/annotation':'preserve','kubectl.kubernetes.io/last-applied-configuration':privateAnnotation}},'type':'Opaque','data':{'payload':base64.b64encode(value.encode()).decode()}});need(code==201,'synthetic_Secret_create');ownedUID=secret['metadata']['uid'];save('fixture-receipt.json',{'name':name,'namespace':NS,'namespaceUID':NSUID,'UID':ownedUID,'labelKey':labelKey,'run':run,'createdAt':utc()})
 private={'name':name,'namespace':NS,'uid':ownedUID,'secret':secret,'value':value,'privateAnnotation':privateAnnotation,'newLabelKey':'ui.example/unknown-label','newLabelValue':'added-through-normal-UI','newAnnotationKey':'ui.example/unknown-annotation','newAnnotationValue':'added-through-normal-UI','indexSHA256':'0e478e0c9241d599e651eedcb65b10b31f37e0be1a89e380434a239a817032a3'}
 privateFile=PRIVATE/'fixture.json';fd=os.open(privateFile,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w') as f:json.dump(private,f)
 event('synthetic_Secret_created',UID=ownedUID,namespaceUID=NSUID)
 step='start_exact_private_app';env={'HOME':str(Path.home()),'PATH':'/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin','KUBECONFIG':str(S/'private/admin.json'),'READ_ONLY':'false','WATCH_NAMESPACE':NS,'KV_MINIKUBE_ENABLED':'false','KV_HUBBLE_ENABLED':'false','KUBEVIEW_REPLAY':''}
 argv=[str(APP),'--write','--context',PROFILE,'--namespace',NS,'--kubeconfig',str(S/'private/admin.json'),'--data-dir',str(dataDir),'--bind','127.0.0.1','--port','19843'];app=subprocess.Popen(argv,env=env,cwd=PRIVATE,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True);appBirth=birth(app.pid);need(appBirth,'app_birth');event('app_started',PID=app.pid,birthSHA256=hashlib.sha256(appBirth.encode()).hexdigest(),PGID=os.getpgid(app.pid))
 ready=time.time()+15
 while time.time()<ready:
  need(app.poll() is None,'app_exited_before_ready')
  listeners=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:19843','-sTCP:LISTEN','-t'],capture_output=True,text=True,timeout=2).stdout.split()
  if set(listeners)=={str(app.pid)}:break
  time.sleep(.1)
 else:raise RuntimeError('app_listener_not_ready')
 step='single_browser_job';node=Path.home()/'.nvm/versions/node/v24.16.0/bin/node';nodeEnv=dict(os.environ);nodeEnv.update(KV_SECRET_UI_OUTPUT=str(A),KV_SECRET_UI_PRIVATE=str(privateFile))
 with (A/'browser.stdout').open('wb') as stdout:
  browser=subprocess.Popen([str(node),str(R/'frontend/e2e/release-secret-purpose-browser.mjs')],cwd=R/'frontend',env=nodeEnv,stdin=subprocess.DEVNULL,stdout=stdout,stderr=subprocess.DEVNULL,start_new_session=True);browserBirth=birth(browser.pid);browserEnd=min(time.time()+125,PHASE+150);served=set()
  while browser.poll() is None:
   need(time.time()<browserEnd,'browser_finite_deadline');process_tree(browser.pid)
   request=PRIVATE/'guard-request.json'
   if request.exists():
    try:sequence=json.loads(request.read_text())['sequence']
    except (ValueError,KeyError):sequence=None
    if sequence is not None and sequence not in served:
     guard();(PRIVATE/f'guard-reply-{sequence}.json').write_text(json.dumps({'ok':True}));served.add(sequence);event('live_UI_write_guard',sequence=sequence,namespaceUID=NSUID)
   time.sleep(.1)
 proof['browserExitCode']=browser.wait();need((A/'browser-result.json').exists(),'browser_result_missing');bresult=json.loads((A/'browser-result.json').read_text());proof['browserStatus']=bresult['status'];need(bresult['status']=='PASS','browser_did_not_PASS')
 step='exact_own_Secret_canonical_readback';guard();code,metadataOnly=api('GET',secretPath,metadata=True);need(code==200 and metadataOnly['metadata']['uid']==ownedUID and metadataOnly['metadata']['labels'].get(labelKey)==run,'own_Secret_UID_guard');code,stored=api('GET',secretPath);need(code==200,'own_Secret_readback')
 expectedLabels={**secret['metadata']['labels'],private['newLabelKey']:private['newLabelValue']};expectedAnnotations={**secret['metadata']['annotations'],private['newAnnotationKey']:private['newAnnotationValue']}
 need(stored['metadata']['uid']==ownedUID and stored.get('type')==secret.get('type') and stored.get('data')==secret.get('data') and stored['metadata']['labels']==expectedLabels and stored['metadata']['annotations']==expectedAnnotations,'UI_roundtrip_data_type_UID_unknown_metadata_changed')
 need(stored['metadata']['resourceVersion']==bresult['acceptedResourceVersion'],'UI_accepted_RV_canonical_readback_mismatch');event('canonical_own_Secret_readback',UID=ownedUID,resourceVersion=stored['metadata']['resourceVersion'],dataEqual=True,typeEqual=True,oldUnknownMetadataEqual=True,newMetadataObserved=True)
 proof['status']='PASS'
except BaseException as error:
 proof['firstFailure']={'step':step,'class':type(error).__name__,'safeCategory':str(error) if isinstance(error,RuntimeError) else 'details_omitted'}
finally:
 cleanupStart=time.time();proof['cleanupStartedAt']=utc()
 try:
  if browser:stop_owned(browser,browserBirth)
  for pid,identity in reversed(list(captured.items())):
   if birth(pid)==identity:
    os.kill(pid,signal.SIGTERM);proof['appCleanup'].append({'browserDescendantPID':pid,'SIGTERMExactIdentity':True})
  if app:stop_owned(app,appBirth)
 except BaseException as error:proof['status']='FAIL';proof['processCleanupErrorClass']=type(error).__name__
 try:
  if ownedUID:
   guard();code,obj=api('GET',secretPath,metadata=True);need(code==200 and obj['metadata']['uid']==ownedUID and obj['metadata']['labels'].get(labelKey)==run,'cleanup_Secret_exact_UID_owner');code,_=api('DELETE',secretPath,{'apiVersion':'v1','kind':'DeleteOptions','preconditions':{'uid':ownedUID,'resourceVersion':obj['metadata']['resourceVersion']}});need(code==200,'exact_Secret_delete_status');code,_=api('GET',secretPath,metadata=True);need(code==404,'exact_Secret_GET404');proof['SecretCleanup']={'UID':ownedUID,'GET':404,'namespaceNotDeleted':True};need(sha(profile)==profileBefore and sha(S/'lab.json')==labBefore,'profile_lab_bytes_changed')
  proof['privateFilesRemoved']=PRIVATE.exists()
  if PRIVATE.exists():shutil.rmtree(PRIVATE)
 except BaseException as error:proof['status']='FAIL';proof['fixtureCleanupError']={'class':type(error).__name__,'safeCategory':str(error) if isinstance(error,RuntimeError) else 'details_omitted'}
 port=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:19843','-sTCP:LISTEN','-t'],capture_output=True,timeout=2);proof['port19843Free']=port.returncode==1 and not port.stdout
 if not proof['port19843Free']:proof['status']='FAIL'
 proof['cleanupSeconds']=time.time()-cleanupStart
 if proof['cleanupSeconds']>45:proof['status']='FAIL'
 proof.update(completedAt=utc(),phaseElapsedSeconds=time.time()-PHASE,appPIDAbsent=app is None or birth(app.pid) is None,browserProcessExited=browser is None or browser.poll() is not None,appBinaryUnchanged=sha(APP)==APP_SHA)
 save('execution-result.json',proof)
 print(json.dumps({'status':proof['status'],'phaseElapsedSeconds':proof['phaseElapsedSeconds'],'cleanup':proof.get('SecretCleanup'),'firstFailure':proof.get('firstFailure')}))
raise SystemExit(0 if proof['status']=='PASS' else 1)
