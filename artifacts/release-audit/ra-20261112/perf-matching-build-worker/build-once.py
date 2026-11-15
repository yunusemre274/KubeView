import pathlib,json,os,subprocess,time,signal,hashlib,shutil,datetime,re
R=pathlib.Path('/Users/yunusemre/Desktop/KubeView');P=R/'.git/release-audit/perf-matching-build';A=R/'artifacts/release-audit/ra-20261112/perf-matching-build-worker'
JOB=json.loads((P/'job.json').read_text());PREP=json.loads((P/'prepared.json').read_text());NODE='/Users/yunusemre/.nvm/versions/node/v24.16.0/bin/node';GO='/Users/yunusemre/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin/go'
ENV=dict(os.environ,GOTOOLCHAIN='local',GOMAXPROCS='2',GOMEMLIMIT='2GiB',CGO_ENABLED='0',GOPROXY='off',UV_THREADPOOL_SIZE='2',NODE_OPTIONS='--max-old-space-size=2048')
REC={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'frontend-browser-common-backend','job':JOB,'stages':[],'testsExecuted':False,'appsOrBrowsersStarted':False}
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(f):
 with f.open('rb')as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def sample():
 rows=[tuple(map(int,line.split()))for line in subprocess.check_output(['ps','-axo','pid=,ppid=,rss='],text=True,timeout=3).splitlines()if len(line.split())==3];found={os.getpid()}
 for _ in range(20):
  added={pid for pid,ppid,rss in rows if ppid in found}
  if added<=found:break
  found|=added
 batt=subprocess.check_output(['pmset','-g','batt'],text=True,timeout=3);m=re.search(r'(\d+)%;',batt)
 if not m:raise RuntimeError('battery reading unavailable')
 j={'at':stamp(),'ownedPIDs':[pid for pid,ppid,rss in rows if pid in found],'ownedRSSBytes':sum(rss*1024 for pid,ppid,rss in rows if pid in found),'batteryPercent':int(m.group(1)),'freeDiskBytes':shutil.disk_usage(R).free}
 if j['ownedRSSBytes']>4294967296:raise RuntimeError('4GiB owned RSS ceiling')
 if j['batteryPercent']<30:raise RuntimeError('battery30% floor')
 if j['freeDiskBytes']<10737418240:raise RuntimeError('disk10GiB floor')
 if time.time()>JOB['dataDeadlineEpoch']:raise RuntimeError('data deadline;60s finalization reserved')
 return j
def run(name,argv,cwd,limit):
 rec={'name':name,'argv':argv,'cwd':str(cwd),'startedAt':stamp(),'maxSeconds':limit,'environment':{k:ENV[k]for k in ['GOTOOLCHAIN','GOMAXPROCS','GOMEMLIMIT','CGO_ENABLED','GOPROXY','UV_THREADPOOL_SIZE','NODE_OPTIONS']},'samples':[]};REC['stages'].append(rec)
 with(A/(name+'.stdout')).open('wb')as out,(A/(name+'.stderr')).open('wb')as err:
  proc=subprocess.Popen(argv,cwd=cwd,env=ENV,stdout=out,stderr=err,start_new_session=True);rec['pid']=proc.pid;rec['birth']=subprocess.check_output(['ps','-p',str(proc.pid),'-o','lstart='],text=True,timeout=3).strip();end=min(JOB['dataDeadlineEpoch'],time.time()+limit)
  try:
   while proc.poll()is None:
    rec['samples'].append(sample())
    if time.time()>end:raise RuntimeError(name+' stage timeout')
    time.sleep(.5)
  except BaseException:
   if proc.poll()is None:
    os.killpg(proc.pid,signal.SIGTERM)
    try:proc.wait(timeout=3)
    except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait(timeout=3)
   raise
  finally:rec['exitCode']=proc.poll();rec['finishedAt']=stamp();(A/(name+'-execution.json')).write_text(json.dumps(rec,indent=2)+'\n')
 if rec['exitCode']!=0:raise RuntimeError(name+' exit'+str(rec['exitCode']))
try:
 REC['preflight']=sample();REC['toolSHA256']={'node':sha(pathlib.Path(NODE)),'go':sha(pathlib.Path(GO)),'panel-build':sha(R/'benchmarks/panel-build.mjs')}
 for side in ['A','B']:
  run('vite-'+side,[NODE,str(R/'benchmarks/panel-build.mjs'),PREP['tags'][side],'--source',str(pathlib.Path(PREP['sources'][side]['root'])/'frontend')],R,120)
 common=R/'benchmarks/.build'/PREP['tags']['common'];common.mkdir(exist_ok=False)
 run('go-test-compile',[GO,'test','-c','-p','1','-o',str(common/'backend.test'),'./pkg/server'],pathlib.Path(PREP['commonBackendSource']),180)
 REC['commonBackend']={'tag':PREP['tags']['common'],'path':str(common/'backend.test'),'sha256':sha(common/'backend.test'),'bytes':(common/'backend.test').stat().st_size}
 builds={}
 for side in ['A','B']:
  tag=PREP['tags'][side];root=R/'benchmarks/.build'/tag;link=root/'backend.test';assert not link.exists();link.symlink_to(pathlib.Path('..')/PREP['tags']['common']/'backend.test');prov=json.loads((R/'benchmarks/.build'/(tag+'.json')).read_text());assets={str(f.relative_to(root)):sha(f)for f in sorted(root.rglob('*'))if f.is_file()and f.name!='backend.test'};assert sha(link)==REC['commonBackend']['sha256'];builds[side]={'tag':tag,'path':str(root),'provenancePath':str(R/'benchmarks/.build'/(tag+'.json')),'provenanceSHA256':sha(R/'benchmarks/.build'/(tag+'.json')),'sourceSHA256':prov['sourceSHA256'],'sourceFiles':prov['files'],'profiling':prov['profiling'],'assets':assets,'indexSHA256':sha(root/'index.html'),'backendSymlink':str(link),'backendSHA256':sha(link)}
 REC['builds']=builds;REC['frontendSourceByteIdentical']=builds['A']['sourceFiles']==builds['B']['sourceFiles'];REC['frontendAssetsByteIdentical']=builds['A']['assets']==builds['B']['assets'];REC['status']='TWO_FROZEN_FRONTENDS_ONE_COMMON_BACKEND_COMPILED_SCOPED_PASS'
except BaseException as exc:REC['status']='FAILED_PRESERVED';REC['failure']=str(exc)
finally:
 REC['finishedAt']=stamp();REC['elapsedFromOriginalStartSeconds']=round(time.time()-JOB['startedEpoch'],3);REC['remainingOriginalBudgetSeconds']=round(JOB['deadlineEpoch']-time.time(),3)
 try:REC['finalResources']=sample()
 except Exception as exc:REC['finalResourceError']=str(exc)
 (A/'result.json').write_text(json.dumps(REC,indent=2)+'\n');print(json.dumps({'status':REC['status'],'failure':REC.get('failure'),'elapsedFromOriginalStartSeconds':REC['elapsedFromOriginalStartSeconds'],'remainingSeconds':REC['remainingOriginalBudgetSeconds'],'frontendSourceByteIdentical':REC.get('frontendSourceByteIdentical'),'frontendAssetsByteIdentical':REC.get('frontendAssetsByteIdentical')},indent=2),flush=True)
