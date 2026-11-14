from pathlib import Path
import datetime, hashlib, importlib.util, json, os, re, shutil, signal, subprocess, sys, time
sys.dont_write_bytecode = True
R = Path.cwd()
A = R / 'artifacts/release-audit/ra-20261111/provider-profile-lock-http-worker'
H = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
utc = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
helper = R / 'scripts/release-provider-lab.py'
APP = R / '.git/release-audit/candidate-runtime-profilelock10/kubeview'
APP_SHA = '5f1c22b90297f6ab870ce235faaa73e1591d324ff77bf9cc4d8b4ed18cefb097'
def need(ok, reason):
    if not ok: raise RuntimeError(reason)
need(H(helper) == '1a0db67621ed41059632bc246c23891d497cb02c8e23ab84c9f5bc415953d2e8', 'helper_identity')
need(H(APP) == APP_SHA, 'binary_identity')
build = json.loads((APP.parent / 'build.json').read_text())
need(build['sourceCommit'] == 'f32d6b2345c0e9fcf350b83ec9a5e9d3fc651e12' and build['binarySHA256'] == APP_SHA, 'build_source_identity')
(A / 'build-receipt.json').write_text(json.dumps(build, indent=2) + '\n')
runtime_start = time.time()
deadline = runtime_start + 80
apps = []
power = []
proof = {'status': 'FAIL', 'runtimeStartedAt': utc(), 'noWorkerPOST': True, 'events': []}
def event(name, **fields):
    proof['events'].append({'at': utc(), 'event': name, **fields})
    print(json.dumps(proof['events'][-1]), flush=True)
def power_check():
    p = subprocess.run(['/usr/bin/pmset', '-g', 'batt'], capture_output=True, timeout=2, check=True)
    raw = p.stdout.decode(); match = re.search(r'(\d+)%', raw)
    need(match is not None, 'battery_parse')
    free = shutil.disk_usage(R).free
    row = {'at': utc(), 'AC': 'AC Power' in raw, 'batteryPercent': int(match[1]), 'freeDiskBytes': free}
    power.append(row)
    need((row['AC'] or row['batteryPercent'] >= 25) and free >= 10*1024**3, 'short_read_power_disk_guard')
def module(name, port, control):
    spec = importlib.util.spec_from_file_location(name, helper)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    need(m.RUN_CLEARED is False, 'source_run_gate')
    m.APP, m.APP_SHA, m.PORT, m.CONTROL, m.JOURNAL = APP, APP_SHA, port, control, control / ('http-' + name + '.json')
    tx = m.Transaction('check'); tx.power = power_check; tx.budget.limit = deadline
    tx.budget.start_watchdog(); tx.j = {'schema': 1, 'issued': False, 'purpose': 'HTTP ownership only; worker POST forbidden', 'timeline': []}
    original = tx.http_request
    def only_allowed(method, path, body=None, management=False):
        need(method == 'GET' or (method == 'POST' and path == '/api/management'), 'HTTP_method_allowlist')
        return original(method, path, body, management)
    tx.http_request = only_allowed
    apps.append((name, m, tx))
    return m, tx
def children(tx):
    rows = subprocess.run(['/bin/ps', '-axo', 'pid=,ppid=,comm='], capture_output=True, text=True, timeout=2).stdout.splitlines()
    entries = {}
    for row in rows:
        z = row.strip().split(None, 2)
        if len(z) == 3: entries[int(z[0])] = (int(z[1]), Path(z[2]).name)
    found = {tx.app.pid}
    while True:
        n = len(found); found.update(pid for pid, (ppid, _) in entries.items() if ppid in found)
        if n == len(found): break
    return [{'pid': pid, 'basename': entries[pid][1]} for pid in found if pid != tx.app.pid]
def inspect(name, m, tx, available):
    code, info = tx.http_request('GET', '/api/connection')
    need(code == 200 and info['context'] == m.PROFILE and info['identity']['clusterUID'] == m.SYSTEM and info['managementEnabled'] and not info['readOnly'], 'connection_identity_management')
    code, doc = tx.http_request('GET', '/api/providers'); v = doc.get('minikube', {})
    need(code == 200 and v.get('available') is available and v.get('canAdd') is available and v.get('operations') == [], name + '_provider_status')
    if available: need(v['configuration'] == {'profile': m.PROFILE, 'context': m.PROFILE, 'clusterUID': m.SYSTEM, 'maxNodes': 3, 'driver': 'docker'}, 'provider_configuration')
    code, inventory = tx.http_request('GET', '/api/providers/minikube/workers')
    need(code == (200 if available else 503), name + '_worker_inventory_status')
    if available: need(inventory == {'operations': []}, 'empty_operations_inventory')
    descendants = children(tx); need(not descendants, 'unexpected_app_child')
    event(name, providerHTTP=200, available=available, canAdd=available, operationCount=0, workersHTTP=code, context=m.PROFILE, clusterUID=m.SYSTEM, appPID=tx.app.pid, appBirth=tx.birth, appPGID=os.getpgid(tx.app.pid), port=m.PORT, childProcesses=descendants)
