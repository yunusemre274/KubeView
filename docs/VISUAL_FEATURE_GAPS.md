## 9 Kasım2026 — v1.1.0 kabul sınırı

Bu bölüm yeni `32a0468` runtime kabulüne işaret eder: [V11 kabul raporu](V11_ACCEPTANCE_REPORT.md). Gerçek UI/provider, unit ve eşit çekirdekli tarihsel tekrar-kullanım ayrıdır; aşağıdaki6Kasım onarım ve1Kasım denetim hükümleri geriye dönük değiştirilmez. Yeni STS/DS/Secret/log/CR/metrics/iki-cluster kanıtları ve caption düzeltmesi eklendi. Askıdaki Job ve bilinmeyen DS durum etiketi dar düzeltmeyle doğrulandı. Son31AC hücre/20dakika geçti; CPU nedensellik yorumu ve stable teslim kapısı [yeni performans kaydında](../artifacts/v1.1.0/v11-20261108/performance/REVIEW.md) ayrı tutulur. Bu ek stable release veya bütün Kubernetes kapsamı ilanı değildir. CSV'de yeni tarihli sütunlar eski envanteri korur.

# Güncel onarım eksikleri ve kabul kapıları — 6 Kasım 2026 kanıt uzlaştırması

**v1.1 öncesi görsel onarım tamamlandı:** zorunlu çekirdek işlev, ana pil seti, 20 dakika karma koşu ve ayrı materyal/cleanup kapıları belgelenen kapsamda geçti. Gerçek yeni worker katılımı ve Hubble same/cross-Node trafik/panel yolu kanıtlıdır. Son Git teslimini ana yönetici yürütür; v1.1 milestone'u, etiketi veya release'i kapatılmadı/oluşturulmadı. Aşağıdaki P2 polish, platform ve ek senaryo sınırları tamamlanmamış zorunlu çekirdek kapıları değildir. Eski audit eksikleri tarihsel tutulur.

Güncel kaynak/kanıt sınırı [VISUAL_FEATURE_AUDIT.md](VISUAL_FEATURE_AUDIT.md) başındadır. Son provisioning kaynak kimliği `8768398`; gözlenen akışlar Kubernetes 1.35.1 ve sahip olunan Cilium/Hubble 1.20.2 lab'ıyla sınırlıdır. Maliyet/risk aşağıda mühendislik değerlendirmesidir; ölçülmüş tasarruf veya evrensel kapsam iddiası değildir.

Bu bölüm 1 Kasım kanıtlarını, 6 Kasım sınırlı UI hata-yolu koşusunu ve tamamlanan pil ölçümlerini uzlaştırır. Küçük kaynak/ekran seçkisi ve yedi kodlanmış kesit toplam 72,16 sn olarak [teslim kanıt dizinindedir](../artifacts/pre-v11-repair/repair-20261101T130559Z/delivery/EVIDENCE_INDEX.md). Tüm inceleme sayfaları ana yönetici tarafından açıldı. İlk container 11–14,5 sn warning kesiti reddedilip korundu; 13–20 sn düzeltmesi gerçek düşüş/su temasını gösterir, ara label örtüşmesi P2 kalır. Native Safari ayrı/N/A olarak korunur.

## Kapatılan işlev hataları — geçmiş başarısızlıklar korunur

