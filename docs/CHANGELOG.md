# CHANGELOG.md — Değişiklik Kaydı

## 2026-11-09 — gerçek UI ve bağlantı toparlanma düzeltmeleri

- WebKit'te mouse ile açılan Bul penceresinin ESC sonrası BODY'ye odak dönmesi düzeltildi; gerçek açan düğme ve geçerli fallback ortak focus helper'ıyla korunur.156/156 frontend unit; gerçek WebKit tekrarı ayrı kabul kapısıdır.
- İzole gerçek API test yardımcıları CR scope/UID/RBAC, Hubble mTLS ve minikube güncel yönetim sınırlarını yeniden üretir. Genel Go/race koşuları ve45/45 harness unit geçti; opt-in SKIP gerçek test başarısı sayılmaz. Mevcut benchmark kuyruğuna sonlu31hücre v1.1 alt kümesi ve frozen build'in gerçek lockfile kimliği eklendi; yeni CPU sonucu henüz yoktur.
- CPU/RAM/edit ilk GET'i bitmeden alanlar native disabled fieldset ile kilitlenir; header/ESC kapatma çalışır. Gerçek GET geciktirilerek dört alan, dry-run ve gerçek rollout/restart/replacement/delete doğrulandı.
- Aynı source/UID dirty taslak reconnect/reveal sonrasında korunur; resourceVersion sessiz ilerlemez, değişirse gözden geçirme uyarısı verilir. Yeni socket açılışında yönetim tanılaması fail-closed yenilenir; eski serial'dan gelen diagnostic/enable yanıtları reddedilir. İki gerçek transport/grant-revocation hatası önce FAIL kaydedilip düzeltme sonrası aynı akışta PASS oldu.153/153frontend unit.
- Gerçek Node ve Pod grafiklerinde timestamp/unit ve çizilen ham değerler Metrics API ile eşleştirildi. Gerçek G00 scoped reconnect/UID/offlineDELETE/RBAC6alt; minikube güncel gate6alt (yeniNode0); Hubble readonly mTLS/same-crossNode TCP/scope/retry/expiry/cleanup7alt geçti. İlk iki Hubble fixture/helper hatası korunur; yeni L7/worker sağlama iddiası kurulmaz.
- Stable release/milestone kapıları açık; kalan normal UI/platform/görsel ve yeni kaynak performans kabulü tamamlanmadan release yayımlanmaz.

## 2026-11-08 — v1.1.0 adayı, bağlantı ve işlem doğruluğu

- Gerçek production UI kabulünde bulunan ilk-mount Promise hatası iki satırlık async/configured guard düzeltmesiyle giderildi.143/143 unit ve gömülü binary üzerinden Chromium başlangıç/bağlantı penceresi smoke geçti; CI build-only kontrolüne gerçek browser smoke eklendi. İlk başarısız kayıtlar korunur.

- Üretim frontend Go ikilisine gömülür; CLI context/kubeconfig/port/write ve özel token-file seçenekleri. macOSARM64 temiz dizin, LinuxAMD64 Docker emülasyonu temiz/tmp+gerçekTLSAPI smoke geçti. Dockerfile Node24.16/Go1.26.5, pinli CI, ayrı namespace read/write/log/metrics RBAC örnekleri. Bu kayıt stable release onayı değildir.

- Ayrı API/discovery/yetki/metrics/Hubble tanılaması; açık Connect/Demo ve context/namespace için açık yönetim izni. Nonce, browser session ve private client fingerprint ile geç enable/mutation yanıtları ayrılır; kapsam değişimi iptal/revoke eder.
- Exact scheme/Host Origin, JSON/CSRF ve opaque sandbox HTTP önizleme korumaları; upstream'e operator cookie/token/nonce gönderilmez. Backend salt okunur son kararı korur.
- Namespace/UID metrics iptali, gerçek kaynak zamanı; operation failure/terminating/resize ve çift submit/timeout inceleme. Düşme/trafik caption yerleşimi iyileştirildi, güvenli admission rotası korunuyor.
- Yeni adayda frontend141/141, server39PASS/16SKIP, hedefli race11/11; owned Kubernetes1.35.1 API grubunda10leaf/4top-levelPASS. Normal UI/two-cluster, üretim dağıtımı ve son performans kapıları hâlâ açık. Release veya milestone tamamlandı değildir.

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

