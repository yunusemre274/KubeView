# HEAD 4ec526b7 — origin / session / port-forward preview

Kaynak: `4ec526b7ce1bc39c21b603864c9096f72eb39184`. İnceleme başlangıcı 2026-11-11 11:46:26 UTC; son test 11:54:54 UTC. Kapsam CAT-08/CAT-09/CAT-11'in aktif backend route ve sentetik guard/preview sınırlarıdır. **Bu koşuda somut origin/preview yetki aşımı doğrulanmadı.** Gerçek browser sandbox davranışı, cluster erişimi ve dış port taraması yapılmadı.

Seçilen mevcut **11** backend testi ve **1** statik frontend testi PASS. Eklenen **4** test / **29** alt durum PASS: toplam **16 benzersiz üst test**, 0 kalan FAIL, 0 SKIP. Önceki tekrar koşuları bu sayıya eklenmedi. Yeni dosya yalnız `backend/pkg/server/release_origin_preview_test.go`; runtime, dependency, roadmap ve Git/index değiştirilmedi.

## 1. Statik olarak okunan güven sınırı

- `server.go:114` gerçek `r.TLS` scheme'i ve `r.Host` ile Origin eşleştirir; forwarded host/proto güven kaynağı değildir. Eksik Origin yerel CLI sözleşmesi gereği kabul edilir. `null`, yabancı scheme/host/port, origin userinfo/path/query/fragment ve `Sec-Fetch-Site: cross-site` reddi kod yolundadır. Token yoksa ayrıca Host localhost/loopback olmalıdır. Tokenli yolda access cookie veya bearer karşılaştırılır.
- `protect` bütün korunan route'lara operator request context'i verir. Workspace kullanılırsa workspace/harbor/tab server kaydına bağlanır. Yetkili write için salt-okunur server kilidi, scoped operator cookie, güncel nonce/client/context/namespace ve gerçek Kubernetes SSAR/RBAC ayrı katmanlardır. `/api/session` authentication gerektirmeden login yapar ama aynı Host/Origin guard'ını uygular.
- `validateForward` (`portforward.go:45`) namespace, Pod adı/UID ve 1–65535 portu doğrular; `pods/portforward create` yetkisini ve management grant'ini arar. Kullanıcı arbitrary host/URL dial hedefi vermez. Taşıma sabit Kubernetes Pod subresource'udur.
- HTTP forward kayıtları operator ID'ye bağlıdır. `proxyForward` (`:180`) access/Origin guard'ından sonra kayıt sahibini, nonce/grant'i ve güncel Pod UID'sini kontrol eder. Workspace yolunda Pod üyeliği ayrıca scoped dynamic GET üzerinden kontrol edilir. Revoke/scope değişimi forward kayıtlarını kapatır. Kayıt en çok 15 dakikalık timer taşır. GET listesi ve DELETE sahiplik kontrolü, POST oluşturma yetkisinden ayrıdır.
- Director yalnız seçili Pod'a yönlendirir; Authorization, Cookie, Proxy-Authorization, `X-KubeView-Connection` ve query'deki `connectionID` temizlenir. Upstream Set-Cookie/CORS izinleri çıkarılır; CSP **`sandbox allow-scripts allow-forms`**, no-referrer ve no-store zorlanır. `allow-same-origin` verilmez. Leading-slash Location preview prefix'ine bağlanır; diğer redirect biçimleri bu koşuda yürütülmedi.
- `PortForward.jsx` preview'u `target="_blank" rel="noopener noreferrer"` bağlantısıyla açar. Bu statik JSX bulgusudur; opener/referrer davranışını browser'da ölçmedim. Query'de taşınan connection nonce hassastır; access token URL'de taşınmaz. Log/history/referrer temizliği yalnız header assertion'ından bütün olarak kanıtlanamaz.
- `main.go:239` tek aktif HTTP listener açar; varsayılan loopback, non-loopback bind için token gereklidir. Standalone TLS listener yoktur. `ResolveAvailablePort` helper'ı kaynakta var fakat aktif main yolunda çağrısı bulunmadı. Bu inceleme gerçek LISTEN envanteri veya bind/TLS testi değildir.

## 2. Route envanteri — statik kayıt sonucu

Normal binary'de **25 mux pattern**, explicit replay'de ek **2** pattern var. Aşağıdaki “method gate yok” read handler'ın tüm HTTP methodlarını ayrıca filtrelemediğini söyler; cluster write anlamına gelmez. Test/debug fixture handler'ları production route envanterine katılmadı.

