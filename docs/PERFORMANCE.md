## 12 Kasım 2026, 22:45 — dengeli panel matrisi ölçüldü; karşılaştırma kabulü açık

Beş eşleşmiş blokta40pencere (0/5olay-sn × panelkapalı/açık × A/B), her30sısınma+60sölçüm tamamlandı. Frozenfrontend36d/f32,ortakbackend9d;MacM5/Chromium156Metal/medium/DPR1/1440×900/M38,canonical20Node/300Pod,ayrıntılı8/120,su/seyiraçık,Battery53→43. Ürün/renderkalitesi değiştirilmedi.

| Koşul | A browserCPU medyan[min,max],core | B medyan[min,max],core | Eşleşmiş B−A medyan,core |
|---|---|---|---|
| Kapalı,0/s |0.621209[0.607889,0.629050]|0.622154[0.606136,0.698428]|+0.002764|
| Açık,0/s |0.633715[0.619278,0.637350]|0.622300[0.615433,0.702130]|−0.005026|
| Kapalı,5/s |0.675716[0.628697,0.689483]|0.615717[0.602924,0.682483]|−0.026199|
| Açık,5/s |0.670831[0.634438,0.696627]|0.682215[0.637502,0.704686]|−0.007992|

İşaretliΔpanel (açık−kapalı) medyanı0/s A0.011389/B0.003702;5/s A0.010467/B0.044199core. EşleşmişΔB−ΔA medyanları−0.001524 ve+0.013225; medyanların farkıyla karıştırılmaz. **Bunlar hesaplanmış gözlemlerdir; kabul edilmiş nedenselCPU sonucu veya optimizasyon değildir.**

İki offline inceleme6000olay/canonicalverdict,40pencereMdraw/frame/proxy,371güçkaydı/247cleanup ve arşivleri doğruladı. Fakat p3B'de fazladan çizim ölçüm boyunca sürdü; bazıB hücrelerinde+1allocatedgeometry var. Gerçekrendernesnesi kaydedilmediği için BENCH-RENDER-001 iş yükü eşdeğerliği **UNRESOLVED**. İlk guardlarınPASS'i bunu kapatmaz. RSSmekanizması,CAT17,genişV11-18/continuous60dk/finalpaket açık; bu10restart60dkkesintisizsoakdeğildir.

[52metrik,dağılım,Δpanel,kaynak ve sınırlar](../artifacts/release-audit/ra-20261112/perf-panel-balanced-five-blocks-root/REPORT.md),[açık kabul kararı](../artifacts/release-audit/ra-20261112/perf-panel-balanced-five-blocks-root/ACCEPTANCE.json),[sayısal inceleme](../artifacts/release-audit/ra-20261112/perf-balanced-numeric-review-worker/REPORT.md),[iş yükü incelemesi](../artifacts/release-audit/ra-20261112/perf-balanced-evidence-review-worker/REPORT.md). Önceki açık-only aile ve tarihsel ölçümler aşağıda kendi kapsamıyla korunur; havuzlanmadı. Sıradaki iş kısa renderedobject/hover/reset tanılamasıdır; uzun matris otomatik tekrarlanmıyor.

## 12 Kasım2026 — yeni eşleşmiş açık-panel ailesi; genel kabul açık

MacM5/macOS27.0.1/Chromium156Metal/medium/DPR1/1440x900; Battery62→59, controlledM38 aynıpose/8Node120Pod, canonical20/300. Frozenfrontend36d→f32, commonbackend9d;5pair AB/BA/AB/BA/AB,30s+60s,10window/3000event.

| Koşul | A medyan[min,max] | B medyan[min,max] | Eşleşmiş B−A medyan | Karar |
|---|---|---|---|---|
| AçıkNodeÖzet/5event browserCPU,çekirdek |0.686613[0.655277,0.707368]|0.682294[0.625851,0.707012]|−0.000485|Kazanç kanıtı yok; ölçüm bütçeleri geçti|
| EnbüyüktekbrowserPID sonRSS,MiB |387.156[375.984,398.016]|396.859[383.734,407.547]|+9.391|5/5artış; neden/retainedmemorytanısı açık|
| JSdraw/sn |60.0198|60.0212|+0.0023|FizikselFPS değil|
| Framep95/p99 koşu medyanı,ms |18.6/19.0|18.7/19.0|~0/0|Bütün10windowMbudgetPASS|
| Callback→store/drawproxy p95 koşu medyanı,ms |0.8/19.8|0.9/18.0|+0.1/−0.9|Proxy; fizikselpanelhazır kabulü değil|

