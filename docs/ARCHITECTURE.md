# Veri, işlem ve 3D mimarisi

## 10 Kasım 2026 — aktif çoklu liman kaynağı

Son doğruluk checkpoint'i `42222c1184d66f3813fd98693b75bc9cb50b06ee`, `redesign/harbor-workbench` dalındadır. Bu bir **manuel kabul adayıdır**; stable yayın veya kullanıcı onayı değildir. Aktif model aşağıdaki **çoklu proje / çoklu liman genişletmesi** bölümüdür. Önceki `32a0468` tek-bağlantı açıklamaları kendi tarihsel kaynaklarını anlatır; güncel broker'ın yerine geçen tek global mutable Kubernetes istemcisi yoktur.

`workspaceResource.List` çok namespace birleşiminde gerçek upstream `apiVersion/kind` bilgisini korur ve eksik/çelişkili türü reddeder. Namespace'lerin opaque resourceVersion değerlerinden global sıra veya list RV üretilmez. Seçili kaynak vurgusu ile açık panel niyeti ayrıdır: kapalı panel liman dönüşünde kendiliğinden log/abonelik açmaz. Canonical güncelleme, kamera/filo transform'u ve yönetim penceresi yaşam döngüleri ayrıdır.

Donmuş son frontend kaynak SHA `ff682d9b633c86062fa3e1379aef7c92747f2bee0b31a9cbaec0995cda9219b9`; yeni kapsam/normal UI/gerçek API kanıtları [workspace kabul defterindedir](WORKSPACE_ACCEPTANCE.md). Son telemetry bootstrap bekleme düzeltmesi12 unit ile sınandı; iki gerçek kurulum FAIL ve provider E2E engeli korunur. Aşağıdaki eski ölçümler veya test sayıları yeni kaynağın otomatik kabulü sayılmaz.

## 9 Kasım 2026 — güncel aday kaynağı ve oturum sınırı

Runtime kaynak commit'i `32a0468ad51516a1bb38aab68760e73984c45ddf`; frozen frontend SHA256 `e61447de244192dca130675866abf81bc87daa20a7a128ee8534b5c6ae1fe164`, build adı `v11-final-32a0468`. Test edilmiş embedded macOS/Linux kimlikleri [release notlarında](RELEASE_NOTES_v1.1.0.md) ve [kaynak kaydında](../artifacts/v1.1.0/v11-20261108/candidate-frozen-32a0468.json). Durum sürüm adayıdır; final kanıt/CI/release beklenir. Aşağıdaki tarihli mimari ve ölçüm kayıtları kendi source kapsamlarında korunur.

`singletonManager` güncel socket açılışında yönetimi geçici readonly tutup gerçek `/api/connection` tanılamasını yeniler. Diagnostic success/error ve gecikmiş management enable sonuçları epoch, namespace revision ve socket serial ile ayrılır. Eski socket'ten dönen izin yeni bağlantıyı açmaz; aynı-source reconnect sonrası backend grant'i kaldırılmışsa açık form da readonly kalır. Scope değişimi eski HTTP/log/metrics/socket işlerini abort eder; global kubeconfig/current-context yazılmaz.

`useWorldProviders` modeli source owner'a, flow görünümü ayrıca namespace ve stream-session key/revision'a bağlıdır. Status/flow istekleri yeni kapsamda iptal edilir; gecikmiş nonempty callback cancelled/owner/flowKey kontrollerini geçmeden commit edilemez. Flow effect cleanup, eski context/scope/subscription URL'ini effect başında sabitler ve yalnız eski lease'i keepalive DELETE ile bırakır. Yeni guarded API nesnesi eski scope'u okumaya çalışmaz. Bu sınırlar gerçek hook'a deferred sentetik yanıt veren beş unit ile sınandı; current nonempty kabulü ve unmount sonrası timer/listener sayısının sıfır olması da doğrulanır. Son seri frontend 165/165 PASS; [unit/provenance kaydı](../artifacts/v1.1.0/v11-20261108/frontend/provider-epoch-evidence.json). Bu kayıt gerçek Hubble E2E veya production heap/timer ölçümü değildir.