| Pattern | Tür / yöntem | Guard ve temel kapsam |
|---|---|---|
| `/api/session` | HTTP POST | Host/Origin + JSON token login; access cookie |
| `/api/workspace` | HTTP GET/PATCH | Access/Origin; PATCH cookie + workspace nonce + revision |
| `/api/workspace/` | HTTP alt yollar | Export GET; preview/validate/import POST; connection/harbor/relation POST/PATCH/DELETE; metadata nonce ve trusted-context kontrolü |
| `/api/connection` | HTTP GET | Access/Origin, workspace binding; operator intent/nonce |
| `/api/management` | HTTP POST | Scoped cookie/nonce/context/namespace/client generation; enable/revoke |
| `/api/contexts` | HTTP, method gate yok | Access/Origin; harbor envelope'dan muaf context inventory |
| `/api/discovery` | HTTP, method gate yok | Access/Origin + selected scoped client |
| `/api/resources` | HTTP GET/POST/PUT/DELETE | Scope/SSAR; write grant, dynamic adapter, UID/RV |
| `/api/capabilities` | HTTP, method gate yok | Scope/SSAR probes; yetki verme endpoint'i değil |
| `/api/actions` | HTTP POST | Fixed operations, hedef UID/RV, grant/SSAR/impact |
| `/api/metrics` | HTTP, method gate yok | Selected credential; namespace/selector projection |
| `/api/logs` | HTTP GET stream | Pod log + GET/watch yetkileri, UID/container/session |
| `/api/exec` | WS GET upgrade | Access/Origin, scoped management nonce, pods/exec, UID |
| `/api/portforwards` | HTTP GET/POST/DELETE | Owner list/close; create grant/SSAR/UID/port |
| `/api/portforward/` | HTTP preview | Owner/current grant/Pod UID; CONNECT handler'da kapalı |
| `/api/portforward` | WS GET upgrade | Raw TCP; aynı forward create authorization |
| `/api/openapi` | HTTP, method gate yok | Access/Origin; selected client fixed schema path |
| `/api/secrets/reveal` | HTTP GET | Explicit typed Secret read + scope/SSAR |
| `/ws` | WS GET upgrade | Access/Origin, scoped resource list/watch |
| `/api/flows` | HTTP GET/DELETE | Fixed provider, bound API/TLS/credential identity and namespace lease |
| `/api/providers` | HTTP GET | Access/Origin, configured provider status |
| `/api/providers/minikube/workers` | HTTP GET/POST | Loopback peer, write/grant/Node permission, pinned profile/context/cluster |
| `/api/version` | Public HTTP, method gate yok | Build metadata; `protect` dışında |
| `/healthz` | Public HTTP, method gate yok | Constant health text; `protect` dışında |
| `/` | Public static GET/HEAD | Embedded/trusted override frontend; API/WS'ye SPA fallback yok; framing/nosniff/referrer headers. Frontend bulunmayan source placeholder'ı ayrıca method filtrelemez. |
| `/api/replay/status` | HTTP GET; replay only | Access/Origin; explicit synthetic source |
| `/api/replay/scenario` | HTTP POST; replay only | Access/Origin + replay nonce + bounded scenario |

Production Go kaynak aramasında pprof/debug registration bulunmadı. `__benchmark` handler'ları `_test.go` içindedir. Replay production binary'de bulunur ama explicit loopback/read-only seçimi gerektirir. Optional minikube/Hubble child süreçleri mevcut trusted yapılandırmaya bağlıdır; bu worker onları başlatmadı.

## 3. Gerçekten yürütülen assertion'lar

Tüm komutlar `GOMAXPROCS=1`, `go test -p 1 -parallel 1 -timeout 90s -count=1 -v` kullandı; paket/koşular ardışık çalıştı. KUBECONFIG sentetik olmayan credential'a düşmemek için bulunmayan bir test yoluna sabitlendi, provider'lar kapatıldı. Yeni testler `net.Pipe` kullanır, listener açmaz. **Mevcut** sandbox testi kendi owned loopback httptest canary'sini açar; dış hedef veya uygulama süreci başlatılmadı.

| Kanıt | Yürütülen kontrol ve sonuç |
|---|---|
| `existing-security-tests.log` — 11 PASS | Origin/auth/JSON/Host/DNS-rebinding negatifleri; server readonly; unseeded/current/missing/stale management intent; gecikmiş enable'ın revoke/context round-trip sonrası reddi; scope değişiminde in-flight context cancellation; forward namespace/UID/port validation; workspace harbor/tab grant ayrımı ve edit-revoke; mevcut sandbox stripping/foreign owner/revoke cleanup. |
| `preview-final-tests.log` — 4 PASS / 29 alt durum | Gerçek mux ve proxy'den same-origin bearer, **cookie-only normal browser credential yolu**, missing-Origin CLI kabulü; foreign/null/wrong-port/wrong-scheme/cross-site reddi. Kabul edilen preview HTML canary içerir. Authorization/Cookie/Proxy-Authorization/nonce header ve nonce query'si upstream'e ulaşmaz; unrelated query ve Pod hedefi korunur. Çoklu upstream Set-Cookie/CORS başlıkları silinir; saldırgan upstream allow-same-origin CSP'si tek opaque sandbox policy ile değiştirilir; no-referrer/no-store/nosniff doğrulanır. |
| Aynı final log | Login same/missing Origin200 ve foreign/null403. Login cookie HttpOnly, SameSite=Strict, Path=/, MaxAge=28800, plaintext HTTP'de Secure=false; body token'ı tekrar etmez. WS same/missing Origin, upgrade header bulunmadığı için **400 handshake gate**'ine ulaşır; foreign/null403. Bu, kurulmuş WS kanıtı değildir. |
| Aynı final log | Missing operator/access/nonce, stale nonce, disabled grant, expired forward, replaced Pod ve standard CONNECT authority-form reddedilir; denied request workload transport'a gitmez. Pod değişiminde cached forward da kaldırılır. |
| Aynı final log | Port-forward POST server-readonly ve browser-readonly403; missing nonce403; stale409. Yetkili istek **503 explicit missing transport** guard'ına kadar ulaşır; gerçek SPDY kurulmaz ve kayıt oluşturulmaz. |
| `static-route-test.log` — 1 PASS / 8 alt durum | Frontend shell/SPA/assets erişimi; eksik asset404; `/api`, `/api/missing`, `/ws` için frontend fallback404; static POST405; başarılı frontend response'da framing CSP varlığı. |

