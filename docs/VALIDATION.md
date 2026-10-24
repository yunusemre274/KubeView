# Kabul ve ölçüm kaydı — 2026-10-24

## Ortam ve güvenli kapsam

MacBook Air Apple M5 (10 CPU), 32 GB RAM; Chromium 156 headless ve Playwright WebKit. WebKit testi gerçek Safari donanım testi değildir. Kubernetes 1.35.1, iki Node’lu **kubeview-test**, namespaced denemelerde yalnız **kubeview-qa**. Varsayılan minikube context’i mutasyon hedefi yapılmadı. Docker yalnız mevcut ayrılmış test kümesini çalıştırmak için açıldı; yeni production dağıtımı yapılmadı.

Son birleşik tarayıcı paketi: **21 geçti, 0 hata, 5 bilinçli atlama**. Atlananlar WebKit’te tekrar gerçek mutasyon yapan senaryolardır; bunların Chromium karşılıkları geçti. Frontend **39** birim testi; Go test/race/vet ve iki gerçek canvas raycast regresyonu geçti. Makineye okunur son tarayıcı sonucu [browser-results.json](evidence/browser-results.json).

## Gerçek akış kanıtı

- Merkezde gerçek Deployment dry-run/create → informer/watch → WebSocket → kanonik UID → sahnedeki gerçek container seçimi → gerçek log → scale/delete: Chromium canlı testi.
- Gemide Node hedefli create; `metadata.name` required affinity, boş `spec.nodeName`, gerçek scheduler assignment ve seçilen UID: Chromium canlı testi. Node yeniden yaratılması 409/preflight ile reddedilir.
- Backend canlı testleri: create/edit/delete, scale/restart/rollback, CronJob, cordon/uncordon; gerçek log/exec/portforward; Pod UID korunarak resize; uygunsuz affinity ile gerçek Unschedulable/FailedScheduling gözlemi.
- Ayrılmış worker Docker container’ı 50.9 saniye duraklatıldı; gerçek Node `Ready=Unknown` gözlendi, UI bağlantısı **Canlı** kalırken yalnız o gemi iletişim uyarısı verdi. Sonra worker tekrar başlatıldı ve her iki Node Ready doğrulandı. [Görüntü](evidence/world/live-node-unknown.png), [kayıt bilgisi](evidence/world/node-unknown.json).
- Snapshot/ADD/UPDATE/DELETE, gecikmiş callback, eski context generation, opaque RV, aynı ad/yeni UID, finalizer ve kısmi hata için servis/store testleri var. Görsel transfer testi API sonucunu değiştirmez.
- Gerçek RBAC reddi: test namespace’ine ait SA/Role/RoleBinding ile impersonated Kubernetes istemcisi oluşturuldu. Pod GET 200; gerçek SSAR delete/log false; gateway DELETE/log 403 ve doğrudan upstream Forbidden. Pod UID korunmuş, fixture’lar UID önkoşuluyla temizlenmiştir. `TestDedicatedClusterRestrictedRBAC` race ile geçti.
- Secret reveal ve edit ayrı amaçlı akıştır; yasaklı reveal kaydı mutasyonu engeller. Raw data/stringData/annotations operasyon geçmişine sızmaz.

[Canlı yaşam döngüsü videosu](evidence/world/lifecycle-live.webm) merkez → Deployment oluşturma → gemi → hedefli Pod oluşturma → gözlenen vinç transferi → container logu → dünyaya dönüşü gösterir. [Metadata](evidence/world/lifecycle-live.json) gerçek context/namespace, API yanıtları, gözlenen transfer ve istemci sürelerini içerir. Kayıt demo değildir; ekran görsel kabul testlerindeki demo verisi kalıcı **Demo — örnek veri** rozeti taşır.

## Görsel ve etkileşim kabulü

1440×900, 1280×800 ve 768×900 CSS px; Chromium + WebKit: ilk açılış, fiziksel tesislerin tıklanması, merkez, Node/Pod paneli, koyu tema, dar sheet, boş kaynak durumu. Görüntüler gerçekten açılarak incelendi. Canvas tam viewport; panel aç/kapat kamera ve DOM canvas kimliğini korur. Kamera sürüklemesi seçim yapmaz; panel wheel kameraya sızmaz. Cmd/Ctrl+K, Escape, odak ve reduced motion kontrol edildi. İlk backend 503 sonrası tekrar bağlanma iki motorda geçti. Son mobil düzeltme başlık/aksiyon satırını kısaltıp Pod içeriğine alan bırakır.

