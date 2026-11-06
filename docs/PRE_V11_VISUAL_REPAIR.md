# v1.1 öncesi görsel onarım — güncel uygulama ve kabul kaydı

**6 Kasım 2026: v1.1 öncesi görsel onarım tamamlandı. Gerçek işlev, ana 49 hücre/20 dakika ve ayrı materyal cleanup kapıları geçti. Aşağıdaki protokol/platform/kapsam sınırları ve P2 okunurluk işleri açıktır.** Sürüm 0.4.0 korunur; v1.1 etiketi, release veya milestone kapanışı yoktur.

Başlangıç çıplak `5cfd30d` değildir: o commit üzerindeki kullanıcı/denetim/performance farkları `26ff6e7` ile korunup gönderildi. Başlangıçta 261 dosyanın hash manifesti ve özel geri dönüş kopyası alındı. Son ürün kaynağı `8768398`, salt okunur tanılama `6bb9dea`, son kabul harness'i `fb50993`; dal `redesign/harbor-workbench`. Dondurulmuş son frontend kaynak SHA-256: `c9f5c8cc1b093fc8ac9f0a4d81f83a12e75fa17a8c3ef4e115a9bf3c6e8c0eba`. Production Go kaynak SHA-256: `40c1aa021a8418d834d9939c2bab2a9d19de1f0fced3bbe769ce8e3429f3843b`. Test binary kimliği her ölçüm manifestindedir; frontend kaynak hash'iyle aynı şey değildir.

Kanıt kökü **D**: `artifacts/pre-v11-repair/repair-20261101T130559Z/`. Aşağıdaki dosya adları bu köke göredir. Tarihsel başarısız denemeler korunur. Gerçek API durum enjeksiyonu, gerçek Kubernetes/sağlayıcı E2E'si ve sentetik replay birbirine çevrilmez.

## Uygulanan doğruluk sınırları

| Alan | Son davranış / kanıt | Sınır |
|---|---|---|
| G00 scope/CR | Authoritative snapshot context+GVR+namespace kapsamına ait. Seçili on-demand GVR lease'i reconnect'te yenilenir; stale/syncing/forbidden/unavailable/not-listed/deleted ayrıdır. `frontend-G00-real-2.json`:6gerçek UI grubu. Aynı UID reconnect, gerçek ve offline DELETE/relist, aynı ad/yeni UID, gerçek RBAC kaybı/geri alma, namespace/context sınırları geçti. |32kapsam/1000tombstone; eski CR'ler sınırsız saklanmaz. resourceVersion opak kimliktir. |
| Log UID | Beklenen Pod UID+oturum başlıkları, açılış/ilk publish doğrulaması, watch iptali ve8KiB staging. `backend-real-log.txt` replacement'ı gerçekten araya sokar; eski istek yeni UID satırını yayımlamaz. UI eski metni kimlik değişiminde hemen temizler. | Kubernetes log API'si namespace/name ile adreslenir; atomik UID-pinned stream garantisi yoktur. Doğrulama/watch arasındaki bu API sınırı gizlenmez. |
| Secret | Yalnız sentetik Secret ile yetkili reveal/edit; bilinmeyen metadata ve gerçek data korunur; bulk sanitize ve maskeli değer reddi. `backend-real-resources-mutation.txt`. | Değerler genel state/kanıtlarda yoktur. Reveal ayrı yetkili istek olmaya devam eder. |
| CPU/RAM hedefi | UI/backend aynı capability hedefUID'sini kullanır. Gerçek D/STS/DS template değişimi202; standalone RS/Job/CronJob422 ve açık gerekçe. | Gated-template testi tam rollout başarısı değildir. Request/limit/kullanım/allocatable farklıdır; OnDelete/paused/partition etkisi açıklanır. |
| Snapshot kökeni | Scoped snapshot'taki eski UID'ler ilk görüldüğünde baseline'dır; canlı ADD ve bilinen Pending→assigned geçişi korunur. `snapshot-origin-real.json`: eski2Pod için active/queue/process=0. | Tarihsel provisioning journal yalnız güncel görsel oturumdaki doğrulanmış istekte snapshot istisnası olur. |

## Sekiz kullanıcı sorusunun güncel sonucu