## 2026-11-06 — onarımın son kabul oturumu

- Üç eşleşmiş blokta medium/DPR1/su/seyir/kaynak kapsamı korundu. Açık panel CPU medyanı0,4325→0,4143 çekirdek; negatif signedΔpanel korunur. Çoklu arıza ek maliyeti+0,0162çekirdek, küresel optimizasyon iddiası yok. Uzun koşu60,0005JSçizim/sn,p9518,6/p9919,4ms;5600/5600olay,fullfinalsignature,3reconnect/329resync,20/20panel ve24/24log kapanışı.
- Salt okunur checkpoint materyal envanteri, üç hedefli test ve ayrı asenkron GPU tanılaması; ek frame/timer/listener yok. GPU p952,55ms kullanım yüzdesi değildir. Yedi kısa gerçek kaynak kaydı açıldı; hatalı erken container video kesiti korunup13–20sn aralığı seçildi. Etiket örtüşmesiP2olarak açık.

- Dondurulmuş ürün source/build kimlikleri korunarak, kullanıcının pille devam tercihi için yeni eşleşmiş seri oturum açıldı. Önceki 21 AC hücresi ayrı tutulur; kaynak, güç, tarayıcı, süreç kapsamı ve tam canonical içerik kapıları gevşetilmedi.
- Normal UI create/dry-run/scale ve olumsuz scheduling/image/quota/context yolları yeniden sınandı. İlk restart helper hatası tarihsel FAILED olarak kaldı; ayrı dar recovery koşusu eski UID DELETE / yeni RS ve Ready Pod UIDlerini doğruladı. Ürün kodu bu test düzeltmesiyle değişmedi.
- Aynı sentetik çalışma kümesinde 20 panel çevriminin başlık PNG ve kontrol trial üst sınırları kaydedildi; fiziksel ekran sunumu veya bütün panel kontrollerinin kullanılabilirliği diye sunulmaz. Ana pil oturumu 49/49 hücre ve 20 dakika/20 panel çevrimiyle geçti; doğrudan materyal tanılaması da 40 checkpoint/20 çevrim/24 kapanışla geçti. Materyal40–44 ve texture3 aralığı ölçüldü; mutlak sızıntı yokluğu iddiası yok.

## 1 Kasım 2026 — onarımın gerçek işlev kabulü, son performans açık

- Son gerçek yeni worker, API NodeUID/Ready, kızaktan katılım ve mevcut filonun seyri birlikte doğrulandı; aynı/farklı idempotency key sonuçları202/409. Önceki başarısız giriş/harness kayıtları korunur.
- Gerçek same/cross-Node Hubble akışı,3Dve klavye seçimi, yük artırma/durdurma; provider kopması/stale/10sn expiry/recovery ve gerçek DNS/UDP doğrulandı. Flow olayı paket değildir; belirsiz UID uydurulmaz.
- Snapshot kaynak kökeni ve tarihsel provisioning journal sınırı düzeltildi; eski namespace Pod'ları yeni yükleme gibi oynatılmaz. Benchmark fixture context adı production korumasıyla eşlendi; koruma gevşetilmedi.
-129frontend/26benchmark testleri ve son Go/race kapıları geçti. Son production CPU/kare/kararlılık ölçümleri sürüyor; tamamlandı veya v1.1 duyurusu değildir.

## 2026-11-01 — v1.1 öncesi onarım, doğruluk ve sağlayıcı aşaması

