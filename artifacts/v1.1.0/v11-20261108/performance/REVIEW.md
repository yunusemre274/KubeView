# 9 Kasım 2026 — v1.1.0 performans ve kararlılık kanıtı

Bu kayıt `32a0468ad51516a1bb38aab68760e73984c45ddf` runtime'ını, değişiklik öncesinde dondurulmuş `2b76e215fdbe201be1611ccea4c40dcd547b2ba7` ile karşılaştırır. Sürüm yayımlandığı veya CPU optimizasyonu elde edildiği anlamına gelmez. Ana oturum `v11-final-ac-20261109`: **31/31 hücre, valid=true, partial=false, reasons=[]**. Çizim/veri/cleanup kapıları ile CPU'nun nedensel yorumu ayrıdır.

## Ortam ve yöntem

- Apple M5, Mac17,3, 32 GiB; macOS27.0.1 / Darwin27.0.0; Chromium156.0.8078.4, ANGLE/Metal. Ekran60Hz; CSS1440×900, rendererDPR1, framebuffer1440×900, medium. Bu JS çizim ölçümü native Safari, fiziksel presented FPS veya Retina/DPR2 performansı değildir.
- M: canonical20Node/300Pod, görünür8gemi/120Pod. L:50/1500, görünür8/270. Tüm50geminin aynı anda çizildiği iddia edilmez. Su/seyir/kalite/görünürlük ana eşleşmiş koşularda korundu. Ayrı idle koşulu bütün görsel hareketleri kapatır; normal dünya optimizasyonu değildir.
- Ana31hücre08:57:50–10:04:20UTC, **AC**. Üç eşleşmiş blokta30sısınma+60sölçüm; panel sırası dengelendi, `node-0` seçimi hem kapalı hem açık koşulda sabit. Panel, Node Özet sekmesidir; log paneli değildir. Son1200s/20panel işi bu üçlü steady CPU çiftlerinden ayrıdır.
- Dondurulmuş frontend SHA-256 başlangıç `c9f5c8cc1b093fc8ac9f0a4d81f83a12e75fa17a8c3ef4e115a9bf3c6e8c0eba`, aday `e61447de244192dca130675866abf81bc87daa20a7a128ee8534b5c6ae1fe164`. Ham lockfile SHA'ları farklıdır; yalnız ürün sürüm alanları hariç bağımlılık grafiği aynıdır (`6f1b0d74…`). Kaynak, browser, güç ve süreç kimlikleri her manifestte korunur.
- Sentetik tracker→production informer→WebSocket→store→sahne kullanıldı. Gerçek Kubernetes scheduler/Hubble/minikube yükü değildir. Gerçek sağlayıcı işlev kanıtları backend/frontend raporlarında ayrıdır; bu tabloda collector maliyeti veya enerji tasarrufu ölçülmedi.
- Yalnız dört sabit kimlikli owned lab container'ı ve bu görevin gateway/forward'ı durduruldu. Kullanıcının diğer projeleri/container'ları kapatılmadı. Diğer proje yükünün tamamen sıfır olduğu iddia edilmez. Normal CPU koşularında video, React profiling ve ağır trace kapalıdır.

## Ana AC sonuçları

Ham runner alanındaki `optimized`, final aday fazının teknik adıdır; CPU kazancı ilanı değildir. CPU çekirdek eşdeğeridir: bütün ilgili browser süreçlerinin CPU zamanı / gerçek ölçüm süresi. Aşağıdaki değerler medyan[min–max], n=3; long n=1. RSS en büyük tek browser PID'sidir, toplam fiziksel RAM değildir.

| Senaryo | Önce browser CPU | Sonra browser CPU | Aday JS çizim/sn; p95/p99 ms | Aday Go CPU | Önce→sonra en büyük PID RSS MiB | Karar |
|---|---:|---:|---|---:|---:|---|
| M seçili Node, panel kapalı | .42454[.34577–.43220] | .43036[.36226–.44309] | 60.0027;17.6/18.0 | .00150 | 328.48→325.05 | Kare bütçesi geçti; CPU kazancı iddiası yok |
| M aynı Node, Özet açık | .38237[.31055–.40043] | .39759[.33067–.40318] | 60.0000;17.5/17.8 | .00166 | 344.38→360.34 | Aralıklar örtüşüyor; signed panel farkı aşağıda |
| M motion-off idle | .00433[.00333–.00682] | .00399[.00333–.00449] | yaklaşık1çizim/60s; aralık N/A | .00116 | 243.77→244.72 | Idle doğrulandı; normal dünya ile aynı iş değildir |
| L seçimsiz yaşayan dünya | .39292[.37406–.45679] | .47515[.46681–.47808] | 59.9919;17.8/18.3 | .00150 | 346.34→291.47 | Ham CPU artışı incelenmeli; ilk çiftlerde fiili çizim yükü farklı |
| M normal+burst olay, yalnız aday | — | .52028[.51431–.52154] | 59.9986;18.6/19.0 | .00830 | —→338.55 | Üç koşuda planlanan/alınan1250olay ve tam içerik geçti |
| S etkileşim, yalnız aday | — | .52453[.52423–.52786] | 60.0009;18.6/18.9 | .00166 | —→368.02 | DOM/rAF proxy p957.4/16.1ms; fiziksel sunum değildir |
| M1200s karma, yalnız aday | — | .49450 | 60.0005;18.7/21.0 | .00722 | —→435.72 | Tek uzun koşu; detaylı envanter overhead'i dahil |

