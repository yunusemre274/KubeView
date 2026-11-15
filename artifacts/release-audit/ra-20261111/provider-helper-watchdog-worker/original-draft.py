#!/usr/bin/env python3
"""One explicit owned-lab worker transaction. Preparation never invokes run.
No arbitrary command/profile/binary/URL input; no user credentials in evidence.
"""
import argparse, contextlib, datetime as dt, hashlib, http.cookiejar, importlib.util
import fcntl, json, os, re, signal, socket, subprocess, sys, time, urllib.error, urllib.parse, urllib.request, uuid
from pathlib import Path
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent.parent
STATE = Path.home()/"Library/Application Support/KubeView/release-audit-hubble-20261111-cold01"
LAB = "kvml-d32afbf634e8"; PROFILE = LAB+"-a"; NEW = PROFILE+"-m03"
SYSTEM = "e84bb50e-8d64-4bc2-905c-9b5ba193e53a"; MARKER = "0cded75c-bc00-472f-b69f-39dfd43251f3"
ORIGINAL = {PROFILE:"a80b27ed-deed-43de-9554-8309fe9b03b3",PROFILE+"-m02":"90103b01-6c31-4690-8bd0-31fa968af1ce"}
HOSTS = {PROFILE:"97cc52cfe048288a01e4b84284b34e80ab2ea668fbe3a1dcc28309ab62a21599",PROFILE+"-m02":"c6f18a25a51468412d901a43c31f8e645df9af93a57cf886ac6d632bc52185b9"}
NETWORK = "92dbd77db18d9e5e1ae1ccb0a76fd08a2f336908e1a8fa8469d23cefd50ed002"
MINIKUBE = ROOT/".git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4"
MINI_SHA = "98e42bafefb50d652b8c4760412703d936b6201d1d6d6c27163c5f69f130ddae"
APP = ROOT/".git/release-audit/ci-package-inspection-worker/kubeview"
APP_SHA = None  # PROV-CACHE-001: root must supply a newly fixed runtime path + SHA before run.
CONTROL = STATE/"private/release-provider-one-worker-20261111"
JOURNAL = CONTROL/"attempt.json"; PORT = 19850
LABEL = "name.minikube.sigs.k8s.io"; OWNER = "manual.kubeview.local/lab-id"
ALLOWED_DS = {"kube-system/cilium","kube-system/cilium-envoy","kube-system/kube-proxy"}
class Guard(Exception): pass
def require(ok, category):
    if not ok: raise Guard(category)
def digest(value): return hashlib.sha256(value if isinstance(value,bytes) else json.dumps(value,sort_keys=True,separators=(",",":")).encode()).hexdigest()
def filehash(p): return digest(p.read_bytes())
def utc(): return dt.datetime.now(dt.timezone.utc).isoformat()
def epoch(s): return dt.datetime.fromisoformat(s.replace("Z","+00:00")).timestamp()
def atomic(path, value):
    require(path.parent.is_dir() and not path.parent.is_symlink(),"private_parent_guard")
    tmp=path.with_suffix(".tmp");fd=os.open(tmp,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,"w") as f: json.dump(value,f,indent=2);f.write("\n");f.flush();os.fsync(f.fileno())
    os.replace(tmp,path)
def command(argv, timeout=5, env=None):
    # Only internal fixed argv callers; never shell=True or browser input.
    p=subprocess.run([str(x) for x in argv],capture_output=True,timeout=timeout,env=env)
    require(p.returncode==0,"fixed_command_failed_"+Path(str(argv[0])).name)
    return p.stdout

def new_identity(record, started, network=NETWORK):
    require(record.get("name")==NEW and record.get("id") not in HOSTS.values(),"original_or_wrong_host_refused")
    require(re.fullmatch(r"[a-f0-9]{64}",record.get("id","")) is not None,"new_docker_ID_required")
    require(epoch(record["created"])>=started-1,"new_host_birth_precedes_operation")
    require(record.get("labels",{}).get(LABEL)==NEW and record["labels"].get("created_by.minikube.sigs.k8s.io")=="true","new_host_label_binding")
    require(record.get("networkID")==network,"new_host_network_binding")