- Snapshot'ın gerçek GVR/namespace kapsamı, on-demand watch/reconnect ve UID tombstone ayrımı düzeltildi. Silinme, henüz listelenmeme, stale ve RBAC reddi ayrı; gerçek CR kullanıcı akışı6grup geçti.
- Log oturumu beklenen UID/watch/açılış/ilk yayın denetimi ve iptalle korundu; Kubernetes name-addressed logs API'sine atomik UID garantisi atfedilmez. Secret amaçlı metadata korunumu, maskeli yazma reddi ve CPU/RAM controller hedef capability'si gerçek API'de sınandı.
- Ortak sınırlı Node/container arıza koordinatörü, kademeli batma/toparlanma, yalnız hatalı kutunun düşüşü, orphan Pod erişimi ve gerçek durumdan türetilmiş süreç/vinç devri eklendi. Normal silmenin SIGTERM çıkışı yeni arıza sayılmaz. Yeni gemi trafik kilidi ve instanced renk materyali gerçek görsel kanıttan düzeltildi.
- Sabit profile/context/clusterUID bağlı minikube worker sağlayıcısı; persistent idempotency/journal ve profil kilidi. Hubble1.20.2 resmi CLI ile read-only mTLS akış adaptörü, iki-endpoint namespace yetkisi, temporal IP/UID geçmişi, bounded toplama/kayıp/güncellik ve reconnect. CLI/protobuf bağımlılığı kurulu client-go'nun major sürümünü değiştirmeden ayrıldı.
- Gerçek Kubernetes1.35.1 testlerinde iki yeni worker, multi-container failure/recovery, logs/Secret/template/CronJob/native-sidecar/applied-resize/rollback/PDB ve reader RBAC doğrulandı. Chromium/WebKit erişim/odak ve72kontrast kontrolü; gerçek60sn hidden duruşu geçti. Son provisioning/trafik görsel kabulü ve20dk/eşleşmiş performans henüz açık; çalışma/v1.1 tamamlandı ilan edilmez.

## 2026-11-01 — v1.1 öncesi görsel davranış denetimi (ürün değişikliği yok)

- Sekiz görsel/Kubernetes beklentisi için aktif kod, normal UI ve gerçek Kubernetes kanıtı ayrı raporlandı. Gerçek owned test kümesinde Node/Pod lifecycle, create/scale/restart, log/exec/forward ve RBAC sınırları incelendi; alev/batma, kargo düşmesi, provisioning ve flow/protokol özellikleri varmış gibi sunulmadı.
- Gerçek same-source backend reconnect sonrası on-demand AuditCargo API'de aynı UID/RV ile dururken panelin yanlış silindi göstermesi P0 olarak doğrulandı; bu denetimde ürün kodu düzeltilmedi.
- [Ana rapor](VISUAL_FEATURE_AUDIT.md), [kaynak/işlem matrisi](VISUAL_FEATURE_MATRIX.csv), [eksikler](VISUAL_FEATURE_GAPS.md) ve `artifacts/visual-audit/audit-20261030T175145Z/` kanıtları eklendi. Dört Chromium/WebKit kamera testi ve kısa gerçek-küme tanılaması, geniş performans kabulü/gerçek Safari testi yerine geçirilmedi. Eski başarısız test yardımcıları ve önceki log metni yarışı kanıtları korundu.

## 2026-10-30 — Dolu log yerleşimi ve ölçüm orkestrasyonu