`Δpanel=açık−kapalı`, aynı blok ve seçili UID içinde hesaplanır. Önce/sonra sırasıyla:

| Blok | Önce Δpanel | Sonra Δpanel |
|---|---:|---:|
|0|−.03522|−.03159|
|1|−.02411|−.03991|
|2|−.04983|−.03277|

Negatif farklar korunur; panelin nedensel maliyeti matematiksel olarak pozitif yapılmaz. Örtülme/compositing ve koşu değişkenliği etkileyebilir; bunların payı ölçülmüş değildir. İki sürümde panel-açık toplam CPU farkı, paneli açmanın maliyetiyle karıştırılmaz. JS heap snapshot medyanı kapalı28.99→29.34MiB, açık29.79→28.72MiB; bir GC fazı veya tek son değer retained bellek/leak ölçümü değildir.

## L tanılaması ve sonlu ek deney

AC ilk iki L çiftinde baseline çizim çağrısı/üçgen p50 değerleri426/74870 ve439/75200, aday448/75574; üçüncü çiftte448/75574 eşittir. Toplam CPU farkları+.09275,+.08516,+.01836çekirdek. Renderer ve GPU-process CPU bileşenleri birlikte değişir; browser main/Go bu büyük farkı açıklamaz. GPU-process CPU, GPU kullanım yüzdesi değildir.

Somut soru için yalnız iki ek çift çalıştırıldı: `v11-l-controlled-battery-20261109`, dört hücre,30s+60s, blok3optimized→baseline ve blok4baseline→optimized. Güç pil olduğundan ana AC n=3 ile birleştirilmez. Bu protokol `panel-closed --panel-matrix` ile aynı seçimi ve filo başlangıç fazını sabitler; seçimsiz `living` ile aynı senaryo değildir. Dört koşulda p50çağrı/üçgen450/75574 ve p95454/75784, başlangıç kamera/filo eşittir. Blok3 CPU.39170→.39417 (Δ+.00247,%0.63); blok4 .38568→.39181 (Δ+.00613,%1.59). Yaklaşık60JSçizim/sn korunur.

Bu kontrollü pil koşullarında büyük artış yeniden üretilmedi; AC'nin nedenselliği veya bütün profillerin regresyonsuzluğu otomatik kanıtlanmış değildir. Ayrıntılı [L analizi](../backend/l-cpu-review.md) nihai yorumun sınırlarını kaydeder. Ek kuyruk ana kuyruğun `order` açıklamasını kopyalamıştır; o metindeki “three paired blocks” yanlıştır. Gerçek dört job, repeat3/4 ve zamanlar iki çifti açıkça gösterir. Ham metadata bu açıklama nedeniyle değiştirilmez.

## Yirmi dakika, tam içerik ve cleanup

1200106.9ms,72007JSçizim; en büyük kare aralığı29.3ms,50msüstüboşluk0,LongTask0,hata0. Üretici5600plan/5600uygulama; callback5567 (reconnect sırasında snapshot uzlaştırması vardır). Bütün5600olayın ayrı ayrı browser callback'i olduğu iddia edilmez. Son canonical içerik imzası upstream ve planla tam eşittir; yalnız adet karşılaştırması değildir. Üç reconnect,329informerresync,40/40quiescentcheckpoint.

20/20panel çevrimi,24/24log isteği kapanışı, kalan log0. Checkpoint'te tek WS ve yeniden açık tek log bulunur. Materyal40–44 ve tekrar40; GPUgeometri33–43 ve tekrar35,texture3,program20–21. Nesne367–383 ve tekrar367. Listener1048'e tekrar döner; geçici2744/DOM1980 reconnect zirvesi sonrasında1048/526'ya iner. Son1179listener/531DOM farklı aktif portal durumudur, aynı çalışma kümesi gibi karşılaştırılmaz. Interval1,timeout1–3,MutationObserver2,ResizeObserver1 aralıkları sabit kaldı. JS heap18.1–85.8MiB arasında GC döngüleriyle salınır; son36.47MiB. Bu gözlemde sınırsız artış görülmedi; genel leak veya fiziksel RAM garantisi değildir.

