# 12 Kasım 2026 — dengeli panel CPU matrisi

Durum: **GUARD_DATA_EVIDENCE_PASS; SAYISAL KONTROL PASS; RENDER_COMPARABILITY_UNRESOLVED**.
Bu kayıt genel yayın veya V11-18 kabulü değildir. Ürün optimizasyonu uygulanmadı.

2026-11-12 21:43:45–22:45:02 Europe/Istanbul;3677.400941 saniye,
önceden belirlenmiş4500 saniye sınırında. Beş blok, AB/BA/AB/BA/AB kaynak sırası,
her kaynakta dört koşul,40 pencere. Her pencerede30 saniye ısınma+60 saniye ölçüm.
Tekrar, iyi örnek seçimi, başarısız pencere çıkarma veya eşik düşürme yapılmadı.

## Kaynak, ortam ve kapsam

A frontend36d5b8f90c8afdec437bdb6e5516541b5bb859bd/indexf682f574…;
B frontendf32d6b2345c0e9fcf350b83ec9a5e9d3fc651e12/index0e478e0c…;
ortak sabit test backend9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8.
Çağrı/harness checkpoint7c9e9ffb3dd132775be7cc4953266eaef08d651e'dir;
bu kimlik frozen frontend kaynak kimliği yerine kullanılmaz.
[Frozen build zinciri](../perf-matching-build-worker/frozen-build-manifests.json),
[plan](plan.json), [gerçek ön kontrol](preflight.json), [yürütme kaydı](execution.json).

MacBook Air M5/10çekirdek/32GiB,macOS27.0.1,Chromium156.0.8078.4/ANGLE Metal,
1440×900 CSS ve framebuffer,rendererDPR1,medium,gölgeler/deniz/seyir açık,
FPS sınırı/adaptive kalite kapalı. Kontrollü M referans kamerasıFOV38; ürünün
varsayılan24 derecelik kamerası değiştirilmedi. Native CG60Hz kaydı emüleDPR1'i
native Retina veya fiziksel presentedFPS ölçümü yapmaz.

Sentetik M20Node/300Pod canonical,başlangıç ayrıntılı8gemi/120Pod; tek liman.
Fixture→gerçek Go informer/WS→store/sahne yolu kullanıldı; gerçek Kubernetes,
Hubble veya yeni worker sağlayıcı yükü değildir. Gerçek owned lab durduruldu;
diğer test workerları ölçüm boyunca idle kaldı. Ağır build/tarama/video/profiler yok.
Battery53→43%,371güç kaydı aynı kaynak/pmsetSHA/lowpower0. Frekans/ısı/enerji
ölçülmedi; pil iyileşmesi iddiası yok.

Node0/worker-001 Özet sekmesi; kapalı koşul aynıUID/seçim/outline/kamera/canvas'ı
korur. [Normal UI open-close-reopen kanıtı](../perf-panel-transition-worker/REPORT.md)
ve [Root görsel sınırı](../perf-panel-transition-worker/ROOT_VISUAL_REVIEW.md) ayrıdır.
Panel kapanınca daha çok dünya/etiket görünür; doğal panel maliyeti bu
compositing/örtülme farkını da içerir. Piksel eşdeğer içerik olduğu söylenmez.

## Toplam browser CPU — çekirdek eşdeğeri

Medyan[min,max],n=5/koşul/kaynak. Eşleşmiş farkların medyanı,
medyanların farkıyla aynı istatistik değildir.

| Koşul | A | B | Eşleşmiş B−A | Eşleşmiş B−A,% |
|---|---|---|---|---|
| panel-closed | 0.621209 [0.607889, 0.629050] | 0.622154 [0.606136, 0.698428] | 0.002764 [-0.022914, 0.077219] | 0.446235 [-3.642603, 12.430465] |
| panel-open | 0.633715 [0.619278, 0.637350] | 0.622300 [0.615433, 0.702130] | -0.005026 [-0.018282, 0.064780] | -0.801198 [-2.884868, 10.163999] |
| panel-closed-events | 0.675716 [0.628697, 0.689483] | 0.615717 [0.602924, 0.682483] | -0.026199 [-0.070828, 0.006767] | -4.164374 [-10.316581, 1.001402] |
| panel-open-events | 0.670831 [0.634438, 0.696627] | 0.682215 [0.637502, 0.704686] | -0.007992 [-0.014333, 0.070248] | -1.147193 [-2.136648, 11.072508] |