`preview-inprocess-regressions-initial.log` korunmuştur: ilk üç-test koşusunda CONNECT için 405 bekleyen test, mux'un handler öncesi 404 reddi yüzünden 1 FAIL verdi. Runtime bypass değildi. Test standard authority-form hedefiyle ve 404 rejection beklentisiyle düzeltildi; ayrı retest ve final log PASS. Bu başarısız ara kanıt silinmedi veya güvenlik açığı olarak sunulmadı.

Exact argv/start/end/exit/source-delta ve test-file hashleri `test-runs.json` içindedir. `source-identity.json` base runtime kaynak hashlerini ve final yeni test hashini; `test-summary.json` her koşunun ayrı PASS/FAIL/SKIP ve alt durum sayısını tutar. Loglarda gerçek token, cookie veya connection nonce değeri yazdırılmaz.

## 4. Somut risk ve root'un browser'da sınaması gereken akışlar

Bu kaynakta preview, yönetim UI'siyle aynı URL origin altında taşınır; **güven sınırı browser'ın opaque CSP sandbox uygulamasına dayanır**. Sadece HTML canary'nin response'da görülmesi veya CSP header string'inin doğru olması malicious JS'in yönetim yetkilerine erişemediğini tek başına kanıtlamaz. Bu koşuda bypass bulunmaması CAT-11.06'yı browser kabulü yapmaz.

Root için öncelikli owned browser akışları:

1. Normal UI'dan doğru namespace/Pod UID/port için management açıp preview linkini **bearer header olmadan access/operator cookie** ile aç. Gömülü içeriğin gerçekten yüklendiğini ve opener'ın olmadığını doğrula. Token/nonce değerlerini screenshot veya test raporuna yazma.
2. Owned preview sayfasında inline sentetik script çalışsın; `self.origin` opaque/null olsun. `document.cookie`, localStorage ve service-worker gibi origin yetkileri yönetim origin'ine erişemesin. `/api/connection`, resource/management ve başka forward'a credentials-included fetch/form girişimleri gateway tarafından reddedilsin; canary cluster state'i değişmesin. JS'in CORS hatasıyla dönmesi ile sunucuya giden isteğin 403'ü ayrı gözlensin.
3. Owned foreign sayfa/sibling port ve opaque sandbox'tan login, management, `/ws`, exec/raw-forward denemeleri reddedilsin. Aynı-origin normal yolları ayrıca çalışsın. Eksik Origin, browser saldırısı kabulü değil intentional non-browser CLI yoludur.
4. Gerçek upstream'de çakışan/çoklu CSP, Set-Cookie, CORS ve referrer/cache header'ları ver; cookie yönetim origin'ine kurulmasın. Browser request/referrer/storage/history kaydında gateway access token sızıntısı olmasın. Header testleri bütün referrer/history/log matrisi değildir.
5. Leading-slash/relative/absolute redirect, HTML/SVG/asset/navigation ve upgrade/trailer cevaplarını owned hedeflerle ayrı kontrol et. Bu yolların hiçbiri bu testte browser tarafından takip edilmedi. Preview asset/form kullanımının eksik scope/nonce ile açık proxy'ye dönüşmediğini ve reddin görünür olduğunu doğrula.
6. Açık preview/raw stream varken revoke, scope/credential değişimi ve aynı adlı yeni Pod UID'sini dene; eski akış ve forward kullanılamasın. Gerçek LISTEN/child cleanup, 15 dakikalık expiry ve sekiz saatlik operator expiry burada zaman üzerinden sınanmadı. Native Safari kabulü Playwright WebKit sonucu sayılmaz.

Faz eşlemesi: route envanteri **TEST-01.01, TEST-08.02, TEST-12.10** için statik kanıt; origin/Host/JSON/intent kontrolleri **TEST-08.04, TEST-09.02–09.09** için unit kanıt; cookie/header/query/referrer policy assertion'ları **TEST-09.01/09.10, TEST-11.05/11.07** için sınırlı kanıt. **TEST-09.05/09.06 ve TEST-11.06** gerçek browser davranışı gerektirir. Runtime port/TLS, gerçek API/RBAC, performans, final package veya kullanıcı manuel kabul kapısı bu raporla kapatılmadı.