| No | Uygulama / gerçek E2E / animasyon | Kullanıcı yolu | Kanıt ve önemli sınır |
|---|---|---|---|
|1| Uygulandı; gerçek worker stop→doğalUnknown→sameUIDrecovery, ayrı gerçek API False enjeksiyonu→alev/duman/5,5sn batma→recovery | Gemi → Node; arızada üst işaret ve Pod listesi erişilebilir | `node-visual-real.json`, `node-fire-final-2.json`. False doğal fiziksel arıza diye sunulmaz. Backend kesintisi Node arızası değildir. |
|2| Uygulandı; gerçek iki-container Pod'da yalnız hatalı kutu düşer, aynı UID recovery yeniden yükler; sağlıklı kutu/restart0 korunur | Kutu → Pod/container → durum/log | `frontend-container-preparation-2.json` ve final vinç kaydı. CrashLoop bir container durumudur. Completed/init başarısı düşmez. Gerçek OOM/Evicted üretimi yapılmadı; replay/unit desteği gerçek E2E diye yazılmaz. |
|3| Uygulandı; uygulamadan gerçekten yeni minikube worker makinesi+NodeUID+Ready, ardından kızaktan suya iniş/filoya katılım | Merkez → Bağlantı ve yetki → Sağlayıcılar / Worker ekle | `provision-final-2.json` ve `provision-final-2-visual-review.json`: yeni Docker`018543…`, Node`f61df3b2…`; aynı key202aynı işlem, farklı eşzamanlı key409. Güvenli giriş aralığı~30sn beklenmiştir; Ready bu beklemeyi izlemez. |
|4| Uygulandı; server dry-run gerçek kaynak yaratmaz; gerçek Deployment→RS→Pod sahipliği, Pending/atama/Ready ve vinç devri ayrı | Merkez → Uygulama oluştur; gemiden oluşturma required NodeAffinity/matchFieldsmetadata.name kullanır | `frontend-container-preparation-2.json`, `frontend-final-crane-envelope-3.json`; yük halatı ve transfer videosu açıldı. Gözlenmeyen image indirme ilerlemesi uydurulmaz. |
|5| Somut katalog ve capability düzeltildi; kapsam **kısmi** ve işlem bazında kayıtlı | İlgili tesis/gemi/kutu → tablo/ayrıntı/YAML/form | [VISUAL_FEATURE_MATRIX.csv](VISUAL_FEATURE_MATRIX.csv), backend/frontend gerçek kayıtlar. Generic YAML özel3Dtemsil değildir; kurulu olmayan Gateway/VPA ayrı durumdur. |
|6| İlk gerçek Hubble sağlayıcısı uygulandı ve aynı/farklı Node'da gerçek iki-Pod trafiği sahneye bağlandı | Görünüm → Ölçülmüş trafik; ağ tesisi → Ölçülmüş trafik; ok → akış ayrıntısı | `traffic-visual-final.json`:8→40başarılı istek çifti;10sn flow-observation penceresi295→1354. Paket/byte/bant genişliği değildir.12sn duruşta0. |
|7| TCP ve gerçek kaynakta varsa HTTP/L7; DNS/UDP gerçek provider/API zincirinde doğrulandı | Akış oku veya klavye erişimli akış listesi → kaynak/hedef/protokol/zaman/sınırlar | `backend-protocol-real-172201Z`, `traffic-provider-recovery-real.json`. L3/L4 alanından HTTP çıkarılmaz. DNS testindeki zaman aralığı doğrulanamayan UID'ler null. TLS/gRPC payload gözlemi veya tüm protokoller iddiası yoktur. |
|8| Gerçek durumdan türetilmiş, açıkça **temsili** merkez/API/controller/scheduler/kubelet süreci uygulandı | Merkezden oluştur → ilgili yük/süreç işareti → gerçek kaynak | `frontend-control-plane-real.json`:0,873sn arayla2Deployment, farklı işlem/owner/PodUID zincirleri, en çok7aktör→0. İç RPC/paket ölçümü değildir; scheduler Node sağlamaz. |

Tam rapor: [VISUAL_FEATURE_AUDIT.md](VISUAL_FEATURE_AUDIT.md). Açık sınırlar ve sonraki işler: [VISUAL_FEATURE_GAPS.md](VISUAL_FEATURE_GAPS.md). Yukarıdaki8başlığın uygulanmış çekirdeği, bütün Kubernetes yeteneklerinin eksiksiz erişimi anlamına gelmez.

## Korunan işler ve son doğrulamalar

- **129/129 frontend**, **26/26 benchmark** testi; current Go tam paket testleri ve traffic/server/provision race geçti. Race ve kısa pilotlar performans sonucu değildir.
- Gerçek kubeconfig/API/watch/store; canlı boş mod; Deployment create/scale/restart; Pod deletion/controllerreplacement/finalizer/yeniUID; doğru app/init/ephemeral/previouslog; cordon/uncordon; mevcut non-TTYexec ve HTTPport-forward korunur. Exec tamTTYterminal, HTTPforward genelTCP/UDPtüneli diye sunulmaz.
- Gerçek backend kapıları: CronJob suspend/resume/run-now→Completed, native-sidecarAlwayslog, Podresize202sonrası gerçekstatusCPU40m sameUID, ikiRSrevizyon rollback, PDBevictionret→izin→oldPodUIDyok. `backend-final-20261101T163729Z` son reader403nedeniyle aggregateexit1'dir; ayrı düzeltilmiş `backend-hubble-reader-163936Z` PASS bunu silmez.
- Metrics yokluğunda unavailable/error; addon kurulduktan sonra son gerçek API okumasında **3 Node ve 3 Pod** ölçümü alındı (`final-actual-metrics.json`). Daha erken 3/0 kaydı korunur. Bu API kanıtı, bütün dolu Pod grafiklerinin normal UI kabulü değildir.
- Chromium ve PlaywrightWebKit: odaklı yön tuşları, bırakma/blur, form/finder/wheel izolasyonu,1440/1280/768canvas korunumu, hareketli container seçimi, motion/theme.72kontrast ölçümü: gereken metin/sınır/focus hedefleri geçti. NativeSafari27.0.1 yalnız kurulu; gerçek Safari işlev/performance **N/A**.
- Gerçek OS minimizasyonunda document.hidden=true60,002sn;0JSdraw/su/seyir ilerlemesi, güvenli dönüş ve doğru PodUID. Sentetik visibilityevent değildir.
-3gerçekPVC/PVcreate→Bound→DELETE→PVreclaim çevrimi; slotlar geri kullanıldı. SonGPU33geometri/3texture kararlı. Bu kapasite/metadata desteğidir, storageI/Otelemetrisi değildir.
- Hubble mTLS forward gerçekten kesildi: stale+zamanlı sonveri,15→0renderedflow, Nodefault0; aynı lease ile yeni gözlem toparlandı. Video35,52sn ve8/17/28sn kareleri açıldı. Tarihsel okların kısa süre sabit gösterilmesi canlı trafik iddiası değildir.

## Güvenli ortam, maliyet ve tekrarlama

Yalnız bu göreve ait `kv-repair-1101`, Kubernetes1.35.1, minikube1.38.1/Docker29.5.3/containerd, Cilium+Hubble1.20.2 kullanıldı. KümeUID `a24740ba-cf3e-461d-b5b3-250deeb060d7`; testnamespace`kv-repair-qa`, ayrı testnamespace'leri etiketi ve UID önkoşuluyla temizlendi. Kullanıcının mevcut CNI'si/üretim kümesi/DBcontainer'ları değiştirilmedi. Kubeconfig/TLS/journal yalnız `.git/kv-repair-runtime/` içindedir ve repoya konmaz.