| Alan | Son durum ve kanıt | Kalan sınır |
|---|---|---|
| G00 aynı-source CR reconnect / yanlış silindi | Gerçek 6 grup: aynı UID, DELETE, offline DELETE→relist, yeni UID, RBAC, namespace/context geçti: [frontend-G00-real-2](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-G00-real-2.json). | Eski FAILED JSON durur; authoritative scope dışında yokluk silinme değildir. |
| Snapshot eski yükü yeni iş gibi oynatıyor | Store son SNAPSHOT UID kümesini ayrı tutar; ilk görülen snapshot UID baseline. Canlı ADD/Pending→assigned korunur. Son gerçek [provider ilk sahnesinde](../artifacts/pre-v11-repair/repair-20261101T130559Z/provision-final-2.json) active/queue/process 0. | Eski journal admission istisnası görsel oturum `sourceWallStart`/valid startedAt ile sınırlı; bu ek risk unitte üretildi, runtime hata diye birleştirilmedi. |
| G01 alev/batma | False API enjeksiyonu + doğal Unknown/recovery + gerçek DELETE/new UID; [renkli son video/kareler](../artifacts/pre-v11-repair/repair-20261101T130559Z/node-fire-final-2.json). | Doğal fiziksel Ready=False kanıtı yok; Unknown fiziksel ölüm değildir. Backend stale tüm filoyu yakmaz. |
| G02 tek-container düşüşü / normal silme yanlış arızası | Gerçek iki-container arızası, aynı UID recovery, Completed, terminal Failed, finalizer/replacement; [retry2](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-container-preparation-2.json). Normal SIGTERM/137 yeni düşüş tetiklemez. | Gerçek OOM/Evicted/ephemeral arıza animasyonu ayrı açık doğrulamadır. |
| G03 yerel gerçek worker sağlayıcısı/katılım | [provision-final-2](../artifacts/pre-v11-repair/repair-20261101T130559Z/provision-final-2.json) ve [açılmış video incelemesi](../artifacts/pre-v11-repair/repair-20261101T130559Z/provision-final-2-visual-review.json): yeni Docker host, yeni NodeUID, Ready, kızak ve sonra üç geminin devam eden seyri; same-key idempotency ve farklı-key → HTTP 409. | Minikube dışı provider yok. Önceki timeout/locator/yanlış kuyruğa alma/admission kayıtları final başarıya çevrilmedi. |
| G04/G07 hazırlık, vinç, merkez anlatımı | [Halat/yük zarfı](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-final-crane-envelope-3.json) ve [iki gerçek eşzamanlı workload](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-control-plane-real.json) owner/operation kimlikleriyle geçti. | Kontrol düzlemi **temsili**, iç RPC ölçülmüyor; bütün negatif UI senaryoları kapsanmış değil. |
| Log UID / Secret metadata / controller CPU hedefi | [Gerçek backend alt sonuçları](../artifacts/pre-v11-repair/repair-20261101T130559Z/backend-final-20261101T163729Z.txt): araya replacement konan log yarışı, sentetik Secret roundtrip, D/STS/DS HTTP 202 ve unsupported RS/Job/CronJob HTTP 422. | Logs API atomik UID garantisi vermez; unsupported kaynak için sahte başarı yok. Aggregate exit 1 ve sonradan ayrı geçen reader koşusu ayrı kalır. |
| PV/PVC slot reclaim | [Üç gerçek storage çevrimi](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-storage-real.json): yeni UID'ler aynı boşalan slotları kullandı, module 0'a döndü, geometry/texture sabit. | Özel byte kullanım telemetrisi veya20 dakikalık bellek kanıtı değildir. |
| G05 collector/protokol ana yolu | Gerçek Hubble mTLS, strict L3/L4-L7 maskesi; [same/cross-Node son UI](../artifacts/pre-v11-repair/repair-20261101T130559Z/traffic-visual-final.json) ok ve Enter doğru UID, 8→40 çift ve durunca 0. [Gerçek kopma/DNS](../artifacts/pre-v11-repair/repair-20261101T130559Z/traffic-provider-recovery-real.json): stale, rendered flow 15→0, Node fault 0, yeni gözlemle live; DNS/UDP. | DNS uç UID'leri null/unverified-time-interval; DNS 3D kimlik/tıklama kabulü yok. Flow olayı paket/byte/bant genişliği değildir. Ana sentetik pil seti/uzun koşu ve ayrı materyal/cleanup kapısı geçti; gerçek provider maliyeti ayrı kalır. |

## G05 — doğrulanan sağlayıcı/protokol sınırı ve açık kapsam

### Gerçek kayıp/toparlanma ve DNS kaydı geçti; genel protokol kapsamı iddia edilmez

- **Veri:** gerçek Hubble event Type/variant, TCP/UDP/L7 alanları, gözlem zamanı, yetkili namespace ve zamandaki Pod UID eşlemesi. Gerçek olmayan alan null kalır; porttan HTTP/TLS/gRPC türetilmez.
- **Backend:** ilk allHTTP P0 sınıflandırması strict Type=L7/variant ve whitelist ile giderildi; gerçek TCP/HTTP/1.1/DNS-UDP API kanıtı var. [Gerçek provider kopması/toparlanması](../artifacts/pre-v11-repair/repair-20261101T130559Z/traffic-provider-recovery-real.json) PASSED; restricted reader'ın ayrı PASS koşusu mevcut. Eski aggregate reader HTTP 403 ve ilk sınıflandırma hatası korunur; sonraki başarı bunları değiştirmez.
- **Frontend:** same/cross-Node ok/panel ve semantik Enter geçti. Gerçek Hubble mTLS forward kesilince stale etiketi, 10 sn tarihsel pencere ve 15→0 rendered flow gözlendi; Node fault 0 kaldı, yeni veriyle live döndü. [Açılmış ekran/video kareleri](../artifacts/pre-v11-repair/repair-20261101T130559Z/traffic-provider-recovery-visual-review.json) bunu destekler. DNS/UDP API kaydının iki UID'si doğrulanmış zaman aralığı bulunmadığından null; ayrı DNS panel/3D seçimi geçti denmez.
- **Ek bileşen / maliyet / risk:** mevcut sahip olunan Cilium/Hubble lab; yeni kullanıcı CNI kurulumu gerekmiyor. Collector CPU/ağ maliyeti ve yanlış protokol/metadata algısı yüksek etkili; URL/header/payload gizliliği korunmalı.
- **Kabul sınırı:** kaynak→provider→API→3D/panel korelasyonu; ayrı same/cross-Node Pod'lar, start/artır/stop ve provider loss→stale→expiry→recovery geçti. DNS/UDP yalnız gerçek API kapsamındadır. Ayrı same-Node detay tıklaması, gerçek IP reuse E2E ve bütün şifreli L7 protokolleri kapsam dışı/kanıtsızdır.

