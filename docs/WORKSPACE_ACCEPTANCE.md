# Çoklu liman — uygulama ve manuel kabul defteri

Bu çalışma stable yayın değildir. Kullanıcının manuel kabulü beklenir; v1.1.0 etiketi/release, stable amaçlı merge ve ana milestone kapatma bu turda yapılmaz.

Başlangıç: `0029672c7dce2c6cdf5f19c49fea956bc618c7d3`, `redesign/harbor-workbench`. Kaynak arşivi, prompt özeti ve kimlik: `artifacts/workspace/ws-20261109T115457Z/start.json`. Önceki kayıtlar korunur. V11-16 fiziksel ekran gecikmesi, V11-18 açıklanmamış L CPU farkı ve bunlara bağlı V11-19 **BLOCKED** kalır. Yeni testler bu satırların kanıtı değildir.

## Mimari ve risk sözleşmesi

| Mevcut yol | Değişiklik | Risk | Doğrulama |
| --- | --- | --- | --- |
| Güvenilir yerel kubeconfig → Go client → informer → WebSocket → canonical store | Bağlantı/kimlik nesli ve namespace/GVR temelli paylaşılan watch broker | Farklı kimliklere veri sızması, eski mesaj | Credential/scope negatif testleri; iki gerçek küme |
| Tek bağlantı/namespace seçimi | Sürümlü workspace/immutable harbor ID, atomik özel veri dizini | Bozuk config sıfırlama, migration tekrarı | Unit, sınırlı fuzz, yeniden başlatma ve bozuk dosya |
| Tek ayrıntılı dünya, bağımsız DOM paneller | Tek Canvas içinde aktif liman ve uzak liman siluetleri; liman başına görünüm | Kamera/UID/form kaybı, doğrusal render maliyeti | 50 geçiş; aynı M/L verisinde 1/5/10/20 kayıt |
| UID korumalı gerçek mutation/log/metrics | Request üzerinde workspace/harbor/tab bağlamı; kapsamı server doğrular | Yanlış kümeye işlem, grant taşınması | Eşzamanlı işlemler, typed alt kaynaklar, RBAC/scope bypass |
| Tek Node görünümü | Doğrulanmış cluster UID + Node UID ile paylaşılan altyapı bilgisi | İki kez kapasite sayma, yetkisiz isim ifşası | Aynı küme iki proje ve farklı credential; bilinmeyen kimlik |
| Topoloji ve Hubble ölçümü ayrı | İlişkiler: ortak altyapı / yapılandırılmış / ölçülmüş | Topolojinin trafik sanılması | Gerçek cross-namespace HTTP; telemetri ayrı kanıt |
| Geliştirici fixture sunucusu | Açık `--replay-profile M\|L`, embedded TEST/REPLAY fixture, zorunlu read-only | Sentetik kaynağın gerçek küme sanılması | Görünür etiket, canlı context reddi, sınırlı üretici ve cleanup |

Liman uygulama kapsamıdır; namespace veya label güvenlik sınırı yerine geçmez. Gerçek yetki Kubernetes kimliği/RBAC ile uygulanır. Node küme kapsamındadır. Birbirinden bağımsız kümeler tek scheduler havuzu değildir. [Kubernetes namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/), [multi-tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/).

## Kabul satırları

Başlangıç durumları aşağıdadır. **NOT RUN**, PASS anlamına gelmez. Unit/replay ve gerçek Kubernetes/normal UI kanıtları ayrı kaydedilir; geliştirici otomasyonu kullanıcının manuel onayı yerine geçmez.