`ResourceForms` desteklenen writable edit/resources/resize başlangıcında gerçek GET tamamlanana kadar alanları kilitler. Aynı source/cluster/UID üzerinde dirty ref, body/YAML/resourceVersion taslağını reconnect yanıtından korur; UID ve yetkili Secret reveal doğrulaması sürer. Önceki dry-run geçersiz olur; RV değişimi görünür review ister. Yalnız mevcut açık sürüm-gözden-geçirme eylemi RV'yi bilinçli ilerletir. Başka source/UID eski taslağa bağlanmaz; Secret readiness readonly/pending/reveal hatasında false olur ve kapanış yerel içeriği temizler.

App ve ortak Window gerçek DOM tetikleyicisini kaydeder; BODY/HTML, kaldırılmış veya disabled kontrol geçerli dönüş odağı sayılmaz. Canvas mount/ölçüleri, UID filo fazı ve kamera pencerelerden bağımsız kalır. `resourceStatus` Job için Complete/Failed önceliğini koruyup askıdaki Job'u gösterir. DS ancak bilinen, negatif olmayan tamsayı desired/ready ve güncel observedGeneration ile hazırdır; gerçek 1/1 Ready davranışı ayrıca [normal UI'da doğrulandı](../artifacts/v1.1.0/v11-20261108/frontend/status-resume/REVIEW.md). Eksik/stale DS negatifleri unit kapsamıdır; sahte UI status enjeksiyonu yapılmadı.

Önceki `0f5a5ab` normal UI checkpoint'iyle fark yalnız Job/DS status dalları ve semantiği değiştirmeyen metricFor satır sarmadır; tüm uygulama eşitliği iddia edilmeden [uygulanabilirlik incelenmiştir](../artifacts/v1.1.0/v11-20261108/source-applicability-32a0468.json). Tarihsel Node/worker/vinç/provider senaryoları yeniden çalıştırılmış sayılmaz. Geometri, deniz, rota ve visual coordinator eşliği ile değişen caption'ların ayrı gerçek UI kanıtı [harbor kaydında](../artifacts/v1.1.0/v11-20261108/harbor-source-applicability.json) tutulur.

## 8 Kasım 2026 — bağlantı ve yönetim oturumu

`GET /api/connection` gerçek context/namespace, API, keşif, ayrı SSAR izinleri, Metrics ve opsiyonel Hubble durumunu döndürür. Credential fingerprint yalnız Go'da kalır. `POST /api/management` açık kullanıcı niyetini mevcut browser cookie, nonce, context, namespace ve client ID ile bağlar. Backend READ_ONLY=false yalnız bu ek izni açabilme imkânıdır; Kubernetes RBAC son karardır. Kapsam/config değişimi grant'i iptal eder, eski stream/forwardları sonlandırır. Geç enable callback nonce altında tekrar doğrulanır.

Frontend yönetim niyeti ayrı tutulur; scope değişimi hemen readonly olur, önceki HTTP/log/metrics/socket işleri abort/epoch ile reddedilir. Namespace metrics geçmişi ve Pod incarnation UID birlikte doğrulanır. Canonical watcher state animasyon veya operation kuyruğunu beklemez. Genel mutation için kalıcı idempotency garantisi eklenmedi: çift UI submit kilitlenir; belirsiz timeout GET/watch ile incelenir. Mevcut worker provisioning idempotency/journal korunur.

## Üretim dağıtımı

`make build` / `scripts/build-release.mjs`, Vite çıktılarını `backend/internal/webui/dist` içine hazırlayıp Go `embed.FS` ile aynı binary'ye alır. Üretilmiş dosyalar Git'e eklenmez; kaynak-only Go testleri README placeholder ile çalışır. Açık `STATIC_DIR` güvenilir override'dır; yoksa embedded frontend önceliklidir. API/WS yollarına SPA fallback uygulanmaz, eksik asset404 döner. Statik sayfa frame-ancestors/X-Frame-Options/nosniff/no-referrer ile korunur; HTTP preview'un ayrı opaque sandbox politikası bozulmaz. Binary portu değişse de istemci aynı-origin `/api` ve `/ws` kullanır.