def global_stat():
    p = Path.home() / '.kube/config'
    try:
        s = p.stat(); return {'exists': True, 'device': s.st_dev, 'inode': s.st_ino, 'bytes': s.st_size, 'mtimeNs': s.st_mtime_ns, 'ctimeNs': s.st_ctime_ns}
    except FileNotFoundError: return {'exists': False}
def alarm(signum, frame): raise TimeoutError('HTTP_runtime90s_limit')
signal.signal(signal.SIGALRM, alarm); signal.setitimer(signal.ITIMER_REAL, 90)
try:
    power_check()
    state = Path.home() / 'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
    control = state / 'private/release-provider-profilelock-http-20261111'
    control.mkdir(mode=0o700); ca, cb = control / 'A', control / 'B'; ca.mkdir(mode=0o700); cb.mkdir(mode=0o700)
    ma, ta = module('appA', 19846, ca)
    mb, tb = module('appB', 19847, cb)
    profile = state / 'minikube/.minikube/profiles' / ma.PROFILE / 'config.json'
    before_hash = H(profile); need(before_hash == '4733b8f4870354b6bd0404dfe3d912dca704d1e5f392eb9fe3f397516db8da1c', 'profile_original_bytes')
    global_before = global_stat()
    with ta.lab.lock():
        baseline = ta.snapshot(); need(all(not x for x in ta.label_targets().values()), 'unexpected_new_worker_target')
        nodes = ta.guard(); need(len(nodes) == 2 and all(any(c['type']=='Ready' and c['status']=='True' for c in n['status']['conditions']) for n in nodes), 'original2Ready')
        (A / 'before.json').write_text(json.dumps({'snapshot': baseline, 'profileSHA256': before_hash, 'globalConfigStatOnly': global_before}, indent=2)+'\n')
        ta.start_app(); inspect('A_owns_profile', ma, ta, True)
        tb.start_app(); inspect('B_rejected_same_Home_Profile', mb, tb, False)
        ta.stop_app(); tb.stop_app(); event('both_initial_apps_stopped', AExit=ta.app.returncode, BExit=tb.app.returncode)
        mc, tc = module('appBRestart', 19847, cb)
        tc.start_app(); inspect('B_restarted_acquires_after_owner_close', mc, tc, True)
        tc.stop_app()
        after = ta.snapshot(); after_hash = H(profile)
        (A / 'after.json').write_text(json.dumps({'snapshot': after, 'profileSHA256': after_hash, 'globalConfigStatOnly': global_stat()}, indent=2)+'\n')
        need(after == baseline and after_hash == before_hash and global_stat() == global_before, 'original_state_or_global_config_changed')
        journals=[]
        for path in [ca/'provider-journal'/('minikube-'+ma.PROFILE+'.json'), cb/'provider-journal'/('minikube-'+ma.PROFILE+'.json')]:
            data = path.read_bytes() if path.exists() else None
            need(data is None or json.loads(data) in (None, []), 'nonempty_provider_journal')
            journals.append({'path': str(path), 'exists': data is not None, 'literal': data.decode() if data is not None else 'ABSENT', 'SHA256': H(path) if data is not None else None, 'operationCount': 0})
        physical = state/'minikube/.minikube/.kubeview-provider-locks'/('minikube-'+ma.PROFILE+'.lock')
        need(physical.is_file(), 'physical_lock_file_missing')
        proof.update(status='PASS', originalBaselineEqual=True, profileSHA256Before=before_hash, profileSHA256After=after_hash, globalConfigStatEqual=True, globalConfigContentsNotRead=True, providerJournals=journals, intentionalPhysicalLockFile={'path': str(physical), 'mode': oct(physical.stat().st_mode&0o777)}, original2NodeUIDs=ma.ORIGINAL)
except Exception as exc:
    proof['failure']={'errorClass': type(exc).__name__, 'safeCategory': str(exc) if isinstance(exc, (RuntimeError, TimeoutError)) or type(exc).__name__=='Guard' else 'details_omitted'}
finally:
    cleanup=[]
    for name, m, tx in reversed(apps):
        try:
            tx.stop_app(); cleanup.append({'name':name,'pid':tx.app.pid if tx.app else None,'birth':tx.birth,'exitCode':tx.app.returncode if tx.app else None,'stopped':tx.app is None or tx.app.poll() is not None})
        except Exception as exc: cleanup.append({'name':name,'stopFailureClass':type(exc).__name__});proof['status']='FAIL'
        tx.budget.close()
    signal.setitimer(signal.ITIMER_REAL,0)
    ports=[]
    for port in [19846,19847]:
        p=subprocess.run(['/usr/sbin/lsof','-nP','-iTCP:'+str(port),'-sTCP:LISTEN','-t'],capture_output=True,timeout=2)
        ports.append({'port':port,'noListener':p.returncode==1 and not p.stdout})
    if not all(x['noListener'] for x in ports):proof['status']='FAIL'
    proof.update(cleanup=cleanup, ports=ports, powerPolicy=power, helperSHA256After=H(helper), helperUnchanged=H(helper)=='1a0db67621ed41059632bc246c23891d497cb02c8e23ab84c9f5bc415953d2e8', runtimeElapsedSeconds=time.time()-runtime_start, completedAt=utc())
    if proof['runtimeElapsedSeconds']>90:proof['status']='FAIL'
    (A/'result.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof),flush=True)
sys.exit(0 if proof['status']=='PASS' else 1)