Normal/burst callback→store p95 yaklaşık.6ms; callback→draw proxy16.7–18.3ms. Bunlar Kubernetes algılama gecikmesi veya fiziksel ekran sunumu değildir. Ayrı20pointer/readback tanılamasında PNG başlık üst sınırı p9559.57ms; close-button actionability trial üst sınırı86.48ms. Bütün yatay sekmelerin veya her kontrolün kullanılabilirliği bu tek ölçümden çıkarılamaz. `physicalPresentedLatencyMs=null`.

Gerçek OS minimize ile `document.hidden=true`60001ms,0çizim ve sabit su zamanı; canonical eşitlik korundu, dönüş rota farkı9.59<18 oldu. Gizli sekme için CPU0 iddiası yoktur. [Ayrı hidden sözleşmesi](visibility-contract.json).

## Tekrar üretim ve ham kanıt

Mevcut harness kullanılır; yeni sonsuz benchmark sistemi yoktur:

```sh
node benchmarks/repair-session.mjs NEW_UNIQUE_RUN_ID v11-start-2b76e21 v11-final-32a0468 --suite v11
node benchmarks/repair-report.mjs NEW_UNIQUE_RUN_ID
```

İlk komut frozen source/build'leri doğrular ve tek sonlu31hücre kuyruğunu seri çalıştırır; bu tag'lerin yerel `benchmarks/.build` dosyaları ayrıca hazırlanmış olmalıdır. Mevcut sonuç ID'si üzerine yazmayın. `--suite v11` üçlü panel/idle/L, olay/etkileşim ve tek1200s uzun işi seçer. Source/build/browser/güç eşleşmiyorsa durur; canlı kümeye mutation yapmaz. Frozen binary'ler repoya konmaz; provenance kaydıyla yeniden oluşturulur.

[Ham manifest ve SHA listesi](raw-measurements-manifest.json), [sıkıştırılmış141hamdosya](raw-measurements.tar.gz), [AC karşılaştırması](comparison-ac.json). Arşiv repo kökünden `tar -xzf artifacts/v1.1.0/v11-20261108/performance/raw-measurements.tar.gz` ile özgün `benchmarks/results/...` yollarına açılır; mevcut aynı adlı sonuçlar varsa ayrı dizine açın. Redundant long-chunk alt parçaları hariç tam uzun raw/checkpoint/process dosyaları korunmuştur. Arşiv credential, binary, dependency cache veya gerçek kullanıcı logu içermez.

## Ayrı iki kısa JS tanılaması

`v11-l-js-diagnostic-20261109-{baseline,optimized}` yalnız somut JS/caption hipotezini daraltmak için mevcut runner'ın `--profile-cpu --scene-inventory --capture-start` seçenekleriyle çalıştı:30sısınma+15sörnek, her faz1kez, ağırprofiler=true/smoke=true. Bu iki kısa koşu ana31AC veya4pilCPU karşılaştırmasına eklenmez ve kabul tekrarı değildir. İki başlangıç PNG'si root tarafından açıldı; aynı446çağrı/75492üçgen,408nesne/56reachablegeometri/50materyal veGPU51geometri gözlendi.

Yeni captionPosition minified `v1` iki örnekte toplam2.931ms olarak eşlendi; yaklaşık15.160sprofil penceresinin%.019'u. Bu örneklenmiş JS payı toplam makineCPU yüzdesi değildir; örneklenmeyen maliyet0sayılamaz. JSsubmitmedyan/p95baseline2.0/2.7→aday1.8/2.4ms oldu. JS/three örnekleri artışı açıklamadı; native renderer/GPUprocess kapsam dışı. **CPUkapısı açık kalır.** [İnceleme](../backend/l-js-diagnostic-review.md), [hamprofiller+PNG arşivi](js-diagnostics.tar.gz), [SHAmanifesti](js-diagnostics-manifest.json). Yeni uzunmatris/soak veya otomatiktekrar yapılmadı.

Ham comparison.json içindeki genel eski “new visual effects add work” notu bu v1.1 CPU farkının kanıtlanmış nedeni değildir. Yeni adayda bağlantı/güvenlik ve captionlayout değişiklikleri var; nedenselliği ölçülmeden özellik maliyeti diye atanmaz.
