"""One real HTTP two-app physical profile lock/restart test; no worker POST."""
from pathlib import Path
import datetime, errno, hashlib, importlib.util, json, os, re, shutil, signal, subprocess, sys, time, traceback, uuid
sys.dont_write_bytecode = True
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
STATE=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
HELPER=ROOT/'scripts/release-provider-lab.py'
HELPER_SHA='4613d23a1efc216c4de4c2027cf164de77593e902fdb6ddc66da560b8aedbab5'
APP=ROOT/'.git/release-audit/candidate-runtime-profilelock10/kubeview'
APP_SHA='5f1c22b90297f6ab870ce235faaa73e1591d324ff77bf9cc4d8b4ed18cefb097'
SOURCE='f32d6b2345c0e9fcf350b83ec9a5e9d3fc651e12'
PROFILE_SHA='4733b8f4870354b6bd0404dfe3d912dca704d1e5f392eb9fe3f397516db8da1c'
CONTROL=STATE/'private/release-provider-profilelock-http-retest-20261112'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
utc=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def need(ok,reason):
    if not ok:raise RuntimeError(reason)
def save(name,value):(OUT/name).write_text(json.dumps(value,indent=2)+'\n')
def safe_error(exc):
    value={'errorClass':type(exc).__name__,'trace':[{'file':Path(f.filename).name,'line':f.lineno,'function':f.name} for f in traceback.extract_tb(exc.__traceback__)]}
    if isinstance(exc,OSError):value.update(errno=exc.errno,errnoSymbol=errno.errorcode.get(exc.errno))
    if type(exc).__name__ in ('Guard','LabError','RuntimeError','TimeoutError'):value['safeCategory']=str(exc)
    reason=getattr(exc,'reason',None)
    if reason is not None:
        value['reasonClass']=type(reason).__name__
        if isinstance(reason,OSError):value.update(reasonErrno=reason.errno,reasonErrnoSymbol=errno.errorcode.get(reason.errno))
    return value
def global_stats():
    files={Path.home()/'.kube/config'}|{Path(p).expanduser() for p in os.environ.get('KUBECONFIG','').split(os.pathsep) if p};result={}
    for p in files:
        try:
            s=p.stat();result[str(p.absolute())]={'exists':True,'device':s.st_dev,'inode':s.st_ino,'bytes':s.st_size,'mtimeNs':s.st_mtime_ns,'ctimeNs':s.st_ctime_ns}
        except FileNotFoundError:result[str(p.absolute())]={'exists':False}
    return result
def power_check():
    raw=subprocess.check_output(['/usr/bin/pmset','-g','batt'],text=True,timeout=2);match=re.search(r'(\d+)%',raw);free=shutil.disk_usage(ROOT).free
    row={'at':utc(),'batteryPercent':int(match[1]) if match else None,'AC':'AC Power'in raw,'freeDiskBytes':free};power.append(row)
    need(match is not None and row['batteryPercent']>=25 and free>=10*1024**3,'battery25_disk10GiB_guard')
def event(name,**fields):
    proof['events'].append({'at':utc(),'event':name,**fields});print(json.dumps(proof['events'][-1]),flush=True)
