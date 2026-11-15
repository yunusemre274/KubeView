# Kısa L JS tanısı

**Neden çözülmedi; önceki AC CPU kapısı BLOCKED kalır.** Bunlar root tarafından çalıştırılan iki ayrı, profiler=true, pilde 30 s warmup + 15 s L/living tanısıdır. Acceptance tekrarına veya önceki 3 AC / 2 pil çiftine eklenmez. Bu inceleme yalnız mevcut dosyaları okudu.

| Ölçüm | Baseline | Candidate |
|---|---:|---:|
| Aktif pencere | 15040 ms | 15045.6 ms |
| CDP profil penceresi | 15178.854 ms | 15159.833 ms |
| Örnek sayısı | 10104 | 10106 |
| Frame / JS draw hızı | 903 / 60.04 sn⁻¹ | 904 / 60.08 sn⁻¹ |
| JS submit p50 / p95 | 2.0 / 2.7 ms | 1.8 / 2.4 ms |
| Calls p50 / p95 | 446 / 452 | 446 / 452 |
| Triangles p50 / p95 | 75492 / 75752 | 75492 / 75752 |
| Harbor asset self örnek süresi | 531.740 ms | 452.781 ms |
| Three asset self örnek süresi | 1654.506 ms | 1560.000 ms |
| PodCargo frame self / inclusive | 163.077 / 507.760 ms | 111.120 / 422.849 ms |
| renderBufferDirect self / inclusive | 150.116 / 1128.035 ms | 152.019 / 1091.668 ms |
| GC pseudo-frame self | 16.259 ms | 30.837 ms |
| Drei Html frame self / inclusive | 12.024 / 44.798 ms | 1.501 / 25.542 ms |

Self/inclusive süreleri her sample'ın timeDelta ağırlığından hesaplandı; çağrı sayısı değildir. Inclusive değerler üst üste biner, toplanmaz. Profillerin idle pseudo-frame süreleri 12456.509 / 12651.153 ms'dir. Kısa örneklerdeki farklar üretim CPU oranı veya istatistiksel iyileşme olarak yorumlanmaz.

İki tanıda scene inventory **408 object / 56 distinct reachable geometry / 50 material**; GPU renderer inventory **51 geometry / 3 texture / 17 program** ile eşleşir. Bu sayılar object kimliklerinin veya her karenin eşitliği değildir. Canonical 50/1500 ve visible 8/270 korunur; measuredTraffic null, steady mesaj/parse/store ve long task 0'dır.

Frozen candidate HarborScene-Vy8ofl7a.js içinde captions.js captionPosition, **v1**, CDP konumu line13/column60420 olarak eşleşti (0 tabanlı). Profilde **2 self sample, 2.931 ms self/inclusive**, toplam örnek penceresinin yaklaşık **%0.0193**'üdür. Stack: R3F frame → Drei Html useFrame → calculatePosition → v1. Baseline yeni custom v1 fonksiyonunu içermez; bu, baseline Html maliyeti sıfır demek değildir. v1 maliyeti bu kısa tanıda sıcak bir yol değildir; iki sample sıfır maliyet veya üst maliyet sınırı kanıtı da değildir. DOM style/layout işinin JS dışındaki kısmı bu sayıdan çıkarılamaz.

Drei Html callback frozen ortak three asset line3897/column39006'da object/camera matrix günceller, calculatePosition çağırır ve koşullu DOM visibility/zIndex/transform yazar. Başlıca örneklenen yollar render/renderBufferDirect ile byte-eşit HarborScene'deki PodCargo per-frame loop, podVisual ve resourcePosition'dır. Candidate kısa tanıda daha fazla JS submit veya sampled Harbor/Three işi göstermiyor; bu gözlem önceki AC residualının nedenini belirlemiyor.

**Sınırlar:** Profil sayfa V8 örneklemesidir; GPU process ve bütün native renderer/driver/thread maliyetini kapsamaz. Native çağrı frame'lerinin görünmesi bu kapsam sınırını kaldırmaz. Pil, kısa süre ve profiler/scene-inventory instrumentation nedeniyle önceki AC +%4.02 yakın eşleşen residualı veya +%20.93 ham medyan farkını nedensel olarak temizlemez. İlk AC iki çiftindeki FaultMarker footprint hipotezi de bu iki tanıyla kanıtlanmış olmaz. Yeni test/profil/benchmark çalıştırılmadı; ek koşu önerilmedi.

Tam self/inclusive sıralamalar, caption stack'leri, source konumları ve girdi SHA'ları: [l-js-diagnostic-review.json](l-js-diagnostic-review.json).