## Kabul edilen performans ve cleanup kapıları

### Ana performans, karma koşu ve materyal/cleanup kabulü

- **Veri:** mevcut M: 20 Node / 300 Pod ve L: 50 Node / 1500 Pod fixture/replay kimlikleri, gerçek görünür yoğunluk, aynı viewport/medium/DPR/deniz/seyir/kamera ve sabit güç kaynağı; gerçek Hubble/provisioner maliyeti ayrı.
- **Ana sonuç:** [repair-final-battery-20261106/comparison.json](../benchmarks/results/repair-final-battery-20261106/comparison.json) 49 hücre, `partial=false`, `valid=true`, `reasons=[]`; n=3 eşleşmiş aynı kalite tekrar tamamlandı. Panel açık tarayıcı CPU medyanı 0,4324854→0,414271 çekirdek, örtüşen aralıklar; açık−kapalı işaretli fark medyanı başlangıç −0,0257363/final −0,0406050 çekirdek. Genel optimizasyon kazancı iddia edilmez. Bu sentetik replay ölçümüdür; gerçek provider maliyeti ayrıdır.
- **Uzun koşu:** 1200,106 sn; 60,00054 JS draw/sn, p95 18,6 ms/p99 19,4 ms, 0 long task. Üretici 5600/5600; 5567 canlı delta, üç reconnect boşluğu snapshot ile son duruma uzlaştırıldı. Geçmiş olay replay'i değildir. Final canonical içerik plan/upstream ile tam eşit, 40/40 sessiz checkpoint sayımı, 329 resync, 20/20 panel çevrimi, 24/24 log kapanışı ve 0 kalan akış doğrulandı. DOM/rAF/JS draw proxy'leri fiziksel presented ölçüm değildir.
- **Ayrı GPU/sahne tanılaması:** [repair-gpu-scene-battery-20261106](../benchmarks/results/repair-gpu-scene-battery-20261106/summary.json), 3602 asenkron GPU örneği p95 2,546749 ms; 31 olay/cleanup PASS. Sahne materyalleri 43→39, GPU geometry 37→34, program cache 18→22. GPU kullanım yüzdesi veya uzun materyal trendi sonucu değildir.
- **Materyal/cleanup kabulü:** [material-cleanup-review.json](../artifacts/pre-v11-repair/resume-20261106T1015Z/material-cleanup-review.json) `PASSED_SCOPED_DIAGNOSTIC`, `reasons=[]`; run kapıları, kaynak/build/browser/pil kimliği ve örneklenen PID CPU kapsamı doğrulandı. 1200,101 sn; 59,997445 JS draw/sn, p95 18,9 ms/p99 21,5 ms, 40 checkpoint, 20 panel çevrimi, 24/24 log kapanışı/0 kalan akış, üç reconnect/329 resync, üretici 5600/5600 ve tam final canonical/plan eşitliği. Materyal 40–44, scene geometry 35–43, GPU geometry 33–41, texture 3 ve program 21–22 aralığında kaldı. Aynı tamponlu geç 19 örnekte 295–296 log satırı, 19,43–44,30 MiB CDP heap ve 526–544 DOM gözlendi; tek yönlü sınırsız büyüme görülmedi. Kapalı sahne 373 nesne/38 geometry/42 materyal; canonical fault state değiştiğinden başlangıçla eşit sahne sayılmaz. Saf `c.__harbor.scene` checkpoint sayımı gizli nesneleri içerir, renderer-generated/off-scene materyalleri ve GC tamamlanmasını kapsamaz; mutlak leak yokluğu iddiası değildir. Tanılama ana CPU çiftlerine katılmadı. Dondurulmuş ürün frontend `c9f5c8cc…` ve Go `40c1aa02…` değişmedi.
- **Kapanış kararı:** belgelenen kaynak/protokol/platform sınırlarıyla **v1.1 öncesi görsel onarım tamamlandı**. Son Git teslimini ana yönetici yürütür; bu karar v1.1 milestone/tag/release kapatmaz. Native Safari/Retina N/A, OOM/Evicted gibi ek gerçek senaryolar ve aşağıdaki P2 polish sınırları korunur.
- **Korunan tarih:** 1 Kasım [21/49 AC checkpoint](../artifacts/pre-v11-repair/repair-20261101T130559Z/PAUSED_CHECKPOINT.json) ve ayrı [gerçek Hubble OFF/ON](../artifacts/pre-v11-repair/repair-20261101T130559Z/traffic-cost-summary.json) 3 çift/6 hücre sonuçları değiştirilmedi. Yeni pil seti bunlarla karıştırılmaz; özellik maliyeti genel tasarruf diye sunulmaz. Native Safari N/A ve physical presented sınırları geçerlidir.

### G01/G02/G04/G06 — doğrulanmış kapsamın sınırları