CLI process environment üzerinden standart client-go loader'a override verir; kubeconfig dosyasına yazmaz. Varsayılan loopback/read-only, nonloopback için operator token zorunlu. İki izin katmanı (server --write ve scoped browsergrant) Kubernetes yetkilerinin üst sınırını genişletmez. TLS terminator forwarded header'ları örtük güvenilir sayılmaz; local-first dağıtım SSH/kubectl loopback yolunu belgeler.

## Çalışan katmanlar

React 18 / R3F 8 / Drei 9 / Three 0.164 korunur. Vite 6.4.5 güvenlik düzeltmeleri için yükseltildi. Go client-go 0.30, dynamic client, typed logs/metrics ve discovery birlikte kullanılır. Frontend framework göçü yapılmadı.

6 Kasım kabulü: [49 hücrelik karşılaştırma ve gerçek E2E sınırları](PRE_V11_VISUAL_REPAIR.md). Son ürün kaynak/build kimliği donduruldu; yeni materyal sayacı yalnız test harness'inin isteğe bağlı checkpoint envanteridir. Mevcut `canvas.__harbor.scene` üzerinden benzersiz erişilebilir geometri/materyal sayılır; yeni render döngüsü, timer, listener, Worker veya üretim endpoint'i kurulmaz. Renderer nesne/program sayıları, sahne envanteri, JS heap ve süreç RSS farklı ölçümlerdir. Envanter renderer-generated/off-scene materyalleri veya GC tamamlanmasını kanıtlamaz.

1. `backend/pkg/server`: gerçek context seçimi, HTTP API, kimlik doğrulama, SSAR, dynamic informer ve WebSocket. Önceki `k8 sn`/`websocket` paketleri ana çalışma yolunda kullanılmaz; eski örnek log fallback’i kaldırıldı.
2. `frontend/src/context/ShipyardClusterContext.jsx`: modül düzeyinde tek WebSocket yöneticisi. Kaynak değişiminde oturum epoch artırılır, eski callback/istek/socket reddedilir. UI yalnız ham nesneleri paylaşır.
3. `frontend/src/data/resourceStore.js`: saf snapshot/delta reducer, UID kimliği, bounded 500 olay / 1 saat ve 241 metrik örneği. `resourceVersion` opaque dize olarak korunur.
4. `frontend/src/App.jsx`: tam ekran dünya, ortak seçim/namespace ve geçici pencere akışı. `world/` tesis kaydı, bağlamsal merkez/katalog, nesne bulucu, ayarlar ve işlem gözlemcisini kapsar. Kalıcı dashboard/sidebar/split view yoktur. `workbench/` mevcut gerçek tabloları, ayrıntıları, formları, grafikleri, log ve terminal akışlarını korur.
5. `frontend/src/harbor/`: liman yerleşimi, ortak prosedürel asset/materyal, UID slotları ve geçici animasyon koordinatörü. `components/ShipyardScene.jsx` yalnız eski import yolunun uyum köprüsüdür. Eski monolit ve kullanılmayan sahte paneller kaldırıldı.
6. `frontend/src/data/demo.js`: açık kullanıcı seçimiyle çalışan deterministik fixture kaynağı. Gerçek API işlemleri bu modda engellenir.

### 26 Ekim 2026 — Kaynak indeksi ve panel sınırı

Provider, canonical objeleri değiştirmeden `data/resourceIndex.js` ile UID/tür/Node/owner/Event indekslerini tek geçişte türetir. Değişmeyen bucket dizileri korunur; source değişiminde paylaşım sıfırlanır. Uyumluluk `ships` görünümü aynı alanları taşır. App'in Node/Pod ayrıntı kapsamı, kendi kaynakları ve ilişkileri değişince yenilenir; genel tür kataloğu tam listeyi kullanır. `ResourceDetails` memo sınırı ve kararlı callback'ler panel gövdesini ilgisiz Pod olaylarından ayırır. Son veri metni ayrı context tüketicisidir; canonical yayın geciktirilmez. Backend cache/watch paylaşımı değiştirilmedi.

