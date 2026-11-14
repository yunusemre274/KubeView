from pathlib import Path
import json,subprocess,hashlib,datetime,shutil
from PIL import Image,ImageDraw
base=Path('artifacts/pre-v11-repair/repair-20261101T130559Z');dest=base/'delivery';plan=json.loads((dest/'video-clip-plan.json').read_text());clips=dest/'clips';frames=dest/'video-frames';clips.mkdir(exist_ok=True);frames.mkdir(exist_ok=True)
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
ff=lambda a:subprocess.run(a,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
for item in plan['clips']:
 src=base/item['source'];out=dest/item['output']
 assert not out.exists(),str(out)
 assert hashfile(src)==item['sourceSHA256']
 cmd=['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-threads','1','-ss',str(item['cutStartPTSSeconds']),'-i',str(src),'-t',str(item['cutEndPTSSeconds']-item['cutStartPTSSeconds']),'-map','0:v:0','-an','-c:v','libvpx-vp9','-deadline','realtime','-cpu-used','8','-row-mt','0','-crf','30','-b:v','0','-threads','1',str(out)]
 ff(cmd);item['status']='ENCODED_PENDING_VISUAL_REVIEW';item['outputSHA256']=hashfile(out)
 print('encoded',item['id'],flush=True)
src=next((base/'node-fire-final-2-video').glob('*.webm'));out=clips/'node-false-status-injection-full.webm';assert not out.exists();shutil.copyfile(src,out)
plan['clips'].append({'id':'node-false-status-injection-full','source':str(src.relative_to(base)),'sourceSHA256':hashfile(src),'output':str(out.relative_to(dest)),'outputSHA256':hashfile(out),'caption':'Ready=False via actual Kubernetes API status injection; NOT physical server stop. Natural Unknown/recovery evidence is separate. Full original video, no cut.','cutStartPTSSeconds':0,'status':'COPIED_PENDING_VISUAL_REVIEW'})
for item in plan['clips']:
 out=dest/item['output'];meta=json.loads(ff(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,avg_frame_rate','-of','json',str(out)]).stdout);duration=float(meta['format']['duration']);item['outputMetadata']=meta
 times=[min(.5,duration/4),max(.5,duration-.5)]
 if item['id']=='provider-loss-recovery':times=[.5,10,21]
 if item['id']=='node-false-status-injection-full':times=[min(2.5,duration/5),min(8.5,duration/2),max(.5,duration-1)]
 images=[];item['decodedReviewFrames']=[]
 for i,t in enumerate(times):
  f=frames/f"{item['id']}-{i+1}.png";assert not f.exists()
  ff(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-threads','1','-ss',str(t),'-i',str(out),'-frames:v','1','-threads','1',str(f)])
  item['decodedReviewFrames'].append({'outputPTSSeconds':t,'path':str(f.relative_to(dest)),'SHA256':hashfile(f)})
  im=Image.open(f).convert('RGB');im.thumbnail((720,450));images.append((t,im.copy()))
 sheet=Image.new('RGB',(720*len(images),480),'#e6edf1');draw=ImageDraw.Draw(sheet)
 for i,(t,im) in enumerate(images):sheet.paste(im,(i*720,30));draw.text((i*720+12,8),f"{item['id']} | output PTS {t:.2f}s",fill='#20313f')
 f=frames/f"{item['id']}-sheet.jpg";sheet.save(f,quality=91);item['reviewSheet']=str(f.relative_to(dest));print('decoded',item['id'],duration,flush=True)
plan['status']='ENCODED_AND_DECODED_PENDING_HUMAN_REVIEW';plan['encodedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();plan['note']='CPU measurements completed before encoding. Same resolution, short VP9 cuts with explicit source PTS. Encoded FPS is not app/presented FPS. Original source video retained.'
(dest/'video-clip-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