## Panelin işaretli ek maliyeti

Her blokta Δpanel=açık−kapalı; sonra aynı blokta ΔB−ΔA.
Negatif farklar korunur; sıfıra veya pozitif maliyete zorlanmaz.

| Olay hızı | A Δpanel,çekirdek | B Δpanel,çekirdek | Eşleşmiş ΔB−ΔA,çekirdek |
|---|---|---|---|
| 0/s | 0.011389 [-0.001724, 0.016141] | 0.003702 [-0.000789, 0.016164] | -0.001524 [-0.016225, 0.017888] |
| 5/s | 0.010467 [-0.055045, 0.042134] | 0.044199 [-0.000268, 0.080444] | 0.013225 [-0.010735, 0.135490] |

ToplamCPU çiftlerinin işaretleri ve aralıkları karışıktır; bütün koşullarda
tekrarlanabilir genel kazanç veya genelCPUgerilemesi sonucu çıkarılmadı.
Özellikle5/s panel farkı B'de daha yüksektir; geniş dağılım ve son blokta
iki kaynakta da değişen renderer/GPU-processCPU değerleri ayrıca incelenecek.
Bunu frekans/ısı/GC/noise diye açıklamak için kanıt yoktur. Önceden belirlenmiş
+5% pratik medyan eşiğini aşmamak bütün bellek/iş yükü kapılarını kapatmaz.
Eski25Ekim0.413/0.551 değerleriyle veya önceki açık-only/protokol4 ailesiyle
havuzlama yapılmadı. Tarihsel yaklaşık33% fark burada paneli açmanın maliyeti sayılmaz.

## Veri, akıcılık ve süreç denetimi

40/40 pencere mevcut validator M bütçesini geçti: JSdraw59.991209–60.030065/sn,
en yüksek pencerep95=19.1ms,p99=21.9ms. Bunlar JS submit/çizim aralıklarıdır,
fiziksel ekran FPS'i değildir. Olaylı20pencerede300'er plan/apply/receive,
toplam6000; olay olmayan20pencerede0/0/0 ve gecikme n0/null.
Callback→store pencerep95 medyanları0.8–0.9ms; görünür UID alt kümesinin
callback→draw proxy'si14.2–18.3ms. Fiziksel ekran veya bütün panelin kullanılabilir
olma gecikmesi değildir; bu test panel açılışını ölçmez.

Client/upstream/planned tam iç içe canonical karşılaştırmalarının40 canlı
verdict'i true. Kanıtlar ayrı final nesne payload dump'ını içermediğinden ikinci
inceleme bunun bağımsız payload karşılaştırması yapıldığı anlamına gelmez.
Bütün ara OS örneklerinde gözlenen süreç cohort/clock kontrolleri geçti.
PID+doğum+PPID/executable/rol kullanılır; macOS doğum çözünürlüğü1s ve örnekler
arasında bütünüyle doğup ölen/gözlenmeden orphan olan child kör noktası açıktır.
Yalnız başlangıç/son PID farkından eksik CPU'ya sıfır verilmedi.

247 yakalanmış süreç kimliği yok,5192 portu boş,14 mühürlü kaynak SHA'sı ve
commonbackend değişmedi.3455 safety örneğinde owned browser süreçlerinin toplam
RSS örnek maksimumu1361.3125MiB,backend51.109375MiB; bunlar kesin fiziksel RAM
veya zamanın her anını kapsayan maksimum değildir. [Cleanup/güç kaydı](execution.json).

## Açık bellek ve çizim kapsamı gözlemi