```sh
# Geliştirme: Vite proxy + Go gateway, varsayılan saltokunur.
./start.sh
# Yerel yazma, yalnız bilinen testcontext'iyle: gateway gerçek API yetkisini ayrıca denetler.
KUBECONFIG=/özel/lab-config KUBE_CONTEXT=lab READ_ONLY=false ./start.sh
# Production: aynı-origin statikfrontend + ws/wss; credentialtarayıcıya taşınmaz.
npm --prefix frontend ci
npm --prefix frontend run build
go -C backend build -o ../bin/tersane-backend .
STATIC_DIR="$PWD/frontend/dist" KUBECONFIG=/özel/lab-config KUBE_CONTEXT=lab READ_ONLY=false ./bin/tersane-backend
```

`READ_ONLY=false` mutasyonu açar; cluster yetkisini vermez. `STATIC_DIR` gerçek build yoludur; `PORT` gateway portunu, `API_TARGET` yalnız Viteproxyhedefini ayarlar. Sabit8000logURL'si yoktur. Worker/Hubble için README'deki operator tarafından sabitlenmiş `KV_MINIKUBE_*`/`KV_HUBBLE_*` ayarları gerekir; provider yoksa UI gerekçeyi gösterir. Minikube adaptörü serbest shell/hostkomutu kabul etmez. HubbleTLSbağlantısı namespace yetkisi vermez.

Son ölçümler için dondurulmuş source/build ve mevcut harness kullanılıyor. Kullanıcının pille devam kararıyla **`repair-final-battery-20261106`** yeni eşleşmiş oturumu açıldı. Eski AC oturumundaki 21 geçerli hücre korunur ve yeni pil dağılımlarına katılmaz. Sonlu kuyruk 49 hücre / 27 seri iş içerir: üç eşleşmiş blok, 30 sn ısınma + 60 sn ölçüm, medium/DPR 1, aynı viewport/su/seyir/görünür kaynak kapsamı; ayrıca olay/etkileşim ve bir 20 dakika karma koşusu. Otomatik tekrar yoktur. Güç, source/build veya tarayıcı değişirse sonraki iş başlamaz. Gerçek provider OFF/ON maliyeti ayrı AC oturumunda, aynı gerçek trafik üreticisiyle ölçüldü. Yeni efektin ek maliyeti optimizasyon kazancı diye sunulmaz. Ana 49 hücre ve 20 dakika kapısı geçti; doğrudan materyal envanterli son tanılama da geçti. Aşağıdaki tarihsel ölçümler yeni kabulün yerine kullanılmaz.

### Gerçek Hubble katmanının ayrı maliyeti

1 Kasım AC oturumu, aynı gerçek 3 Node / 3 test Pod'u, medium / DPR 1 / 1440×900 ve tarayıcıdan bağımsız saniyede iki başarılı istek çiftiyle alındı. Üç eşleşmiş OFF/ON bloğunun her hücresinde 30 sn ısınma + 60 sn ölçüm ve tam 120 başarılı istek çifti var. Bu, yeni ağ katmanının **özellik maliyetidir**; eski/yeni ürün optimizasyonu değildir. [Ham özet ve eşleşmiş farklar](../artifacts/pre-v11-repair/repair-20261101T130559Z/traffic-cost-summary.json).

| Ölçüm | Trafik katmanı kapalı | Trafik katmanı açık | Yorum |
|---|---|---|---|
| İlgili browser süreçleri CPU, çekirdek | 0,3985 (0,2778–0,4220; n=3) | 0,4143 (0,3539–0,4363; n=3) | Eşleşmiş farklar +0,1365 / −0,0681 / +0,0378; tutarlı browser CPU farkı kanıtlanmadı. |
| Go gateway kendi CPU'su, çekirdek | 0,00218 (0,00174–0,00225; n=3) | 0,01753 (0,01542–0,01800; n=3) | Hubble child süreç CPU'su bu satıra dahil değil. |
| Hubble CLI collector CPU, çekirdek | 0 | 0,01285 (0,01138–0,01327; n=3) | Kapanışta lease silindi, child süreç sayısı 0. |
| JS çizim/sn medyanı | 60,002 | 59,999 | Fiziksel sunum FPS'i değildir. |
| Tekrar p95 / p99 aralık medyanı, ms | 17,6 / 17,7 | 17,7 / 17,9 | Yeni katman açıkken çizim bütçesi korundu. |

İlk ayrı koşu `traffic-cost-final-20261101T184158826Z`, kamera değiştiği için bütünüyle reddedildi; geçerli sete alınmadı. Geçerli oturum `traffic-cost-final-20261101T184714650Z`dir. macOS sampler Mach tick'lerini nanosaniyeye çevirerek gateway/child CPU zamanını ayrı ölçer; süreç kimliği ve cleanup doğrulanır. Docker lab maliyeti yalnız zamanlı Node container örnekleriyle kaydedildi; 60 saniyelik ortalama cluster CPU veya toplanmış fiziksel RAM sonucu değildir. Bu AC gerçek-küme seti, yeni pil M/L replay dağılımıyla birleştirilmez.

### 6 Kasım gerçek UI yeniden doğrulaması ve temizlik

[`frontend-final-failures-20261106T102147Z.json`](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-final-failures-20261106T102147Z.json) ilk koşusu 7 PASS / 1 FAILED olarak korunur. Gerçek formdan dry-run ve kaynak yokluğu, create/owner zinciri, scale, Unschedulable, image-pull hatası, dry-run sonrası quota admission reddi ve gönderilmemiş taslağın context değişimi sınandı. Bir PASS, ürün kaynak eşitliği doğrulanarak yeniden kullanılan önceki gerçek RBAC kanıtıdır; yeni RBAC UI koşusu diye sayılmaz.