- Log metni32satırlık kararlı ordinal bloklarla güncellenir;5000satır/1MiB/16KiB/180ms sınırları, seçim/indirme/arama/sarma ve gerçek HTTP abort korunur. Beş eşleşmiş log çiftinde p95 medyanı41,7→17,7ms; en büyük browser PID RSS459,4→386,2MiB. Toplam CPU aralıkları örtüşür, eşleşmiş fark medyanı+0,0023çekirdek; net CPU kazancı ilan edilmez.
- Üç Codex alt müdürü ve gerçek test süreçlerine bağlı görünür Terminal supervisor/worker sekmeleri; ana müdürün merkezi kaynak kuyruğu, source SHA kapısı, tek ağır iş ve sonlu timeout.5/5 cleanup testi; başarısız/yarım işler otomatik yeniden denenmez.
- Son frozen kaynakta14 Chromium/WebKit testi; gerçek log pause/resume kontrolü eklendi. WebKit kamera testindeki800ms sabit bekleme, aynı toleransla gözlenen durağan poza çevrildi. Backend frozen binary contract işindeki7 kontrol geçti.
- Kapalı-panel hücresinde başlangıç durumu uyuşmayınca ana matris durdu; hata korundu. Isınmadan önce input koruması/DOM doğrulaması ve açık kabul ledger'ıyla eksik hücreler tamamlandı. Son ana matris40 geçerli hücre/beş blok: logsuz panelde net CPU kazancı kanıtlanmadı; toplam CPU ve signed Δpanel ayrı raporlandı.
- Instance buffer kapasite prototipi5 eşleşmiş çift sonunda reddedildi: buffer churn20→0 olsa da üç çiftte toplam CPU arttı, tutulan payload11.720bayt büyüdü. Production v5 değişmedi. Güç kaynağı değişince AC ana sonuçlarından ayrı pil doğrulama oturumu açıldı.
- Son v5 yeni20dk koşusu59,999JSçizim/sn,p9517,7/p9918,9ms,0uzun görev;5600olay,tamfinaliçerikeşitliği,40/40kaynak sayımı,3reconnect/329resync ve21/21logkapanışı. Geometri29→30tek artışın nedeni kanıtlanmadı; yardımcı60hücre/3eşleşmiş blok tamamlandı; genel CPU hedefi karşılanmadı. [Panel raporu](PANEL_CPU_OPTIMIZATION.md) gerçek kapsamı tutar.

- Uyku kaynaklı653snOS/60snJS CPU örneğini reddeden saat kapısı ve stale stage yerine worker kuyruk durumunu kullanan ilerleme izleyicisi;12/12harness testi.52geçerli hücre korundu; yalnız8eksik/geçersiz ve1PID-kapsamı eksik interaction hücresi yeni kimliklerle tamamlandı.
-111geçerli hücrelik son inceleme; native60sn gizli pencerede0çizim/doğru veri. Safari WebDriver ve gerçek manuel AppleEvents yolu engelli, performans N/A. Eski sayılar ve başarısız ham artefaktlar korunur; bütün performans hedefleri geçti denmez.

## 2026-10-26 — Panel ve kargo hesap maliyeti

- Canonical kaynaklardan UID/tür/Node/owner/Event indeksleri; değişmeyen scope ve callback'lerle Node/Pod panel gövdesi ilgisiz Pod güncellemelerinden ayrıldı. Güncellik yazısı ve ilgili kaynak değişimleri anında kalır.
- Mevcut instance geometrileriyle statik kargo şablonları, Node başına dönüş tabanı ve doğrudan matris yazımı; frame başına geçici pose/renk hesapları azaltıldı. Filo/deniz kalitesi, FPS, DPR ve görünür kaynak kapsamı değiştirilmedi.
- Loglarda veri yokken boş180 ms interval kaldırıldı; veri geldiğinde tek flush timer'ı, byte/satır sınırları ve abort korunur. Eski satırlara bakarken scroll tutulur; “En alta dön” eylemi eklendi.
-40 hücrelik beş blok ana matris: açık panel/5 olay-sn CPU medyanı0,396→0,370 çekirdek; signed Δ medyanı0,0308→0,0017. Aralıklar örtüşür; kesin küresel yüzde iddiası yok. Ayrı allocation tahmini1127→603 MiB/15 sn; retained RAM değildir. Son kapsam ve kısıtlar [panel raporunda](PANEL_CPU_OPTIMIZATION.md).
-76 frontend,9 harness,12 Chromium/WebKit testi ve Go server testleri geçti. Aynı kadraj görüntülerinde saat metni dışındaki pikseller aynı; Neumorphism CSS'i ve Three chunk'ları byte eşdeğer.