- **Veri:** doğal Unknown ile False status enjeksiyonu; app/init/native-sidecar/ephemeral; normal Completed/Terminating; request/limit/usage/allocatable; gerçek capability/SSAR ve addon varlığı ayrı kalmalı.
- **Backend:** gerçek CronJob, native-sidecar logs, resize kubelet uygulaması, PDB/drain, metrics absent/present, rollback revision alt deneyleri var. Rollback replicas=0 testi tam Ready rollout değildir. İlk present metrik sonucu 3 Node / 0 Pod olarak korunur; [son API kaydı](../artifacts/pre-v11-repair/repair-20261101T130559Z/final-actual-metrics.json), 1 Kasım 19:02:09Z'de 3 Node / 3 Pod örneğidir. Bu tüm dolu Pod grafiklerinin normal UI E2E kabulü değildir.
- **Frontend:** [6 Kasım sınırlı UI koşusu](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-final-failures-20261106T102147Z.json) create/dry-run→owner/atama/Ready, scale1→2 same PodUID, Unschedulable, ErrImagePull, quota-admission reddi ve gönderilmemiş taslak/context değişimini geçti. 7 PASSED grubunun biri eşleşen-source eski RBAC kanıtı reuse'dur; yeni RBAC E2E sayılmaz. İlk aggregate **FAILED** korunur: helper doğru tutulan Terminating eski Pod'u UID assertionına katmıştı. [Ayrı restart-only recovery](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-restart-recovery-20261106T102612Z-review.json) PASSED; iki eski UID DELETE, yeni RS/iki yeni Ready Pod UID ve aynı Node UID doğrulandı. Ürün kaynağı değişmedi, önceki yedi grup tekrar koşulmadı; ilk beş ve recovery iki cleanup kaydı observed404. Kabul edilmiş iş context değişimiyle sunucuda iptal edilmiş sayılmaz. Çoklu rol/gerçek OOM/Evicted ve bütün atlanmış watch aşamaları açık kalır. Generic katalog özel 3D ya da her işlem tamamlanmış gibi sunulamaz.
- **Panel tanılaması:** [20 sentetik M panel çevrimi](../artifacts/pre-v11-repair/repair-20261101T130559Z/panel-pixel-actionability-20261106T103034426Z.json) başlık PNG readback üst sınırı p95 55,71 ms, sekme visible/enabled ve kapatma trial üst sınırı p95 87,34 ms içerir. Bu kısa aynı çalışma kümesi tanılaması 20 dakika karma kararlılık veya bütün kontrollerin physical presented kabulü değildir; `physicalPresentedLatencyMs=null`.
- **Ek bileşen / maliyet / risk:** mevcut own lab ve mevcut mutation/capability akışı; ek provider zorunlu değil. OOM/eviction/worker bakımının riski yalnız izinli lab ile sınırlandırılır. Kontrolsüz genişleme veya yanlış “bütün Kubernetes” iddiası önlenmeli.
- **Kabul:** CSV'de her somut kaynak/işlem için kurulu mu/izin/veri/UI/işlem/animasyon/test ayrı; gerçek UI, API, status injection ve unit/replay ayrımı. Kurulu olmayan Gateway/VPA destek başarısı veya ürün hatası sayılmaz. Desteklenmeyen CPU hedefi açık HTTP 422/gerekçeli UI olarak kalır; her immutable HTTP 409/422 tüm türlerde test edilmiş gibi yazılmaz.

## P2 — işlev korunurken okunurluk ve polish

| Konu | Veri / backend / frontend / ek bileşen | Maliyet-risk | Kabul |
|---|---|---|---|
| Yoğun trafik sahne başlığı sağ kenarda kırpılıyor | Gerçek pencere/grup toplamı; backend değişmez; uzun sahne durum başlığını viewport içinde sardırma/özetleme adayı. Ayrıntılı semantik listedeki toplam/çizilen sayaçlar okunur. | Düşük; çizim sınırları ve eksilen grup sayıları gizlenmemeli. | 1440/1280/dar viewport'ta sayaç ve katman durumu tam okunur; doğru UID akışı ile semantik erişim korunur. |
| Fault etiketi çok dar sarılıyor | Gerçek container adı/reason; backend değişmez; mevcut tek etiketi okunur genişlikte tut, kutu/halat üstünü tekrar örtme; ek sistem yok. | Düşük; overlay tekrar çakışabilir. | 1440/1280/768 ve hareketli tek-kutu olayında ad/reason ile sağlıklı kutu görünür; panel/finder/hover tam kimlik erişimi korunur. |
| Yaklaş kamerasının vinç zarfı | Gerçek gantry rayı + hedef gemi; backend değişmez; mevcut kullanıcı kontrollü zoom/focus kadrajını iyileştirme adayı; ek sistem yok. | Düşük/orta; form sırasında kamera kaçırılmamalı. | Otomatik arka-plan kamera hareketi olmadan yük alma→ray taşıma→güverte bütün zarfı görülebilmeli; son gerçek video manuel normal zoom ile geçti. |
| Platform ve ölçüm isimleri | Son Chromium/WebKit işlev/kontrast ve gerçek OS hidden kayıtları var; native Safari ayrı/N/A. | Ortama bağlı; motorları eşitlemek yanlış güven verir. | WebKit gerçek Safari performansı sayılmaz; hidden gerçekten true olmalı. Fiziksel RAM/VRAM/presented FPS iddiası yalnız uygun ölçümle. |