Restart assertion'ı doğru biçimde canonical state'te duran Terminating eski Pod'ları da yeni hazır Pod kontrolüne katmıştı. Ürün değiştirilmedi. Yalnız bu assertion'ın düzeltildiği [ayrı 17,52 sn restart koşusu](../artifacts/pre-v11-repair/repair-20261101T130559Z/frontend-restart-recovery-20261106T102612Z-review.json), iki eski UID'nin DELETE olayını, yeni ReplicaSet/iki yeni Ready Pod UID'yi ve değişmeyen Node UID'yi doğruladı. Diğer geçen gruplar tekrarlanmadı. Her iki koşunun kaynak hash'leri aynı; sayfa hatası yok; test namespace ve Deployment'ları UID/RV önkoşuluyla silindi ve 404 gözlendi.

[Panel piksel/actionability tanılaması](../artifacts/pre-v11-repair/repair-20261101T130559Z/panel-pixel-actionability-20261106T103034426Z.json): aynı sentetik M çalışma kümesinde 20 aç/kapat çevrimi; başlık PNG readback üst sınırı p95 55,71 ms, visible/enabled sekme ve kapatma trial üst sınırı p95 87,34 ms. Fiziksel sunum gecikmesi ölçülmedi (`physicalPresentedLatencyMs=null`); bütün kontrollerin kullanılabilirliği veya 20 dakika karma kabulü yerine geçmez. PNG'ler açılıp incelendi.

Ölçüm öncesinde yalnız bu çalışmanın üç trafik Pod'u ve tek CiliumNetworkPolicy'si tam UID/RV ile temizlendi, her biri için API 404 gözlendi. Sahip olunan üç lab makinesi durduruldu; kullanıcıya ait container'lar korunur. [Devam oturumu ve temizlik kayıtları](../artifacts/pre-v11-repair/resume-20261106T1015Z/measurement-state.json).

## 6 Kasım — kabul edilmiş 49 hücrelik pil ölçümü

Ana kuyruk **49/49**, karşılaştırma `valid=true`, `reasons=[]` olarak tamamlandı. Mac17,3 / Apple M5 (10 çekirdek, 32 GB), macOS27.0.1 (26A434), Chromium156.0.8078.4 / Metal, 60 Hz; 1440×900 CSS ve framebuffer, gerçek ekran backing2940×1912, emüle/renderer DPR1. Low-power kapalı; browser energy-saver yalnız geçici test profilinde kapalı. Native Safari performansı ve bu yeni kaynaktaki native Retina/DPR2 karşılaştırması N/A.

M=20Node/300Pod canonical,8gemi/120Pod görünür; L=50/1500 canonical,8/270 görünür; S=5/50. Aynı seed/fixture, kamera, seçili NodeUID ve başlangıç filo fazı, medium, gölgeler, su/seyir ayarı korundu. Ana panel/efekt/dünya kıyasında hareket açık; yalnız açıkça etiketli idle koşusunda kapalıdır. Snapshot-order, opaque resourceVersion, bütün nesne içeriği/digest, PID doğum kimliği/CPU monotonluğu, saat ve kaynak/build kapıları geçti. İki sürümün sırası bloklarda AB/BA/AB, panel sırası kapalı/açık–açık/kapalı–kapalı/açık. Ağır profil/video/GPU sorgusu ana CPU setinde yoktur.

[Kesin karşılaştırma](../benchmarks/results/repair-final-battery-20261106/comparison.json) · [İş kuyruğu ve manifest kimlikleri](../benchmarks/results/repair-final-battery-20261106/queue.json). Her hücre 30sn ısınma+60sn ölçüm; n=3 bağımsız eşleşmiş blok. Sondaki tek uzun koşu 1200,106sn ölçümdür. Tam ham ölçümler aynı run-id dizinlerindedir; eski 21 AC hücresi bu dağılımlara katılmadı.

Oturum: `repair-final-battery-20261106`. Kalite medium, DPR 1, Chromium / Metal; pil. Medyan (min–max; n). CPU çekirdek eşdeğeridir. Baseline/final farkı yeni işlevlerin maliyetini de içerir; optimizasyon yüzdesi değildir.