Hareketli kargo hâlâ mevcut R3F frame'inde instance buffer'a yazılır. Statik kutu şablonları UID'ye, dönüş tabanı Node'un güncel pose'una bağlıdır; geometri/LOD/kalite korunur. Panel için bütün filo pozisyonları React state'ine taşınmaz; seçilen geminin yalnız değişen seyir durumu yayınlanır. Cache ve silme yolları bounded kalır.

Log flush'ı yeni chunk geldikten sonra tek180 ms timeout ile kurulur; veri yokken boş interval yoktur. Eski loglarda scroll korunur, “En alta dön” açık eylemdir. Satır/byte/yarım satır sınırları ve abort davranışı değişmez. Ayrı React production profiling build'i ve opt-in ölçüm kancaları normal kullanıcıda aktif değildir. Deneyler, sayılar ve sınırlar: [panel CPU raporu](PANEL_CPU_OPTIMIZATION.md).

### 30 Ekim2026 — Dolu log ve ölçüm sınırı

Log görünümü32satırlık ordinal bloklarda değişmeyen metin düğümlerini korur. Satır/byte/partial sınırları,180ms flush, gerçek HTTP abort ve seçilebilir/kopyalanabilir tam metin aynı kalır. Soft UI CSS'i, canvas boyutu, hareket ve Kubernetes veri akışı değiştirilmedi. Instance kapasite yeniden kullanımı prototipi toplam fayda göstermediği için üretime alınmadı; exact-count mesh yaşam döngüsü devam eder. Benchmark saat/PID kapıları yalnız test araçlarıdır; yeni production endpoint, Worker/WASM veya render döngüsü eklenmedi. Genel CPU kazancı kanıtlanmadı; [son ölçüm ve sınırlar](PANEL_CPU_OPTIMIZATION.md) esas alınır.

## Snapshot, watch ve resync

`GET /api/contexts` gerçek kubeconfig/in-cluster seçeneklerini döndürür; `KUBE_CONTEXT` sunucu başlangıç seçimini belirleyebilir. `/ws?context=...` bağlantısında context sabittir. Her bağlantı rastgele bir `generation` üretir. Dynamic informer listeleri ve store’ları senkronize edilir; `SNAPSHOT` gerçek ham kaynakları (Secret sanitize edilerek), hataları ve sağlık bilgisini taşır. İlk listeler yeni Pod animasyonu değildir. Sonrasında `RESOURCE_EVENT` ADD/UPDATE/DELETE taşır. Tombstone açılır; aynı resourceVersion UPDATE atlanır.

İstemci cluster+kind+UID kapsamını korur. Aynı namespace/ad yeni UID ise farklı yaşam döngüsüdür; gecikmiş eski UID silmesi yenisini etkilemez. Authoritative snapshot kaybolmuş kaynakları uzlaştırır. Backend kuyruğu bounded; overflow veya reflector hatası stale bildirimi ve yeniden bağlantı/snapshot gerektirir. Tarayıcı WS, Kubernetes erişimi, snapshot ve stale ayrı alanlardır. Son gerçek kaynak güncellemesi heartbeat ile değiştirilmez.

Tarayıcı başına tek WS vardır; backend’de informer fabrikası bağlantı başına kurulur. Çok kullanıcılı kullanım için yetki kapsamlı ortak watch havuzu henüz uygulanmadı; 100 kullanıcı/çok büyük cluster verimliliği iddia edilmez.

## API ve mutasyon

