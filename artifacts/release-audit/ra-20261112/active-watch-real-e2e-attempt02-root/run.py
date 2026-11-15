"""One finite real owned RoleBinding revocation test; no benchmark or browser."""
from pathlib import Path
import datetime, hashlib, json, os, shutil, signal, subprocess, time

directory = Path(__file__).resolve().parent
root = directory.parents[3]
if (directory / 'execution.json').exists() or (directory / 'supervisor.json').exists():
    raise SystemExit('Existing execution identity; no overwrite or automatic retry')
plan = json.loads((directory / 'plan.json').read_text())
started = time.monotonic()
utc = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
sdk = Path.home() / 'go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin/go'
environment = dict(os.environ, KUBECONFIG='/dev/null', GOMAXPROCS='2', GOMEMLIMIT='1GiB', KV_HUBBLE_ENABLED='false', KV_MINIKUBE_ENABLED='false', API_TOKEN='', KUBEVIEW_RELEASE_REAL_WATCH_AUTHZ='owned-watch-revoke-v1', KUBEVIEW_RELEASE_REAL_STATE=str(Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01/lab.json'), KUBEVIEW_RELEASE_REAL_KUBECONFIG=str(Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01/private/admin.json'), KUBEVIEW_RELEASE_REAL_SECRET_RECEIPT=str(root/'.git/release-audit/watch-rolebinding-real-20261113/inputs/namespace-receipt.json'), KUBEVIEW_RELEASE_REAL_OUTPUT=str(root/'.git/release-audit/watch-rolebinding-real-20261113/output02'))
argv = [str(sdk), 'test', '-json', '-p', '1', '-parallel', '1', '-count=1', '-timeout=160s', '-run', plan['regex'], './pkg/server']
receipt = {'status': 'FAIL', 'startedAt': utc(), 'argv': argv, 'cwd': str(root / 'backend'), 'captured': [], 'samples': [], 'safety': plan['safety'], 'limitSeconds': 180}
captured = {}
child = None

def identity(pid):
    process = subprocess.run(['/bin/ps', '-p', str(pid), '-o', 'lstart=', '-o', 'command='], capture_output=True, text=True, timeout=2)
    return process.stdout.strip() if process.returncode == 0 else None

def need(condition, reason):
    if not condition:
        raise RuntimeError(reason)

def stop(signum, frame):
    raise KeyboardInterrupt('owned finite auth test stop')

signal.signal(signal.SIGTERM, stop)
(directory / 'supervisor.json').write_text(json.dumps({'pid': os.getpid(), 'identity': identity(os.getpid()), 'purpose': 'SIGTERM/SIGINT triggers owned captured-child cleanup'}, indent=2) + '\n')
try:
    receipt['goVersion'] = subprocess.check_output([str(sdk), 'version'], text=True, timeout=3).strip()
    need('go1.26.11 ' in receipt['goVersion'], 'fixed SDK required')
    receipt['sourceBeforeMatches'] = all(hashlib.sha256((root / f).read_bytes()).hexdigest() == expected for f, expected in plan['fileSHA256'].items())
    need(receipt['sourceBeforeMatches'], 'source changed before run')
    with (directory / 'go-test.jsonl').open('xb') as stdout, (directory / 'go-test.stderr').open('xb') as stderr:
        child = subprocess.Popen(argv, cwd=root / 'backend', env=environment, stdout=stdout, stderr=stderr, start_new_session=True)
        while child.poll() is None:
            need(time.monotonic() - started < 170, '180s wall budget with10s owned-process cleanup reserve')
            rows = {}
            for line in subprocess.check_output(['/bin/ps', '-axo', 'pid=,ppid=,rss='], text=True, timeout=2).splitlines():
                parts = line.split()
                if len(parts) == 3:
                    rows[int(parts[0])] = (int(parts[1]), int(parts[2]))
            owned = {child.pid}
            while True:
                previous = len(owned)
                owned.update(pid for pid, row in rows.items() if row[0] in owned)
                if len(owned) == previous:
                    break
            rss = sum(rows[pid][1] for pid in owned if pid in rows)
            for pid in owned:
                if pid not in captured:
                    value = identity(pid)
                    if value:
                        captured[pid] = value
            receipt['samples'].append({'elapsedSeconds': time.monotonic() - started, 'ownedRSSKiB': rss, 'ownedPIDs': sorted(owned)})
            need(rss <= 1536 * 1024, 'owned RSS1.5GiB limit')
            need(shutil.disk_usage(root).free >= 10 * 1024**3, 'disk10GiB limit')
            time.sleep(.2)
        receipt['exitCode'] = child.wait()
    need(receipt['exitCode'] == 0, 'Go guard assertion/compile failure')
    events = [json.loads(line) for line in (directory / 'go-test.jsonl').read_text().splitlines() if line]
    top = [event['Test'] for event in events if event.get('Action') == 'pass' and event.get('Test') and '/' not in event['Test']]
    need(len(top) == 1 and set(top) == set(plan['tests']), 'exact1 real opt-in top-level test required')
    need(not any(event.get('Action') in ['fail', 'skip'] for event in events), 'failure/skip is not PASS')
    need(any(event.get('Action') == 'pass' and not event.get('Test') for event in events), 'package finalPASS required')
    receipt.update(topLevelTests=top, topLevelPassed=len(top), subtestsPassed=sum(event.get('Action') == 'pass' and '/' in event.get('Test', '') for event in events), failures=0, skips=0)
    receipt['status'] = 'PASS_REAL_ROLEBINDING_GO_TEST_REQUIRES_PROOF_CLEANUP_REVIEW'
except BaseException as error:
    receipt['firstFailure'] = {'type': type(error).__name__, 'safeReason': str(error) if isinstance(error, RuntimeError) else 'details in owned test output'}
finally:
    for sig in [signal.SIGTERM, signal.SIGKILL]:
        for pid, birth in reversed(list(captured.items())):
            if identity(pid) == birth:
                try:
                    os.kill(pid, sig)
                except ProcessLookupError:
                    pass
        time.sleep(.2)
    receipt['captured'] = [{'pid': pid, 'identity': birth, 'capturedIdentityAbsent': identity(pid) != birth} for pid, birth in captured.items()]
    receipt['sourceAfterMatches'] = all(hashlib.sha256((root / f).read_bytes()).hexdigest() == expected for f, expected in plan['fileSHA256'].items())
    receipt['elapsedSeconds'] = time.monotonic() - started
    receipt['finishedAt'] = utc()
    if not receipt['sourceAfterMatches'] or not all(row['capturedIdentityAbsent'] for row in receipt['captured']) or receipt['elapsedSeconds'] > 180:
        receipt['status'] = 'FAIL'
    with (directory / 'execution.json').open('x') as stream:
        json.dump(receipt, stream, indent=2)
        stream.write('\n')
    print(json.dumps({key: receipt.get(key) for key in ['status', 'elapsedSeconds', 'topLevelPassed', 'subtestsPassed', 'failures', 'skips', 'firstFailure']}))
raise SystemExit(0 if receipt['status'].startswith('PASS') else 1)
