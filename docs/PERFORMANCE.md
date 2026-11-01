# KubeView performans ölçümü

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