- `/api/discovery`: gerçek GVR/kind/namespace scope/API verbs.
- `/api/resources`: discovery tabanlı list/get/POST create/PUT edit/DELETE. Dry-run Kubernetes API’de çalışır; PUT resourceVersion ve UID, DELETE preconditions kullanır.
- `/api/capabilities`: SelfSubjectAccessReview, server read-only, scope ve subresource koşulları.
- `/api/actions`: scale, restart, resources, cordon/uncordon, resize, CronJob, rollback, drain akışları. HPA sahipliği, controller strategy ve namespace kapsamı sunucuda da denetlenir.
- `/api/logs`: ham Pod adı, namespace, container, tail/follow/previous/timestamps ile gerçek HTTP stream. Fallback başarı verisi yok. İstemci `LogBuffer` yerel geçmişi 5000 satır / 1 MiB UTF-8 ve bitmemiş satır dahil satır başına16 KiB ile sınırlar; kısaltma görünürdür. Container değişimi/kapanış eski stream'i abort eder. Ham sunucu logu bu görünüm sınırından etkilenmez.
- `/api/metrics`: metrics.k8 sn.io gerçek Node/Pod kullanım değerleri. Uzun geçmiş deposu değildir; frontend oturum belleğinde 15 saniyelik örnekler tutar.
- `/api/exec`: gerçek pods/exec WS/SPDY; tarayıcı terminali non-TTY pipe olarak açıkça etiketlidir.
- `/api/portforwards`, `/api/portforward/<id>/`: seçili Pod UID ve portla sınırlı, süreli gerçek SPDY tüneli; HTTP önizleme ve ham TCP WebSocket. Genel bir host/shell proxy değildir.
- `/api/openapi`: cluster şemasına erişim; gelişmiş şema tamamlama editörü henüz yok.
- `/api/secrets/reveal`: ayrı ve yetkili, amaçlı Secret okuma. Toplu state içinde değer yok; maskelenmiş veri editörle geri yazılmaz.

İşlem yanıtındaki `operation.id` API kabulünü temsil eder. UI bu kaydı seçili UID / generation / replica hedefiyle ilişkilendirir ve watch sonucunu bekler. Controller gecikmesi, finalizer, kısmi hata ve 409 ayrı sonuçtur. Tam kalıcı backend operasyon günlüğü yoktur; UI işlem takibi oturumluk ve sınırlıdır.

## Node hedefleme ve bağlamsal seçim

Tesisler uygulama girişleridir; Kubernetes nesnesi gibi UID üretmezler. Gerçek gemi/palet/container seçimleri aynı normalized store’u kullanır. Container instance index yalnız o çizimde UID + ham container adına eşlenir. Bulucu, fiziksel tıklama ve pencereler aynı onSelect/onAction yoluna bağlanır. DOM overlay pointer/wheel olayı canvas’a geçmez; drag eşiği yanlış seçimi önler.

Gemiden create, mevcut nodeSelector’ı ve NodeAffinity OR dallarını koruyarak her required dala singleton `metadata.name` matchFields koşulunu AND olarak ekler. Preferred ayrı ağırlıklı tercih, scheduler modu yalnız formun kendi eklediği kuralı kaldırır. `spec.nodeName` yazılmaz. Client ve backend seçili Node’un güncel UID’sini doğrular; çelişki sessizce silinmez. Kubernetes affinity Node adına bağlandığından API kabulünden sonraki Node recreation iki kaynak arasında atomik olarak engellenemez; gözlenen Node kimliği ayrıca izlenir.

## Animasyon sınırı

Kanonik state transfer süresini beklemez. `HarborSlots` yerleşimi UID ile korur; namespace filtresi ve sıralama kaynağı yerinden oynatmaz. `TransferCoordinator` sadece gözlenen nodeName değişimine veya açıkça görsel varışa tepki verir. İlk snapshot kurulumu, bounded kuyruk, fiziksel vinç başına bir yük, iptal, context reset ve reduced motion saf modüllerde sınanır. Node Unknown iletişim durumudur; backend kopması gemileri batırmaz.

`fleet.js` UID başına yay uzunluğuyla ölçülen rota ilerlemesi, trafik aralığı, süpürülmüş kapsül çarpışmaları, yaklaşma/yanaşma/yükleme/ayrılma ve rezervasyonları tutar. Sabit8 gemi bölgesi ve sabit kara/iskele sınırı, Node sayısı değişince rota biçimini değiştirmez. Bölge dışı UID fazları askıda saklanır; gerçek DELETE bunları da temizler. Kaynak store’una frame başına pozisyon yazılmaz.

