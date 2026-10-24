# Veri, işlem ve 3D mimarisi

## Çalışan katmanlar

React 18 / R3F 8 / Drei 9 / Three 0.164 korunur. Vite 6.4.5 güvenlik düzeltmeleri için yükseltildi. Go client-go 0.30, dynamic client, typed logs/metrics ve discovery birlikte kullanılır. Frontend framework göçü yapılmadı.

1. `backend/pkg/server`: gerçek context seçimi, HTTP API, kimlik doğrulama, SSAR, dynamic informer ve WebSocket. Önceki `k8 sn`/`websocket` paketleri ana çalışma yolunda kullanılmaz; eski örnek log fallback’i kaldırıldı.
2. `frontend/src/context/ShipyardClusterContext.jsx`: modül düzeyinde tek WebSocket yöneticisi. Kaynak değişiminde oturum epoch artırılır, eski callback/istek/socket reddedilir. UI yalnız ham nesneleri paylaşır.
3. `frontend/src/data/resourceStore.js`: saf snapshot/delta reducer, UID kimliği, bounded 500 olay / 1 saat ve 241 metrik örneği. `resourceVersion` opaque dize olarak korunur.
4. `frontend/src/App.jsx`: tam ekran dünya, ortak seçim/namespace ve geçici pencere akışı. `world/` tesis kaydı, bağlamsal merkez/katalog, nesne bulucu, ayarlar ve işlem gözlemcisini kapsar. Kalıcı dashboard/sidebar/split view yoktur. `workbench/` mevcut gerçek tabloları, ayrıntıları, formları, grafikleri, log ve terminal akışlarını korur.
5. `frontend/src/harbor/`: liman yerleşimi, ortak prosedürel asset/materyal, UID slotları ve geçici animasyon koordinatörü. `components/ShipyardScene.jsx` yalnız eski import yolunun uyum köprüsüdür. Eski monolit ve kullanılmayan sahte paneller kaldırıldı.
6. `frontend/src/data/demo.js`: açık kullanıcı seçimiyle çalışan deterministik fixture kaynağı. Gerçek API işlemleri bu modda engellenir.

## Snapshot, watch ve resync

`GET /api/contexts` gerçek kubeconfig/in-cluster seçeneklerini döndürür; `KUBE_CONTEXT` sunucu başlangıç seçimini belirleyebilir. `/ws?context=...` bağlantısında context sabittir. Her bağlantı rastgele bir `generation` üretir. Dynamic informer listeleri ve store’ları senkronize edilir; `SNAPSHOT` gerçek ham kaynakları (Secret sanitize edilerek), hataları ve sağlık bilgisini taşır. İlk listeler yeni Pod animasyonu değildir. Sonrasında `RESOURCE_EVENT` ADD/UPDATE/DELETE taşır. Tombstone açılır; aynı resourceVersion UPDATE atlanır.

İstemci cluster+kind+UID kapsamını korur. Aynı namespace/ad yeni UID ise farklı yaşam döngüsüdür; gecikmiş eski UID silmesi yenisini etkilemez. Authoritative snapshot kaybolmuş kaynakları uzlaştırır. Backend kuyruğu bounded; overflow veya reflector hatası stale bildirimi ve yeniden bağlantı/snapshot gerektirir. Tarayıcı WS, Kubernetes erişimi, snapshot ve stale ayrı alanlardır. Son gerçek kaynak güncellemesi heartbeat ile değiştirilmez.

Tarayıcı başına tek WS vardır; backend’de informer fabrikası bağlantı başına kurulur. Çok kullanıcılı kullanım için yetki kapsamlı ortak watch havuzu henüz uygulanmadı; 100 kullanıcı/çok büyük cluster verimliliği iddia edilmez.

## API ve mutasyon

- `/api/discovery`: gerçek GVR/kind/namespace scope/API verbs.
- `/api/resources`: discovery tabanlı list/get/POST create/PUT edit/DELETE. Dry-run Kubernetes API’de çalışır; PUT resourceVersion ve UID, DELETE preconditions kullanır.
- `/api/capabilities`: SelfSubjectAccessReview, server read-only, scope ve subresource koşulları.
- `/api/actions`: scale, restart, resources, cordon/uncordon, resize, CronJob, rollback, drain akışları. HPA sahipliği, controller strategy ve namespace kapsamı sunucuda da denetlenir.
- `/api/logs`: ham Pod adı, namespace, container, tail/follow/previous/timestamps ile gerçek HTTP stream. Fallback başarı verisi yok.
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

## Sunum

Vite geliştirmede `/api` ve `/ws` aynı origin proxy eder; backend portu `API_TARGET` ile değiştirilebilir. Production frontend `STATIC_DIR`, `/app/public` veya repo build yolundan aynı Go sunucusunda sunulur. Binary ve statik dosyalar ayrı dağıtım parçalarıdır; gömülü asset’li tek binary iddiası yoktur.