## 2026-10-24 — Production benchmark ve sınırlı log belleği

- Deterministik S/M/L fixture, gerçek dynamic informer/WebSocket/store/sahne yolu, seri production ölçüm harness'i ve karşılaştırılabilirlik kapısı eklendi. Kubeconfig kullanılmaz; sentetik kaynaklar görünür etiketli ve salt okunurdur.
- Log görünümü bitmemiş satır dahil UTF-8 byte sınırlarına alındı: 5000 satır / 1 MiB, satır başına16 KiB. Kısaltma açıkça bildirilir; container değişimi/kapanış eski akışı abort eder. Ham Kubernetes logu değişmez.
- 72 frontend testi, 6 harness testi, 8 Chromium/WebKit tarayıcı testi; Go mikro/ağ/race ve gerçek 60 sn gizli pencere kontrolü geçti. Video/PNG ana FPS ölçümlerinden ayrıdır.
- Matris cache adayı kazanç kanıtlamadığı için geri alındı.19 geçerli üçlü set,20 dk churn/resync ve üçlü instrumentation kontrolü tamamlandı; uzun log baseline6 GiB RSS guard nedeniyle N/A, yeni sürüm aynı yükte yaklaşık60 çizim/sn. Native Safari performansı N/A; açıklanamayan CPU farkları ve bütün kapsam sınırları `PERFORMANCE_REPORT.md` içinde korunur.

## 2026-10-24 — Yön tuşlarıyla kamera kaydırma

- Odaklanmış 3D canvas üzerinde yön tuşları kamerayı ve OrbitControls hedefini bakışa göre yatay düzlemde birlikte taşır; yükseklik, açı ve zoom korunur.
- Mevcut render döngüsünde delta zaman kullanılır; tuş bırakma, canvas/pencere odağı kaybı ve gizlenen sekme hareketi keser. Panel/form klavyesi korunur; listener'lar kaldırılır.
- Chromium ve Playwright WebKit'te 4 kamera testi, mevcut 69 frontend testi ve üretim derlemesi geçti. Kubernetes servisi veya mutasyon akışı değiştirilmedi.

## [1.0.0] - 2026-08-05

### 🚀 Kararlı Sürüm Yayın Özeti (v1.0.0 Release Summary)
- **Gerçek Zamanlı 3D Liman Motoru:** Kubernetes cluster nesnelerini (Node, Pod, Deployment, StatefulSet, DaemonSet, Job, ConfigMap, Secret, PVC/PV, Ingress, NetworkPolicy, RBAC, Kubelet, Kube-proxy) somut ve etkileşimli bir tersane simülasyonu olarak sunar.
- **Sıfır Gecikmeli Canlı Senkronizasyon:** `client-go` Informer & Watch entegrasyonu ile WebSocket canlı veri yayın hattı. Pod silme/scale durumlarında tombstone unwrap & multi-node purge garantisi.
- **Tüm Nesne Tiplerinin Zengin İnceleme Kartları:** Sahnede seçilen 15 nesne tipinin tamamı için zengin metrik, IP/DNS, zaman damgası ve bağımlılık kartları.
- **Canlı Log Streaming & Metrik Trend Grafikleri:** Anlık Pod log yayınlayıcısı, CPU/RAM canlı sparkline'ları ve 1 saatlik ring buffer grafik dökümü.
- **Güvenli Mutasyon İşlemleri:** Salt İzleme Modu (Read-Only Mode) anahtarı, kilitli namespace koruması ve onay modalı doğrulaması.
- **Kubeconfig Auto-Heal Altyapısı:** minikube / local k8 sn yeniden başlatmalarında dinamik port sapmalarını 3 deneme sonrası otomatik algılama ve canlı bağlanma.