| Senaryo | Browser CPU önce | Browser CPU sonra | Son JS çizim/sn | Son p95 / p99, ms | Son en büyük browser PID RSS, MiB | Son JS heap, MiB |
|---|---|---|---|---|---|---|
| M / panel kapalı | 0.4527 (0.4395–0.4872; n=3) | 0.4379 (0.4206–0.4612; n=3) | 59.99 (59.99–60.00; n=3) | 18.60 (17.70–18.70; n=3) / 19.00 (18.10–19.10; n=3) | 317.9 (316.2–320.6; n=3) | 23.7 (20.8–24.7; n=3) |
| M / panel açık | 0.4325 (0.4138–0.4387; n=3) | 0.4143 (0.3885–0.4206; n=3) | 60.00 (59.99–60.01; n=3) | 18.60 (17.60–18.60; n=3) / 18.70 (17.90–18.80; n=3) | 334.1 (321.4–353.8; n=3) | 26.8 (19.2–31.0; n=3) |
| M / tek Node arızası | 0.4363 (0.4229–0.4512; n=3) | 0.4336 (0.4228–0.4424; n=3) | 60.01 (60.00–60.01; n=3) | 18.60 (18.60–18.70; n=3) / 19.00 (19.00–19.00; n=3) | 285.6 (285.0–338.2; n=3) | 30.1 (28.3–88.5; n=3) |
| M / tek container arızası | 0.4489 (0.4237–0.4579; n=3) | 0.4519 (0.4404–0.4586; n=3) | 60.01 (60.01–60.01; n=3) | 18.60 (18.60–18.60; n=3) / 19.00 (18.90–19.00; n=3) | 282.9 (273.7–283.9; n=3) | 28.4 (22.7–29.5; n=3) |
| M / kısa çoklu olay | 0.4303 (0.4299–0.4405; n=3) | 0.4465 (0.4312–0.4469; n=3) | 60.01 (60.01–60.03; n=3) | 18.60 (17.70–18.60; n=3) / 19.00 (18.10–19.00; n=3) | 314.4 (312.4–318.3; n=3) | 22.7 (21.1–38.0; n=3) |
| M / hareket kapalı idle | 0.0035 (0.0032–0.0042; n=3) | 0.0040 (0.0035–0.0043; n=3) | 0.02 (0.02–0.02; n=3) | N/A / N/A | 243.9 (243.9–244.0; n=3) | 15.9 (15.9–16.0; n=3) |
| L / dünya | 0.4580 (0.4535–0.4605; n=3) | 0.4586 (0.4560–0.4637; n=3) | 60.00 (59.99–60.00; n=3) | 18.70 (18.30–18.70; n=3) / 19.30 (19.00–19.40; n=3) | 306.7 (279.0–353.1; n=3) | 22.0 (21.1–77.3; n=3) |
| M / normal + burst veri | N/A | 0.5030 (0.4873–0.5057; n=3) | 60.00 (59.99–60.00; n=3) | 18.80 (18.60–19.20; n=3) / 19.90 (19.10–21.70; n=3) | 343.6 (341.8–370.0; n=3) | 37.1 (29.2–38.8; n=3) |
| S / etkileşim | N/A | 0.5264 (0.5116–0.5295; n=3) | 60.00 (60.00–60.00; n=3) | 18.60 (18.60–18.70; n=3) / 18.90 (18.90–19.00; n=3) | 363.1 (348.8–366.7; n=3) | 45.7 (21.5–46.3; n=3) |
| M / 20 dakika karma | N/A | 0.4522 (0.4522–0.4522; n=1) | 60.00 (60.00–60.00; n=1) | 18.60 (18.60–18.60; n=1) / 19.40 (19.40–19.40; n=1) | 425.0 (425.0–425.0; n=1) | 37.6 (37.6–37.6; n=1) |

### Aynı bloktaki açık − kapalı panel CPU farkı

| Blok | Önce kapalı | Önce açık | Önce Δpanel | Sonra kapalı | Sonra açık | Sonra Δpanel |
|---|---|---|---|---|---|---|
| 1 | 0.4872 | 0.4325 | -0.0547 | 0.4206 | 0.4143 | -0.0064 |
| 2 | 0.4395 | 0.4138 | -0.0257 | 0.4379 | 0.3885 | -0.0493 |
| 3 | 0.4527 | 0.4387 | -0.0140 | 0.4612 | 0.4206 | -0.0406 |

baseline Δpanel: medyan -0.0257; aralık -0.0547–-0.0140; n=3.

optimized Δpanel: medyan -0.0406; aralık -0.0493–-0.0064; n=3.

### Ayrı süreç ve gecikme ölçümleri

Go test binary CPU'su fixture/tracker işini de içerir; izole production gateway CPU'su değildir. GPU süreci CPU'su gerçek GPU kullanım yüzdesi değildir. Gecikmeler callback/DOM/rAF/draw proxy ölçüsüdür; fiziksel sunum veya bütün kontrollerin kullanılabilirlik kanıtı değildir.

| Senaryo | Son renderer CPU | Son GPU süreç CPU | Son browser ana CPU | Son Go test CPU | Son callback→store p95 ms | Son callback→draw proxy p95 ms | Son panel DOM / rAF proxy p95 ms |
|---|---|---|---|---|---|---|---|
| M / panel kapalı | 0.2603 (0.2490–0.2729; n=3) | 0.1765 (0.1695–0.1863; n=3) | 0.0010 (0.0010–0.0015; n=3) | 0.0017 (0.0017–0.0018; n=3) | N/A | N/A | N/A / N/A |
| M / panel açık | 0.2403 (0.2333–0.2512; n=3) | 0.1683 (0.1527–0.1728; n=3) | 0.0010 (0.0010–0.0020; n=3) | 0.0017 (0.0015–0.0017; n=3) | N/A | N/A | N/A / N/A |
| M / tek Node arızası | 0.2691 (0.2599–0.2734; n=3) | 0.1627 (0.1602–0.1677; n=3) | 0.0013 (0.0012–0.0022; n=3) | 0.0017 (0.0015–0.0017; n=3) | 0.60 (0.60–1.30; n=3) | 18.60 (12.30–19.50; n=3) | N/A / N/A |
| M / tek container arızası | 0.2764 (0.2729–0.2822; n=3) | 0.1744 (0.1662–0.1752; n=3) | 0.0012 (0.0010–0.0012; n=3) | 0.0017 (0.0017–0.0018; n=3) | 0.90 (0.80–1.80; n=3) | 24.30 (20.70–32.20; n=3) | N/A / N/A |
| M / kısa çoklu olay | 0.2718 (0.2676–0.2729; n=3) | 0.1717 (0.1622–0.1735; n=3) | 0.0013 (0.0010–0.0015; n=3) | 0.0018 (0.0018–0.0020; n=3) | 0.40 (0.30–0.50; n=3) | 16.00 (12.90–20.20; n=3) | N/A / N/A |
| M / hareket kapalı idle | 0.0018 (0.0017–0.0027; n=3) | 0.0003 (0.0003–0.0003; n=3) | 0.0008 (0.0008–0.0015; n=3) | 0.0012 (0.0010–0.0012; n=3) | N/A | N/A | N/A / N/A |
| L / dünya | 0.2845 (0.2830–0.2892; n=3) | 0.1713 (0.1699–0.1726; n=3) | 0.0013 (0.0012–0.0043; n=3) | 0.0017 (0.0017–0.0018; n=3) | N/A | N/A | N/A / N/A |
| M / normal + burst veri | 0.3379 (0.3223–0.3390; n=3) | 0.1598 (0.1594–0.1609; n=3) | 0.0038 (0.0035–0.0042; n=3) | 0.0090 (0.0088–0.0091; n=3) | 0.60 (0.60–0.70; n=3) | 16.70 (16.50–17.10; n=3) | N/A / N/A |
| S / etkileşim | 0.2985 (0.2915–0.2991; n=3) | 0.2113 (0.2024–0.2128; n=3) | 0.0168 (0.0165–0.0173; n=3) | 0.0017 (0.0017–0.0017; n=3) | N/A | N/A | 7.70 (5.70–12.60; n=3) / 17.10 (15.30–17.30; n=3) |
| M / 20 dakika karma | 0.2750 (0.2750–0.2750; n=1) | 0.1709 (0.1709–0.1709; n=1) | 0.0044 (0.0044–0.0044; n=1) | 0.0070 (0.0070–0.0070; n=1) | 0.80 (0.80–0.80; n=1) | 20.20 (20.20–20.20; n=1) | 3.70 (3.70–3.70; n=1) / 17.50 (17.50–17.50; n=1) |

