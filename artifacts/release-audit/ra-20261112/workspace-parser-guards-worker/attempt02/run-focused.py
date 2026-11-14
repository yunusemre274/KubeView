import datetime,hashlib,json,os,pathlib,signal,subprocess,time,shutil
root=pathlib.Path(__file__).resolve().parents[5]
out=pathlib.Path(__file__).resolve().parent
plan=json.loads((out/'plan.json').read_text())
def utc(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
free=shutil.disk_usage(root).free
if free < 10*1024**3: raise SystemExit('preflight disk below 10GiB')
start=time.monotonic(); started=utc(); peak=0; samples=[]; stop=None
with (out/'go-test.jsonl').open('wb') as log:
    p=subprocess.Popen(plan['command'],cwd=plan['cwd'],env={**os.environ,**plan['env']},stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
    pgid=os.getpgid(p.pid)
    while p.poll() is None:
        rows=subprocess.check_output(['ps','-axo','pid=,ppid=,pgid=,rss='],text=True)
        owned=[]
        for row in rows.splitlines():
            v=row.split()
            if len(v)==4 and int(v[2])==pgid: owned.append({'pid':int(v[0]),'ppid':int(v[1]),'rssKiB':int(v[3])})
        rss=sum(x['rssKiB'] for x in owned);peak=max(peak,rss)
        samples.append({'elapsedSeconds':round(time.monotonic()-start,3),'rssKiB':rss,'processes':owned})
        if rss>1536*1024: stop='owned RSS >1.5GiB'
        if time.monotonic()-start>90: stop='outer 90s timeout'
        if stop:
            os.killpg(pgid,signal.SIGTERM)
            try:p.wait(timeout=1)
            except subprocess.TimeoutExpired:os.killpg(pgid,signal.SIGKILL);p.wait()
            break
        time.sleep(.15)
    code=p.wait()
source_after={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in plan['sourceBefore']}
test='backend/pkg/server/release_workspace_parser_test.go';testsha=hashlib.sha256((root/test).read_bytes()).hexdigest()
remaining=[]
for row in subprocess.check_output(['ps','-axo','pid=,ppid=,pgid=,rss='],text=True).splitlines():
    v=row.split()
    if len(v)==4 and int(v[2])==pgid: remaining.append(int(v[0]))
execution={'startedAt':started,'finishedAt':utc(),'elapsedSeconds':time.monotonic()-start,'exitCode':code,'stopReason':stop,'command':plan['command'],'cwd':plan['cwd'],'env':plan['env'],'freeDiskBytesBefore':free,'peakSampledOwnedRSSKiB':peak,'rssSamples':samples,'sourceBefore':plan['sourceBefore'],'sourceAfter':source_after,'runtimeSourceUnchanged':source_after==plan['sourceBefore'],'testSourceBeforeSHA256':plan['testSourceBeforeSHA256'],'testSourceAfterSHA256':testsha,'testSourceUnchangedDuringRun':testsha==plan['testSourceBeforeSHA256'],'cleanup':{'ownedProcessGroup':pgid,'remainingOwnedPIDs':remaining,'httptestInProcess':True,'networkListenerStarted':False,'privateWorkspaceTempDirs':'testing.TempDir; removed by Go testing cleanup','serverClose':'existing testServer registers t.Cleanup(s.Close)'}}
(out/'execution.json').write_text(json.dumps(execution,indent=2)+'\n')
print(json.dumps({k:execution[k] for k in ['elapsedSeconds','exitCode','stopReason','peakSampledOwnedRSSKiB','runtimeSourceUnchanged','testSourceUnchangedDuringRun','cleanup']},indent=2))
