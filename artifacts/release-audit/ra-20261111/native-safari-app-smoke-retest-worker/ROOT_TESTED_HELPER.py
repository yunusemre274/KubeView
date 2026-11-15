import os,json,time,datetime,subprocess,selectors,hashlib,re
from pathlib import Path
out=Path('artifacts/release-audit/ra-20261111/native-safari-app-smoke-retest-worker'); start=time.monotonic(); proc=None; sel=selectors.DefaultSelector(); buf=b''; received=0; seq=0; handle=None
r={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'RUNNING','argv':['/usr/bin/safaridriver','--mcp'],'scope':'One newly created about:blank tab only; no list_tabs, existing page reads, OS settings, app or viewport actions','methods':[],'toolsCalled':[],'driverLimitSeconds':120,'responseLimitBytes':24000000,'baseHelperSHA256':'f44900d39cc0c86944058de42f56d835c8f2c4d061f8d0292c611769e502cc17'}
def send(msg):
 r['methods'].append(msg['method']); proc.stdin.write((json.dumps(msg,separators=(',',':'))+'\n').encode()); proc.stdin.flush()
def recv(wanted):
 global buf,received
 while time.monotonic()-start<110:
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
   if received>24000000: raise RuntimeError('RESPONSE_SIZE_LIMIT')
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
import socket,urllib.request,base64,signal
app=None; appbirth=None; origin='http://127.0.0.1:19843'; private=Path('.git/release-audit/native-safari-app-smoke-retest-worker').resolve(); binary=Path('.git/release-audit/candidate-runtime-provider09/kubeview').resolve();r['scope']='Fresh readonly empty KubeView app; only newly created owned tab; programmatic DOM click/type functional smoke';r['checks']={};r['screenshots']=[];r['guardCount']=0

def unpack(value):
 if isinstance(value,dict):
  if 'content'in value:
   texts=[x.get('text','') for x in value['content']if x.get('type')=='text']
   if len(texts)==1:
    try:return json.loads(texts[0])
    except ValueError:return texts[0]
  return value
 return value

def guard():
 switched=call('switch_tab',{'handle':handle})
 if switched.get('isError') or handle not in json.dumps(switched):raise RuntimeError('OWNED_HANDLE_SWITCH_NOT_CONFIRMED')
 info=call('page_info',{})
 text=json.dumps(info)
 if info.get('isError')or origin not in text:raise RuntimeError('OWNED_ORIGIN_NOT_CONFIRMED_NO_PAGE_READ')
 urls=re.findall(r'https?://[^\s\"\\<>]+',text)
 if any(not u.startswith(origin+'/')and u!=origin for u in urls):raise RuntimeError('UNEXPECTED_PAGE_METADATA_ORIGIN')
 r['guardCount']+=1

def evaluate(body):
 guard();val=call('evaluate_javascript',{'expression':"(()=>{if(location.origin!=="+json.dumps(origin)+")return {originGuard:false};return ("+body+");})()"})
 if val.get('isError'):
  r['firstFailureResponse']=safe_response(val);raise RuntimeError('EVALUATE_JAVASCRIPT_TOOL_ERROR_NO_OS_SETTINGS_CHANGE')
 data=unpack(val)
 for _ in range(3):
  if isinstance(data,dict)and set(data)=={'result'}:data=data['result']
  elif isinstance(data,str):
   try:data=json.loads(data)
   except ValueError:break
  else:break
 if isinstance(data,dict)and data.get('originGuard')is False:raise RuntimeError('EVALUATE_ORIGIN_GUARD')
 return data

def screenshot(name):
 guard();shot=call('screenshot',{'full_page':False})
 if shot.get('isError'):r['firstFailureResponse']=safe_response(shot);raise RuntimeError('SCREENSHOT_TOOL_ERROR')
 imgs=[c for c in shot.get('content',[])if c.get('type')=='image']
 if len(imgs)!=1:raise RuntimeError('SCREENSHOT_RESPONSE_NOT_ONE_IMAGE')
 raw=base64.b64decode(imgs[0]['data'],validate=True)
 if len(raw)>8000000 or not raw.startswith(b'\x89PNG\r\n\x1a\n'):raise RuntimeError('SCREENSHOT_NOT_BOUNDED_PNG')
 (out/name).write_bytes(raw);r['screenshots'].append({'file':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})

