from pathlib import Path
import subprocess,os,sys,json,time,datetime,signal,re,shutil,hashlib
r=Path.cwd();a=r/'artifacts/release-audit/ra-20261111/real-scale-current-helper-worker';base=Path.home()/'Library/Application Support/KubeView/release-audit-hubble-20261111-cold01';pre=json.loads((a/'offline-preflight.json').read_text());assert pre['offlinePreflightPass'];ct=json.loads((a/'container-preflight.json').read_text());assert all(x['storedMatch'] and not x['running'] and x['labels'].get('created_by.minikube.sigs.k8s.io')=='true' for x in ct);flow=json.loads((a/'resume-flow-review.json').read_text());assert flow['telemetryAlreadyInstalled'] and flow['alreadyRecordedBootstrapRepair'] and flow['storedProcessKeys']==[]
argv=[sys.executable,str(r/'scripts/manual_lab.py'),'up','--profile','06-limanlar-arasi-ag','--telemetry','--state-dir',str(base),'--minikube-binary',str(r/pre['hashes']['minikube']['path']),'--hubble-binary',str(r/pre['hashes']['hubble']['path'])];started=time.time();end=min(started+240,datetime.datetime.fromisoformat(pre['hardDeadlineAt']).timestamp()-275);receipt={'argv':argv,'startedAt':datetime.datetime.fromtimestamp(started,datetime.timezone.utc).isoformat(),'warmupMaxSeconds':240,'effectiveDeadline':datetime.datetime.fromtimestamp(end,datetime.timezone.utc).isoformat(),'powerSamples':[]};(a/'resume-command.json').write_text(json.dumps(receipt,indent=2)+'\n');p=subprocess.Popen(argv,cwd=r,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True);reason=None;lastCheck=0;last=time.time();maxgap=0
while p.poll() is None:
 now=time.time();maxgap=max(maxgap,now-last);last=now
 if now>=end:reason='WARMUP_OR_GLOBAL_RESERVE_DEADLINE'
 if now-lastCheck>4:
  raw=subprocess.run(['pmset','-g','batt'],capture_output=True,text=True,timeout=2).stdout;m=re.search(r'(\d+)%;',raw);pct=int(m.group(1)) if m else None;ac='AC Power' in raw;free=shutil.disk_usage(r).free;receipt['powerSamples'].append({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'AC':ac,'batteryPercent':pct,'freeDiskBytes':free});lastCheck=now
  if not ac or pct is None or pct<=15 or free<10737418240:reason='POWER_OR_DISK_STOP'
 if reason:
  os.killpg(p.pid,signal.SIGINT)
  try:p.wait(timeout=7)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=3)
  break
 time.sleep(.25)
out,err=p.communicate(timeout=3)
def scrub(data):
 text=data.decode(errors='replace');text=re.sub(r'-----BEGIN [^-]+-----.*?-----END [^-]+-----','[PEM REDACTED]',text,flags=re.S);text=re.sub(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[TOKEN REDACTED]',text);return re.sub(r'(?i)(bearer\s+)[^\s\"\x27]+',r'\1[REDACTED]',text)
(a/'resume.stdout').write_text(scrub(out));(a/'resume.stderr').write_text(scrub(err));receipt.update({'exitCode':p.returncode,'stopReason':reason,'elapsedSeconds':round(time.time()-started,3),'maxMonitorGapSeconds':round(maxgap,3),'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS' if p.returncode==0 and reason is None and maxgap<5 else 'FAIL'});(a/'resume-command.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt));print('STDOUT',scrub(out)[-1500:]);print('STDERR',scrub(err)[-800:])
