# KubeView / Tersane

Kubernetes kümenizin arayüzü, tam ekran etkileşimli bir tersanedir. Merkez binasına, Node gemisine veya Pod yüküne tıklayarak çalışırsınız. Kalıcı dashboard, sidebar veya açık kaynak tablosu yoktur. Listeler, formlar, grafikler ve loglar ilgili nesnenin geçici penceresinde açılır.

![Hareketli tersane](docs/evidence/motion/fleet-overview.png)

## Kullanım

- **Merkez / kontrol kulesi:** Deployment ve workload oluşturma, kaynak kataloğu, gerçek olaylar ve metrikler.
- **Gemi:** gerçek Node; koşullar, o Node’daki Pod’lar, kapasite ve izinli bakım işlemleri. **Bu gemiye Pod ekle**, scheduler’ı atlamayan affinity formunu açar.
- **Yük grubu / kutu:** Pod ve belirli container; gerçek image, durum, kaynak ayarları, log, exec ve port-forward.
- **Vinç:** bekleyen yükler ve gözlenen scheduler olayları.
- **Depo, talimat panosu, kasa, ağ tesisi, fener ve personel bölümü:** ilgili gerçek kaynak türleri.

**Bul** veya **Cmd/Ctrl+K**, kaynak ve tesislere klavye ile erişir. **Limana dön**, genel kadraja döner. Paneller kapanırken canvas ve kamera korunur. Dar ekranda da ana görünüm limandır; ayrıntı paneli genişletilebilir alt sheet olur.

## Filo, deniz ve panel tercihleri

Sağlıklı Node gemileri varsayılan olarak kapalı ve güvenli su rotasında dolaşır. UID'ye bağlı seyir fazı kaynak güncellemesi, filtre veya pencere açılmasıyla sıfırlanmaz. Her bölgede en fazla **8 görünür gemi** vardır; bölge denetimi ve Bul bütün gerçek kaynaklara erişimi korur. Diğer bölgeler ek sahte Node üretmez. Normal tur yaklaşık **154 saniyedir**; duraklatma ve trafik bu süreyi uzatabilir.

Gözlenen yeni yük için uygun gemi geçici yanaşır, vinç işi bitince ayrılır. Görsel yaklaşma uzun sürecekse yaklaşık10 saniye sonra hedef gemide kısa varış kullanılır; bu, gerçek yanaşma olayı olarak kaydedilmez. Kanonik Node/Pod ataması ve Ready bilgisi animasyonları beklemez.

**Görünüm ve ayarlar**: seyir, hız, salınım, deniz, dalga şiddeti, iz, operasyon biçimi; sistem/azaltılmış/tam hareket; otomatik kalite; açık/koyu/sistem panel teması ve yüksek kontrast. Sol üstteki duraklatma düğmesi yalnız görsel hareketi durdurur. Node/Pod panelindeki **Görsel seyir ve kamera** bölümünden tek gemi durdurulabilir veya açıkça kamera takibi başlatılır. Elle kamera hareketi takibi bırakır. Bunlar Kubernetes cordon/scale işlemi değildir.

Deniz kapatılınca su fazı ve iz/salınım durur, yüzey yumuşakça statik hâle gelir; seyir ve gerçek veri akışı sürer. Tercihler sürümlü küçük yerel kayıtta doğrulanarak saklanır; depolama erişilemezse uygulama çalışmaya devam eder. Mat Neumorphism paneller opaktır; log/YAML/tablo yüzeyleri okunaklı tutulur.

Kanıt: [hareketli demo kaydı](docs/evidence/motion/demo-living-fleet.webm), [gerçek yanaşma döngüsü](docs/evidence/motion/live-docking-cycle.webm), [test ve ölçüm koşulları](docs/VALIDATION.md).

## Yerel çalıştırma

Node 22+ ve Go 1.25+ ile:

```sh
make build
./bin/tersane-backend
```

`http://127.0.0.1:8000` hem uygulamayı hem API/WS’yi sunar. Varsayılan bağlantı salt okunur ve loopback ile sınırlıdır. Frontend statik dosyaları binary’nin içine gömülmez; `frontend/dist` veya `STATIC_DIR` birlikte gerekir.

Geliştirme:

```sh
./start.sh
```

Vite `http://127.0.0.1:5173` üzerinde `/api` ve `/ws` isteklerini aynı origin üzerinden backend’e iletir. Backend portunu değiştirirken `PORT=8002 API_TARGET=http://127.0.0.1:8002 ./start.sh` kullanın.

Yalnız bu görev için ayrılmış test ortamında yazma erişimi:

```sh
KUBE_CONTEXT=kubeview-test WATCH_NAMESPACE=kubeview-qa READ_ONLY=false ./start.sh
```