Önceki açık-only ailede B renderer sonRSS5/5 artmıştı. Bu dengeli ailede açık0/s
sonRSS eşleşmiş fark medyanı+27.28125MiB,min−5.40625,max+34.1875;
açık5/s +21.078125MiB,min−37.078125,max+31.0625. JSusedheap işaretleri karışıktır.
Süreç sonRSS,retainedheap,leak veya toplam fizikselRAM değildir.
[Sonlu mekanizma tanısı planı](../perf-memory-mechanism-plan-root/PLAN.md)
henüz çalıştırılmadı; CAT17 açık.

Root bütün pencere envanterini ayrıca okudu: başlangıçların çoğu426call/71170tri/
60line/32geometry/4texture; bazı B pencerelerinde33geometry ve p3-B açık5/s
başlangıcında427call/72line var. Aynı blok/koşul A/B soncall/line değerleri eşit,
fakat p0B/p3B'de+1geometry tutuluyor. Kimlik/kaynak nedeni kanıtlanmadan bu
farkın hover/outline,cache veya önemsiz noise olduğu söylenmez. İkinci incelemede p3-B açık5/s rawframe calls dağılımındaki+1 farkın ölçüm
penceresine taşındığı görüldü: ilk iki frame435vs434, sonraki12frame445vs444.
Triangle dağılımı aynı, ancak rawframe line/nesneUUID kaydı yok. Tek karelik
kurulum farkı veya belirli bir hover/outline nedeni kanıtlanmadı. Mevcut reset
fleet/clock/water sıfırlar; tam hover/sceneallocation reconciliation kanıtı yok. Kaynak kaybetme,
kalite düşürme veya batching kazancı iddiası yok. Bu açık konu nedeniyle40 pencere
kaydedildi diye görsel iş yükü eşdeğerliği otomatik kabul edilmedi.

## Bütün ölçütler

CPU: çekirdek eşdeğeri; RSS/heap:MiB; frame/callback:ms;draw:JSçizim/sn.
GPU-processCPU gerçek GPU kullanım yüzdesi veya GPU süresi değildir. BackendCPU
fake tracker/producer'ı içerir;0event hücrelerde OS sayaç çözünürlüğünde gözlenen0,
backend'in hiç iş yapmadığının kanıtı değildir. Ölçülmeyen ağ byte/enerji/GPUtime N/A.

