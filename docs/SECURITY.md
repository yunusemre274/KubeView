# KubeView güvenlik ve erişim sınırı

Bu belge 1.1.0 adayının güncel uygulama sözleşmesini açıklar. Stable release, tamamlanmış güvenlik kabulü veya bütün dağıtım modellerinin test edildiği iddiası değildir. Yayın durumu [release notlarında](RELEASE_NOTES_v1.1.0.md), önceki testlerin kapsamı [onarım kaydında](PRE_V11_VISUAL_REPAIR.md) ayrıca tutulur.

## Kimlik ve tehdit modeli

İlk model **local-first, tek yerel operatör** kullanımını hedefler. Gateway, güvenilir bağlantının seçili kubeconfig kimliğiyle Kubernetes'e bağlanır; workspace farklı context/credential kullanan bağlantılar içerebilir. In-cluster bağlantı Pod'un mevcut ServiceAccount kimliğini kullanır. Tarayıcı için ayrı Kubernetes kullanıcı hesabı, SaaS tenant izolasyonu veya per-user impersonation yoktur: aynı bağlantıyı kullanan operatörler o bağlantının backend kimliğini kullanır. `API_TOKEN` uygulamaya erişim anahtarıdır; Kubernetes rolü veya kullanıcı ayrımı sağlamaz. Uygulama kaydı/label seçimi gerçek RBAC sınırının yerine geçmez.

Çoklu liman request'inde workspace/harbor/tab ID sunucu kaydına bağlanır; namespace/selector ve gerçek yetki typed/generic yollarında uygulanır. Farklı credential nesilleri informer/cache/metrics/flow verisini ödünç almaz. Aynı cluster UID fiziksel dedup içindir, yetki eşdeğerliği değildir. Yazma grant'i cookie+workspace+harbor+document-tab kapsamındadır; import ve başka limana geçiş yetki kazandırmaz. Küme kapsamlı mutasyon ortak etki onayı gerektirir. Workspace export credential ve hassas host yolu taşımaz; import güvenilir yerel context'e açıkça bağlanmalıdır. Güncel test kapsamı ve açıklar [workspace kabul defterinde](WORKSPACE_ACCEPTANCE.md) izlenir.

Korunan sınır, başka bir web sayfasının yerel gateway üzerinden kullanıcının Kubernetes yetkisini kullanması ve eski context/namespace isteğinin yeni seçimde uygulanmasıdır. Güvenilir işletim sistemi kullanıcısının, aynı hesap altında çalışan zararlı yazılımın veya ele geçirilmiş backend/kubeconfig'in tüm sonuçlarından koruyan bir sandbox değildir. Kubeconfig kimliği ve Kubernetes admission/RBAC son güvenlik sınırı olarak kalır. Backend'i internete açık, çok kullanıcılı SaaS yönetim proxy'si olarak dağıtmayın.

## Bind, origin ve erişim token'ı

Binary varsayılan olarak `127.0.0.1:8000` üzerinde HTTP sunar. Loopback dışına `--bind` / `BIND_ADDR` ile çıkmak `API_TOKEN` gerektirir; token yoksa süreç başlamaz. Token olmayan yerel HTTP isteklerinde Host yalnız localhost/loopback olabilir. Docker'ın container içi `0.0.0.0` varsayılanı da token zorunluluğuna tabidir; host portu yayınlanacaksa `127.0.0.1` ile sınırlandırın.

Operatör token'ını komut argümanında veya URL'de taşımayın. `--api-token-file` tek satırlık, en az 32 karakterlik token okur; dosyayı yalnız kendi kullanıcınızın okuyabileceği izinlerle oluşturun. `API_TOKEN` ortam değişkeni mevcut dağıtımlar için korunur; güçlü rastgele değer seçin, tanılama çıktısına/repoya yazmayın. Token isteyen sunucuda kullanıcı bağlantı penceresinden giriş yapar. Kimlik doğrulaması `kubeview_session` HttpOnly, SameSite=Strict, sekiz saatlik cookie'sini kullanır; token localStorage'a kaydedilmez. Cookie `Secure` alanı gerçek TLS isteğine bağlıdır; mevcut standalone dinleyici HTTP'dir.

HTTP ve WebSocket denetimleri tarayıcı Origin'inin **gerçek bağlantı scheme'i ve Host/port'u** ile eşleşmesini ister. Opaque `null` Origin, farklı origin, origin içinde kullanıcı bilgisi/yol/query/fragment ve `Sec-Fetch-Site: cross-site` reddedilir. Genel `Access-Control-Allow-Origin: *` yolu yoktur. JSON gövdeleri `application/json`, tek ve boyutu sınırlı bir JSON değeri gerektirir; HTML formu veya `text/plain` JSON taklidi kabul edilmez. Origin göndermeyen yerel CLI istekleri mümkündür; yazma için cookie, güncel bağlantı nonce'u, açık yönetim modu ve Kubernetes yetkileri yine gerekir.

