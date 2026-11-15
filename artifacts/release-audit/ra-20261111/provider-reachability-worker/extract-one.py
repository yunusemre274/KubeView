from pathlib import Path
import json,os,sys,subprocess,time,datetime,hashlib,signal,shutil,uuid
root=Path('/Users/yunusemre/Desktop/KubeView');private=root/'.git/release-audit/provider-reachability-worker';art=root/'artifacts/release-audit/ra-20261111/provider-reachability-worker';cfg=json.loads((private/'config.json').read_text());deadline=datetime.datetime.fromisoformat(cfg['deadline_utc']).timestamp();target=next(x for x in cfg['targets'] if x['label']==sys.argv[1]);label=target['label'];outdir=private/label;outdir.mkdir(exist_ok=True);env={k:v for k,v in os.environ.items() if k not in ['DOCKER_AUTH_CONFIG'] and not k.startswith(('AWS_','REGISTRY_'))};env.update(GOMAXPROCS='1',DOCKER_CONFIG=str(private/'auth'));base=[cfg['docker_binary'],'--config',str(private/'auth'),'--host',cfg['docker_host']];logs=[];receipt={'image':label,'digest':target['ref'],'started_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'never_started':True,'files':[]};cid=None;owner=uuid.uuid4().hex
# Runtime commands are strictly allowlisted pull/image-inspect/create/cp/owned-container-inspect/rm.
def command(stage,args,limit=150,required=True):
 start=time.monotonic();timeout=max(1,min(limit,int(deadline-time.time())));cmd=base+args;stdout=private/(label+'-'+stage+'.stdout');stderr=private/(label+'-'+stage+'.stderr');stop=None;peak=0
 with stdout.open('w') as out,stderr.open('w') as err:
  p=subprocess.Popen(cmd,env=env,stdout=out,stderr=err,start_new_session=True)
  while p.poll() is None:
   rssout=subprocess.run(['ps','-p',str(p.pid),'-o','rss='],capture_output=True,text=True,timeout=2).stdout.strip();rss=int(rssout or 0)*1024;peak=max(peak,rss)
   if rss>1610612736:stop='RSS1.5GiB'
   elif shutil.disk_usage(private).free<10737418240:stop='DISK10GiB'
   elif time.monotonic()-start>=timeout:stop='TIMEOUT'
   if stop:
    try:os.killpg(p.pid,signal.SIGTERM)
    except ProcessLookupError:pass
    try:p.wait(timeout=2)
    except subprocess.TimeoutExpired:
     try:os.killpg(p.pid,signal.SIGKILL)
     except ProcessLookupError:pass
     p.wait()
    break
   time.sleep(.1)
  rc=p.wait()
 rec={'stage':stage,'command':cmd,'exit_code':rc,'stop_reason':stop,'duration_seconds':round(time.monotonic()-start,3),'peak_cli_rss_bytes':peak};logs.append(rec);print(json.dumps({'image':label,'stage':stage,'exit':rc,'seconds':rec['duration_seconds']}),flush=True)
 if required and rc!=0:raise RuntimeError(stage+' failed')
 return rc,stdout.read_text()
try:
 rc,_=command('pre-inspect',['image','inspect',target['ref'],'--format','{{json .}}'],10,False);receipt['already_cached_before_pull']=rc==0
 if rc!=0:command('pull',['pull','--platform','linux/arm64',target['ref']],150)
 _,data=command('image-inspect',['image','inspect',target['ref'],'--format','{{json .}}'],10);im=json.loads(data);assert im['Architecture']=='arm64' and im['Os']=='linux' and target['ref'] in im['RepoDigests'];receipt['image_identity']={k:im.get(k) for k in ['Id','RepoDigests','Size','Architecture','Os']};receipt['original_entrypoint']=im['Config'].get('Entrypoint');receipt['original_cmd']=im['Config'].get('Cmd');receipt['image_config_user']=im['Config'].get('User');receipt['image_history_not_runtime']='See prior exact-image Trivy config; no image command executed'
 _,created=command('create',['create','--network','none','--read-only','--label','kubeview.release-audit.owner='+owner,'--entrypoint','/__kubeview_audit_never_execute__',target['ref']],15);cid=created.strip();assert len(cid)==64 and all(c in '0123456789abcdef' for c in cid);receipt['container_id']=cid;receipt['owner_label']=owner
 _,state=command('state-before',['container','inspect',cid,'--format','{{.State.Status}} {{.State.Running}} {{index .Config.Labels "kubeview.release-audit.owner"}}'],10);assert state.strip()=='created false '+owner
 for index,path in enumerate(target['binary_paths']):
  dest=outdir/Path(path).name;command('cp-'+str(index),['cp','-L',cid+':/'+path,str(dest)],150);assert dest.is_file() and not dest.is_symlink();receipt['files'].append({'path_in_image':'/'+path,'local_path':str(dest.relative_to(root)),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'execution':False})
 receipt['status']='EXTRACTED_NEVER_RUN'
except Exception as exc:receipt.update(status='BLOCKED_EXTRACTION',error_class=type(exc).__name__,safe_reason=str(exc) if isinstance(exc,RuntimeError) else 'Identity/invariant failed')
finally:
 if cid:
  try:
   _,state=command('state-final',['container','inspect',cid,'--format','{{.State.Status}} {{.State.Running}} {{index .Config.Labels "kubeview.release-audit.owner"}}'],10);assert state.strip()=='created false '+owner;command('remove-owned',['rm',cid],15);receipt['owned_stopped_container_removed']=True
  except Exception as exc:receipt.update(owned_stopped_container_removed=False,cleanup_error_class=type(exc).__name__)
 receipt.update(finished_at_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),commands=logs);(art/(label+'-extract.json')).write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'image':label,'status':receipt['status'],'files':len(receipt['files']),'container_removed':receipt.get('owned_stopped_container_removed')},indent=2),flush=True)
