# Yayın adayı güvenlik bulguları — 11 Kasım 2026

Bu kayıt `36d5b8f90c8afdec437bdb6e5516541b5bb859bd` başlangıcından yürütülen
[canlı kabul defterine](../ROADMAP_FOR_TESTS.md) bağlıdır. Test/araç sonucu,
profesyonel bağımsız penetrasyon testi veya bilinmeyen açıkların bulunmadığı
garantisi değildir. Gerçek kullanıcı credential veya Secret içeriği kaydedilmedi.

| Kimlik | Önem / önkoşul | İlk sonuç | Düzeltme / tekrar test | Kalan sınır |
|---|---|---|---|---|
| SEC-001 | HIGH: backend kimliği hedef Secret'ı okuyabiliyor; API Discovery hedef GVR'yi eksik döndürüyor | Liman selector'ı dışındaki sentetik Secret normalde403, eksik keşifte200 | `authorizeWorkspace` çözümlenemeyen named GVR'de reddeder. Secret/log/exec/forward için80 sentetik istek;34 top-level PASS/3 gerçek-lab SKIP. Root kod incelemesi yapıldı. | Bu, Kubernetes RBAC bypass veya anonim internet saldırısı değildir. Gerçek kısıtlı kimlik/final paket kapıları ayrıca açık. |
| SEC-002 | MEDIUM: önceden yetkilendirilmiş uzun akış sekiz saatlik operatör ömrünü aşabiliyor | Başka HTTP isteği gelmezse süresi dolan session context'i canlı kaldı; kısa deadline regresyonu FAIL | Session oluşturma ve scope reset context'i özgün mutlak expiry'ye bağlandı. Yeni session deadline ve reset/iptal kontrolleri PASS; scope/grant komşu testleri ve odaklı race PASS. | Kısa süreli sentetik test; sekiz saat gerçek kullanıcı oturumu çalıştırılmış sayılmaz. |
| DEP-001 | Sürüme/kod yoluna bağlı Go advisory eşleşmeleri; hepsi doğrulanmış exploit değildir |42 advisory:21symbol/15package/6module. `http.FileServer` Range yolu doğrudan runtime adayı; diğerlerinin önkoşulları ayrı incelendi. | Go1.26.11 ve minimal uyumlu modül tabanı; Kubernetes0.30.0 korunur. Main source govulncheck1.9.0:0finding.94 top-level unit PASS/25 opt-in SKIP; vet PASS. Docker/CI toolchain aynı patch'e taşındı. | Darwin/arm64 main source taraması. Final binary, container/OS ve gerçek SPDY/exec kabulü ayrı. |
| WS-002 | P1 doğruluk: liman geçişinin ara renderı eski Pod’u yeni API’ye veriyor | Gerçek UI1cycle iki log isteğinde eskiUID/namespace + yeniHarborID; scope guard ayrı testte reddediyor; bu UI capture HTTPstatus saklamadı, abort olabilir; doğrulanmış sızıntı yok | App resource/facility paneli captured source eşleşmeden mount etmez; ara-render unit red→green | Gerçek1cycle ve50A→B→A PASS;299/299requestkapalı,0yanlış UID/namespace/harbor.100HTTP200,199responseöncesiabort. İlkFAIL ui03-cycles-preflight-capture, retest ui04-cycles50/result.json. |

## 11 Kasım — ek sağlayıcı taraması ve dar araç yaması

| Kimlik | Önem / kanıt | Düzeltme / tekrar | Açık sınır |
|---|---|---|---|
| DEP-002 | Collector1.20.2 dört ARM64 imajında20HighID/131bileşen satırı,0Critical; her eşleşme exploit değildir | Resmi1.20.4 adayında aynıDB/platform3HighID/15satır. Yalnız tarandı, kurulmadı. | x/net HTML parser, apt/libapt ve operator go-jose kalıntıları açık; exactbinary/source incelemesi sürüyor. Risk kabulü verilmedi. App container/final paket taraması ayrı. |
| DEP-003 | HIGH CVE-2026-116587: özel minikube.3 SBOM'unda go-jose4.1.4; önceki GoDB bu ID'yi göstermedi | Dar patched.4 yalnız4.1.4→4.1.6; build/version/help PASS. AynıDB'de go-jose High ve ikiMedium eşleşmesi kalktı; binary98e42baf… | Gerçek worker sağlama/final araç teslimi test edilmedi. Kalan Docker daemon/distribution ile main/devel/native kapsam boşlukları korunur. |

[İmaj karşılaştırması](../artifacts/release-audit/ra-20261111/provider-patch-candidate-worker/REPORT.md),
[patched.4 kaynak/build tarifi](../artifacts/release-audit/ra-20261111/minikube-jose-patch4-worker/RECIPE.md)
ve [tekrar tarama](../artifacts/release-audit/ra-20261111/minikube-jose-patch4-worker/REPORT.md)
ayrı kaynak kimlikleriyle saklanır. Hiçbir özel CLI resmi upstream binary olarak sunulmaz.

SEC-001'in ilk başarısız testi
[`regression-secret-discovery.log`](../artifacts/release-audit/ra-20261111/security-worker/regression-secret-discovery.log),
ayrı başarılı tekrarı
[`retest-sec001.log`](../artifacts/release-audit/ra-20261111/security-worker/retest-sec001.log)
ile korunur. SEC-002'nin
[ilk FAIL](../artifacts/release-audit/ra-20261111/session-expiry-red.log),
[retest](../artifacts/release-audit/ra-20261111/session-scope-retest.log) ve
[race kaydı](../artifacts/release-audit/ra-20261111/security-race.jsonl) ayrıdır.

Bağımlılık değerlendirmesi, advisory aralıkları, exact source uyuşmazlığı bulunan
Gorilla uyarısı ve transitive sürüm maliyeti
[worker raporunda](../artifacts/release-audit/ra-20261111/dependency-worker/REPORT.md)
saklanır. npm lock/dev/runtime taraması0advisory; izole zafiyetli lock pozitif
kontrolü scanner'ın tespit yapabildiğini doğruladı.

Tarihsel84commit sır taramasındaki386 ve çalışma ağacındaki1451aday sınıflandırıldı;
bu kapsamda çözülmemiş gerçek credential bulunmadı.13büyük plaintext dosya da
ayrı tarandı; sentetik pozitifle araç doğrulandı. Final arşiv taraması ve kalan
tehdit zincirleri tamamlanmadan yayın güvenliği kabulü verilmez. Ayrıntı:
[history](../artifacts/release-audit/ra-20261111/secret-review/REPORT.md),
[worktree](../artifacts/release-audit/ra-20261111/secret-review/worktree/REPORT.md).

## Tekrar üretme

```sh
cd backend
GOTOOLCHAIN=go1.26.11 GOMAXPROCS=2 go test -p 1 -parallel 2 -timeout 90s ./pkg/server -run 'Test(Release|Management|ScopeSwitch|Workspace.*(Grant|Cookie)|DelayedManagement)' -count=1
GOTOOLCHAIN=go1.26.11 GOMAXPROCS=2 go test -race -p 1 -parallel 2 -timeout 120s ./pkg/server -run 'Test(Release|Workspace.*(Grant|Cookie|Offline|Credential|HTTP|MultiNamespace)|PortForwardSandbox|ScopeSwitch)' -count=1
```

Bu komutlar sentetik istemci kullanır; gerçek küme testi için açık opt-in ve
owned cluster/namespace kimlikleri gerekir. `-p1/-parallel2` kaynak bütçesidir;
`-race` ağır tanılamadır, production CPU karşılaştırmasına karıştırılmaz.