def source_identity():
    fields={'providerSHA256':'backend/pkg/server/provider_handlers.go','provisionSHA256':'backend/pkg/provision/minikube.go','embeddedIndexSHA256':'backend/internal/webui/dist/index.html','frontendIndexSHA256':'frontend/dist/index.html','goModSHA256':'backend/go.mod','goSumSHA256':'backend/go.sum'}
    hashes={key:sha(ROOT/path) for key,path in fields.items()}
    need(all(hashes[k]==build[k] for k in fields),'build_runtime_source_bytes_mismatch')
    changed=subprocess.check_output(['git','diff','--name-only',SOURCE,'HEAD','--'],cwd=ROOT,text=True,timeout=3).splitlines()
    need(not any(p.startswith(('backend/','frontend/src/')) or p in ('frontend/package.json','frontend/package-lock.json') for p in changed),'runtime_HEAD_source_changed_since_private_build')
    return {'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True,timeout=3).strip(),'privateAppBuildSource':SOURCE,'headPathsChangedSinceBuild':changed,'runtimeInputsMatchBuildReceipt':True,'runtimeHashes':hashes,'helperSHA256':sha(HELPER),'binarySHA256':sha(APP)}
def processes(tx):
    raw=subprocess.check_output(['/bin/ps','-axo','pid=,ppid=,pgid=,comm='],text=True,timeout=2);rows={}
    for row in raw.splitlines():
        bits=row.strip().split(None,3)
        if len(bits)==4:rows[int(bits[0])]={'ppid':int(bits[1]),'pgid':int(bits[2]),'basename':Path(bits[3]).name}
    descendants={tx.app.pid}
    while True:
        before=len(descendants);descendants.update(pid for pid,row in rows.items() if row['ppid'] in descendants)
        if before==len(descendants):break
    return [{'pid':pid,**row} for pid,row in rows.items() if pid!=tx.app.pid and (pid in descendants or row['pgid']==tx.app.pid)]
def node_metadata(nodes):
    keys=('name','uid','creationTimestamp','generation','labels','annotations','ownerReferences','finalizers')
    return {n['metadata']['name']:{'metadata':{k:n['metadata'][k] for k in keys if k in n['metadata']},'specSHA256':hashlib.sha256(json.dumps(n['spec'],sort_keys=True,separators=(',',':')).encode()).hexdigest()} for n in nodes}
def module(name,port,control):
    spec=importlib.util.spec_from_file_location('profile_lock_http_'+name+'_'+uuid.uuid4().hex,HELPER);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    need(m.RUN_CLEARED is False,'source_run_add_gate_changed')
    m.APP,m.APP_SHA,m.PORT,m.CONTROL,m.JOURNAL=APP,APP_SHA,port,control,control/('http-'+name+'.json')
    tx=m.Transaction('check');tx.power=power_check;tx.mod.global_configs=global_stats;tx.budget.limit=started+280;tx.budget.hard=started+295;tx.budget.start_watchdog()
    tx.j={'schema':1,'issued':False,'purpose':'HTTP profile ownership only; no worker POST','timeline':[]}
    original=tx.http_request
    def only_allowed(method,path,body=None,management=False):
        global next_request_at
        need(method=='GET' or (method=='POST' and path=='/api/management'),'HTTP_method_path_allowlist')
        now=time.monotonic()
        if now<next_request_at:time.sleep(next_request_at-now)
        request_at=time.monotonic();next_request_at=request_at+.125
        row={'app':name,'method':method,'path':path,'elapsedSeconds':round(time.time()-started,6)};request_times.append(request_at)
        try:
            code,doc=original(method,path,body,management);row['status']=code;return code,doc
        except BaseException as exc:
            row['errorClass']=type(exc).__name__;raise
        finally:requests.append(row)
    tx.http_request=only_allowed;apps.append((name,m,tx));return m,tx
def inspect(name,m,tx,available):
    code,info=tx.http_request('GET','/api/connection')
    need(code==200 and info['context']==m.PROFILE and info['identity']['clusterUID']==m.SYSTEM and info['managementEnabled'] and not info['readOnly'],'connection_identity_management')
    code,doc=tx.http_request('GET','/api/providers');v=doc.get('minikube',{})
    need(code==200 and v.get('available') is available and v.get('canAdd') is available and v.get('operations')==[],name+'_provider_status')
    if available:need(v['configuration']=={'profile':m.PROFILE,'context':m.PROFILE,'clusterUID':m.SYSTEM,'maxNodes':3,'driver':'docker'},'provider_configuration')
    code,inventory=tx.http_request('GET','/api/providers/minikube/workers');need(code==(200 if available else 503),name+'_workers_HTTP')
    if available:need(inventory=={'operations':[]},'empty_operations_inventory')
    children=processes(tx);need(not children,'unexpected_app_child_or_process_group_member')
    event(name,available=available,canAdd=available,operationCount=0,providersHTTP=200,workersHTTP=code,context=m.PROFILE,clusterUID=m.SYSTEM,appPID=tx.app.pid,appBirth=tx.birth,appPGID=os.getpgid(tx.app.pid),port=m.PORT,children=children)
def alarm(*_):raise TimeoutError('HTTP_runtime_300s_limit')
apps=[];power=[];requests=[];request_times=[];next_request_at=0.;started=time.time();step='preflight';baseline=None;before_nodes=None;global_before=None;profile=None
proof={'status':'FAIL','startedAt':utc(),'noWorkerPOST':True,'noProviderCLIInvoked':True,'noVMOrKubernetesMutation':True,'HTTPConcurrencyLimit':2,'actualHTTPConcurrency':1,'HTTPRequestsPerSecondLimit':10,'events':[]}
signal.signal(signal.SIGALRM,alarm);signal.setitimer(signal.ITIMER_REAL,300)
try:
    need(not (OUT/'result.json').exists(),'no_automatic_rerun_over_first_result')
    need(json.loads((OUT/'post-alias-guard-result.json').read_text())['status']=='PASS','exact_owned_post_alias_guard_not_PASS')
    need(sha(HELPER)==HELPER_SHA and sha(APP)==APP_SHA,'helper_binary_identity')
    build=json.loads((APP.parent/'build.json').read_text());need(build['sourceCommit']==SOURCE and build['binarySHA256']==APP_SHA,'build_source_identity');save('build-receipt.json',build);save('source-before.json',source_identity());power_check()
    need(not CONTROL.exists(),'fresh_private_control_required');CONTROL.mkdir(mode=0o700);ca,cb=CONTROL/'A',CONTROL/'B';ca.mkdir(mode=0o700);cb.mkdir(mode=0o700)
    ma,ta=module('A',19846,ca);mb,tb=module('B',19847,cb)
    need(ma is not mb and ta.mod is not tb.mod and ta.http is not tb.http,'independent_helper_global_and_cookie_namespaces')
    profile=STATE/'minikube/.minikube/profiles'/ma.PROFILE/'config.json';need(sha(profile)==PROFILE_SHA,'original_profile_bytes');global_before=global_stats()
    with ta.lab.lock():
        step='baseline';baseline=ta.snapshot();need(all(not x for x in ta.label_targets().values()),'unexpected_worker_target');nodes=ta.guard();before_nodes=node_metadata(nodes)
        need(len(nodes)==2 and all(any(c['type']=='Ready' and c['status']=='True' for c in n['status']['conditions']) for n in nodes),'original_two_Ready')
        save('before.json',{'snapshot':baseline,'stableNodeMetadata':before_nodes,'profileSHA256':sha(profile),'globalConfigStatOnly':global_before})
        step='start_A';ta.start_app();step='inspect_A';inspect('A_owns_profile',ma,ta,True)
        step='start_B';tb.start_app();step='inspect_B';inspect('B_blocked_same_Home_Profile',mb,tb,False)
        step='stop_A_B';ta.stop_app();tb.stop_app();event('both_initial_apps_stopped',AExit=ta.app.returncode,BExit=tb.app.returncode)
        step='restart_B_same_state';mc,tc=module('BRestart',19847,cb);need(tc.mod is not tb.mod,'restart_module_namespace');tc.start_app()
        step='inspect_B_restart';inspect('B_restart_acquires_after_owner_close',mc,tc,True);step='stop_B_restart';tc.stop_app()
        step='final_invariance';after=ta.snapshot();nodes_after=ta.guard();save('after.json',{'snapshot':after,'stableNodeMetadata':node_metadata(nodes_after),'profileSHA256':sha(profile),'globalConfigStatOnly':global_stats()})
        need(after==baseline and node_metadata(nodes_after)==before_nodes and sha(profile)==PROFILE_SHA and global_stats()==global_before,'original_state_profile_global_metadata_changed')
        need(len(nodes_after)==2 and all(any(c['type']=='Ready' and c['status']=='True' for c in n['status']['conditions']) for n in nodes_after),'final_original_two_Ready')
        journals=[]
        for control in (ca,cb):
            path=control/'provider-journal'/('minikube-'+ma.PROFILE+'.json');data=path.read_bytes() if path.exists() else None
            need(data is None or json.loads(data) in (None,[]),'nonempty_provider_journal');journals.append({'app':control.name,'exists':data is not None,'literal':data.decode() if data is not None else 'ABSENT','SHA256':sha(path) if data is not None else None,'operationCount':0})
        physical=STATE/'minikube/.minikube/.kubeview-provider-locks'/('minikube-'+ma.PROFILE+'.lock');need(physical.is_file() and not physical.is_symlink() and physical.stat().st_mode&0o777==0o600,'physical_lock_file_mode')
        proof.update(status='PASS',originalBaselineEqual=True,stableNodeMetadataEqual=True,nodeMetadataComparedFields=['name','uid','creationTimestamp','generation','labels','annotations','ownerReferences','finalizers','specSHA256'],volatileNodeResourceVersionAndStatusExcluded=True,originalNodeUIDs=ma.ORIGINAL,originalTwoReady=True,profileSHA256Before=PROFILE_SHA,profileSHA256After=sha(profile),globalConfigStatEqual=True,globalConfigContentsNotRead=True,providerJournals=journals,physicalLockFile={'mode':'0600','bytes':physical.stat().st_size})
except BaseException as exc:
    proof['firstFailure']={'step':step,**safe_error(exc)}
finally:
    cleanup=[]
    for name,m,tx in reversed(apps):
        try:
            unexpected=processes(tx) if tx.app and tx.app.poll() is None else []
            if unexpected:proof['status']='FAIL'
            tx.stop_app();cleanup.append({'name':name,'pid':tx.app.pid if tx.app else None,'birth':tx.birth,'exitCode':tx.app.returncode if tx.app else None,'stopped':tx.app is None or tx.app.poll() is not None,'capturedPIDAbsent':tx.app is None or m.process_birth(tx.app.pid) is None})
            if unexpected:cleanup[-1]['unexpectedChildrenBeforeCleanup']=unexpected
        except BaseException as exc:cleanup.append({'name':name,'stopFailure':safe_error(exc)});proof['status']='FAIL'
        tx.budget.close()
    signal.setitimer(signal.ITIMER_REAL,0)
    ports=[]
    for port in (19846,19847):
        p=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:'+str(port),'-sTCP:LISTEN','-t'],capture_output=True,timeout=2);ports.append({'port':port,'noListener':p.returncode==1 and not p.stdout})
    if not all(x['noListener'] for x in ports) or not all(x.get('stopped') and x.get('capturedPIDAbsent') for x in cleanup):proof['status']='FAIL'
    if proof['status']!='PASS' and baseline is not None:
        try:
            after=apps[0][2].snapshot();nodes=apps[0][2].guard();save('post-failure-state.json',{'snapshot':after,'snapshotEqual':after==baseline,'stableNodeMetadataEqual':node_metadata(nodes)==before_nodes,'originalNodeUIDs':{n['metadata']['name']:n['metadata']['uid'] for n in nodes},'profileSHA256':sha(profile),'globalConfigStatEqual':global_stats()==global_before})
        except BaseException as exc:proof['postFailureCheckError']=safe_error(exc)
    try:save('source-after.json',source_identity());need(sha(HELPER)==HELPER_SHA and sha(APP)==APP_SHA,'helper_binary_changed');power_check()
    except BaseException as exc:proof['status']='FAIL';proof['finalIdentityError']=safe_error(exc)
    rolling=max((sum(1 for y in request_times if x<=y<x+1) for x in request_times),default=0)
    if rolling>10:proof['status']='FAIL'
    proof.update(cleanup=cleanup,ports=ports,powerPolicy=power,HTTPRequests=requests,HTTPRequestsTotal=len(requests),maxRequestsAnyOneSecond=rolling,helperUnchanged=sha(HELPER)==HELPER_SHA,runtimeElapsedSeconds=time.time()-started,runtimeLimitSeconds=300,completedAt=utc(),noAutomaticRetry=True)
    if proof['runtimeElapsedSeconds']>300:proof['status']='FAIL'
    save('result.json',proof);print(json.dumps(proof),flush=True)
sys.exit(0 if proof['status']=='PASS' else 1)