try:
 r['sourceHEAD']=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();r['runtimeSourceCommit']='4c6c2ac5';r['binarySHA256']=hashlib.sha256(binary.read_bytes()).hexdigest()
 if r['binarySHA256']!='f9e70b607c1689800f253ccaa6841d05e3a6951e6c032f837b7cf78f1dd4ecd4':raise RuntimeError('BINARY_HASH_MISMATCH')
 s=socket.socket();s.bind(('127.0.0.1',19843));s.close();r['preflightPortFree']=True
 home=private/'home';data=private/'data';home.mkdir(mode=0o700,exist_ok=False);data.mkdir(mode=0o700,exist_ok=False);assert home.stat().st_mode&0o077==0 and data.stat().st_mode&0o077==0;r['privateDirectoryModeVerified']=True;missing=private/'nonexistent-kubeconfig'
 env={'PATH':'/usr/bin:/bin:/usr/sbin:/sbin','HOME':str(home),'READ_ONLY':'true','KV_MINIKUBE_ENABLED':'false','KV_HUBBLE_ENABLED':'false','KUBECONFIG':str(missing),'TMPDIR':'/tmp'}
 argv=[str(binary),'--bind','127.0.0.1','--port','19843','--data-dir',str(data),'--kubeconfig',str(missing)];r['appArgv']=argv;r['appEnvironmentNames']=sorted(env)
 app=subprocess.Popen(argv,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,start_new_session=True);appbirth=subprocess.check_output(['ps','-p',str(app.pid),'-o','lstart='],text=True).strip();r['ownedAppPID']=app.pid;r['ownedAppPGID']=os.getpgid(app.pid);r['ownedAppBirth']=appbirth
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}));health=False
 until=time.monotonic()+8
 while time.monotonic()<until:
  if app.poll()is not None:raise RuntimeError('APP_EXITED_BEFORE_HEALTH')
  try:
   with opener.open(origin+'/healthz',timeout=.5)as response:health=response.status==200
   if health:break
  except Exception:time.sleep(.1)
 if not health:raise RuntimeError('APP_HEALTH_DEADLINE')
 listeners=subprocess.check_output(['lsof','-nP','-a','-p',str(app.pid),'-iTCP:19843','-sTCP:LISTEN','-t'],text=True).split()
 if listeners!=[str(app.pid)]:raise RuntimeError('APP_LISTENER_OWNERSHIP_FAILED')
 r['appHealthyAndOwnsListener']=True
 proc=subprocess.Popen(r['argv'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE);r['ownedChildPID']=proc.pid
 sel.register(proc.stdout,selectors.EVENT_READ,'stdout');sel.register(proc.stderr,selectors.EVENT_READ,'stderr')
 seq=1;send({'jsonrpc':'2.0','id':seq,'method':'initialize','params':{'protocolVersion':'2024-11-05','capabilities':{},'clientInfo':{'name':'KubeView-owned-app-smoke','version':'1.0'}}});init=recv(seq);r['negotiatedProtocol']=init.get('protocolVersion');r['serverInfo']=init.get('serverInfo',{})
 if r['negotiatedProtocol']!='2024-11-05':raise RuntimeError('UNSUPPORTED_NEGOTIATED_PROTOCOL')
 send({'jsonrpc':'2.0','method':'notifications/initialized'});created=call('create_tab',{'url':origin+'/'})
 if created.get('isError'):r['firstFailureResponse']=safe_response(created);raise RuntimeError('CREATE_TAB_TOOL_ERROR')
 handles=set(find_handles(created))
 if len(handles)!=1:r['ownedTabPending']=True;raise RuntimeError('CREATE_RESPONSE_HANDLE_NOT_UNAMBIGUOUS')
 handle=next(iter(handles));r['ownedHandleFromCreateOnly']=handle;r['ownedTabPending']=True
 first=evaluate("(()=>{const c=document.querySelector('canvas');window.__kvOwnedSmokeCanvas=c;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='İlk limanını bağla');return {readyState:document.readyState,canvasCount:document.querySelectorAll('canvas').length,emptyConnectButton:!!b,workspaceCount:document.querySelectorAll('.workspace-window').length,ua:navigator.userAgent,reportedDPR:devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},canvas:c?{width:c.width,height:c.height,rect:{x:c.getBoundingClientRect().x,y:c.getBoundingClientRect().y,width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height}}:null};})()")
 r['initial']=first
 if not isinstance(first,dict)or first.get('canvasCount')!=1 or first.get('emptyConnectButton')is not True or first.get('workspaceCount')!=0:raise RuntimeError('INITIAL_EMPTY_ONE_CANVAS_ASSERTION_FAILED')
 r['checks']['initialEmptyOneCanvas']=True;screenshot('closed.png')
 opened=evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='İlk limanını bağla');if(!b)return {clicked:false};b.click();return {clicked:true};})()")
 if not isinstance(opened,dict)or opened.get('clicked')is not True:raise RuntimeError('OPEN_FORM_BUTTON_NOT_FOUND')
 typed=evaluate("(()=>{const w=document.querySelector('.workspace-window');if(!w)return {form:false};let i=w.querySelector('input[aria-label=\"Liman adı\"]');if(!i){const l=[...w.querySelectorAll('label')].find(x=>x.textContent.includes('Liman adı'));if(l)i=l.control||l.querySelector('input');}if(!i)return {form:true,input:false};const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'Safari işlev kontrolü');i.dispatchEvent(new Event('input',{bubbles:true}));return {form:true,input:true,typed:i.value==='Safari işlev kontrolü',canvasCount:document.querySelectorAll('canvas').length,sameCanvas:document.querySelector('canvas')===window.__kvOwnedSmokeCanvas};})()")
 r['form']=typed
 if not isinstance(typed,dict)or not typed.get('typed')or typed.get('sameCanvas')is not True:raise RuntimeError('FORM_TYPED_OR_CANVAS_ASSERTION_FAILED')
 r['checks']['programmaticOpenAndType']=True;screenshot('form-open.png')
 closed=evaluate("(()=>{const w=document.querySelector('.workspace-window');const b=w&&[...w.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='Pencereyi kapat'||x.title==='Pencereyi kapat'||x.textContent.trim()==='Pencereyi kapat');if(!b)return {clicked:false};b.click();return {clicked:true};})()")
 if not isinstance(closed,dict)or not closed.get('clicked'):raise RuntimeError('CLOSE_FORM_BUTTON_NOT_FOUND')
 final=evaluate("({workspaceCount:document.querySelectorAll('.workspace-window').length,canvasCount:document.querySelectorAll('canvas').length,sameCanvas:document.querySelector('canvas')===window.__kvOwnedSmokeCanvas,emptyConnectButton:[...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='İlk limanını bağla')})")
 r['final']=final
 if not isinstance(final,dict)or final.get('workspaceCount')!=0 or final.get('sameCanvas')is not True or final.get('canvasCount')!=1 or final.get('emptyConnectButton')is not True:raise RuntimeError('FINAL_CLOSED_SAME_CANVAS_ASSERTION_FAILED')
 r['checks']['programmaticCloseSameCanvas']=True;r['status']='FUNCTIONAL_SMOKE_PASS_PROGRAMMATIC_DOM'