| ID | Kabul | Kanıt / durum |
| --- | --- | --- |
| A | Boş ilk kurulum, bir defa güvenli migration, restart/güvenli görünüm kalıcılığı; grant restore edilmez | NOT RUN |
| B | Aynı küme iki namespace, ortak gerçek NodeUID, kapasite dedup | NOT RUN |
| C | Label, çok namespace ve örtüşen kapsam; owner/Service ve CRUD | NOT RUN |
| D | İki gerçek kümede aynı adlar; işlemler birbirini etkilemez | NOT RUN |
| E | Farklı credential izolasyonu; iptal/nesil değişimi ve Secret/metrics/flow sınırı | NOT RUN |
| F | ≥50 geçiş, panel/log/dirty form, geç callback, refresh ve UID replacement | NOT RUN |
| G | Eşzamanlı gerçek işlem, çift tıklama, timeout ve belirsiz sonuç uzlaştırması | NOT RUN |
| H | Rename/remove/export/import yalnız uygulama kaydını değiştirir | NOT RUN |
| I | Ortak worker stop/recovery; bağımsız küme ve kayıp Node Pod görünürlüğü | NOT RUN |
| J | Cross-namespace gerçek HTTP/TCP; varsa Hubble ölçümü ve kaybı | NOT RUN |
| K | Bağımsız kümelerde doğrulanmamış bağlantı/yanlış IP-UID eşlemesi yok | NOT RUN |
| L | Container/current/previous/pause/close log; metrics dolu/yok/403 | NOT RUN |
| M | Bozuk/gelecek config, kısmi yazma, eksik plugin/cert/timeout/restart | NOT RUN |
| N | Snapshot geçmiş efektleri oynatmaz; uyuyan liman güncel döner | NOT RUN |
| O | Temiz terminal/embedded binary; up iki kez, down/start/reset ve sahiplik | NOT RUN |
| PERF | Aynı M/L yükü, 1/5/10/20 liman; 3 eşleşmiş blok; yeni 20 dakika ve ≥20 panel/log çevrimi | NOT RUN |
| MANUAL | Kullanıcının yedi profili denemesi ve açık onayı | **PENDING — kullanıcı tarafından doldurulur** |

## Test ve kaynak bütçesi

Başlangıç iki test worker; ana yönetici dışında eşzamanlı Git/index sahibi yok. Backend ve frontend testleri ayrı yürütülür. Gerçek lab kurma ve tarayıcı testinin zamanı koordine edilir. Performans koşusunda build/unit/cluster deneyleri durur; video/profiling ana CPU ölçümüne karıştırılmaz. Aynı M20/300 ve L50/1500 fixture korunur; görünür sekiz gemi sırasıyla 120/270 Pod hedefi gerçek render envanteri ile doğrulanır. 30 saniye ısınma + 60 saniye ölçüm, üç AB/BA blok; somut belirsizlik varsa en fazla iki ek blok. Görsel kalite/DPR/FPS/kapsam/güncellik düşürülerek kazanım yazılmaz.

Destek: mevcut macOS arm64 embedded binary ve Chromium; erişilebilen Playwright WebKit işlev testi ayrı belirtilir. Native Safari/Retina ve fiziksel sunum gecikmesi ölçülmediyse N/A/BLOCKED kalır. Diğer OS cross-compile, runtime testi sayılmaz.

Manuel komutlar ve boş kullanıcı PASS/FAIL alanları: kökte `MANUAL_TEST_GUIDE.md`. Yedi profil ayrı data-dir ve port kullanır; manuel fixture/config saklanır, ağır lab'lar teslim sonunda durdurulur. Otomatik QA kaynakları sahiplik/UID doğrulamasıyla temizlenir.

## İlk uygulama checkpoint'i — henüz final kabul değil

Kaynak başlangıcı0029672 üzerindeki çalışma ağacıdır. İlk birleşik binary'ler `artifacts/workspace/ws-20261109T115457Z/vertical-0{1,2,3}-build.json` ile ayrılır. Vertical03 binarySHA `52d256b74f1d8a6714db87914ad89a45507381ec25c6bf1b70f479210095c0ef`, embedded index `ff2e598f…ed521d`; frontend kaynak seti `a8e5636b…90862`. Bunlar stable paket değildir.

