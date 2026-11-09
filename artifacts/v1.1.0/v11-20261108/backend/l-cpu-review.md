# L CPU incelemesi: AC ve pil deneyleri ayrı

**Büyük +%20,93 CPU farkı kontrollü pil deneyinde yeniden üretilmedi. İlk AC gözleminin nedeni açıklanamadığı için zorunlu “anlamlı açıklanamayan regresyon yok” CPU kapısını BLOCKED bırakmayı öneriyorum.** Bu bulgu doğrulanmış bir +%21 kaynak regresyonu hükmü de değildir.

Özgün 31 hücrelik AC koşusunda L/living için 3 çift; ayrı pil deneyinde yalnız 4 hücre / 2 çift, blok 3 ve 4 vardır. Pil kuyruğundaki “three paired blocks” açıklaması kalıtılmış metindir; gerçek jobs/expectedCells iki çift gösterir. İki deney n=5 olarak birleştirilmedi. Pil deneyinde panel-closed matrix setup node0 seçip paneli kapatır ve warmup sonrası resetVisual çağırır; özgün living koşusu bu reseti yapmaz. Güç ve setup farkı nedeniyle AC/pil mutlak CPU değerlerinden verimlilik sonucu çıkarılamaz.

| Deney | Browser CPU, core | Fark | Renderer farkı | GPU process farkı | Calls p50 B→C | Triangles p50 B→C | Geometry önce→sonra, B / C |
|---|---:|---:|---:|---:|---:|---:|---|
| AC b0 | 0.37406 → 0.46681 | +0.09275 / +24.79% | +0.05658 | +0.03767 | 426 → 448 | 74870 → 75574 | 30→30 / 51→51 |
| AC b1 | 0.39292 → 0.47808 | +0.08516 / +21.67% | +0.06625 | +0.02872 | 439 → 448 | 75200 → 75574 | 51→32 / 51→51 |
| AC b2 | 0.45679 → 0.47515 | +0.01836 / +4.02% | +0.01551 | +0.00286 | 448 → 448 | 75574 → 75574 | 51→51 / 51→51 |
| Pil b3 | 0.39170 → 0.39417 | +0.00247 / +0.63% | +0.00248 | −0.00034 | 450 → 450 | 75574 → 75574 | 52→52 / 52→52 |
| Pil b4 | 0.38568 → 0.39181 | +0.00613 / +1.59% | +0.00015 | +0.00581 | 450 → 450 | 75574 → 75574 | 52→52 / 52→52 |

AC browser CPU medyanı 0.392919 → 0.475153 core (+20.93%). Fark renderer ve GPU process CPU'sundadır; browser main b0/b1'de azalır. Backend farkı yaklaşık ±0.00033 core. GPU process CPU, gerçek GPU kullanım yüzdesi değildir. On L hücresinde süreç kapsamı tam, churn yok ve yaklaşık 60 JS draw/sn korunur; fiziksel sunulan FPS ölçülmemiştir.

İlk iki AC çiftinde gerçek render yükü aynı değildir. b0 baseline daha az geometry ve draw call içerir; b1'de geometry sayısı ölçüm boyunca 51→32 değişir. b2 calls/triangles dağılımı ve 51 geometry ile daha yakın eşleşir fakat +4.02% CPU ve JS submit p50 2.4→2.6 ms farkı sürer. Başlangıç filo pozları biraz farklıdır. Bu nedenle formal valid=true, bütün karelerde aynı gerçek işi yaptıklarının kanıtı değildir; finite geometry/DOM/heap farklarının tam nesne nedeni kaydedilmemiştir.

Pil çiftlerinde başlangıç filo pozu, kamera, DPR1, medium kalite, 1440×900 viewport, canonical 50/1500 ve visible 8/270 eşittir. Calls/triangles dağılımları, 52 geometry ve 31 line iki fazda eşleşir. Süreler yaklaşık 60.04 s, 3602–3603 frame; son filo pozları süre farklarıyla çok az ayrışır. JS submit p50/p95 b3 için 2.0/2.4→2.0/2.5 ms; b4 için 2.0/2.5→2.1/2.5 ms. +0.63% ve +1.59% bu protokolde gözlenen farklardır; sıfır maliyet veya genel AC temizliği kanıtı sayılmaz.

Kaynakta HarborScene, Ocean, assets, fleet/layout ve visual coordinator byte eşittir; tüm uygulama eşit değildir. LifecycleEffects/MeasuredTraffic caption yerleşimi, yeni captions.js ve App/context/session değişmiştir. Her iki context kaynağı metrics'i 15000 ms aralıkla yeniler. Güncel management reset/diagnostic/scope/abort bootstrap işi meşrudur, fakat ölçümde sürdürülen ek session/metrics işinin CPU farkını açıkladığına dair kanıt yoktur. Tüm L hücrelerinde tek interval, 2→6 interval callback; steady WS mesajı, parse/store callback ve long task 0; backend yaklaşık 0.0013–0.0018 core'dur. Provider poll koşulları live, managementVisible, trafficEnabled, active ve readOnly kapsamıyla sınırlanır. measuredTraffic tüm L hücrelerinde null'dır.

