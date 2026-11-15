## 13 Kasım +03 — SEC-WATCH-REVOKE-001 gerçek küme retesti

**Dar watch/cache yetki iptali düzeltmesi gerçek Kubernetes ile doğrulandı.**
Product source15770296 ve yeni opt-in testin exactSHA'sı ile, iki gerçek
TokenRequest/ServiceAccount kimliği normal HTTPsession/workspace/connection/harbor
ve loopback WebSocket yolundan bağlandı. A'nın owned RoleBinding'i UID/RV ile
silindiğinde aynıclientID altında SSARAllowedfalse, gerçekAPI/gateway403;
forbidden non-authoritative STATUS ve gerçek WS kapanışı görüldü. B200 ve exact
UPDATE almaya devam etti. Bilinen failure sonrası canary A'da görünmedi.

[Gerçektest ve ilkönkoşulFAIL](../artifacts/release-audit/ra-20261112/active-watch-real-e2e-attempt02-root/REPORT.md),
[ikinci inceleme](../artifacts/release-audit/ra-20261112/active-watch-real-evidence-review-worker/REPORT.md)
ve [kök kapanış](../artifacts/release-audit/ra-20261112/active-watch-real-e2e-attempt02-root/ROOT_CLOSURE.json)
ayrıdır.1testPASS/0SKIP;6fixtureGET404, broker/listener/süreçtemizliği doğrulandı.
Labın iki containerı tekrar durdu; manuelveri/profiller korundu.

Periyodikyenileme anlık/atomikiptal değildir; hesaplanan büyük-kapsam
planlama penceresi ve gerçekAPI/CPU maliyeti açıkça sınırlıdır. Upstreamwatch
ömürü ayrıca instrument edilmedi: heartbeat-only nedensellik, browser/finalbinary
veya tümstreamtürleri için kabul verilmedi. Öncekibölümlerin NOT_RUN ifadeleri
o andaki tarihsel durumu gösterir; ilkbaşarısızlıklar silinmez.

## 13 Kasım +03 — SEC-WATCH-REVOKE-001: dar ürün düzeltmesi ve retest

**Düzeltme uygulandı, sentetik API/watch retesti geçti; gerçek RoleBinding E2E ve final yayın kabulü açık.**

Mevcut heartbeat artık kesin kabul edilmiş kapsamların list/watch yetkisini,
tüketici başına tek asenkron SSAR grubu ile yeniler. Bilinen ret veya kontrol
hatası yeni yayınları durdurur; doğrudan non-authoritative STATUS ve kapanış
gönderilir. Canonical DELETE, sahte Node arızası veya ortak credential cache'i
eklenmedi. Sağlıklı bekleyen veri ve izinli komşu tüketici korunur.

[Strict RED → ilk GREEN → dar race → son kaynak GREEN](../artifacts/release-audit/ra-20261112/active-watch-authz-fix-worker/REPORT.md)
ve [kök inceleme](../artifacts/release-audit/ra-20261112/active-watch-authz-fix-worker/ROOT_REVIEW.json)
ayrıdır. Final8ana/13alt test, auth23ana/31alt ve snapshot/watch6ana test geçti;
0SKIP. Race9ana/9alt, sonradan eklenen saf Reachable sınıflaması öncesindeki
aynı concurrency/bütçe yolundadır; son kaynak sınıflaması non-race test edildi.

Sabit5sn aday bütçesi, desteklenen64 namespace ve30QPS altında geçerli kullanıcıyı
timeout'a sokacağı için düzeltilmiştir. Yeni bütçe5sn+2N/30sn; gerçek client-go
rate-limiter testinde129scope/258bekleme8,600sn içinde tamamlandı. Bu gerçek HTTP
SSAR yük ölçümü değildir. Büyük kapsamda periyodik iptal gecikmesi vardır; anlık
iptal veya CPU kazancı iddia edilmiyor. Ayrıntılı sınır [güvenlik sözleşmesinde](SECURITY.md).
Worker900sn hedefi rapor finalizasyonunda56,7sn aşıldı; test süreleri ve bu
süreç kusuru ayrı saklandı. Gerçek kubernetes E2E henüz NOT_RUN.

