#!/usr/bin/env python3
"""One explicit owned-lab worker transaction. Preparation never invokes run.
No arbitrary command/profile/binary/URL input; no user credentials in evidence.
"""
import argparse, contextlib, datetime as dt, hashlib, http.cookiejar, importlib.util
import fcntl, json, os, re, selectors, signal, socket, subprocess, sys, threading, time, urllib.error, urllib.parse, urllib.request, uuid
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
APP = ROOT/".git/release-audit/candidate-runtime-provider09/kubeview"
APP_SHA = "f9e70b607c1689800f253ccaa6841d05e3a6951e6c032f837b7cf78f1dd4ecd4"
RUN_CLEARED = False  # root must explicitly checkpoint and authorize HTTP/live phases.
CONTROL = STATE/"private/release-provider-one-worker-20261111"
JOURNAL = CONTROL/"attempt.json"; PORT = 19849
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
def process_birth(pid):
    p=subprocess.run(['/bin/ps','-p',str(pid),'-o','lstart='],capture_output=True,text=True,timeout=1)
    return p.stdout.strip() if p.returncode==0 else None

class OwnedGroup:
    """Signal only a group with a still-live captured PID/birth anchor."""
    def __init__(self, pgid, probe=process_birth, group=os.getpgid, send=os.killpg):
        self.pgid=pgid;self.probe=probe;self.group=group;self.send=send;self.anchors={};self.lock=threading.Lock()
    def capture(self,pid,birth):
        require(bool(birth) and self.probe(pid)==birth and self.group(pid)==self.pgid,'owned_group_capture_binding')
        with self.lock:self.anchors[pid]=birth
    def signal(self,sig):
        with self.lock:anchors=dict(self.anchors)
        for pid,birth in anchors.items():
            try:
                if self.probe(pid)==birth and self.group(pid)==self.pgid:
                    self.send(self.pgid,sig);return True
            except (ProcessLookupError,subprocess.TimeoutExpired):pass
        return False # Never signal an unanchored/reused PID/group.
    def stop(self):
        sent=self.signal(signal.SIGTERM)
        if sent:
            time.sleep(.3)
            self.signal(signal.SIGKILL) # Same identity guard is repeated.
        return sent

class DeadlineBudget:
    def __init__(self, mode='run', clock=time.time):
        self.clock=clock;self.start=clock();self.mode=mode;self.stage='work';self.expired=None
        self.limit=self.start+(475 if mode=='run' else 175 if mode=='cleanup' else 115)
        self.hard=self.start+(655 if mode=='run' else 175 if mode=='cleanup' else 115)
        self.cli=None;self.group=None;self.events=[];self.halt=threading.Event();self.lock=threading.Lock();self.thread=None;self.io_groups=[]
    def add_io_group(self,group):
        with self.lock:self.io_groups.append(group);expired=self.expired is not None
        if expired:group.stop()
    def remove_io_group(self,group):
        with self.lock:
            if group in self.io_groups:self.io_groups.remove(group)
    def deadline(self):
        with self.lock:return self.limit
    def check(self):
        self.poll();require(self.expired is None,'deadline_'+str(self.expired))
    def poll(self):
        now=self.clock()
        with self.lock:
            reason='CLI_300s' if self.cli is not None and now>=self.cli else 'global_or_'+self.stage if now>=self.limit else None
            if reason and self.expired is None:
                self.expired=reason;self.events.append({'reason':reason,'at':now,'overshootSeconds':max(0,now-(self.cli if reason=='CLI_300s' else self.limit))})
                groups=([self.group] if self.group else [])+list(self.io_groups)
            else:groups=[]
        for group in groups:group.stop()
    def begin_cleanup(self):
        with self.lock:
            if self.stage!='cleanup':
                self.stage='cleanup';self.cli=None;self.limit=min(self.clock()+175,self.hard);self.expired=None
        self.check()
    def start_watchdog(self):
        def watch():
            while not self.halt.wait(.1):self.poll()
        self.thread=threading.Thread(target=watch,name='owned-provider-deadline',daemon=True);self.thread.start()
    def close(self):
        self.halt.set()
        if self.thread:self.thread.join(timeout=2)

