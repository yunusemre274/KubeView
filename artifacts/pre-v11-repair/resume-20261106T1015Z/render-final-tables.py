"""Render final Markdown from an already accepted repair-report; never sample/run tests."""
from pathlib import Path
from statistics import median
import json,sys
sid=sys.argv[1]
if not sid or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._' for c in sid):raise SystemExit('Invalid session ID')
p=Path('benchmarks/results')/sid/'comparison.json'
x=json.loads(p.read_text())
if not x.get('valid') or x.get('partial') or x.get('reasons'):raise SystemExit('Complete accepted comparison required')
def number(v,d=4):return 'N/A' if v is None else f'{v:.{d}f}'
def metric(g,side,key,d=4):
 m=g.get(side,{}).get('metrics',{}).get(key,{})
 if not m.get('n'):return 'N/A'
 return f"{number(m['median'],d)} ({number(m['min'],d)}–{number(m['max'],d)}; n={m['n']})"
labels={'panel-closed':'M / panel kapalı','panel-open':'M / panel açık','repair-node':'M / tek Node arızası','repair-container':'M / tek container arızası','repair-burst':'M / kısa çoklu olay','idle':'M / hareket kapalı idle','living':'L / dünya','events':'M / normal + burst veri','interaction':'S / etkileşim','long':'M / 20 dakika karma'}
lines=['# Son eşleşmiş ölçüm tabloları','',f'Oturum: `{sid}`. Kalite medium, DPR 1, Chromium / Metal; pil. Medyan (min–max; n). CPU çekirdek eşdeğeridir. Baseline/final farkı yeni işlevlerin maliyetini de içerir; optimizasyon yüzdesi değildir.','', '| Senaryo | Browser CPU önce | Browser CPU sonra | Son JS çizim/sn | Son p95 / p99, ms | Son en büyük browser PID RSS, MiB | Son JS heap, MiB |','|---|---|---|---|---|---|---|']
for g in x['groups']:
 key=labels.get(g['scenario'],g['profile']+'/'+g['scenario'])
 lines.append(f"| {key} | {metric(g,'baseline','browserCPU')} | {metric(g,'optimized','browserCPU')} | {metric(g,'optimized','jsDrawsPerSecond',2)} | {metric(g,'optimized','intervalP95ms',2)} / {metric(g,'optimized','intervalP99ms',2)} | {metric(g,'optimized','maxSingleBrowserRSSMiB',1)} | {metric(g,'optimized','JSHeapMiB',1)} |")
lines+=['','## Aynı bloktaki açık − kapalı panel CPU farkı','','| Blok | Önce kapalı | Önce açık | Önce Δpanel | Sonra kapalı | Sonra açık | Sonra Δpanel |','|---|---|---|---|---|---|---|']
for block in sorted(set(p['block'] for p in x['panel'])):
 row=[]
 for phase in ['baseline','optimized']:
  p=next(p for p in x['panel'] if p['block']==block and p['phase']==phase)
  row +=[number(p[k]) for k in ['closedCPU','openCPU','deltaPanel']]
 lines.append('| '+str(block+1)+' | '+' | '.join(row)+' |')
for phase in ['baseline','optimized']:
 vals=[p['deltaPanel'] for p in x['panel'] if p['phase']==phase]
 lines+=['',f"{phase} Δpanel: medyan {number(median(vals))}; aralık {number(min(vals))}–{number(max(vals))}; n={len(vals)}."]
lines+=['','## Ayrı süreç ve gecikme ölçümleri','','Go test binary CPU\'su fixture/tracker işini de içerir; izole production gateway CPU\'su değildir. GPU süreci CPU\'su gerçek GPU kullanım yüzdesi değildir. Gecikmeler callback/DOM/rAF/draw proxy ölçüsüdür; fiziksel sunum veya bütün kontrollerin kullanılabilirlik kanıtı değildir.','','| Senaryo | Son renderer CPU | Son GPU süreç CPU | Son browser ana CPU | Son Go test CPU | Son callback→store p95 ms | Son callback→draw proxy p95 ms | Son panel DOM / rAF proxy p95 ms |','|---|---|---|---|---|---|---|---|']
for g in x['groups']:
 lines.append('| '+labels.get(g['scenario'],g['profile']+'/'+g['scenario'])+' | '+' | '.join(metric(g,'optimized',k,2 if 'P95' in k else 4) for k in ['rendererCPU','gpuProcessCPU','browserMainCPU','backendCPU','callbackStoreP95ms','callbackDrawProxyP95ms'])+' | '+metric(g,'optimized','panelDOMProxyP95ms',2)+' / '+metric(g,'optimized','panelRAFProxyP95ms',2)+' |')
out=Path('artifacts/pre-v11-repair/resume-20261106T1015Z')/(sid+'-tables.md')
out.write_text('\n'.join(lines)+'\n')
print(out)