[13metrik/minmax/hamgirdi/komut/kaynağın tamamı](../artifacts/release-audit/ra-20261112/perf-open-events-five-pairs-root/REPORT.md). [İkinciinceleme](../artifacts/release-audit/ra-20261112/perf-open-events-second-review-worker/REPORT.md). Finalobjelerlivefullnested signature ile karşılaştırıldı; artefakta ayrıca tamdump edilmedi.14OSsnapshot/window gözlenencohort kapsamıdır;1sdoğum/örneklerarasıblindspot açık. Renderer/GPUprocess/backendCPU ayrıdır; GPUusage/enerji/toplamfizikselRAM N/A.

Δpanel N/A: açık/kapalı ve0/5eventi aynıdengelibloktasınamadık. FullruntimebackendA/B,1/5/10/20harbor/M-L/log/traffic/idle/60dk/finalpaket,V11-16/V11-18/V11-19 açık. EskiAC/pil/farklıFOV/unsafe-log sonuçları buhavuzakatılmadı. İlkmetadataattributionnull kusuru korunup yalnızoffline düzeltildi; sayısal ölçümler değişmedi. GenelCPUoptimizasyonu veya yayınhazırlığı iddia edilmez.

# KubeView performans ölçümü

## 10 Kasım 2026 — workspace protokolü ve açık kabul

Yeni workspace geliştirmesinin 1/5/10/20 liman protokolü ve kabul durumu [WORKSPACE_ACCEPTANCE.md](WORKSPACE_ACCEPTANCE.md) içindedir. Mevcut harness `--harbors` ve `repair-session --suite workspace` ile genişletilir; aynı M/L canonical kaynak, aktif sahne ve güç koşulları kaydedilir. Yeni kaynakta ölçülmeyen CPU/FPS/enerji sonucu üretilmez. Aşağıdaki sonuçlar eski dondurulmuş build'ler içindir; V11-16 fiziksel UI ve V11-18 CPU kapılarını yeni test sayıları kapatmaz.

## 9 Kasım 2026 — v1.1.0 yeni kaynak kabulü

Dondurulmuş `2b76e21`→`32a0468` için yeni AC31/31hücre, üç eşleşmiş30s+60sblok ve tek1200s/20panel koşusu tamamlandı. [Ayrıntılı güncel tablo, ham sonuçlar ve sınırlar](../artifacts/v1.1.0/v11-20261108/performance/REVIEW.md). Açık panel toplam browser CPU medyanı.38237→.39759çekirdek; aralıklar örtüşür. SignedΔpanel ayrı hesaplanır; CPU kazancı iddia edilmez. L ham.39292→.47515farkında fiili çizim yükü de değişmiştir; ayrı iki kontrollü pil çifti+.63%/+1.59%verdi, AC ile pool yapılmaz ve bu tek sonuç bütün regresyon kapısını otomatik kapatmaz.

M/L yaklaşık60JSçizim/sn; uzun koşu60.0005,p9518.7/p9921.0ms. Tam canonical içerik eşitliği,20/20panel,24/24log kapanışı ve bounded materyal/observer/timer gözlemi geçti. Fiziksel presentedFPS/GPUkullanım%/toplamRAM/nativeSafari performansı ölçülmedi. Eski6Kasım ve25Ekim kayıtları korunur; yeni kaynağın geçmişte test edildiği ileri sürülmez.


**6 Kasım 2026 — görsel onarım kabulü:** Gerçek kaynak/animasyon kanıtı, dondurulmuş source/build kimliği ve yeni pil oturumunun durumu [PRE_V11_VISUAL_REPAIR.md](PRE_V11_VISUAL_REPAIR.md) içindedir. `benchmarks/repair-session.mjs` mevcut production runner'ına sonlu seri plan ekler; ayrı renderer veya yeni benchmark sistemi değildir. Üç eşleşmiş blokta açık/kapalı panel, Node/container/çoklu olay efektleri, idle ve L dünya; ardından olay, etkileşim ve 20 dakika/20 panel-stream çevrimi çalışır. İlk snapshot efekt kuyruğu, tam nesne içeriği eşitliği, üretici hızı, süreç CPU kapsamı, zaman/kalite/kaynak kimliği ve cleanup kapıları raporda ayrı doğrulanır. Aynı seçili UID korunur; panel açılmasıyla kamerayı veya seçim bağlamını değiştirerek kıyas yapılmaz.

```sh
# Önceden dondurulmuş iki build ile YENİ run-id; geçerli dosyaları ezmez.
node benchmarks/repair-session.mjs YENI_RUN_ID pre-v11-start pre-v11-final-8768398
# Yalnız bütün seri kuyruk bittikten sonra kabul raporu.
node benchmarks/repair-report.mjs YENI_RUN_ID
# Devam eden kuyruk için salt okuma; sonuç kabul değildir.
node benchmarks/repair-report.mjs YENI_RUN_ID --partial
```