`KUBE_CONTEXT` gerçek kubeconfig context’ini seçer; diskteki current-context’i değiştirmez. `WATCH_NAMESPACE` namespaced okuma/yazma kapsamını sınırlar. `READ_ONLY=false` yalnız backend kilidini açar; her işlem ayrıca Kubernetes RBAC denetiminden geçer. Genel cluster kapsamlı mutasyonlar namespace ile sınırlandırılmış bağlantıda kapalıdır; Node cordon/uncordon ayrı izinlerle değerlendirilir.

Bağlantı rozeti gerçek context ve namespace seçimini açar. Kubeconfig ve Kubernetes credential’ları Go tarafında kalır. Kubeconfig yokken tesisler erişilebilir kalır; örnek Node üretilmez. **Demo — örnek veri** yalnız açık seçimle açılır ve canlı mutasyonları kapatır.

## Gerçek işlemler ve sınırlar

Discovery tabanlı list/get/create/edit/delete, server dry-run, UID/resourceVersion koruması, scale, uygun restart/rollback, container request/limit, koşullu `pods/resize`, CronJob işlemleri, cordon/uncordon ve eviction tabanlı drain servisi bulunur. Log/exec/port-forward gerçek Kubernetes alt kaynaklarını kullanır. Özellik ve test kapsamı [CAPABILITIES.md](docs/CAPABILITIES.md) içinde açıkça ayrılmıştır.

metrics.k8 sn.io ölçümleri oturum belleğinde örneklenir; Prometheus gibi uzun geçmiş deposu değildir. Exec arayüzü non-TTY satır tabanlı shell’dir. HTTP port-forward önizlemesi sandbox uygular; mutlak asset yolları kullanan karmaşık uygulamalar sınırlıdır. Helm release yönetimi, bulut worker sağlama ve ölçülmüş ağ trafiği entegrasyonu yoktur.

Görsel kanıt: [önceki dashboard](docs/evidence/chromium-overview-1440.png) → [tam ekran dünya](docs/evidence/world/chromium-world-1440.png) · [gerçek yaşam döngüsü videosu](docs/evidence/world/lifecycle-live.webm). Test ortamı, ölçümler ve açık sınırlar: [VALIDATION](docs/VALIDATION.md).

## Doğrulama

```sh
make test
npm --prefix frontend run test:e2e
KUBEVIEW_TEST_CONTEXT=kubeview-test KUBEVIEW_TEST_NAMESPACE=kubeview-qa \
  npm --prefix frontend run test:e2e -- --project=chromium live.spec.js
cd backend
KUBEVIEW_TEST_CONTEXT=kubeview-test KUBEVIEW_TEST_NAMESPACE=kubeview-qa \
  go test -race ./pkg/server -run TestDedicatedCluster -v
```

Production performans altyapısı, gerçek Go informer → WebSocket → store → mevcut sahne yolunu deterministik sentetik verilerle kullanır. Gerçek kümeye kaynak uygulamaz. S/M/L profilleri, 30 sn ısınma + 60 sn ×3 tekrar, efekt/olay/etkileşim koşuları ve 20 dakikalık kaynak/log/reconnect döngüsü için [ölçüm kılavuzuna](docs/PERFORMANCE.md) bakın. Ölçülen sonuçlar ve native Safari erişim sınırı [performans raporunda](docs/PERFORMANCE_REPORT.md) ayrılır. Önceki `e2e/fleet-benchmark.mjs` geliştirme tanılaması production benchmark yerine kullanılmaz.

26–30 Ekim panel araştırması, güncel sınırlı-log sürümünü yeni baseline olarak kullanır: [panel CPU deneyi ve tekrarlama](docs/PANEL_CPU_OPTIMIZATION.md). Beş çiftte dolu-log takılması ve süreç RSS'i azaldı; net toplam CPU kazanımı kanıtlanmadı. Açık/kapalı panel farkı aynı seçili UID ile eşleşmiş bloklarda ölçülür; tarihsel sürümler arasındaki fark panel açma maliyeti sayılmaz. Son doğrulama durumu ve reddedilen kapasite adayı da raporda ayrı tutulur.

```sh
npm --prefix frontend run bench:test
npm --prefix frontend run bench:run -- --phase optimized --profiles M --scenarios living
npm --prefix frontend run bench:compare -- BEFORE_DIR AFTER_DIR OUTPUT.json
```

`--phase` dondurulan build'i, `--profiles` kaynak yükünü, `--scenarios` ölçüm akışını seçer. Var olan build tekrar kullanılacaksa `--reuse-build --reuse-binary` eklenir; tarihsel baseline güncel kodla ezilmez. Log ekranının yerel geçmişi 5000 satır / 1 MiB ve satır başına16 KiB ile sınırlıdır; kısaltma görünür biçimde bildirilir. Ham Kubernetes log verisi değiştirilmez.

