"""Bounded post-rebinding HTTP Host probe; connects only to owned loopback."""
from pathlib import Path
import datetime, hashlib, http.client, json, os, signal, subprocess, time

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
PRIVATE = ROOT / '.git/release-audit/dns-rebinding-bounded-retest-root'
APP = ROOT / '.git/release-audit/candidate-runtime-profilelock10/kubeview'
# Literal below is the recorded full binary identity, never a mutable tag.
SHA = '5f1c22b90297f6ab870ce235faaa73e1591d324ff77bf9cc4d8b4ed18cefb097'
PORT = 19844
REQUEST_COUNT = 0
REQUEST_DEADLINE = None
hash_file = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
utc = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()

def birth(pid):
    r = subprocess.run(['/bin/ps', '-p', str(pid), '-o', 'lstart='], capture_output=True, text=True, timeout=2)
    return r.stdout.strip() if r.returncode == 0 else None

def free_port():
    r = subprocess.run(['/usr/sbin/lsof', '-nP', '-iTCP:'+str(PORT), '-sTCP:LISTEN', '-t'], capture_output=True, text=True, timeout=2)
    return r.returncode == 1 and not r.stdout.strip()

def request(host, origin=None, path='/api/contexts', forwarded=None):
    global REQUEST_COUNT
    assert REQUEST_COUNT < 60, 'all-request-count-guard'
    assert REQUEST_DEADLINE is not None and time.monotonic()+.11+2 < REQUEST_DEADLINE, 'all-request-deadline-guard'
    time.sleep(.11)
    REQUEST_COUNT += 1
    connection = http.client.HTTPConnection('127.0.0.1', PORT, timeout=2)
    headers = {'Host': host, 'Connection': 'close'}
    if origin is not None:
        headers['Origin'] = origin
    if forwarded:
        headers.update(forwarded)
    try:
        connection.request('GET', path, headers=headers)
        response = connection.getresponse()
        body = response.read(2*1024*1024+1)
        assert len(body) <= 2*1024*1024, 'response-size-guard'
        return response.status, body
    finally:
        connection.close()

