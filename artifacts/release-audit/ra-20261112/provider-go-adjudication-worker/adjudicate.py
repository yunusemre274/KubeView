import pathlib,json,hashlib,struct,mmap,resource,subprocess,os,time,datetime
R=pathlib.Path('/Users/yunusemre/Desktop/KubeView');P=R/'.git/release-audit/provider-go-adjudication';A=R/'artifacts/release-audit/ra-20261112/provider-go-adjudication-worker'
deadline=json.loads((P/'job.json').read_text())['deadlineEpoch']
def sha(p):
 with p.open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
old=json.loads((R/'artifacts/release-audit/ra-20261111/provider-reachability-worker/binary-manifest.json').read_text())
prior=json.loads((R/'artifacts/release-audit/ra-20261111/provider-reachability-worker/cilium-pclntab.json').read_text())['records']
apt=json.loads((R/'artifacts/release-audit/ra-20261112/provider-apt-images-worker/cilium-result.json').read_text())
targets=[x for x in old if x['path_in_image']in apt['candidateAssets']['assetSHA256']and x['path_in_image'].split('/')[-1]in ['cilium-cni','cilium-agent','cilium-bugtool','cilium-dbg','cilium-envoy-bootstrap-locality','cilium-health','cilium-mount','hubble']]
targets.append({'path_in_image':'/usr/bin/gops','local_path':str(P/'gops'),'sha256':'61c61208e84c53b9c617b0781a4936cf1aed39175e098c2d9bd26a6a3d90c3e8','bytes':3735714})
out=[];env=dict(os.environ,GOTOOLCHAIN='local',GOMAXPROCS='2',GOMEMLIMIT='512MiB',GOPROXY='off',GOSUMDB='off')
for target in targets:
 if time.time()>deadline:raise RuntimeError('adjudication deadline')
 f=R/target['local_path'];h=sha(f);assert h==target['sha256']
 if target['path_in_image']!='/usr/bin/gops':assert h==apt['candidateAssets']['assetSHA256'][target['path_in_image']]
 label=f.name;row={'target':target['path_in_image'],'privateELF':str(f),'ELFSHA256':h,'bytes':f.stat().st_size,'imageExecuted':False}
 info=subprocess.check_output(['/opt/homebrew/bin/go','version','-m',str(f)],env=env,text=True,timeout=10);(P/(label+'-buildinfo.txt')).write_text(info);row['buildinfoSHA256']=sha(P/(label+'-buildinfo.txt'));row['GOOS_linux']='\tbuild\tGOOS=linux'in info;row['GOARCH_arm64']='\tbuild\tGOARCH=arm64'in info;assert row['GOOS_linux']and row['GOARCH_arm64']
 with f.open('rb')as handle,mmap.mmap(handle.fileno(),0,access=mmap.ACCESS_READ)as blob:
  assert blob[:6]==b'\x7fELF\x02\x01';e='<';machine=struct.unpack_from('<H',blob,18)[0];assert machine==183;shoff=struct.unpack_from('<Q',blob,40)[0];ss,sn,si=struct.unpack_from('<HHH',blob,58);assert ss==64 and 0<si<sn<1000
  headers=[struct.unpack_from('<IIQQQQIIQQ',blob,shoff+i*ss)for i in range(sn)];st=headers[si];strs=blob[st[4]:st[4]+st[5]];sections={strs[x[0]:].split(b'\0',1)[0].decode():x for x in headers};x=sections['.gopclntab'];data=blob[x[4]:x[4]+x[5]];magic=struct.unpack_from('<I',data)[0];assert magic==0xfffffff1 and data[7]==8
  nfunc,nfiles,text,fnames,cu,files,pc,funcs=struct.unpack_from('<8Q',data,8);assert 100<nfunc<500000 and 0<fnames<cu<files<len(data)and funcs<len(data)
  allnames=[v.decode('utf-8')for v in data[fnames:cu].split(b'\0')if v];entries=[];previous=-1
  entryfile=P/(label+'-full-function-entries.tsv')
  with entryfile.open('w')as dest:
   for i in range(nfunc):
    entry,off=struct.unpack_from('<II',data,funcs+i*8);assert entry>=previous;previous=entry;nameoff=struct.unpack_from('<I',data,funcs+off+4)[0];pos=fnames+nameoff;assert fnames<=pos<cu;end=data.index(b'\0',pos);assert end<cu;name=data[pos:end].decode('utf-8');entries.append(name);dest.write(str(i)+'\t'+hex(text+entry)+'\t'+name+'\n')
  namesfile=P/(label+'-full-funcname-table.txt');namesfile.write_text('\n'.join(allnames)+'\n');assert set(entries)<=set(allnames)
  row.update(elfMachine=machine,pclntabMagic=hex(magic),pclntabSHA256=hashlib.sha256(data).hexdigest(),functionEntries=nfunc,parsedFunctionEntries=len(entries),fullFuncnameTableNames=len(allnames),symtabPresent='.symtab'in sections,completeFunctionTableParsed=True,fullFuncnameTableIncludesInliningNames=True,fullEntryFile=str(entryfile),fullEntryFileSHA256=sha(entryfile),fullNameFile=str(namesfile),fullNameFileSHA256=sha(namesfile))
  for key,needle in [('html','golang.org/x/net/html.'),('windows','golang.org/x/sys/windows.')]:
   row[key+'EntryMatches']=[v for v in entries if needle in v];row[key+'FullNameMatches']=[v for v in allnames if needle in v];row[key+'RawPackageBytesPresent']=blob.find(needle[:-1].encode())!=-1
  row['NewNTUnicodeStringFullNameMatches']=[v for v in allnames if 'NewNTUnicodeString'in v]
  if label!='gops':
   o=next(v for v in prior if v['path_in_image']==target['path_in_image']);row['priorPclntabSHA256Matches']=o['pclntab_sha256']==row['pclntabSHA256'];row['priorEntryAndNameCountsMatch']=o['function_entries']==nfunc and o['funcname_table_names']==len(allnames);assert row['priorPclntabSHA256Matches']and row['priorEntryAndNameCountsMatch']
 row['pythonPeakRSSBytes']=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
 if row['pythonPeakRSSBytes']>=2147483648:raise RuntimeError('parse RSS ceiling')
 out.append(row);print(json.dumps({'target':row['target'],'entries':row['functionEntries'],'allNames':row['fullFuncnameTableNames'],'htmlMatches':len(row['htmlFullNameMatches']),'windowsMatches':len(row['windowsFullNameMatches']),'rawHtml':row['htmlRawPackageBytesPresent'],'peakRSS':row['pythonPeakRSSBytes']}),flush=True)
 (A/'ELF-pclntab-projections.json').write_text(json.dumps(out,indent=2)+'\n')
(A/'parser-execution.json').write_text(json.dumps({'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'count':len(out),'peakRSSBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,'deadlineNotExceeded':time.time()<=deadline,'noBinaryExecution':True,'privateFullTablesRetained':True},indent=2)+'\n')