Build etiketleri `benchmarks/.build/` içindeki `panel-build.mjs` çıktısına ve kaynak provenance kaydına karşılık gelir; aynı etiket adını vermek aynı binary'yi üretme garantisi değildir. Kuyruk frontend asset'lerini, test binary'sini ve tarayıcı sürümünü her işten önce denetler. Başlangıç güç kaynağı sabitlenir, pil %10 altındaysa sonraki iş başlamaz. `--continue-from ESKI_RUN_ID`, yalnız durmuş kuyruğun build/güç/tarayıcı kimliği aynıysa, tamamlanmış işleri koruyarak yeni run-id ile devam eder. Başarısız iş cleanup'ı incelenmeden yeniden denenmez. Tek tekrar çağrıları runner tarafından `smoke` işaretlenebilir; kabul raporu gerçek 30/60 sn pencerelerini ve en az üç bağımsız eşleşmiş bloğu birlikte denetler. Profiling/video/GPU tanılamaları ana CPU dağılımına katılmaz.

Dar sahne envanteri yalnız mevcut `inventory()` checkpointlerinde `canvas.__harbor.scene` üzerinde benzersiz geometri/materyal kimliklerini sayar. Ek timer, render sarmalayıcısı veya listener kurmaz. Sahneden erişilen nesneleri, görünmez mesh'leri ve custom/override materyalleri kapsar; renderer-generated/off-scene materyalleri veya GC tamamlanmasını ölçmez. GPU `renderer.info` nesne/program sayıları ayrı alandır; VRAM baytı değildir. Üç hedefli helper testi paylaşım/çıkarma/serileştirme ve sıfır scheduler davranışını doğrular. Şu tanılamalar ana CPU dağılımıyla birleştirilmez:

```sh
# Aynı dondurulmuş ürün; 30+60sn asenkron GPU ve arıza/cleanup envanteri.
node benchmarks/run.mjs --phase optimized --build-tag pre-v11-final-8768398 \
  --backend-tag pre-v11-final-8768398 --reuse-build --reuse-binary \
  --id YENI_GPU_RUN_ID --profiles M --scenarios repair-burst --repeats 1 \
  --warmup 30 --seconds 60 --dpr 1 --lock-input --disable-browser-energy-saver \
  --lifecycle-counts --scene-inventory --profile-gpu --max-minutes 5
# Aynı mevcut uzun koşu, ek olarak doğrudan materyal sayımı. Tek makine lease'i.
node benchmarks/run.mjs --phase optimized --build-tag pre-v11-final-8768398 \
  --backend-tag pre-v11-final-8768398 --reuse-build --reuse-binary \
  --id YENI_ENVANTER_RUN_ID --profiles M --scenarios long --repeats 1 \
  --warmup 30 --seconds 60 --long-seconds 1200 --dpr 1 --lock-input \
  --disable-browser-energy-saver --lifecycle-counts --scene-inventory --max-minutes 25
```

`--reuse-build/--reuse-binary` yeni derleme yapmaz; önce kaynak/build provenance dosyalarının kimliği doğrulanmalıdır. `--scene-inventory` yalnız bu ek sayımı, `--lifecycle-counts` JS timer/observer tanılamasını, `--profile-gpu` asenkron GPU sorgularını açar. `--lock-input` test kamera/kadrajını dış girdiden korur. `--disable-browser-energy-saver` sadece geçici benchmark profilinin 30Hz pil tasarrufunu kapatır, sistem güç ayarını değiştirmez. Bu bayrakların overhead'i normal üretim kullanımıyla eşit sayılmaz.

**30 Ekim 2026 eki:** [Panel çalışması](PANEL_CPU_OPTIMIZATION.md) son v5 kaynak kimliğini,40 hücre/beş blok AC matrisini, beş dolu-log çiftini ve reddedilen instance kapasite prototipini içerir. Toplam CPU ve signed Δpanel ayrıdır; log akıcılık/RSS kazanımı net toplam CPU kazanımı diye sunulmaz. Pildeki son kararlılık/yardımcı oturumu AC dağılımlarına eklenmez. [Gerçek müdür/worker komutları](../benchmarks/orchestration/README.md).

**26 Ekim 2026 eki:** Güncel sınırlı log sürümünden başlayan eşleşmiş panel matrisi, ayrı profiling build'i, log/lifecycle tanılamaları ve yeni frozen build komutları [PANEL_CPU_OPTIMIZATION.md](PANEL_CPU_OPTIMIZATION.md) içindedir. Aşağıdaki 25 Ekim yöntem ve sonuç bağlantıları tarihsel olarak korunur; o raporun eski güvensiz log baseline'ı yeniden çalıştırılmaz. Güncel panel/kargo indeks sınırları ARCHITECTURE ve yeni ekte anlatılır.