Tarayıcı testleri çalışan Vite/backend bekler. `npx playwright install chromium webkit` komutu frontend dizininden gerekli motorları kurar. Canlı mutasyon testleri iki açık test bayrağı olmadan atlanır; üretim context’i otomatik seçilmez.

## Paketleme

```sh
docker build -t kubeview:local .
helm lint charts/tersane
helm template kubeview charts/tersane >/dev/null
```

Docker varsayılan olarak dış arayüze bind ettiği için `API_TOKEN` gerektirir. Helm aynı amaçla release’e ait Secret üretir veya `auth.existingSecret` kullanır. Paylaşılan erişimde aynı gateway Kubernetes kimliği kullanılır; kullanıcı bazlı impersonation uygulanmaz. Helm yazma, exec, port-forward ve Node bakımı izinleri ayrı opt-in değerlerdir. Credential içeren dosyaları depoya eklemeyin.

Mimari: [ARCHITECTURE](docs/ARCHITECTURE.md) · dünya eşleştirmeleri: [METAPHOR](METAPHOR.md) · tasarım: [UI-UX](docs/UI-UX.md) · gerçek durum: [ROADMAP](docs/ROADMAP.md).

### İsteğe bağlı gerçek worker ve trafik sağlayıcıları

Tam ekran dünyada merkez → **Sağlayıcılar / Worker ekle** yerel minikube işlem kaydını açar. Sağlayıcı kapalıysa gerekçesi görünür; taslak gemi gerçek Node sayılmaz. Aşağıdaki örnekte değerleri yalnız yönettiğiniz test profiline göre verin:

```sh
READ_ONLY=false \
KV_MINIKUBE_ENABLED=true \
KV_MINIKUBE_PROFILE=your-test-profile \
KV_MINIKUBE_CONTEXT=your-test-context \
KV_MINIKUBE_CLUSTER_UID=verified-kube-system-uid \
KV_MINIKUBE_MAX_NODES=3 \
./start.sh
```

`READ_ONLY=false` gerçek mutasyonu açar; profil/context/UID sabit allowlist'tir. İlk adaptör minikube1.38.1/docker üzerinde sınandı. `KV_MINIKUBE_HOME` profil dizinini, `KV_PROVIDER_STATE_DIR` özel kalıcı journal/lock dizinini belirler. Açık/sonucu belirsiz işlem ikinci worker'ı otomatik oluşturmaz. İptal veya timeout oluşmuş makineyi silmez; envanter uzlaştırılmadan kör retry yapılmaz. Yerel operatör erişimi ve Kubernetes `nodes create` yetkisi ayrıca denetlenir.

**Görünüm ve ayarlar → Ölçülmüş trafik — Hubble** opsiyonel gerçek flow katmanıdır. CNI/agent uygulama tarafından kurulmaz. Operatörün mevcut Hubble relay'ine backend'den TLS ile erişebilmesi ve resmi Hubble CLI1.20.2'nin kurulu olması gerekir:

```sh
KV_HUBBLE_ENABLED=true \
KV_HUBBLE_CONTEXT=your-observer-context \
KV_HUBBLE_CLUSTER_UID=verified-kube-system-uid \
KV_HUBBLE_CLUSTER_NAME=your-cilium-cluster-name \
KV_HUBBLE_SERVER=relay.example:4245 \
KV_HUBBLE_TLS_CA=/private/ca.crt \
KV_HUBBLE_TLS_CERT=/private/client.crt \
KV_HUBBLE_TLS_KEY=/private/client.key \
KV_HUBBLE_TLS_SERVER_NAME=relay.example \
./start.sh
```

`KV_HUBBLE_BINARY` varsayılan `hubble` yerine sabit bir executable yolu verebilir. Sağlayıcı kimliği context/clusterUID/API TLS binding ve gerçek Cilium cluster.name ile sınırlandırılır. Namespace yetkisi ayrıca uygulanır; relay sertifikası uygulama kullanıcısına tüm namespace yetkisi vermez. Flow olayları10sn pencerede toplanır; paket, byte veya bant genişliği değildir. L7 yalnız sağlayıcı kaydı varsa görünür; şifreli içerik çıkarılmaz. UID/kimlik belirsizliği, kapasite sınırları ve eski veri açıkça belirtilir. Selector/EndpointSlice çizgileri ayrı yapılandırma katmanıdır.

Güncel uygulama/test kapsamı ve henüz açık kabul kapıları: [v1.1 öncesi onarım kaydı](docs/PRE_V11_VISUAL_REPAIR.md). Bu çalışma sürüm numarasını veya v1.1 release durumunu değiştirmez.