`X-Forwarded-Host` ve `X-Forwarded-Proto` güvenilir proxy beyanı olarak kullanılmaz. Mevcut binary TLS dinleme bayrağı sunmaz; TLS sonlandıran rastgele bir reverse proxy otomatik desteklenmez. Proxy çalışsın diye Origin/Host kontrollerini kapatmayın. Uzak makinede gateway'i loopback'te tutup SSH tüneli, Kubernetes içinde ise explicit context/namespace ile localhost'a `kubectl port-forward` kullanın. Tarayıcı o tünelin HTTP origin'ini kullanır. Ağın başka noktalarına açık düz HTTP üzerinde token göndermeyin. Kubeconfig API server TLS doğrulaması bundan ayrıdır ve bağlantı hatası nedeniyle otomatik devre dışı bırakılmaz.

Vite yalnız geliştirme yoludur; `/api` ve `/ws` same-origin proxy'sinde `changeOrigin:false` upstream'e tarayıcı Host'unu korur. Production paketi gömülü frontend ve API/WS'yi aynı Go sürecinden sunar. `STATIC_DIR` yalnız güvenilir, sürümle uyumlu statik arayüz için override'dır; bu dizini değiştirme yetkisi uygulama kodunu değiştirme yetkisidir.

`API_TOKEN` statik uygulama erişim anahtarıdır. `kubeview_session` cookie'sinin
sekiz saatlik `MaxAge` değeri tarayıcıda saklama süresidir; bu anahtara ayrı bir
sunucu tarafı sekiz saatlik bearer süresi eklemez. Anahtar geçerli kaldıkça doğru
Bearer değeriyle erişim mümkündür. Yönetim modunu kapatmak bu anahtarı iptal etmez;
per-user giriş/çıkış ve bağımsız iptal edilebilir erişim oturumları sunulmaz.
Anahtarın ömrü ve rotasyonu yerel operatörün yapılandırma sorumluluğudur.
Bu sözleşme, aşağıdaki ayrı yönetim oturumunun mutlak sunucu deadline'ından farklıdır.

## Salt okunur başlangıç ve yönetim onayı

`READ_ONLY=true` varsayılandır. `--write` veya `READ_ONLY=false` yalnız sunucunun yazma kilidini açar. Her tarayıcı başlangıçta salt okunurdur; **Yönetim modunu aç** eylemi ayrıca gerekir. Bir Role adı, UI'da düğmenin görünmesi veya başarılı dry-run izin/uygulama kanıtı değildir. Gerçek Kubernetes API server son yetki ve admission kararını verir.

Bağlantı tanılaması seçili context, namespace ve backend'in özel istemci/yapılandırma kimliğine bağlı bir yönetim niyeti üretir. Tarayıcı bunu yalnız bellekte tutar. `kubeview_operator`, uygulama erişim cookie'sinden ayrı rastgele HttpOnly SameSite=Strict oturum cookie'sidir. HTTP yazmaları `X-KubeView-Connection` nonce'unu kullanır; tarayıcının özel WebSocket header'ı gönderemediği exec/raw port-forward yollarında aynı nonce `connectionID` query'sinde taşınır. Bu alanları ekran görüntüsü, proxy/access log veya destek kaydına koymayın.

Yönetim enable cevabı, API/yetki kontrollerinden sonra nonce, iptal, context, namespace ve özel istemci kimliğini yeniden denetler. Revoke, context/namespace veya credential/API yapılandırması değişimi yazma niyetini geçersiz kılar. Revoke eski stream'leri iptal eder ve operatöre ait HTTP forward oturumlarını kapatır. Gecikmiş eski enable yanıtı yeni kapsamda izin açamaz. Tarayıcıda aynı A→B→A adlarına dönmek eski niyeti geri getirmez. Eksik oturum/kapalı yönetim 403; eski nonce/context/yapılandırma 409 sonucuna neden olabilir. İki sekme aynı tarayıcı cookie'sini paylaşır; bir sekmenin kapsam değişimi diğerinin yönetim oturumunu da geçersiz kılabilir.

Frontend epoch/scope guard'ları eski HTTP, WebSocket, metrics, log, CR, Hubble ve operation callback'lerini ayırır. Bunlar server kontrollerine ek kullanıcı arayüzü korumalarıdır. Genel işlemlerde UID/resourceVersion ve API precondition'ları korunur; form aynı anda ikinci gönderimi engeller. Ağ hatasında kabul sonucu belirsiz mutasyon otomatik tekrarlanmaz; gerçek GET/watch sonucu incelenir. Kalıcı idempotency journal'ı mevcut minikube worker sağlayıcısına özeldir; bütün generic mutasyonlar için kalıcı idempotency garantisi verilmez.

