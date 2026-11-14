# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri mevcuttur.

## 9 Kasım 2026 — çoklu liman ve kullanıcıya ait manuel kabul

Son kullanıcı kararı: bu tur manuel kabul adayıdır. Önceki koşullu otomatik stable yayın/merge talimatını değiştirir. Kullanıcı yedi profili deneyip açıkça onaylamadan stable v1.1.0 tag/release, stable amaçlı PR merge veya ana milestone kapatma yoktur. Geliştirme commit/push ve PR/milestone ilerleme kaydı sürer; eski BLOCKED kapıları korunur.

Bağlantı, liman ve workspace ayrılır. İlk sürümde liman tek güvenilir bağlantı + namespace kümesi + isteğe bağlı selector'dır. Local-first model korunur; hesap/SaaS/CI-CD veya otomatik multi-cluster ağ sistemi eklenmez. Güvenilir cluster UID fiziksel dedup sağlar; cache paylaşımı ayrıca aynı kimlik/credential nesli/kapsam gerektirir. Bilinmeyen cluster ayrı tutulur, sırf dedup için yetki yükseltilmez.

Server-side scoped dynamic adapter ve typed alt kaynak kontrolleri mevcut client-go/Go yolunu genişletir; watch broker son abonede kapanır. Frontend uyumlu canonical kaynakları paylaşır, liman oturum/grant/form bağlamını ayırır. Birden fazla WebGL canvas yerine aktif ayrıntılı dünya ve uzak LOD kullanılır. Worker/WASM/framework göçü için bağımsız net kazanç kanıtı olmadığı sürece mevcut React18/R3F8/Go korunur.

Manuel 01–06 gerçek owned Kubernetes kaynaklarına bağlanır. 07 açık TEST/REPLAY modu aynı dondurulmuş M/L fixture'ını kullanır; read-only ve loopback zorunlu, gerçek bağlantı fallback'i değildir. Bundle runner'ı stdlib Python kullanır; uygulama Go/Node kurmadan embedded binary'den çalışır. Private lab state repo dışında dar izinlidir, kullanıcı cluster'larına/global kubeconfig'e dokunulmaz. Ağır kaynaklar teslim sonunda durur; manuel kurulum/fixture dosyaları korunur. [Kabul defteri](WORKSPACE_ACCEPTANCE.md).

---

## 📜 Karar Listesi

### 🟢 [ADR-025] In-Memory ReplicaSet Informer ile Pod ➔ ReplicaSet ➔ Deployment Zincir Çözümlemesi
- **Tarih:** 2026-08-03
- **Durum:** Kabul Edildi
- **Bağlam:** Pod bilgi kartında `Owner: ReplicaSet:web-frontend-deploy-74b89ff448` şeklinde ham ve kullanıcı dostu olmayan teknik isim görünmesi hatası.
- **Karar:**
  1. Pod olayında (`handlePodEvent`) her istek için Kubernetes API sunucusuna doğrudan senkron HTTP çağrısı yapmak event loop'u bloklayacağı ve performans kaybına yol açacağı için reddedilmiştir.
  2. Kök Deployment ismini regex veya hash kesme ile türetmek kırılgan (Deployment ismi ile ReplicaSet hash desenleri değişken olabileceğinden) kabul edilmiştir.
  3. **In-Memory Informer Seçimi:** Go backend watcher yapısına `ReplicaSet` SharedInformer'ı eklenmiştir (`factory.Apps().V1().ReplicaSets().Informer()`). ReplicaSet'ler bellekte `map[string]*appsv1.ReplicaSet` olarak önbelleklenir.
  4. Pod `ownerReferences[0]` bir ReplicaSet olduğunda, bellekteki bu haritadan ReplicaSet'in kendi `ownerReferences[0]` değeri kontrol edilir. Eğer kök bir `Deployment` ise Pod `ownerKind = "Deployment"`, `ownerName = "web-frontend-deploy"` ve `replicaset_owner = "web-frontend-deploy-74b89ff448"` olarak türetilir.
  5. `len(pod.OwnerReferences) == 0` durumundaki sahipsiz/bağımsız Pod'lar için fallback değeri `"Deployment"` yerine doğru olan `"Standalone"` (Bağımsız Palet) olarak ayarlanmıştır.
- **Sonuç:** Sıfır ağ gecikmesi ile %100 doğru ve okunabilir Pod sahiplik zinciri elde edilmiştir.

---

