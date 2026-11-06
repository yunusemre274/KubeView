# Production performans raporu — 25 Ekim 2026

**6 Kasım 2026 — v1.1 öncesi onarım:** [Yeni kabul raporu ve tam tablolar](PRE_V11_VISUAL_REPAIR.md#6-kasım--kabul-edilmiş-49-hücrelik-pil-ölçümü) 49/49 geçerli hücreyi, üç bağımsız eşleşmiş bloğu ve son 20 dakika koşusunu içerir. Açık panel browser CPU medyanı 0,4325→0,4143 çekirdek; aralıklar örtüşür, genel optimizasyon oranı iddia edilmez. Çoklu arıza anlatımının farkı +0,0162 çekirdek ek işlev maliyetidir. M/L yaklaşık 60 JS çizim/sn korudu. Uzun koşu p95 18,6 / p99 19,4 ms, tam canonical içerik eşitliği, 20/20 panel çevrimi ve 24/24 log kapanışıyla geçti. GPU ve doğrudan materyal envanteri ayrı tanılamadır; eski AC ve aşağıdaki tarihsel sonuçlara katılmaz.

**30 Ekim 2026 ek raporu:** [PANEL_CPU_OPTIMIZATION.md](PANEL_CPU_OPTIMIZATION.md) güncel v5 kaynak kimliği ve ham sonuç bağlantılarıyla40 hücrelik AC panel matrisini, beş dolu-log çiftini, reddedilen kapasite adayını ve son doğrulamanın gerçek durumunu içerir. Log p95 medyanı41,7→17,7ms, en büyük PID RSS459,4→386,2MiB; net toplam CPU kazancı kanıtlanmadı. Bu yeni sonuçlar aşağıdaki tarihsel25 Ekim sayılarını değiştirmez. Pil/AC ve prototip/production kanıtları ayrı tutulur.

**26 Ekim 2026 yeni çalışma:** Sınırlı log sürümünü yeni baseline alan panel CPU araştırması [PANEL_CPU_OPTIMIZATION.md](PANEL_CPU_OPTIMIZATION.md) içindedir. Aşağıdaki 25 Ekim sayıları değişmeden saklanır. Özellikle 0,413→0,551 sürümler arası açık-panel farkıdır; paneli açmanın nedensel maliyeti değildir.

Log görünümünün sınırsız byte birikimi düzeltildi; tam ekran dünya, hareketli gemiler, deniz, seçim, kamera ve Neumorphism paneller korundu. Sahne/Three chunk'ları baseline ile byte eşdeğer. Normal dünyada bir hızlanma iddiası yok: M ve L profillerinde önce de sonra da yaklaşık60 JS çizim/sn ölçüldü.

Tamamlanan ana kapsam: **19 geçerli üçlü set**,30 sn ısınma +60 sn ×3; **1 güvenlik nedeniyle durdurulmuş baseline**. Dokuz önce/sonra çifti karşılaştırılabilirlik kapısını geçti. Uzun log baseline'ı30 sn ısınma sonunda6 GiB renderer RSS sınırını aştı;0 ölçüm tekrarı tamamlandı, tekrar edilmedi ve tam senaryo hızlanma oranı **N/A** bırakıldı. Yeni sürüm aynı uzun log yükünde üç tam tekrarı yaklaşık60 çizim/sn ile tamamladı.36 uygulanabilir zamanlama kontrolü geçti; bu sonuç pixel/presentation veya bütün ürün özellikleri için kabul iddiası değildir.

## Ortam ve kimlik

- Başlangıç commit'i: `5cfd30d7e0d6202bc1bd19dd8d0e4979fa2d5e8f`; kullanıcının commit edilmemiş yön tuşu değişiklikleri korundu. İlk tracked diff SHA-256: `769ba6da05d452de3638e4be3710e5542b11415e9672176fa82cda2e44e2f1b4`.
- Kilit dosyası SHA-256: `02861c6741be1eef8c70fedd1b51dc7a8e400888502c7ac41d81188eff9b5560`; bağımlılık yükseltmesi yapılmadı. Her koşu kendi kaynak/build/fixture/protokol kimliğini manifest'te taşır.
- MacBook Air Mac17,3 / Apple M5,10 çekirdek /32 GB / macOS27.0.1 (26A434). Chromium156.0.8078.4, headed, ANGLE Metal Apple M5. Go1.26.5.
- 1440×900 CSS; emüle DPR1, renderer DPR1,1440×900 framebuffer; medium, sabit kalite ve gölgeler; video/profiler ana koşularda kapalı. CoreGraphics ekran60 Hz,1470×956 mantıksal /2940×1912 backing. Bu native Retina DPR2 ölçümü değildir.
- S çiftleri ve20 dk koşu AC; M/L çiftleri pilde, düşük güç kapalı. Her karşılaştırma kendi içinde aynı güç koşulunda. Farklı güçteki profillerin CPU'su ölçek kazancı diye birbirine oranlanmaz. Koşu ömrüyle sınırlı `caffeinate -di` kullanıldı.
- Seed20261024 / `kubeview-benchmark-v2`: S5/50, M20/300, L50/1500 Node/Pod;4 Namespace ve4 minimal workload nesnesi. Ürün renderer'ı kullanılır. M'de8 gemi/120 Pod, L'de8 gemi/270 Pod görünür; bütün canonical kaynaklar korunur. Mevcut bölgeleme ve Node>12 ayrıntı LOD'u her iki sürümde de açıktır. **50 ayrıntılı geminin eşzamanlı çizimi doğrulanmadı.**
- Fixture, test binary'sindeki fake Kubernetes tracker'ı gerçek informer → cache → WebSocket → production store/App/sahne yoluna bağlar. Minimal workload/owner verileri controller/admission, ReplicaSet zinciri veya gerçek scheduling simülasyonu değildir. Canlı kümeye sentetik kaynak uygulanmadı.
- **Native Safari27.0.1 performansı N/A:** gerçek WebDriver oturumu HTTP500 bağlantı zaman aşımı verdi. Playwright WebKit işlev testidir; kurulu Safari FPS/CPU/heap sonucu değildir. [Gerçek erişim hatası](../benchmarks/results/native-safari-access/availability.json) kaydedildi; manuel Safari yolu [ölçüm kılavuzunda](PERFORMANCE.md) vardır.

## Kanıtlanan darboğaz ve değişiklik

64 KiB/satır ×10 satır/sn log yükünde eski satır sayısı sınırı byte, bitmemiş satır ve flush öncesi birikimi sınırlamıyordu. Tam baseline koşusunda Chromium renderer PID76492,30 sn ısınma sonunda **6.359.216 KiB RSS ≈6,06 GiB** ile güvenlik sınırını aştı. O örnekte sistem serbest bellek göstergesi%81, swap0 idi. Bu renderer RSS'idir; JS heap veya uygulamanın tekil toplam RAM'i değildir.

Yeni `LogBuffer`, UTF-8 üzerinden **5000 satır /1 MiB /satır başına16 KiB** uygular; yarım satırı da sınırlar.180 ms flush ve container değişimi/kapanış abort davranışı korunur. Kullanıcıya kısaltma uyarısı gösterilir. Bu, **yerel log geçmişinin kapsamını değiştiren** bir düzeltmedir; ham Kubernetes log endpoint'i ve3D kalite değişmez.

Yeni sürümün tam uzun log üçlüsünde59,99–60,01 çizim/sn, p9517,7–18,6 ms, browser CPU0,533–0,598 çekirdek; ölçüm sonu en büyük browser süreci RSS483–527 MiB görüldü. Başlangıç ısınma örnekleri460–535 MiB idi. Bunlar tepe bellek veya retained heap ölçüsü değildir. Güvenlik nedeniyle yarım baseline ile tam hızlanma yüzdesi hesaplanmaz.

Ayrı,5 sn ısınma +15 sn ağır CPU profilinde minified **satır ve sütun** kaynak kodla eşleştirildi: log `scrollTop = scrollHeight` etkisi örneklenen duvar süresinin%91,48'inden%2,34'üne indi. Bu OS toplam CPU yüzdesi değildir. Allocation tanılamasında tahmini V8 toplamı503 →995 MB arttı; daha fazla frame çizildiğinden toplam allocation azalması iddia edilmiyor. Retained heap ile allocation toplamı karıştırılmaz. Kanıt: [son sıcak nokta eşlemesi](../benchmarks/results/log-hotspot-final.json), `v3-diagnostic-{baseline,optimized}-{cpu,alloc}-20261024220004902/`. Büyük trace'ler ilgili `traces/` klasöründe yereldir ve Git ignore edilir.

PodCargo matris/renk cache adayı ölçümde kazanç kanıtlamadığı için geri alındı; negatif veriler `v2-M-living-comparison.json` ve `rejected-cargo-candidate/` altında tutuldu. İlk sırasız snapshot, yanlış kamera ve güç kaynağı değişen koşular karşılaştırma dışında; tek iyi tekrar seçilmedi. Başlangıç build'i kaydedilmiş runtime patch'inden geçici dizinde yeniden üretildi ve tarihsel SHA'ları eşleşti.

## Önce / sonra ölçümleri

Değerler tekrar medyanı (min–max; tekrar sayısı). JS çizim/sn fiziksel GPU sunum FPS'i değildir. CPU çekirdek eşdeğeri; RSS tek süreç, toplanmış fiziksel RAM değildir.

| Profil / güç | Görünür Node / Pod | Çizim/sn önce → sonra | p95 ms önce → sonra | p99 ms önce → sonra |
|---|---:|---|---|---|
| S / AC | 5 / 50 | 60.00 (60.00–60.00; n=3) → 59.99 (59.99–60.00; n=3) | 18.60 (18.40–18.60; n=3) → 17.60 (17.60–18.60; n=3) | 18.90 (18.90–19.00; n=3) → 18.10 (17.80–19.00; n=3) |
| M / battery | 8 / 120 | 60.00 (60.00–60.01; n=3) → 60.00 (59.99–60.00; n=3) | 18.80 (18.70–18.80; n=3) → 18.80 (18.80–18.90; n=3) | 19.60 (19.50–19.60; n=3) → 19.60 (19.60–19.60; n=3) |
| L / battery | 8 / 270 | 59.99 (59.99–59.99; n=3) → 59.99 (59.99–60.01; n=3) | 18.50 (18.40–18.60; n=3) → 17.60 (17.50–17.80; n=3) | 18.80 (18.80–19.20; n=3) → 18.00 (18.00–18.70; n=3) |

| Profil / faz | Browser CPU çekirdek | Go CPU çekirdek | En büyük browser süreci RSS MiB | Go RSS MiB | JS heap son MiB | Tam frame draw-call / üçgen medyanı |
|---|---|---|---|---|---|---|
| S / baseline | 0.516 (0.490–0.518; n=3) | 0.0015 (0.0015–0.0018; n=3) | 315.1 (308.9–318.0; n=3) | 38.1 (37.1–38.3; n=3) | 28.6 (18.3–47.6; n=3) | 409 (409–409; n=3) / 69159 (69159–69159; n=3) |
| S / optimized | 0.422 (0.412–0.495; n=3) | 0.0017 (0.0013–0.0018; n=3) | 311.4 (310.7–319.2; n=3) | 37.9 (36.9–38.1; n=3) | 25.5 (22.5–27.7; n=3) | 409 (409–409; n=3) / 69159 (69159–69159; n=3) |
| M / baseline | 0.528 (0.522–0.532; n=3) | 0.0017 (0.0017–0.0017; n=3) | 316.9 (311.7–321.0; n=3) | 48.4 (46.2–48.8; n=3) | 37.6 (27.5–42.0; n=3) | 419 (419–419; n=3) / 60894 (60894–60894; n=3) |
| M / optimized | 0.531 (0.526–0.532; n=3) | 0.0017 (0.0015–0.0018; n=3) | 311.5 (278.2–317.5; n=3) | 49.7 (45.8–49.8; n=3) | 22.3 (19.4–36.0; n=3) | 419 (419–419; n=3) / 60894 (60894–60894; n=3) |
| L / baseline | 0.438 (0.430–0.457; n=3) | 0.0015 (0.0013–0.0017; n=3) | 319.9 (314.0–364.7; n=3) | 96.5 (85.7–99.0; n=3) | 24.5 (21.3–31.4; n=3) | 419 (419–419; n=3) / 73998 (73998–73998; n=3) |
| L / optimized | 0.337 (0.336–0.341; n=3) | 0.0013 (0.0013–0.0013; n=3) | 325.5 (324.8–358.2; n=3) | 99.7 (88.1–99.9; n=3) | 37.6 (25.0–104.6; n=3) | 419 (419–419; n=3) / 73998 (73998–73998; n=3) |

RSS ölçüm sonu OS örneğidir, tepe/tekil toplam bellek değildir. JS heap doğal GC noktasında ölçüldü. Draw-call ve üçgen sayıları shadow pass dahil tam JS render çağrısını kapsar.

| Soğuk açılış profil / faz | Canvas + canonical hazır ms | İlk raycast-görünür Node ms | Açılış sayısı |
|---|---|---|---:|
| S / baseline | 194 (194–194; n=1) | 268 (268–268; n=1) | 1 |
| S / optimized | 194 (194–194; n=1) | 263 (263–263; n=1) | 1 |
| M / baseline | 176 (176–176; n=1) | 245 (245–245; n=1) | 1 |
| M / optimized | 186 (186–186; n=1) | 258 (258–258; n=1) | 1 |
| L / baseline | 260 (260–260; n=1) | 290 (290–290; n=1) | 1 |
| L / optimized | 231 (231–231; n=1) | 263 (263–263; n=1) | 1 |

Soğuk açılış ayrı, yeni browser context ile ölçülür; OS/GPU cache temizlenmez. Her yaşayan liman setinde bir açılış vardır: tek açılıştan güvenilir hızlanma yüzdesi çıkarılmaz. Üç ısınmış tekrar bu sütunun örnek sayısı değildir.

| M senaryo | Güç | Çizim/sn sonra | p95 ms sonra | Tüm browser süreçleri CPU önce → sonra | En büyük browser süreci RSS MiB önce → sonra |
|---|---|---|---|---|---|
| living | battery | 60.00 (59.99–60.00; n=3) | 18.80 (18.80–18.90; n=3) | 0.528 (0.522–0.532; n=3) → 0.531 (0.526–0.532; n=3) | 316.9 (311.7–321.0; n=3) → 311.5 (278.2–317.5; n=3) |
| events | battery | 60.00 (59.99–60.01; n=3) | 18.60 (17.60–19.40; n=3) | 0.553 (0.551–0.565; n=3) → 0.466 (0.437–0.582; n=3) | 364.4 (336.6–372.6; n=3) → 341.0 (330.1–374.4; n=3) |
| water-off | battery | 60.00 (60.00–60.00; n=3) | 18.70 (18.70–18.80; n=3) | 0.513 (0.478–0.521; n=3) → 0.518 (0.500–0.524; n=3) | 321.6 (321.6–329.4; n=3) → 321.4 (285.9–326.2; n=3) |
| ships-off | battery | 60.00 (60.00–60.00; n=3) | 18.80 (18.80–18.80; n=3) | 0.519 (0.509–0.519; n=3) → 0.524 (0.514–0.524; n=3) | 323.3 (285.4–324.4; n=3) → 321.9 (291.8–331.1; n=3) |
| idle | battery | 0.17 (0.13–0.25; n=3) | 14937.80 (14934.90–14941.60; n=3) | 0.006 (0.006–0.007; n=3) → 0.011 (0.006–0.022; n=3) | 238.5 (235.6–240.4; n=3) → 254.3 (253.2–254.5; n=3) |
| panel | battery | 59.99 (59.99–60.00; n=3) | 17.70 (17.70–17.70; n=3) | 0.413 (0.394–0.414; n=3) → 0.551 (0.547–0.586; n=3) | 365.9 (330.9–366.1; n=3) → 370.6 (335.9–376.9; n=3) |
| interaction | battery | 60.00 (60.00–60.00; n=3) | 17.80 (17.70–17.90; n=3) | 0.539 (0.466–0.556; n=3) → 0.541 (0.540–0.581; n=3) | 369.2 (360.1–369.4; n=3) → 367.5 (360.0–372.0; n=3) |
| log-stress | battery | 60.00 (59.99–60.01; n=3) | 18.50 (17.70–18.60; n=3) | N/A → 0.567 (0.533–0.598; n=3) | N/A → 502.0 (482.8–527.2; n=3) |

Ölçülemeyen M/log-stress/baseline: Renderer exceeded 6 GiB per-process RSS guard during 30 s warm-up; no measured repetitions. Unsafe case is not retried; no full-scenario speedup ratio may be claimed. Kaynak: v3-M-log-stress-baseline-resume-20261024205346447; renderer RSS 6210.2 MiB. Bu başarısız başlangıç koşusu kabul edilen üçlü veya hızlanma yüzdesi değildir.

Idle aralıkları beklenen demand boşluklarıdır; 60 FPS jank bütçesine uygulanmaz. M/L'de mevcut sekiz gemilik bölgeleme ve Node sayısı>12 için statik ayrıntı LOD'u korunur.

| Olay / faz | Store p95 ms | Görünüm proxy p95 ms | Alınan olay / çizim proxy örneği |
|---|---|---|---|
| normal / baseline | 0.80 (0.70–0.90; n=3) | 13.80 (13.80–15.90; n=3) | 250/103, 250/98, 250/97 |
| burst / baseline | 0.30 (0.30–0.30; n=3) | 16.50 (16.10–18.40; n=3) | 1000/402, 1000/402, 1000/406 |
| normal / optimized | 0.80 (0.70–1.00; n=3) | 19.00 (13.10–19.10; n=3) | 250/103, 250/102, 250/97 |
| burst / optimized | 0.30 (0.30–0.30; n=3) | 17.30 (17.20–18.10; n=3) | 1000/402, 1000/402, 1000/398 |

Görünüm ölçümü doğru UID/RV için commit + sonraki çizim proxy'sidir; görünmeyen bölgelerde örnek yoktur. Callback öncesi ana thread/ağ/Kubernetes gecikmesi dahil değildir.

| Etkileşim fazı | DOM p95 ms | Sonraki rAF proxy p95 ms | Örnek sayıları |
|---|---|---|---|
| baseline | 7.00 (5.70–10.40; n=3) | 16.00 (15.80–16.20; n=3) | 36, 36, 36 |
| optimized | 7.30 (6.00–10.30; n=3) | 15.80 (15.60–15.80; n=3) | 36, 36, 36 |

Özel DOM/rAF ölçümleri INP değildir; temel başlık/veri geri bildirimi proxy'sidir. Hata veya başarısız bütçe burada saklanır; otomatik olarak uygulama kabulü sayılmaz.


## Etkilerin yorumu ve ölçüm aracının maliyeti

- M normal dünya CPU medyanı0,531 çekirdek; yalnız su kapalı0,518, yalnız seyir kapalı0,524. Küçük farklar bu cihazda suyu veya seyri kapatmayı belirgin bir kazanç diye önermiyor. İkisi kapalı durağan modda0,011 çekirdek (0,006–0,022) ve dakikada8–15 çizim var. Watch açık kalır; uzun idle aralıkları jank sayılmaz.
- Açık panel M çiftinde browser CPU0,413 →0,551 çekirdek (+%33); L dünyasında0,438 →0,337 (−%23) ölçüldü. Renderer ve GPU süreçleri aynı yönde değişti. Log kapalı sıcak yolun sahne/Three kodu byte eşdeğer; CPU farkının uygulama koduna veya belirli bir frekans/çekirdek moduna ait nedeni kanıtlanmadı. Frekans/çekirdek yerleşimi doğrudan ölçülmedi. **Genel CPU hızlanması veya her koşulda CPU regresyonu olmadığı iddia edilmiyor.** Ham aralıklar ve per-PID değerler korunur; zaten zamanlama hedefini sağlayan sahne yeniden yazılmadı.
- Instrumentation kapalı üçlü60,00 çizim/sn ve0,519 browser çekirdeği (0,518–0,522) verdi; ana M ölçümünde0,531 (0,526–0,532). Yaklaşık%2,3 fark, farklı zamanlarda yapılan araç kontrolüdür; bütünü saf instrumentation maliyeti olarak ayrıştırılamaz. Kontrolde p95 aralık N/A'dır; sırf ölçüm için render döngüsü eklenmedi.
- Ayrı Chrome timeline koşusunda aktif pencerede **902 WebGL submit /902 DrawFrame** eşleşti.75 olayın75 store ve75 commit işareti; görünür31 UID/opaque-RV için doğru sıralı çizim proxy'si izlendi. Bu15 sn normal yük tanılamasıdır; burst veya pixel/presentation kanıtı değildir. [Korelasyon](../benchmarks/results/v3-diagnostic-frames-20261024220004902/frame-correlation.json).
- Ayrı WebGL2 asenkron GPU timer902 geçerli örnekte medyan2,452 /p952,472 ms verdi. `gl.finish` yok; JS render çağrı süresi GPU süresi diye adlandırılmaz. Ana ölçüme ağır profil/video dahil değildir.

## 20 dakikalık koşu ve arka plan

`v3-M-long-optimized`:1200,11 sn,5600/5600 planlanan olay backend'de uygulandı, p95 üretici gecikmesi2,08 ms. Tarayıcı canlı callback'lerinde5567 değişiklik alındı; reconnect sırasındaki33 değişiklik snapshot ile uzlaştırıldı. Son client/upstream/plan **tam içerikle** eşleşti; yalnız sayım kontrolü yapılmadı.40/40 sessiz kontrol noktasında328 kaynak; üç reconnect89,1/179,1/269,1 sn. Son bağlantı15,5 dk açık kaldı;329 gerçek aynı-resourceVersion resync callback'i görüldü.

Bütün kontrol noktalarında1 WS /29 geometri /3 texture;21 log akışının21'i kapanışta kapandı. JS heap doğal GC ile15,05–44,38 MiB arasında dalgalandı; son10 örnek17/27/20/20/18/23/38/22/34/39 MiB. Go HeapAlloc da GC döngüleriyle salındı. Bu senaryoda sürekli retained büyüme kanıtı görülmedi; zorlanmış GC veya bütün sızıntıların yokluğu iddiası değildir. CPU0,528 browser/0,0059 Go çekirdeği,59,73 çizim/sn, p9519,4 ms. [Kontrol noktaları](../benchmarks/results/v3-M-long-optimized/checkpoints.csv).

29,038.–1199,046. saniye kontrol noktaları arasında Go test süreci allocation hızı0,439 MiB/sn;14 GC için toplam pause0,786 ms, pause p95 N/A. HeapAlloc44,41–87,04 MiB, HeapInuse51,13–92,18 MiB, goroutine44–46 (son44). Generator/tracker/checkpoint HTTP aynı süreçte olduğundan bunlar izole gateway ölçümü değildir. [Go runtime özeti](../benchmarks/results/v3-M-long-optimized/go-runtime-summary.json).

Gerçek native Chromium penceresi OS üzerinden60 sn küçültüldü; `document.hidden` doğrulandı. Gizliyken0 çizim, donan su,300 olayın doğru canonical sonucu ve dönüşte güvenli seyir görüldü. Gizli süre aktif FPS'e katılmadı. [Arka plan ham kanıtı](../benchmarks/results/native-visibility/result.json).

## Backend

Go 1.26.5 / darwin-arm64 / Apple M5 üzerinde gerçek `Store.List → sanitize/deepcopy → JSON marshal` yolu, beş tekrarlı mikro ölçüm:

| Profil (Pod) | ns/op medyan (min–max) | B/op medyan | allocs/op medyan |
|---|---:|---:|---:|
| S (50) | 496.367 (495.065–500.275) | 587.849 | 7.882 |
| M (300) | 2.697.026 (2.688.226–2.704.009) | 3.325.930 | 43.764 |
| L (1500) | 13.025.970 (13.011.999–13.076.140) | 17.098.018 | 212.979 |

Kaynak: `v3-backend/micro.txt`, `micro.csv`, `summary.json`. Bunlar frontend optimizasyonunun önce/sonra farkı değildir; backend sıcak yolu değiştirilmedi. Güncel v2 fixture kullanıldı; manifest commit/diff, fixture SHA, OS/Go ve başlangıç/bitiş pil koşulunu kaydeder. Ayrı profiler koşusunda allocation-space'in %49,11'i DeepCopyJSONValue'da görüldü; sanitize koruması kaldırılmadı. `alloc_space` toplamı retained heap değildir. Ağ tanılaması observer'ının JSON sayımı yaklaşık368 ms ek çalışma içerdiğinden ağır tanılama sonuçları ana FPS setine karıştırılmaz. Önceki v1 Go girdileri `v2-backend/fixtures/` altında ayrıca arşivlendi.

Gerçek WebSocket normal + okumayı durduran istemci / 1 ve 3 eşzamanlı reconnect testinde normal okuyucu 300 değişikliğin tamamını aldı: üretim → alım p95 **3,18 ms**, maksimum4,09 ms. Reconnect snapshot-ready süreleri1 istemcide74,99 ms,3 istemcide91,00–91,06 ms. Bir bağlantıdaki en yüksek kuyruk derinliği284 öğeydi; bütün bağlantılar için toplam bekleyen serileştirilmiş resource payload zirvesi11.737.428 byte oldu. Bu iki maksimumun aynı ana/bağlantıya ait olduğu veya Go resident RAM olduğu iddia edilmez. Yavaş bağlantının kalan işleri dahil en eski kuyruk yaşı15,06 sn ve maksimum write süresi10,00 sn; normal okuyucu bloke olmadı. Kuyruklar kapanışta boşaldı, goroutine2 →3 (test HTTP accept döngüsü). Ayrı race kontrolü ve Go testleri geçti. Kaynak: `v3-backend/backend-network.json`, `network.txt`, `race.txt`, `tests.txt`.

## Doğruluk, görsel kabul ve kalan sınırlar

Son kaynak ağacında72 frontend +6 harness testi ve Go testleri geçti. Ayrı race kontrolü performans setine katılmadı. Son production test binary'si üzerinde **8 Chromium /Playwright WebKit testi**; UID replacement, seçili DELETE, Node arızası/düzelmesi, reconnect/snapshot, hareketli container seçimi, doğru container logu/abort ve odaklı yön tuşlarını doğruladı.

Ayrı HTTP/watch tampon testinde6000 satırdan5000'i tutuldu (454.423 UTF-8 byte);600 watch olayı sonunda event buffer500, kaynak içeriği planla eşit, eski log satırı atılmış, son satır ve kısaltma uyarısı görünür, kapanışta0 açık log isteği. [Sonuç](../benchmarks/results/buffer-limits/result.json).

Dünya, Node, merkez, container, log uyarısı ve Ayarlar PNG'leri açılıp incelendi. Panel/typografi okunur, canvas tam alan; örnek veri etiketi görünür. Kayıt ana FPS koşusundan ayrıdır: [dünya](../benchmarks/results/final-evidence/world-1440.png), [Node](../benchmarks/results/final-evidence/node.png), [log](../benchmarks/results/final-evidence/bounded-logs.png), [Ayarlar](../benchmarks/results/final-evidence/settings.png), [video](../benchmarks/results/final-evidence/world-panels.webm). Güncel production build, ölçülen optimized artefaktla byte eşdeğer doğrulandı: [build kanıtı](../benchmarks/results/final-evidence/build-verification.json).

REAL gözlemi yalnız GET: `kubeview-test /kubeview-qa`,2 Ready Node /7 Running Pod, **0 mutasyon**; gerçek küme FPS ölçülmedi. Docker VM RSS'i yaklaşık10,37 GiB ayrı gözlemlendi, uygulama RAM'i diye sunulmadı. Fixture generator/fake tracker aynı Go test sürecinde olduğu için CPU'su gateway CPU'sundan tam ayrılamaz; apply duvar süresi ayrıca raporlanır. Ağ trafiği, VRAM MB, native Safari FPS/heap/CPU, saha INP ve gerçek Kubernetes controller gecikmesi bu kanıtın dışında/N/A'dır.

Bu cihazda mevcut orta kalite/DPR1 ve bölgeleme açıkken su/seyrin varsayılan açık kalması zamanlama hedefleriyle uyumlu. Enerji tasarrufu isteyen kullanıcı mevcut hareket ayarlarını kapatabilir; veri ve yönetim işlemleri sürer. Başka cihaz/DPR veya50 eşzamanlı ayrıntılı gemi için bu sonuç genellenmez.

## Tekrar çalıştırma ve kanıt dizini

Tam kurulum, baseline üretimi, Safari manuel yolu ve bayraklar: [PERFORMANCE.md](PERFORMANCE.md). Bu oturumun dondurulmuş artefaktlarıyla tek M tekrar seti:

```sh
npm --prefix frontend run bench:run -- --phase optimized --profiles M \
  --scenarios living --reuse-build --reuse-binary
npm --prefix frontend run bench:test
```

`--phase` build etiketidir, Git checkout değiştirmez; `--profiles M`20 Node/300 Pod'u seçer; `--scenarios living`su/seyir açık akıştır; `--reuse-build --reuse-binary` ölçülen artefaktları korur. Varsayılan30 sn ısınma +60 sn ×3. Güncel kaynağı yeniden derlemek için kılavuzdaki ayrı build/replace yolunu kullanın; tarihsel baseline'ı ezmeyin.

Ana sonuçlar: [kabul edilen setler](../benchmarks/results/v3-export/accepted-runs.json), [başarısız baseline](../benchmarks/results/v3-export/unavailable-runs.json), [ham koşu CSV](../benchmarks/results/v3-export/runs.csv), [medyan/aralık CSV](../benchmarks/results/v3-export/medians.csv), [JSON](../benchmarks/results/v3-export/summary.json), [zamanlama bütçeleri](../benchmarks/results/v3-export/budgets.json). Her setin kendi klasöründe manifest, ham render/mesaj ve per-PID süreç örnekleri vardır. İlk devam denetleyicisi güvenlik sınırında terminal failed; son `v3-resume-20261024220004902/state.json` complete. Bu, başarısız baseline'ın başarılıya çevrilmesi değildir.