### 📋 Bilinen Sınırlamalar / v1.1 İçin Planlanan (Known Limitations)
- **Container Terminal / Exec Erişimi:** İnteraktif container shell (exec) erişimi v1.0.0 güvenlik sınırı nedeniyle kapsam dışı tutulmuştur (v1.1 roadmap).
- **Canlı Inline YAML Düzenleyici:** Canlı küme durumunu doğrudan text düzenleme ile değiştirme riski nedeniyle kısıtlanmıştır; mutasyonlar güvenli buton ve modal ile yapılmaktadır.
- **Web Audio Sesli Anons Efektleri:** Olay günlüğü sesli anons entegrasyonu varsayılan olarak sessizdir; görsel uyarı ışıkları ve anons bantları aktiftir.

---

## [v3.4.0 - 3D Obje İnceleme, InfoCard Yenileme, Çakışma Önleme & Vinç Yönetimi] - 2026-08-04

### Düzeltilen Hatalar ve İyileştirmeler (Sorun 1, 2, 3 & 4 Fixes)
- **Eksiksiz InfoCard Obje Kartları (Sorun #1 Fix):** Sahnede seçilebilen 15 farklı nesne tipinin (`JOB`, `SECRET`, `CRANE`, `CONFIGMAP`, `PVC`, `PV`, `STATEFULSET`, `DAEMONSET`, `KUBELET`, `KUBE_PROXY`, `INGRESS`, `SHIP`, `POD`, `SERVICEACCOUNT`, `ROLE`) tamamı için zengin detay, zaman damgası, güvenlik maskesi ve metrik blokları eklendi. Hiçbir 3D nesnede boş kart kalmadı.
- **Modern Underline Indicating TabBar (Sorun #2 Fix):** Pod detay panelindeki hantal kutu butonlar kaldırıldı, kehribar ve gökyüzü mavisi alt çizgi vurgulu modern `TabBar` tasarımı uygulandı.
- **Kapatma (X) İkonu Boyut Ayarı (Sorun #3 Fix):** Müfettiş çekmecesinin sağ üstündeki X ikonu, panel başlık boyutuyla orantılı sleek 14px (%65 visual alan) boyutuna indirildi.
- **3D Slot Grid & Çakışma Önleme (Sorun #4 Fix):** Sahnedeki ikinci duplicate Kube-Scheduler vinci kaldırıldı (Kubernetes mimarisine uygun olarak TEK aktif scheduler vinci bırakıldı). Control Plane çevresindeki `ConfigMap`, `Secret` ve `Kube-Proxy` nesneleri için dairesel, çakışmayan 3D slot koordinatları kuruldu. 3D metin etiketlerinin derinlik çakışması engellendi.
- **Dokümantasyon:** `docs/LESSONS.md` (DERS-017) ve `AGENTS/AGENTS.md` (Kural 15) güncellendi.

---

## [v3.3.0 - Hayalet Pod Düzeltmesi & Anlık Deployment Adı Çözümlemesi] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler (Sorun 1 & 2 Fixes)
- **Silinen Hayalet Pod'lar Onarımı (Sorun #1 Fix):**
  1. Go backend informer `DeleteFunc` handler'larına `cache.DeletedFinalStateUnknown` tombstone unwrap mantığı (`unwrapPod`, `unwrapNode`, `unwrapDeployment` vb.) eklendi. Client-go silme paketlerinin sessizce yutulması engellendi.
  2. `ShipyardClusterContext.jsx` içerisinde `processResourceEvent` fonksiyonunda Pod silme ve güncelleme olaylarında `podId` nesnesi kümedeki TÜM node'ların dizilerinden temizlenecek jenerik harita filtresine çevrildi (`targetNode` adres sapmalarında sahnede kalan hayalet Pod'lar %100 temizlendi).
- **Pending & Anlık Deployment Adı Çözümlemesi (Sorun #2 Fix):**
  1. Backend `handlePodEvent` fonksiyonunda `ref.Kind == "ReplicaSet"` olduğunda `ownerKind` doğrudan `"Deployment"` olarak set edildi.
  2. Informer cache sync gecikmelerinde veya Pod henüz `Pending` durumundayken ReplicaSet isminden trailing hash kısmını kesen `extractDeploymentName(rsName)` fallback fonksiyonu yazıldı (`scale-test-574647494` ➔ `scale-test`). Pod kartlarında ham hash'li Pod isminin görünmesi kesin olarak engellendi.
- **Dokümantasyon:** `docs/LESSONS.md` (DERS-016) ve `AGENTS/AGENTS.md` (Kural 14) güncellendi.

---

## [v3.2.0 - İş Yükü Denetim İyileştirmeleri & Owner Zinciri Çözümlemesi] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler (Denetim Raporu Referanslı)
- **Pod ➔ ReplicaSet ➔ Deployment Owner Zinciri (Düzeltme #1 Fix):** Go backend `Watcher` yapısına `ReplicaSet` SharedInformer'ı eklendi (`factory.Apps().V1().ReplicaSets().Informer()`). Pod `OwnerReferences[0]` bir ReplicaSet olduğunda bellekteki bu harita üzerinden üst `Deployment` ismi çözümlenerek Pod bilgi kartında `Owner: Deployment: web-frontend-deploy (RS: web-frontend-deploy-74b89ff448)` şeklinde gösterilmesi sağlandı.
- **Yönetim Binası Canlı Deployment Verisi (Düzeltme #2 Fix):** `MasterDashboardOverlay.jsx` içindeki `mockDeployments` dizisi kaldırıldı. "SEFERLER" sekmesi WebSocket üzerinden gelen canlı `deployments` verisine bağlandı (name, namespace, ready/desired replicas, image, strategy). Cluster'da Deployment yoksa `"Bu cluster'da tanımlı Deployment yok"` mesajı render ediliyor.
- **Bağımsız (Orphan) Pod Fallback Düzeltmesi (Düzeltme #3 Fix):** `len(pod.OwnerReferences) == 0` olan sahipsiz Pod'lar için backend fallback değeri `"Deployment"` yerine `"Standalone"` (Bağımsız Palet) olarak güncellendi. Frontend Pod kartında `Owner: Yok (Bağımsız Palet)` metni eklendi.
- **Dokümantasyon & ADR:** `docs/DECISIONS.md` (ADR-025) ve `METAFOR.md` güncellendi.

---

## [v3.1.0 - Tipografi Ölçeği, Gemi Çakışma Önleme Motoru & Ortak InfoCard Mimarisi] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler
- **Merkezi Tipografi Ölçeği (Sorun #1 Fix):** `frontend/src/index.css` dosyasına kök CSS custom properties (`--font-size-title-lg`, `--font-size-body`, `--font-size-label`, `--font-size-btn`) eklendi. Tüm panel başlıkları (%80), veri satırları (%75) ve buton metinleri (%80) netliği bozulmadan compact oranlara küçültüldü.
- **Gemi & Liman Çakışma Önleme Algoritması (Sorun #2 Fix):** `frontend/src/constants/dimensions.js` içerisine `SHIP_DIMENSIONS` (9.0m x 1.8m x 28.0m) ve `HARBOR_DOCK_BOUNDS` (`x >= 4.0`) sabitleri eklendi. `calculateShipPatrolPosition` fonksiyonu ile açık deniz devriye rotasında çalışan gemilere `phaseOffset = (shipIndex / totalShips) + timeOffset` faz farkı ve `calculateShipDockPosition` ile güvenli yanaşma slotları atandı. 1, 2, 5 veya 10 gemi olduğunda gemilerin birbirine ve rıhtım binalarına çarpışması %100 engellendi.
- **Ortak InfoCard İskelet Bileşeni (Sorun #3 Fix):** `frontend/src/components/InfoCard.jsx` bileşeni oluşturuldu. Tüm nesne detay kartları (Node, Pod, ServiceAccount, Role vb.) Header (Başlık + Durum Rozeti) ➔ Divider ➔ Bölüm Grupları ➔ İki Sütunlu Hizalı Etiket-Değer Satırları ➔ Aksiyon Butonları şablonuna dönüştürüldü.
- **Dokümantasyon & Kurallar:** `docs/ARCHITECTURE.md`, `docs/LESSONS.md` (DERS-015) ve `AGENTS/AGENTS.md` (Kural 13) güncellendi.

---

## [v3.0.0 - Sıfırdan Kurulum & Onboarding Denetim Düzeltmeleri] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler (ONBOARDING-AUDIT.md Referanslı)
- **#1 Static File Server Handler (Kritik #1 Fix):** `backend/main.go` dosyasına `./public`, `/app/public` ve `../frontend/dist` dizinlerini dinleyen `http.FileServer` eklendi.
- **#2 RBAC İzin Genişletmesi (Kritik #2 Fix):** `deploy/rbac.yaml` ve `charts/tersane/templates/rbac.yaml` manifestlerine tüm 3D izlenen kaynaklar için salt-okunur izinler eklendi.

## [Unreleased] - 2026-10-24

- Ana deneyim tam ekran etkileşimli liman olarak değiştirildi; kalıcı dashboard kabuğu kaldırıldı.
- Merkez, vinç, depo, ağ, kasa ve diğer tesisler geçici gerçek kaynak pencerelerine bağlandı.
- Gemi → Pod → container zinciri; tam container adıyla log/exec ve gerçek port-forward korundu.
- Node hedefli oluşturmada scheduler affinity, client/server UID kontrolü ve kayıpsız yerleştirme birleştirme eklendi.
- SSAR cluster scope, scale UID/RV yarış kontrolü ve snapshot sonrası gecikmiş callback koruması düzeltildi.
- Canvas raycast, keyboard/dirty form, gerçek targeted scheduling ve boş dünya testleri eklendi. Son birleşik QA sonuçları tamamlanma iddiasından ayrı raporlanır.

- Kabul: 39 frontend unit testi, 21 Chromium/WebKit browser testi geçti (5 WebKit tekrar mutasyonu bilinçli atlandı); gerçek kısıtlı ServiceAccount RBAC403, workerUnknown ve canlı yaşam döngüsü kaydı.
- AppleM5 Metal headed Chromium kısa sentetik profillerde yaklaşık60 FPS; 10 dakika/464 çevrim churn raporu ve yazılım renderer ölçümleri ayrı kaydedildi.

- Gemi formunda Pod/Deployment tür seçimi görünür; tür değiştirirken Pod spec ve üretilen affinity korunur, yinelenmez. Altı Chromium workbench regresyonu tekrar geçti.

## Hareketli filo / canlı deniz / Soft UI — 2026-10-24

- Sağlıklı Node gemileri varsayılan seyirde; UID fazı ve bölge kapasitesi8. Görsel duraklatma ve açık kamera takibi Kubernetes scheduling'den ayrı.
- Ortak analitik dalga modeli, iki ripple katmanı, hıza bağlı iz ve bağımsız deniz/seyir ayarları.
- Gerçek Pod atamasına bağlı geçici yanaşma/vinç/ayrılma; sınırlı kuyruk, sade varış, ayrı görsel yükleme etiketi.
- Neumorphism paneller, yüksek kontrast, sistem tercihleri ve sürümlü güvenli yerel ayarlar.
- Trafik kilidi ve dış rıhtımda kıç süpürmesi uzun testte bulundu; birleşme rezervasyonu ve önce düz çıkış ile düzeltildi.
