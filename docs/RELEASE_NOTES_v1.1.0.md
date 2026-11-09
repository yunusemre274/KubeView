# KubeView 1.1.0 — sürüm adayı

**Sürüm adayı; henüz yayımlanmadı.** Final kanıt/kabul incelemesi, CI ve yayımlama bekleniyor; stable tag/release ve milestone kapanışı son kapı değerlendirmesine bağlıdır.
Başlangıç paket sürümü 0.4.0 idi. Başlangıç GitHub envanterinde v1.0.0 release/tag yoktu; eski chart metni yayımlanmış sürüm olarak yorumlanmaz.

Bu aday, mevcut tam ekran limanı ve gerçek Kubernetes işlemlerini yerel operatörün kendi kümesine bağlanabileceği bir dağıtıma dönüştürür:

- Merkezden açık Connect/Demo seçimi; context/namespace ve ayrı API/keşif/yetki/metrics/Hubble tanılaması.
- Başlangıçta read-only. Sunucu `--write` ile izin verse de kullanıcı merkezden bu context/namespace için yönetimi ayrıca açar; değişen kapsam izni iptal eder.
- Geciken istekler ve metrics geçmişi bağlantı nesli/UID ile ayrılır; form çift gönderimleri ve sonucu belirsiz timeout için GET/watch incelemesi.
- Yeniden bağlantıda güncel backend yönetim izni doğrulanır. Aynı UID'deki kullanıcı taslağı gecikmiş GET ile ezilmez; değişen resourceVersion açık gözden geçirme ve yeni dry-run ister. Bul penceresinin mouse/klavye kapanışında odak tetikleyiciye döner.
- Ön yüzü gömülü aynı-origin Go ikilisi; geliştirici araçları son kullanıcının çalıştırma önkoşulu değildir.
- Normal nesne akışları: merkezden Deployment dry-run/create, workload panelinden scale/CPU-RAM/restart/delete, Pod'dan container ve gerçek loglar. D/STS/DS template hedefi backend owner UID/capability ile çözülür; standalone RS/Job/CronJob için desteklenmeyen CPU/RAM akışı gerekçesi görünür. Secret reveal/edit ayrı yetkili yoldur; maskeli placeholder gerçek değer olarak geri yazılmaz.
- Askıdaki Job artık **Askıya alındı** görünür; Complete/Failed önceliği korunur. DaemonSet eksik/eski status ile sağlıklıya varsaymaz; bilinen ready/desired sayıları ve gözlenen generation gerekir.
- Mevcut Neumorphism paneller, hareketli filo/su, Node yangın-batma/toparlanma, tek container düşüşü, minikube worker katılımı, vinç ve gerçek Hubble katmanı korunur. Caption yerleşimi iyileştirildi; safe-gap çarpışma koşulları korunur.

## Kendi kümesine bağlanma

Aday binary loopback'te ve salt okunur başlar. Standart `KUBECONFIG` dosya listesi, güvenilir varsayılan kubeconfig veya uygun ortamda in-cluster ServiceAccount kullanılır. `--kubeconfig` yükleme listesini, `--context` ilk gerçek context'i, `--namespace` sunucu kapsamını belirler; global kubeconfig/current-context dosyasına yazılmaz. Tarayıcıda merkezden context ve namespace seçilir; Namespace/Node LIST izni olmayan kullanıcı izinli namespaced kapsamını kullanabilir. Namespace seçimi RBAC yetkisi vermez.