Scene lifecycle sayaçlarında canonical/visible miktarlar sabit, active/queued transfer ve exit ghost 0'dır. containerFaults=53 toplamı, 53 mounted FaultMarker kanıtı değildir. Pil setup'ında başlangıç containerTransitions visualEvents=53→0 iki fazda da vardır; bu da pil setup'ının özgün AC ile aynı finite state olmadığını gösterir. Her hücrede 2 MutationObserver ve 1 ResizeObserver bulunur; AC baseline b1'de MutationObserver callback 12→41, diğer AC adaylarda 12→12, pilde 16→16'dır. Bunlar React commit sayısı değildir. networkDiagnostic=false/network=null ve reactProfilingBuild=false olduğundan boş React alanı ya da rawReactCommits=0, React hiç render etmedi demek değildir.

Caption per-frame/DOM işi, mounted marker varsa kaynakla mümkün bir hipotezdir; atanmış neden değildir. Bundled font ile Lettering/TextGeometry eşzamanlı kurulduğu için async font-download açıklaması bu kaynaklardan desteklenmez. CPU frekansı, thermal, core placement, stack örnekleri, gerçek GPU kullanım oranı ve nesne kimlikleri yoktur; bunlara nedensellik yüklenemez.

M AC panel-closed çift farkları +0.01650, +0.01855, −0.00184 core; panel-open farkları +0.02013, +0.00276, +0.01522 core'dur. Aralıklar örtüşür. Idle medyanı 0.00433→0.00399 core; bu tek başına L için sürekli yeni iş veya donanım nedeni göstermez.

Mevcut raw veriler nedeni çözmez. Ayrı izin verilirse iki kısa baseline/candidate CPU profili JS/DOM/caption çağrı yollarını daraltabilir. Mevcut run.mjs CDP Profiler.start/stop ile sayfa V8 CPU profili alır; GPU process, native renderer/driver veya diğer thread CPU'sunu açıklamaz. Benzer JS profilleri toplam CPU kapısını temizlemez. Bu iki kısa profil yalnız tanı olur, acceptance veya istatistik tekrarı olmaz; özgün AC living state ve gerçek render yükü eşleştirilmelidir. Bu incelemede profil veya yeni benchmark çalıştırılmadı.

**Kabul önerisi:** frame/canonical/process-coverage kanıtını koru; açıklanmayan AC CPU gözlemi nedeniyle zorunlu CPU kapısını BLOCKED bırak. Büyük farkın kontrollü pil koşulunda tekrarlanmaması, AC'ye özgü kaynak regresyonunu dışlamaz. Eski sonuçların tümü ve izinli iki ek çift saklanır; otomatik yeni koşu yoktur.

Kaynak SHA'ları, protokol kayıtları, süreç CPU farkları, frame çeyrekleri ve sayaçlar [l-cpu-review.json](l-cpu-review.json) içindedir.

## Dar FaultMarker hipotezi

Kurulu kilitli three 0.164.1 ile kaynakta kullanılan parametrelerden gerçek geometri oluşturularak hesaplandı: octahedronGeometry(0.65, 0) **8 üçgen**; bundled helvetiker ile “!” TextGeometry (size1, depth0.015, curveSegments2, bevel=false) **56 üçgen**. FaultMarker iki mesh ve her mesh için tek material kullanır; Lettering geometry grupları scalar material'da ek draw oluşturmaz. Görünür ve render'a gönderilen bir marker **2 draw / 64 üçgen**, 11 marker **22 draw / 704 üçgen** demektir. Bu saf geometri hesabı test veya browser koşusu değildir.

AC b0 candidate−baseline farkı p50'de ve aynı frame çeyreklerinde tam **22 draw / 704 üçgen**: bu, 11 ek görünür FaultMarker için güçlü bir footprint eşleşmesidir. Buna karşılık geometry-memory farkı **21**, iki yeni geometry/marker hesabındaki 22'ye bire bir uymaz. Bu allocation sayacı component sayısı değildir. DOM toplamları baseline349→123 ve candidate312→155 olup belge/DOM temizliği de içerir; 11 marker kanıtı vermez. Aggregate containerFaults=53 iki fazda da mounted/visible marker sayısı değildir. Kaydedilmiş named scene/marker/origin inventory yoktur; raw.snapshots yalnız sayısal mesaj sayısıdır.

Origin yolu iki sürümün eşit HarborScene/visualLifecycle/fleet kaynağında aynıdır: effect origin=null başlar, PodCargo frame döngüsünde nonsettled effect ve geçerli cargo position varsa sampleContainerEffect ilk origin'i doldurur. Null fleet pose tek başına kalıcı engel değildir; poz ve pose fallback'leri vardır. FaultMarker görünürlüğü her frame origin/phase üzerinden yeniden hesaplanır; origin bir React closure'ında tek sefer yakalanmaz. Marker listesi ise visible UID/phase/selection/age koşullarıyla React render sırasında hesaplanır. Farklı App/context publish zamanlamasının bu finite marker state'ini etkilemesi mümkündür; mevcut kayıtlar yönü, marker üyeliğini veya adayın ek publish'lerinin baseline'da kalıcı null origin bıraktığını göstermez.

**Sınır:** Bu, b0'daki ek gerçek görsel iş için kaynakla desteklenen somut bir hipotezdir; atanmış neden değildir. Draw/triangle footprint'inden CPU maliyeti hesaplanamaz. Eşleşen draw/triangle dağılımlı b2'nin +4.02% CPU residualını çözmez; CPU kapısı **BLOCKED** kalır. Ayrıntılı hesap ve kaynak SHA'ları JSON addendum'undadır.