## 12 Kasım — aktif watch düzeltmesinin frontend kontrol noktası

Backend düzeltmesinden bağımsız olarak, `reduceMessage` STATUS mesajındaki
`forbidden` / `unavailable` kapsamlarını işlemiyordu. Sentetik protokol testi
beklenen `forbidden` yerine `live` gördü. Minimal düzeltme, yalnız bildirilen
başarısız kapsamı non-authoritative yapar; canonical UID ve diğer namespace
kapsamları korunur. Healthy heartbeat yetkiyi geri vermez; başarılı snapshot gerekir.

Yeni üç test ve mevcut store/workspace komşularında **46 PASS, 0 SKIP**;
[RED, retest ve kök inceleme](../artifacts/release-audit/ra-20261112/active-watch-frontend-root/REPORT.md)
ile [ikinci kaynak incelemesi](../artifacts/release-audit/ra-20261112/active-watch-frontend-review-worker/REPORT.md)
ayrıdır. Bu saf reducer kanıtıdır; gerçek UI veya RoleBinding E2E değildir.
SEC-WATCH-REVOKE-001 backend düzeltmesi ve gerçek küme kabulü halen açıktır.

## 12 Kasım 2026 — SEC-WATCH-REVOKE-001: aktif watch yetkisinin yenilenmemesi

**MEDIUM, AÇIK; kontrollü sentetikAPI/watch E2E ile doğrulandı.** Yereltekoperatör
modelinde öncedenyetkilendirilmiş birreader ve açık upstreamwatch gerekir.
Aynıcredential/contextaltında Podget/list/watch SSARdenyolduktan sonra yeniHTTP
list/get403alırken eskiWS,15sheartbeatsonrası aynıPodUID/yeniopaqueRV ve harmless
annotationcanary UPDATE'ini yayımladı. BaşarılıilkUPDATEveexplicit403pozitif/negatif
kontrolleri vardı; testexactiçerikassertionıFAILoldu. Anonimadminbypass/hostRCE,
Secretdeğeri veya başkaNamespace sızıntısı gösterilmedi.

[İlkRED ve cleanupkanıtı](../artifacts/release-audit/ra-20261112/active-watch-authz-repro-worker/REPORT.md).
Bu, gerçekKubernetesRoleBindingiptali veya apiserver davranışı için E2Ekanıtıdeğil.
Kaynakriskitekbaşınaruntimebugsayılmadı; gerçekproductionRegister/workspace/WS/
informer/broker yolu fakeK8sAPIile denendi. Runtimef32değişmedi; düzeltme/retest
bekleniyor. Failingtest henüzCIyastageedilmedi; immutabletestsourcekanıtta korunur.
Readtimeout'u closuregibikabul eden testdalı buREDsonucuna etki etmedi fakat GREEN
öncesi sıkılaştırılacak. GerçekRoleBindingE2E, ilgiliyeniperformancevefinalpaket açık.

