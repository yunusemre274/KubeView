#!/usr/bin/env python3
"""One bounded, sequential two-image OS Medium derivation and full image retest."""
import datetime,gzip,hashlib,json,os,pathlib,re,shutil,signal,subprocess,time,uuid

ROOT=pathlib.Path('/Users/yunusemre/Desktop/KubeView')
P=ROOT/'.git/release-audit/provider-os-medium/attempt02'
A=ROOT/'artifacts/release-audit/ra-20261112/provider-os-medium-worker/attempt02'
D=['/usr/local/bin/docker','--host','unix:///var/run/docker.sock']
CACHE=ROOT/'.git/release-audit/trivy-cache'
TRIVY='/opt/homebrew/Cellar/trivy/0.74.0/bin/trivy'
OWNER='kv-os-medium-'+uuid.uuid4().hex
GLOBAL_BUDGET=json.loads((P.parent/'global-budget.json').read_text())
START=time.monotonic();DEADLINE=START+max(0,GLOBAL_BUDGET['globalDeadlineEpoch']-time.time()-60)
ENV={k:v for k,v in os.environ.items()if not k.startswith(('TRIVY_','DOCKER_','AWS_','AZURE_','GOOGLE_','GCP_','REGISTRY_'))}
ENV.update(GOMAXPROCS='2',GOMEMLIMIT='1GiB',DOCKER_CONFIG=str(P/'empty-auth'),REGISTRY_AUTH_FILE=str(P/'empty-registry-auth.json'),XDG_CONFIG_HOME=str(P/'empty-auth'),XDG_RUNTIME_DIR=str(P/'empty-auth'))
PLAN=json.loads((A/'execution-plan.json').read_text())
PRIOR_ART=ROOT/'artifacts/release-audit/ra-20261112/provider-apt-images-worker'
PRIOR_PRIVATE=ROOT/'.git/release-audit/provider-apt-images'
EXPECTED=json.loads((PRIOR_ART/'prior-exact-image-analyzer-coverage.json').read_text())
RESULT={'owner':OWNER,'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'deadlineSeconds':600,'dataCollectionDeadlineSeconds':round(DEADLINE-START,3),'reservedFinalizationSeconds':60,'originalGlobalDeadlineEpoch':GLOBAL_BUDGET['globalDeadlineEpoch'],'firstAttemptStartedAt':GLOBAL_BUDGET['firstAttemptStartedAt'],'stages':[],'images':{},'ownedIntermediateContainers':{},'ownedInspectionContainers':[]}

def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(f):
    with f.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def write(n,j):(A/n).write_text(json.dumps(j,indent=2)+'\n')
def quick(cmd,timeout=15):return subprocess.check_output(cmd,cwd=ROOT,env=ENV,text=True,timeout=min(timeout,max(1,DEADLINE-time.monotonic())))
def inspect(cid):
    q=subprocess.run(D+['inspect',cid],env=ENV,capture_output=True,text=True,timeout=4)
    return json.loads(q.stdout)[0]if q.returncode==0 else None
def sample(pid):
    rows=[tuple(map(int,s.split()))for s in subprocess.check_output(['ps','-axo','pid=,ppid=,rss='],text=True,timeout=3).splitlines()if len(s.split())==3]
    found={pid,os.getpid()}
    for _ in range(20):
        extra={i for i,pp,r in rows if pp in found}
        if extra<=found:break
        found|=extra
    raw=subprocess.check_output(['pmset','-g','batt'],text=True,timeout=3);m=re.search(r'(\d+)%;',raw)
    if not m:raise RuntimeError('battery unavailable')
    v={'elapsedSeconds':round(time.monotonic()-START,3),'ownedRSSBytes':sum(r*1024 for i,pp,r in rows if i in found),'ownedPIDs':[i for i,pp,r in rows if i in found],'batteryPercent':int(m.group(1)),'freeDiskBytes':shutil.disk_usage(ROOT).free}
    if v['ownedRSSBytes']>4294967296:raise RuntimeError('client process RSS ceiling')
    if v['batteryPercent']<30:raise RuntimeError('battery floor')
    if v['freeDiskBytes']<10737418240:raise RuntimeError('disk floor')
    if time.monotonic()>DEADLINE:raise RuntimeError('session deadline')
    return v
def normalized(s):return ' '.join(s.replace('\\\n',' ').split())
def discover_build(rec):
    data=(A/(rec['name']+'.stdout')).read_text(errors='replace')
    for short in re.findall(r'Running in ([0-9a-f]{12,64})',data):
        if short in RESULT['ownedIntermediateContainers']:continue
        ci=inspect(short)
        if not ci:
            RESULT['ownedIntermediateContainers'][short]={'buildStage':rec['name'],'discoveredInOwnedBuildStdout':True,'alreadyAbsentBeforeInspect':True}
            continue
        actual=ci['Config'].get('Cmd')or[]
        same_command=len(actual)>=3 and actual[:2]==['/bin/sh','-c']and normalized(actual[2])==rec['expectedRUNNormalized']
        prefix=data.split('Running in '+short,1)[0]
        copy_ids=re.findall(r' ---> ([0-9a-f]{12,64})\s*$',prefix,re.MULTILINE)
        copy_short=copy_ids[-1] if copy_ids else ''
        cp=json.loads(quick(D+['image','inspect','--platform','linux/arm64',ci['Image']]))[0]
        same_image=bool(copy_short) and cp['Id'].split(':')[-1].startswith(copy_short) and cp.get('Parent')==rec['baseManifestID'] and cp['RootFS']['Layers'][:len(rec['baseLayers'])]==rec['baseLayers'] and len(cp['RootFS']['Layers'])==len(rec['baseLayers'])+1 and cp['Config']==rec['baseRuntimeConfig']
        write(rec['name']+'-COPY-parent-inspect.json',cp)
        entry={'buildStage':rec['name'],'cid':ci['Id'],'discoveredInOwnedBuildStdout':True,'image':ci.get('Image'),'configImage':ci['Config'].get('Image'),'expectedImageRelationship':same_image,'expectedCommandRelationship':same_command,'RUNCommandSHA256':hashlib.sha256(actual[-1].encode()).hexdigest(),'HostConfig':{k:ci['HostConfig'].get(k)for k in ['CpuPeriod','CpuQuota','Memory','MemorySwap','NetworkMode']},'ownedVerified':same_image and same_command}
        RESULT['ownedIntermediateContainers'][short]=entry
        if not entry['ownedVerified']:raise RuntimeError('intermediate ownership relationship could not be verified')
        h=ci['HostConfig']
        if not(h['CpuPeriod']==100000 and h['CpuQuota']==200000 and h['Memory']==4294967296 and h['MemorySwap']==4294967296 and h['NetworkMode']=='none'):raise RuntimeError('RUN resource limits mismatch')
        write(rec['name']+'-intermediate-inspect.json',ci)
def cleanup_build(rec):
    discover_build(rec)
    for short,j in RESULT['ownedIntermediateContainers'].items():
        if j['buildStage']!=rec['name']:continue
        ci=inspect(short)
        if ci:
            if not j.get('ownedVerified'):raise RuntimeError('refuse cleanup of unverified intermediate')
            now_cmd=ci['Config'].get('Cmd')or[]
            if len(now_cmd)<3 or normalized(now_cmd[2])!=rec['expectedRUNNormalized']or ci['Id']!=j['cid']:raise RuntimeError('intermediate identity changed')
            subprocess.run(D+['rm','--force',j['cid']],env=ENV,capture_output=True,text=True,check=True,timeout=8)
        j['removedAndAbsent']=inspect(short)is None
def run(name,argv,limit,env=None,build=None):
    rec={'name':name,'argv':argv,'startedAt':stamp(),'maxSeconds':limit,'samples':[]}
    if build:rec.update(build)
    RESULT['stages'].append(rec)
    with (A/(name+'.stdout')).open('wb')as out,(A/(name+'.stderr')).open('wb')as err:
        proc=subprocess.Popen(argv,cwd=ROOT,env=env or ENV,stdout=out,stderr=err,start_new_session=True);rec['pid']=proc.pid;until=min(DEADLINE,time.monotonic()+limit)
        try:
            while proc.poll()is None:
                rec['samples'].append(sample(proc.pid))
                if build:discover_build(rec)
                if time.monotonic()>until:raise RuntimeError(name+' deadline')
                time.sleep(.5)
        except BaseException:
            if build:
                try:cleanup_build(rec)
                except Exception as exc:RESULT.setdefault('cleanupErrors',[]).append(str(exc))
            if proc.poll()is None:
                os.killpg(proc.pid,signal.SIGTERM)
                try:proc.wait(timeout=3)
                except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait(timeout=3)
            raise
        finally:
            if build:
                try:cleanup_build(rec)
                except Exception as exc:RESULT.setdefault('cleanupErrors',[]).append(str(exc))
            rec['returncode']=proc.poll();rec['finishedAt']=stamp();write(name+'-execution.json',rec)
    if rec['returncode']!=0:raise RuntimeError(name+' exit '+str(rec['returncode']))
    return rec
def scan(label,ref,expected):
    raw=P/(label+'.json');cmd=[TRIVY,'--cache-dir',str(CACHE),'--config',str(P/'trivy.yaml'),'image','--image-src','docker','--docker-host','unix:///var/run/docker.sock','--platform','linux/arm64','--scanners','vuln','--pkg-types','os,library','--parallel','1','--skip-db-update','--skip-java-db-update','--skip-check-update','--skip-version-check','--skip-vex-repo-update','--disable-telemetry','--offline-scan','--no-progress','--ignorefile',str(P/'empty.ignore'),'--module-dir',str(P/'modules'),'--format','json','--output',str(raw),'--timeout','70s',ref]
    run(label,cmd,75);j=json.loads(raw.read_text());results=j.get('Results')or[]
    overview={'artifactName':j.get('ArtifactName'),'metadata':j.get('Metadata'),'results':[],'findingCounts':{},'findings':[]}
    if j['Metadata'].get('OS')!=expected['OS']:raise RuntimeError(label+' OS coverage mismatch')
    os_results=[x for x in results if x.get('Class')=='os-pkgs'and x.get('Type')=='ubuntu'and x.get('Packages')]
    if len(os_results)!=1:raise RuntimeError(label+' missing nonempty Ubuntu package result')
    wanted={x['Target']for x in expected['results']if x.get('Type')=='gobinary'}
    actual={x['Target']for x in results if x.get('Type')=='gobinary'and x.get('Packages')}
    if wanted!=actual:raise RuntimeError(label+' gobinary coverage mismatch')
    for x in results:
        overview['results'].append({'target':x.get('Target'),'class':x.get('Class'),'type':x.get('Type'),'packages':len(x.get('Packages')or[]),'findings':len(x.get('Vulnerabilities')or[])})
        for v in x.get('Vulnerabilities')or[]:
            sev=v.get('Severity','UNKNOWN');overview['findingCounts'][sev]=overview['findingCounts'].get(sev,0)+1
            overview['findings'].append({'target':x.get('Target'),'class':x.get('Class'),'type':x.get('Type'),'id':v.get('VulnerabilityID'),'package':v.get('PkgName'),'installed':v.get('InstalledVersion'),'fixed':v.get('FixedVersion'),'severity':sev,'status':v.get('Status'),'dataSource':v.get('DataSource'),'primaryURL':v.get('PrimaryURL')})
    write(label+'-summary.json',overview)
    with raw.open('rb')as src,gzip.open(A/(label+'-raw.json.gz'),'wb')as dst:shutil.copyfileobj(src,dst)
    return j,overview
def package_map(text):
    out={}
    for para in text.split('\n\n'):
        q={s.split(': ',1)[0]:s.split(': ',1)[1]for s in para.splitlines()if ': 'in s and not s.startswith(' ')}
        if q.get('Status')=='install ok installed':out[q['Package']]={'version':q['Version'],'architecture':q.get('Architecture')}
    return out
def inspect_assets(label,ref,paths):
    owner=OWNER+'-'+label;cid=None;record={'label':label,'owner':owner,'ref':ref}
    try:
        argv=D+['create','--pull=never','--platform=linux/arm64','--name',owner,'--label','com.kubeview.release-audit.owner='+owner,'--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user','65532:65532','--memory','256m','--cpus','1','--pids-limit','32','--entrypoint','/usr/bin/sha256sum',ref]+paths
        cid=quick(argv).strip();record['cid']=cid;RESULT['ownedInspectionContainers'].append(record);ci=inspect(cid);record['baseConfigID']=ci['Image'];write(label+'-asset-container-inspect.json',ci)
        run(label+'-asset-hashes',D+['start','--attach',cid],35)
        hashes={line.split('  ',1)[1]:line.split('  ',1)[0]for line in (A/(label+'-asset-hashes.stdout')).read_text().splitlines()if '  'in line};record['assetSHA256']=hashes
        dest=P/(label+'-dpkg-status.txt');quick(D+['cp',cid+':/var/lib/dpkg/status',str(dest)]);record['dpkgStatusSHA256']=sha(dest);record['packages']=package_map(dest.read_text());shutil.copy2(dest,A/dest.name)
        return record
    finally:
        if cid:
            ci=inspect(cid)
            if ci and ci['Config']['Labels'].get('com.kubeview.release-audit.owner')!=owner:raise RuntimeError('inspection owner mismatch')
            if ci:subprocess.run(D+['rm','--force',cid],env=ENV,capture_output=True,text=True,check=True,timeout=8)
            record['removedAndAbsent']=inspect(cid)is None
            write(label+'-asset-record.json',record)

try:
    for name,text in [('trivy.yaml','{}\n'),('empty.ignore',''),('empty-registry-auth.json','{"auths":{}}\n')]: (P/name).write_text(text)
    (P/'empty-auth').mkdir(exist_ok=True);(P/'empty-auth/config.json').write_text('{"auths":{}}\n');(P/'modules').mkdir(exist_ok=True)
    RESULT['preflight']=sample(os.getpid());RESULT['trivyBinarySHA256']=sha(pathlib.Path(TRIVY));RESULT['dbMetadataBeforeSHA256']=sha(CACHE/'db/metadata.json');RESULT['dbBeforeSHA256']=sha(CACHE/'db/trivy.db');RESULT['dbMetadata']=json.loads((CACHE/'db/metadata.json').read_text())
    for spec,expected in zip(PLAN['sequence'],EXPECTED):
        label=spec['label'];ref=spec['base'];tag=spec['localTag'];entry={'base':ref,'tag':tag};RESULT['images'][label]=entry
        old=quick(D+['image','ls','--format','{{json .}}',tag])
        if old.strip():raise RuntimeError('refuse overwrite of existing candidate tag '+tag)
        base_inspect=json.loads(quick(D+['image','inspect','--platform','linux/arm64',ref]))[0]
        tag_inspect=json.loads(quick(D+['image','inspect','--platform','linux/arm64',spec['inputMutableTag']]))[0]
        guarded=json.loads((A/(label+'-input-image-inspect.json')).read_text())
        if base_inspect['Descriptor']['digest']!=spec['guardedInputLocalDescriptorDigest'] or tag_inspect['Descriptor']['digest']!=spec['guardedInputLocalDescriptorDigest'] or base_inspect['Config']!=guarded['Config'] or base_inspect['RootFS']!=guarded['RootFS']:raise RuntimeError('exact local parent descriptor/config/layers guard failed')
        entry['inputLocalParentGuardPassed']=True
        baseline=json.loads((PRIOR_PRIVATE/(label+'-candidate.json')).read_text())
        entry['baseline']=json.loads((PRIOR_ART/(label+'-candidate-summary.json')).read_text())
        with gzip.open(PRIOR_ART/(label+'-candidate-raw.json.gz'),'rb') as src:preserved_raw_sha=hashlib.file_digest(src,'sha256').hexdigest()
        if sha(PRIOR_PRIVATE/(label+'-candidate.json'))!=preserved_raw_sha:raise RuntimeError('reused baseline raw byte hash mismatch')
        entry['baselineReusedWithoutRerun']={'rawSHA256':preserved_raw_sha,'sameGuardedImageDescriptor':spec['guardedInputLocalDescriptorDigest']}
        write(label+'-reused-baseline-summary.json',entry['baseline'])
        paths=['/'+x['Target']for x in expected['results']if x.get('Type')=='gobinary']+['/usr/bin/cilium-envoy','/usr/bin/cilium-envoy-starter','/etc/ssl/certs/ca-certificates.crt','/etc/apt/sources.list.d/ubuntu.sources','/usr/share/keyrings/ubuntu-archive-keyring.gpg']
        if label=='cilium':paths.append('/LICENSE.all')
        entry['officialAssets']=json.loads((PRIOR_ART/(label+'-result.json')).read_text())['candidateAssets']
        text=(pathlib.Path(spec['buildContext'])/'Dockerfile').read_text();script=text.split('RUN ',1)[1].strip();base_inspect=json.loads((A/(label+'-input-image-inspect.json')).read_text())
        cmd=D+['build','--cpu-period=100000','--cpu-quota=200000','--memory=4g','--memory-swap=4g','--network=none','--force-rm','--platform=linux/arm64','--pull=false','--iidfile',str(P/(label+'-image-id.txt')),'--tag',tag,spec['buildContext']]
        run(label+'-build',cmd,150,dict(ENV,DOCKER_BUILDKIT='0'),{'expectedRUNNormalized':normalized(script),'baseReference':ref,'baseManifestID':base_inspect['Id'],'baseConfigID':base_inspect['Id'],'baseLayers':base_inspect['RootFS']['Layers'],'baseRuntimeConfig':base_inspect['Config']})
        im=json.loads(quick(D+['image','inspect','--platform','linux/arm64',tag]))[0];entry['candidateImage']=im;write(label+'-candidate-image-inspect.json',im)
        if im['Config']!=base_inspect['Config']:raise RuntimeError(label+' image config differs')
        if im['RootFS']['Layers'][:len(base_inspect['RootFS']['Layers'])]!=base_inspect['RootFS']['Layers']:raise RuntimeError(label+' original layer prefix differs')
        (A/(label+'-candidate-image-history.jsonl')).write_text(quick(D+['image','history','--no-trunc','--format','{{json .}}',tag]))
        candidate,entry['candidate']=scan(label+'-candidate',tag,expected)
        entry['candidateAssets']=inspect_assets(label+'-candidate',tag,paths)
        if entry['officialAssets']['assetSHA256']!=entry['candidateAssets']['assetSHA256']:raise RuntimeError(label+' provider/source/CA/key/license asset bytes changed')
        before=entry['officialAssets']['packages'];after=entry['candidateAssets']['packages'];changes={k:{'before':before.get(k),'after':after.get(k)}for k in before.keys()|after.keys()if before.get(k)!=after.get(k)};entry['packageChanges']=changes;write(label+'-package-changes.json',changes)
        if set(changes)!=set(spec['pinnedUpgradePackages']):raise RuntimeError(label+' package changes exceed exact package allowlist')
        for k,v in spec['pinnedUpgradePackages'].items():
            if after[k]['version']!=v:raise RuntimeError(label+' fixed version mismatch')
        patched_findings=[x for x in entry['candidate']['findings']if x['package']in spec['pinnedUpgradePackages']];entry['candidatePatchedPackageFindings']=patched_findings
        original_targets={(x['id'],x['package']) for x in entry['baseline']['findings'] if x['package'] in spec['pinnedUpgradePackages']}
        if any((x['id'],x['package']) in original_targets for x in patched_findings):raise RuntimeError(label+' original target Medium CVE remains')
        entry['originalPatchedPackageRowsRemoved']=len(original_targets)
        if entry['candidate']['metadata'].get('OS')!=entry['baseline']['metadata'].get('OS'):raise RuntimeError('OS identity delta')
        def go_rows(raw):return {(x['Target'],v.get('VulnerabilityID'),v.get('PkgName'),v.get('InstalledVersion'),v.get('Severity'))for x in raw.get('Results',[])if x.get('Type')=='gobinary'for v in x.get('Vulnerabilities')or[]}
        entry['GoFindingTuplesUnchanged']=go_rows(baseline)==go_rows(candidate)
        if not entry['GoFindingTuplesUnchanged']:raise RuntimeError(label+' unexpected Go finding delta')
        entry['status']='OS_MEDIUM_ONLY_LOCAL_IMAGE_AND_FULL_IMAGE_RETEST_PASS_SCOPED';write(label+'-result.json',entry)
    RESULT['dbMetadataAfterSHA256']=sha(CACHE/'db/metadata.json');RESULT['dbAfterSHA256']=sha(CACHE/'db/trivy.db')
    if RESULT['dbMetadataBeforeSHA256']!=RESULT['dbMetadataAfterSHA256']or RESULT['dbBeforeSHA256']!=RESULT['dbAfterSHA256']:raise RuntimeError('DB changed')
    RESULT['status']='BOTH_OS_MEDIUM_IMAGES_FULL_IMAGE_RETEST_PASS_SCOPED'
except BaseException as exc:
    RESULT['status']='BLOCKED_OR_FAILED';RESULT['failure']=str(exc)
finally:
    for rec in RESULT['stages']:
        if 'expectedRUNNormalized'in rec:
            try:cleanup_build(rec)
            except Exception as exc:RESULT.setdefault('cleanupErrors',[]).append(str(exc))
    RESULT['finishedAt']=stamp();RESULT['elapsedSeconds']=round(time.monotonic()-START,3)
    RESULT['finalResources']=sample(os.getpid())if time.monotonic()<DEADLINE else {'deadlineReached':True}
    write('result.json',RESULT)
    print(json.dumps({'status':RESULT['status'],'failure':RESULT.get('failure'),'elapsedSeconds':RESULT['elapsedSeconds'],'imageStatuses':{k:v.get('status')for k,v in RESULT['images'].items()},'cleanupErrors':RESULT.get('cleanupErrors')},indent=2),flush=True)