## Güvenilir kubeconfig ve namespace

`--kubeconfig` / `KUBECONFIG`, standart client-go dosya listesi birleştirmesini kullanır. Yerel varsayılan `~/.kube/config` ve uygun ortamda in-cluster ServiceAccount desteği korunur. `--context` / UI context seçimi global kubeconfig `current-context` alanına yazmaz. Etkin varsayılan namespace, kubeconfig namespace'i veya `default`; in-cluster için `POD_NAMESPACE`/ServiceAccount namespace dosyası veya `default` üzerinden belirlenir.

Kubeconfig güvenilir yerel yapılandırmadır: **exec auth plugin'i backend kullanıcısı olarak bir program çalıştırabilir.** Tanımadığınız bir dosyayı indirip KubeView'e vermeyin. Standart ilk akış tarayıcıya raw kubeconfig yükletmez; Kubernetes token, sertifika/private key ve exec-auth bilgileri backend'de kalır. Tarayıcıdan keyfi host shell komutu, URL, binary veya credential yolu çalıştırma arayüzü sunulmaz. Mevcut güvenilir exec auth plugin'leri ve açıkça yapılandırılmış sağlayıcı binary'leri bu sınırdan ayrı, operatör yapılandırmasıdır.

`--namespace` / `WATCH_NAMESPACE` sunucuda namespaced okuma ve yazmayı sınırlar. UI namespace filtresi bağımsız bir erişim kontrolü değildir; kullanıcı bildiği namespace'i elle girse de API RBAC uygulanır. Namespace veya Node LIST izni olmayan kimlik kendi izinli Pod/Deployment kapsamını kullanabilir; hayali Node/kapasite veya boşluğu kapatan demo üretilmez. Cluster-scoped Node erişimi ve bakım işlemleri kendi izinleriyle değerlendirilir.

Minimum örnekler: [namespace okuyucu](../deploy/rbac-namespace-readonly.yaml), [isteğe bağlı workload yazma](../deploy/rbac-namespace-write.yaml), [ayrı Pod log/metrics okuma](../deploy/rbac-namespace-observability.yaml), [isteğe bağlı Node/metrics okuma](../deploy/rbac-node-observability.yaml). `kubeview-example` mevcut izinli namespace'inizle değiştirilir. Örnekler cluster-admin/wildcard veya varsayılan Secret/exec/RBAC yönetimi vermez. Yeni izin vermeden önce ihtiyaç duyulan eylemin verb/subresource kapsamını inceleyin. Helm/in-cluster erişimi de paylaşılan ServiceAccount kimliğini kullanır; uygulama erişim token'ı bu kimliği Kubernetes kullanıcılarına bölmez.

## Secret, log, terminal ve önizleme

Toplu resource/watch state'i Secret değerlerini taşımaz. Secret içeriği ayrı, açık ve yetkili reveal/edit akışındadır; maskeli değerler gerçek içerik gibi geri yazılmaz. Kullanıcının bu akışta bilerek açtığı değer tarayıcıda bulunabilir; ekran paylaşımı ve clipboard'a dikkat edin. Uygulama logları veya YAML kullanıcıya ait başka hassas içerikler de taşıyabilir; KubeView bütün serbest metin sırlarını otomatik tanıyan bir redaktör değildir.

**Tanılamayı kopyala** kontrollü bir allowlist kullanır: mod, context/namespace, bağlantı/snapshot/stale/read-only alanları, son kaynak zamanı ve kontrol durumları. Ham hata mesajı, API adresi, bağlantı nonce'u, kubeconfig, kaynak içeriği veya sağlayıcı credential'ı bu özete dahil edilmez. Destek raporuna bunun dışında log/Secret/reveal içeriği eklemeden önce veriyi inceleyin. Kimlik doğrulama, auth plugin, TLS, DNS/ağ, Forbidden, validation/quota/admission ve conflict hataları backend'de güvenli kategorilere dönüştürülür.

Pod logları gerçek Kubernetes logs API'sinden, beklenen Pod UID/container ve stream oturumu guard'larıyla okunur. Name-addressed Kubernetes endpoint'i atomik UID önkoşulu sunmadığından mutlak yarışsız UID-pinned logs garantisi yoktur. Yerel görünüm sınırları 5000 satır / 1 MiB UTF-8 / satır başına 16 KiB ve yaklaşık 180 ms flush'tır; upstream log değiştirilmez. Panel/container/kapsam kapanışı eski stream'i iptal eder.