Bu altyapı mevcut tam ekran dünyayı, aynı üretim React/R3F bileşenleriyle ölçer. Ayrı bir ucuz renderer veya kalıcı performans ekranı yoktur. `__KUBEVIEW_BENCHMARK__` yalnız harness'in önceden yüklediği opt-in gözlemcidir; normal kullanımda oluşturulmaz. Sonuç ve sınırlamalar [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md) içinde tutulur.

## Ölçüm yolu ve maliyet haritası

| Yol | Ne zaman çalışır | Oluşturma / temizleme ve gözlem |
|---|---|---|
| Go `server/stream.go` dynamic informer | Her WebSocket için list/watch; 10 dk resync | Bağlantıya ait cache, 2048 envelope kuyruk, 10 sn write deadline; context iptalinde factory kapanır. Ortak fan-out hub yoktur. Eski `pkg/websocket/hub.go` aktif giriş değildir. |
| Snapshot | İlk senkronizasyon / reconnect | Store listesi → `sanitize` deep copy → JSON. Snapshot gate'i eski callback'in yeni snapshot'ı geriletmesini engeller. |
| WebSocket → store | Gelen her mesaj | JSON parse → UID reducer → publish. Kaynak adresi recreation denetimi ve obje kopyası kaynak sayısıyla artar. Sürümler opaque dizelerdir. |
| React | Mesaj/poll/seçim/tercih değişimi | Tek context yayını; kaynak seçicileri aynı canonical nesneleri kullanır. `ships` uyum görünümü Node başına Pod filtreler. Dar abonelik/batching eklemek otomatik bir kazanç kabul edilmez. |
| Filo / su / yük | Görünür ve hareketli sahnede mevcut R3F frame'i | UID fazları ve önceden hesaplanan rota; analitik GPU suyu, ortak CPU su örneği; her frame yeni spline veya CPU vertex ağı yoktur. |
| PodCargo | Mevcut frame ve kaynak değişimi | Mevcut instancing korunur. Parça matris cache adayı tekrarlı karşılaştırmada yeterli kazanç göstermediği için geri alındı. Instance sırası kalıcı UID değildir. |
| Seçim / label | Pointer, kaynak/hover/seçim değişimi | R3F raycast; birkaç seçili/hover/yükleme etiketi. DOM paneli canvas boyutunu değiştirmez. |
| GPU kaynakları | Sahne/kalite/instance sayısı değişimi | Ortak geometry/material; asset, texture ve instance buffer temizliği. `preserveDrawingBuffer` PNG işlevi için korunur; ölçmeden kapatılmaz. |
| Log | Açık Pod/container akışı | AbortController ve flush timer temizlenir. Yerel görünüm satır ve UTF-8 byte sınırlarıyla; sunucu log verisi değiştirilmez. |

M ve L sahnesi mevcut ürünün **8 gemilik bölgelemesini** kullanır. Tüm 20/50 Node ve 300/1500 Pod gerçek canonical store'a girer; görünür kaynak sayısı her koşunun `inventory.stats.lifecycle` alanında kaydedilir. Bu sonuç, 50 geminin aynı anda detaylı çizimi için kanıt değildir.

## Ortam ve ölçütler

Her koşu `benchmarks/results/<run-id>/` altında manifest, ham render/mesaj JSON'u, süreç örnekleri ve özet bırakır. Commit, tracked diff SHA-256, kilit dosyası SHA-256, üretim build kimliği, fixture/senaryo sürümü; donanım, OS, güç; tarayıcı, CSS viewport, gerçek/emüle DPR, renderer DPR, framebuffer ve GPU renderer kaydedilir. Ham donanım seri numaraları kaydedilmez. Başlangıç kullanıcı kamera değişiklikleri korunmuştur.