| Koşul | Ölçüt | A medyan[min,max] | B medyan[min,max] | Eşleşmiş B−A medyan[min,max] |
|---|---|---|---|---|
| panel-closed | browserCores | 0.621209 [0.607889, 0.629050] | 0.622154 [0.606136, 0.698428] | 0.002764 [-0.022914, 0.077219] |
| panel-closed | rendererCores | 0.365217 [0.356056, 0.369502] | 0.364017 [0.347195, 0.404633] | -0.001200 [-0.020997, 0.044671] |
| panel-closed | gpuProcessCores | 0.257638 [0.250004, 0.259419] | 0.255409 [0.250299, 0.291635] | 0.003964 [-0.008565, 0.032216] |
| panel-closed | browserMainCores | 0.001495 [0.001330, 0.001662] | 0.001330 [0.001329, 0.008310] | -0.000000 [-0.000332, 0.006815] |
| panel-closed | backendFixtureCores | 0.000000 [0.000000, 0.000000] | 0.000000 [0.000000, 0.000166] | 0.000000 [0.000000, 0.000166] |
| panel-closed | maxSingleBrowserProcessEndRSSMiB | 324.390625 [319.671875, 400.250000] | 323.453125 [317.843750, 404.406250] | 3.781250 [-82.406250, 78.187500] |
| panel-closed | backendProcessEndRSSMiB | 45.953125 [45.343750, 46.625000] | 45.859375 [45.093750, 46.937500] | 0.062500 [-1.531250, 1.375000] |
| panel-closed | pageJSHeapEndUsedMiB | 25.986302 [24.735065, 98.604643] | 33.745582 [22.583308, 101.498630] | 4.085932 [-64.859061, 75.512327] |
| panel-closed | jsDrawsPerSecond | 60.012355 [60.004796, 60.024110] | 60.007559 [60.005161, 60.027508] | -0.001898 [-0.004796, 0.011355] |
| panel-closed | windowFrameP95Ms | 18.100000 [17.500000, 18.600000] | 18.300000 [17.600000, 18.600000] | -0.300000 [-0.500000, 1.100000] |
| panel-closed | windowFrameP99Ms | 18.700000 [17.800000, 19.000000] | 18.700000 [17.800000, 18.900000] | -0.300000 [-0.900000, 1.100000] |
| panel-closed | windowCallbackStoreP95Ms | N/A [N/A, N/A] | N/A [N/A, N/A] | N/A [N/A, N/A] |
| panel-closed | windowVisibleDrawProxyP95Ms | N/A [N/A, N/A] | N/A [N/A, N/A] | N/A [N/A, N/A] |
| panel-open | browserCores | 0.633715 [0.619278, 0.637350] | 0.622300 [0.615433, 0.702130] | -0.005026 [-0.018282, 0.064780] |
| panel-open | rendererCores | 0.375276 [0.366216, 0.375929] | 0.368598 [0.357594, 0.419783] | -0.007146 [-0.015712, 0.043854] |
| panel-open | gpuProcessCores | 0.256777 [0.251732, 0.259926] | 0.253287 [0.246427, 0.281018] | -0.003490 [-0.006315, 0.021093] |
| panel-open | browserMainCores | 0.001329 [0.001163, 0.001330] | 0.001329 [0.001163, 0.018112] | 0.000000 [-0.000166, 0.016949] |
| panel-open | backendFixtureCores | 0.000000 [0.000000, 0.000166] | 0.000000 [0.000000, 0.000166] | 0.000000 [0.000000, 0.000000] |
| panel-open | maxSingleBrowserProcessEndRSSMiB | 340.968750 [315.781250, 344.218750] | 349.875000 [335.562500, 378.406250] | 27.281250 [-5.406250, 34.187500] |
| panel-open | backendProcessEndRSSMiB | 45.671875 [45.312500, 46.390625] | 45.937500 [44.765625, 46.250000] | 0.578125 [-1.546875, 0.671875] |
| panel-open | pageJSHeapEndUsedMiB | 26.209061 [20.220047, 32.341960] | 26.698915 [24.721832, 29.241996] | -0.690162 [-5.643045, 7.140313] |
| panel-open | jsDrawsPerSecond | 60.007459 [60.004062, 60.017153] | 60.026008 [60.012955, 60.028207] | 0.011055 [0.008893, 0.020548] |
| panel-open | windowFrameP95Ms | 18.600000 [17.700000, 18.600000] | 18.000000 [17.500000, 18.700000] | -0.600000 [-1.100000, 0.800000] |
| panel-open | windowFrameP99Ms | 18.900000 [17.900000, 19.000000] | 18.700000 [17.700000, 19.000000] | -0.200000 [-1.300000, 0.900000] |
| panel-open | windowCallbackStoreP95Ms | N/A [N/A, N/A] | N/A [N/A, N/A] | N/A [N/A, N/A] |
| panel-open | windowVisibleDrawProxyP95Ms | N/A [N/A, N/A] | N/A [N/A, N/A] | N/A [N/A, N/A] |
| panel-closed-events | browserCores | 0.675716 [0.628697, 0.689483] | 0.615717 [0.602924, 0.682483] | -0.026199 [-0.070828, 0.006767] |
| panel-closed-events | rendererCores | 0.424171 [0.395487, 0.431728] | 0.386609 [0.377970, 0.431287] | -0.017517 [-0.045119, 0.007116] |
| panel-closed-events | gpuProcessCores | 0.247558 [0.229282, 0.255026] | 0.225619 [0.221632, 0.246877] | -0.008515 [-0.025544, -0.000681] |
| panel-closed-events | browserMainCores | 0.002658 [0.002493, 0.002991] | 0.002658 [0.002492, 0.003323] | 0.000000 [-0.000332, 0.000665] |
| panel-closed-events | backendFixtureCores | 0.003323 [0.003157, 0.003488] | 0.003157 [0.003157, 0.003489] | 0.000000 [-0.000332, 0.000166] |
| panel-closed-events | maxSingleBrowserProcessEndRSSMiB | 362.968750 [360.343750, 376.765625] | 369.625000 [357.437500, 380.359375] | 3.593750 [-2.906250, 8.937500] |
| panel-closed-events | backendProcessEndRSSMiB | 50.234375 [48.843750, 50.312500] | 50.203125 [49.375000, 50.687500] | -0.109375 [-0.859375, 1.843750] |
| panel-closed-events | pageJSHeapEndUsedMiB | 28.175704 [22.681362, 47.465332] | 25.678864 [24.137430, 41.821536] | -3.736463 [-23.327902, 19.140174] |
| panel-closed-events | jsDrawsPerSecond | 60.010857 [60.004062, 60.020312] | 60.007759 [59.991209, 60.028707] | -0.004160 [-0.029103, 0.024645] |
| panel-closed-events | windowFrameP95Ms | 18.700000 [17.800000, 19.100000] | 17.900000 [17.700000, 18.700000] | -0.500000 [-1.400000, 0.100000] |
| panel-closed-events | windowFrameP99Ms | 19.200000 [18.900000, 21.900000] | 19.100000 [18.000000, 19.800000] | -0.300000 [-2.600000, 0.000000] |
| panel-closed-events | windowCallbackStoreP95Ms | 0.900000 [0.800000, 0.900000] | 0.800000 [0.700000, 0.900000] | -0.100000 [-0.100000, 0.000000] |
| panel-closed-events | windowVisibleDrawProxyP95Ms | 15.700000 [14.100000, 23.200000] | 14.200000 [13.100000, 20.000000] | -1.300000 [-10.100000, 5.900000] |
| panel-open-events | browserCores | 0.670831 [0.634438, 0.696627] | 0.682215 [0.637502, 0.704686] | -0.007992 [-0.014333, 0.070248] |
| panel-open-events | rendererCores | 0.423464 [0.396711, 0.439608] | 0.427382 [0.399914, 0.445537] | -0.006262 [-0.012531, 0.048826] |
| panel-open-events | gpuProcessCores | 0.243214 [0.233740, 0.252368] | 0.244527 [0.233601, 0.254332] | -0.005025 [-0.007375, 0.020591] |
| panel-open-events | browserMainCores | 0.002990 [0.002824, 0.003323] | 0.002991 [0.002825, 0.009135] | 0.000001 [-0.000166, 0.006152] |
| panel-open-events | backendFixtureCores | 0.003323 [0.002990, 0.003489] | 0.003157 [0.003156, 0.003489] | 0.000001 [-0.000332, 0.000498] |
| panel-open-events | maxSingleBrowserProcessEndRSSMiB | 395.875000 [360.437500, 411.281250] | 398.718750 [374.203125, 416.953125] | 21.078125 [-37.078125, 31.062500] |
| panel-open-events | backendProcessEndRSSMiB | 49.406250 [48.515625, 50.484375] | 49.921875 [48.500000, 50.609375] | 0.140625 [-0.671875, 1.171875] |
| panel-open-events | pageJSHeapEndUsedMiB | 43.236139 [21.847721, 43.470509] | 34.130716 [24.351456, 43.579412] | -9.105423 [-19.022399, 19.543563] |
| panel-open-events | jsDrawsPerSecond | 60.015416 [60.004162, 60.023110] | 60.021111 [60.014092, 60.030065] | 0.009929 [-0.001999, 0.015251] |
| panel-open-events | windowFrameP95Ms | 18.600000 [17.900000, 18.700000] | 17.800000 [17.600000, 18.600000] | -0.800000 [-1.000000, 0.300000] |
| panel-open-events | windowFrameP99Ms | 19.200000 [18.900000, 19.300000] | 18.800000 [18.000000, 20.000000] | -0.400000 [-1.000000, 0.700000] |
| panel-open-events | windowCallbackStoreP95Ms | 0.900000 [0.700000, 0.900000] | 0.800000 [0.700000, 0.900000] | -0.100000 [-0.100000, 0.200000] |
| panel-open-events | windowVisibleDrawProxyP95Ms | 17.400000 [14.600000, 23.800000] | 18.300000 [15.000000, 20.600000] | 0.200000 [-5.500000, 5.200000] |

