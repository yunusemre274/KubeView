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