- S = 5 Node / 50 Pod; M = 20 / 300; L = 50 / 1500. Seed `20261024`, nihai sürüm `kubeview-benchmark-v2`. Pending, başarısız, terminating, çok container ve owner ilişkileri bulunur. v2, atanmamış Pod container durumunu Waiting/ContainerCreating olarak tutar; önceki v1 girdileri Go mikro ölçüm kanıtında ayrı SHA'larıyla arşivlenmiştir.
- Fixture yalnız **Go test binary** içindedir; `/dev/null` kubeconfig, sentetik `benchmark` context, salt okunur gerçek API yüzeyi kullanır. İç replay endpoint'i fake dynamic client'ı değiştirir; gerçek informer → cache → WebSocket → production store → App yolundan geçer. Gerçek Kubernetes admission, scheduler veya controller simüle edilmez.
- Üretici tarayıcıdan bağımsız Go goroutine'idir. Planlanan/gerçek uygulama zamanı, sıra, hata ve toplam ayrı kaydedilir. 60 sn olay koşusu: 50 sn × 5 olay/sn ve 10 sn × 100 olay/sn = 1250 olay. p95 üretici gecikmesi 100 ms'yi aşıyorsa karşılaştırma geçersizdir.
- Kısa kabul koşusu: 30 sn ısınma + 60 sn ölçüm × en az 3 tekrar. Daha kısa koşular `smoke: true` ile yalnız tanılamadır. Medyan, aralık ve n kullanılır.
- Çizim/sn = **tamamlanan JS render çağrısı sayısı / aktif duvar süresi**. Render başlangıç aralığı p50/p95/p99 ve >50/>100 ms aralıklar saklanır. Bunlar GPU'nun ekrana sunduğu kare sayısı değildir. rAF/DOM/sonraki çizim işaretleri proxy olarak adlandırılır; özel tıklama ölçümü INP değildir.
- `jsSubmitMs`, renderer JS çağrısının duvar süresidir; GPU süresi değildir. `--profile-gpu` ayrı tanılamada WebGL2 disjoint timer query'yi asenkron okur; disjoint örnekler atılır, `gl.finish` kullanılmaz. Ana karşılaştırmada GPU/CPU profiler ve video kapalıdır.
- Sayımlar tüm ana render ve shadow pass'lerini kapsamak için opt-in durumda `info.autoReset=false` ve dış render başında reset kullanır. Geometry/texture adetleri VRAM MB değildir.
- Callback → parse → reducer → publish; doğru UID/RV için React commit ve sonraki ilgili sahne çizimi ayrı kaydedilir. Callback öncesi main-thread kuyruğu, ağ ve Kubernetes gecikmesi bu sürelerde yoktur. Çizim proxy'si ekranın fiziksel sunumunu kanıtlamaz; görünmeyen bölgedeki UID için görünür gecikme üretilmez.
- CPU: `ps` süreç CPU zamanı farkı / duvar süresi; 1 çekirdek eşdeğeri = %100. Browser/GPU/renderer ve Go ayrı tutulur. RSS ayrı PID'lerde sunulur; paylaşılan bellek tekil toplam RAM gibi toplanmaz. JS heap, Go HeapAlloc/HeapInuse, OS RSS ve GPU kaynak adetleri farklıdır.
- Go fixture üreticisi ve fake Kubernetes cache'i aynı test sürecindedir. Üretici uygulama duvar süresi ayrı kaydedilir; bu düzende üreticinin CPU'su Go gateway CPU'sundan tam ayrılamaz. Bu sınırlama gerçek backend verimliliği iddiasına dönüştürülmez.
- `performance.memory` yoksa JS heap N/A'dır. Zorunlu GC ana akıcılık testine eklenmez. 20 dk plato yalnız çalıştırılan senaryo için kanıttır.

Önerilen M bütçesi: 55+ çizim/sn, aralık p95 ≤20 ms / p99 ≤33,3 ms; görünür geri bildirim p95 ≤100 ms, temel panel ≤200 ms; callback-store normal ≤100 ms / burst ≤250 ms, callback-görünüm proxy normal ≤250 ms / burst ≤500 ms. L için ayrı 30 çizim/sn ve p95 ≤40 / p99 ≤50 ms hedefi vardır. Donanımlar arası mutlak CI kuralı değildir. Eksik metrik N/A'dır.

## Çalıştırma

Repo kökünde Node 22+, Go ve Playwright tarayıcıları gerekir:

```sh
npm --prefix frontend ci
npm --prefix frontend exec playwright install chromium webkit
npm --prefix frontend run bench:test
npm --prefix frontend run bench:run -- --phase baseline --profiles S,M,L --scenarios living
```

`--phase` yalnız artefakt etiketidir; Git checkout'unu değiştirmez. Bu raporun log düzeltmesinden önceki sürümünü temiz kurulumda yeniden üretmek için önce `node benchmarks/rebuild-baseline.mjs --install` çalıştırın; başlangıç commit'i Git geçmişinde bulunmalıdır. Kaydedilmiş kullanıcı/runtime patch'inden derlenen dosyalar tarihsel SHA-256 listesiyle doğrulanır. Sonra baseline koşularında `--reuse-build` kullanın. Güncel optimized build'i ayrı fazda derleyin; aynı backend binary'sini karşılaştırmada `--reuse-binary` ile koruyun.

`bench:run` doğru production build'i ve test binary'sini üretir, fixture dosyasını seçer, loopback sunucusunu ve kendine ait tarayıcıyı açar/kapatır. Varsayılan 1440×900 CSS, sabit medium, DPR 1, headed Chromium/Metal; Apple GPU kimliği manifest'te doğrulanır. Bu DPR seçimi native Safari'nin Retina DPR sonucu değildir. `--reuse-build --reuse-binary` yalnız daha önce dondurulmuş aynı fazı yeniden kullanır; değişen kaynakların build'e girmesini engeller. Var olan build'i yenilemek için açık `--replace-build` gerekir; tarihsel baseline'ı yanlışlıkla güncel kodla ezmeyin. Güç kaynağı koşu sırasında değişirse koşu durdurulur.