def run():
    global REQUEST_DEADLINE
    assert not (OUT/'result.json').exists(), 'immutable-run-id'
    PRIVATE.mkdir(mode=0o700, exist_ok=False)
    assert hash_file(APP) == SHA, 'binary-identity'
    assert free_port(), 'owned-port-not-free'
    sources = ['backend/main.go', 'backend/pkg/server/server.go', 'backend/pkg/server/connection.go']
    sources = [p for p in sources if (ROOT/p).is_file()]
    for source in sources:
        frozen = subprocess.check_output(['git', 'show', 'f32d6b2345c0e9fcf350b83ec9a5e9d3fc651e12:'+source], cwd=ROOT)
        assert hashlib.sha256(frozen).hexdigest() == hash_file(ROOT/source), 'frozen-source-identity'
    result = {'status':'FAIL', 'startedAt':utc(), 'binarySHA256':SHA,
              'sourceCommit':'f32d6b2345c0e9fcf350b83ec9a5e9d3fc651e12',
              'sourceSHA256':{p:hash_file(ROOT/p) for p in sources},
              'dataSource':'REAL_APPLICATION_HTTP; NO_KUBERNETES; POST_REBIND_HOST_SIMULATION; NO_DNS_QUERY',
              'limits':{'seconds':30, 'requests':60, 'requestIntervalSeconds':.11, 'concurrency':1}, 'checks':[]}
    start = time.monotonic()
    REQUEST_DEADLINE = start+25  # all requests, including startup, leave cleanup reserve
    env = {'HOME':str(Path.home()), 'PATH':'/usr/bin:/bin', 'READ_ONLY':'true',
           'KV_MINIKUBE_ENABLED':'false', 'KV_HUBBLE_ENABLED':'false'}
    argv = [str(APP), '--bind','127.0.0.1','--port',str(PORT), '--kubeconfig',str(PRIVATE/'absent'), '--data-dir',str(PRIVATE/'app-data')]
    proc = subprocess.Popen(argv, cwd=PRIVATE, env=env, stdin=subprocess.DEVNULL,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    owner_birth = birth(proc.pid)
    try:
        assert owner_birth and os.getpgid(proc.pid) == proc.pid, 'owned-process-identity'
        result['app'] = {'pid':proc.pid, 'birth':owner_birth, 'pgid':proc.pid}
        for _ in range(40):
            assert proc.poll() is None, 'app-early-exit'
            try:
                if request('127.0.0.1:'+str(PORT), path='/healthz')[0] == 200:
                    break
            except OSError:
                continue
        else:
            raise AssertionError('startup-deadline')
        listeners = subprocess.check_output(['/usr/sbin/lsof','-nP','-iTCP:'+str(PORT),'-sTCP:LISTEN','-t'], text=True).split()
        assert set(listeners) == {str(proc.pid)}, 'listener-owner'
        def check(label, host, origin, expected, path='/api/contexts', forwarded=None):
            assert time.monotonic()-start < 27 and len(result['checks']) < 60, 'finite-work-guard'
            code, body = request(host, origin, path, forwarded)
            row = {'case':label, 'host':host, 'origin':origin, 'path':path, 'expected':expected,
                   'status':code, 'passed':code == expected, 'bodyBytes':len(body), 'bodySHA256':hashlib.sha256(body).hexdigest()}
            result['checks'].append(row)
            assert row['passed'], 'status-mismatch:'+label
            if expected == 200 and path == '/api/contexts':
                data = json.loads(body)
                assert data['contexts'] == [] and data['configured'] is False and data['serverReadOnly'] is True
            return body
        for host in ['localhost:'+str(PORT), '127.0.0.1:'+str(PORT), '[::1]:'+str(PORT)]:
            check('allowed-host-with-origin',host,'http://'+host,200)
            check('allowed-host-cli',host,None,200)
        foreign = ['owned-attacker.invalid', 'localhost.owned-attacker.invalid', '127.0.0.1.owned-attacker.invalid',
                   'owned-attacker.invalid:'+str(PORT), '127.1:'+str(PORT), '2130706433:'+str(PORT), '0x7f000001:'+str(PORT)]
        for host in foreign:
            check('post-rebind-same-origin',host,'http://'+host,403)
            check('post-rebind-origin-absent',host,None,403)
        local = '127.0.0.1:'+str(PORT)
        for path in ['/api/workspace','/api/management','/api/session','/ws']:
            check('foreign-protected-or-session-path','owned-attacker.invalid','http://owned-attacker.invalid',403,path)
        check('forwarded-headers-cannot-authorize-host','owned-attacker.invalid','http://owned-attacker.invalid',403,
              forwarded={'X-Forwarded-Host':local, 'X-Forwarded-Proto':'http', 'Forwarded':'host='+local+';proto=http'})
        check('foreign-origin-local-host',local,'http://owned-attacker.invalid',403)
        check('opaque-origin-local-host',local,'null',403)
        check('forwarded-headers-do-not-poison-local-positive',local,'http://'+local,200,
              forwarded={'X-Forwarded-Host':'owned-attacker.invalid', 'X-Forwarded-Proto':'https'})
        check('local-positive-after-negatives',local,'http://'+local,200)
        version = json.loads(check('runtime-source-identity',local,'http://'+local,200,'/api/version'))
        assert version['commit'] == result['sourceCommit'], 'runtime-source-identity'
        result['status'] = 'PASS'
    except Exception as error:
        result['failure'] = {'class':type(error).__name__, 'message':str(error)[:200]}
    finally:
        if proc.poll() is None:
            assert birth(proc.pid) == owner_birth and os.getpgid(proc.pid) == proc.pid, 'cleanup-owner'
            proc.send_signal(signal.SIGTERM)
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                assert birth(proc.pid) == owner_birth
                os.killpg(proc.pid,signal.SIGKILL)
                proc.wait(timeout=2)
        result.update({'finishedAt':utc(),'elapsedSeconds':time.monotonic()-start,
                       'totalHTTPRequestAttemptsIncludingHealth':REQUEST_COUNT,
                       'requestBudgetEnforcedAtEveryCall':True,
                       'appExitCode':proc.returncode,'originalProcessAbsent':birth(proc.pid) != owner_birth,
                       'portFree':free_port(),'binaryUnchanged':hash_file(APP) == SHA})
        if result['elapsedSeconds'] > 30 or not result['portFree'] or not result['originalProcessAbsent']:
            result['status'] = 'FAIL'
        (OUT/'result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['status','elapsedSeconds','portFree','originalProcessAbsent']}))
    raise SystemExit(0 if result['status'] == 'PASS' else 1)

if __name__ == '__main__':
    run()