---

# Tarihsel yalnız-denetim eksik listesi — 1 Kasım 2026

> Aşağıdaki eski bulgu/geliştirme önerileri onarım öncesi durumu belgeler. Güncel kapatılan/açık kapsam yukarıdadır; eski başarısız denemeler ve o tarihteki kaynak riskleri korunmuştur. Yeni iş listesi olarak körlemesine tekrar uygulanmamalıdır.

# Görsel denetim eksikleri — 1 Kasım 2026

Bu liste [denetim raporunun](VISUAL_FEATURE_AUDIT.md) sonucudur; v1.1 uygulama planı yürütülmedi. Ürün kodu değiştirilmedi. **Doğrulanmış hata**, **eksik ürün davranışı** ve **yalnız kaynak kodundan çıkarılan risk** ayrı tutulur. Kubernetes informer, raw UID, canonical state ve gerçek mutation servisleri korunarak en küçük sonraki işler aşağıdadır. Maliyet/risk nitel mühendislik tahminidir; tamamlanma sözü değildir.

## P0 — yanlış canlı durum

### G00 — On-demand CR, aynı-source reconnect'te yanlış “silindi” oluyor (DOĞRULANMIŞ / HATALI)

- **Kanıt:** `reconnect-resume2.json`; gerçek `audit-custom` UID `381d6947-a8dd-4ee7-a279-016b75fe5f15`, RV956 API'de değişmeden kaldı, snapshot2→3 sonrası açık panel tombstone oldu. Kataloğu yeniden açmak düzeltti. Kullanıcıya yanlış kaynak yokluğu anlatılıyor ve gerçek kaynak işlemleri engelleniyor.
- **Gereken veri:** Snapshot'ın hangi GVR/kapsam için authoritative olduğu, on-demand yüklenmiş GVR/UID kayıtları ve gerektiğinde gerçek GET/LIST404 teyidi.
- **Backend işi:** Snapshot kapsamını açık belirtmek veya aynı yetkili kapsam için keşfedilmiş seçili GVR aboneliğini taşımak. Watch eklenirse yetki/iptal/sonlu kuyruk/snapshot-delta sırası korunmalı.
- **Frontend işi:** `resourceStore.reduceMessage(SNAPSHOT)` ile `ShipyardClusterContext.loadKind` sahipliğini ayırmak; `FacilityWindow` yeniden bağlanma neslinde gerekli GVR'yi uzlaştırmalı. “Listelenmedi/bilinmiyor” ile doğrulanmış DELETE aynı olmamalı. Körlemesine eski CR'yi sonsuza kadar tutmak çözüm değildir.
- **Ek bileşen:** Yeni üçüncü taraf sistem gerekmez; scoped reconciliation/abonelik kaydı yeterlidir.
- **Maliyet/risk:** Orta; yanlış retain yaklaşımı gerçek DELETE'i kaçırabilir, bir GVR'nin verisini diğer cluster/kapsama sızdırabilir.
- **Kabul:** Gerçek CR list/get → selected → aynı-source WS/backend reconnect; mevcut UID canlı kalmalı. Ardından gerçek CR DELETE ve offline silinme/relist; panel doğru silindi olmalı. Aynı ad/yeni UID, RBAC kaybı, namespace/context değişimi ve eski nesil callback ayrı sınanmalı.

## P1 — sekiz temel beklentide eksik davranış

### G01 — Node yangın/duman/batma sekansı yok (soru1)

- **Veri:** Mevcut gerçek Node UID + Ready koşulu + deletion; backend/WS stale ayrı. Ready=False fiziksel ölüm kanıtı değildir; Unknown iletişim kaybıdır.
- **Backend:** Yeni sahte ölüm endpoint'i gerekmez. Mevcut koşullar yeterli; varsa gözlenen transition zamanı korunur.
- **Frontend:** UID başına bounded arıza/sönme/toparlanma görsel state'i, seçilebilir kısmi gövde/işaret ve durum açıklaması. Aynı event/resync tekrarında başlangıca dönmemeli. Canonical Node/Pod'lar tutulmalı; DELETE ayrıca gerçek yokluğu izlemeli. Reduced-motion kısa durum sunumu olmalı.
- **Ek bileşen / maliyet / risk:** Ortak düşük maliyetli flame/smoke mesh/particle sunumu ve ayrı animasyon state makinesi; orta. Görsel olarak kesin donanım ölümü anlatma, gemiyi seçilemez biçimde suya gömme ve kaynak leak riski var.
- **Kabul:** Kendi worker'ında gerçek stop→Unknown/recovery, ayrı açık False enjeksiyonu, gerçek DELETE; doğru UID/diğer filo korunması, timed video, duplicate/resync, context iptali, kaynak sayımı/cleanup.