`waterModel.js` tek analitik dalga modelidir; CPU gemi yüksekliği/eğimleri ve Ocean GPU shader'ı aynı faz/şiddeti kullanır. `Ocean.jsx` iki kaydırılan ripple katmanı ve hıza bağlı hafif kıç izi sunar; statik geometri/material yaşam döngüsünü temizler. Düşük kalite ikinci ince normal katmanını ve izi kapatır. Dalga kapatılınca faz donar, şiddet0'a yumuşar; statik su yüzeyi çizilebilir olmaya devam eder.

Canvas demand rendering kullanır; **seyir/deniz açıkken sürekli invalidation gerekir**. İkisi kapalı ve geçiş yokken idle davranışı devreye girer. `visibilitychange` görsel saati durdurur; görünmeyen sekmede delta birikmez, eski transferler birleştirilir. Kamera/etiket/instanced kargo aynı gemi dönüşümünü kullanır. Ağ çizgileri hareketli kaynak konumuna güncellenen mevcut buffer'ı kullanır; trafik telemetrisi değildir.

`world/preferences.js` version1 kaydı doğrular, güvenli yükler/saklar ve açık kullanıcı tercihi ile etkili sistem azaltılmış hareketini ayırır. Opak Neumorphism token'ları, yüksek kontrast, açık/koyu/sistem teması ortak panellerde uygulanır. `ResourceDetails` görsel hareket bölümü iç kaydırmada kalır. Ayrıntı overlay'i canvas'ı mount etmez; takip/odak yalnız açık kullanıcı eylemiyle başlar, manuel Orbit başlangıcı takibi bırakır.

## Erişim modeli

Varsayılan `READ_ONLY=true`, loopback bind. Yerel tek kullanıcı kubeconfig kimliğiyle çalışır. Non-loopback bind için `API_TOKEN` zorunlu; HTTP bearer veya HttpOnly SameSite oturum cookie’si kullanılır. WebSocket ve HTTP same-origin kontrolü uygular. Shared kullanım aynı gateway Kubernetes kimliğini paylaşır; per-user Kubernetes impersonation yoktur. Dolayısıyla internet üzerinde açık çok kiracılı admin proxy olarak dağıtılmamalıdır. Helm varsayılan okuyucu RBAC; yazma ayrı opt-in ve namespace sınırlıdır. Kubeconfig/token tarayıcıya aktarılmaz.

## Sunum — v1.1 öncesi ayrı statik dağıtım kaydı

Önceki dağıtımda production frontend `STATIC_DIR`, `/app/public` veya repo build yolundan sunulur, binary ve statik dosyalar ayrı parçalar olarak taşınırdı. Güncel aday bu kaydın üzerine yukarıdaki **Üretim dağıtımı** bölümündeki Go embed yolunu ekler; dış statik yollar güvenilir override/geliştirme uyumluluğu olarak kalır. Vite geliştirmede `/api` ve `/ws` aynı origin proxy eder; backend portu `API_TARGET` ile değiştirilebilir.

## 1 Kasım 2026 — Kapsam, kimlik ve opsiyonel sağlayıcılar

Snapshot `scopes` alanı GVR+namespace bazında authoritative/syncing/forbidden/unavailable durumunu taşır. Başarılı kapsamda doğrulanmış yokluk ve gerçek DELETE tombstone üretir; kapsanmayan on-demand CR silinmiş sayılmaz. Aynı context reconnect canonical store, seçili UID ve sınırlı lease'leri korur; namespace tabanı değişebilir, seçili eski scope pin'lenir. GVR abonelikleri32, tombstone geçmişi1000 kayıtla sınırlıdır. Scope bırakmak DELETE animasyonu değildir.

`log_session.go` beklenen UID'yi watch/açılış/ilk yayın aşamalarında doğrular, sınırlı8KiB staging ve iptal kullanır. İstemci UID/session/protocol başlıklarını ve current-session guarded hata kaydını doğrular. Kubernetes name-addressed logs API'si atomik UID önkoşulu sunmadığı için mutlak yarışsızlık iddia edilmez; gerçek replacement interleaving testleri sağlanan sınırı gösterir. Mevcut5000satır/1MiB/16KiB/180ms görünüm korumaları değişmez.