### Karar ve uzun koşu

Açık panel toplam CPU medyanı 0,4325→0,4143 çekirdek; üç eşleşmiş farkın tamamı negatif. Aralıklar örtüşür; frekans/çekirdek yerleşimi ölçülmedi. Bu sette tarihsel açık-panel artışı yeniden üretilemedi. Signed Δpanel iki sürümde de negatiftir; örtülme/compositing etkisi veya cihaz değişkenliği dışlanmış değildir. Negatif fark pozitif yapılmaz; 0,413 tarihsel hedef olarak kullanılmaz. Yeni çoklu arıza anlatımının medyan CPU farkı +0,0162 çekirdektir; ek işlev maliyetidir. L dünya yaklaşık60 çizim/sn korundu; idle medyanı 0,0040 çekirdektir. Bunlar küresel optimum, sıfır tüketim veya ölçülmüş pil/enerji kazancı iddiası değildir. Yeni Worker/WASM/dil göçü uygulanmadı: bu onarımda veri/gecikme bütçeleri karşılandı; GPU/DOM işini başka dile taşımak için toplam net fayda kanıtı yoktur.

20 dakika: **72.007 JS çizimi,60,0005 çizim/sn,p9518,6/p9919,4ms,0uzun görev**.5600 planlanan/uygulanan olay,5567 canlı delta; reconnect aralığında kaçırılan geçmiş replay edilmiş sayılmaz. Son client/upstream/planned nesne içeriği eşit;40/40quiescent sayım kontrolü geçti.3reconnect,329aynı-version informerresync,20/20panel çevrimi ve24/24log isteği kapanışı; açık stream0. Canonical veri animasyonu beklemedi; M/L/latency/proxy kapıları geçti.

RSS tabloda ölçüm sonundaki en büyük browser PID değeridir; toplam fiziksel RAM veya zaman boyu tepe değildir. JS heap doğal GC noktasıdır; retained heap değildir. Geometri/texture/DOM/listener/timer geçmişi ham checkpointlerde tutulur; aynı çalışma kümesi trendi ve doğrudan scene-material envanteri aşağıdaki ayrı tanılamada doğrulandı. Piksel/actionability üst sınırı kaydı yukarıdadır; DOM/rAF proxy fiziksel sunum veya bütün kontrollerin kullanılabilirliği sayılmaz.


### GPU, materyal ve kaynak izleme sınırı

Ayrı `repair-gpu-scene-battery-20261106` tanılaması: 30 sn ısınma + 60 sn, n=1, 31 sentetik olay; 3.602 asenkron GPU örneği, p50 2,444 / p95 2,547 / p99 2,587 ms. Bu süre tüm fiziksel ekran sunumu veya GPU kullanım yüzdesi değildir. Tam canonical imzalar ve görsel hedef/cleanup kontrolü geçti. Sahneden erişilen materyal kimlikleri 43→39, geometri kimlikleri 42→34; renderer.info GPU geometrileri 37→34, texture3→3, shader program cache18→22. Bunlar farklı envanterlerdir; shader cache artışı materyal sayısı diye yazılmaz. Ana CPU dağılımına katılmadı.

Ana uzun koşunun [40 kontrol noktalı trend özeti](../artifacts/pre-v11-repair/resume-20261106T1015Z/primary-long-trends.json): doğal CDP heap 18,86–85,64 MiB, medyan35,46 MiB. İlk panel yeniden açılışından sonraki19 eşit tutulan-log noktasında296 satır; heap18,86–44,33 MiB/medyan35,02; DOM526–544; GPU geometri34–42 ve texture3. Bütün40noktada tek socket/tek stream ve doğru canonical sayım var. Kapanışta logView yok,0açık log, flush timeout0; benchmark dahil interval1, MutationObserver2/ResizeObserver1. CDP listener nesneleri detached/GC bekleyen nesneleri de sayar; aktif uygulama listener sayısı diye sunulmaz. Doğrudan materyal sayaçlı ek 20 dakika aynı mevcut harness ile geçti; off-scene retained materyal/GC garantisi iddia edilmez.

### İşlev testlerini tekrarlama

```sh
# Birim/doğruluk kapıları. Ortam değişkenleri yoksa gerçek-küme testleri SKIP olur.
npm --prefix frontend test
node --test benchmarks/repair-session.test.mjs benchmarks/scene-inventory.test.mjs
go -C backend test ./...
# Gerçek log replacement / sentetik Secret / controller-template testi:
# Yalnız size ait, önceden oluşturulmuş kv-repair-* namespace ve loopback test API.
KUBECONFIG=/ozel/lab-kubeconfig \
KUBEVIEW_REPAIR_CONTEXT=kv-repair-SIZE_AIT_PROFIL \
KUBEVIEW_REPAIR_CLUSTER_UID=KENDI_KUBE_SYSTEM_UID \
KUBEVIEW_REPAIR_NAMESPACE=kv-repair-SIZE_AIT_NAMESPACE \
go -C backend test ./pkg/server \
  -run '^TestOwnedRepairReal(LogUIDReplacement|SyntheticSecretMetadataRoundTrip|TemplateCapabilityTargets)$' -count=1
```