### G02 — Container/Pod hata düşmesi yok; rol düzeyindeki efekt kapsamı eksik (soru2)

- **Veri:** Gerçek Pod UID + container adı/rolü + restartCount/termination.finishedAt + phase/reason/deletion. CrashLoopBackOff phase değildir; Completed hata değildir.
- **Backend:** Mevcut raw container status yeterli; yeni veri uydurulmaz. App/init/ephemeral ayrımı korunur.
- **Frontend:** Tek container hatasını bütün Pod'un silinmesi gibi göstermeyen bounded düşme/geri alma sunumu. Canonical konum/owner/nodeName hemen güncel kalmalı. Çoklu container grubu, same UID recovery ve new UID replacement ayrı. Ephemeral status `ContainerTransitions/containerProblem` kapsamına bilinçli eklenmeli; current/last termination önceliği testlenmeli.
- **Ek bileşen / maliyet / risk:** Mevcut coordinator'a ayrı hata görseli; orta. Yanlış container/UID, yinelenen OOM, sahipsiz iz ve Job completion'ı hata gösterme riski.
- **Kabul:** Gerçek çok container restart/CrashLoop ve başarılı Job; kontrollü terminal Failed, mümkünse gerçek OOM/Evicted ayrı; finalizer, DELETE/new UID, duplicate/resync, reduced-motion. Her biri zamanlı kare ve cleanup ile.

### G03 — Node provisioning ve yeni filoya katılım ayrı eksikler (soru3)

- **Veri:** B için gerçek Node ADD/Ready yeterli. A için gerçek altyapı sağlayıcısı/join işlem kimliği ve yetkisi gerekir; yalnız Node nesnesi POST etmek yeterli değildir.
- **Backend:** En küçük B işi yeni provider gerektirmez. A istenirse seçilmiş bir yerel/bulut provider'a dar yetkili, idempotent, iptal/cleanup'ı tanımlı entegrasyon ayrı geliştirme olur.
- **Frontend:** B için gözlenen kayıt→Ready ile ilişkili kısa admission/limana katılma anlatımı. A'nın istek/kabul/sağlama aşamaları ancak provider gerçekten raporluyorsa gösterilmeli. Scheduler makine yaratan aktör olarak etiketlenmemeli.
- **Ek bileşen / maliyet / risk:** B düşük/orta; A ek provider+credential/auth modelinden dolayı yüksek. Altyapı maliyeti ve yarım kalmış VM cleanup riski.
- **Kabul:** Yeni gerçek worker join, Ready gecikmesi/başarısızlık, mevcut gemi fazları; provisioning varsa gerçek request/işlem kimliği/oluşan makine→Node eşlemesi. Demo gemisi ve API Node create bunların kanıtı değildir. Bu denetimde yalnız aynı gerçek worker'ın new UID yeniden kaydı doğrulandı.

### G04 — Deployment hazırlığı için eksiksiz gözlenebilir sunum yok (soru4)

- **Veri:** API kabulü/operation ID; gerçek Deployment→RS→Pod owner UID'leri; generation/observedGeneration; nodeName, conditions/container status ve Events. Her aşama her koşuda gözlenmez.
- **Backend:** Mevcut veriler ilk sunum için yeterli. Controller iç fazlarını gerçek kabul etmek istenirse ayrı audit/trace kaynağı gerekir.
- **Frontend:** Form taslağı, accepted, reconciling ve observed sonuç farklı; merkez/hangar hazırlığını gerçek adımlara bağlamak. Vinç uzak/busy ise sade varışın neyi anlattığını korumak. Gözlenmeyen image/Scheduled yüzdesi üretmemek; eşzamanlı workload'ları UID ile ayırmak.
- **Ek bileşen / maliyet / risk:** Operation/owner bağlamlı görsel sunum, orta. Ölü transfer kuyruğu, sahte ilerleme ve gerçek Ready'yi geciktirme riski.
- **Kabul:** Gerçek UI create/dry-run404, scale/restart, uygun Node yok, imagepull, admission/RBAC reddi, context iptali. Canonical Ready görsel transferi beklememeli. Yakın gemide timed vinç/halat/yük ve son cleanup ayrıca kaydedilmeli.

### G05 — Gerçek ağ/flow/protokol veri kaynağı yok (sorular6 ve7)