[Kaynakmitigasyonincelemesi](../artifacts/release-audit/ra-20261112/active-watch-authz-design-worker/REPORT.md)
yalnızöneridir; uygulanmışkontrol veya riskkabulü değildir. [KubernetesSSARaçıklaması](https://kubernetes.io/docs/reference/access-authn-authz/authorization/#checking-api-access)
ve [hedef1.35.1authorizefilterkaynağı](https://github.com/kubernetes/apiserver/blob/v0.35.1/pkg/endpoints/filters/authorization.go)
teknikreferanstır; bu uygulama veya gerçektest başarısını kanıtlamaz.

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

### PROV-CACHE-001 — cached worker sonucunun eski küme UID'sine bağlanması

MEDIUM kapsam bütünlüğü/P1 doğruluk: geçerli yerel yönetim oturumu ve aynı
idempotency key, context adı aynı kalıp canlı kube-system UID değiştiğinde eski
terminal işlemi202 ile döndürdü. Yeni CLI/worker çalışmadı; Secret sızıntısı veya
uzak kod yürütme gösterilmedi. Public handler UNIT testi, doğru scope ve yanlış
context kontrolleriyle birlikte sorunu yeniden üretti.

POST, cached `Manager.Begin` dalından önce güncel UID'yi kontrol etmiyor;
GET yolunda bu kontrol zaten var. İlk
[RED kanıtı](../artifacts/release-audit/ra-20261111/provider-cache-scope-worker/REPORT.md)
korunur. Düzeltmede actual kube-system UID kontrolü GET/POST ayrımının önüne taşındı.
Orijinal PoC üç durumda geçti; geçerli cached sonuç korunurken yanlış UID409 oldu.
Namespace403/503/404, birleşik12test/33alt durum ve dar race geçti.
[Retest](../artifacts/release-audit/ra-20261111/provider-cache-scope-retest-worker/REPORT.md)
UNIT/fake kapsamındadır; gerçek worker-count ve final yeni binary kabulü açıktır.
Kontrol atomik bir UID garantisi değildir; önemli risk kabulü yapılmadı.

| Kimlik | Önem / kanıt | Düzeltme / tekrar | Açık sınır |
|---|---|---|---|
| DEP-002 | Collector1.20.2 dört ARM64 imajında20HighID/131bileşen satırı,0Critical; her eşleşme exploit değildir | Resmi1.20.4 adayında aynıDB/platform3HighID/15satır. Yalnız tarandı, kurulmadı. | x/net HTML parser, apt/libapt ve operator go-jose kalıntıları açık; exactbinary/source incelemesi sürüyor. Risk kabulü verilmedi. App container/final paket taraması ayrı. |
| DEP-003 | HIGH CVE-2026-116587: özel minikube.3 SBOM'unda go-jose4.1.4; önceki GoDB bu ID'yi göstermedi | Dar patched.4 yalnız4.1.4→4.1.6; build/version/help PASS. AynıDB'de go-jose High ve ikiMedium eşleşmesi kalktı; binary98e42baf… | Gerçek worker sağlama/final araç teslimi test edilmedi. Kalan Docker daemon/distribution ile main/devel/native kapsam boşlukları korunur. |

[İmaj karşılaştırması](../artifacts/release-audit/ra-20261111/provider-patch-candidate-worker/REPORT.md),
[patched.4 kaynak/build tarifi](../artifacts/release-audit/ra-20261111/minikube-jose-patch4-worker/RECIPE.md)
ve [tekrar tarama](../artifacts/release-audit/ra-20261111/minikube-jose-patch4-worker/REPORT.md)
ayrı kaynak kimlikleriyle saklanır. Hiçbir özel CLI resmi upstream binary olarak sunulmaz.

### DEP-002 — exact aday binary erişilebilirlik incelemesi

[Statik inceleme](../artifacts/release-audit/ra-20261111/provider-reachability-worker/REPORT.md)
yalnız dört aday digest'ten çıkarılan on Go ELF dosyasını kapsar; image kodu
çalıştırılmadı. Tam function-name tablolarında x/net HTML parser adı bulunmadı;
üç ana binary raw-byte kontrolü de bunu destekledi. Stripped ELF için GoDB'nin
advisory fonksiyonlarını konservatif ekleyebilmesi, doğrudan gözlenen sembol
olarak yorumlanmadı. Bu sonuç bütün x/net veya native/dynamic kod için genel
istisna değildir; önceki eksik filtre ve erken açıklama superseded olarak korunur.

Operator RSA private JWK parser'ı gerçekten linklidir; saldırgan girdisinin
bu yola ulaşması gösterilemedi. APT chart/default startup yolunda görülmedi,
ancak etkilenmiş paket hâlâ yüklüdür ve runtime bakım yolu incelenmedi.
Her iki açık sınır korunur; risk kabulü veya provider pin güncellemesi yapılmadı.
Mevcut lab1.20.2'dir; aday1.20.4 çalıştırılmış sayılmaz. Final image/paket ve
gerçek yeni provider kurulum kabulü açık kalır.

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

### PROV-LOCK-002 — farklı journal dizinleri ortak profili kilitlemiyor

MEDIUM/P1 yerel concurrency doğruluğu. İki güvenilir yerel provider örneği aynı minikubeHome/Profile için farklıStateDir kullandığında ikiManagerNew da kilit alabiliyor. AynıStateDir negatif kontrolü ve ilkfakeoperation/samekey/Close kontrolleri geçerken [odaklıregresyon](../artifacts/release-audit/ra-20261111/provider-profile-lock-scope-worker/REPORT.md) RED oldu. Gerçek ikiCLI, kapasiteaşımı veya uzak/auth exploit gösterilmedi.

Kilit, physicalproviderHome/Profile yerine yalnız journalStateDir/Profile yoluna bağlı. Düzeltme/retest sonradan geçti: Home altında ortak physicalprofile kilidi ve eski journal kilidi birlikte tutulur. OrijinalregresyonGREEN, iki ayrıGo süreç/symlinkalias/constructor cleanup/tümprovision/targetedserver/dar race kontrolleri başarılı. [Retestkanıtı](../artifacts/release-audit/ra-20261111/provider-profile-lock-retest-worker/REPORT.md) sentetikclient/runner + gerçek OS filelock kapsamıdır; yeni finalruntime/paket/CLI kabulü ayrıca açıktır. İlkRED korunur; risk kabulü yapılmadı.


## 12 Kasım — operator yerel imaj retesti

`artifacts/release-audit/ra-20261112/provider-operator-image-worker/REPORT.md`: exactresmîARM64operator üstüne türetilmişcandidate02, iki gerçekGoELFanalyzer; aynıDB baseline2High/4Medium/2Unknown, yeniimaj0High/0Medium/1Unknown. KalanCVE-2026-39824 gopsx/sys0.30.0; henüzdispositionyok. ScratchfilesystemdeAPT yok; Cilium/Envoy gerçekAPTbulguları ayrıca açık. Config/CA/gops/LICENSE.all korunur; yeni bağımlılıkların licenseclosure ve Cilium unversionedrootCVEcoverage henüz doğrulanmadı. Eski binary lowerlayerda kaldığı için imaj küçüldü/sonpakettemiz iddiası yok. Yalnız --version smoke geçmiştir; controller/RBAC/TLS/kurulucluster kabulü değildir. Yerel imaj yayımlanmadı.


## 12 Kasım — Cilium/Envoy APT retesti

[Gerçek imaj ve imzalı paket zinciri](../artifacts/release-audit/ra-20261112/provider-apt-images-worker/REPORT.md): yerel adayların aktiffilesysteminde yalnızapt/libaptpaketleri resmîsecuritysürümlerine yükseltildi; dörtCVE-2026-109518satırı kalktı. Config/layerprefixler ve provider/nativebinary/CA/sourcekey/licensehashleri korundu. AynıTrivyDBOS+13/1Goanalizinde Cilium8High/64Medium/6Low/4Unknown, Envoy23Medium/4Low kaldı. Cilium8Highx/netmodulematch için ayrıactualELF/primaryadvisoryadjudication gerekir; bu tarama birwaiver veya tümproviderkabulü değildir. İmajlar yalnızyerel; mevcutkurulum/pinler değiştirilmedi.


## 12 Kasım — Dokuz satır için teknik NOT_AFFECTED

[Satır bazlı kararlar](../artifacts/release-audit/ra-20261112/provider-go-adjudication-worker/row-dispositions.json) exactELFSHA/GoLinuxARM64/platform/completepclntabkanıtına bağlıdır. Cilium8Highx/netrowda affectedhtmlkodyok; operatorgopsadvisorysininWindowskoduLinuxdosyasında yok. Bu scopedfalse-positivekararı riski kabul etmek değildir; scanner8HighveUnknownhamkayıtları değişmedi. Sekizinceleme13hedefintamamıdeğildir. FarklıELF/version/platform/advisory için karar yeniden uygulanamaz; remainingOS/Go/anaCVE/TLS/lisans ve finalpaket kapıları açık.