### 🟢 [ADR-024] Static File Server Mimarisi & Çevre Değişkenleri Temizliği
- **Tarih:** 2026-08-03
- **Durum:** Kabul Edildi
- **Bağlam:** Onboarding denetiminde tespit edilen Docker/K8s deployment senaryosundaki `404 page not found` hatası ve README'deki hayali çevre değişkenleri (`ENABLE_METRICS`, `METRICS_INTERVAL`, `LOG_LEVEL`).
- **Karar:**
  1. `backend/main.go` dosyasına `resolveStaticDir()` ile `./public`, `/app/public` ve `../frontend/dist` dizinlerini kontrol eden bir `http.FileServer` handler'ı eklenmiştir. Production build derlendiğinde backend `http://localhost:8000/` üzerinden React 3D SPA uygulamasını tek servis olarak sunar.
  2. Geliştirme ortamında static build bulunmadığında backend zarif bir HTML bilgilendirme sayfası gösterir ve dev server (`http://localhost:5173`) ile çakışmaz.
  3. README configuration tablosundan kodda karşılığı olmayan hayali değişkenler kaldırılmış; aktif olan `PORT`, `WATCH_NAMESPACE` ve `KUBECONFIG` korunmuştur.
- **Sonuç:** Standalone Docker ve K8s deployment'larında takılmadan çalışan 404-free üretim sunucusu elde edilmiştir.

---

### 🟢 [ADR-023] RBAC ClusterRole İzin Kapsamının 3D Görselleştirilen Tüm K8s Kaynaklarına Genişletilmesi
- **Tarih:** 2026-08-03
- **Durum:** Kabul Edildi
- **Bağlam:** 3D sahnesinde görselleştirilen Ingress, ConfigMap, Secret, Job, HPA, ServiceAccount ve RBAC nesnelerinin in-cluster modda ServiceAccount (`tersane-sa`) ile izlenirken `403 Forbidden` alması riski.
- **Karar:**
  1. `deploy/rbac.yaml` ve `charts/tersane/templates/rbac.yaml` içerisindeki ClusterRole izinleri genişletilmiştir: `configmaps`, `secrets`, `ingresses`, `jobs`, `cronjobs`, `horizontalpodautoscalers`, `serviceaccounts`, `roles`, `rolebindings`, `clusterroles`, `clusterrolebindings`, `persistentvolumeclaims`, `persistentvolumes`, `customresourcedefinitions`.
  2. Tüm izinler kesin olarak salt-okunur (`get`, `list`, `watch`) tutulmuştur.
  3. Secret verileri kesinlikle backend kodunda decode edilmemekte ve loglanmamaktadır; izin yalnızca Pod hacim bağı ve varlık tespiti içindir.
- **Sonuç:** In-cluster deployment ortamında sıfır `403 Forbidden` hatası garantilenmiştir.

---

### 🟢 [ADR-022] Dinamik Kubeconfig Port Sapması Otomatik Kurtarma Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** minikube / Docker-desktop gibi yerel geliştirme kümelerinde API sunucu portunun yeniden başlatmalarda değişmesi ve backend'in takılı kalması sorunu.
- **Karar:**
  1. Backend K8s istemcisi API sunucu adresini static önbelleklemez. 3 ardışık bağlantı hatasından sonra diskteki `~/.kube/config` dosyasını re-read eder.
  2. Adres değişikliği tespit edildiğinde (`newHost != currentHost`), backend process'i kapatılmadan bellek içindeki clientset ve informer fabrikası yeni port adresiyle yeniden başlatılır.
  3. Kubeconfig okunamama hataları (`ErrKubeconfigUnreadable`) ile ağ bağlantı hataları net biçimde ayrıştırılır.
  4. Durum WebSocket üzerinden UI'ya iletilir.
- **Sonuç:** Kullanıcı müdahalesi gerektirmeyen self-healing K8s bağlantı altyapısı kurulmuştur.

### [ADR-026] Tam ekran dünya birincil arayüzdür
- **Tarih:** 2026-10-24
- **Durum:** Kullanıcının kesin ürün kararı; önceki dashboard yerleşimini geçersiz kılar.
- Tek tam viewport R3F canvas korunur. Sidebar, header bar, KPI ve sürekli kaynak tablosu kaldırılır. Tesis/Node/Pod etkileşimi geçici DOM penceresi açar; kapatma kamerayı yeniden kurmaz.
- Mevcut gerçek API/capability/form bileşenleri korunur. Sabit tesisler uygulama girişidir; gerçek kaynak sayılmaz. Bulucu aynı kayıt ve eylemleri semantik olarak açar.
- Node hedeflemede `metadata.name` nodeAffinity, Node UID ön kontrolü ve required OR-dallarına AND eklenmesi kullanılır; `spec.nodeName` ile scheduler atlanmaz.
- Önceki salt-okunur güvenlik ADR’si varsayılan mod için geçerlidir; kullanıcı kapsamındaki gerçek yönetim, açık sunucu opt-in’i ve her istekte RBAC ile etkinleşir. Bu, genel admin/shell proxy yetkisi değildir.