## Kanıt ve tekrar üretim

[Makine okunur40cell/dağılım/Δpanel](balanced-summary.json),
[mevcut comparator sonuçları](reduction.stdout),
[70 JSON gzip arşivinin SHA ve round-trip indeksi](RAW_INDEX.json),
[normal UI/kamera kanıtı](../perf-panel-transition-worker/REPORT.md),
[zero-event canonical sözleşmesi](../perf-zero-event-contract-root/REPORT.md).
24,481,650 özgün JSON byte,1,604,492 gzip byte. İlk arşiv yardımcısının yanlış
uzantı filtresi0dosya seçti; [ilk kayıt](RAW_INDEX-initial-zero-files.json) başarı
kanıtı değildir. `archive.py` exact70adı/JSONparse/byteequal/decompress ve nooverwrite
kontrolüyle düzeltildi; hiçbir ölçüm yeniden koşulmadı.

Her gerçek CLI argv/cwd,runid ve30+60 planı execution.json içindedir.
`--reuse-build --reuse-binary` yalnız yerelde exactSHA ile doğrulanan frozen
A/B ve commonbackend varsa kullanılır. Mevcut kaynağı derleyip eski A etiketi
verilmez. Yeni ölçüm için ayrı NEW run klasörü/ön kontrol gerekir;
`run.py` bu klasörde tekrar başlatmayı supervisor/execution varlığında reddeder.
Eski arşivlenmiş thincontrollerlar güvenli re-entry için kullanılmaz.