`template_capability.go` actual owner UID zincirini çözer; D/STS/DS template değişikliği desteklenir, standalone RS/Job/CronJob aynı işlemle taklit edilmez. Frontend API'nin doğruladığı targetUID/effect/reason sözleşmesini kullanır. Generic işlemler oturumluk; yerel worker sağlayıcısının journal'ı ise kalıcı ve ayrıdır.

`pkg/provision` önceden izinli tek minikube docker profile/context/clusterUID'ye sabit worker-add çalıştırır. Tarayıcı binary/komut/profile gönderemez. Yerel operatör, yazma modu ve Node yetkisi gerekir. Profil process lock ve sonlu idempotency journal ikinci isteği engeller; restart/timeout sonrası önce envanter uzlaştırılır, kör retry/silme yapılmaz. CLI başarı kodu Ready değildir; gerçek yeni Node UID/adres ve Ready ayrıca eşleşir. Belirsiz/yarım işlem korunur ve operatör uzlaştırması gerektirir.

`pkg/traffic` Hubble1.20.2 resmi CLI'nin gRPC/protobuf JSONPB çıkışını fixed argüman+field mask ile okur; SDK ekleyerek client-go major sürümü değiştirilmedi. TLS bilgisi backend'de kalır. Yapılandırılmış context/clusterUID/API TLS binding ve Cilium cluster.name doğrulanır; gerçek seçili kimlik yalnız yetkili namespace Pod verisini okur. Collector anahtarı context+opaque auth fingerprint+namespace+Node metadata iznidir. İstemci lease kapanışı diğerini kapatmaz;8scope/32lease,15sn lease timeout,4096gözlem/10sn,512grup, bounded reader ve kayıp sayaçları vardır. Seçili UID yalnız zaten yetkili grupları önceliklendirir. İptal subprocess'i ve wait'i temizler; kopmada bounded2–10sn retry, gerçek veri gelmeden canlı iddiası yoktur.

Hubble endpoint'lerinde UID yoksa yalnız iki pozitif Pod gözlemi arasındaki IP/name/namespace zamanı eşleşir; reuse boşluğu bilinmez kalır. IP.encrypted HTTPS değildir; L7 gecikmesi yalnız gerçekten sağlanan yanıt olayınındır. URL/header/payload/DNS sorgu içeriği istenmez veya yayınlanmaz. ClusterMesh uzak küme aynı namespace adına sahip olsa bile yerel SSAR'la yetkili sayılmaz.

`visualLifecycle.js` ortak bounded Node/container/owner süreç state'idir; gerçek state'i değiştirmez. Node gövde/kargo/selection/anchor aynı güncel pose zincirini kullanır. İlk snapshot geçmiş arızaları yeniden oynatmaz. Alev/duman/sıçrama paylaşılan instanced geometri/materyaldir; yeni rAF/physics motoru yoktur. `MeasuredTraffic` yalnız açık katmanda mount olur,96görsel sınırını/toplamı belirtir, seçili Pod ilişkisini öncelikler. Ağ topolojisi ile trafik birbirinin kanıtı değildir.

Bu mimari değişikliklerinin gerçek API/visual/performans kabulü ayrı tutulur: [onarım kaydı](PRE_V11_VISUAL_REPAIR.md). Son performans kapıları tamamlanmadan toplam kaynak tasarrufu veya v1.1 tamamlanması iddia edilmez.

## 9 Kasım 2026 — çoklu proje / çoklu liman genişletmesi

Yerel operatör modeli korunur. Bağlantı güvenilir server-side context referansıdır; liman tek bağlantı üzerinde açık namespace kümesi ve isteğe bağlı selector'dır. Workspace bunların koleksiyonudur. İsimler kimlik değildir; uygulama kayıtları immutable ID, kaynaklar doğrulanmış cluster + GVR/namespace/UID ile adreslenir. Cluster kimliği doğrulanamıyorsa bağlantılar birleştirilmez. Aynı doğrulanmış cluster UID, credential eşdeğerliğinin kanıtı değildir.