- **Frontend unit:**192/192 PASS; canonical core'un context namespace ipucuyla union kapsamını daraltması önce failing gerçek-manager testiyle yeniden üretildi ve düzeltildi. Kamera yerel/global koordinatları, kesilmiş geçişin hedefi, bootstrap/cleanup, scope ve form guard'ları ayrı testlerdir.
- **Backend:** ilk geniş koşu86 top-level +41 alt vaka PASS/20 opt-in SKIP. Son membership guard için5 hedefli race PASS; cookie profili düzeltmesi için unit ve race'in her birinde23 top-level +11 alt vaka PASS. Fuzz2s/parallel1:148248 yürütme. Sonradan değişen dar yolun kanıtı önceki bütün kaynak testlerini yeniden koşulmuş saymaz; hash ve başarısız fixture düzeltmeleri backend kanıtlarında ayrı tutulur.
- **Manuel runner:**16 güvenlik unit'i; son auth koruma düzeltmesinin2 dar regresyonu ayrıca PASS. Gerçek A2 cold/updouble ve04/05/06 fixture alt senaryoları, ardından sameUID down/up ve B1 cold/updouble geçti. İlk bridge-CNI, nullIPAM, restore/alias/kubelet/private-auth denemelerinin FAIL kayıtları korunur; EOF'un son nedeni boş private user authinfo idi. Güncel restore yalnız owned kaynaklardan private CA/client identity'yi korur/yeniler; global kubeconfig değişmedi. [Runner kanıt dizini](../manual-lab/evidence/README.md).
- **Gerçek normal UI, eski vertical01:**01 boş0/0 → form/gerçek preview → server-generated connection/harbor ID →2 gerçek Node/0 Pod leaf PASS.02 aynı-cluster iki namespace arasında50 geçişte canonical2Node/1Pod ve Canvas korundu; fakat açılan karelerde yanlış eski kamera ve dark kart kontrastı **FAIL** idi. Bu ilk helperPASS görsel kabul sayılmadı; `visual-review.json` bunu açıkça kaydeder.
- **Vertical03 TEST/REPLAY M5:**50 normal DOM geçişi, son kamera durması+doğru aktif dünya pozisyonu+raycast-visible Node ve üç viewport geçti. Canonical20Node/300Pod, görünür8/120; beş liman kaynakları çoğaltmadı. Light kart kontrastı12.2785, dark12.8501 (hesaplanan opak CSS renkleri); native ekran kontrastı ölçümü değildir. Kareler gerçekten açıldı; final doğru tesis/gemiler görünür. [Sonlu UI sonucu](../artifacts/workspace/ws-vertical03-replayM5-settled-camera/result.json). Bu sentetik test gerçek Kubernetes veya Hubble E2E'si değildir.

A–O tablosunun başlangıç NOT RUN satırları final geçiş değildir. Bu ara checkpoint A/B/C/E/F/H/J/M/N/O için kısmi unit/lab/UI kanıtı sağlar; yeni kaynakta gerçek iki-küme UI/mutation, log/metrics, ortak worker arızası, Hubble, yoğun/uzun koşu ve manuel son paket kapıları henüz bütünüyle geçmedi. **PERF: yeni kabul sonucu yok. MANUAL:PENDING.**

## İkinci doğruluk checkpoint'i — vertical05