`KUBEVIEW_REPAIR_CLUSTER_UID` testten önce gerçek `kube-system.metadata.uid` ile eşleştirilir; beklenmeyen cluster/prefix/endpoint reddedilir. Gerçek testler kaynak yaratır/siler; sıradan `go test` çıktısındaki SKIP, gerçek E2E başarısı değildir. Hubble, resize, PDB/drain ve provisioning için ilave açık envanter/NodeUID/provider koşulları ilgili `repair_*_integration_test.go` dosyalarında bulunur. UI yardımcıları kanıt dizinindeki `repair-ui.mjs` ve güvenli runtime metadata'sını kullanır; özel kubeconfig/TLS malzemesi repoda değildir. Ölçüm komutları ve bayrakların anlamı [PERFORMANCE.md](PERFORMANCE.md) içindedir. Dondurulmuş build etiketleri yerel oluşturulmuş dosyalardır; aynı etiketi başka build'e vermek byte eşdeğerliği sağlamaz. Her yeni deneme yeni run-id ve manifest almalıdır.

### Son materyal/cleanup kabulü ve teslim sınırı

[`repair-material-long-battery-20261106`](../benchmarks/results/repair-material-long-battery-20261106/summary.json) ayrı tanılaması da geçti: 40 checkpoint, 20 panel çevrimi, 24/24 log kapanışı, 3 reconnect / 329 resync, tam canonical/upstream/planned eşitliği. Aynı dondurulmuş frontend/Go binary, browser ve pil kimliği doğrulandı. 59,9974 JS çizim/sn; p95 18,9 / p99 21,5 ms. Bu ek sayaçlı koşu ana CPU eşleşmelerine katılmadı.

Sahneden erişilen materyaller 40–44, geometriler 35–43; renderer.info geometrileri 33–41, texture 3, shader program cache 21–22 aralığında kaldı. İlk panel yeniden açılışı sonrasındaki 19 benzer tampon noktasında 295–296 log satırı, doğal CDP heap 19,43–44,30 MiB ve DOM 526–544 gözlendi. Materyal sayısı tekrar 40'a döndü; kapanışta farklı gerçek hata durumlarıyla 42 materyal/38 sahne geometrisi vardı. Bu ölçülen sürede sınırsız artış görülmedi; bütün off-scene kaynakların toplandığı veya mutlak sızıntı yokluğu kanıtlanmış sayılmaz. [Denetim ve sınırlar](../artifacts/pre-v11-repair/resume-20261106T1015Z/material-cleanup-review.json).

129 frontend testi, 26 önceki benchmark doğruluk testi ve odaklı Go/race kanıtları ürün source kimlikleriyle korunur. Bu devam oturumunda 14 kabul-harness testi + 3 yeni saf envanter testi geçti; yalnız override materyal kapsamı eklenen helper grubu tekrar doğrulandı. Yeni frontend/backend ürün davranışı veya sürüm değişikliği bu son ölçüm turunda yapılmadı.

Kalan somut sınırlar: native Safari performansı ve yeni kaynak için Retina/DPR2 karşılaştırması N/A; gerçek OOM/Evicted/ephemeral arıza E2E'si kapsam dışı; gRPC/TLS içerik/latency'si sağlayıcı vermiyorsa bilinmiyor; atomik UID-pinned log API garantisi yok. Container orta uçuş etiketi ve yoğun trafik durum başlığının kenarda kırpılması P2 olarak [eksik listesinde](VISUAL_FEATURE_GAPS.md) kalır. Bunlar bütün Kubernetes veya protokol kapsamının tamamlandığına çevrilmez.

Kaynak/test aşamaları `26ff6e7`, `74294d8`, `f090c59`, `3d86656`, `8768398`, `6bb9dea`, `fb50993` olarak doğru uzak geliştirme dalına gönderildi. Bu rapor/test/kanıt teslimi aynı `redesign/harbor-workbench` dalında ayrı anlamlı commit'tir; son kimlik için `git log -1` ve `git ls-remote origin refs/heads/redesign/harbor-workbench` karşılaştırılır. Force push, sürüm yükseltme, tag/release veya milestone kapanışı yapılmadı. Tarihsel ham kayıtlar, kullanıcı değişiklikleri ve referanslar korunur; yalnız açıkça seçilen kanıt dosyaları stage edilir. Sahip olunan lab test kaynakları UID/RV ile temizlenip 404 gözlendi; üç makine durdurulmuş olarak tutulur. Kullanıcı container'larına müdahale edilmedi.

---

## İlk çalışma kaydı — tarihsel ara durum (aşağıdaki açık maddeler o andaki durumdur)

# v1.1 öncesi görsel onarım — çalışma kaydı

2026-11-01. **Çalışma sürüyor; v1.1 tamamlanmış değildir.** Sürüm/etiket/release oluşturulmadı.

Başlangıç: `redesign/harbor-workbench`, `5cfd30d7e0d6202bc1bd19dd8d0e4979fa2d5e8f` + denetim/performance/kamera değişiklikleri. Bu ağacın hash manifesti ve özel geri dönüş kopyası `artifacts/pre-v11-repair/repair-20261101T130559Z/start-manifest.json` ile `.git/pre-v11-start-20261101T130559Z/` altında. Mevcut güvenli commitler ve denetlenmiş başlangıç `26ff6e7` uzak geliştirme dalına gönderildi. Tarihsel benchmark dosyaları değiştirilmedi.

## Mimari ve iş sırası

