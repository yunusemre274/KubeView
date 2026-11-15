import os,json,time,datetime,subprocess,selectors,hashlib,re
from pathlib import Path
out=Path('artifacts/release-audit/ra-20261111/native-safari-evaluation-contract-worker'); start=time.monotonic(); proc=None; sel=selectors.DefaultSelector(); buf=b''; received=0; seq=0; handle=None
r={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'RUNNING','argv':['/usr/bin/safaridriver','--mcp'],'scope':'One newly created about:blank tab only; no list_tabs, existing page reads, OS settings, app or viewport actions','methods':[],'toolsCalled':[],'driverLimitSeconds':20,'responseLimitBytes':65536,'baseHelperSHA256':'f44900d39cc0c86944058de42f56d835c8f2c4d061f8d0292c611769e502cc17'}
def send(msg):
 r['methods'].append(msg['method']); proc.stdin.write((json.dumps(msg,separators=(',',':'))+'\n').encode()); proc.stdin.flush()
def recv(wanted):
 global buf,received
 while time.monotonic()-start<17:
  while b'\n' in buf:
   line,buf=buf.split(b'\n',1)
   if not line: continue
   item=json.loads(line)
   if item.get('id')==wanted:
    if 'error'in item: raise RuntimeError('JSONRPC_ERROR_'+str(item['error'].get('code','unknown')))
    return item.get('result',{})
  if proc.poll()is not None: raise RuntimeError('CHILD_EXIT_BEFORE_RESPONSE')
  for key,_ in sel.select(.1):
   chunk=os.read(key.fd,4096)
   if not chunk: sel.unregister(key.fileobj); continue
   received+=len(chunk)
   if received>65536: raise RuntimeError('RESPONSE_SIZE_LIMIT')
   if key.data=='stdout': buf+=chunk
 raise TimeoutError('DRIVER_DEADLINE')
def call(name,args):
 global seq
 seq+=1; r['toolsCalled'].append(name); send({'jsonrpc':'2.0','id':seq,'method':'tools/call','params':{'name':name,'arguments':args}}); return recv(seq)
def safe_response(value):
 s=json.dumps(value,ensure_ascii=False)
 if len(s)>8192: return {'redacted':'OVERSIZE','bytes':len(s)}
 if re.search(r'(?:https?|file|safari|favorites)://',s,re.I): return {'redacted':'UNEXPECTED_URL','isError':bool(value.get('isError'))}
 return value
def find_handles(value):
 found=[]
 if isinstance(value,dict):
  for k,v in value.items():
   if k in ['handle','tab_handle','tabHandle','tab_uuid'] and isinstance(v,str) and 0<len(v)<=200: found.append(v)
   elif k=='text' and isinstance(v,str):
    try: found+=find_handles(json.loads(v))
    except (ValueError,TypeError):
     m=re.search(r'\bhandle\s*[:=]\s*[`\"\']?([0-9a-fA-F-]{32,36})',v)
     if m: found.append(m.group(1))
   elif isinstance(v,(dict,list)): found+=find_handles(v)
 elif isinstance(value,list):
  for item in value: found+=find_handles(item)
 return found
r['scope']='New owned about:blank tab only; three constant JavaScript contract probes and raw responses; no app or user content';r['evaluations']=[]
try:
 r['sourceHEAD']=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();exe=Path('/usr/bin/safaridriver').resolve();r['executableSHA256']=hashlib.sha256(exe.read_bytes()).hexdigest()
 proc=subprocess.Popen(r['argv'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE);r['ownedChildPID']=proc.pid;sel.register(proc.stdout,selectors.EVENT_READ,'stdout');sel.register(proc.stderr,selectors.EVENT_READ,'stderr')
 seq=1;send({'jsonrpc':'2.0','id':seq,'method':'initialize','params':{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'KubeView-owned-eval-contract','version':'1.0'}}});init=recv(seq);r['negotiatedProtocol']=init.get('protocolVersion')
 if r['negotiatedProtocol']!='2024-11-05':raise RuntimeError('UNSUPPORTED_NEGOTIATED_PROTOCOL')
 send({'jsonrpc':'2.0','method':'notifications/initialized'})
 seq+=1;send({'jsonrpc':'2.0','id':seq,'method':'tools/list','params':{}});listed=recv(seq);tools=[t for t in listed.get('tools',[])if t.get('name')=='evaluate_javascript']
 if len(tools)==1:r['evaluateInstalledContract']={k:tools[0][k]for k in['name','description','inputSchema']if k in tools[0]}
 created=call('create_tab',{'url':'about:blank'});r['createResponse']=safe_response(created)
 if created.get('isError'):raise RuntimeError('CREATE_TOOL_ERROR')
 handles=set(find_handles(created))
 if len(handles)!=1:r['ownedTabPending']=True;raise RuntimeError('NO_UNIQUE_NEW_HANDLE')
 handle=next(iter(handles));r['ownedHandleFromCreateOnly']=handle;r['ownedTabPending']=True
 switched=call('switch_tab',{'handle':handle})
 if switched.get('isError')or handle not in json.dumps(switched):raise RuntimeError('OWNED_HANDLE_SWITCH_NOT_CONFIRMED')
 info=call('page_info',{})
 if info.get('isError')or 'about:blank'not in json.dumps(info):raise RuntimeError('OWNED_BLANK_PAGE_NOT_CONFIRMED')
 r['ownedHandleAndBlankPageVerified']=True
 for expression in['1+1','JSON.stringify({ok:true,marker:"kv-owned-eval"})','return 1+1']:
  switched=call('switch_tab',{'handle':handle})
  if switched.get('isError')or handle not in json.dumps(switched):raise RuntimeError('OWNED_HANDLE_SWITCH_NOT_CONFIRMED')
  info=call('page_info',{})
  if info.get('isError')or 'about:blank'not in json.dumps(info):raise RuntimeError('OWNED_BLANK_PAGE_NOT_CONFIRMED')
  response=call('evaluate_javascript',{'expression':expression});r['evaluations'].append({'expression':expression,'rawToolResultBeforeDecoder':response,'isError':response.get('isError',False)})
 r['status']='THREE_FIXED_EXPRESSIONS_OBSERVED'
except Exception as e:
 r['status']='BLOCKED';r['errorClass']=type(e).__name__;r['reason']=str(e)if isinstance(e,(RuntimeError,TimeoutError))else'PROTOCOL_OR_PROCESS_ERROR'
finally:
 if proc is not None:
  if handle is not None and time.monotonic()-start<17:
   try:
    closed=call('close_tab',{'handle':handle});r['closeResponse']=safe_response(closed);r['ownedTabPending']=bool(closed.get('isError'))
   except Exception:r['ownedTabPending']=True
  try:proc.stdin.close()
  except OSError:pass
  try:proc.wait(timeout=max(.001,min(1,19-(time.monotonic()-start))))
  except subprocess.TimeoutExpired:
   proc.terminate();r['sentSIGTERM']=True
   try:proc.wait(timeout=.5)
   except subprocess.TimeoutExpired:proc.kill();r['sentSIGKILL']=True;proc.wait(timeout=.5)
  r['ownedChildExited']=proc.poll()is not None;r['exitCode']=proc.returncode;proc.stdout.close();proc.stderr.close()
 sel.close();r['bytesReadStdoutAndStderr']=received;r['elapsedSeconds']=time.monotonic()-start;r['within20s']=r['elapsedSeconds']<=20;r['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();r['helperSHA256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();(out/'result.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