macOS koşu ömrü boyunca kendine ait `caffeinate -di` süreciyle ekran/idle uyumasını engeller; kalıcı sistem ayarını değiştirmez ve kapanışta süreci temizler. Pil %10'un altındaysa veya sistem serbest bellek göstergesi %8'in altındaysa kontrollü durur. Güç kaynağı manifest'te ve periyodik süreç örneklerinde saklanır.

```sh
# Aynı M sahnesinde olay, efekt, panel ve kullanıcı akışları.
npm --prefix frontend run bench:run -- --phase baseline --profiles M \
  --scenarios events,water-off,ships-off,idle,panel,interaction
# Kod düzeltmesinden sonra aynı parametrelerle optimized fazı.
npm --prefix frontend run bench:run -- --phase optimized --profiles S,M,L --scenarios living
npm --prefix frontend run bench:compare -- BEFORE_DIR AFTER_DIR OUTPUT.json
# Ayrı ve kısa profiler; smoke/diagnostic, kabul koşusu değildir.
npm --prefix frontend run bench:run -- --phase optimized --profiles M --scenarios living \
  --repeats 1 --warmup 5 --seconds 15 --profile-cpu
npm --prefix frontend run bench:run -- --phase optimized --profiles M --scenarios living \
  --repeats 1 --warmup 5 --seconds 15 --profile-gpu
# 20 dakika; kaynak churn, log/panel yaşam döngüsü ve üç reconnect.
npm --prefix frontend run bench:run -- --phase optimized --profiles M --scenarios long \
  --repeats 1 --long-seconds 1200
```

Uzun koşu28 sn ×5 olay/sn +2 sn sessiz pencere döngüleridir (20 dk toplam5600 olay). Kontrol29/59/89... saniyede, sonraki ADD başlamadan yapılır; eşit kaynak sayısı doğrulanır. İlk10 dk log açık kalır; sonraki10 dk panel/log tekrar açılır. Reconnect'ler89/179/269. saniyede yapılır; son bağlantı15,5 dk açık kalır. Informer bağlantı başına kurulduğundan4 dakikada bir reconnect10 dakikalık resync'i hiç sınamayabilirdi. Aynı resourceVersion resync callback'i opt-in sayaçla gerçekten görülmeden uzun koşu başarılı sayılmaz. Tarayıcıdaki opt-in frame/mesaj kayıtları her30 sn Node harness'e boşaltılır; ölçüm aracının72 bin kareyi tarayıcı heap'inde tutması sızıntı diye yorumlanmaz. Bu ham parçalar sonuç dizininde kalır.

Kamera/OrbitControls hedefi ölçümden önce ortak poza getirilir; yalnız1e-9 düzeyinde aritmetik yuvarlama yok sayılır, gerçek kadraj farkı reddedilir. Deniz/seyir seçenekleri tam hareketle açılan sahnede gerçek Ayarlar kontrolünden değiştirilir; kapalı seyirle yeniden doğan park etmiş filo kıyasına dönüşmez. Olay senaryosunun her tekrarı aynı başlangıç upstream nesneleri için yeni fixture süreci/istemci bağlamı açar. Bunların tamamı30 sn ısınmanın dışındadır.

`--capture` ölçüm bittikten sonra PNG alır; `--log-bytes 65536 --scenarios log-stress` yalnız fixture'ın uzun satır tanılamasıdır. Üretim log endpoint'ine özel bir komut/shell yeteneği eklemez. Süreç başına 6 GiB RSS güvenlik eşiği vardır; başarısız/yarım koşu yeşile çevrilmez. Test binary'si süre sınırlıdır. L, S/M güvenle tamamlandıktan sonra başlar.

Go mikro ve ağ tanılamaları, browser akıcılık koşularıyla eşzamanlı çalıştırılmaz:

```sh
go -C backend test ./pkg/server -run '^$' \
  -bench BenchmarkSnapshotCacheSanitizeMarshal -benchmem -count 5
KUBEVIEW_BENCH_NETWORK=1 KUBEVIEW_BENCH_RESULT_DIR="$PWD/benchmarks/results/backend" \
  go -C backend test ./pkg/server -run TestBenchmarkSlowReaderReconnect -v
# Race sonucu performans sonucu değildir.
KUBEVIEW_BENCH_NETWORK=1 go -C backend test -race ./pkg/server \
  -run 'TestBenchmarkSlowReaderReconnect|TestInformerWebSocketSnapshotAddUpdateDelete'
```