Aktif yol Go `pkg/server/stream.go` bağlantı başına informer/cache → kapsamlı snapshot/delta → tek frontend store → tam ekran HarborScene ve nesne panelleridir. Eski `pkg/websocket/hub.go` aktif ağ geçidi değildir. İlk iş yanlış silinme/log/metadata/owner hedefini düzeltmek; ardından sınırlı görsel yaşam döngüsü, yerel gerçek worker sağlayıcısı, gerçek Hubble akışı ve kabul ölçümleridir. Canonical kaynaklar animasyon bitişini beklemez.

| Alan | Güncel kanıt | Henüz tamamlanmayan kabul |
|---|---|---|
| G00 scoped CR | Gerçek catalog/reconnect/DELETE/offline-delete/relist/yeni UID/RBAC/namespace/context: `frontend-G00-real-2.json`, 6 grup geçti | Son kaynak kimliğiyle regresyon/perf |
| Log UID | Gerçek replacement opening ve first-publish yarışı: `backend-real-log.txt`; yeni UID satırları bastırıldı | Kubernetes logs API atomik UID garantisi sunmaz; kalan yarış sınırı belgelenecek |
| Secret / kaynak hedefi | Sentetik Secret metadata korunumu ve gerçek D/STS/DS template değişikliği; RS/Job/CronJob açık 422: `backend-real-resources-mutation.txt` | Tam rollout bu gated testte ölçülmedi |
| G01–G02 | Ortak bounded koordinatör/Node batma/tek-container düşüşü; 48 harbor unit testi | Gerçek olayla video ve recovery/cleanup |
| G03 | İzinli minikube adaptörü, journal/lock/idempotency; test kümesi `kv-repair-1101` | İlk iki gerçek UI denemesi güvenli ön kontrolde reddedildi; gerçek yeni worker henüz doğrulanmadı |
| G04/G07 | Owner UID ve gerçek durumdan türetilmiş süreç, vinç devri | Gerçek form/işlem videosu ve eşzamanlı workload kabulü |
| G05 | Hubble1.20.2 CLI/protobuf adaptörü; gerçek lab Cilium1.20.2 + mTLS relay | Aynı/farklı Node gerçek iki-Pod trafiği ve yetki kapsamı |
| G06 | Scope/namespace ve template capability düzeltmeleri | Metrics/addon/işlem envanteri güncellemesi |
| Performans | Dondurulmuş başlangıç M: 12, L:3 hücre; 30s ısınma+60s ölçüm, n=3, medium/DPR1 | Son sürüm eşleşmiş ölçüm, yeni efekt/collector maliyeti ve20dk karma koşu |

Kanıt kökü: `artifacts/pre-v11-repair/repair-20261101T130559Z/`. Unit/replay, gerçek API durum enjeksiyonu ve gerçek Kubernetes/traffic E2E ayrı değerlendirilir. Henüz açılmamış video dosyası görsel kabul sayılmaz. Sağlayıcı anahtarları/kubeconfig/TLS dosyaları yalnız `.git/kv-repair-runtime/` içinde, rapor/repoda değildir.

## Güvenli test ortamı ve önceki başarısızlıklar

Yeni lab yalnız bu iş için oluşturuldu: Kubernetes1.35.1, minikube1.38.1, docker/containerd, küme UID `a24740ba-cf3e-461d-b5b3-250deeb060d7`. Kullanıcının kümelerinde CNI/Node değişikliği yapılmadı. Containerd ile `--cni=false` ilk minikube ön kontrolünde reddedildi; boş kendi lab'ı bridge ile başlatılıp Cilium kurulumu yapıldı. Relay'in eski bridge ağıyla başlayan Pod'u yalnız bu yeni lab'da yeniden başlatıldı; mTLS sağlık kontrolü geçti.

İlk worker UI isteği minikube profilinin primary Node adını boş kaydetmesi ve ilk local kubectl cache gereksinimi nedeniyle reddedildi. Profil adı normalizasyonu ve sabit profile `kubectl --ssh` okuması eklendi. İkinci deneme Docker29'un küçük harfli `no such object` yanıtını tanımayan ön kontrolde reddedildi; henüz worker oluşmadı. Başarısız kayıtlar korunur; yeni koşu ayrı run adı kullanır.

## İkinci doğruluk kontrolü — gerçek trafik protokolü

İlk trafik UI koşusu `traffic-visual-real.json` kaynak/hedef UID'leri ve yük artışını doğruladı, fakat bütün kayıtları HTTP sınıflandırdığı için kabul edilmedi. Gerçek whitelist CLI örneğinde Hubble maskesi L3/L4 olayına boş/önceki HTTP alanı bırakıyordu. Düzeltme `Type=L7` + tanınan L7 türü + gerçek record varyantı ister; TCP/UDP'de eski L7 alanları atılır. URL/header/query maskede yoktur. `backend-protocol-real-172201Z` gerçek Cilium/Hubble mTLS → decoder → HTTP API zincirinde TCP'nin L7 alanı olmaması, gerçek HTTP/1.1 response200/latency ve DNS/UDP'yi doğruladı. Ağ tesisine aynı authorized veriyi kullanan klavye erişimli ölçülmüş akış sekmesi eklendi;512kayıt UI fixture'ının9kontrolü gerçek Hubble E2E yerine sayılmaz. Son gerçek sahne kabulü ve performans hâlâ açık.

## Scoped snapshot görsel kökeni

`provision-final.json` başlangıcında aynı UID'li71/74dakikalık Pod'lar namespace default→qa snapshot'ında yanlış yeni yük sayılıp2transfer/6sinyal üretmişti. `snapshotUIDs` son gerçek snapshot kapsamını kararlı bir Set olarak taşır; ilk görülen snapshot kaynakları baseline, sonraki canlı ADD veya bilinen Pending→assigned gerçek geçiştir.17store/56harbor testi ve tam frontend testleri geçti. Önceki katılım helper'ı50sn sonunda hareket yeni başlamışken kapanmıştır; kilit yok, eski yüklerin yanlış yanaşması güvenli giriş penceresini uzatmıştır. Bu başarısız kabul kaydı korunur; güncel yeni worker kabulü henüz açık.