def bounded_process(argv,timeout=5,env=None,deadline=None,controller=None):
    """Finite I/O (2MiB total); terminate only this new command's PID group."""
    end=min(time.time()+timeout,deadline if deadline is not None else float('inf'))
    require(end>time.time(),'I_O_deadline_expired')
    p=subprocess.Popen([str(x)for x in argv],stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,start_new_session=True)
    owned=OwnedGroup(p.pid);owned.capture(p.pid,process_birth(p.pid))
    if controller:controller.add_io_group(owned)
    sel=selectors.DefaultSelector();sel.register(p.stdout,selectors.EVENT_READ,0);sel.register(p.stderr,selectors.EVENT_READ,1);buffers=[bytearray(),bytearray()]
    try:
        while sel.get_map():
            require(time.time()<end,'fixed_command_timeout')
            for key,_ in sel.select(timeout=min(.1,max(.001,end-time.time()))):
                data=os.read(key.fileobj.fileno(),65536)
                if not data:sel.unregister(key.fileobj);continue
                buffers[key.data].extend(data);require(sum(map(len,buffers))<=2*1024*1024,'fixed_command_output_limit')
        code=p.wait(timeout=max(.001,min(.5,end-time.time())))
        return code,bytes(buffers[0]),bytes(buffers[1])
    finally:
        sel.close()
        if controller:controller.remove_io_group(owned)
        if p.poll() is None:owned.stop();p.wait(timeout=2)
        p.stdout.close();p.stderr.close()

def command(argv, timeout=5, env=None, deadline=None,controller=None):
    code,out,_=bounded_process(argv,timeout,env,deadline,controller)
    require(code==0,'fixed_command_failed_'+Path(str(argv[0])).name);return out

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

def canonical_mounts(records):
    # Preserve every record and multiplicity; order alone is not mount identity.
    return sorted(records,key=lambda item:json.dumps(item,sort_keys=True))

def context_guard(context, uid): require(context==PROFILE and uid==SYSTEM,"misbound_context_or_system_UID")

def cleanup_record(journal):
    require(isinstance(journal,dict) and journal.get('schema')==1 and journal.get('issued') and journal.get('expectedMachine')==NEW and journal.get('new'),'cleanup_requires_durable_exact_new_record')
    record=journal['new'];new_identity(record,epoch(journal['operationStartedAt']))
    require(record.get('NodeUID') and record['NodeUID'] not in ORIGINAL.values() and record.get('role')=='worker','cleanup_requires_proven_nonCP_new_NodeUID')
    return record


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
    fake=[100.0];signals=[]
    class FakeOwned:
        def stop(self):signals.append('stop');return True
    budget=DeadlineBudget(clock=lambda:fake[0]);budget.group=FakeOwned();budget.cli=110
    fake[0]=111;budget.poll();require(signals==['stop'] and budget.expired=='CLI_300s','deadline_test_failed');cases.append('independent_CLI_deadline_stops_owned_group')
    budget.begin_cleanup();require(budget.stage=='cleanup' and budget.expired is None and budget.deadline()<=budget.hard,'cleanup_reserve_test');cases.append('failure_transitions_to_bounded_cleanup_reserve')
    fake[0]=budget.deadline()+1;budget.poll();require(budget.expired is not None and len(signals)==2,'cleanup_deadline_test');cases.append('cleanup_deadline_stops_owned_group')
    captured={9:'birth'};sent=[]
    owned=OwnedGroup(9,probe=lambda pid:captured.get(pid),group=lambda pid:9,send=lambda pgid,sig:sent.append((pgid,sig)))
    owned.capture(9,'birth');captured[9]='reused';require(not owned.signal(signal.SIGKILL) and not sent,'PID_reuse_test');cases.append('PID_birth_reuse_never_signalled')
    reject('partial_without_durable_new_record_refused',lambda:cleanup_record({'schema':1,'issued':True,'expectedMachine':NEW}))
    reject('partial_original_NodeUID_refused',lambda:cleanup_record({'schema':1,'issued':True,'expectedMachine':NEW,'operationStartedAt':utc(),'new':{**record,'NodeUID':ORIGINAL[PROFILE],'role':'worker'}}))
    io_signals=[]
    class FakeIO:
        def stop(self):io_signals.append('stopped');return True
    io_budget=DeadlineBudget('cleanup',clock=lambda:fake[0]);io_budget.add_io_group(FakeIO());fake[0]=io_budget.deadline()+1;io_budget.poll();require(io_signals==['stopped'],'cleanup_I_O_watchdog_failed');cases.append('cleanup_watchdog_stops_registered_bounded_IO_group')
    require(RUN_CLEARED is False,'runtime_gate_changed')
    original_argv=sys.argv;original_transaction=globals()['Transaction'];constructed=[]
    def forbidden_transaction(*args,**kwargs):constructed.append(True);raise AssertionError('locked_run_created_Transaction')
    try:
        globals()['Transaction']=forbidden_transaction;sys.argv=['release-provider-lab.py','run','--confirm-owned',LAB+':add-exact-m03']
        reject('live_run_remains_locked',main);require(not constructed,'runtime_gate_constructed_Transaction')
    finally:sys.argv=original_argv;globals()['Transaction']=original_transaction
    frozen=DeadlineBudget('cleanup',clock=lambda:fake[0]);end=frozen.deadline();frozen.stage='cleanup';fake[0]+=10;frozen.begin_cleanup();require(frozen.deadline()==end,'cleanup_deadline_extended');cases.append('cleanup_reentry_does_not_extend_budget')
    mounts=[{'type':'bind','name':None},{'type':'volume','name':PROFILE}]
    require(canonical_mounts(mounts)==canonical_mounts(list(reversed(mounts))),'mount_reverse_equality');cases.append('reversed_identical_mount_records_equal')
    require(canonical_mounts(mounts)!=canonical_mounts([mounts[0],{'type':'volume','name':'changed'}]),'changed_volume_hidden');cases.append('changed_volume_stays_unequal')
    require(canonical_mounts(mounts)!=canonical_mounts(mounts[:1]),'dropped_mount_hidden');cases.append('dropped_mount_stays_unequal')
    require(canonical_mounts(mounts)!=canonical_mounts(mounts+[mounts[0]]),'mount_multiplicity_hidden');cases.append('mount_multiplicity_preserved')
    print(json.dumps({"status":"PASS","pureCases":cases,"runtimeActions":False}))