`BenchmarkSnapshotCacheSanitizeMarshal` gerçek store-list/sanitize/JSON işine ns/op, B/op ve allocs/op üretir. Ağ tanılamasındaki kuyruk byte'ları serileştirilmiş resource payload eşdeğeridir; Go resident belleği değildir. Opt-in observer'ın JSON ölçüm maliyeti ayrıca kaydedilir.

Tam seed'li Go profilleri ve testleri `node benchmarks/backend.mjs RUN_ID` ile seri çalıştırılabilir. `node benchmarks/export.mjs PREFIX`, bitmiş koşulardan ham koşu değerleri ve tekrar medyan/aralıklarını `PREFIX-export/runs.csv`, `medians.csv`, `summary.json` içine yazar; eksik koşuları başarılı saymaz. `node benchmarks/evidence.mjs` ayrı Chromium/WebKit işlev testleri ve video/PNG üretir; video hiçbir ana FPS koşusuna dahil edilmez. `--profile-frames` ile ayrı Chrome timeline kaydı alınabilir; diğer profiler bayraklarıyla aynı koşuda birleştirilemez.

`node benchmarks/report.mjs PREFIX`, kabul edilen tam üçlülerin ledger'ından okunabilir `TABLES.md` ve ölçülmüş zamanlama hedefleri için `budgets.json` üretir. Eksik üçlüde durur; başarısız hedefleri silmez. `node benchmarks/buffers.mjs`, ayrı test binary'si ve loopback port5196 ile6000 satırlık log burst'ü ve600 watch değişikliğini gerçek ürün yolundan geçirir;5000 satır/1 MiB yerel log ve500 olay sınırını, son kaynak içeriğini ve log kapanışını denetler. Bu doğruluk testi bir FPS ölçümü değildir; ana akıcılık koşuları bittikten sonra çalıştırılır.

## Safari ve kaynaklar

Playwright WebKit, kurulu Safari ölçümü değildir. Bu oturumda native Safari WebDriver bağlantısı zaman aşımına uğradı; Safari FPS/heap/CPU sonuçları N/A bırakılır. Safari manuel akışı ve son koşuların durumu raporda açıkça ayrılır; erişim engeli yazılım renderer sonucu ile doldurulmaz.

```sh
node benchmarks/safari-check.mjs
node benchmarks/serve.mjs --phase optimized --profile M --reuse-build
# Safari'de http://127.0.0.1:5195/__benchmark/manual açın.
```

Web Inspector'ı ayrı pencerede kullanın; CSS viewport'u kaydedin. 30 sn ısınmadan sonra konsolda `benchmarkManual.start(); setTimeout(()=>benchmarkManual.save().then(console.log),60000)` çalıştırın; üç kez tekrarlayın. Sonuçlar `benchmarks/results/manual-optimized-M/` içine gider. Dock edilmiş Inspector viewport'u değiştirirse bu koşuyu aynı viewport karşılaştırması saymayın. Inspector CPU/memory/frame kaydı ana hafif koşudan ayrı olmalıdır. Native Safari sonucu otomasyon WebKit sonucu ile doldurulmaz.

`node benchmarks/rebuild-baseline.mjs`, başlangıç commit'i ve kaydedilmiş kullanıcı/instrumentation patch'ini geçici dizinde derler; çalışma ağacını değiştirmez. İlk üretim artefaktıyla SHA-256 eşdeğerliği gerçekten doğrulanmıştır (`baseline-living-3x/reproduction.json`).