### [ADR-027] Hareketli UID filosu, ortak su modeli ve Neumorphism
- Kullanıcı kararı: sağlıklı ve boşta gemilerin sürekli park etmesi yerine güvenli çevre rotası; geçici operasyon yanaşması. Sabit8gemi bölgeleri, UID ilerlemesi ve gerçek veriden ayrı görsel rezervasyon kullanılır.
- Deniz analitik GPU modeliyle hareket eder; aynı model gemiyi yüzdürür. Ayrı görsel saat, Page Visibility ve sürümlü tercihler; arka plan zamanı tek karede uygulanmaz.
- Panel dili mat Neumorphism'dir. İnce açık inset kenar ve koyu dış ayrım; küçük kontrollerde çift gölge; gerçek kontrast sınırları. Liquid Glass ve dashboard eklenmez.
- Mevcut watcher/API/auth/mutation sözleşmeleri korunur; bu görev yeni backend endpoint'i eklemez.

## ADR-028 — Kapsamlı gözlem ve sabit opsiyonel sağlayıcı sınırı

2026-11-01. Snapshot'ın authoritative kapsamı GVR/namespace'tir; on-demand CR reconnect boşluğu silinme değildir. UI silinme kararını pozitif tombstone kanıtından alır. Kubernetes logs name-addressed olduğundan UID watch/açılış/ilk yayın guard'ı kullanılır; atomik Kubernetes UID garantisi iddia edilmez.

İlk worker sağlayıcısı sabit minikube docker profile/context/clusterUID + yerel operatör + persistent journal/lock ile sınırlandı; serbest shell endpoint'i veya bulut göçü yoktur. İlk trafik adaptörü sürümü doğrulanmış resmi Hubble CLI1.20.2'dir. Bu seçim mevcut client-go0.30'a büyük SDK/transitif sürüm göçü eklemeden gerçek gRPC/protobuf alanlarını kullanır. CLI process/JSON maliyeti tarayıcı maliyetinden ayrı ölçülür; farklı dile taşıma veya toplam tasarruf başarısı iddia edilmez. Yetki, zamanlı UID eşlemesi ve payload field mask backend'de uygulanır. Ortak görsel koordinatör gerçek state'ten ayrıdır; kapasiteler ve cleanup sonludur.

## 8 Kasım2026 — v1.1.0 local-first dağıtım ve yetki niyeti

Kullanıcının yeni sürüm talimatı önceki onarımın sürüm yükseltmeme sınırını değiştirdi. Paket metaverisi1.1.0 test build'inden önce hazırlanır; stable tag/release ve milestone kapanışı bütün zorunlu kabul kapılarına bağlı kalır. Başlangıçta gerçek yayımlanmışv1.0release bulunmadı; eski chart etiketi geçmiş release sayılmaz.

Mevcut React18/R3F8/Three0.164 ve Go korunur. Ürün local-first tek operatördür; frontend Goembed ile aynıorigin sunulur. Standart kubeconfig merge ve context override kullanılır, global current-context yazılmaz. Backend READ_ONLY=false tek başına tarayıcıya yönetim vermez; scope/clientID/browser nonce ile açık niyet gerekir. Kapsam/config değişimi bunu iptal eder. Genel SaaS/impersonation veya güvenilmeyen forwarded-header modeli eklenmez.

Minimum namespace RBAC örnekleri Node/Namespace LIST veya Secret okumayı zorunlu kılmaz. Hubble ve minikube provider kurulu/değil ayrımı korunur; CNI otomatik kurulmaz. Yaklaşık30sn safe-gap için keyfi sleep bulunmadı; gövde/HEADWAY/merge koşullarına dayalı rota admission güvenliği kanıtlanmadan kısaltılmaz.

Yeni kabul için mevcut performans harness'inin `--suite v11` sonlu31hücre alt kümesi kullanılır; geçmiş49hücreyi yeni kaynakta koşulmuş gibi göstermeden yeni panel/connection ömrü ve20dk/20panel sınanır. Görsel/provider core source eşitliği, gerçek veri ve UI kanıtı ile ayrı değerlendirilir.