Exec, seçili Pod/container içinde gerçek `pods/exec` yetkisiyle çalışan non-TTY pipe arayüzüdür; host terminali veya tam TTY garantisi değildir. Port-forward kullanıcı yolu seçili UID/port'a bağlı, süreli gerçek HTTP önizlemesidir; genel host/shell proxy veya UDP tüneli değildir. Önizlemede CSP sandbox `allow-scripts allow-forms` kullanılır, `allow-same-origin` verilmez. Upstream yanıt cookie/CORS alanları ve upstream'e giden gateway Authorization/Cookie/connection nonce bilgileri temizlenir. Oturum listesi/okuma/kapatma operatör cookie'sine bağlıdır; revoke/kapsam değişimi oturumları kapatır.

Ana gömülü arayüz `script-src 'self'; worker-src 'self' blob:` politikasını kullanır;
inline/eval izni eklenmez. Bu politika yalnız frontend handler'a aittir; API/WS veya
önizlemenin ayrı sandbox politikasına global olarak eklenmez. CSP, güvenilmeyen
metni güvenli render etmenin yerine geçmez. UI/preview route bileşimi ve MIME/nosniff
sınırı unit ile doğrulandı. Aynı adayda normal Chromium/Metal ve Playwright WebKit
akışı, inline script reddi ve blob Worker pozitif kontrolü geçti
([TEST11.05](../ROADMAP_FOR_TESTS.md)). External script browser canary ve gerçek
Kubernetes forwarded HTML testi bu sonuca dahil değildir. Vite geliştirme sunucusu bu Go
header politikasını kendiliğinden devralmaz.

## İsteğe bağlı metrics, Hubble ve worker

Metrics API gerçek ölçüm zamanı/birimiyle sunulur; request/limit/allocatable kullanım değildir. API yokluğu, Forbidden ve eski veri durumları sahte sıfır/rastgele seriyle örtülmez. Oturum belleği uzun dönem metrics deposu değildir.

Hubble bağlantısı yalnız açıkça yapılandırılmış mevcut sağlayıcı içindir; KubeView CNI/eBPF/agent kurmaz. TLS/mTLS anahtarları backend'de kalır. Context/cluster UID/API TLS binding, Cilium cluster adı ve gerçek namespace yetkileri ayrıca denetlenir. `configured` durumu canlı flow kanıtı değildir. Flow olayları bounded zaman penceresidir; paket/byte/bant genişliği sayılmaz. L7 ancak provider gerçekten bildirirse görünür; porttan HTTP/gRPC/TLS payload tahmini yapılmaz. URL/header/payload/DNS sorgu içeriği toplanmaz veya yayınlanmaz; zamanlı UID eşlemesi belirsizse null kalır. Selector topolojisi ölçülmüş trafik değildir. Sınırlar ve sabit yapılandırma örnekleri [README](../README.md#isteğe-bağlı-gerçek-worker-ve-trafik-sağlayıcıları) içindedir.

Worker sağlayıcısı açıkça izinli tek minikube docker profile/context/cluster UID ile sınırlıdır. Tarayıcı keyfi binary/profile/host komutu göndermez. Backend gate, yerel operatör, gerçek Node yetkisi, lock ve kalıcı idempotency journal birlikte uygulanır. Timeout/iptal oluşturulmuş makineyi otomatik silmez; belirsiz işlem envanter uzlaştırılmadan tekrarlanmaz. Yeni bir Node nesnesini API'ye yazmak makine sağlama kanıtı değildir. Genel bulut sağlayıcısı desteği vaat edilmez.

## Kaldırma ve veri ömrü

Süreci durdurmak HTTP/WS, log/forward ve child provider yaşam döngülerini kapatır; kullanıcı Kubernetes workload'larını veya minikube makinelerini silmez. Backend kaynak/metrics/yönetim oturumları bellektedir. Binary/paket dizini kaldırılabilir; tarayıcı site verisini temizlemek görünüm tercihlerini ve cookie'leri kaldırır. Kubeconfig veya Kubernetes credential'ları kaldırma adımı değildir.

Sağlayıcı journal'ı varsayılan olarak `~/.local/state/kubeview/providers` altındadır; `KV_PROVIDER_STATE_DIR` override'ı olabilir. Açık/belirsiz worker işlemi varsa gerçek envanter uzlaştırılmadan journal silinmemelidir. In-cluster kaldırma yalnız size ait KubeView Helm release'i ve ayrıca oluşturduğunuz KubeView RBAC nesneleri için yapılır; kullanıcı namespace/workload/PVC temizliği içermez. Sağlayıcı TLS/token dosyaları operatörün dosyalarıdır; erişim izinlerini ve gerekli saklama süresini ayrıca yönetin.