def node_identity(node, record, started):
    m=node["metadata"];require(m["name"]==NEW and m["uid"] not in ORIGINAL.values(),"wrong_new_Node_identity")
    require(epoch(m["creationTimestamp"])>=started-1,"new_Node_birth_precedes_operation")
    require(not any(k in m.get("labels",{}) for k in ["node-role.kubernetes.io/control-plane","node-role.kubernetes.io/master"]),"new_Node_is_control_plane")
    ips=[x["address"] for x in node["status"].get("addresses",[]) if x["type"]=="InternalIP"]
    require(record["IP"] in ips,"Node_profile_IP_mismatch")

def cleanup_pod_guard(pods, known):
    for pod in pods:
        require(pod["spec"].get("nodeName")==NEW,"cleanup_pod_wrong_node")
        refs=[x for x in pod["metadata"].get("ownerReferences",[]) if x.get("controller")]
        require(len(refs)==1 and refs[0].get("kind")=="DaemonSet","unknown_or_workload_Pod_blocks_destructive_drain")
        key=pod["metadata"]["namespace"]+"/"+refs[0]["name"]
        require(key in ALLOWED_DS and known.get(key)==refs[0]["uid"],"unknown_DaemonSet_UID_blocks_drain")

def context_guard(context, uid): require(context==PROFILE and uid==SYSTEM,"misbound_context_or_system_UID")

def self_test():
    now=time.time();record={"name":NEW,"id":"a"*64,"created":utc(),"labels":{LABEL:NEW,"created_by.minikube.sigs.k8s.io":"true"},"networkID":NETWORK,"IP":"172.29.232.4"}
    cases=[]
    def reject(name, fn):
        try: fn()
        except Guard: cases.append(name);return
        raise AssertionError(name+" incorrectly allowed")
    new_identity(record,now);cases.append("exact_new_identity_allowed")
    reject("original_worker_rejected",lambda:new_identity({**record,"name":PROFILE+"-m02","id":HOSTS[PROFILE+"-m02"]},now))
    reject("wrong_network_rejected",lambda:new_identity({**record,"networkID":"wrong"},now))
    node={"metadata":{"name":NEW,"uid":ORIGINAL[PROFILE],"creationTimestamp":utc()},"status":{"addresses":[{"type":"InternalIP","address":record['IP']}]}}
    reject("original_Node_UID_rejected",lambda:node_identity(node,record,now))
    reject("unknown_Pod_rejected",lambda:cleanup_pod_guard([{"metadata":{"namespace":"default","ownerReferences":[]},"spec":{"nodeName":NEW}}],{}))
    reject("wrong_DaemonSet_UID_rejected",lambda:cleanup_pod_guard([{"metadata":{"namespace":"kube-system","ownerReferences":[{"controller":True,"kind":"DaemonSet","name":"cilium","uid":"wrong"}]},"spec":{"nodeName":NEW}}],{"kube-system/cilium":"known"}))
    reject("misbound_context_rejected",lambda:context_guard("wrong",SYSTEM))
    reject("misbound_system_UID_rejected",lambda:context_guard(PROFILE,"wrong"))
    print(json.dumps({"status":"PASS","pureCases":cases,"runtimeActions":False}))