Referans karşılaştırması [UI-UX](UI-UX.md): bağlı uzun beton iskeleler ve dar su havuzları, sivrilen mavi borda ve köprüüstü, kiriş/ayak/halatlı portal vinç, oluklu hangar, güneş ve farklı beton/metal/su malzemeleri. Yerel prosedürel modeller ve ortak materyaller kullanılır; referans logoları kopyalanmaz. Pencere açıkken sahne arkasında kalır; varsayılan kullanımda dashboard yoktur.

## Performans — hedef ile ölçümü ayırma

[Ham rapor](evidence/performance.json), 1440×900, orta kalite, headless Chromium **SwiftShader yazılım renderer**; sentetik fixture, gerçek küme yük testi değildir. Aynı makinede başka geliştirme/test işlemleri vardı.

| Kanonik profil | Ekrandaki kaynak | Draw call | Üçgen | Kontrollü 3 sn kamera hareketi |
|---|---|---:|---:|---:|
| 20 Node / 300 Pod | 20 / 300 | 382 | 56.284 | 10,76 FPS |
| 50 Node / 1500 Pod | 20 / 600, bölgelerle | 382 | 77.884 | 8,20 FPS |

Bu yazılım renderer değerleri donanım performansını temsil etmez. Ek olarak **headed Chromium / ANGLE Metal / Apple M5** ile her profilde 5 saniyelik kontrollü kamera hareketi ölçüldü: 20/300 için **60,33 FPS**, 50/1500 (görünür 20/600) için **60,18 FPS**; animation-frame p95 sırasıyla 18,8 / 18,7 ms. [GPU ham raporu](evidence/gpu-profile.json). Bu kısa sentetik 3D ölçümünde başlangıç FPS hedeflerine ulaşıldı; uzun süreli gerçek küme ve Safari ölçümü değildir. Draw-call sayısı başlangıç 300 bütçesinin üzerindedir. Her iki profilde de boşta 1 saniyede ek frame **0**; demand rendering aktif. GPU nesne sayısı 20 geometri / 4 texture; bu, GPU byte belleği ölçümü değildir.

10 dakikalık Pending → schedule → delete ve periyodik source-reset döngüsünde **464** ekle/sil çevrimi, **601,5 saniye**, **47** GC sonrası örnek alındı. JS heap ilk **18,67 MiB**, son **22,38 MiB**, aralık **18,33–24,47 MiB**; monoton sürekli büyüme görülmedi ancak başlangıç/son farkı var. GPU nesne sayıları 20/4 kaldı. Sonunda kanonik 300 Pod, 300 Pod slotu, 0 transfer, 0 kuyruk, 0 çıkış hayaleti; tarayıcı JS hatası **0**. Uzun süreli üretim bellek testi yerine geçmez.

Canlı kayıt sırasında WebSocket mesajının alınması → parse/store güncellemesi: 31 örnek, p50 **0,2 ms**, p95 **1,8 ms**, max **2,2 ms**. Bu, Kubernetes algılama/planlama gecikmesi veya React paint süresi değildir. Go RSS ayrı tek zaman örneğinde yaklaşık **57,9 MiB** idi; bir trend iddiası değildir. Tarayıcı toplam proses belleği ve GPU byte belleği ayrıca ölçülmedi.

## Paketleme ve açık eksikler

Temiz `npm ci` + Vite production build + Go binary build, Go test/race/vet, Helm lint/render, Docker build uygulanır. Statik frontend binary içine gömülü değildir; Docker’da birlikte taşınır. Same-origin HTTP/WS ve configurable Vite proxy kullanılır; sabit 8000 portlu log URL’si yoktur.

Tam Node drain/PDB kesintisi canlı çalıştırılmadı. Tüm CRD/operator/controller kombinasyonları ve gerçek çok-container log senaryosu canlı matrisi tamamlanmadı. Gateway API hedef test kümesinde kurulu değil. Gerçek Safari ve uzun süreli GPU performansı, çok kullanıcılı kimlik ayrımı ve watch havuzu açık işlerdir. Ayrıntı [CAPABILITIES](CAPABILITIES.md).