except Exception as e:
 r['status']='BLOCKED_FIRST_UNEXPECTED_FAILURE';r['errorClass']=type(e).__name__;r['reason']=str(e)if isinstance(e,(RuntimeError,TimeoutError))else'APP_PROTOCOL_OR_PROCESS_ERROR'
finally:
 if proc is not None:
  if handle is not None and time.monotonic()-start<107:
   try:
    close=call('close_tab',{'handle':handle});r['ownedTabClosed']=not close.get('isError');r['ownedTabPending']=not r['ownedTabClosed']
   except Exception:r['ownedTabClosed']=False
  try:proc.stdin.close()
  except OSError:pass
  try:proc.wait(timeout=1)
  except subprocess.TimeoutExpired:
   proc.terminate();r['sentDriverSIGTERM']=True
   try:proc.wait(timeout=.5)
   except subprocess.TimeoutExpired:proc.kill();r['sentDriverSIGKILL']=True;proc.wait(timeout=.5)
  r['ownedDriverExited']=proc.poll()is not None;r['driverExitCode']=proc.returncode;proc.stdout.close();proc.stderr.close()
 sel.close()
 if app is not None:
  if app.poll()is None:
   birth=subprocess.check_output(['ps','-p',str(app.pid),'-o','lstart='],text=True).strip();r['appBirthGuardBeforeStop']=birth==appbirth and os.getpgid(app.pid)==app.pid
   if r['appBirthGuardBeforeStop']:
    os.killpg(app.pid,signal.SIGTERM)
    try:app.wait(timeout=3)
    except subprocess.TimeoutExpired:os.killpg(app.pid,signal.SIGKILL);app.wait(timeout=1);r['sentAppSIGKILL']=True
  r['ownedAppExited']=app.poll()is not None;r['appExitCode']=app.returncode
  if app.poll()is not None:
   raw=app.stderr.read(8193);app.stderr.close();r['startupStderrBytesCaptured']=min(len(raw),8192);r['startupStderrTruncated']=len(raw)>8192;lines=raw[:8192].decode('utf-8','replace').splitlines();safe='\n'.join('[REDACTED sensitive-keyword line]'if re.search(r'nonce|cookie|token|authorization|secret|password',line,re.I)else re.sub(r'(https?://[^ ?\s]+)\?[^ \s]+',r'\1?[REDACTED]',line)for line in lines);(out/'startup-stderr.txt').write_text(safe+'\n')
 check=subprocess.run(['lsof','-nP','-iTCP:19843','-sTCP:LISTEN','-t'],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True);r['noListener19843']=not check.stdout.strip()
 s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
 try:s.bind(('127.0.0.1',19843));r['portBindAfterCleanup']=True
 except OSError:r['portBindAfterCleanup']=False
 s.close();r['bytesReadStdoutAndStderr']=received;r['elapsedSeconds']=time.monotonic()-start;r['within120s']=r['elapsedSeconds']<=120;r['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();r['helperSHA256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();(out/'result.json').write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n');print(json.dumps(r,ensure_ascii=False))