Offline `reduce.mjs` tamamlanmış10job/40cell ve mühürlü kaynaklar ister;
var olan balanced-summary.json'u ezmez. Kaydedilmiş sayıları yeniden incelemek
için raw JSON'ları RAW_INDEX checksum ve decompress ile doğrulayın, sonra ayrı
çıktıda aynı reducer/independent reviewer yöntemini kullanın. Yeni app/browser
koşusu gerekli değildir. Remote CI7c9e9ffb[run43282744627](https://github.com/yunusemre274/KubeView/actions/runs/43282744627)
başarılıdır; [adım kaydı](CI_7c9e9ffb.json) final paket/provider kabulünü kanıtlamaz.

[Sayısal ikinci inceleme](../perf-balanced-numeric-review-worker/REPORT.md)40pencere,
480araörnek ve4.786sayısal alanı yeniden hesapladı; en büyük fark3.55e−14.
[Kanıt/kapsam incelemesi](../perf-balanced-evidence-review-worker/REPORT.md)
70arşivi ve129SHAyı doğruladı; çizim eşdeğerliğini açık bıraktı.
Mevcut otomatik comparator yalnız kendi guard evreninde comparable=true verir;
bu alan bu ek incelemenin yerine geçmez. BENCH-RENDER-001 nedeniyle bu aile
CPU iyileşmesi/gerilemesi veya nedenselΔpanel kabulü olarak kullanılmıyor.
247kimlik yokluğu ve execution.finishedAt gerçektir; progress.json tarihi
RUNNING etiketi final karar değildir. Final inceleme ACCEPTANCE.json içindedir.
Sıradaki en küçük iş: yeni kısa diagnostikte render edilen nesne/geometry/material
kimliği ve hover/reset yolunu yakalamak; bu aşamada otomatik60dk tekrar yok. Aynı ajan sisteminin incelemesi,
profesyonel bağımsız üçüncü taraf denetim değildir. V11-16 fizikselUI,V11-18 geniş
CPU/fullruntime,diğerM/L/çoklu-liman/log/flow/idle aileleri,continuous60dk/nativeSafari/
Retina/finalpaket/manual kabul ve genel NOT_RELEASE_READY durumu açık.
