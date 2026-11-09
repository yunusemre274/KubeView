# Runner kanıt dizini

Bu kayıtlar manuel kullanıcı PASS alanlarını doldurmaz. Gerçek Kubernetes API,
runner, unit ve normal UI ayrı kanıt türleridir. Hiçbir credential, token, kubeconfig
içeriği, browser cookie/nonce veya gerçek Secret bu dizine yazılmaz.

| Kanıt | Gerçek kapsam / sınır |
|---|---|
| `cold-a-01.json` | FAIL: bridge CNI ile worker ağ yapılandırılmadı; owned lab durdurulup korundu. |
| `cold-a-02.json`, `cold-a-03.json` | FAIL: ilk container oluşmadan Docker metadata/container-vs-network helper kusurları; özgün çıktılar korundu. |
| `cold-a-04.json` | PASS: ayrı normal kullanıcı state'inde fresh owned A2/kindnet başlangıcı84.920s; eski QA state'ine bağımlılık yok. |
| `a-double-up-01.json` | Strict FAIL: UID/counts aynı kaldı, gereksiz minikube start PodReady'yi geçici etkiledi. |
| `a-double-up-02.json` | PASS: healthy up1.573s, bütün namespace/D/Pod/NodeUID'ler ve Ready korundu; iki proje Pod'u aynı gerçek worker'da. |
| `a-fixtures-lifecycle-01.json` | Koşu FAIL; ilk7 API altkontrolü PASS:04 okuyucu gerçek403,05 exit42/sameUID recovery/image/unsched/reset,06 DNS+HTTP1→3→0/reset. Sonraki down/reup başarısızlığı ayrıca açık. |
| `a-fixtures-lifecycle-01-abort.json` | Yalnız bu testin minikube child grubuna gönderilen bounded abort ve nedeni; cluster'ı değiştirmez. |
| `a-lifecycle-recovery-02.json` | FAIL: Docker start tek başına minikube worker alias'ını onarmadı. |
| `a-lifecycle-recovery-03.json` | Koşu FAIL: ilk adres toparlanması ve gerçek down geçti, sonraki minikube kendi healthwait'i başarısız. Full start tekrarları bırakıldı. |
| `a-owned-worker-host-repair-01-helper-failure.json` | İlk dar onarım sonrası status helper'in gerçek boş Pod koleksiyonunda hata vermesi; PASS'e çevrilmedi. |
| `a-owned-worker-host-repair-02.json` | PASS: doğru owned CP IP→worker alias onarımı ardından actual A2Ready; aynı cluster/NodeUID;5 fixturePod/6Readycontainer; producer0. Tam down/reup kabulü yerine geçmez. |
| `a-status-01.json`, `a-doctor-01.json` | Erken02 envanteri/readonly doctor checkpoint'i; sonraki fixture veya app kapsamını iddia etmez. |
| `runner-unit-01.json/.txt` | Önceki8 güvenlik unit'i; kendi kaynak SHA kapsamı. |
| `runner-unit-02.json/.txt` | Önceki kaynak checkpoint'inde16/16 unit; ownership, UID/RV DELETE body, empty/offline ayrımı, seed spacing, token gerçekexpiry, child/port/Ctrl+C, vanilla→telemetry reddi. Gerçek extension kurulumu değildir. |
| `doctor-02.json` | Current readonly doctor; lab.json/global kubeconfig byte eşit. Helm4.2.3 flags doğrulandı, normal PATH Hubble yok; eski reader expiry metadata'sı unknown diye gösterildi. |
| `ab-restore-restricted-cold-01-preflight-failure.json` | Orkestrasyon parse FAIL; hiçbir child veya runtime işlemi başlamadı. |
| `ab-restore-restricted-cold-02.json`, `ab-restore-restricted-cold-02-diagnosis.json` | Gerçek down PASS; restore FAIL. CP kubelet inactive/disabled ve eksik alias gözlendi; kaynak/kimlik tanısı korundu. |
| `ab-restore-kubelet-fix-03.json` | FAIL: servis/alias onarıldı, private admin CA/auth boş olduğu için kubectl Username/EOF verdi. Public200 auth kanıtı sayılmadı. |
| `ab-restore-auth-fix-04.json` | PASS: owned private profilden atomic0600 CA/clientcert/key onarımı, ardından gerçek authenticated UID/marker/allReady ve tam A2 down→up. Global kubeconfig aynı; fullstart/update-context/enable/CNI değişikliği yok. |
| `ab-restricted-b-cold-05.json` | PASS: gerçek server expirationTimestamp=JWT-exp; reader Pod okuma ve Node/Namespace/Secret403; B1cold; same-name/farklı cluster+namespace+workload+PodUID; ikinci03up UID/Ready/CA/auth/reader byte korunumu; yanlışLABID destroy reddi. Son A2+B1Ready/apps0/producer0;9 fixturePod/10Readycontainer. |
| `runner-auth-regression-03.json/.txt` | Güncel kaynakta yalnız yeni2 auth regresyonu PASS: boş auth/CA API child başlamadan reddedilir; A auth onarımı B/reader contextlerini korur. Eski16 test yeniden çalıştırılmış sayılmaz. |

Aktüel app/normal UI,07 delivered-binary replay ve gerçek telemetry provider
kanıtları root yöneticinin ayrı koşularından eklenecek.03 ve restore burada API/runner
kapsamıdır; normal UI kabulüne otomatik dönüştürülmez.
Bu dizindeki tarihsel başarısızlıklar silinmez; yeni düzeltme yeni attempt alır.
Manual workspace/manifests/private config normal kullanıcı state'inde korunur;
release arşivine bu private dizin taşınmaz.
