"""Narrow guarded scenario adapter; metadata-only output; no new objects."""
import contextlib, importlib.util, io, json, os, sys
from pathlib import Path
root = Path(__file__).resolve().parents[4]
spec = importlib.util.spec_from_file_location('owned_runner', root/'scripts/manual_lab.py')
r = importlib.util.module_from_spec(spec); spec.loader.exec_module(r)
state = Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01'
lab = r.Lab(r.parser().parse_args(['status', '--state-dir', str(state)]))
profile = '06-limanlar-arasi-ag'
cluster = lab.guard_cluster('a')
assert cluster['uid'] == 'e84bb50e-8d64-4bc2-905c-9b5ba193e53a'
assert lab.state['labId'] == 'kvml-d32afbf634e8' and set(lab.state['clusters']) == {'a'}
assert lab.state['telemetry'].get('installedAt')
sha = '08bd0cee5a5dfc03b8df6b24b778d9f779266cfc2c09a0bbda0f03049e970c7d'
p = lab.state['processes'][profile]
assert p['pid'] == 80336 and p['port'] == 19846 and p['binarySha256'] == sha
assert r.digest(Path(p['binary'])) == sha and r.process_identity(p['pid']) == p['identity'] and r.pid_owns_port(p['pid'],19846)
relay = next(v for v in lab.state['processes'].values() if v.get('port') == 19848)
assert r.process_identity(relay['pid']) == relay['identity'] and r.pid_owns_port(relay['pid'],19848)
nss = lab.state['profiles'][profile]['namespaces']
for n in nss: lab.ns_guard(profile,'a',n['name'])
action = sys.argv[1]
assert action in ['inspect','traffic-start','traffic-increase','traffic-stop']
if action != 'inspect':
    lab.args.profile, lab.args.name = profile, action
    with contextlib.redirect_stdout(io.StringIO()): lab.scenario()
pods=[]
for n in nss:
    for pod in lab.get('a','pods',ns=n['name'])['items']:
        m=pod['metadata']; s=pod.get('status',{})
        pods.append({'uid':m['uid'],'name':m['name'],'namespace':m['namespace'],'nodeName':pod['spec'].get('nodeName'), 'terminating':bool(m.get('deletionTimestamp')), 'ready':any(c['type']=='Ready' and c['status']=='True' for c in s.get('conditions',[]))})
print(json.dumps({'at':r.now(),'action':action,'guarded':True,'clusterUID':cluster['uid'],'labId':lab.state['labId'],'appPID':p['pid'],'binarySHA256':sha,'relayPID':relay['pid'],'namespaces':[{'name':n['name'],'uid':n['uid']} for n in nss],'pods':pods}))