`pkg/workspace` sürümlü özel `workspace.json`, yedek, atomik rename, optimistic revision ve güvenli export/import sınırını taşır. `--data-dir` normal kullanıcı dizinini geçersiz kılar; repo/.git bağımlılığı yoktur. İlk açık legacy context bir defa ilk limana taşınır; boş ilk kurulum kullanıcının global current-context'ini otomatik seçmez. Bozuk veya gelecekteki şema korunup hata döner. Secret, kubeconfig ve write grant görünüm kaydına yazılmaz. Güvenli form taslakları yalnız sınırlı oturum belleğindedir.

`server/workspace.go` request üzerindeki workspace/harbor/tab kimliklerini sunucudaki kayda bağlar. Context query ile başka bağlantıya yönlendirilemez. Namespace/selector server tarafında generic/dynamic ve typed işlem yollarında uygulanır; gerçek RBAC ayrıca denetlenir. Küme kapsamlı işlemler proje sahipliği izlenimi vermeden ortak etki onayı ister. Namespace/selector değişimi ve credential nesli grant/stream yaşam döngüsünü etkiler. On-demand CR'nin kapsam dışına çıkması `OUT_OF_SCOPE` olur; gerçek DELETE tombstone'una dönüşmez.

`workspace_broker.go` aynı opaque client nesli, connectionRef, GVR ve namespace için informer paylaşır. Farklı credential veya connection kaydı cache paylaşımıyla yetki kazanmaz. Her abone kendi selector ve yetkili kapsamını uygular; son lease kapanınca watch durur. Bounded broker ve stream kuyrukları korunur. İki browser sekmesinin yönetim grant'i cookie+workspace+harbor+tab anahtarlarıyla ayrıdır.

Frontend `WorkspaceRegistry`, uyumlu tam kapsamlar için tek canonical source manager kullanır; her limanın request/grant/selection bağlamı ayrıdır. `WorkspaceProvider` yerel workspace ve güvenilir context kataloğunu yükler. Tek ayrıntılı dünya/Canvas korunur; uzak limanlar hafif görünür. Dünya ve paneller aynı manager/store'u kullanır. Gizli limanın veri gözlemi görsel render uykusundan ayrıdır; log yalnız aktif panel yaşam döngüsünde açılır. Başlatılan mutation hedefi kendi kaynak bağlamında kalır; view switch API kabulünü geri almış gibi gösterilmez.

Ortak Node üyeliği yalnız doğrulanmış cluster+Node UID üzerinden açıklanır; toplam Node kapasitesi ile proje yüklerinin kapsamı farklıdır. İlişki katmanları ortak altyapı, yapılandırılmış bağımlılık ve ölçülmüş akış olarak ayrılır. Hubble endpoint kapsamı açık namespace/selector kümeleridir; başka bağlantının yetkisi veya metadata'sı ödünç alınmaz. Cross-cluster ağ, ClusterMesh kurulumu ya da Node göçü bu modelin kendiliğinden sağladığı bir özellik değildir.

`--replay-profile M|L` yalnız açık manuel yük kaynağıdır: embedded benchmark-v2/seed20261024 verisi, read-only fake upstream, normal informer/WebSocket/store yolu. Canlı bağlantı hatasının fallback'i değildir. TEST/REPLAY kimliği gerçek cluster doğrulaması sayılmaz, metrics yokluğu korunur, sentetik loglar ayrıca etiketlenir. Sınırlı nonce-korumalı fixture üreticisi yalnız bu modda kayıtlıdır; canlı Kubernetes mutation servisi yerine geçmez.

Uygulanan parçaların kabulü: [WORKSPACE_ACCEPTANCE.md](WORKSPACE_ACCEPTANCE.md). Önceki kaynaklara ait testler yeni kod için otomatik PASS değildir. Kullanıcının manuel kabulü ve eski CPU/fiziksel latency kapıları açık kalır.