- **Veri:** Yetkili ve desteklenen bir gerçek provider (ör. zaten kurulu Hubble/flow-log veya mesh telemetry). Gözlem zamanı/tazelik/kapsam/yön/port ve kaynak-hedef Pod UID eşlemesi gerekir. L7 HTTP/gRPC/TLS kapsamı provider yeteneğine bağlıdır; porttan türetilmez. DNS/UDP desteği ayrıca kanıtlanır.
- **Backend:** Provider adapter'ı, sonlu kuyruk/örnekleme, pencere/toplama, erişim ve context izolasyonu, zamanındaki IP→UID eşlemesi, disconnect/stale davranışı. Genel packet capture/shell endpoint'i açılmaz.
- **Frontend:** Selector topolojisini gerçek flow katmanından ayrı ve etiketli sunmak; zaman penceresi/birim/yön/kaynak/örnekleme/eksik veri açıklaması. Ölçüm durunca animasyon güncel trafik gibi sürmemeli. Mesaj içeriği yoksa bilinmiyor kalmalı.
- **Ek bileşen / maliyet / risk:** Collector/provider entegrasyonu gerekir; yüksek ve ortama bağlı. Bu tur kullanıcı kümesine CNI/eBPF/agent kurulmadı. CPU/ağ hacmi, gizlilik ve yetki riski var; particle eklemek veri entegrasyonu değildir.
- **Kabul:** Own cluster'da iki **farklı** aynı-Node Pod ve iki farklı cross-Node Pod arasında istemci trafiği başlat/artır/durdur; gerçek sayaç/provider penceresi ve görsel tepki eşleştir. Bir Pod'un kendi IP'sine HTTP isteği inter-Pod kanıtı değildir. UID/IP reuse, filtre, provider kopması, şifreli L7 bilinmezliği, background trafik ve örnekleme doğruluğu ayrıca sınanmalı. Mevcut cross-node HTTP başarısızlığı başarıya çevrilmemeli.

### G06 — Genel Kubernetes erişimi listeden daha dar; ölçülemeyen yetenekler var (soru5)

- **Veri:** Gerçek API discovery/SSAR, installed addon ve capability; metrics için gerçek metrics-server veya isteğe bağlı zaman serisi sağlayıcısı. Kubernetes'in bütün özellikleri resource listesi değildir.
- **Backend:** Öncelikle G00. Sonra desteklenen controller action listesi ile UI aynı sözleşmeyi kullanmalı. Gateway/VPA gibi kurulu olmayan API'lerin yokluğu uygulama hatası diye gizlenmemeli. In-place resize “istenmiş” ile gerçekten kubelet'e uygulanmış olarak ayrı izlenmeli.
- **Frontend:** Tür/işlem/izin/animasyon ayrımını kullanıcıya doğru anlatmak; desteklenmeyen eylemi gerçekten açıklamak. Generic YAML özel3D veya tüm yaşam döngüsü desteği diye etiketlenmemeli.
- **Ek bileşen / maliyet / risk:** Capability sözleşmesi orta; metrics provider ayrı/ortama bağlı. Admission/immutable hataları ve yetki aşımı riski. Bu iş “bütün Kubernetes'i ekle” açık uçlu göç değildir; CSV'deki somut satırlar esas alınır.
- **Kabul:** Her seçilen ailede ayrı gerçek read/create/edit/delete/action; immutable/RBAC/409/reconnect/DELETE. Ölçüm yokken Veri yok. Native-sidecar/resize/drain/PDB/rollback/CronJob akışları ayrı gerçek test olmadan tamamlandı yazılmamalı.

### G07 — Merkez/control-plane mesaj anlatımı yok (soru8)

- **Veri:** Kavramsal anlatım için mevcut API cevabı, ownerReferences, Pod nodeName/conditions ve Scheduled Event yeterlidir. Birebir RPC için gerçek audit/trace/observability kaynağı ayrıca gereklidir.
- **Backend:** Kavramsal aşamaların kaynağını taşıyan mevcut alanlar korunur; gözlenmeyen controller/RPC aşamaları uydurulmaz. Provider yokken gerçek RPC endpoint'i iddia edilmez.
- **Frontend:** Merkez/API/controller/scheduler/kubelet kavramsal rolleri ve UID ilişkili kısa akış; “temsili” etiketi. Scheduler'ın Node sağlamadığı açık olmalı; provisioning B zinciri ayrı.
- **Ek bileşen / maliyet / risk:** Mevcut sahnede sınırlı sunum orta; gerçek iç RPC telemetrisi yüksek/ayrı entegrasyon. Yanlış mesaj sırası, farklı Deployment'ların karışması ve gizli sahte ilerleme riski.
- **Kabul:** En az iki eşzamanlı gerçek Deployment, scheduling hatası/image hatası, skipped watch aşaması, reconnect ve context iptali; gözlenen/kavramsal adımlar ayrılmalı. Gerçek RPC iddiası varsa provider ölçümüyle korelasyon şart.

## P2 ve henüz runtime doğrulanmamış kaynak riskleri

Bu maddeler doğrulanmış çalışma hatası olarak sayılmadı; maliyeti küçük, hedefli bir sonraki kanıtla öncelikleri netleştirilmeli.

