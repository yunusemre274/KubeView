#!/usr/bin/env python3
"""Bounded local operator image derivation and vulnerability/version evidence."""
import datetime, gzip, hashlib, json, os, pathlib, re, shutil, signal, subprocess, time, uuid

ROOT = pathlib.Path('/Users/yunusemre/Desktop/KubeView')
PRIVATE = ROOT / '.git/release-audit/provider-operator-image02'
ART = ROOT / 'artifacts/release-audit/ra-20261112/provider-operator-image-worker'
BASE = 'quay.io/cilium/operator-generic@sha256:7a7a3489dc66ad67e420d285c8a8d2e169b0957ad15e120f593d27081bf38d82'
TAG = 'kubeview-private/cilium-operator-generic:1.20.4-security.2-image02'
TRIVY = '/opt/homebrew/Cellar/trivy/0.74.0/bin/trivy'
DOCKER = ['/usr/local/bin/docker', '--host', 'unix:///var/run/docker.sock']
CACHE = ROOT / '.git/release-audit/trivy-cache'
OWNER = 'kv-operator-image02-' + uuid.uuid4().hex
START = time.monotonic()
DEADLINE = START + 600
ENV = {k: v for k, v in os.environ.items() if not k.startswith(('TRIVY_', 'AWS_', 'AZURE_', 'GOOGLE_', 'GCP_', 'REGISTRY_', 'DOCKER_'))}
ENV.update(GOMAXPROCS='2', GOMEMLIMIT='1GiB', DOCKER_CONFIG=str(PRIVATE/'empty-auth'), REGISTRY_AUTH_FILE=str(PRIVATE/'empty-registry-auth.json'), XDG_CONFIG_HOME=str(PRIVATE/'empty-auth'), XDG_RUNTIME_DIR=str(PRIVATE/'empty-auth'))
RECORD = {'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'owner': OWNER, 'deadlineSeconds': 600, 'stages': [], 'tag': TAG}
CID = None

def stamp(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def write(name, obj): (ART/name).write_text(json.dumps(obj, indent=2)+'\n')
def quick(argv, timeout=15):
    return subprocess.check_output(argv, env=ENV, cwd=ROOT, text=True, timeout=min(timeout, max(1, DEADLINE-time.monotonic())))
def battery():
    data=subprocess.check_output(['pmset','-g','batt'],text=True,timeout=3)
    m=re.search(r'(\d+)%;', data)
    if not m: raise RuntimeError('battery reading unavailable')
    return int(m.group(1))
def resources(pid=None):
    mem=0; pids=[]
    if pid:
        rows=[]
        for line in subprocess.check_output(['ps','-axo','pid=,ppid=,rss='], text=True,timeout=3).splitlines():
            v=line.split()
            if len(v)==3: rows.append(tuple(map(int,v)))
        found={pid}
        for _ in range(20):
            more={p for p,pp,r in rows if pp in found}
            if more <= found: break
            found |= more
        pids=[p for p,pp,r in rows if p in found]
        mem=sum(r*1024 for p,pp,r in rows if p in found)
    out={'elapsedSeconds':round(time.monotonic()-START,3),'ownedRSSBytes':mem,'ownedPIDs':pids,'freeDiskBytes':shutil.disk_usage(ROOT).free,'batteryPercent':battery()}
    if out['freeDiskBytes']<10737418240: raise RuntimeError('disk floor')
    if out['batteryPercent']<30: raise RuntimeError('battery floor')
    if mem>4294967296: raise RuntimeError('owned process RSS ceiling')
    if time.monotonic()>DEADLINE: raise RuntimeError('session deadline')
    return out
def run(name, argv, seconds, env=None):
    rec={'name':name,'argv':argv,'startedAt':stamp(),'maxSeconds':seconds,'samples':[]}
    RECORD['stages'].append(rec)
    log=ART/(name+'.stdout'); err=ART/(name+'.stderr')
    with log.open('wb') as out, err.open('wb') as serr:
        proc=subprocess.Popen(argv,cwd=ROOT,env=env or ENV,stdout=out,stderr=serr,start_new_session=True)
        rec['pid']=proc.pid
        stage_end=min(DEADLINE,time.monotonic()+seconds)
        try:
            while proc.poll() is None:
                rec['samples'].append(resources(proc.pid))
                if time.monotonic()>stage_end: raise RuntimeError(name+' deadline')
                time.sleep(0.5)
        except BaseException:
            if proc.poll() is None:
                os.killpg(proc.pid,signal.SIGTERM)
                try:proc.wait(timeout=3)
                except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait(timeout=3)
            raise
        finally:
            rec['returncode']=proc.poll();rec['finishedAt']=stamp();write(name+'-execution.json',rec)
    if rec['returncode']!=0:raise RuntimeError(name+' exit '+str(rec['returncode']))
    return rec
def scan(label, target):
    raw=PRIVATE/(label+'.json')
    cmd=[TRIVY,'--cache-dir',str(CACHE),'--config',str(PRIVATE/'trivy.yaml'),'image','--image-src','docker','--docker-host','unix:///var/run/docker.sock','--platform','linux/arm64','--scanners','vuln','--pkg-types','os,library','--parallel','1','--skip-db-update','--skip-java-db-update','--skip-check-update','--skip-version-check','--skip-vex-repo-update','--disable-telemetry','--offline-scan','--no-progress','--ignorefile',str(PRIVATE/'empty.ignore'),'--module-dir',str(PRIVATE/'modules'),'--format','json','--output',str(raw),'--timeout','150s',target]
    run(label,cmd,155)
    j=json.loads(raw.read_text());results=j.get('Results') or []
    overview={'ArtifactName':j.get('ArtifactName'),'ArtifactType':j.get('ArtifactType'),'Metadata':j.get('Metadata'),'resultCount':len(results),'results':[],'findingCounts':{},'findings':[]}
    for item in results:
        overview['results'].append({'target':item.get('Target'),'class':item.get('Class'),'type':item.get('Type'),'packages':len(item.get('Packages') or []),'findings':len(item.get('Vulnerabilities') or [])})
        for v in item.get('Vulnerabilities') or []:
            sev=v.get('Severity','UNKNOWN');overview['findingCounts'][sev]=overview['findingCounts'].get(sev,0)+1
            overview['findings'].append({'target':item.get('Target'),'class':item.get('Class'),'type':item.get('Type'),'id':v.get('VulnerabilityID'),'package':v.get('PkgName'),'installed':v.get('InstalledVersion'),'fixed':v.get('FixedVersion'),'severity':sev,'status':v.get('Status'),'primaryURL':v.get('PrimaryURL'),'dataSource':v.get('DataSource')})
    write(label+'-summary.json',overview)
    with raw.open('rb') as src,gzip.open(ART/(label+'-raw.json.gz'),'wb') as dst:shutil.copyfileobj(src,dst)
    if len(results)<2:raise RuntimeError(label+' insufficient analyzer results')
    for binary in ['usr/bin/cilium-operator-generic','usr/bin/gops']:
        if not any(x.get('Target')==binary and x.get('Type')=='gobinary' and len(x.get('Packages') or [])>0 for x in results):raise RuntimeError(label+' missing gobinary coverage '+binary)
    RECORD[label]=overview
    return j

try:
    RECORD['preflight']=resources()
    RECORD['dbMetadataBeforeSHA256']=sha(CACHE/'db/metadata.json')
    RECORD['dbBytesBeforeSHA256']=sha(CACHE/'db/trivy.db')
    prior=quick(DOCKER+['image','ls','--format','{{json .}}',TAG])
    if prior.strip():raise RuntimeError('candidate tag already exists; refuse overwrite')
    official=scan('official-baseline',BASE)
    build_env=dict(ENV,DOCKER_BUILDKIT='0')
    run('build',DOCKER+['build','--cpu-period=100000','--cpu-quota=200000','--memory=4g','--memory-swap=4g','--network=none','--force-rm','--platform=linux/arm64','--pull=false','--iidfile',str(PRIVATE/'image-id.txt'),'--tag',TAG,str(PRIVATE)],120,build_env)
    inspect=json.loads(quick(DOCKER+['image','inspect','--platform','linux/arm64',TAG]))[0]
    write('candidate-image-inspect.json',inspect)
    original=json.loads((ART/'official-image-inspect.json').read_text())
    fields=['Entrypoint','Cmd','User','Env','WorkingDir','Healthcheck','ExposedPorts','Volumes','StopSignal','Shell']
    diff={k:{'official':original['Config'].get(k),'candidate':inspect['Config'].get(k)} for k in fields if original['Config'].get(k)!=inspect['Config'].get(k)}
    RECORD['configComparison']={'fields':fields,'differences':diff,'officialConfig':original['Config'],'candidateConfig':inspect['Config']}
    write('config-comparison.json',RECORD['configComparison'])
    if diff:raise RuntimeError('unexpected runtime config delta')
    candidate=scan('candidate-image',TAG)
    # Extract the merged installed binary without executing the operator.
    create=DOCKER+['create','--pull=never','--platform=linux/arm64','--name',OWNER,'--label','com.kubeview.release-audit.owner='+OWNER,'--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user','65532:65532','--memory','256m','--cpus','1','--pids-limit','32','--entrypoint','/usr/bin/cilium-operator-generic',TAG,'--version']
    CID=quick(create).strip();RECORD['smokeCreateArgv']=create;RECORD['ownedCID']=CID
    ci=json.loads(quick(DOCKER+['inspect',CID]))[0];write('version-container-inspect.json',ci)
    h=ci['HostConfig']
    assert h['NetworkMode']=='none' and h['ReadonlyRootfs'] and h['Memory']==268435456 and h['NanoCpus']==1000000000 and h['PidsLimit']==32
    assert 'ALL' in h['CapDrop'] and 'no-new-privileges' in h['SecurityOpt'] and ci['Config']['User']=='65532:65532' and not ci['Mounts']
    extracted=PRIVATE/'image-extracted-operator'
    quick(DOCKER+['cp',CID+':/usr/bin/cilium-operator-generic',str(extracted)])
    RECORD['imageInstalledBinarySHA256']=sha(extracted)
    assert RECORD['imageInstalledBinarySHA256']=='9cde6566ecb775195173d76148e156a5cd6aa96e86b579d8c6176fadcfe0cb09'
    run('version-only',DOCKER+['start','--attach',CID],12)
    state=json.loads(quick(DOCKER+['inspect',CID]))[0]['State'];write('version-container-state.json',state)
    if state['Status']!='exited' or state['ExitCode']!=0 or state['OOMKilled']:raise RuntimeError('version smoke state failure')
    RECORD['dbMetadataAfterSHA256']=sha(CACHE/'db/metadata.json')
    RECORD['dbBytesAfterSHA256']=sha(CACHE/'db/trivy.db')
    assert RECORD['dbMetadataBeforeSHA256']==RECORD['dbMetadataAfterSHA256'] and RECORD['dbBytesBeforeSHA256']==RECORD['dbBytesAfterSHA256']
    RECORD['status']='LOCAL_DERIVED_IMAGE_FULL_IMAGE_SCAN_AND_VERSION_PASS_SCOPED'
except BaseException as exc:
    RECORD['status']='BLOCKED_OR_FAILED';RECORD['failure']=str(exc)
finally:
    if CID:
        try:
            label=quick(DOCKER+['inspect','--format','{{index .Config.Labels "com.kubeview.release-audit.owner"}}',CID]).strip()
            if label!=OWNER:raise RuntimeError('owned container label mismatch')
            quick(DOCKER+['rm','--force',CID])
            check=subprocess.run(DOCKER+['inspect',CID],env=ENV,capture_output=True,text=True,timeout=10)
            RECORD['ownedContainerRemovedAndAbsent']=check.returncode!=0
        except Exception as exc:RECORD['cleanupError']=str(exc)
    RECORD['finishedAt']=stamp();RECORD['elapsedSeconds']=round(time.monotonic()-START,3)
    RECORD['finalResources']=resources() if time.monotonic()<DEADLINE else {'deadlineReached':True}
    write('result.json',RECORD)
    print(json.dumps({'status':RECORD['status'],'failure':RECORD.get('failure'),'elapsedSeconds':RECORD['elapsedSeconds'],'tag':TAG,'findingCounts':RECORD.get('candidate-image',{}).get('findingCounts'),'cleanup':RECORD.get('ownedContainerRemovedAndAbsent')},indent=2),flush=True)
