# Yayın hazırlığı — 14 Kasım 2026 kontrol noktası

**NOT_RELEASE_READY**

Bu belge devam eden denetimin özetidir; final paket veya manuel kabul kararı değildir. Ayrıntılı ve canlı faz kaydı [ROADMAP_FOR_TESTS.md](../ROADMAP_FOR_TESTS.md) içindedir. Eski başarısızlıklar ve önceki kaynak kimlikleri korunur.

## Kaynak ve dağıtım sınırı

- Ürün runtime kontrol noktası: `15770296056ca2629601dba540c04741e1822e0d`.
- Bu bölümün temel aldığı pushlanmış denetim kontrol noktası: `ae7aebc51984a144f10b4780989a6d1a8f19197e`; [CI117](https://github.com/yunusemre274/KubeView/actions/runs/43598505445) başarılı. Yeni açık fazların sonucu bu eski commit'e yazılmaz.
- Test edilen native aday: CI114 build `71b4098314c71d7c9473d88356edf7200fe62f1f`; binary SHA256 `24ef0ce34d3381644fc14dc16a768bbeb7b8c580d19813ff580780e536378e68`. PR kaynak ağacı, 22 paket girdisi ve 118 runtime dosyası eşleşmesi ayrı incelendi. Yeni test/belge commit'i eski binary'nin build kimliği değildir.
- Ürün local-first, tek yerel operatör modelindedir. İnternete açık çok kullanıcılı SaaS'a dönüştürülmedi. Tam ekran dünya ve nesnelere bağlı Soft UI panelleri korunuyor.

## Bu kontrol noktasında eklenen kanıtlar

| Faz | Sonuç | Sınır ve kanıt |
|---|---|---|
| TEST13.01 | VERIFIED_DONE | Sınırlı workspace/import fuzz ve JSON guard'ları; [rapor](../artifacts/release-audit/ra-20261112/workspace-import-parser-closure-root/REPORT.md). Gerçek Kubernetes veya tüm parser güvenliği değildir. |
| TEST20.01 | VERIFIED_DONE | Native Mac'te repo dışında, boş uygulama PATH'i ile standalone başlangıç; embedded UI, normal form/kaydırma, aynı Canvas ve cleanup. [Rapor](../artifacts/release-audit/ra-20261114/native-ci114-startup-root/REPORT.md). Gerçek ilk cluster bağlantısı veya bütün manuel profiller değildir. |
| TEST12.10 | VERIFIED_DONE | Native binary'nin varsayılan/test-fixture ortamında test/debug HTTP yüzeyi; [rapor](../artifacts/release-audit/ra-20261114/native-debug-surface-root/REPORT.md). Intentional TEST/REPLAY özelliği korunur; tüm arşiv/sır taraması değildir. |
| TEST12.06 | VERIFIED_DONE | Gerçek yerel HTTP oturum/export→import ve fake Kubernetes ile credential/grant izolasyonu; [rapor](../artifacts/release-audit/ra-20261114/workspace-export-guards-worker/REPORT.md). Paket veya gerçek küme kabulü değildir. |
| TEST12.03 | IN_PROGRESS | Aktif YAML formu 1+11 ve generic resource JSON 1+12 kontrolü geçti; [kök inceleme](../artifacts/release-audit/ra-20261114/parser-boundary-root-review/REPORT.md). Büyük paste'in browser maliyeti ve diğer parser yolları açıktır. |

Normal CI başarısı opt-in gerçek Kubernetes testlerinin, fiziksel ekran gecikmesinin, native Safari'nin veya uzun kararlılık koşusunun geçtiği anlamına gelmez. Yeni kayıtlarda ürün kaynak kodu değişmedi; doğrulanmış olmayan bir risk “düzeltildi” diye kapatılmadı.

## Yayını engelleyen kapılar

| Kapı | Güncel karar |
|---|---|
| Sağlayıcı/bağımlılık | Yerel imaj yama ve erişilebilirlik incelemeleri vardır. Yeni adayların gerçek kurulumu, tam TLS, lisans/SBOM ve final paket zinciri tamamlanmadı. Ham scanner eşleşmeleri ile exact-binary NOT_AFFECTED kararları ayrı tutulur; [bulgu defteri](RELEASE_SECURITY_FINDINGS.md). |
| Aynı iş yükünde CPU | Önceki dengeli ölçümde açıklanmamış ek çizim bulundu; render guard artık bunu kabulü durduran veri olarak işaretliyor. Geçerli nihai A/B kabulü yok; CPU kazancı iddiası yok. |
| Uzun kararlılık | Kesintisiz 60 dakikalık final karma koşu tamamlanmadı. Kesilmiş eski koşular başarı sayılmıyor. Düşük pilde yeni uzun koşu başlatılmıyor. |
| V11-16 | Fiziksel ekran sunumu kanıtı yok. DOM/rAF/PNG proxy sonuçları bunun yerine yazılmadı. Kabul ölçütü kullanıcı kararı olmadan değiştirilmedi. |
| V11-18 | Nihai, karşılaştırılabilir CPU matrisi ve ilgili açıklanamayan render/RSS farkı açık. |
| V11-19 / manuel onay | Önkoşullar ve kullanıcı kabulü açık. Stable tag/release, stable merge veya milestone kapanışı yapılmadı. |
| Final paket | Yeni temel startup retesti, SBOM/imza/provenance, temiz yedi profil ve tüm platform kabulünün yerine geçmez. |

## `main` kararı

Kullanıcının 14 Kasım koşullu merge isteği incelendi. İnceleme anında `origin/main` `bed7ad9b…`, çalışma dalı `57ad606e…`, Git farkı 0 geride / 133 ileride ve CI116 başarılıydı. Git çakışması olmaması, yukarıdaki açık doğruluk/kaynak kapılarının kapandığını göstermez. “Yapıyı bozmayacaksa; engelse girişme” koşulu nedeniyle `main` veya uzak `main` değiştirilmedi. Doğrulanan kontrol noktaları `redesign/harbor-workbench` dalına pushlanıyor; yeni feature dalları açılmadı.

## Ortam ve güvenli devam

Native prober yalnız `127.0.0.1:19849` üzerindeki sahip olunan örneklere bağlandı. SIGTERM/kimlik/port temizliği kayıtlarda; dış bundle ve özel veri dizinleri korundu. Docker daemon son salt okunur kontrolde erişilemiyordu; önceki owned lab'ın STOPPED kaydı canlı yeniden doğrulama sayılmadı. Kullanıcıya ait başka süreç veya konteynır kapatılmadı.

Native başlangıcın gerçekten çalıştırılan argv ve çalışma dizini [result.json](../artifacts/release-audit/ra-20261114/native-ci114-startup-root/result.json) içindedir: `--kubeconfig` yalnız yeni, olmayan test dosyasını; `--data-dir` repo dışı özel test verisini; `--bind 127.0.0.1` loopback'i; `--port 19849` sahip olunan test portunu seçer. `--write` verilmedi. Bu boş başlangıç testidir, kullanıcının gerçek bağlantı ve manuel profil kabulü değildir.

Yeni testlerin komutları kendi raporlarında bulunur. One-shot kanıt yardımcıları eski çıktı/dizini ezmeyi reddeder; tekrar gerektiğinde yeni run-ID kullanılmalıdır. [Manuel rehber](../MANUAL_TEST_GUIDE.md) ve profil dosyaları korunmuştur; kullanıcı PASS/FAIL alanları bu otomatik sonuçlarla doldurulmaz.