class Transaction:
    def __init__(self, mode='run'):
        self.budget=DeadlineBudget(mode);self.cleanup_attempted=False;self.group=None
        spec=importlib.util.spec_from_file_location("release_owned_manual_lab",ROOT/"scripts/manual_lab.py");self.mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.mod)
        args=self.mod.parser().parse_args(["up","--profile","06-limanlar-arasi-ag","--state-dir",str(STATE),"--minikube-binary",str(MINIKUBE)])
        self.lab=self.mod.Lab(args)
        def guarded_run(argv,env=None,payload=None,timeout=45,check=True):
            require(payload is None,'payload_mutation_not_supported_in_guard_adapter')
            self.budget.check();code,out,err=bounded_process(argv,timeout,env,self.budget.deadline(),self.budget)
            if check:require(code==0,'owned_guard_command_failed')
            return code,out.decode(errors='replace'),err.decode(errors='replace')
        self.mod.run=guarded_run
        self.j=None;self.app=None;self.birth=None;self.origin=f"http://127.0.0.1:{PORT}";self.scope={};self.nonce="";self.http=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def cmd(self, argv, timeout=5, env=None, deadline=None):
        self.budget.check()
        return command(argv,timeout,env,min(self.budget.deadline(),deadline) if deadline is not None else self.budget.deadline(),self.budget)
    def power(self):
        raw=self.cmd(["/usr/bin/pmset","-g","batt"],2).decode();m=re.search(r"(\d+)%;",raw)
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
    def docker(self,*args): return json.loads(self.cmd(['/usr/local/bin/docker',*args],5))
    def host(self,name):
        self.budget.check();code,out,_=bounded_process(['/usr/local/bin/docker','inspect',name],5,deadline=self.budget.deadline(),controller=self.budget)
        if code:return None
        x=json.loads(out)[0];nets=x['NetworkSettings']['Networks'];n=nets.get(PROFILE,{})
        return {'name':x['Name'].lstrip('/'),'id':x['Id'],'created':x['Created'],'labels':x['Config'].get('Labels',{}),'networkID':n.get('NetworkID'),'IP':n.get('IPAddress'),'mounts':canonical_mounts([{'type':m['Type'],'name':m.get('Name')}for m in x['Mounts']])}
    def label_targets(self):
        result={}
        for kind,args in [('containers',['ps','-aq','--no-trunc']),('volumes',['volume','ls','-q']),('networks',['network','ls','-q'])]:
            result[kind]=self.cmd(['/usr/local/bin/docker',*args,'--filter','label='+LABEL+'='+NEW],5).decode().split()
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
        self.budget.check()
        query=dict(self.scope);query['context']=PROFILE;query['namespace']='';url=self.origin+path+('?'+urllib.parse.urlencode(query) if query else '')
        headers={'Origin':self.origin,'X-KubeView-Cluster-Impact':'acknowledged'}
        if self.nonce:headers['X-KubeView-Connection']=self.nonce
        data=None
        if body is not None: data=json.dumps(body).encode();headers['Content-Type']='application/json'
        req=urllib.request.Request(url,data=data,method=method,headers=headers)
        try:
            with self.http.open(req,timeout=max(.1,min(8,self.budget.deadline()-time.time()))) as response:data=response.read(2*1024*1024+1);require(len(data)<=2*1024*1024,'HTTP_response_size_bound');return response.status,json.loads(data)
        except urllib.error.HTTPError as e:
            code=e.code;e.close();return code,{} # no raw error/payload
    def start_app(self):
        require(APP_SHA is not None and re.fullmatch(r'[a-f0-9]{64}',APP_SHA) is not None,'root_new_runtime_required_PROV_CACHE_001');require(filehash(APP)==APP_SHA,'approved_app_binary_hash_guard')
        require(not self.app,'one_gateway_only');sock=socket.socket();sock.bind(('127.0.0.1',PORT));sock.close()
        home=STATE/'minikube/.minikube';env={'HOME':str(Path.home()),'PATH':'/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin','KUBECONFIG':str(STATE/'private/admin.json'),'READ_ONLY':'false','KV_HUBBLE_ENABLED':'false','KV_MINIKUBE_ENABLED':'true','KV_MINIKUBE_BINARY':str(MINIKUBE),'KV_MINIKUBE_PROFILE':PROFILE,'KV_MINIKUBE_CONTEXT':PROFILE,'KV_MINIKUBE_CLUSTER_UID':SYSTEM,'KV_MINIKUBE_HOME':str(home),'KV_MINIKUBE_MAX_NODES':'3','KV_PROVIDER_STATE_DIR':str(CONTROL/'provider-journal')}
        args=[str(APP),'--write','--context',PROFILE,'--kubeconfig',str(STATE/'private/admin.json'),'--data-dir',str(CONTROL/'app-data'),'--bind','127.0.0.1','--port',str(PORT)]
        self.app=subprocess.Popen(args,cwd=CONTROL,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
        self.birth=process_birth(self.app.pid);require(self.birth,'owned_app_birth_missing');self.group=OwnedGroup(self.app.pid);self.group.capture(self.app.pid,self.birth);self.budget.group=self.group
        for _ in range(50):
            require(self.app.poll() is None,'owned_app_exited')
            try: code,doc=self.http_request('GET','/api/workspace');break
            except (OSError,urllib.error.URLError):time.sleep(.1)
        else:raise Guard('owned_app_not_ready')
        require(code==200 and len(doc['harbors'])==1,'private_workspace_bootstrap')
        listeners=self.cmd(['/usr/sbin/lsof','-nP','-iTCP:'+str(PORT),'-sTCP:LISTEN','-t'],2).decode().split();require(set(listeners)=={str(self.app.pid)},'gateway_port_PID_binding')
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
        require(not self.cleanup_attempted,'cleanup_not_retried');self.cleanup_attempted=True
        self.budget.check()
        record=cleanup_record(self.j)
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
        env=self.lab.env();self.cmd([MINIKUBE,'--profile',PROFILE,'node','delete',NEW],150,env,self.budget.deadline())
        require(self.lab.get('a','node',NEW) is None and self.host(NEW) is None,'cleanup_new_Node_or_host_remains');require(all(not x for x in self.label_targets().values()),'cleanup_label_resources_remain')
        after=self.snapshot();require(after==self.j['baseline'],'original_cluster_fixture_Cilium_volume_profile_state_changed');self.j['cleanupComplete']=True;self.event('cleanup_restored_exact_originals')
    def stop_app(self):
        if self.app and self.app.poll() is None:
            require(self.group is not None,'owned_app_group_missing')
            self.group.signal(signal.SIGTERM)
            try:self.app.wait(timeout=3)
            except subprocess.TimeoutExpired:self.group.signal(signal.SIGKILL);self.app.wait(timeout=2)
    @contextlib.contextmanager
    def cleanup_lock(self):
        path=CONTROL/'provider-journal'/('minikube-'+PROFILE+'.lock')
        require(path.is_file() and not path.is_symlink(),'provider_cleanup_lock_required')
        with path.open('a+') as handle:
            fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB);yield
    def pending_partial(self,category):
        self.j['pendingCleanup']=True;self.j['result']='FAIL';self.event('pending_partial_cleanup',{'safeCategory':category})
        try:
            host=self.host(NEW)
            self.event('partial_inventory',{'host':host,'labelTargets':self.label_targets()})
            # A stop is allowed only for the exact adopted host/Node and known
            # DaemonSet-only Pods; no deletion/profile modification here.
            record=self.j.get('new')
            if not record or not host:return
            self.lab.guard_cluster('a');new_identity(host,epoch(self.j['operationStartedAt']))
            require(all(record[k]==host[k] for k in ['id','name','created','networkID','IP']),'partial_host_identity_changed')
            node=self.lab.get('a','node',NEW);require(node and node['metadata']['uid']==record['NodeUID'],'partial_Node_identity_unproven')
            pods=json.loads(self.lab.kubectl('a',['get','pods','--all-namespaces','--field-selector','spec.nodeName='+NEW,'-o','json'],timeout=5)[1])['items']
            cleanup_pod_guard(pods,self.j['baseline']['knownDaemonSets'])
            self.cmd(['/usr/local/bin/docker','stop','--time','5',record['id']],8,deadline=self.budget.deadline())
            self.event('only_exact_adopted_new_host_stopped',{'dockerID':record['id'],'notDeleted':True})
        except Exception as exc:self.event('partial_stop_refused',{'errorClass':type(exc).__name__})
    def run(self):
        require(not CONTROL.exists(),'existing_attempt_refuse_rePOST_use_cleanup');CONTROL.mkdir(mode=0o700)
        start=time.time();self.budget.start_watchdog()
        try:
            baseline=self.snapshot();require(all(not x for x in self.label_targets().values()),'new_target_preexists')
            key=uuid.uuid4().hex;self.j={'schema':1,'startedAt':utc(),'issued':False,'expectedMachine':NEW,'baseline':baseline,'timeline':[],'keyHash':digest((PROFILE+'\x00'+key).encode())};self.event('durable_plan_before_any_POST',{'MaxNodes':3,'expected':NEW,'cleanupReserveSeconds':180,'reportReserveSeconds':60})
            self.start_app();self.guard();require(time.time()-start<150 and 720-(time.time()-start)>=240,'setup_or_cleanup_reserve_gate')
            self.j['issued']=True;self.j['operationStartedAt']=utc();self.budget.cli=time.time()+295;self.event('POST_intent_committed_no_replay_after_interruption')
            body={'action':'add-worker','idempotencyKey':key};code,first=self.http_request('POST','/api/providers/minikube/workers',body);require(code==202,'first_POST_not_accepted')
            opid=first['operation']['id'];self.j['operationID']=opid;self.event('first_POST_accepted',{'operationID':opid});self.guard(True)
            code,second=self.http_request('POST','/api/providers/minikube/workers',body);require(code==202 and second['operation']['id']==opid,'same_key_not_one_operation');self.event('same_key_second_POST_same_operation',{'operationID':opid})
            exited=None;cancelled=False
            while True:
                self.budget.check();self.power();require(time.time()-start<480,'work_deadline_cleanup_reserve')
                code,state=self.http_request('GET','/api/providers/minikube/workers');require(code==200 and len(state['operations'])==1,'operation_inventory_changed');op=state['operations'][0];require(op['id']==opid,'operation_ID_changed')
                self.event('operation_observation',{k:op.get(k)for k in ['id','status','expectedName','nodeName','nodeUID','processPID','processExited','claimVerified','stageSource']})
                if op.get('claimVerified') and self.host(NEW) is not None and self.lab.get('a','node',NEW) is not None:
                    self.adopt(epoch(self.j['operationStartedAt']))
                if op.get('processPID') and self.group:
                    pid=op['processPID'];birth=process_birth(pid)
                    if birth:self.group.capture(pid,birth)
                if op.get('processExited') and exited is None:
                    exited=time.time();self.budget.cli=None
                if op.get('status')=='ready':
                    require(op.get('claimVerified') and op.get('processExited'),'Ready_without_CLI_claim_or_exit');record=self.adopt(epoch(self.j['operationStartedAt']));require(record['ready'] and op['nodeUID']==record['NodeUID'],'actual_new_kubelet_not_Ready');self.j['readyVerified']=True;break
                if time.time()-epoch(self.j['operationStartedAt'])>275 and not cancelled:
                    self.http_request('POST','/api/providers/minikube/workers',{'action':'cancel','id':opid});cancelled=True;self.event('bounded_CLI_cancel_requested')
                require(not cancelled or time.time()-epoch(self.j['operationStartedAt'])<300,'CLI_cancel_not_observed')
                require(exited is None or time.time()-exited<90,'Ready_observation_timeout')
                time.sleep(1)
            self.budget.begin_cleanup();self.cleanup();require(not self.budget.events,'watchdog_event_cannot_PASS');self.j['result']='PASS';self.event('transaction_pass_after_verified_cleanup')
        except Exception as exc:
            if self.j:self.j['result']='FAIL';self.j['pendingCleanup']=bool(self.j.get('issued'));self.event('failure_before_cleanup',{'errorClass':type(exc).__name__})
            try:self.stop_app()
            except Exception as stop_error:
                if self.j:self.event('owned_app_stop_refused_or_pending',{'errorClass':type(stop_error).__name__})
            try:self.budget.begin_cleanup()
            except Guard:
                if self.j:self.event('cleanup_deadline_already_expired')
                raise
            if self.j and self.j.get('issued'):
                if self.j.get('new') and not self.cleanup_attempted:
                    try:
                        with self.cleanup_lock():self.cleanup()
                    except Exception as clean:self.pending_partial(type(clean).__name__)
                else:self.pending_partial(type(exc).__name__)
                self.j['result']='FAIL';self.event('issued_failure_retained',{'errorClass':type(exc).__name__,'cleanupComplete':bool(self.j.get('cleanupComplete'))})
            raise
        finally:
            try:self.stop_app()
            except Exception as stop_error:
                if self.j:self.j['result']='FAIL';self.j['pendingCleanup']=True;self.event('final_owned_app_stop_pending',{'errorClass':type(stop_error).__name__})
            self.budget.close()
            if self.j:self.j['watchdogEvents']=self.budget.events;atomic(JOURNAL,self.j)

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('phase',choices=['self-test','check','run','cleanup']);parser.add_argument('--confirm-owned',default='');args=parser.parse_args()
    if args.phase=='self-test':self_test();return 0
    expected=LAB+':'+('add-exact-m03' if args.phase=='run' else 'cleanup-recorded-m03' if args.phase=='cleanup' else 'check-only')
    require(args.confirm_owned==expected,'exact_owned_opt_in_required')
    if args.phase=='run':require(RUN_CLEARED,'run_not_cleared_requires_root_checkpoint_and_HTTP_preflight')
    tx=Transaction(args.phase)
    with tx.lab.lock():
        if args.phase=='check':
            tx.snapshot();require(all(not x for x in tx.label_targets().values()),'new_target_preexists');print(json.dumps({'status':'CHECK_PASS','mutations':False}));return 0
        if args.phase=='run':tx.run()
        else:
            require(JOURNAL.is_file() and not JOURNAL.is_symlink() and JOURNAL.stat().st_uid==os.getuid() and JOURNAL.stat().st_mode&0o077==0,'private_journal_required');tx.j=json.loads(JOURNAL.read_text());require(tx.j.get('schema')==1 and tx.j.get('expectedMachine')==NEW,'journal_binding')
            lock=CONTROL/'provider-journal'/('minikube-'+PROFILE+'.lock')
            with lock.open('a+') as handle:
                fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
                tx.budget.start_watchdog()
                try:tx.cleanup()
                except Exception as exc:tx.pending_partial(type(exc).__name__);raise
                finally:tx.budget.close()
    print(json.dumps({'status':'COMPLETE','journalPath':str(JOURNAL),'cleanupComplete':bool(tx.j.get('cleanupComplete'))}));return 0
if __name__=='__main__':
    try:sys.exit(main())
    except Guard as exc:print(json.dumps({'status':'BLOCKED_OR_FAILED','safeCategory':str(exc),'noAutomaticRetry':True}));sys.exit(2)
    except Exception as exc:print(json.dumps({'status':'FAILED','errorClass':type(exc).__name__,'detailsOmitted':True,'noAutomaticRetry':True}));sys.exit(2)