class Transaction:
    def __init__(self):
        spec=importlib.util.spec_from_file_location("release_owned_manual_lab",ROOT/"scripts/manual_lab.py");self.mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.mod)
        args=self.mod.parser().parse_args(["up","--profile","06-limanlar-arasi-ag","--state-dir",str(STATE),"--minikube-binary",str(MINIKUBE)])
        self.lab=self.mod.Lab(args);self.j=None;self.app=None;self.birth=None;self.origin=f"http://127.0.0.1:{PORT}";self.scope={};self.nonce="";self.http=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def power(self):
        raw=command(["/usr/bin/pmset","-g","batt"],2).decode();m=re.search(r"(\d+)%;",raw)
        require("AC Power" in raw and m and int(m[1])>15,"power_stop")
        require(__import__('shutil').disk_usage(STATE).free>=10*1024**3,"disk_stop")
    def event(self, name, proof=None):
        self.j.setdefault("timeline",[]).append({"at":utc(),"event":name,"proof":proof});atomic(JOURNAL,self.j)
    def guard(self, allow_new=False):
        self.power();require(filehash(MINIKUBE)==MINI_SHA,"minikube_binary_hash_guard")
        d=self.lab.state;require(d['labId']==LAB and d['clusters']['a']['uid']==SYSTEM and d['clusters']['a']['markerUid']==MARKER,"stored_lab_binding")
        require(d['clusters']['a']['nodeUids']==ORIGINAL and {x['name']:x['id'] for x in d['clusters']['a']['containers']}==HOSTS,"original_lab_inventory_changed")
        self.lab.guard_cluster('a');self.lab.ns_guard('06-limanlar-arasi-ag','a','kvml-fbf634e8-06-client')
        require(next(x['uid'] for x in d['profiles']['06-limanlar-arasi-ag']['namespaces'] if x['name']=='kvml-fbf634e8-06-client')=='863e13d5-da6d-481d-9484-64eb088d8df8','namespace_UID_binding')
        nodes=self.lab.get('a','nodes')['items'];actual={x['metadata']['name']:x['metadata']['uid'] for x in nodes}
        require(all(actual.get(k)==v for k,v in ORIGINAL.items()) and set(actual)<=set(ORIGINAL)|({NEW} if allow_new else set()),'actual_original_Node_inventory_guard')
        return nodes
    def docker(self,*args): return json.loads(command(['/usr/local/bin/docker',*args],5))
    def host(self,name):
        p=subprocess.run(['/usr/local/bin/docker','inspect',name],capture_output=True,timeout=5)
        if p.returncode: return None
        x=json.loads(p.stdout)[0];nets=x['NetworkSettings']['Networks'];n=nets.get(PROFILE,{})
        return {'name':x['Name'].lstrip('/'),'id':x['Id'],'created':x['Created'],'labels':x['Config'].get('Labels',{}),'networkID':n.get('NetworkID'),'IP':n.get('IPAddress'),'mounts':[{'type':m['Type'],'name':m.get('Name')}for m in x['Mounts']]}
    def label_targets(self):
        result={}
        for kind,args in [('containers',['ps','-aq','--no-trunc']),('volumes',['volume','ls','-q']),('networks',['network','ls','-q'])]:
            result[kind]=command(['/usr/local/bin/docker',*args,'--filter','label='+LABEL+'='+NEW],5).decode().split()
        return result
    def snapshot(self):
        self.guard();hosts={n:self.host(n) for n in HOSTS};network=self.docker('network','inspect',NETWORK)[0]
        volumes={m['name']:self.docker('volume','inspect',m['name'])[0] for x in hosts.values() for m in x['mounts'] if m['type']=='volume'}
        volumes={k:{z:v.get(z) for z in ['Name','CreatedAt','Driver','Labels']}for k,v in volumes.items()}
        ds=json.loads(self.lab.kubectl('a',['get','daemonsets','--all-namespaces','-o','json'])[1])['items']
        known={x['metadata']['namespace']+'/'+x['metadata']['name']:x['metadata']['uid'] for x in ds if x['metadata']['namespace']+'/'+x['metadata']['name'] in ALLOWED_DS}
        require('kube-system/cilium' in known,'Cilium_baseline_missing')
        cilium={x['metadata']['namespace']+'/'+x['metadata']['name']:{'uid':x['metadata']['uid'],'specSHA256':digest(x['spec'])}for x in ds if x['metadata']['namespace']+'/'+x['metadata']['name'] in ALLOWED_DS}
        fixtures={}
        for ns,name in [('kvml-fbf634e8-06-client','traffic'),('kvml-fbf634e8-06-server','http-server')]:
            x=self.lab.get('a','deployment',name,ns);pods=self.lab.get('a','pods',ns=ns)['items'];fixtures[ns+'/'+name]={'uid':x['metadata']['uid'],'specSHA256':digest(x['spec']),'podUIDs':sorted(p['metadata']['uid']for p in pods)}
        return {'hosts':hosts,'network':{'id':network['Id'],'created':network['Created'],'labels':network['Labels']},'volumes':volumes,'knownDaemonSets':known,'Cilium':cilium,'fixtures':fixtures,'labFileSHA256':filehash(self.lab.file)}
    def http_request(self, method, path, body=None, management=False):
        query=dict(self.scope);query['context']=PROFILE;query['namespace']='';url=self.origin+path+('?'+urllib.parse.urlencode(query) if query else '')
        headers={'Origin':self.origin,'X-KubeView-Cluster-Impact':'acknowledged'}
        if self.nonce:headers['X-KubeView-Connection']=self.nonce
        data=None
        if body is not None: data=json.dumps(body).encode();headers['Content-Type']='application/json'
        req=urllib.request.Request(url,data=data,method=method,headers=headers)
        try:
            with self.http.open(req,timeout=8) as response:return response.status,json.load(response)
        except urllib.error.HTTPError as e:return e.code,{} # never persist raw error/payload
    def start_app(self):
        require(APP_SHA is not None and re.fullmatch(r'[a-f0-9]{64}',APP_SHA) is not None,'root_new_runtime_required_PROV_CACHE_001');require(filehash(APP)==APP_SHA,'approved_app_binary_hash_guard')
        require(not self.app,'one_gateway_only');sock=socket.socket();sock.bind(('127.0.0.1',PORT));sock.close()
        home=STATE/'minikube/.minikube';env={'HOME':str(Path.home()),'PATH':'/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin','KUBECONFIG':str(STATE/'private/admin.json'),'READ_ONLY':'false','KV_HUBBLE_ENABLED':'false','KV_MINIKUBE_ENABLED':'true','KV_MINIKUBE_BINARY':str(MINIKUBE),'KV_MINIKUBE_PROFILE':PROFILE,'KV_MINIKUBE_CONTEXT':PROFILE,'KV_MINIKUBE_CLUSTER_UID':SYSTEM,'KV_MINIKUBE_HOME':str(home),'KV_MINIKUBE_MAX_NODES':'3','KV_PROVIDER_STATE_DIR':str(CONTROL/'provider-journal')}
        args=[str(APP),'--write','--context',PROFILE,'--kubeconfig',str(STATE/'private/admin.json'),'--data-dir',str(CONTROL/'app-data'),'--bind','127.0.0.1','--port',str(PORT)]
        self.app=subprocess.Popen(args,cwd=CONTROL,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
        self.birth=command(['/bin/ps','-p',str(self.app.pid),'-o','lstart='],2).decode().strip();require(self.birth,'owned_app_birth_missing')
        for _ in range(50):
            require(self.app.poll() is None,'owned_app_exited')
            try: code,doc=self.http_request('GET','/api/workspace');break
            except (OSError,urllib.error.URLError):time.sleep(.1)
        else:raise Guard('owned_app_not_ready')
        require(code==200 and len(doc['harbors'])==1,'private_workspace_bootstrap')
        listeners=command(['/usr/sbin/lsof','-nP','-iTCP:'+str(PORT),'-sTCP:LISTEN','-t'],2).decode().split();require(set(listeners)=={str(self.app.pid)},'gateway_port_PID_binding')
        self.scope={'workspaceId':doc['id'],'harborId':doc['harbors'][0]['id'],'tabId':'owned-provider-once'}
        code,info=self.http_request('GET','/api/connection');require(code==200 and info['readOnly'] and not info['managementEnabled'],'browser_initially_readonly')
        context_guard(info['context'],info['identity']['clusterUID']);self.nonce=info['connectionID']
        code,_=self.http_request('POST','/api/management',{'enabled':True,'context':PROFILE,'namespace':'','connectionID':self.nonce});require(code==200,'explicit_management_enable_failed')
        self.event('owned_gateway_management_enabled',{'pid':self.app.pid,'birth':self.birth,'port':PORT})
    def adopt(self, started):
        self.guard(True);h=self.host(NEW);require(h is not None,'expected_new_host_missing');new_identity(h,started)
        node=self.lab.get('a','node',NEW);require(node is not None,'new_Node_not_registered');node_identity(node,h,started)
        p=json.loads((STATE/'minikube/.minikube/profiles'/PROFILE/'config.json').read_text());match=[x for x in p['Nodes'] if x.get('Name') in ['m03',NEW]]
        require(len(match)==1 and not match[0].get('ControlPlane') and match[0].get('IP')==h['IP'],'profile_new_machine_binding')
        record={**h,'NodeUID':node['metadata']['uid'],'nodeCreationTimestamp':node['metadata']['creationTimestamp'],'role':'worker','ready':any(c['type']=='Ready'and c['status']=='True'for c in node['status']['conditions'])}
        old=self.j.get('new');require(old is None or all(old[k]==record[k] for k in ['id','created','NodeUID','IP','networkID']),'recorded_new_identity_changed');self.j['new']=record;self.event('new_host_and_Node_adopted',{'dockerID':record['id'],'NodeUID':record['NodeUID'],'ready':record['ready']});return record
    def cleanup(self):
        require(self.j and self.j.get('issued') and self.j.get('new'),'cleanup_requires_durable_exact_new_record')
        if self.j.get('cleanupComplete'):
            require(self.host(NEW) is None and self.lab.get('a','node',NEW) is None and all(not x for x in self.label_targets().values()),'completed_cleanup_resource_reappeared')
            require(self.snapshot()==self.j['baseline'],'completed_cleanup_originals_changed');return
        record=self.j['new'];started=epoch(self.j['operationStartedAt']);self.guard(True);h=self.host(NEW);require(h is not None,'partial_cleanup_host_missing_stop');new_identity(h,started)
        require(all(h[k]==record[k] for k in ['id','name','created','networkID','IP']),'cleanup_Docker_identity_changed')
        node=self.lab.get('a','node',NEW);require(node is not None and node['metadata']['uid']==record['NodeUID'],'cleanup_Node_UID_changed_or_absent');node_identity(node,h,started)
        pods=json.loads(self.lab.kubectl('a',['get','pods','--all-namespaces','--field-selector','spec.nodeName='+NEW,'-o','json'])[1])['items'];cleanup_pod_guard(pods,self.j['baseline']['knownDaemonSets'])
        targets=self.label_targets();require(set(targets['containers'])=={record['id']} and not targets['networks'],'cleanup_label_filter_not_exclusive')
        require(set(targets['volumes'])<=set(m['name']for m in record['mounts']if m['type']=='volume'),'cleanup_unknown_volume_target')
        require(not set(targets['volumes'])&set(self.j['baseline']['volumes']),'cleanup_original_volume_targeted')
        self.event('cleanup_exact_target_and_DaemonSet_Pods_verified',{'dockerID':record['id'],'NodeUID':record['NodeUID'],'podUIDs':[p['metadata']['uid']for p in pods],'labelTargets':targets})
        env=self.lab.env();command([MINIKUBE,'--profile',PROFILE,'node','delete',NEW],150,env)
        require(self.lab.get('a','node',NEW) is None and self.host(NEW) is None,'cleanup_new_Node_or_host_remains');require(all(not x for x in self.label_targets().values()),'cleanup_label_resources_remain')
        after=self.snapshot();require(after==self.j['baseline'],'original_cluster_fixture_Cilium_volume_profile_state_changed');self.j['cleanupComplete']=True;self.event('cleanup_restored_exact_originals')
    def stop_app(self):
        if self.app and self.app.poll() is None:
            require(command(['/bin/ps','-p',str(self.app.pid),'-o','lstart='],2).decode().strip()==self.birth,'app_PID_reused_no_kill')
            self.app.send_signal(signal.SIGTERM);self.app.wait(timeout=10)
    def run(self):
        require(not CONTROL.exists(),'existing_attempt_refuse_rePOST_use_cleanup');CONTROL.mkdir(mode=0o700)
        start=time.time();baseline=self.snapshot();require(all(not x for x in self.label_targets().values()),'new_target_preexists')
        key=uuid.uuid4().hex;self.j={'schema':1,'startedAt':utc(),'issued':False,'expectedMachine':NEW,'baseline':baseline,'timeline':[],'keyHash':digest((PROFILE+'\x00'+key).encode())};self.event('durable_plan_before_any_POST',{'MaxNodes':3,'expected':NEW,'cleanupReserveSeconds':180,'reportReserveSeconds':60})
        try:
            self.start_app();self.guard();require(time.time()-start<150 and 720-(time.time()-start)>=240,'setup_or_cleanup_reserve_gate')
            self.j['issued']=True;self.j['operationStartedAt']=utc();self.event('POST_intent_committed_no_replay_after_interruption')
            body={'action':'add-worker','idempotencyKey':key};code,first=self.http_request('POST','/api/providers/minikube/workers',body);require(code==202,'first_POST_not_accepted')
            opid=first['operation']['id'];self.j['operationID']=opid;self.event('first_POST_accepted',{'operationID':opid});self.guard(True)
            code,second=self.http_request('POST','/api/providers/minikube/workers',body);require(code==202 and second['operation']['id']==opid,'same_key_not_one_operation');self.event('same_key_second_POST_same_operation',{'operationID':opid})
            exited=None;cancelled=False
            while True:
                self.power();require(time.time()-start<480,'work_deadline_cleanup_reserve')
                code,state=self.http_request('GET','/api/providers/minikube/workers');require(code==200 and len(state['operations'])==1,'operation_inventory_changed');op=state['operations'][0];require(op['id']==opid,'operation_ID_changed')
                self.event('operation_observation',{k:op.get(k)for k in ['id','status','expectedName','nodeName','nodeUID','processPID','processExited','claimVerified','stageSource']})
                if op.get('claimVerified') and self.host(NEW) is not None and self.lab.get('a','node',NEW) is not None:
                    self.adopt(epoch(self.j['operationStartedAt']))
                if op.get('processExited') and exited is None:exited=time.time()
                if op.get('status')=='ready':
                    require(op.get('claimVerified') and op.get('processExited'),'Ready_without_CLI_claim_or_exit');record=self.adopt(epoch(self.j['operationStartedAt']));require(record['ready'] and op['nodeUID']==record['NodeUID'],'actual_new_kubelet_not_Ready');self.j['readyVerified']=True;break
                if time.time()-epoch(self.j['operationStartedAt'])>275 and not cancelled:
                    self.http_request('POST','/api/providers/minikube/workers',{'action':'cancel','id':opid});cancelled=True;self.event('bounded_CLI_cancel_requested')
                require(not cancelled or time.time()-epoch(self.j['operationStartedAt'])<300,'CLI_cancel_not_observed')
                require(exited is None or time.time()-exited<90,'Ready_observation_timeout')
                time.sleep(1)
            self.cleanup()
        finally:self.stop_app()

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('phase',choices=['self-test','check','run','cleanup']);parser.add_argument('--confirm-owned',default='');args=parser.parse_args()
    if args.phase=='self-test':self_test();return 0
    expected=LAB+':'+('add-exact-m03' if args.phase=='run' else 'cleanup-recorded-m03' if args.phase=='cleanup' else 'check-only')
    require(args.confirm_owned==expected,'exact_owned_opt_in_required')
    if args.phase=='run':require(APP_SHA is not None,'root_new_runtime_required_PROV_CACHE_001')
    tx=Transaction()
    with tx.lab.lock():
        if args.phase=='check':
            tx.snapshot();require(all(not x for x in tx.label_targets().values()),'new_target_preexists');print(json.dumps({'status':'CHECK_PASS','mutations':False}));return 0
        if args.phase=='run':tx.run()
        else:
            require(JOURNAL.is_file() and not JOURNAL.is_symlink() and JOURNAL.stat().st_uid==os.getuid() and JOURNAL.stat().st_mode&0o077==0,'private_journal_required');tx.j=json.loads(JOURNAL.read_text());require(tx.j.get('schema')==1 and tx.j.get('expectedMachine')==NEW,'journal_binding')
            lock=CONTROL/'provider-journal'/('minikube-'+PROFILE+'.lock')
            with lock.open('a+') as handle:
                fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB);tx.cleanup()
    print(json.dumps({'status':'COMPLETE','journalPath':str(JOURNAL),'cleanupComplete':bool(tx.j.get('cleanupComplete'))}));return 0
if __name__=='__main__':
    try:sys.exit(main())
    except Guard as exc:print(json.dumps({'status':'BLOCKED_OR_FAILED','safeCategory':str(exc),'noAutomaticRetry':True}));sys.exit(2)
    except Exception as exc:print(json.dumps({'status':'FAILED','errorClass':type(exc).__name__,'detailsOmitted':True,'noAutomaticRetry':True}));sys.exit(2)