| Aday | Veri / backend / frontend / ek bileşen | Maliyet-risk | En küçük kabul testi |
|---|---|---|---|
| Owner CPU/RAM UI/backend sınırı (soru5, source-only P1 adayı) | Gerçek owner zinciri; UI `resolveController` Job/CronJob/RS çözebilir, backend resources action yalnız Deployment/STS/DS kabul ediyor. Ortak capability hedefi gerekir; ek sistem yok. | Düşük/orta; yanlış kapsamta kalıcı değişiklik veya422 | Standalone RS ve Job/CronJob Pod'unda CPU/RAM aç/dry-run/submit; açık destek gerekçesi veya doğru template hedefi; sahte başarı olmamalı |
| Secret annotation koruması (source-only P0 adayı) | Sanitize/reveal annotations'ı atıyor; fullPUT editte kayıp olasılığı. Amaçlı yetkili akış metadata'yı korumalı; ekstra provider yok. | Düşük/orta; metadata veri kaybı. Kullanıcı Secret'ı bu audit için okunmadı. | Yalnız kendi sentetik Secret'ında metadata-only before/after; bilinmeyen annotation korunmalı, maskeler geri yazılmamalı, değerler artefakta girmemeli |
| Storage slot reclaim (source-only P2) | Mevcut PV/PVC UID; FacilityResources allocationMap DELETE slotlarını boşaltmıyor olabilir. Backend olayları aynı; frontend slot reclaim/reset; ek sistem yok. | Düşük; yeni görsel modülün görünmez kalması | Üç own PV/PVC ekle/sil→yenilerini ekle; tablo ve3D yerleri/UID'ler, canonical sayı, context reset |
| Node ghost pose / failed tilt-cargo uyumu (source-only P2) | Son gerçek render pose; canonical değişmez. Ghost yaw/pitch/roll ve küçük failed tilt ortak dönüşüme bağlanmalı; ek sistem yok. | Düşük; yanlış pozisyon/yön, yanlış UID'yi silme görüntüsü | Hareketli Node DELETE timed video +3D matrix readback; Node False'da cargo gövdeye bağlı kalmalı |
| Ağ çizgisi anchor/namespace/bölge sınırı (source-only P2) | Service selector + görünür Pod/Node kapsamı; backend flow yok. İlk6 dışındaki seçili Service ve görünmeyen hedef için yanlış anchor çizilmemeli; ek provider gerekmez. | Düşük/orta; yanıltıcı topoloji | Yedi Service, namespace filtresi, bölge dışı Pod; her çizginin UID/endpoint'ini gerçek kaynakla karşılaştır |
| Logs endpoint'inde UID yarışı (source-only P0 adayı) | HTTP log isteği raw namespace/name/container kullanıyor, UID önkoşulu yok. Backend optional UID kontrolü ve client request guard; yeni provider yok. | Düşük/orta; aynı ad/yeni UID yarışında yanlış incarnation logu | Eski selected UID/log request sırasında aynı-ad replacement; eski istek yeni Pod'a sessiz bağlanmamalı. Bu tur böyle yarış üretilmedi. |
| Dar kadraj / etiket açıklığı (P2 görsel gözlem) | Mevcut dünya sınırları ve viewport; backend değişmez; kontrollü focus/finder korunur. | Düşük; kamera tercihini kaçırma riski |768px'de kenardaki gemi ve yükü finder/focus ile eriş; panel aç/kapat canvas/kamerayı resetlememeli |
| Node yokken atanmış yükün sahneden kaybolması (P2, runtime gözlemi) | E02 canonical21Pod korunurken görünür11→9→11. `renderPods` olmayan Node adını dışlıyor; backend/Pod phase değiştirilmeden açıkça kayıp-Node ilişkisi gösterilmeli. Ek sistem yok. | Düşük/orta; kullanıcı bunu Pod silinmesi sanabilir, sahte Pending veya yeni Node üretmek daha kötü olur. | Node DELETE, Pod hâlâ API'de nodeName ile mevcut; finder/panel ve açık etiketli görsel erişim sürmeli. Yeni UID ile Node döndüğünde aynı Pod çoğaltılmadan doğru temsil edilmeli. |

## Doğrulama engelleri, geliştirme işinden ayrı

- Yeni üçüncü worker provisioning/join: pause sonrasında minikube profil dosyaları silinmişti. Aynı gerçek worker'ın new UID kaydı test edildi; fresh-worker testi hâlâ eksik.
- Gerçek flow/protokol ve ölçüm grafiği: collector/metrics API yok. Eksik sağlayıcıyı animasyonla veya random seriyle örtmek çözüm değildir.
- Native hidden denemesi: Playwright ile minimize edilen kendi penceremiz `document.hidden` olmadı. Giriş koşulu yokken background E2E geçti denmedi; native, focus-emulation etkisi olmayan ayrı harness yolu gerekir. Ek telemetry kurulumu gerektirmez.
- Native Safari, gerçek Evicted/OOM, native-sidecar, resize/drain/rollback, concurrent context/form iptali ve uzun memory/cleanup çevrimi: bu denetimde çalıştırılmadı. Sonraki doğrulama hedefli olmalı; eski bütün CPU benchmark matrisi gereksiz tekrar edilmemeli.
- Previous-log helper'ındaki eski metin yarışı bulundu; eski case OBSERVED etiketi tek başına kabul edilmedi. Ayrı tek-restart fixture/request/content kontrolü esas alınır. Her yeni test, assertion ile screenshot'ın aynı veriyi gözlediğini doğrulamalı.