Core commit `2d63c678` doğru uzak dala pushlandı; [CI42663820290](https://github.com/yunusemre274/KubeView/actions/runs/42663820290) SUCCESS. Linux temiz paket, frontend/backend/harness testleri bu commit içindir; sonradan gelen düzeltmeler bu eski CI sonucuna dahil değildir.

Yeni frontend kaynak seti `ee974b3b…e559`, embedded index `f631b695…4585`; vertical05 binary `2ba3e80a…e080`. Beş doğruluk hatası: soğuk snapshot'ta kaydedilmiş exactUID seçiminin kaçması; 1000 kapsam-çıkışı sonrası seçili kaynağa yanlış silindi denmesi; eski panel metrik örneğinin yeni core örneğini örtmesi; hiç kaynak alınmamış boş açılışta son bilinen veri iddiası; kullanıcı sekmesinin üst seçim state'ine bildirilmemesi. İlk dört gerçek-manager/App regresyonunda4FAIL/1negatifPASS→5PASS, sekme için gerçek UI FAIL→hedefli red/green kaydedildi. Son tam seri198/198 PASS ve production build geçti. Pins yalnız seçim/form için iki UID/session ve200/core ile sınırlı; normal exit geçmişi1000. Metrik örneği mevcut cadence'de reuse edilir, yeni timer yok. Bu doğruluk düzeltmesi için CPU kazanımı iddia edilmez.

- Gerçek03 A→B→A: aynı adlı `same-pod` farklıUID'lerle açıldı; üç log opening header'ı exactUID/container/harbor doğruladı ve3/3 stream kapandı. Gerçek04 reader→admin→reader:0/2/0 yetkili Node görünümü, aynı gerçek Pod seçimi ve3/3 log cleanup. Kaynak vertical03'tür; [real03](../artifacts/workspace/ws-vertical03-real03-settled-uid-logs/result.json), [real04](../artifacts/workspace/ws-vertical03-real04-uid-logs/result.json). Kareler açılıp incelendi. Filtreli log screenshot'ı dolu log payload'ı kanıtı sayılmaz.
- Vertical05 normal UI gerçek03: Deployment same-app A1→2Ready→1; B'nin UID/replica/generation/template hash ve PodUID seti değişmedi. A grant'i B'ye taşınmadı. [Gerçek scale ve izolasyon](../artifacts/workspace/ws-vertical05-real03-scale-accepted-contract/result.json). İlk helper200 beklerken doğru202 yanıtında FAIL oldu; UID/RV cleanup ile1replica'ya dönüldü ve kayıt korundu. Accepted ile Ready ayrı denetlendi.
- Vertical05 açık TEST/REPLAY M5: normal Bul→Pod/container→Loglar→workspaceGET'te kayıt→reload→ilk güncel snapshot'ta exactUID/container/logs sekmesi4/4 PASS; textbox nativecaret kamera/target/quaternion değiştirmedi. [Soğuk açılış](../artifacts/workspace/ws-vertical05-cold-view-regression/REVIEW.md).3/3 backend log kapandı; Playwright WS close-event gözlemi1/3 kaldı, kernelTCP/Goheap cleanup sonucu üretilmedi. Sentetik fixture, gerçek Kubernetes arızası değildir.
- Gerçek02 API smoke: read-only/kapsam403, server dry-run→gerçekGET404, authoritative watch, API accepted target + gerçekUID/owner/Ready ve exactUID cleanup5 alt vaka PASS. Normal UI animasyon kanıtı değildir. Kalan selector/isolasyon/credential fazları ayrıca yürütülür.

Bu checkpoint bütün A–O satırlarını kapatmaz. Yeni ağır Hubble cold kurulumu, ortak worker arızası, sonlu yeni CPU matrisi/20dakika ve son manuel paket teslimi sürüyor. MANUAL:PENDING; eski fiziksel/CPU kapıları değişmedi.

## 10 Kasım 2026 — kapsam, arıza ve manuel profil doğrulaması

Başlangıç/push `b566a711`; CI42669736323 SUCCESS. Durdurulan üç owned Node ve uygulamalar aynı UID/özel veri dizinleriyle geri alındı. Docker kapalı önkoşul denemesi FAIL olarak korundu; Docker açıldıktan sonraki restore8.684s PASS. Global kubeconfig değiştirilmedi.

- Gerçek03 normal UI: güncel GET200 ve loading=false **sonrasında** dirty YAML byte eşitliği, UID, mod ve panel korundu; native caret/scroll kamera-target/quaternion değiştirmedi. Aynı adlı Pod A/B/A üç guarded log HTTP200/3 kapanış; K8s write0. [8 kontrol ve review](../artifacts/workspace/ws-20261110-real03-draft-after-fresh-get-caret-corrected/REVIEW.md). Önceki anlık restore ve caret-helper FAIL korunur.
- Gerçek ortak worker: API ReadyTrue→Unknown→aynıUID Ready; iki02 limanı iletişim kaybını gördü, her biri2Node/1Pod canonical kaydı tuttu. B1 Ready ve ikiPodUID değişmedi. [Dört zamanlı örnek ve açılmış kareler](../artifacts/workspace/ws-20261110-shared-worker-snapshot-guard/REVIEW.md). Bu NodeFalse/yangın/batma E2E kanıtı değildir. Recovery anındaki PodReady gecikmesi görünür. Kaynakv05; aşağıdaki liste düzeltmesi ayrıv06 kaynağıdır.
- Gerçek selector/multiNS/overlap ilk FAIL: birleşik List kind/apiVersion taşımıyordu. Boş/dolu JSON roundtrip önce red ile üretildi; minimal düzeltme upstream türünü korur, çelişkiyi reddeder; namespace RV değerlerini bir global versiyona dönüştürmez.9 hedefli unit+aynı9 race PASS. V06 binary `ce72f9dd…d9a4`; backend runtime `654c6b19…2940`, frontend/index ee974/f631 değişmedi.
- V06 gerçek7 alt vaka PASS: scope403, exact UID union, gerçek edit→metadata-only OUT_OF_SCOPE→sameUID UPDATE reentry, yeni WS generation ve UID/RV DELETE3limanda. İki actual Deployment/dependents ve üç geçici liman temizlendi; original workspace/tercihler korundu. [Sonuç](../artifacts/workspace/ws-20261109T115457Z/backend/real-api-selector/selector-v06-summary.json). İlk FAIL silinmedi. Önceki smoke5/isolation5 ayrıca korunur; API testi animasyon kanıtı değildir.
- Geniş Go:140 test/alt vaka PASS,23 opt-in SKIP; gerçek API koşuları bu SKIP sonucuna dahil değil, ayrı receiptlerde. [Ham çıktı](../artifacts/workspace/ws-20261109T115457Z/backend/final-multins/go-full.jsonl).
- Runner port kontrolü: PID/listener yokken TIME_WAIT yanlış dolu sayıldı. Controlled Darwin TCP deneyi ve real unit red→SO_REUSEADDR probe düzeltmesi→2PASS,18 runner ownership PASS. SO_REUSEPORT yok; canlı listener reddediliyor. [Kanıt](../manual-lab/evidence/port-timewait-repro-20261110.json). Salt okuma kapatma POST isteğini K8s write sayan ilk UI helper FAIL de korundu.
- Manual07:8 Chromium varyantı (M/L×1/5/10/20) ve2 WebKit senaryosu doğrulandı. Önceki9PASS/1viewport-helperFAIL kaydı korunur; yalnız eksik L20 yaprağı hedef viewport beklemesiyle ayrı6check PASS oldu. [Son review](../artifacts/workspace/ws-20261110-webkit-L20-target-viewport/REVIEW.md). Tüm sekiz app-data varyantı saklandı;07 app kapalı. Bu CPU/FPS veya native Safari kanıtı değildir;768px anomali etiket çakışması P2 olarak açıktır.

**Genişletilmiş fullTLS manual-lab E2E BLOCKED:** ilk cold362.67s CNI startup yarışında relay yanlış NodeCIDR/CEP yokluğu ile başarısız; resmi down21.64s. Dar ordering/UID guard düzeltmesi9unit PASS. İkinci ve son warm deneme6.15s içinde geçici eksik PodIP guard nedeniyle durdu; Pod DELETE yapılmadı, down21.57s. TLS extraction, provider/UI trafik ve restricted-reader aşamalarına ulaşılamadı. Üçüncü deneme yok; iki FAIL ve immutable bundlelar korundu. DefaultA/B ve yeni telemetryA2 durdu. Rehber bunu açık BLOCKED gösterir.

Yeni CPU matrisi/20dakika ve son paket henüz bitmedi. Eski V11-16/18/19 BLOCKED ve MANUAL PENDING korunur.

### Son frontend ve hazırlık — 10 Kasım

Kapalı log panelinin limana dönünce yeniden açılması actual App testinde yeniden üretildi; cached kapalı niyet seçim highlight'ından ayrıldı. Cold/explicit inspect, açık resource/facility, pending snapshot ve dirty form korunur. Tam seri202/202 PASS, build PASS. Kaynak `ff682d9b…19b9`, index `a31eb27d…b471`; v07 binary `4df0498a…94f8`, Go runtime654c6b19 değişmedi. [Normal UI3kontrol](../artifacts/workspace/ws-20261110-v07-closed-panel-ui/REVIEW.md): log1→close0→B→A panel kapalı/yeni log yok→explicit inspect1→cleanup0;3opened/3closed. CPU yüzdesi kazancı iddia edilmez.

01 manuel profilindeki yalnız Root'un oluşturduğu eski onboarding harbor/connection immutableID/ad/context/namespace eşleşmesiyle nativeAPI'den kaldırıldı;0harbor/0connection hazır, K8s mutation0, private backup/veri korundu. [Kayıt](../artifacts/workspace/ws-20261109T115457Z/manual01-restored-empty.json).

Telemetry eksik PodIP için45s bounded sameUID/owner/NodeCIDR beklemesi yalnız FS unit düzeyinde eklendi:12/12 PASS, module71fb19ae. İki gerçek FAIL'in ardından üçüncü integration koşulmadı; bu yeni kaynak henüz gerçek provider/TLS E2E doğrulaması sayılmaz.

Perf baseline frontend86dosyada başlangıç0029672 ile byteeşdeğer; eski CPU sayıları tekrar kullanılmaz. Yeni final frontend/backend benchmark ikilisi ayrı immutable tag ile hazırlanır. Önceki8s M20 başlangıç denemesi canonical20/300,görünür8/120 ve fixture integrity kontrolüdür; kabul CPU/FPS/p95 sonucu değildir.

### Donmuş son kaynak ve sonlu performans kuyruğu — 10 Kasım

Closed-panel niyeti düzeltmesinin202 frontend testi/build ve v07 normal UI3 kontrolü geçti. `workspace-final-20261110` ölçüm adayı frontend kaynak SHA `ff682d9b633c86062fa3e1379aef7c92747f2bee0b31a9cbaec0995cda9219b9`, embedded index `a31eb27ddbaa942db8420bc6d6509abe14449ce7ea1cc17826989eda9ff2b471` içerir. Yeni kaynakla eski tek-liman kontrolünün kısa kamera/çizim kontrolünde aktif kamera ve başlangıç438 draw-call/62220 üçgen eşitti. Bu6 saniyelik kontrol CPU kabulü değildir.

Mevcut harness'e workspace ailesi eklendi:35 seri iş/46 hücre;3 dengeli blok,30 saniye ısınma/60 saniye ölçüm ve yalnız1 adet1200 saniyelik karma koşu. `workspace-cycle` tanılama koşusu20 normal UI liman/panel ve4 kapsam düzenleme çevrimini,22/22 kapanan logu ve tam canonical içerik eşitliğini doğruladı;30 saniyelik bu koşu uzun test veya CPU kabulü sayılmaz. İki kontrolün Playwright actionability kontrolü fiziksel geri bildirim veya bütün panel kullanılabilirliği yerine geçmez. Tarihsel V11-16/18/19 kapıları açık kalır.

Telemetri lab'ında iki runtime FAIL korunur. Son kaynak aynı owned PodUID'nin başlangıç IP'sini45 saniye bounded bekler;12 unit geçti, üçüncü gerçek lab denemesi yapılmadı. Tüm owned ağır lab'lar ve uygulama süreçleri ölçüm öncesi durduruldu.

### API kanıtının dar sınırı

Son read-only backend incelemesinde runtime doğruluk blokeri saptanmadı. Gerçek selector7 alt vaka testi UPDATE'i UID/action ile eşler; overlap kuyruğundaki eski UPDATE'i her durumda yeni RV/label ile ayırdığını iddia etmez. Reconnect snapshot kontrolü kapsam ve generation bağını sınar, o snapshot'ın Resources UID envanterini bütünüyle karşılaştırmaz. Exact union ve DELETE'nin diğer kontrolleri bu iki eksik assertion'ı tamamlamış sayılmaz. Gelecek dar test genişletmesinde beklenen opaque RV/selector ve snapshot UID seti ayrıca doğrulanmalıdır; mevcut kanıt eksiksiz reconnect-restorasyon E2E'si diye genişletilmez.