Yöntem referansları: [R3F demand ve kaynak paylaşımı](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Three renderer sayaçları](https://threejs.org/docs/pages/WebGLRenderer.html), [Safari Timelines](https://webkit.org/web-inspector/timelines-tab/), [Go diagnostics](https://go.dev/doc/diagnostics), [INP tanımı](https://web.dev/articles/inp), [rAF zamanlaması](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [heap/OS bellek ayrımı](https://developer.chrome.com/docs/devtools/memory-problems), [memory API sınırlaması](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory), [GPU timer query](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query).

## 8 Kasım2026 — v1.1.0 adayının sınırlı kabul kuyruğu

Başlangıç kodu değişmeden önce `v11-start-2b76e21` source/build'i donduruldu. Son aday aynı araçla yeni isimde hazırlanır; bu bölüm henüz ölçüm sonucu değildir. Eski49hücre raporu yeni kaynak için PASS sayılmaz.

```sh
node benchmarks/repair-session.mjs NEW_RUN_ID v11-start-2b76e21 FINAL_FROZEN_TAG --suite v11
```

`--suite v11` mevcut runner ve supervisörle31hücrelik sonlu alt küme seçer: üç eşleşmiş blokta aynı seçiliUID/camera/faz ile M açık/kapalı panel, M ayrı hareket-kapalı idle, L normal dünya; son adayda üç normal5Hz olay ve üç etkileşim tekrarı; bir1200s karma/log/churn/reconnect/resync ve20panel koşusu. Steady pencereler30sısınma+60sölçüm; teorik toplam pencere65,5dakikadır, build/kurulum dahil değildir. Hata, kaynak/build/tarayıcı/güç değişimi veya pil<%10 sonraki işi durdurur; otomatik retry yoktur. Kaldığı yerden sürdürme yeni run-id ve aynı kimlik kontrolleriyle ayrıca gerekçelendirilir.

M20Node/300Pod canonical,görünür8/120; L50/1500,görünür8/270. Varsayılan medium/DPR1/su+seyir korunur; idle ayrı ayar karşılaştırmasıdır. Bu fixture Go tracker→üretim informer/WS/store→sahne yolunu sınar, gerçek Kubernetes/provider E2E değildir. Yeni gerçek bağlantı/metrics/iki-cluster/Hubble kanıtları kabul raporunda ayrıca yer alır. Eski arıza-effect render core'u ve provider core kaynakları değişmediyse tam49hücreyi sebepsiz tekrarlamak yerine dosya eşitliği+hedefli görsel/API regresyonu kullanılır. Trafik collector maliyeti fixture browser CPU'suna karıştırılmaz.

Sürüm metaverisi karşılaştırması:0.4.0→1.1.0 geçişinde lockfile'ın ham SHA'sı değişti. Runner artık komutu başlatan checkout'un lockfile'ını frozen baseline'a aitmiş gibi yazmaz; her frozen source'un gerçek lock SHA'sını provenance ile doğrular. Sabit koşullarda yalnız root `version` ve `packages[""].version` hariç tutularak bağımlılık grafiği SHA'sı karşılaştırılır. Bütün dependency sürümleri, integrity/resolved ve platform/optional/peer bildirimleri korunur; gerçek değişiklik karşılaştırmayı reddeder. İki ham SHA ve eşit grafiğin kanıtı `artifacts/v1.1.0/v11-20261108/dependency-lock-comparison.json`; yeni unit bunu gerçek dependency değişikliğinden ayırır.

9 Kasım devamı: v1.1 uzun koşusu mevcut checkpointlerde `--scene-inventory` de kullanır; materyal kimliği sayımı için ikinci bir20dk tur başlatılmaz. Bu read-only sayım yalnız1200s cleanup işindedir; üçlü steady panel/idle/L CPU çiftlerinde kapalıdır ve uzun koşunun tanılama overhead'i ayrı belirtilir. Ham frozen lockSHA her manifestte kalır; settings karşılaştırmasında normalleştirilmiş anahtar açıkça dependencyGraphSHA256 adını taşır.

## Workspace oturumunu yeniden üretme

Yeni runtime/önceki kaynak frozen tag'leri mevcutsa geliştirme deposunda:

```sh
node --test benchmarks/repair-session.test.mjs benchmarks/workspace-report.test.mjs
node benchmarks/repair-session.mjs YENI_RUN_ID v11-final-32a0468 workspace-final-20261110 --suite workspace --long-first
node benchmarks/workspace-report.mjs YENI_RUN_ID
```

`YENI_RUN_ID` benzersizdir; eski sonuç dizini ezilmez. Frozen frontend/backend üretimi yukarıdaki mevcut build adımlarını kullanır; kaynak/build hash'i farklıysa mevcut etiketin üstüne yazmayın. `--suite workspace`35 seri iş/46hücre,30s warmup+60s ölçüm/3blok ve1×1200s karma koşudur. `--long-first` yalnız son kaynak kararlılık koşusunu öne alır; eşleşmiş AB/BA sırasını/süreleri veya sayıyı değiştirmez. Bütün koşullar `--lock-visual-start` ile aynı filo fazında başlar; hareket ölçüm penceresinde açık kalır. `--partial` raporu ilerleme içindir, kabul olmaz.

Kuyruk otomatik retry yapmaz; her işin timeout'u ve process-group/PID temizliği vardır. Pil10%altı veya güç kaynağı değişimi durdurur; düşük kaynakta kabul için korumayı gevşetmeyin. Üç tekrar bitmeden CPU kazancı çıkarmayın. Ağır build/cluster/browser işleri ayrı tutulmalı; gözlenen sistem yükü kaydedilmeli.10Kasım'da ilk oturum başlangıç fazı nedeniyle dışlandı, ikinci~19dk'da9%pil nedeniyle kesildi; bu koşuların başarılı1200s veya yeni CPU kabulü olduğu iddia edilmez. [Güncel sonuç ve açıklar](PERFORMANCE_REPORT.md).

Manuel kullanıcının uygulamayı açması bu benchmark dosyalarına/frozenartefaktlara bağımlı değildir; tek binary ve yedi profil için [MANUAL_TEST_GUIDE.md](../MANUAL_TEST_GUIDE.md) kullanılır.
