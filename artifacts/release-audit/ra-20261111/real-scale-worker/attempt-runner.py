import os,time,json,hashlib,subprocess,datetime,signal
from pathlib import Path
r=Path.cwd();a=r/'artifacts/release-audit/ra-20261111/real-scale-worker';state=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01';start=time.time();names=['backend/pkg/server/release_operations_real_test.go','backend/pkg/server/workspace_real_test.go','backend/pkg/server/workspace_real_acceptance_test.go','backend/pkg/server/server.go','backend/pkg/server/resources.go','backend/pkg/server/connection.go','backend/pkg/server/workspace.go','backend/go.mod','backend/go.sum'];h=lambda q:hashlib.sha256(q.read_bytes()).hexdigest();manifest={n:h(r/n) for n in names};(a/'source-before.json').write_text(json.dumps(manifest,indent=2)+'\n');argv=['go','test','-count=1','-p=1','-parallel=1','-run','^TestReleaseOwnedScaleTwoThreeOne$','-timeout=180s','-json','./pkg/server'];env=os.environ.copy();env.update(GOTOOLCHAIN='go1.26.11',GOMAXPROCS='1',KUBEVIEW_RELEASE_REAL_SCALE='owned-profile06-2-3-1',KUBEVIEW_RELEASE_REAL_STATE=str(state/'lab.json'),KUBEVIEW_RELEASE_REAL_KUBECONFIG=str(state/'private/admin.json'),KUBEVIEW_RELEASE_REAL_OUTPUT=str(a));receipt={'startedAt':datetime.datetime.fromtimestamp(start,datetime.timezone.utc).isoformat(),'argv':argv,'cwd':'backend','env':{k:env[k] for k in ['GOTOOLCHAIN','GOMAXPROCS','KUBEVIEW_RELEASE_REAL_SCALE','KUBEVIEW_RELEASE_REAL_STATE','KUBEVIEW_RELEASE_REAL_KUBECONFIG','KUBEVIEW_RELEASE_REAL_OUTPUT']},'outerProcessWallLimitSeconds':240,'testTimeoutSeconds':180,'parallel':1,'sourceBaselineReferences':['4a05095a','52c80a31'],'sleepStallGapSecondsThreshold':5};(a/'command.json').write_text(json.dumps(receipt,indent=2)+'\n')
with (a/'go-test.jsonl').open('wb') as out,(a/'go-test.stderr').open('wb') as err:
 p=subprocess.Popen(argv,cwd=r/'backend',env=env,stdout=out,stderr=err,start_new_session=True);reason=None;last=time.time();maxgap=0
 while p.poll() is None:
  now=time.time();maxgap=max(maxgap,now-last);last=now
  if now-start>240:
   reason='OUTER_WALL_TIMEOUT';os.killpg(p.pid,signal.SIGTERM)
   try:p.wait(timeout=2)
   except:os.killpg(p.pid,signal.SIGKILL);p.wait()
   break
  time.sleep(.25)
 code=p.wait()
receipt.update({'exitCode':code,'stopReason':reason,'elapsedSeconds':round(time.time()-start,3),'maxOuterSampleGapSeconds':round(maxgap,3),'boundedControlValid':reason is None and maxgap<=5,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()});(a/'command.json').write_text(json.dumps(receipt,indent=2)+'\n');after={n:h(r/n) for n in names};(a/'source-after.json').write_text(json.dumps(after,indent=2)+'\n');(a/'source-comparison.json').write_text(json.dumps({'unchanged':after==manifest,'changed':[n for n in names if manifest[n]!=after[n]]},indent=2)+'\n');print(json.dumps(receipt));print('RESULT', (a/'result.json').read_text() if (a/'result.json').exists() else 'NO TEST EVIDENCE')