Yönetim için sunucu `--write` ile izin vermeli ve kullanıcı bağlantı penceresinden mevcut scope için **Yönetim modunu aç** seçmelidir. Kubernetes RBAC son karardır. `--port`, `--bind`, `--api-token-file` ve güvenli uzak erişim sınırları [README](../README.md#yerel-kurulum-ve-kendi-kümene-bağlanma) içinde açıklanır. Paket adları/checksum yönergesi yayın adresi vaat etmez; yayımlanmış asset ve final checksum durumu release işlemiyle ayrıca kesinleşir.

## Doğrulanan aday kimliği ve kapsam

| Kayıt | Kimlik / durum |
| --- | --- |
| Runtime kaynak commit'i | `32a0468ad51516a1bb38aab68760e73984c45ddf` |
| Frozen frontend build | `v11-final-32a0468`; SHA256 `e61447de244192dca130675866abf81bc87daa20a7a128ee8534b5c6ae1fe164` |
| macOS ARM64 binary | SHA256 `180941247e252f34d71300967fc71ae146174a3dea3caba734d947e1da80f548` |
| Linux AMD64 binary | SHA256 `25576de72112b7ac97882fb36d839452d6c5496abaef0295072524ef31697b24` |

Freeze adı build/ölçüm kaydının kimliğidir. Buradaki SHA'lar test edilmiş aday binary'lerine aittir; final release asset envanteri ve yayımlama henüz beklenir. [Kaynak/asset eşliği](../artifacts/v1.1.0/v11-20261108/candidate-frozen-32a0468.json), [build metadata](../artifacts/v1.1.0/v11-20261108/resume-status-build.json).

macOS ARM64 temiz kurulum dizininden gömülü frontend/API/WS ve gerçek normal UI ile çalıştı; günlük kullanım için Node/Go/Vite veya `STATIC_DIR` gerekmedi. Linux AMD64 dört runtime/API smoke kontrolünü macOS ARM64 üzerinde Docker emülasyonunda geçti; üç gerçek Node'un UID'leri ve cluster UID'si kullanıldı. Native fiziksel Intel/Linux, Linux browser/performance ve native Safari performansı bu kanıtlardan çıkarılmaz. [macOS kanıtı](../artifacts/v1.1.0/v11-20261108/macos-final-proof.json), [nitelikli Linux kanıtı](../artifacts/v1.1.0/v11-20261108/platform-final/result-summary.json).

Son seri frontend unit grubu **165/165 PASS**. Son beş test gerçek `useWorldProviders` hook'unu sentetik deferred yanıtlarla A→B→A, namespace ve stream-session değişiminde sınar; eski nonempty UID/protokol verisi reddedilir, current yanıt kabul edilir, abort/pinned lease DELETE ve unmount timer/listener temizliği doğrulanır. Bu sentetik unit kanıtı gerçek Hubble E2E olarak sayılmaz. [Unit kaydı](../artifacts/v1.1.0/v11-20261108/frontend/provider-epoch-evidence.json).

Son runtime'da gerçek Job/Ready DS normal UI kabulü 2/2 geçti. Önceki `0f5a5ab` checkpoint'indeki normal workload/Secret/log ve görsel/provider alt kanıtlar [incelenmiş kaynak uygulanabilirliğiyle](../artifacts/v1.1.0/v11-20261108/source-applicability-32a0468.json) bağlanır; tüm uygulama byte-eşit veya her tarihsel provider senaryosu yeniden koşulmuş sayılmaz. Node arızası/worker/vinç çekirdeğinin tarihsel kaydı ve caption farkları [ayrı kaynak incelemesindedir](../artifacts/v1.1.0/v11-20261108/harbor-source-applicability.json). [Güncel durum UI kanıtı](../artifacts/v1.1.0/v11-20261108/frontend/status-resume/REVIEW.md).

31 AC hücresi ve ayrı dört kontrollü pil hücresi tamamlandı. AC karşılaştırması `valid=true`, `partial=false`, `reasons=[]`; güncel 20 dakikalık sentetik koşu 20 panel çevrimi ve 24/24 log kapanışı içerir. Bu production informer/WS/store/scene replay'idir; gerçek provider performansı değildir. CPU artışları özellik maliyeti olabilir; genel CPU tasarrufu, fiziksel presented FPS veya tam kontrol sunum gecikmesi iddia edilmez. Pil/AC koşulları ayrı tutulur. [Ölçüm manifesti](../artifacts/v1.1.0/v11-20261108/performance/raw-measurements-manifest.json), [AC karşılaştırması](../artifacts/v1.1.0/v11-20261108/performance/comparison-ac.json); ayrıntı [performans raporunda](PERFORMANCE_REPORT.md).

Kubernetes dışı bulut VM sağlama, tam TTY terminal, genel TCP/UDP port-forward, bütün protokollerin payload incelemesi veya çok kullanıcılı SaaS sunulmaz. Exec mevcut non-TTY satır kabuğu; port-forward sınırlı HTTP önizlemedir. Kubernetes log API'sinin atomik UID pinleme garantisi yoktur; oturum/UID doğrulama ve iptal risk azaltır, garanti oluşturmaz.

Log pause gerçek HTTP akışını kapatır; resume seçili tail'i yeniden okur, aradaki bütün satırların saklanmasını garanti etmez. Önceki UI log koşusundaki Playwright WS close-event gözlem eksikliği korunur; bağımsız kernel ölçümünde bağlı TCP endpoint sayısının sıfır olması transport cleanup kanıtıdır, Go heap/goroutine veya genel leak garantisi değildir. Önceki başarısız yardımcı koşular kayıtlardan silinmedi. [Log kanıtı ve sınırları](../artifacts/v1.1.0/v11-20261108/frontend/logs-resume/REVIEW.md).

Kurulum ve güvenlik: [README](../README.md), [SECURITY](SECURITY.md).
Platform, kaynak/build ve gerçek test durumu: [kabul raporu](V11_ACCEPTANCE_REPORT.md).
