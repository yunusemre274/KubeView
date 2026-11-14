# KubeView — yayın öncesi canlı test ve kabul kaydı

- Son güncelleme: 2026-11-14T15:41:04.076032+03:00 — Europe/Istanbul (UTC+03:00).
- Aktif ürün kaynağı:15770296056ca2629601dba540c04741e1822e0d (uzak dala pushlandı). Bu checkpoint aynı ürün+sonuçSHAya bağlı yeni gerçek opt-in test/kanıt farkını kapsar; kayıt commit kimliği GitHEADden doğrulanır. Finalbinary/paket henüz yok.
- Build/paket: profilelock10 private binary5f1c22b9…/sourcef32d6b23, Go1.26.11, index0e478e0c…; final dağıtım arşivi değildir. Eski f9/4c ve bütün başarısız deneyler korunur.
- Ortam: MacM5/32GiB/macOS27.0.1; Chromium156/ANGLE Metal/medium/DPR1/1440×900/M38. Dengeli matris Battery53% başlangıç/lowpower0; canlı güç/RSS/disk sınırları denetlenir. Owned2Node lab ölçüm için durdu.
- Dağıtım modeli: local-first tek yerel operatör; loopback varsayılan, uzak erişimde açık token/TLS/tünel sınırı. İnternete açık çok kullanıcılı SaaS kapsamı yok. Hubble/minikube opsiyonel fakat sunulan yollar zorunlu test kapsamındadır.
- Toplam test fazı: **200**. NOT_STARTED:134; IN_PROGRESS:20; FAILED:3; BLOCKED:1; RETEST_REQUIRED:3; VERIFIED_DONE:39; NOT_APPLICABLE:0.
- Kullanıcı kararı bekleyenler: stable yayın/merge/milestone için manuel onay; V11-16 fiziksel ekran kabulünün yerine proxy kabulü istenirse ayrıca açık karar gerekir. Henüz karar değiştirilmedi.
- Güvenlik bulguları: SEC001/002 ve PROV-CACHE/LOCK darfix/retestleri kayıtlı; finalpaket açık. Kurulu1.20.2 tarihi bulguları korunur. Yereloperator0High/1Unknown; OSsecurity2Cilium8High/55Medium/6Low/4Unknown, Envoy16Medium/4Low;16Mediumgiderildi. Exact8CiliumHigh+operatorWindowsUnknown NOT_AFFECTED analizi ayrı, rawtarama silinmedi. Yereladaylar kurulmadı; kalanseverity/native/source/TLS/lisans/paketkapıları açık.
- Eski kapılar: V11-16 BLOCKED (fiziksel sunum kanıtı yok); V11-18 BLOCKED (CPU karşılaştırması/final matris eksik); V11-19 BLOCKED (önkoşullar+manuel kabul). FullTLS/cold bootstrap ve kesilmiş uzun koşu yeniden doğrulanacak; eski PASS yeni kaynağa taşınmadı.
- Son tamamlanan faz: TEST13.01 boundedworkspace/import/parser;39/200 (%19,5fazsayısı). Genel NOT_RELEASE_READY; kritik açık kapılar ve manuelonay sürer.
- Süreç/lab: Bu devamda yeni test çalıştırılmadı; önceki iki workerın kayıtları rootkontrolünden geçti. Sonownedlabkaydı STOPPED; manuelveri korunur. Pil28%; ağırölçüm/60dkkoşusu başlatılmıyor.
- Devam: TEST13.01 test/kanıt/docs kontrol noktasını secret-scan ardından commit/push; sonra CI114 exactpaket/native temizbaşlangıç retesti. TEST12.03/YAML, providerTLS, CPU/render/RSS, uzunkararlılık ve manuelkapılar açık. Stabletag/merge/milestone manuelonaysız yok.
- **Çalışma: AKTİF — kullanıcı devam talimatı; tamamlanmış testler tekrar edilmeden sonuçlar birleştiriliyor.**
- **Genel karar: NOT_RELEASE_READY**.

## Merkezi kaynak ve güvenlik bütçesi

Ana müdür roadmap/Git/index/allowlist sahibidir. Başlangıç iki test worker; her biri tek sonlu iş. Normal testte root+2 worker, worker içi test paralelliği1–2. Ölçüm/60dk koşusunda diğer ağır işler durur. Aktif saldırı hedefi yalnız owned uygulama loopback portları19840–19849 ve owned private lab kapsamıdır; üçüncü taraf/üretim hedefleri yok. Canary yalnız loopback. İlk aktif HTTP yük tavanı10 istek/sn, eşzamanlılık4,60sn; fuzz ilk tur10sn/1worker; body negatiflerinde en fazla8MiB ve en fazla10 istek. Bu değerler ilgili faz başlamadan gerekçeli daraltılabilir/genişletilebilir. Global stop: owned test uygulaması RSS>2GiB, toplam owned browser RSS>6GiB, boş disk<10GiB veya thermal/power kesintisi; cluster bootstrap ayrı doctor bütçesi olmadan başlamaz. Ağır uzun koşu düşük pille başlamaz. Hiçbir sahip olunmayan süreç kapatılmaz.

A/B önemli aileler: en az5 geçerli eşleşmiş AB/BA tekrar;30sn warm+60sn steady. M≥55draw/s p95≤20ms p99≤33.3ms; L≥30 p95≤40 p99≤50ms (önce60 ise30'a indirme yok). Görüntü/DPR/kalite/kapsam/güncellik eşit. Normal callback→store≤100ms/burst≤250ms; view proxy≤250/500ms; toplam CPU tüm ilgili süreçlerde. Pratik regresyon eşiği başlangıç planında medyan +5% ve dağılım/belirsizlikle birlikte değerlendirilecek; bu eşik eski açıklanmamış farkı otomatik aklamaz.60dk koşusu kesintisiz;20dk ara kontrol,50panel/log,3reconnect. Her testin kendi güvenlik sınırı ayrıca aşağıya yazılır.

## Kategori özeti

| Kategori | Faz | Durum | Geçerli kanıt |
|---|---:|---|---|
| CAT-01 — Mimari, tehdit modeli ve saldırı yüzeyi | 6 | NOT_STARTED:4, VERIFIED_DONE:2 | runtime-surface-retest/REPORT.md + second-review |
| CAT-02 — İki liman ve temel UX | 5 | NOT_STARTED:3, IN_PROGRESS:1, VERIFIED_DONE:1 | Henüz yok |
| CAT-03 — Workspace ve izolasyon | 11 | NOT_STARTED:5, IN_PROGRESS:1, VERIFIED_DONE:5 | Henüz yok |
| CAT-04 — Gerçek Kubernetes işlemleri | 18 | NOT_STARTED:14, IN_PROGRESS:2, VERIFIED_DONE:2 | Henüz yok |
| CAT-05 — Log/metrics/Secret | 10 | NOT_STARTED:7, VERIFIED_DONE:3 | Henüz yok |
| CAT-06 — Hubble/TLS/provisioning | 14 | NOT_STARTED:6, IN_PROGRESS:1, FAILED:1, VERIFIED_DONE:6 | Henüz yok |
| CAT-07 — Statik analiz/bağımlılık/sır | 11 | NOT_STARTED:4, IN_PROGRESS:1, FAILED:2, VERIFIED_DONE:4 | Henüz yok |
| CAT-08 — Portlar/erişim/TLS | 6 | NOT_STARTED:5, VERIFIED_DONE:1 | Henüz yok |
| CAT-09 — Session/CSRF/WebSocket | 10 | NOT_STARTED:3, IN_PROGRESS:2, VERIFIED_DONE:5 | Henüz yok |
| CAT-10 — API nesne/işlem yetkilendirmesi | 9 | NOT_STARTED:7, RETEST_REQUIRED:1, VERIFIED_DONE:1 | Henüz yok |
| CAT-11 — XSS ve önizleme | 7 | IN_PROGRESS:4, VERIFIED_DONE:3 | Henüz yok |
| CAT-12 — Import/dosya/host komutları | 10 | NOT_STARTED:7, IN_PROGRESS:2, VERIFIED_DONE:1 | Henüz yok |
| CAT-13 — Fuzz/race/eşzamanlılık | 10 | NOT_STARTED:6, VERIFIED_DONE:4 | Henüz yok |
| CAT-14 — Kontrollü pentest zincirleri | 5 | NOT_STARTED:5 | Henüz yok |
| CAT-15 — Yük ve tükenme | 9 | NOT_STARTED:9 | Henüz yok |
| CAT-16 — A/B benchmark | 13 | NOT_STARTED:11, RETEST_REQUIRED:1, VERIFIED_DONE:1 | Henüz yok |
| CAT-17 — Kaynak optimizasyonu | 6 | NOT_STARTED:5, IN_PROGRESS:1 | Henüz yok |
| CAT-18 — Uzun kararlılık ve kurtarma | 5 | NOT_STARTED:4, BLOCKED:1 | Henüz yok |
| CAT-19 — Gecikme/erişilebilirlik/tarayıcı | 9 | NOT_STARTED:6, IN_PROGRESS:3 | Henüz yok |
| CAT-20 — Paket/güncelleme/CI | 14 | NOT_STARTED:11, IN_PROGRESS:2, RETEST_REQUIRED:1 | Henüz yok |
| CAT-21 — Manuel teslim/son inceleme | 12 | NOT_STARTED:12 | Henüz yok |

## Standart ve kanıt politikası

ASVS5.0.0, WSTG4.2, API Top10:2023 ve SSDF1.1 kararlı sürümleri doğrulandı; seçili ASVS kontrol kimlikleri resmi5.0.0CSVden kontrol edildi (docs/RELEASE_THREAT_MODEL.md). WSTG faza özel kimlik doğrulaması henüz yok; kaynak adı uyumluluk anlamına gelmez. Standart adı sertifika değildir. Eski unit/replay/gerçek Kubernetes sonuçları kendi kaynak kimliğinde tarihsel kalır. SKIP/NOT_RUN/BLOCKED PASS değildir. Aşağıdaki checkbox'lar test çalışmadan işaretlenmez. Her alt adım sonucu root tarafından hemen eklenir; ham veri bu dosyaya gömülmez. Kaynak değişikliği etkilenen fazı RETEST_REQUIRED yapar, belge-only yeniden kullanım gerekçesi ayrı yazılır.


## CAT-01 — Mimari, tehdit modeli ve saldırı yüzeyi

### TEST-01.01 — Aktif HTTP/WS/statik/debug/provider endpoint envanteri

- Kategori: CAT-01.
- Amaç / kullanıcı riski: Aktif HTTP/WS/statik/debug/provider endpoint envanteri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.1.1/V8.1.2; API9:2023; CAT01. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + GÜVENLİK WORKER (ikinci kaynak/kanıt incelemesi)
- Kaynak / build / paket kimliği: Runtime4c6c2ac5; provider09f9e70b60; sourcefileSHA/result/probe normal+replay kayıtlarında
- Ortam / kullanılan kimlik ve yetki: Owned127.0.0.1:19844; fresh private boş workspace, explicit missing kubeconfig, synthetic access key; no Kubernetes/provider credentials; normal ve açık read-only replayM
- Başlangıç zamanı: 2026-11-11T13:20:48.364084+03:00
- Bitiş zamanı: 2026-11-11T19:05:23.872426+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-01.01-S1 — Hazırlık
- [x] Güncel Register/main/provider/replay/workspace kaynakları ve private runtime4c6c2ac5/f9 binary kimliği kaydedildi.
- [x] Owned boş workspace/kubeconfig yokluğu, providersdisabled, explicitloopback ve childPID/birth/PGID sınırı hazırlandı.
- Tarihsel36d5b8f başlangıç incelemesi ve ilk28GET helperFAIL ayrı korunur; eski başarı güncel runtime sanılmadı.
- Kanıt: normal/replay result.json sourceSHA/input/binary; ikinci inceleme currentruntime beş dosyanın4cbyteeşitliğini doğruladı.

#### TEST-01.01-S2 — Normal kullanım / pozitif kontrol
- [x]37normal ve7explicitreplay assertion geçti.
-25normalServeMuxpattern/21protect, publicUI/health/version/session sınırı ve explicitreplay2ekpattern kaynak ve gerçekHTTP ile ayrıldı.
- Yetkili sentetik anahtarla boşworkspace/contexts200, publicshell/health/version200. Replaystatus gerçekTEST/REPLAY/M/runningfalse; nonce yalnız presence, değeri saklanmadı.
- Kanıt: artifacts/release-audit/ra-20261111/runtime-surface-retest/REPORT.md; runtime-surface-replay/result.json; runtime-surface-second-review-worker/REPORT.md.

#### TEST-01.01-S3 — Negatif / sınır / arıza kontrolü
- [x] Yetkisiz21route/prefix401, yabancıorigin403, sessionGET403; defaultreplay/benchmarkAPI404.
- Debugbenzeri5yol200 gövdehashi exactembeddedindex ile aynı: SPAfallback, profiler/metrics/testhandler değil. Explicitreplay auth/method405 ayrı kontrol edildi.
- Somutpath evreni25pattern adedi değildir; genericworkspace/portforwardprefixleri kendi altsözleşmelerini taşır.
- Bu GET/guard envanteri WSupgrade, mutation, gerçekKubernetes, TLS/perf veya finalpaket kabulü değildir.

#### TEST-01.01-S4 — Bulgular ve düzeltme
- Bulgu: ilk yardımcı `/api/contexts` object yanıtını array sandı; ilkFAIL ve source korundu. Ürün davranışı değiştirilmedi.
- Düzeltme: sadece yardımcı mevcutcontexts sözleşmesine bağlandı. Rawregex rootpattern sonplaceholder alternatifini seçtiği için ROOT_ACTIVE_ROUTES.json embedded aktif yol/dört alternatifi açıklar.
- Güvenlik açığı yok kararı yalnız bu envanter kapsamındadır; diğer açık provider/SCA/güvenlik kapıları kapanmaz.

#### TEST-01.01-S5 — Tekrar test ve regresyon
- [x] İlk contexts helper sorunu aynı runtime üzerinde düzeltilmiş assertion ile tekrarlandı; normal37PASS.
- [x] Normal olumlu/olumsuz kontroller ve explicitreplay7PASS aynı kaynak/binaryye bağlı.
- Komşu mutation/UI testlerinin tamamını tekrar koşmak NOT_APPLICABLE: runtime değiştirilmedi ve bu faz yalnız envanter; mevcut ilgili test kapıları kendi durumunda kalır.

#### TEST-01.01-S6 — Temizlik ve inceleme
- [x] Her iki ownedapp exactPID/birth/PGID ile kapandı, exit0/noLISTEN19844. Private testworkspace ve küçük güvenli kanıtlar korunur; authkey/header/cookie/body taşınmadı.
- [x] Kaynak/binary/index/probeSHA ve sonuçlar eşleşti.
- [x] Farklı worker normal25/21+replay2,37+7durum, üç eski/yeniSHA listesi, currentfilebyteeşitliği ve rootfallback düzeltmesini ikinci kez inceledi.
- İnceleyen: release_security; aynı ajan sistemi, profesyonel üçüncü taraf pentest değildir. WSTG4.2INFO06 birincil kaynak eşlemesi doğrulandı; sertifikasyon iddiası yok.
- Sınır: final arşiv ve gerçek işlevler bu fazdan ayrı.

Source-reuse değerlendirmesi: sonrakiPROV-LOCK-002 değişikliği yalnızpkg/provision/New/Close physicalfilesystem kilididir. Envanterin beşRegister/auth/static/replay kaynağı değişmedi;37normal/7replayprobu providersdisabled veya authguard-öncesi dalda New çağırmaz. Bu dar envanter kanıtı korunur; yeni finalpaket/runtime startup ve provider davranışı ayrıca retest edilir.

#### TEST-01.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: güncel özel functionalbinary ve aktif production kaynakları için dar endpoint/method/auth-entry inventory doğrulandı. İlkFAIL korunur; scope genişlemesi veya runtime/route/mux/build değişimi retest gerektirir.
- Bu sonuç diğer güvenlik kategorileri, WS/CRUD, gerçek cluster, performans veya finalpaket için otomatikPASS sağlamaz.

### TEST-01.02 — Auth/session/write-grant/RBAC veri akışı

- Kategori: CAT-01.
- Amaç / kullanıcı riski: Auth/session/write-grant/RBAC veri akışı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.1.1/V8.1.2; API9:2023; CAT01. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + Provider worker (yalnız kaynak akışı incelemesi; testler root tarafından ayrı)
- Kaynak / build / paket kimliği: HEADe73cb0da + sourceSHA ile donmuş yeni watch düzeltmesi. Önceki23 runtime dosyasının22si f32 ile aynı; stream.go değişti,3yeni backendtest/helper eklendi. Final paket kabulü değil.
- Ortam / kullanılan kimlik ve yetki: Kaynak-only inceleme, credential/lab erişimi yok. Planlanan hedefli Go guard testleri GPU tanılaması bittikten sonra çalışacak.
- Başlangıç zamanı: 2026-11-12T22:59:53.764171+03:00
- Bitiş zamanı: 2026-11-12T21:06:07.962047+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: Aktif source auth/session/writegrant/RBAC zinciri dosya/fonksiyon ve yetki sınırlarıyla çıkarılmalı; yeni sonlu fake/in-process guard grupları ve ikinci inceleme bunu desteklemeli. GerçekRBAC/TLS/browser/WS/endpoint/finalpaket kabulü kendi fazlarında kalır.

#### TEST-01.02-S1 — Hazırlık
- [x] Aktif23runtime/contextdosyası f32byteeşitliği,45source/evidenceSHA ve gerçeklocal-first/remote-token/credential/provider güven sınırları kaydedildi.
- [x] İlk17ve ilave6 exacttestiçin anchoredregex/SDK1.26.11/count1/p1/parallel1/sourcebefore-after ve150s/1.5GiB/disk10GiB bütçesi önceden yazıldı. Sentetikkubeconfig/Secret ve fake/in-processHTTP fixtureları; ownedGPU işi bittikten sonra çalıştı.
- Sourcejob350.073sile yaklaşık300stargetiaştı; workflowmiss korunur, ürünSLOPASS sayılmaz. Gerçekclusterhazırlığı NOT_APPLICABLE: bu fazsource/guardharitasıdır, CAT04/05/06/10yerinegeçmez.

#### TEST-01.02-S2 — Normal kullanım / pozitif kontrol
- [x] İlkgrup17ana+13alt, ilavegrup6ana+18alt, doğru packagePASS;0fail/skip.4.966728s ve2.276627s/150wall.
- [x] Yetkilisentetikgrant gerçekfakeDELETEhedefine ulaşır; grant/Host/Origin/token/cookie/profile/namespace pozitifleri sınandı. Önerilen18testin tamamı ikiayrıgrupta+5komşuyla23unique/31altkontrole kapsandı. İlk17tekrarlanmadı.
- Kanıt: auth-flow-targeted-root veauth-flow-scope-addendum-root/{plan,execution,go-test}.json/jsonl; coverage-union.json.

#### TEST-01.02-S3 — Negatif / sınır / arıza kontrolü
- [x] Unseeded/missing-stalenonce/readOnly red, lateenable/revoke/context-roundtrip, expiredoperatorcookie/replay, origin/host/contenttype/session, streamcancel ve profilecookie sınırları geçti.
- [x] Eksik6workspaceCSRF/scope, harbor/tabgrant+selector-revoke, sharedNode-impactack, credentialgenerationreload, retained-grantreadonlyendpointmatrix ve typedSecret discoveryfailclosedkontrolü ayrıkoşuda geçti.
- FakeSSARAllowedfixture gerçekupstreamRBACredkanıtıdeğildir; exec/forwardpositive503yalnıztransportpreflight. GerçekRBAC/admission/TLS/WS/providerkapıları ayrı.

#### TEST-01.02-S4 — Bulgular ve düzeltme
- Bu kaynakharitası/guardgrubu kapsamında yeniürünkusuru doğrulanmadı; genelgüvenliktemizliği iddiasıyok.
- ManagementenableAPIbaşarısı adminRBACdeğil; peroperationauthorizeSSARAllowedvegerçekAPIsonkarar. InternalmanagementAllowedno-operatorctxpathpublicprotecti atlamaz. StatictokenbrowsercookieMaxAge ile operatorabsolute8h farklısınırlardır.
- İlkpeerhelper45listedfilevarsayımı yanlış çıktı;43listed+2ownartifact=45manifest olduğu düzeltildi. İlkcheckerFAIL korunur, ürün/testbaşarısızlığı veya yeniretestdeğildir.

#### TEST-01.02-S5 — Tekrar test ve regresyon
- [x] İki yeni grup count1ile çalıştı; ilgili normal/negatif komşu kontroller korunuyor.
- [x] İlkreviewin6NOT_RUN açığı yalnızbu6kontrolle giderildi; 17başarılıtest yenidenkoşulmadı, geçmiş18sourceönerisine sahtePASS yazılmadı.
- Yeniürünfixi olmadığından ilkPoCretestNOT_APPLICABLE; yeniassertionbeklentisi veya ürün davranışı değiştirilmedi. CIgenişgrup/gerçeklab/platform kabulü bu sayıdan türetilmez.

13 Kasım +03 retest: son source üzerinde23auth ana/31alt test tekrar geçti (2,294sn/0SKIP); değişen stream için ayrıca6snapshot/watch/CR/sharedbroker ADDUPDATEDELETE komşu testi (2,523sn/0SKIP). Tekrar gerekçesi ürün watch-authority yolunun değişmesidir; belge-only tekrar değildir.

#### TEST-01.02-S6 — Temizlik ve inceleme
- [x] İlk4veilave3yakalanmışchildidentityabsent; tempfixturelarGocleanupilekapanır,sourcebefore/afteraynı. Bu kayıtlar bütünkısayaşayanprocesscensus değildir.
- [x] Root45sourceSHA,5ilkpeerSHA ve sonpeerSHAmanifestini tekrarhesapladı; ikiayrıworker kaynak/sentetikguard kanıtlarını kendi kapsamlarıyla inceledi. Aynıajansistemi, profesyonelüçüncütarafdeğil.
- [x] Exactkaynak/build/komut/JSONevent/paketPASS/cleanup/coverageunion bağlantıları ROOT_CLOSURE.json ile birleştirildi; credential/gerçekSecret yok.
- Sınır: runtimegerçekRBAC/TLS/browser/WS/exec/forward/provider/finalpaket ve genelreleasekapıları açık.

Root23eski runtime source hashini karşılaştırdı:22aynı, yalnızstream.go değişti; yeni3backend dosyası ve async exact-scope renewal/writer failclosed yolu ayrıca okundu. Kanıt: auth-flow-after-watch-fix-root/source-applicability.json; watch-snapshot-neighbors-root/REPORT.md; active-watch-authz-fix-worker/ROOT_REVIEW.json. Önceki bağımsız source incelemesi tarihsel kalır, değişen yol root tarafından ikinci inceleme gördü.

#### TEST-01.02-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- VERIFIED_DONE: yalnız aktifauth/session/writegrant/RBAC SOURCE veri akışı haritası +23unique/31alt sentetikguard denetimi. Tüm CAT09/CAT10 veya genelgüvenlikkapıları kapanmaz.
- Kanıt: artifacts/release-audit/ra-20261112/auth-flow-scope-addendum-root/ROOT_CLOSURE.json ve bağlıiki execution/ikipeer/source raporu.
- Auth/route/session/credential/workspaceauthorization veya ilgili bağımlılık/runtime davranışı değişirse uygulanabilir bu faz tekrar değerlendirilir. Belge-only değişiklik bütünuzuntestleri tekrar gerektirmez.

2026-11-12 yeni kaynak uygulanabilirliği: stream.go aktif watch yetki yenilemesi çalışma ağacında değiştiği için önceki f32 source haritası tarihsel korunur; güncel kaynak için RETEST_REQUIRED. Önceki23unique/31alt başarı silinmedi. Yeni async renewal/bütçe/fail-closed writer yolu ve ilgili guardlar son kaynakta incelenmeden bu faz güncel VERIFIED_DONE sayılmaz.

Güncel dar source+sentetikguard kabulü yeniden VERIFIED_DONE. GerçekRoleBinding/TLS/browser/diğerendpoint/finalpaket kapıları açık; kaynak incelemesi genel güvenlik kabulü değildir.

### TEST-01.03 — Workspace/harbor/connection/cache güven sınırları

- Kategori: CAT-01.
- Amaç / kullanıcı riski: Workspace/harbor/connection/cache güven sınırları; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.1.1/V8.1.2; API9:2023; CAT01. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-01.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-01.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-01.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-01.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-01.04 — Browser/backend/Kubernetes/Hubble/minikube/host sınırları

- Kategori: CAT-01.
- Amaç / kullanıcı riski: Browser/backend/Kubernetes/Hubble/minikube/host sınırları; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.1.1/V8.1.2; API9:2023; CAT01. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-01.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-01.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-01.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-01.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-01.05 — Zararlı web sayfası, reader ve workload tehditleri

- Kategori: CAT-01.
- Amaç / kullanıcı riski: Zararlı web sayfası, reader ve workload tehditleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.1.1/V8.1.2; API9:2023; CAT01. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-01.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-01.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-01.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-01.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-01.06 — Local-first ve uzak/in-cluster tehdit modeli

- Kategori: CAT-01.
- Amaç / kullanıcı riski: Local-first ve uzak/in-cluster tehdit modeli; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.1.1/V8.1.2; API9:2023; CAT01. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-01.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-01.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-01.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-01.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-02 — İki liman ve temel UX

### TEST-02.01 — 02 profilinde temiz paketten iki gerçek proje

- Kategori: CAT-02.
- Amaç / kullanıcı riski: 02 profilinde temiz paketten iki gerçek proje; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ürün CAT02: gerçek iki liman, viewport ve erişim; güvenlik standardı sertifikası iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:35:03.936403+03:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-02.01-S1 — Hazırlık
- [x] Yeni owned private lab02 ilk kurulumla hazırlandı.
- Yapılan: mevcut runner; labId kvml-aed6bc565b30, kube-system UID a51d8e09-b035-4571-a5b3-4f0a40401f91,2ReadyNode/2namespace/2ReadyPod.
- Kullanılan komut / çalışma dizini: scripts/manual_lab.py up --profile02-ortak-kume (bayrak ayrımı lab logunda); repo.
- Beklenen: global kubeconfig ve eski manuel lab korunmalı.
- Gözlenen: yeni private state; baseline36d ikilisi19842de açıldı,2kayıt planı.
- Kanıt: artifacts/release-audit/ra-20261111/lab02-cold-up.log; lab02-status-initial.json; lab02-app-baseline.log
- Sonuç: baseline hazırlık geçti; son temiz paket henüz doğrulanmadı.

#### TEST-02.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-02.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-02.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-02.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-02.02 — Uzak görünümde iki merkez/iskele/isim/konum

- Kategori: CAT-02.
- Amaç / kullanıcı riski: Uzak görünümde iki merkez/iskele/isim/konum; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ürün CAT02: gerçek iki liman, viewport ve erişim; güvenlik standardı sertifikası iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: candidate02-binary.json SHA1003a43a…7bf0;runtimehashler kayıtlı
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:42:17.092651+03:00
- Bitiş zamanı: 2026-11-11T14:31:09.525082+03:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-02.02-S1 — Hazırlık
- [x] Owned iki-harbor gerçek Kubernetes başlangıç UIı açıldı.
- Yapılan:36d baseline embeddedbinary, Chromium/Metal/1440×900,1280×800,768×900; video açık işlev testi.
- Beklenen: normal workspace globalmapte iki tesis sınırı görünür.
- Gözlenen:1440/1280 iki merkez/rıhtım ayrı ve tıklanabilir; dar globalmapte rıhtımlar kenardan kırpıldı.
- Kanıt: artifacts/release-audit/ra-20261111/ui02-baseline-chromium-3/world-768.png; video; result.json
- Sonuç: runtime kadraj kusuru bulundu.

#### TEST-02.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.02-S3 — Negatif / sınır / arıza kontrolü
- [x] Dar aspect ve24derece lens için mevcut camera fit örnekleri sınandı.
- Yapılan: global LOD örnekleme unit regresyonu.
- Beklenen: aktif veuzakgeometri16köşe.
- Gözlenen: eski fonksiyon8köşe; FAIL.
- Kanıt: artifacts/release-audit/ra-20261111/global-overview-red.log
- Sonuç: UI-001 kök neden doğrulandı.

#### TEST-02.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: UI-001 (P2).
- Kök neden: global overview viewport/lens ve actualbounds yerine liman merkez aralığından sabitmesafe hesaplıyordu.
- Değiştirilen dosya / fonksiyon: HarborScene overviewWorkspace; cameraViews harborFitSamples explicitall.
- Düzeltme çalışma farkı: mevcut fitHarborView kullanılıyor; normal kullanıcı kamerası yalnız globalmap eyleminde değişir.

#### TEST-02.02-S5 — Tekrar test ve regresyon
- [x] Global fitunit red→green;223unit/buildPASS.
- [x] Gerçek embeddedcandidate02 normalpointer Chromium15/WebKit15: iki tesis+merkez+doğru PodUID,Canlı,0workspace403/0pageerror.
- Kanıt: ui02-scope02-chromium/result.json; ui02-scope02-webkit/result.json; UI_REVIEW.md
- Sonuç: gerçekiki-namespaceharitaları ve ayrı konumlar doğrulandı;CPU/nativeSafari/finalarchive değil.

#### TEST-02.02-S6 — Temizlik ve inceleme
- [x] Yalnızownedlab;fixture/deploybaseline korunur,arayüztestiK8smutationyapmadı.
- [x] Binary/index/runtimehashler exactmanifestte.
- [x] Root1440/768/center768veWebKit768karelerini,4s/13svideokareleriniaçtı.
- İnceleyen: ANA MÜDÜR; ekikinci ajan görselreviewhenüzyok.
- Kalan sınır: seçiliPodlabel sağkenarkırpılmasıP2,CAT19.07de;390phone/finalpackage/yetkiçeşitleri ayrıfazlar.

#### TEST-02.02-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar:1440/1280/768normalglobalmapteikiayrımerkez/rıhtım/konum,isimlevhasıveUID erişimi gerçekveriyle görüldü.
- Yenidençalıştırma:layout/camera/worldplacement/LOD/scope değişimi; finalpackage ayrıca.

### TEST-02.03 — Liman seçme, yaklaşma ve genel görünüme dönüş

- Kategori: CAT-02.
- Amaç / kullanıcı riski: Liman seçme, yaklaşma ve genel görünüme dönüş; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ürün CAT02: gerçek iki liman, viewport ve erişim; güvenlik standardı sertifikası iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-02.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-02.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-02.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-02.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-02.04 — 1440/1280/dar pointer ve klavye erişimi

- Kategori: CAT-02.
- Amaç / kullanıcı riski: 1440/1280/dar pointer ve klavye erişimi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ürün CAT02: gerçek iki liman, viewport ve erişim; güvenlik standardı sertifikası iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-02.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-02.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-02.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-02.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-02.05 — Tam ekran dünya ve Soft UI görsel regresyon

- Kategori: CAT-02.
- Amaç / kullanıcı riski: Tam ekran dünya ve Soft UI görsel regresyon; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ürün CAT02: gerçek iki liman, viewport ve erişim; güvenlik standardı sertifikası iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-02.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-02.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-02.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-02.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-02.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-03 — Workspace ve izolasyon

### TEST-03.01 — Aynı kümede farklı namespace projeleri

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Aynı kümede farklı namespace projeleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-03.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-03.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-03.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-03.02 — Aynı namespace farklı label seçicileri

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Aynı namespace farklı label seçicileri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7; binary1003a43a6a80… (4999981+hashli frontend farkı), final arşiv değil
- Ortam / kullanılan kimlik ve yetki: owned kvml-aed6bc565b30-a, kube-systemUIDa51d8e09…; explicit private admin, yalnız UID/label korumalı02 fixture
- Başlangıç zamanı: 2026-11-11 önceki checkpoint; raw run.log
- Bitiş zamanı: 2026-11-11T14:41+03:00; önceki koşu sonucu bu checkpointte incelendi
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.02-S1 — Hazırlık
- [x] Sahip olunan cluster/namespace UID ve fixture etiketi guard ile doğrulandı.
- Yapılan: üç geçici harbor; iki gerçek Deployment.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-selector/workspace-real-selector-multins-overlap-qa-ws-471a793fc34f49d8.json
- Sonuç: PASS; default/production context yok.

#### TEST-03.02-S2 — Normal kullanım / pozitif kontrol
- [x] aynı namespace label selector gerçek API ve authoritative WS snapshot üzerinden doğrulandı.
- Gözlenen: gerçek UID/owner/Ready, scoped LIST ve UPDATE içerikleri doğru.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-selector/run.log
- Sonuç: PASS; normal UI form veya animasyon kanıtı değildir.

#### TEST-03.02-S3 — Negatif / sınır / arıza kontrolü
- [x] Selector dışı create/read reddi, label çıkışı/reentry, eski session generation ve DELETE tüm örtüşmelerde kontrol edildi.
- Gözlenen: OUT_OF_SCOPE yalnız metadata; kaynak gerçek API’de durur. Aynı UID geri girer, reconnect stream nesli değişir, gerçek UID/RV DELETE kaybolur.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-selector/workspace-real-selector-multins-overlap-qa-ws-471a793fc34f49d8.json
- Sonuç: 7alt kontrol PASS; SKIP0.

#### TEST-03.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: bu dar gerçek selector/union koşusunda yeni hata bulunmadı.
- Kapsam: iki namespace, üç geçici harbor; reader/cross-cluster ayrı faz.

#### TEST-03.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten retest: NOT_APPLICABLE; bu koşuda yeni ürün hatası üremedi.
- [x] Normal liste/update/delete ve komşu selector durumları aynı koşuda geçti.
- Kanıt: run.log; eski başarılı kaynak otomatik taşınmadı.

#### TEST-03.02-S6 — Temizlik ve inceleme
- [x] Her owned Deployment UID GET404, Deployment/RS/Pod audit LIST0.
- [x] Üç geçici harbor silindi; özgün belge revision dışında aynı.
- [x] Root test fonksiyonunu ve redakte raw çıktıyı ayrı okudu.
- İnceleyen: ANA MÜDÜR; profesyonel bağımsız pentest değildir.
- Kalan sınırlar: normal UI selector düzenleme, reader ve final paket ayrı fazlarda.

#### TEST-03.02-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: aynı namespace label selector için gerçek API/watch ve içerik/UID/cleanup kabulü sağlandı.
- Yeniden test: backend scope/filter/union/stream protokolü değişirse.

### TEST-03.03 — Örtüşen ve çok namespace proje

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Örtüşen ve çok namespace proje; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7; binary1003a43a6a80… (4999981+hashli frontend farkı), final arşiv değil
- Ortam / kullanılan kimlik ve yetki: owned kvml-aed6bc565b30-a, kube-systemUIDa51d8e09…; explicit private admin, yalnız UID/label korumalı02 fixture
- Başlangıç zamanı: 2026-11-11 önceki checkpoint; raw run.log
- Bitiş zamanı: 2026-11-11T14:41+03:00; önceki koşu sonucu bu checkpointte incelendi
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.03-S1 — Hazırlık
- [x] Sahip olunan cluster/namespace UID ve fixture etiketi guard ile doğrulandı.
- Yapılan: üç geçici harbor; iki gerçek Deployment.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-selector/workspace-real-selector-multins-overlap-qa-ws-471a793fc34f49d8.json
- Sonuç: PASS; default/production context yok.

#### TEST-03.03-S2 — Normal kullanım / pozitif kontrol
- [x] örtüşen/çok namespace birleşimi gerçek API ve authoritative WS snapshot üzerinden doğrulandı.
- Gözlenen: gerçek UID/owner/Ready, scoped LIST ve UPDATE içerikleri doğru.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-selector/run.log
- Sonuç: PASS; normal UI form veya animasyon kanıtı değildir.

#### TEST-03.03-S3 — Negatif / sınır / arıza kontrolü
- [x] Selector dışı create/read reddi, label çıkışı/reentry, eski session generation ve DELETE tüm örtüşmelerde kontrol edildi.
- Gözlenen: OUT_OF_SCOPE yalnız metadata; kaynak gerçek API’de durur. Aynı UID geri girer, reconnect stream nesli değişir, gerçek UID/RV DELETE kaybolur.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-selector/workspace-real-selector-multins-overlap-qa-ws-471a793fc34f49d8.json
- Sonuç: 7alt kontrol PASS; SKIP0.

#### TEST-03.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: bu dar gerçek selector/union koşusunda yeni hata bulunmadı.
- Kapsam: iki namespace, üç geçici harbor; reader/cross-cluster ayrı faz.

#### TEST-03.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten retest: NOT_APPLICABLE; bu koşuda yeni ürün hatası üremedi.
- [x] Normal liste/update/delete ve komşu selector durumları aynı koşuda geçti.
- Kanıt: run.log; eski başarılı kaynak otomatik taşınmadı.

#### TEST-03.03-S6 — Temizlik ve inceleme
- [x] Her owned Deployment UID GET404, Deployment/RS/Pod audit LIST0.
- [x] Üç geçici harbor silindi; özgün belge revision dışında aynı.
- [x] Root test fonksiyonunu ve redakte raw çıktıyı ayrı okudu.
- İnceleyen: ANA MÜDÜR; profesyonel bağımsız pentest değildir.
- Kalan sınırlar: normal UI selector düzenleme, reader ve final paket ayrı fazlarda.

#### TEST-03.03-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: örtüşen/çok namespace birleşimi için gerçek API/watch ve içerik/UID/cleanup kabulü sağlandı.
- Yeniden test: backend scope/filter/union/stream protokolü değişirse.

### TEST-03.04 — Aynı adlı kaynaklarla bağımsız iki küme

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Aynı adlı kaynaklarla bağımsız iki küme; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-03.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-03.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-03.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-03.05 — Aynı kümede farklı yetkili iki bağlantı

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Aynı kümede farklı yetkili iki bağlantı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: candidate04 binary08bd0cee…; backend runtime4ec ile aynı, normalUI değil
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T12:16:09.392290+00:00
- Bitiş zamanı: 2026-11-11T12:16:26.270747+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.05-S1 — Hazırlık
- [x] OwnedA2clusterUID ve02/04namespaceUID/label; ayrı04privateSAconfig, tokenexpiration>2dk;02ve04binarySHA eşleşmesi.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-isolation04/run.json

#### TEST-03.05-S2 — Normal kullanım / pozitif kontrol
- [x] Reader kendi gerçekPodlarını okudu; adminA scale/restart gerçekReady replacementUIDs ve Bspec/PodUID değişmezliğiyle geçti.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-isolation04/run.log
- Sonuç:5altcasePASS; gerçekK8s1.35.1.

#### TEST-03.05-S3 — Negatif / sınır / arıza kontrolü
- [x] Readerclusteridentity403, dryruncreate403+GET404; outsideNSlogs/metrics/flows403; yanlışlogUID409; reader isteğinde admincontext409.
- Gözlenen: readerconfidenceunknown, clusterUIDboş; başka bağlantı/grant ödünç alınmadı.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-isolation04/run.log
- Sonuç: bu ikiidentity/scope için izolasyonPASS.

#### TEST-03.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: bu gerçekrestrictionkoşusunda yeni ürün hatası bulunmadı.
- Scope: Secretbody/Hubblefullflow/activecachecredentialrevoke bu fazda test edilmedi.

#### TEST-03.05-S5 — Tekrar test ve regresyon
- [ ] İlk ürünhatasi retest: NOT_APPLICABLE; yeni hata yok.
- [x] PozitifownPod/adminişlemleri, negatifreader ve Bunchangedreadback birlikte geçti.

#### TEST-03.05-S6 — Temizlik ve inceleme
- [x] ExactUID DeploymentGET404/auditLIST0; normal02fixtures ve04SA/profile manuel teslim için korunur.
- [x] UID/binary/timestampreceiptler eşleşir.
- [x] Root kaynak/rapor/fingerprintvecleanupJSONunu inceledi.
- Kalan sınırlar: actualreaderUI, bütünGVR/cache/Secret/flow içerikleri ve finalarchive ayrı kapılar.

#### TEST-03.05-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: aynıclusterde farklıyetkili iki gerçek bağlantı bu API/UID/grantnegatifleriyle ayrıldı.
- Yeniden test: broker credential/cache/scope/typedrouteguarddeğişirse.

### TEST-03.06 — Cluster/Node UID ile ortak Node gösterimi

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Cluster/Node UID ile ortak Node gösterimi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-03.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-03.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-03.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-03.07 — Ortak kaynak/kapasite dedup

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Ortak kaynak/kapasite dedup; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-03.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-03.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-03.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-03.08 — Liman silmenin yalnız uygulama kaydını silmesi

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Liman silmenin yalnız uygulama kaydını silmesi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7; binary1003a43a6a80…; API/watch kanıtı, final paket değil
- Ortam / kullanılan kimlik ve yetki: Owned A2/02; ayrı19849 private QA data-dir, boş workspace; sentetik kayıtlar, explicit private admin
- Başlangıç zamanı: 2026-11-11T11:50:36.482705+00:00
- Bitiş zamanı: 2026-11-11T11:50:43.715887+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.08-S1 — Hazırlık
- [x] Ayrı private QA app/session receipt, binary SHA, cluster/namespace UID ve başlangıç boş kayıt doğrulandı.
- İlk deneme: receipt eksikken guard FAIL; artifacts/release-audit/ra-20261111/real-api-records/run.log korunur.
- Sonuç: tekrarın hazırlığı PASS.

#### TEST-03.08-S2 — Normal kullanım / pozitif kontrol
- [x] Native create/rename/export/import/bind ve exact ID remove çalıştı.
- Gözlenen: UID/context bağları doğru; gerçek02 canary okunabiliyor.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-records-retest/run.log
- Sonuç:5/5alt kontrol PASS.

#### TEST-03.08-S3 — Negatif / sınır / arıza kontrolü
- [x] Export context/bound taşımadı; import yeni connection/harbor ID verdi. Unbound read/enable409; açık bind sonrası readonly action403.
- Gözlenen: iki namespace Deployment/Pod tam fingerprint’i aynı; yalnız uygulama kayıtları kaldırıldı.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-records-retest/workspace-real-workspace-record-acceptance-qa-ws-3527b7e6872d4915.json
- Sonuç: PASS; Secret içerikleri okunmadı.

#### TEST-03.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: ilk helper çağrısında eksik receipt; ürün hatası değil.
- Düzeltme: doğru ayrı app+private receipt hazırlığı; runtime değişmedi.

#### TEST-03.08-S5 — Tekrar test ve regresyon
- [x] Güvenli hazırlık düzeltilerek aynı native kayıt testinin5alt kontrolü geçti.
- [x] Normal okuma/bind ve readonly red/readback kontrolü korundu.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-records-retest/run.log

#### TEST-03.08-S6 — Temizlik ve inceleme
- [x] Yalnız QA record exactID’leri kaldırıldı; default02workspace ve K8s fingerprint aynı.
- [x] Binary/source receipts eşleştirildi.
- [x] Root helper/kaynak/sonuç/cleanup kayıtlarını okudu.
- Kalan sınırlar: UI remove/export/import ve restart/migration TEST03.09’da açık.

#### TEST-03.08-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: native API liman kaldırma Kubernetes Deployment/Pod içeriğini değiştirmedi; yetki bind sınırı geçti.
- Yeniden test: workspace store/remove/import veya authority bağlama değişirse.

### TEST-03.09 — Restart/migration/export/import/bozuk config recovery

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Restart/migration/export/import/bozuk config recovery; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.09-S1 — Hazırlık
- [x] İlk eksik-receipt guard FAIL korundu; ayrı private QA app/receipt hazırlanarak tekrarlandı.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-records/run.log ve artifacts/release-audit/ra-20261111/real-api-records-retest/run.json

#### TEST-03.09-S2 — Normal kullanım / pozitif kontrol
- [x] Native API rename/export/import/unbound409/bind/readonly403/remove5kontrol geçti.
- Gözlenen: metadata/connection kimlikleri doğru; iki namespace workload fingerprint’i değişmedi.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-records-retest/run.log

#### TEST-03.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Disk restart, schema migration ve bozuk config recovery henüz çalışmadı.
- Sonuç: faz açık; import alt testi bunların yerine geçmez.

#### TEST-03.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-03.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-03.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-03.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-03.10 — 50 A→B→A selection/form/log/request geçişi

- Kategori: CAT-03.
- Amaç / kullanıcı riski: 50 A→B→A selection/form/log/request geçişi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7+candidate04 hashli App/label farkı; binary08bd0cee5a5d…; finalpaket değil
- Ortam / kullanılan kimlik ve yetki: Chromium156/Metal1440×900DPR1; owned02 gerçekK8s1.35.1 A2; scoped UI management intent; create taslakları SUBMIT EDİLMEDİ
- Başlangıç zamanı: 2026-11-11T12:02:39.699Z
- Bitiş zamanı: 2026-11-11T12:05:05.415Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.10-S1 — Hazırlık
- [x] Önceki WS-001 foreign lease düzeltmesi4ec526b7push/CI SUCCESS. Owned02 gerçek UID fixtureları ve scoped app hazır.
- Yapılan: aynı normal UI helper’a sonlu50cycle, scoped log request/close ve per-harbor draft kontrolleri eklendi.
- Sonuç: helper hazırlığı tamam; yürütme henüz başlamadı.
- Güvenlik bütçesi:150..900sn tavan,2 gerçek Pod, hiçbir create submit yok; draftlar yalnız tarayıcı belleği.

#### TEST-03.10-S2 — Normal kullanım / pozitif kontrol
- [x]50A→B→A gerçek UI cycle ve100zorunlu log açılışı; fixturePodUID/namespace/harbor doğrulandı.
- [x]6checkpointte açıkdirtyAform→Bform→Arestore; taslak/namespace doğruharborda, ikisi de kendi discard akışıyla kapandı.
- Gözlenen:56kontrol,0pageerror/0workspaceDenial; Canvas instance aynı.
- Kanıt: artifacts/release-audit/ra-20261111/ui04-cycles50/result.json ve ui04-cycles50/after-cycles.png

#### TEST-03.10-S3 — Negatif / sınır / arıza kontrolü
- [x] Normal UI A/B switch sırasında yanlışharborId + eskiPodUID/namespace log isteği yeniden üretildi.
- Gözlenen:2invalid request; her stream kapandı. Backend scope guardı ayrı testlerde reddediyor; bu UI capture ilkkoşuda HTTPstatus saklamadı, istek abort edilmiş olabilir. Veri sızıntısı kanıtı yok.
- Kanıt: artifacts/release-audit/ra-20261111/ui03-cycles-preflight-capture/result.json
- Sonuç: FAIL;50uzun koşusuna geçmeden düzeltme gerekir.

#### TEST-03.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: WS-002, P1.
- Kök neden: App eski selection/panel state’ini yeni API ile source-switch renderında çocuk bileşene verdi; layout restoration sonrası düzelmesi o renderın passive log effect’ini önlemiyor.
- Değişen: App.jsx resource/facility panel renderı captured selectedSource===sourceKey ile korunur.
- Düzeltme: çalışma farkı; JSX guard dışı mimari değişmedi.
- Kanıt: transient-panel-red.log gerçek ara renderı FAIL; transient-panel-retest.log PASS.

#### TEST-03.10-S5 — Tekrar test ve regresyon
- [x] İlk transientpanel unit FAIL→App guard→11hedeflitest/226tamfrontendtest PASS.
- [x] Gerçek1cycle tekrar ve50cycle kabulü PASS;299log requestinin0yanlışkimlik,299u kapalı.100HTTP200opening,199request responseöncesiabort; tümü başarılıstream sayılmaz.
- [x]5çiftkonumlu merkez/finder akışı önceki gerçek UI testinde korundu; yeni WebKit/phone regresyonu ayrıca kaydediliyor.
- Sonuç: WS-002dar gerçek geçiş hatası kapalı; performans veya60dk/gerçekproviderkanıtı değildir.

#### TEST-03.10-S6 — Temizlik ve inceleme
- [x] Unsentsafe taslaklar normaldiscard ile bırakıldı; gerçekK8screate/delete yapılmadı.
- [x]299/299log request bitti/abort;0açık.
- [x] Root sonuçJSON ve finalPNG açıp inceledi; raw başlangıçFAILkorunur.
- Kalan sınırlar: nativeSafari, gerçekcredentialrotasyon/crosscluster, finalarchive ve60dk ayrı faz.

#### TEST-03.10-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: bu iki gerçek namespace/harbor için50A→B→A selection/log/request ve güvenlidraft izolasyonu geçti.
- Yeniden test: App source/panel/renderguard, log API/session veya harbor cache davranışı değişirse.

### TEST-03.11 — Çok tarayıcı sekmesinde scope/write-grant

- Kategori: CAT-03.
- Amaç / kullanıcı riski: Çok tarayıcı sekmesinde scope/write-grant; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V8.3.1/V8.3.2; API1/API3:2023; CAT03. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-03.11-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.11-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.11-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-03.11-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-03.11-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-03.11-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-03.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-04 — Gerçek Kubernetes işlemleri

### TEST-04.01 — Bağlantı/context/namespace seçimi

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Bağlantı/context/namespace seçimi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.02 — Deployment server dry-run

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Deployment server dry-run; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.03 — Deployment gerçek create ve owner/Ready

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Deployment gerçek create ve owner/Ready; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: candidate02-binary.json;1003a43a…7bf0;backend49999815
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T14:27:01.564220+03:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.03-S2 — Normal kullanım / pozitif kontrol
- [x] GerçekAPI create→watchADD→Deployment/RS/PodownerUID→Ready çalıştı.
- Gözlenen:Deploymentb12f7c52…ddaf,RS3399e209…a9d9,Pod76b84d74…6531,Nodebf794757…cabf.
- Kanıt: real-api-smoke/run.log ve gerçeksonuçJSON.
- Sonuç: API/watchaltakışıPASS;normalUIformcreatevefailure/recoverykabulüayrıbekliyor.

#### TEST-04.03-S3 — Negatif / sınır / arıza kontrolü
- [x] Readonly403,serverdryrunpersistGET404,yanlışnamespaceGET/create403 kontrolleri geçti.
- Gözlenen:5gerçekaltsenaryoPASS;0skip;cleanupownUIDGET404+auditedDeploy/RS/Podlist0.
- Kanıt: real-api-smoke/run.log/sonuçJSON.
- Sonuç: buAPInegatiflerigerçeklabdaPASS;yetki/quota/admissiongenelini kapatmaz.

#### TEST-04.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.04 — Scale 2→3→1

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Scale 2→3→1; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER; root kodinceleme
- Kaynak / build / paket kimliği: Current helper SHA92637b06e8bcec63e8be979123d14f075ce0f17c68c75441f989765b4266d0cc, önce/sonra eşit; sourceHEAD9e87141b + sonraki yalnız audit/test checkpoint'leri. Ürün handler'ı değişmedi.
- Ortam / kullanılan kimlik ve yetki: Owned06 actual Kubernetes1.35.1, exact cluster/marker/namespace/worker UID; ayrı loopback gateway59914 + gerçek session/grant/SSAR. AC mevcut, battery21→24%.
- Başlangıç zamanı: 2026-11-11T16:09:18.858977Z
- Bitiş zamanı: real-scale-current-helper-worker/manifest.json kesin UTC; actual8.66092525sn/outer16.234sn; toplam430.130sn/540sn sınırı.
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.04-S1 — Hazırlık
- [x] Kube-systemUID e84bb50e…, namespaceUID863e13d5…, markerUID/owner ve gerçekworkerUID guardları geçti. MevcutHTTPserver/trafficfixtureUID/spec/PodUID snapshotları alındı.
- [ ] İzoleworkspacekurulamadı; gatewaylistener/writegrant/create/scale henüzulaşılmadı.
- Kanıt: artifacts/release-audit/ra-20261111/real-scale-worker/result.json; command.json; source-before.json

- Yeni current-helper regresyonu başladı: offline lab/system/marker/namespace/worker/iki container ve CLI/helper SHA guard'ları PASS; AC21%, disk453.5GiB. Actual Docker ID/name/creation/owner etiketleri de doğrulandı; yalnız mevcut owned cluster resume seçildi, install/upgrade/yeni Node yok.
- Live API/Ready ve gerçek Scale sonucu henüz yok. Kanıt: real-scale-current-helper-worker/offline-preflight.json; ilk guard mesajları root tarafından incelendi.

#### TEST-04.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili2→3→1scalehenüzçalışmadı.
- Gözlenen: ConfigureWorkspace(t.TempDir(),...) hata verdi; hata içeriği güvenlikamacıyla loglanmadığından tamneden doğrudankanıtlıdeğil.
- Sonuç: kurulumGoTestFAIL; gerçekscaleNOTRUN.

- [x] Düzeltilmiş fixture ile realretestPASS: aynıDeploymentUIDf4754930… için2→3→1Ready/current/updated/available/desired; generation/observedGeneration1→2→3.
- [x] HerReadyPod→ReplicaSetUID→DeploymentUIDownerchain ve gerçeknodeName; atmost3ownedPod. TypedGETReady/speckanıtı, dynamicGETGVK/UIDcrosscheck (dynamicReadyölçümüiddiasıyok).
- ProdHTTPsession+scopedgrant+deployments/scaleSSAR+scale-subresource gerçekKubernetesAPI kullandı. API202tekbaşınabaşarısayılmadı.
- Kanıt: artifacts/release-audit/ra-20261111/real-scale-retest-worker/REPORT.md; result.json; timeline.json

- [x] Current helper üzerinde tek gerçek Scale2→3→1: aynı Deployment UIDaecaaf08-ae77-422c-841f-8ffac74e25f4, generation/observed1→2→3. Typed desired/current/Ready/updated/available ve her Ready Pod→RS→Deployment owner UID zinciri doğrulandı; dinamik GET GVK/UID eşleşti.
- HTTP202 tek başına başarı sayılmadı; gerçek controller convergence gözlendi.

#### TEST-04.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] StaleUID/RV409vepozitifscale kontrolleriçalışmadı.
- Guardsonrasıda hiçbirKubernetesmutation/listener/grant yok; ilkFAILsilinmedi.
- Bounded:0.045sGo/10.620souter; maxoutergaps0.256s, performanskanıtıdeğil.

- [x] Retestreadonlycreate403+wrongUIDscale409+staleRVscale409; ardındanyetkiliscaleaccepted+realReady.
- [x] Grace5s/UID+RVForegroundDelete; typedveDynamicGET404, Pod/RSrunlabelLIST0. DiğerHTTPserver/trafficUID/specSHA/PodUIDlericleanupsonrasıdaeşit.
- [x] Gap0.256344s, bounded9.438s; CPU/FPSkanıtıdeğil.

- [x] Readonlycreate403, yanlışUID409, eski resourceVersion409 tekrar geçti. Scale strict max3 Pod korundu; Resources modu çalıştırılmadı ve helper değiştirilmedi.

#### TEST-04.04-S4 — Bulgular ve düzeltme
- Bulgu: testfixturekurulumu; ürünscalehatası kanıtlanmadı.
- Kaynakdesteklilead: installedGoT.TempDir child0777(umask), ws.Openprivate0700zorunlu; eskihelperyenichildfilepath.Join kullanıyor. Gerçekmode/errorhenüzkaydedilmedi.
- Rootdüzeltmeyolu: privateapp-datachild, safetyguardgevşetmeyok; fixturehedeflemeNodehostnamevarsayımıyerinerequiredmetadata.nameaffinity.

- Kök neden doğrulandı: actualT.TempDir0755; ws.Open sabithata workspace_directory_not_private_0700. Yeniapp-datachild0700kabul. Productguarddeğişmedi.
- Helpermetadata.nameRequiredAffinityilehostnamevarsayımınıkaldırır. İlkmutationdanönceowner/name/runlabelplanıtimeline dosyasınaatomicflush; kontrollücleanupcreateöncekayıtlı.

#### TEST-04.04-S5 — Tekrar test ve regresyon
- [x] İlksetupFAILüretilenmode/error doğrulandı, privatechildfixtureile1retestPASS. İlk12failedartifact/sourcesnapshotkorunur.
- [x] Pozitif2→3→1+ownerchain/currentconditionsve komşureadonly/UID/RVredleri birliktegeçti.
- [x] Exactcleanup/sonfixtureeşitliği, kaynakdurumu veboundedtime kaydedildi.
- Sınır: normalUI/aktifapp/restrictedRBAC/relay bu testin kabulüdeğil.

- Ortak helper Resources testi için çıkarıldı/ayrık exact opt-in eklendi. 46ec5508 gerçek scalePASS tarihsel olarak korunur; yeni helper kaynağı için bir Scale regresyonu gereklidir. Ürün scale handler'ı değişmedi, eski kanıt silinmedi.

- [x] Ortak helper değişikliğinden doğan güncel Scale regresyonu bu ayrı real run ile geçti. Eski46ec5508 PASS kendi kaynağında kalır; yeni koşu aynı helperSHA ile önce/sonra doğrulandı.
- İlk offline/Docker UID guard ve exact mevcut-node resume105.723sn; test örnekleme gap0.256054/0.288sn, güç kesintisi yok. Bunlar performans/CPU ölçümü değildir.

#### TEST-04.04-S6 — Temizlik ve inceleme
- [x] Yalnızrunlabel+UID/RVileownDeploymentdelete; Pod/RS0, ikiGET404. MevcutfixturehashesvePodUIDleraynı. Gateway/transport/ServerClose döndü, WebSocket açılmadı.
- [x]22checksumrootyenidenokuyupdoğruladı; roothelperdiff+cleanupkodunuinceledi. Aynıajansistemi, profesyonelüçüncüparti değil.
- Kanıt: real-scale-retest-worker/SHA256SUMS; source-comparison; first-failure-preservation.
- Kalan: görselUIscale/animasyon/finalpaket ayrıca; bunlarAPIphasebaşarısıylakapanmaz.

- [x] UID/RV deletion sonrası typed+dynamic404 ve runlabel Pod/RS LIST0; mevcut server/traffic UID/spec/PodUID eşitliği tüm aşamalarda ve cleanup sonrası korundu. Gateway/transport kapandı.
- [x] Root rapor/current helper source ve21checksum doğruladı. İki original owned node containerı sonraki iş için sıcak; app/host relay kayıtları boş, trafik başlamadı. Bu minikube.4 yeni worker provisioning kabulü değildir.

#### TEST-04.04-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI — current helper ile tek gerçek2→3→1 controller/Ready/owner/negatif/cleanup regresyonu geçti. Başarısız ilk setup ve önceki kaynak PASS kayıtları silinmedi.
- UI/animasyon, restricted kimlik, yeni worker provisioning, final bütün sürüm/performance kapsamına taşınmadı. İlgili helper/scale handler/resource identity sözleşmesi değişirse retest gerekir.

### TEST-04.05 — CPU/RAM request/limit edit

- Kategori: CAT-04.
- Amaç / kullanıcı riski: CPU/RAM request/limit edit; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER; root ikinci inceleme
- Kaynak / build / paket kimliği: 96adbf60 + yalnız opt-in test helper farkı; SHA256 92637b06e8bcec63e8be979123d14f075ce0f17c68c75441f989765b4266d0cc. Ürün resource handler'ı değişmedi.
- Ortam / kullanılan kimlik ve yetki: Owned06 cluster/ns/marker/worker UID guard; ayrı loopback gateway57551, gerçek Kubernetes1.35.1 ve private admin test kimliği. UI ve final dağıtım paketi testi değildir.
- Başlangıç zamanı: real-resources-worker/result.json
- Bitiş zamanı: 2026-11-11T16:43:43.962612Z; actual9.38810275sn, outer19.294sn, en büyük örnekleme aralığı0.279sn.
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.05-S1 — Hazırlık
- [x] Cluster/namespace/marker/worker ve mevcut fixture kimlikleri guard ile doğrulandı; private0700 workspace ve durable mutation planı kullanıldı.
- Yalnız1Deployment/2replica/Recreate/grace5; actual image busybox1.37.0, metadata.name required affinity.

#### TEST-04.05-S2 — Normal kullanım / pozitif kontrol
- [x] İlk2Ready/owner UID chain geçti; gerçek UI ile aynı /api/actions containers{name,resources} modeli kullanıldı.
- [ ] HTTP202 sonrası yeni2Ready ve dört quantity/PodUID doğrulaması tamamlanmadı; API kabulü başarı sayılmadı.

- [x] Yeni sonlu retest: aynı Deployment UID, generation/observedGeneration1→2 ve final2Ready/current/updated/available doğrulandı. Template ve iki yeni gerçek Pod üzerinde requests10m/16Mi, limits100m/64Mi quantity karşılaştırması geçti; her iki Pod UID değişti, owner zincirleri ve ilgisiz spec alanları korundu.
- Kanıt: artifacts/release-audit/ra-20261111/real-resources-retest-worker/manifest.json ve result.json. Önceki HTTP202-only başarısız sonuç tarihsel olarak yukarıda korunur.

#### TEST-04.05-S3 — Negatif / sınır / arıza kontrolü
- [x] Geçersiz quantity422 ve request>limit422; template hash/generation/PodUIDler değişmedi. Readonlycreate403 de geçti.
- Pozitif rollout sırasında >3 API Pod nesnesi görüldü ve guard testi durdurdu. Exact sayı/phase/deletionTimestamp tutulmadı; cause henüz kanıtlı değil.

- [x] Retest invalid quantity422/request>limit422 ve read-only403 negatiflerini yeniden geçti. Dokuz saf guard case'i geçti; Scale max3 sınırı korundu.
- Bu koşuda4API nesnesi gerçekten gözlendi: tam iki eski UID, Succeeded+deletionTimestamp+eski RS; iki yeni Pending UID, doğrulanmış yeni RS. Yalnız bu açık sınıflama ve en fazla2aktif/4toplam/300m/192Mi declared-limit güvenlik bütçesi kabul edildi. Bunlar gerçek CPU/RAM kullanımı değildir.

#### TEST-04.05-S4 — Bulgular ve düzeltme
- Ürün resource bug kanıtı yok; controller geçici nesne örtüşmesi olasılığı incelenecek. Guard veya kabul ölçütü geçmek için sessizce artırılmadı.
- Kaynak referansı K8s1.35.1 recreate.go oldPodsRunning, terminal Pod nesnelerini saymaz; bu olası açıklamadır, bu koşuda gözlenmiş gerçek değildir.
- Test fixture ve kapsama sınırı ayrı tutulur.

- Kök neden sınırı: ilk başarısız koşu phase/deletion metadata kaydetmediği için onun kesin nedeni kanıtlanmadı. Yeni koşuda Recreate terminal-eski kayıt örtüşmesi doğrudan gözlendi. Test fixture guard'ı bu doğrulanmış yaşam döngüsünü sınıflandırır; ürün davranışı veya kabul kalite eşiği gevşetilmedi.
- Değişen dosya: backend/pkg/server/release_operations_real_test.go. Pinli Kubernetes1.35.1 controller kaynak referansı ve ilk yerel URLError kaydı korunur.

#### TEST-04.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorun için yeni retest yok. Kaynak ve rawFAIL korunur.
- Yeni kontrol, gerekirse exact eski/yeni UID + phase/termination/owner ve en çok2aktif/4API nesnesi koşulunu açık güvenlik planıyla sınayacak; bilinmeyen artış yine reddedilecek.

- [x] Bir kontrollü gerçek Resources retesti ve9saf guard case'i PASS. Otomatik tekrar yok; geçersiz/wrong UID-owner/4aktif/5toplam senaryoları reddedildi.
- Ortak helper değiştiği için TEST04.04 Scale gerçek regresyonu RETEST_REQUIRED kalır. Geçmiş Scale PASS güncel kaynakta geçmiş sayılmadı.

#### TEST-04.05-S6 — Temizlik ve inceleme
- [x] UID/RV foreground delete, typed/dynamic404, Pod/RS runlabel LIST0; diğer fixture UID/spec/PodUIDler eşit.
- [x] Source helper/snapshot ve20artifact/19checksum worker tarafından doğrulandı. Root raporu okudu; normalUI/metrics/actualresources gate kapanmadı.

- [x] UID/RV delete; typed+dynamic GET404; runlabel Pod/RS LIST0 ve önceki fixture UID/spec/PodUID eşitliği tekrar geçti. Gateway/transport kapandı.
- [x] Root rapor, kaynak farkı, trace ve19checksum/20dosyayı doğruladı. Bu ikinci ajan incelemesidir, bağımsız profesyonel pentest değildir. Sonradan root yalnız owned lab/app süreçlerini durdurdu; private state/profiller korunur.

#### TEST-04.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: positive rollout >3Pod guardında FAIL; final spec/readiness doğrulanmadı. Negatifler ve cleanup ayrı PASS.
- Sonraki test önce overflow yaşam döngüsünü sınıflandırmalı; kör tekrar yok.

- [x] BİTTİ / DOĞRULANDI — scoped gerçek Kubernetes CPU/RAM template değişikliği, gözlenen rollout, negatifler ve cleanup geçti. İlk FAIL silinmedi.
- Normal UI, bütün owner türleri, utilization/metrics, native platform ve final paket bu dar fazın kanıtı değildir; kendi fazları açık. Ortak helper/handler/owner/quantity davranışı değişirse gereken retest yapılır.

### TEST-04.06 — Rollout restart ve gözlenen sonuç

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Rollout restart ve gözlenen sonuç; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.07 — Pod DELETE/controller replacement

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Pod DELETE/controller replacement; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.08 — Deployment DELETE

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Deployment DELETE; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.09 — StatefulSet işlemleri

- Kategori: CAT-04.
- Amaç / kullanıcı riski: StatefulSet işlemleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.10 — DaemonSet işlemleri

- Kategori: CAT-04.
- Amaç / kullanıcı riski: DaemonSet işlemleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.11 — Finalizer/Terminating/aynı ad-yeni UID

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Finalizer/Terminating/aynı ad-yeni UID; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.11-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.11-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.11-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.11-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.11-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.11-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.12 — CronJob işlemleri

- Kategori: CAT-04.
- Amaç / kullanıcı riski: CronJob işlemleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.12-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.12-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.12-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.12-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.12-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.12-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.12-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.13 — Rollback işlemi

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Rollback işlemi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.13-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.13-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.13-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.13-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.13-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.13-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.13-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.14 — Drain ve PDB

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Drain ve PDB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.14-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.14-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.14-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.14-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.14-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.14-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.14-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.15 — Pod resize capability ve uygulanmış sonuç

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Pod resize capability ve uygulanmış sonuç; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.15-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.15-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.15-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.15-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.15-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.15-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.15-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.16 — RBAC/quota/admission/conflict/timeout/image negatifleri

- Kategori: CAT-04.
- Amaç / kullanıcı riski: RBAC/quota/admission/conflict/timeout/image negatifleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.16-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.16-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.16-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.16-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.16-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.16-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.16-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.17 — Reconnect kaçırılmış DELETE/kapsam uzlaştırması

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Reconnect kaçırılmış DELETE/kapsam uzlaştırması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.17-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.17-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.17-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.17-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.17-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.17-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.17-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.18 — Çift submit/retry ve hedef değişmezliği

- Kategori: CAT-04.
- Amaç / kullanıcı riski: Çift submit/retry ve hedef değişmezliği; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.3.1; API5:2023; CAT04 gerçek işlem. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.18-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.18-S2 — Normal kullanım / pozitif kontrol
- [x] Gerçek eşzamanlı çift scale: accepted1/conflict1; tek generation artışı.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-operations/run.log
- Sonuç: dar pozitif/duplicate PASS.

#### TEST-04.18-S3 — Negatif / sınır / arıza kontrolü
- [ ] Gerçek timeout/cancel ve bilinmeyen sonuç retry sınırı henüz çalışmadı.
- Yapılan: yalnız bilinen200 yanıtı sentetik transportta gizlenip readback/no-retry doğrulandı; gerçek timeout diye raporlanmaz.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-operations/run.log
- Sonuç: kısmi; faz açık.

#### TEST-04.18-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.18-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.18-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.18-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-05 — Log/metrics/Secret

### TEST-05.01 — Current/previous app/init/ephemeral log

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Current/previous app/init/ephemeral log; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.02 — Pause/resume/double-open/close cleanup

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Pause/resume/double-open/close cleanup; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.03 — Eski UID ve aynı-ad log replacement yarışı

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Eski UID ve aynı-ad log replacement yarışı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.04 — Log satır/byte/partial/flush sınırları

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Log satır/byte/partial/flush sınırları; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.05 — Metrics dolu/yok/403/stale

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Metrics dolu/yok/403/stale; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.06 — Usage/request/limit/allocatable ayrımı

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Usage/request/limit/allocatable ayrımı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.07 — Secret reveal/hide/edit yetkisi

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Secret reveal/hide/edit yetkisi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: release_backend_resume uygulama testi; release_provider_resume ikinci inceleme; root görsel/SHA/verdict
- Kaynak / build / paket kimliği: Actualapp5f1c22…/runtimef32; embeddedUI0e478…; helper79d3…/source manifests. RealAPI correctedtest9ac2… ve frontendUNIT ayrı.
- Ortam / kullanılan kimlik ve yetki: macOS27/M5, headedChromium actualMetal,1440×900; ownedK8s1.35.1/UIDe84bb50e…/sealednamespace56a3bd1d…; yalnızsyntheticSecret/adminUI;2restrictedSA API ayrı
- Başlangıç zamanı: 2026-11-12T10:47:32.753407+00:00
- Bitiş zamanı: 2026-11-12T12:25:09.296852+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.07-S1 — Hazırlık
- [x] Freshroot-ownednamespace UID/owner/seal, staticverifiedTLS/privateconfig, livecluster+marker UID veactualapp/embeddedUIhash hazırlandı.
- Sadece generatedSecret; normalUI fixture/app/browser sınırları120+45sn, screenshotmaximum4; rawvalue/cookie/nonce/response/HAR/video kaydı yok.
- İlkmetadataList-null controllerreddi UI başlamadan oluştu;11dosya/ilk513.188/480sapkayıt ayrı korunur, API403sanılmadı.

#### TEST-05.07-S2 — Normal kullanım / pozitif kontrol
- [x] Normalfinder exactSecretUID/namespace açtı; yetkili değer açma→gizleme gerçekAPI/privateDOMbooleans ile geçti. Açıkdeğer screenshotı0.
- [x] Yönetimniyetiöncesi editdisabled, normalgrant→Gizliiçeriğidüzenle→YAML→Serverdryrun→Uygula, normalclose/samecanvas geçti.
- [x] AynıUIkabulRV31778=gerçekcanonicalRV31778; UID/data/type/oldmetadataeşitliği ve yeni2metadataalanı doğrulandı.

#### TEST-05.07-S3 — Negatif / sınır / arıza kontrolü
- [x] GerçekAPIikiTokenRequestSA: list-onlyreveal403/update403 veget-onlylist403/update403; izinliyolayrı200. Browseröncesi grantolmayanwrite403 ve UIeditdisabled ayrıkontrollerdir.
- [x] Bulk/named/error responseNoLeak gerçekAPIgrubunda; maskguard422 ayrı05.09. RestrictedSA browsergirişleri/admissionfuzz bu darfazda çalıştırılmadı, genelkabuliddiasıyok.

#### TEST-05.07-S4 — Bulgular ve düzeltme
- Ürünhatası bu kapsamda tespitedilmedi. İlkUIcontrolleritems[] beklentisi, HTTP200/POMList/itemsnullcount0 ileuyumsuzdu; yalnızfixture-normalizasyonudüzeltildi.
- İlkAPIgrubunun typedGETbodyTypeMeta400olasılığı eskiFAILolarakkorundu; kesinilkpayloadkanıtıyok, düzeltilmişfixtureikirestricted403 verdi. Runtimeürünkodu değişmedi.

#### TEST-05.07-S5 — Tekrar test ve regresyon
- [x] TeknormalUIretsti8checkPASS; actualheadedMetal ve4maskedscreenshot root/worker tarafından incelendi.
- [x] AyrırealAPIauthorization/data+frontend3UNIT kanıtlarıyla sourcewiring eşleştirildi; unitlerUIE2Esayılmadı.
- [x] İkinciinceleme normalUI vecanonicalroundtrip darPASS sonucunu destekliyor.
- Kanıt: secret-purpose-ui-retest-worker/REPORT.md; secret-purpose-ui-second-review-worker/REPORT.md; secret-purpose-real-retest-worker/REPORT.md (hepsi artifacts/release-audit/ra-20261112/).

#### TEST-05.07-S6 — Temizlik ve inceleme
- [x] Secret exactUID/RV delete veGET404; appPID/birth/PGID/browser kapandı,19843free,privateControlAbsent bağımsızsonkontrolde doğrulandı. Namespace root sahipliğinde sonrakiQA için korunur; manuel01–07 profilleri silinmedi.
- [x] Root20UI/7reviewchecksum vehelperhash eşleştirdi;4maskedscreenshot açıldı. Dörtgitleaks bulgusu gerçek sourceSHA recomputation ile doğrulandı; credentialdeğil, rawscanner raporu korunur.
- [x] Ayrıworker dar kaynağı/kanıtı inceledi; aynıajan sistemi profesyonelüçüncütarafpentest değildir.
- Açık süreçplanı sapmaları: UIworkerfull260.642/240sn,review198.154/180sn; successful activebrowser5.337/controller+cleanup5.898s,120/45safetybounds geçilmedi. Rapor hedefleri PASS sayılmaz; ürünlatencySLOölçülmedi.
- Heapsecureerase/physicalFPS/geneladmission/CPUbudgets bu faza dahil değildir.

#### TEST-05.07-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI — Secret reveal/hide/purposeedit işlevi ve ilgili gerçekAPIyetkisi/data/cleanup kapsamı.
- TamLLMiş/raporlama sürehedefleri başarısız kaldı ve üsttekisüreçsapmasıkaydında açıktır; bu kapatma onlarıPASSyapmaz. AktifUIload/cleanup safetybounds içinde tamamlandı.
- UI/sanitize/auth/Secretpayloadscope/handlerdeğişirse retest gerekir; admission/heap/perf/diğerRBAC/finalpaketkapıları kapanmaz.

### TEST-05.08 — Bilinmeyen label/annotation edit korunumu

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Bilinmeyen label/annotation edit korunumu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: release_backend_resume uygulama testi; release_provider_resume ikinci inceleme; root görsel/SHA/verdict
- Kaynak / build / paket kimliği: Actualapp5f1c22…/runtimef32; embeddedUI0e478…; helper79d3…/source manifests. RealAPI correctedtest9ac2… ve frontendUNIT ayrı.
- Ortam / kullanılan kimlik ve yetki: macOS27/M5, headedChromium actualMetal,1440×900; ownedK8s1.35.1/UIDe84bb50e…/sealednamespace56a3bd1d…; yalnızsyntheticSecret/adminUI;2restrictedSA API ayrı
- Başlangıç zamanı: 2026-11-12T10:47:32.753507+00:00
- Bitiş zamanı: 2026-11-12T12:25:09.296852+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.08-S1 — Hazırlık
- [x] Root-seal namespace ve yalnızgeneratedSecret unknownlabels/annotations/data/typefixture; başlangıçUID/RV/datahash/scope kimliği hazırlandı.
- RealAPI+frontendhelperUNIT+normalUI üçayrıkanıt katmanı olarak ayrıldı.

#### TEST-05.08-S2 — Normal kullanım / pozitif kontrol
- [x] YetkilipurposeYAML formu iki metadataalanı ekledi; gerçekcanonicalreadback eskiunknownlabel/annotation, data/type/UIDyi korudu. KabulRV31778=storeRV31778.
- [x] Frontendhelpertesti authorizeddraft unknownmetadata/annotationskorunumunu ve operationsanitizeın özgündraftıdeğiştirmediğini doğruladı.

#### TEST-05.08-S3 — Negatif / sınır / arıza kontrolü
- [x] Grantöncesi write403 veiki farklıgerçekrestrictedidentity update403, UID/RV/data/metahash unchanged. Metadata-onlyliste/sonuç annotations/value taşımaz; bu gizleme localauthorizeddraft metadata kaybı değildir.
- [x] MaskeliPUT422/unchanged ayrı05.09; normalhideDOMdeğerinikaldırdı. HerAPIadmissionhatası/secureheaperase/genelgenericresourceformiddiası yok.

#### TEST-05.08-S4 — Bulgular ve düzeltme
- Unknownmetadata kaybı bu kaynakta yenidenüretilmedi; ürünbugfixyapılmışgibi sunulmadı.
- TestfixtureTypeMeta veempty-metadataListnullable düzeltmeleri iletarihselilkFAIL ayrıdosyalardakorundu. Ürünserializer/renderer değişmedi.

#### TEST-05.08-S5 — Tekrar test ve regresyon
- [x] Frontend3UNIT, gerçekAPIroundtrip/restrictednegatifler ve normalUI8checks ayrıkaynağıylaPASS.
- [x] Root4screenshotıaçtı; normalYAMLkontrolününkullanılması helpermock değil; routefulfill yok, gerçekappAPI/canonicalreadback eşleşti.
- [x] Ayrıworkerreview data/type/oldunknownmetadata eşitliğini veprivacylimitlerinidoğruladı.

#### TEST-05.08-S6 — Temizlik ve inceleme
- [x] Secret exactUID/RV delete veGET404; appPID/birth/PGID/browser kapandı,19843free,privateControlAbsent bağımsızsonkontrolde doğrulandı. Namespace root sahipliğinde sonrakiQA için korunur; manuel01–07 profilleri silinmedi.
- [x] Root20UI/7reviewchecksum vehelperhash eşleştirdi;4maskedscreenshot açıldı. Dörtgitleaks bulgusu gerçek sourceSHA recomputation ile doğrulandı; credentialdeğil, rawscanner raporu korunur.
- [x] Ayrıworker dar kaynağı/kanıtı inceledi; aynıajan sistemi profesyonelüçüncütarafpentest değildir.
- Açık süreçplanı sapmaları: UIworkerfull260.642/240sn,review198.154/180sn; successful activebrowser5.337/controller+cleanup5.898s,120/45safetybounds geçilmedi. Rapor hedefleri PASS sayılmaz; ürünlatencySLOölçülmedi.
- Heapsecureerase/physicalFPS/geneladmission/CPUbudgets bu faza dahil değildir.

#### TEST-05.08-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI — Secret purposeedit unknownmetadata/data korunumunun bu gerçekUI/API/unit kapsamı.
- Süreçraporhedefi aşımı yukarıda açık; CPU/latency/diğerGVR/genericadmission/finalpaket kabulü değildir.
- Secretmetadata merge/purposeeditor/sanitize/UIDscope/model değişirse retest gerekir.

### TEST-05.09 — Maskeli Secret gerçek veri olarak yazılmıyor

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Maskeli Secret gerçek veri olarak yazılmıyor; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: release_backend_resume gerçekSecrettekgrup; rootnamespace/Git/roadmap
- Kaynak / build / paket kimliği: Runtimef32byteaynı; correctedtest9ac2ded8…; rootreview/currenthandlerSHAveworker13hashkimliği artifacts altında
- Ortam / kullanılan kimlik ve yetki: Owned1.35.1lab, sealed56a3bd1d…namespace, yalnız birgeneratedSecret/2restrictedSA/RBAC; productionHTTPhandlers→actualTLSAPI
- Başlangıç zamanı: 2026-11-12T10:47:32.753510+00:00
- Bitiş zamanı: 2026-11-12T11:10:19.552717+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.09-S1 — Hazırlık
- [x] Rootownedcluster/systemmarker/nsUIDseal+metadata-onlyemptyinventory ve7fixtureUIDguardları hazırlandı.
- Sınır:1syntheticSecret,2SA/Role/Binding; gerçekSecret/tokenpublickanıtayazılmaz.
- İlkplan/FAILkaynağı ve correctedrunmanifestayrı; defaultsopt-inSKIP, gerçektestexplicitkoşuldu.

#### TEST-05.09-S2 — Normal kullanım / pozitif kontrol
- [x] AuthorizedpurposeReveal200/fullsyntheticdata ve normalmanagededit200+unknownmetadata/data/typeUIDpreservation doğrulandı.
- Yetkilinormalwriteaçıkken maskednegatifayrıkoşuldu, normalpathkapatarakbaşarıüretilmedi.

#### TEST-05.09-S3 — Negatif / sınır / arıza kontrolü
- [x] AynıcanlıUID/güncelRVilekeyNamesmaskeliPUT422/sabitmaskedmessage; storedUID/RV/data/metadatahashdeğişmedi.
- [x] UIcachemaskesiniSecretdeğeriyerineyazanbaşarılıişlemgörülmedi; veriStarplaceholderzannedilipgerçekveridenyasaklanmadı, uygulamametadatakeyNamescontracttestidir.
- Maskguard422APIadmissionredkanıtı değildir; frontendhide ayrı05.07.

#### TEST-05.09-S4 — Bulgular ve düzeltme
- Üretimbugtespitedilmedi; ilkgroup400 testtypedGETbodyTypeMetaolasılığıydı, kesinilkpayloadkanıtıyok.
- Düzeltmeyalnıztest: restrictedPUTTypeMeta ve safeerror/envelopeboolean; ilkFAIL/source korunur.

#### TEST-05.09-S5 — Tekrar test ve regresyon
- [x] Tekcorrectedgroupnormal+yetkisiz+maskedkontrolleri2.340sngerçekAPIilePASS.
- [x] CurrentUID/RVkontrolü nedeniyle409çakışmasımaskeengeliolarağınsunulmadı; gerçeknormaledit200ayrıpozitif.
- Bu fazadmissionveUIhidegenelkabulünütaşımaz.

Ayrıfrontend3UNITtesti actualvalidateRevealedSecret/secretSafeSubmission üzerinde metadata-keyNamesmaskesini ve yeniUIDyi reddetti; gerçekAPI422kanıtının yerine sayılmadı. SourceUIyükleme+submitguardbağlantısı mevcut. UIreveal/hide05.07kapısıaçık.

#### TEST-05.09-S6 — Temizlik ve inceleme
- [x] Yeni7fixtureUID/RVguarddelete+GET404; namespacekorundu, profil/labbytestamaynı,2originalNodeReady/metadata/specaynı.
- [x] Root13checksum+currenttest/handler/proofdatalarını ayrıinceledi; valuesRecordedfalse, privateTokenRequestconfigGoTempDir iletemizlendi.
- İnceleyen:root(testauthor farklıworker), aynıajansistemi; üçüncütarafpentestdeğil.
- Runtime/Browsersourcef32byteaynı, finalpaketdeğil.

#### TEST-05.09-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Uygulama keyNamesmaskeliSecretpayloadreddi gerçekAPI/datareadback/normalwritepozitifiyle doğrulandı. İlkgrupFAILayrı; backend+APIolupUIhide/diğergüvenlik/finalpaketkapısıdeğildir.
- resourcesSecretguard/sanitize/model/decodeveyaSecretpayloadcontractdeğişirse retestgerekir.

### TEST-05.10 — Genel WS/error/export/artifact hassas veri sınırı

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Genel WS/error/export/artifact hassas veri sınırı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.3/V14.3.3/V16.2.5; CAT05. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-06 — Hubble/TLS/provisioning

### TEST-06.01 — Temiz Cilium/Hubble bootstrap

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Temiz Cilium/Hubble bootstrap; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: source496729e2+explicitCLIrunner farkı; candidate04binary08bd0cee…; Hubblepatched.1378850e0…; minikubepatched.30ea47b1a…
- Ortam / kullanılan kimlik ve yetki: Yeni private release-audit-hubble-20261111-cold01 state planlandı; henüz cluster yaratılmadı.
- Başlangıç zamanı: 2026-11-11T12:25:17.812705+00:00
- Bitiş zamanı: 2026-11-11T12:27:31.914344+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.01-S1 — Hazırlık
- [x] NormalA2clusterUID/marker/02+04namespaceUID guard→ownedapps/nodes down. Freshtelemetrystate önceden yoktu; hiçbir vanillaCNI değiştirilmedi.
- [x] İki özelCLIhashi root tarafından tekrar hesaplandı; doctor gerçekversion/requiredflags ve minikube1.38.1-patched.3işaretini doğruladı.
- Kanıt: hubble-cold01-prepare.json; normal-lab-down-before-hubble.log; hubble-cold01-patched-doctor.json
- Sonuç: hazırlıkPASS.

#### TEST-06.01-S2 — Normal kullanım / pozitif kontrol
- [x] GerçekfreshCilium/HubbleA2coldbootstrap exit0.
- Gözlenen: kube-systemUIDe84bb50e…, ikiNodeReady; Cilium1.20.2DS/relaydeployment/readiness ve gerçekCNIproof kaydı.
- Kanıt: hubble-cold01/run.json/run.log; collector-image-inventory.json
- Sonuç: coldbootstrapPASS; UItrafik/performance ayrı fazlar.

#### TEST-06.01-S3 — Negatif / sınır / arıza kontrolü
- [x] Freshstate başta yoktu; normalvanillaA2 UIDkorunupdurdu, CNI’sine dokunulmadı. Sunulanyoldaplaintext/insecurefallback kullanılmadı.
- [ ] İkinciayrıcold ve down/up recovery bu fazınyerinegeçmez,06.10/06.11’de ayrıca açık.
- Kanıt: hubble-cold01-prepare.json ve patched-doctor.json

#### TEST-06.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: önceki tarihselikiFAILkorunur; bu yeni gerçeksource/CLI/bootstrap yolu başarılı.
- Kök neden/düzeltme: öncekiPodIPstartupwait/unitfix yeni gerçekkurulumda ilkkez doğrulandı. AyrıHubbleCLIstdlib/net ve minikubeCLI bağımlılıkpatchleri özelkimlikle kullanıldı; kalanadvisory koşullarıayrı.

#### TEST-06.01-S5 — Tekrar test ve regresyon
- [x] Öncekihelperstartupwaitgerçekfreshkurulumla tekrarlandı; CNI/relaybaselinesağlıklı.
- [x] App19846açılırken gerçekmTLSstatusCLI exit0; hiçbircertdoğrulaması kapatılmadı.
- Kanıt: hubble-cold01/app-start.log; explicitCLIbinarySHA receipts.

#### TEST-06.01-S6 — Temizlik ve inceleme
- [x] Bu gerçekmanual06lab manuelkabul için korunuyor; normal02/04lab stopped/restartable.
- [x] Source/CLI/chartdigest/clusterUID/PodimageUID karşılaştırıldı.
- [x] Root rawrun vewhiteliststateCNI/readiness/TLS metadata kaydınıokudu.
- Kalan sınırlar: negatifTLS/gerçekflow/ikinciCold/cleanpaketperformans açık; buPASSonlarıkapatmaz.

#### TEST-06.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: sunulan runner ile ayrıownedstate üzerinde gerçekfreshCilium/Hubble kurulumuyeniadayda geçti.
- Yeniden test: pinnedchart/CNI/runner/bootstrapwait/providerCLI değişirse.

### TEST-06.02 — Relay Ready ve gerçek mTLS

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Relay Ready ve gerçek mTLS; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + TLS WORKER
- Kaynak / build / paket kimliği: source496729e2backend aynı; binary08bd0cee…; HubbleCLI378850e0…; providerCilium1.20.2 exactimages collector-image-inventory.json
- Ortam / kullanılan kimlik ve yetki: ownedfreshkvml-d32afbf634e8-a; kube-systemUIDe84bb50e…; explicitprivateadmin/syntheticlabCA; yalnız19846/19848
- Başlangıç zamanı: 2026-11-11T12:40:13.181280Z
- Bitiş zamanı: 2026-11-11T12:41:23.889332Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.02-S1 — Hazırlık
- [x] Cluster/namespaceUID/owner/marker veprocessbinary/port guard; defaultcontext yok.
- Kanıt: hubble-cold01-prepare.json; artifacts/release-audit/ra-20261111/hubble-tls-worker/identity.json
- Sonuç: explicitownedtargetPASS.

#### TEST-06.02-S2 — Normal kullanım / pozitif kontrol
- [x] GerçekmTLSstatuskabulü; yanlışhostname, missingclient, yanlışCA/zincir ve labCAimzalıexpiredclientred. 7kayıt=6PASS+ilkbozukwrongCAfixtureBLOCKED; düzeltilmiş7.case doğrutrüstrootreddinikanıtlar.
- Kanıt: artifacts/release-audit/ra-20261111/hubble-tls-worker/REPORT.md
- Sonuç: gerçekveri/transport altkapsamPASS; normalUI/performanskanıtıdeğil.

#### TEST-06.02-S3 — Negatif / sınır / arıza kontrolü
- [x] Pozitifveilgilinegatifkontroller ayrık. TLSretleriylehostname/client/root/expiry doğrulandı; trafikselfIPdeğiliki gerçekPod.
- Gözlenen: rootilkflowhelper module-shadowFAIL; sonrakiNullableNodeUIDassert ve30sgrace/10swindowcleanupFAILkorundu. SonkoşugösterilmeyenNodeUIDyerinegerçekK8sUIDkanıtıkullanır.
- Sınır: NodeUIDveL7alanlarırawflowdanuydurulmaz; olay≠paket/byte/bantgenişliği.

#### TEST-06.02-S4 — Bulgular ve düzeltme
- Bulgu: ilkhelperNULL≠NULL NodeUIDbeklentisikontratauymaz; NodeUIDGo*sstringnullablevehistoryendpointNodeUIDdoldurmuyor. TestgerçekNodeUIDkoşulunuNodesAPI+PodUID/nodeNameilekorudu.
- Cleanuphelper: normalgracesonlanmasısonrası10sflowwindowbeklenir; leaseDELETEfinallyde. BlankAssertionErrormesajıartıkPASSoluşturamaz.
- Ürünruntime: buhatalar için değiştirilmedi. TLSilkbozukCAfixtureBLOCKEDdeğilPASSolarakkorundu.

#### TEST-06.02-S5 — Tekrar test ve regresyon
- [x] Sonflowkoşu32s: same/crossUID,1→3kaynakve0stopflow; HTTPsonuçları0.
- [x] NormalmTLSvebeşnegatifTLSduyarlıcasegeçti; yanlışrootfixtureayrıdüzeltildi.
- Kanıt: artifacts/release-audit/ra-20261111/hubble-tls-worker/REPORT.md
- Yenidenkullanım: ortakkod/fixturekanıtıifadeedenbuayrıfazlaraynıteksonlugerçekkoşununtercihlialtkapsamlarıdır; ikitestçalıştıdiyeadetşişirilmez.

#### TEST-06.02-S6 — Temizlik ve inceleme
- [x] Trafik0; yeniPodUIDgraceileDELETE veGET404/ownclientlist0; leaseDELETE200. NegatifTLScredentialsilindi, labCAkeymemory-only.
- [x] Namespace/clusterkimlikleri ve binary/helperhashlerikaydedildi.
- [x] Rootrapor/finalJSON/ilkFAILlarveTLSkimlikkanıtınıinceledi.
- Kalan sınırlar: normalUIgörseli,restrictedidentityflow/IPreuse/providerdisconnect/ikinciColdvedownup ayrıfazlar.

#### TEST-06.02-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: Relay readiness ve gerçekmTLS gerçekownedlabverisiylebelirtilenAPI/transportkapsamındageçti.
- Yeniden test: CNIchart/CLI/TLSadapter/collector/identityhistory/protocoldeğişirse.

### TEST-06.03 — Aynı Node farklı Pod gerçek iletişim

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Aynı Node farklı Pod gerçek iletişim; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: source496729e2backend aynı; binary08bd0cee…; HubbleCLI378850e0…; providerCilium1.20.2 exactimages collector-image-inventory.json
- Ortam / kullanılan kimlik ve yetki: ownedfreshkvml-d32afbf634e8-a; kube-systemUIDe84bb50e…; explicitprivateadmin/syntheticlabCA; yalnız19846/19848
- Başlangıç zamanı: 2026-11-11T12:44:30.925150+00:00
- Bitiş zamanı: 2026-11-11T12:45:02.942091+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.03-S1 — Hazırlık
- [x] Cluster/namespaceUID/owner/marker veprocessbinary/port guard; defaultcontext yok.
- Kanıt: hubble-cold01-prepare.json; artifacts/release-audit/ra-20261111/hubble-tls-worker/identity.json
- Sonuç: explicitownedtargetPASS.

#### TEST-06.03-S2 — Normal kullanım / pozitif kontrol
- [x] GerçekclientUID≠serverUID, ikisiworkerNode; gerçekHTTPprobeexit0 veaynıUIDçiftliHubbleFORWARDED/TCP.
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-cold01-contract-retest/result.json
- Sonuç: gerçekveri/transport altkapsamPASS; normalUI/performanskanıtıdeğil.

#### TEST-06.03-S3 — Negatif / sınır / arıza kontrolü
- [x] Pozitifveilgilinegatifkontroller ayrık. TLSretleriylehostname/client/root/expiry doğrulandı; trafikselfIPdeğiliki gerçekPod.
- Gözlenen: rootilkflowhelper module-shadowFAIL; sonrakiNullableNodeUIDassert ve30sgrace/10swindowcleanupFAILkorundu. SonkoşugösterilmeyenNodeUIDyerinegerçekK8sUIDkanıtıkullanır.
- Sınır: NodeUIDveL7alanlarırawflowdanuydurulmaz; olay≠paket/byte/bantgenişliği.

#### TEST-06.03-S4 — Bulgular ve düzeltme
- Bulgu: ilkhelperNULL≠NULL NodeUIDbeklentisikontratauymaz; NodeUIDGo*sstringnullablevehistoryendpointNodeUIDdoldurmuyor. TestgerçekNodeUIDkoşulunuNodesAPI+PodUID/nodeNameilekorudu.
- Cleanuphelper: normalgracesonlanmasısonrası10sflowwindowbeklenir; leaseDELETEfinallyde. BlankAssertionErrormesajıartıkPASSoluşturamaz.
- Ürünruntime: buhatalar için değiştirilmedi. TLSilkbozukCAfixtureBLOCKEDdeğilPASSolarakkorundu.

#### TEST-06.03-S5 — Tekrar test ve regresyon
- [x] Sonflowkoşu32s: same/crossUID,1→3kaynakve0stopflow; HTTPsonuçları0.
- [x] NormalmTLSvebeşnegatifTLSduyarlıcasegeçti; yanlışrootfixtureayrıdüzeltildi.
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-cold01-contract-retest/result.json
- Yenidenkullanım: ortakkod/fixturekanıtıifadeedenbuayrıfazlaraynıteksonlugerçekkoşununtercihlialtkapsamlarıdır; ikitestçalıştıdiyeadetşişirilmez.

#### TEST-06.03-S6 — Temizlik ve inceleme
- [x] Trafik0; yeniPodUIDgraceileDELETE veauthoritative client Pod LIST0 (bu yardımcı exact GET göndermedi)/ownclientlist0; leaseDELETE200. NegatifTLScredentialsilindi, labCAkeymemory-only.
- [x] Namespace/clusterkimlikleri ve binary/helperhashlerikaydedildi.
- [x] Rootrapor/finalJSON/ilkFAILlarveTLSkimlikkanıtınıinceledi.
- Kalan sınırlar: normalUIgörseli,restrictedidentityflow/IPreuse/providerdisconnect/ikinciColdvedownup ayrıfazlar.

#### TEST-06.03-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: AynıNodeiki farklıPod iletişimi gerçekownedlabverisiylebelirtilenAPI/transportkapsamındageçti.
- Yeniden test: CNIchart/CLI/TLSadapter/collector/identityhistory/protocoldeğişirse.

### TEST-06.04 — Cross-Node farklı Pod gerçek iletişim

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Cross-Node farklı Pod gerçek iletişim; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: source496729e2backend aynı; binary08bd0cee…; HubbleCLI378850e0…; providerCilium1.20.2 exactimages collector-image-inventory.json
- Ortam / kullanılan kimlik ve yetki: ownedfreshkvml-d32afbf634e8-a; kube-systemUIDe84bb50e…; explicitprivateadmin/syntheticlabCA; yalnız19846/19848
- Başlangıç zamanı: 2026-11-11T12:44:30.925150+00:00
- Bitiş zamanı: 2026-11-11T12:45:02.942091+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.04-S1 — Hazırlık
- [x] Cluster/namespaceUID/owner/marker veprocessbinary/port guard; defaultcontext yok.
- Kanıt: hubble-cold01-prepare.json; artifacts/release-audit/ra-20261111/hubble-tls-worker/identity.json
- Sonuç: explicitownedtargetPASS.

#### TEST-06.04-S2 — Normal kullanım / pozitif kontrol
- [x] YeniCPhedefliaffinityPodUID veworkerServerPodUIDfarklı; ikiPodNodeName veUIDlerigerçekNodes APIenvanteriylefarklı. Rawflow.nodeUIDnullkaldı; testbudurumuuydurmadı.
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-cold01-contract-retest/result.json
- Sonuç: gerçekveri/transport altkapsamPASS; normalUI/performanskanıtıdeğil.

#### TEST-06.04-S3 — Negatif / sınır / arıza kontrolü
- [x] Pozitifveilgilinegatifkontroller ayrık. TLSretleriylehostname/client/root/expiry doğrulandı; trafikselfIPdeğiliki gerçekPod.
- Gözlenen: rootilkflowhelper module-shadowFAIL; sonrakiNullableNodeUIDassert ve30sgrace/10swindowcleanupFAILkorundu. SonkoşugösterilmeyenNodeUIDyerinegerçekK8sUIDkanıtıkullanır.
- Sınır: NodeUIDveL7alanlarırawflowdanuydurulmaz; olay≠paket/byte/bantgenişliği.

#### TEST-06.04-S4 — Bulgular ve düzeltme
- Bulgu: ilkhelperNULL≠NULL NodeUIDbeklentisikontratauymaz; NodeUIDGo*sstringnullablevehistoryendpointNodeUIDdoldurmuyor. TestgerçekNodeUIDkoşulunuNodesAPI+PodUID/nodeNameilekorudu.
- Cleanuphelper: normalgracesonlanmasısonrası10sflowwindowbeklenir; leaseDELETEfinallyde. BlankAssertionErrormesajıartıkPASSoluşturamaz.
- Ürünruntime: buhatalar için değiştirilmedi. TLSilkbozukCAfixtureBLOCKEDdeğilPASSolarakkorundu.

#### TEST-06.04-S5 — Tekrar test ve regresyon
- [x] Sonflowkoşu32s: same/crossUID,1→3kaynakve0stopflow; HTTPsonuçları0.
- [x] NormalmTLSvebeşnegatifTLSduyarlıcasegeçti; yanlışrootfixtureayrıdüzeltildi.
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-cold01-contract-retest/result.json
- Yenidenkullanım: ortakkod/fixturekanıtıifadeedenbuayrıfazlaraynıteksonlugerçekkoşununtercihlialtkapsamlarıdır; ikitestçalıştıdiyeadetşişirilmez.

#### TEST-06.04-S6 — Temizlik ve inceleme
- [x] Trafik0; yeniPodUIDgraceileDELETE veauthoritative client Pod LIST0 (bu yardımcı exact GET göndermedi)/ownclientlist0; leaseDELETE200. NegatifTLScredentialsilindi, labCAkeymemory-only.
- [x] Namespace/clusterkimlikleri ve binary/helperhashlerikaydedildi.
- [x] Rootrapor/finalJSON/ilkFAILlarveTLSkimlikkanıtınıinceledi.
- Kalan sınırlar: normalUIgörseli,restrictedidentityflow/IPreuse/providerdisconnect/ikinciColdvedownup ayrıfazlar.

#### TEST-06.04-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: FarklıNodePod iletişimi gerçekownedlabverisiylebelirtilenAPI/transportkapsamındageçti.
- Yeniden test: CNIchart/CLI/TLSadapter/collector/identityhistory/protocoldeğişirse.

### TEST-06.05 — İki proje/namespace ölçülmüş trafik

- Kategori: CAT-06.
- Amaç / kullanıcı riski: İki proje/namespace ölçülmüş trafik; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root ikinciinceleme
- Kaynak / build / paket kimliği: scope04binary08bd0cee5a5d… (496729e2 runtime); testhelper snapshot sırasında2461bbfb; kaynak eşitliği iddiası yok.
- Ortam / kullanılan kimlik ve yetki: Owned06cluster e84bb50e…; admin-read+guarded scenario scale; Chromium156/WebKit27.2DPR1; max3client/5dk.
- Başlangıç zamanı: 2026-11-11T13:20:52.944Z
- Bitiş zamanı: 2026-11-11T13:24:27.476Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.05-S1 — Hazırlık
- [x] Exact owned06 lab/cluster/namespaceUID ve app/relay PID-doğum/listener/binarySHA her senaryoda doğrulandı.
- Ortam: MacM5/32GiB/macOS27.0.1; Chromium156/ANGLE Metal/medium/DPR1/1440×900/M38. Dengeli matris Battery53% başlangıç/lowpower0; canlı güç/RSS/disk sınırları denetlenir. Owned2Node lab ölçüm için durdu.
- Komut: node frontend/e2e/release-real-traffic.mjs (exact guard helper owned-traffic.py).
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-ui-worker/source-identity.json; attempt-02/result.json

#### TEST-06.05-S2 — Normal kullanım / pozitif kontrol
- [x] Normal Bul→Ağ tesisi→Ölçülmüş trafik→katmanı aç; gerçek0→1→3client ve ayrı PodUID
amespace çiftleri API/tablo açıklamasında eşleşti.
- Chromium156/WebKit27.2 ayrı ve seri PASS. İki proje arasında yönlü çizgi/ok ve aynıflowID matrisinde hareket görüldü.
- Kaynak gerçekKubernetes+HubblemTLS; Node provisioning veya replay değil.
- Ölçüm birimi10sn içindeki flowgözlemi; paket/byte/bantgenişliği/HTTPistek sayısı değil.

#### TEST-06.05-S3 — Negatif / sınır / arıza kontrolü
- [x] Stop sonrası own clientPod LIST0, ardından APIpair0+renderedFlows0; stophelper dönüşünden9.499/6.845sn. Katman kapatma leaseDELETE200; browsersclosed.
- İlk accessible-name helperFAIL: aranantamtesisadı ile görünenAğtesisi farklıydı; trafik başlamadan kaldı, attempt01korundu.
- Sınır: UIDçözümleme belirsiz olanlar null/belirsiz kalır; WebKit unresolved8 gözlemi gizlenmedi. NamespaceRBAC/providerkesinti bu fazın testi değildir.

#### TEST-06.05-S4 — Bulgular ve düzeltme
- Doğrulanmış ürün güvenlik/akış hatası: bu dar owned06 döngüde bulunmadı.
- Ürün kodu değişmedi; yalnız normal görünen finder adını seçen testhelper düzeltildi.
- Root genel incelemesi: WebKit yükleme etiketi dar dikey olabiliyordu; ayrı visual06/550400a3 düzeltmesinde ele alındı, buradaki eski binary sonucuna sonradan eklenmedi.

#### TEST-06.05-S5 — Tekrar test ve regresyon
- [x] Aynı testhelper düzeltilince iki motorun tüm akış/cleanup kontrolleri tekrar geçti.
- [x] Pozitif gerçek UID/namespace bilgisi ve negatif stop-pencere tükenmesi korundu.
- Gözlenen sonuç: iki gerçek namespace/proje arasında ölçülmüş akış için PASS; performans/nativeSafari/physical-latency kanıtı değil.

#### TEST-06.05-S6 — Temizlik ve inceleme
- [x] Teklif edilen ekstra probe/Pod/create/exec yapılmadı; mevcutDeployment şablonu scale ile0→1→3→0. FinalclientLIST0, serverUIDdeğişmedi.
- [x] App19846PID80336 ve relay19848PID80393 aktifaynı; subscriptionDELETE200; browsersclosed.
- [x] Worker bütün önemli PNG/video karelerini açtı; root dünya ve stopPNG ile zamanlı iki video karesini ayrıca açtı. Aynıajan sistemi ikinciincelemesi, profesyonelüçüncüparti değil.
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-ui-worker/REPORT.md; checked-summary.json; video-frames.json; delivery-clips/manifest.json
- Ham147MiBWebM seti yerelde korunur; Git teslimi yalnız PNG/JSON/rapor ve hashlenmiş kısa türetilmiş klipleri içerir. DELIVERY_SHA256SUMS teslim altkümesidir.

#### TEST-06.05-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: exactscope04binary, ownedCilium1.20.2mTLS ve iki motor için dar gerçekakış fazı geçti. Finalpaket veya farklısağlayıcı sürümü kendiliğinden kabul edilmez.
- Yeniden test: trafficprovider/mapper/namespaceauthorization/sceneanchor/katmanquery/collectorversion değişimi.

### TEST-06.06 — Start/increase/stop ve pencerenin boşalması

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Start/increase/stop ve pencerenin boşalması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root ikinciinceleme
- Kaynak / build / paket kimliği: scope04binary08bd0cee5a5d… (496729e2 runtime); testhelper snapshot sırasında2461bbfb; kaynak eşitliği iddiası yok.
- Ortam / kullanılan kimlik ve yetki: Owned06cluster e84bb50e…; admin-read+guarded scenario scale; Chromium156/WebKit27.2DPR1; max3client/5dk.
- Başlangıç zamanı: 2026-11-11T13:20:52.944Z
- Bitiş zamanı: 2026-11-11T13:24:27.476Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.06-S1 — Hazırlık
- [x] Exact owned06 lab/cluster/namespaceUID ve app/relay PID-doğum/listener/binarySHA her senaryoda doğrulandı.
- Ortam: MacM5/32GiB/macOS27.0.1; Chromium156/ANGLE Metal/medium/DPR1/1440×900/M38. Dengeli matris Battery53% başlangıç/lowpower0; canlı güç/RSS/disk sınırları denetlenir. Owned2Node lab ölçüm için durdu.
- Komut: node frontend/e2e/release-real-traffic.mjs (exact guard helper owned-traffic.py).
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-ui-worker/source-identity.json; attempt-02/result.json

#### TEST-06.06-S2 — Normal kullanım / pozitif kontrol
- [x] Normal Bul→Ağ tesisi→Ölçülmüş trafik→katmanı aç; gerçek0→1→3client ve ayrı PodUID
amespace çiftleri API/tablo açıklamasında eşleşti.
- Chromium156/WebKit27.2 ayrı ve seri PASS. İki proje arasında yönlü çizgi/ok ve aynıflowID matrisinde hareket görüldü.
- Kaynak gerçekKubernetes+HubblemTLS; Node provisioning veya replay değil.
- Ölçüm birimi10sn içindeki flowgözlemi; paket/byte/bantgenişliği/HTTPistek sayısı değil.

#### TEST-06.06-S3 — Negatif / sınır / arıza kontrolü
- [x] Stop sonrası own clientPod LIST0, ardından APIpair0+renderedFlows0; stophelper dönüşünden9.499/6.845sn. Katman kapatma leaseDELETE200; browsersclosed.
- İlk accessible-name helperFAIL: aranantamtesisadı ile görünenAğtesisi farklıydı; trafik başlamadan kaldı, attempt01korundu.
- Sınır: UIDçözümleme belirsiz olanlar null/belirsiz kalır; WebKit unresolved8 gözlemi gizlenmedi. NamespaceRBAC/providerkesinti bu fazın testi değildir.

#### TEST-06.06-S4 — Bulgular ve düzeltme
- Doğrulanmış ürün güvenlik/akış hatası: bu dar owned06 döngüde bulunmadı.
- Ürün kodu değişmedi; yalnız normal görünen finder adını seçen testhelper düzeltildi.
- Root genel incelemesi: WebKit yükleme etiketi dar dikey olabiliyordu; ayrı visual06/550400a3 düzeltmesinde ele alındı, buradaki eski binary sonucuna sonradan eklenmedi.

#### TEST-06.06-S5 — Tekrar test ve regresyon
- [x] Aynı testhelper düzeltilince iki motorun tüm akış/cleanup kontrolleri tekrar geçti.
- [x] Pozitif gerçek UID/namespace bilgisi ve negatif stop-pencere tükenmesi korundu.
- Gözlenen sonuç: gerçek start/increase/stop ve10sn pencere boşalması için PASS; performans/nativeSafari/physical-latency kanıtı değil.

#### TEST-06.06-S6 — Temizlik ve inceleme
- [x] Teklif edilen ekstra probe/Pod/create/exec yapılmadı; mevcutDeployment şablonu scale ile0→1→3→0. FinalclientLIST0, serverUIDdeğişmedi.
- [x] App19846PID80336 ve relay19848PID80393 aktifaynı; subscriptionDELETE200; browsersclosed.
- [x] Worker bütün önemli PNG/video karelerini açtı; root dünya ve stopPNG ile zamanlı iki video karesini ayrıca açtı. Aynıajan sistemi ikinciincelemesi, profesyonelüçüncüparti değil.
- Kanıt: artifacts/release-audit/ra-20261111/real-flow-ui-worker/REPORT.md; checked-summary.json; video-frames.json; delivery-clips/manifest.json
- Ham147MiBWebM seti yerelde korunur; Git teslimi yalnız PNG/JSON/rapor ve hashlenmiş kısa türetilmiş klipleri içerir. DELIVERY_SHA256SUMS teslim altkümesidir.

#### TEST-06.06-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: exactscope04binary, ownedCilium1.20.2mTLS ve iki motor için dar gerçekakış fazı geçti. Finalpaket veya farklısağlayıcı sürümü kendiliğinden kabul edilmez.
- Yeniden test: trafficprovider/mapper/namespaceauthorization/sceneanchor/katmanquery/collectorversion değişimi.

### TEST-06.07 — Provider stale/recovery

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Provider stale/recovery; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.08 — Restricted kimlik/namespace flow izolasyonu

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Restricted kimlik/namespace flow izolasyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.09 — IP/UID reuse eşlemesi

- Kategori: CAT-06.
- Amaç / kullanıcı riski: IP/UID reuse eşlemesi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.10 — down/up güvenli tekrar bağlantı

- Kategori: CAT-06.
- Amaç / kullanıcı riski: down/up güvenli tekrar bağlantı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.11 — Ayrı temiz state ile cold-start

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Ayrı temiz state ile cold-start; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.11-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.11-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.11-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.11-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.11-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.11-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.12 — Minikube gerçek hedef/UID kontrolü

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Minikube gerçek hedef/UID kontrolü; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER; root mutasyon/cleanup hedefi ve Git incelemesi
- Kaynak / build / paket kimliği: Runtime4c6c2ac5/provider09f9; son helper1a0db67621ed41059632bc246c23891d497cb02c8e23ab84c9f5bc415953d2e8; ilk iki actualFAIL kendi sourcehashlerinde
- Ortam / kullanılan kimlik ve yetki: Yalnız owned kvml-d32afbf634e8-a, iki original Node Ready. Gerçek admin kubeconfig private; başka context/hedef veya Secret değeri okunmadı.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: FAILED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.12-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- Read-only provider preflight: API→pkg/provision fixed add-worker yolu ve targetUID/context/profile lock/journal incelendi. Docker VM8.32GB/10CPU, mevcut2×2GiB hard limit; üçüncü2GiB için6GiB declared toplam. VM eksi limit hesabı gerçek boş bellek değildir.
- Bu preflight raporu145.249sn/120sn sınırını aştı: INCOMPLETE olarak kaldı, mutasyon/manager/POST yok. Kanıt: minikube-provision-preflight-worker/REPORT.md.

2026-11-11 yeni hazırlık: İlk helper draft5406… ve564.734sn/360sn INCOMPLETE kaydı korunur. Ayrı watchdog işi446.822sn/480sn; syntax+17pure guardPASS, Node/app/API runtime hiç çalışmadı. Yeni binary f9e70b60… ve allowlist19849 bağlı, RUN_CLEARED=False. Kanıt: artifacts/release-audit/ra-20261111/provider-helper-preparation-worker/REPORT.md ve provider-helper-watchdog-worker/REPORT.md. Root bütün9watchdog/önceki checksumları doğruladı; gerçek HTTP/OS preflight ayrı sonraki iş.

#### TEST-06.12-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

İlk gerçek HTTP/OS preflight: exactconnection/context/systemUID200, initialreadonly→explicitgrant, provideravailable/canAdd/MaxNodes3 ve inventory0 geçti; unsupportedaction400 sonrasıoperations0. OwnedOSfixture bağımsızwatchdogTERM/exit-15 ile sonlandı. Bunlar workerADD kabulü değildir; add/cancel/delete POST0. Kanıt: provider-http-preflight-worker/REPORT.md/result.json.

İlk gerçek API/CLI worker denemesi:18:53:13.679POST202; aynıkey ikinciPOST18:53:13.999 aynıoperation8ce1a91c-509b-4129-8bff-778b87f48888. CLI91166 exactm03claim ile başladı. Helper18:53:15KeyError; Ready/newNodeUID doğrulanmadı. Hiç körretry yapılmadı. Runtimef9/4c, helper7f17 ve patchedCLI98e42 aynı. Kanıt: real-minikube-add-current-worker/REPORT.md/result.json/progress.jsonl.

Ayrı düzeltilmişcase02: runtimef9/4c, helper8645; firstPOST19:13:56.336/samekeysecond19:13:56.637 aynıoperation0aab9c6d… .19:14:15ProcessLookupError, actualstack power→cmd→bounded_process→OwnedGroup.capture, Ready/adoption yok. App93925/CLI93976 yok/19849boş, immutablejournallar private600. Kanıt: real-minikube-add-fixed-worker/REPORT.md/result.json.

Case03 gerçekworker: firstPOST19:29:13.849/samekeysecond19:29:14.153 tekoperatione71e7301… .Kayıt19:29:21.429, Ready19:29:22.930; NodeUID01fb8dc0-b1d6-4831-9561-277ca390fe8a ve Docker30e5834e… doğrulandı. Helper exactknownDS/newUID cleanup19:29:29.754 tamam/journalPASS. OUTERFAIL: assignedPodGC20s içinde bitmedi; finalPodUIDs saklanmadı. ProfileSHA c826→4733 fakat privateparsedJSONtamaynı/diff0. Runtime38.262sn/report142.310sn<720. No4thadd; ilk ikiFAIL korunur. Kanıt: artifacts/release-audit/ra-20261111/real-minikube-add-racefixed-worker/REPORT.md.

İlk saltokunurGCfollowup defaulthelperACpowerguardında BLOCKED; hiçbirKubernetes/Dockerread yok. CurrentGC/profileobservationUNKNOWN, öncekiFAIL değişmez. Powercondition cihazBattery90 olarak değişti; kullanıcıpildevam yetkisiyle ayrı kısaREADONLY politika uygulanacak, auth/UIDguardları değişmez. Kanıt: artifacts/release-audit/ra-20261111/real-minikube-add-gc-followup-worker/REPORT.md.

#### TEST-06.12-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- İlk actual-attempt hazırlığı BLOCKED: güvenli HTTP/adoption/cleanup helper150sn setup kapısında yetişmedi; karar179.950sn'de kaydedildi, overall720sn tükenmedi. POST/manager/CLIadd/delete ve kaynak edit0; gerçek provisioning PASS yok.
- Exact m03 label filtresi container/volume/network seçmiyor; original volume/network ID/birth/owner snapshotlandı. Root pinli CLIargs[0],Retrieve/MachineName ve filteredPossibleLeftOvers kaynaklarını okudu. CLI drain --disable-eviction/force kullandığından yalnız doğrulanmış yeni host ve bilinen ownedDaemonSetPod guard'ıyla kullanılabilir; başka Pod varsa durur.

Watchdog/ownedPIDbirth+PGID, finite2MiBI/O, cleanup reserve/reentry ve unprovenpartialrefusal saf testlerle geçti. Bunlar gerçek CLI sonlandırma/worker veya teardown kanıtı değildir; gerçek işlem açık.

FAIL: final snapshot/profile byte eşitliği original_cluster_fixture_profile_changed guardında kaldı. Before/after saklanmadığı için değişen alan/neden bilinmiyor. Ayrıca raporfinalization243.216795sn>180sn; withinBudget=false. İlkexit0 kabul değildir; resultFAIL esas. Körretry/actualNodeAdd yok. Ayrı no-app read-only snapshot diagnostic yetkilendirildi.

FAIL/pendingcleanup: typedinventory yeniNode/container olmadığını, yalnız operationdan sonra doğmuş exactm03volume ve nonCP/IPempty pendingprofilentry olduğunu gösterdi. Genericdockerinspect same-namevolume döndürebiliyor; originalexceptiontrace kayıp olduğundan kesin ilkkey iddiası yok. Rootownedapp/CLI stop ve immutablejournal kopyası korundu; tekopreconciling/processExited/NodeUIDyok.

Typedpartial: exactcontainer7a5a1089… operationdan sonra19:14:13.970doğmuş/ownedlabels/network/IP; yalnıznewvolume+pendingm03profil. Node/assignedPod0,original2Ready. İlkprivatefullprofilebytesc826hashiyle korunur. YeniAPIisteği yapılmadı. Root exactcleanupı ayrıguard/lock sınırıyla yetkilendirdi; safguardproblemi liveReady diye sunulmadı.

#### TEST-06.12-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

Ayrı salt okunur tanı: aynı lock altında kalıcı üç metadata snapshot alındı. İlk çiftte yalnız control-plane mount listesinin iki kaydı yer değiştirdi:4JSONpointer fark; üçüncü AFTER ile aynı. ProfileSHA ve diğer alanlar değişmedi. Bu koşuda sıra farkı kanıtlandı; kayıp baseline yüzünden önceki HTTPFAIL nedeni hâlâ kanıtlanmadı. İş4.435sn/toplam68.557sn; yeni app veya provider işlemi yok. Kanıt: provider-snapshot-diagnosis-worker/REPORT.md ve before/after/additional/exact-diff.

Dar yardımcı düzeltmesi: Docker mount kayıtları ve multiplicity korunarak canonical sıralanıyor. Reversed/changedvolume/droppedrecord/duplicate negatifleri dahil21saf testPASS. Ürün runtime değişmedi. Manager.New kaynak sözleşmesinde boş journal JSONnull, SnapshotAPI[]; iki temsil ayrı doğrulandı. İlkFAIL nedeni geriye dönük kesinleştirilmedi.

Dar testhelper düzeltmesi: genericinspect yerine typedcontainerinspect, pendingNetworkSettingsNone güvenle unready metadata.23safcasePASS (21eski+volume-onlycollision/pendingnetwork); syntaxPASS, RUN_CLEAREDfalse, ürünruntimeaynı. İlkactualexceptiontrace yokluğu korunur; bu saf kontrol gerçekworker kabulü değildir. Kanıt: provider-container-type-fix/REPORT.md/result.json/pure-tests.stdout.

Son helper8645fc24… ayrıca strictadoption için providerın profileIP/NodeUID doğrulamasından sonra nodeUID yayınını bekler; eksikReadyconditions hazır sayılmaz. Ürünprovider kodu aynı;23safcase tekrar geçti. Livecase2henüzçalışmadı. Kanıt: provider-observed-identity-guard/result.json.

Case02actualstackın gösterdiği race için dar helperfix: completedchild Popenexit durumu, ps/getpgid ortasında bitişi normal kabul eder; hâlâ çalışan unverifiedchild reddedilir. Capturehatasında yalnız freshPopenchild/pipe cleanup. App/CLI PIDbirth+PGID ve kaynakguardları aynı.26safcase ve100realbounded /usr/bin/true,0.446sn/10sn bütçePASS; Kubernetes/provider0. Kanıt: provider-short-child-race-fix/REPORT.md/result.json.

#### TEST-06.12-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

Sonraki uygulanabilir retest: mount kayıtlarını/multiplicity koruyan kararlı sıralama ve farklı volume/kayıp kayıt negatifleri; tek HTTP preflight ile her iki snapshot/profile hash kalıcı kaydedilecek. Henüz actualNodeAdd izni açılmadı; phaseFAILED korunur.

Tek HTTP retestPASS:3.803sn actual/168.520sn total<300; readonly→grant/actualcontextUID/profile/MaxNodes3/availablecanAdd, operations0, unsupported400→operations0; çocuk süreç0. Kalıcı before/after/profilehash ve exactdiff0. App87106exit0/noLISTEN19849, realCONTROLabsent. Kanıt: provider-http-preflight-retest-worker/REPORT.md. Root14checksum, helperdar diff ve iki snapshot sonucunu inceledi.

Typedcontainerfix sonrası gerçekadd retesti henüz çalışmadı: RETEST_REQUIRED. İlkownedlab exactprofileSHA/original2Ready ve sıfırnewresource rollback kanıtı mevcut; yeni sonlu case yalnız root ayrıclearance ile başlatılabilir.

İlk iki gerçekFAIL kapanmadı. Helper1a0… sonrası liveReady yeniden test edilmedi; bu nedenle RETEST_REQUIRED. Bu100komut uygulamaCPU/performans veya workerprovisioning kabulü değildir.

#### TEST-06.12-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

- [x] İlk iki preparation/blocked job source/receipt/checksumları root tarafından okundu; yeniNode veya app yok. İki original node sonraki kontrollü iş için sıcak.
- Sonraki iş helper kodunu ayrı somut implementation aşamasında hazırlamak, syntax/pureguard kontrolü ve checkpoint sonrası tek gerçek deneme. Root onayı internal ownership gate'dir; kullanıcıdan yeni genel izin istenmedi.

Ownedapp82905/birth/PGID finallyexit0; noLISTEN19849, child0, realCONTROLabsent, RUN_CLEAREDfalse vehelper723af…aynı. Liveoriginal2Node/system/marker/ns guard geçti; fullsnapshot/profile invariance doğrulanmadı. Root kayıtlı checksumların tamamını doğruladı; runtimebuildreceipt f9/4c ayrı eklendi.

Run gate kaynaktaFalse kaldı. Root HTTP ön kontrolünün başarılı checkpointinden sonra yalnız exact owned lab üzerinde tek idempotent yeniworker denemesi için ayrı private clearance verecek; gerçek provisioning bu aşamada yapılmadı.

Ayrı exactpartialcleanup: iki lock, system/marker/ns/original2Ready, noNode/container, volume birth/labels/no-users/exclusive targets; pendingentry çıkarılmış tamcandidateSHA başlangıçc826… ile birebir eşleşti. Yalnız newvolume nonforce rm; CAS/fsync/rename ile exactoriginalprofile0600 geri geldi. Newlabelcontainer/volume/network0, originals/fixtures/Cilium/network/volumes/manualstate eşit. İşlemFAIL kaldı. Operationalcleanup90.491sn<120; cleanupreport253.531sn>180 ayrıtimingFAIL; entirejob684.910sn<720. Root22fileSHA listesi ve CLEANUP.md/result inceledi.

Case02 exactcleanup:102.600sn<120 operasyon geçti; container/volume nonforce kaldırıldı, profilec826exactrestore/originalsnapshotaynı/NewNode+Pod+labeltargets0. Failedoperation/journallar değişmez. Finalreport244.087sn>240timingFAIL ayrı korundu; yeniapp/add yok. Source8645eskiFAIL kaydı sabit; makinadizini o alt işte silinmedi. Kanıt: artifacts/release-audit/ra-20261111/real-minikube-add-fixed-cleanup-worker/REPORT.md.

Rootdarfilecleanup: aynıiki lock ve actualoriginal2/system/ns guardları; liveNEWresource0/profilec826 doğrulandı. Yalnız case02operationdan sonra doğmuş exactm03config/id_rsa/id_rsa.pub ve configName/driver bağlandı. Active machines/m03 dizini privateCONTROL02/quarantined-machine-m03 konumuna atomik taşındı, silinmedi; dosyaiçerikleri yayımlanmadı. Sourcepathyok, targetconfigSHAaynı, originalsnapshot/profileaynı. Bu yeniNode veya oldpendingoperationrecovery başarısı değildir. Kanıt: artifacts/release-audit/ra-20261111/provider-machine-quarantine/REPORT.md.

12 Kasım yeniden inceleme: case03 sonrasındaki tek salt-okunur pil politikası kontrollü takipte yeni worker’a atanmış Pod0, exact yeni Node/container/volume/network/machine yokluğu ve original iki Ready UID/tam baseline eşitliği doğrulandı. Gözlem2026-11-11T19:36:00.453255UTC; gerçek GC zamanı bilinmiyor. Profil JSON tokenları aynı, yalnız string dışı whitespace değişmiş; bytehash4733b8… korunur. Sonraki sıfır, ilk20sn deadline FAIL sonucunu değiştirmez; dördüncü add yapılmadı. Kanıt: artifacts/release-audit/ra-20261111/real-minikube-add-gc-battery-followup-worker/REPORT.md (6/6 SHA doğrulandı).

#### TEST-06.12-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- FAILED: case03gerçekNodeReady ve anahelpercleanup kanıtlandı, fakat final20sPodGC/profilebyte kontrolleri geçmedi. İlk üç case kendi sonucunda korunur. SaltokunurGCfollowup ve semantikprofil incelemesiyle durum netleştirilecek; yeniNodeAdd yok.
- Sonraki iş: gerçek kalanPodidentity/GC ve profileformat tanısı; deadlineveFAIL sonuçları sessizcePASS yapılamaz.

### TEST-06.13 — Minikube idempotency/profile lock

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Minikube idempotency/profile lock; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root provider mutasyon/kapsam incelemesi
- Kaynak / build / paket kimliği: Root productpatch minikube.go8e57040b…; augmentedteste1576b46…; orijinalred2a146f46… korunur
- Ortam / kullanılan kimlik ve yetki: UNIT production Register/protect + fake Kubernetes/runner + private terminal journal; geçerli local session/grant. Gerçek CLI/Node/cluster/browser yok.
- Başlangıç zamanı: 2026-11-11T18:02:56.905572Z
- Bitiş zamanı: Unit/race retest tamam; kesin argv/UTC provider-cache-scope-retest-worker JSONlarında. Gerçek same-key/profile concurrency kapısı açık.
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.13-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- Production provision.New ile private terminal journal ve fakeRunner kullanıldı; public POST/cookie/nonce/grant/loopback/Origin yolu gerçek handler'dır. No manager.Verify/Begin mock'u, no actualCLI.

#### TEST-06.13-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- [x] Doğru configured context+UID+samekey202 cachedoperation, Add0. Yanlış selectedcontext geçerli grant ile409/nooperation/Add0. Pozitif yol kullanılabilirken changedUID özel negatif ayrıldı.

Aynı gerçekilkadd koşusunda aynı-key ikiPOST aynıoperation8ce1a91c… döndürdü; ikinci biroperation kaydı yok. Ancak workerReady ve tüm lock/restart/timeout/idempotency kapsamı geçmedi; bu dar kanıt phase06.13 genelPASS değildir. Kanıt: real-minikube-add-current-worker/REPORT.md; actualfirstFAIL ayrı.

#### TEST-06.13-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- [x] PROV-CACHE-001 RED: canlı fake kube-system UID farklıyken beklenen409 yerine202+oldcachedoperation; freshNamespaceUIDGet0/ProfileUIDcheck0/Add0. Yeni worker veya RCE/Secret sızıntısı kanıtı yok.

PROV-LOCK-002 RED: aynı gerçekHome/Profile fakat farklıStateDir ile ikiManagerNew eşzamanlıbaşarılı. SameStateDir redkontrolü, ilkfakeoperation/samekey tekID veClose/wgjoin/reacquire pozitifleri geçti. Tamamısentetikfakeclient/runner; gerçekCLI/VM veya exploit yok. İlkPATHGo1.26.5setupFAIL ayrı; exactGo1.26.11actualred4.275sn. Kanıt: provider-profile-lock-scope-worker/REPORT.md; regression2a146f46… .

#### TEST-06.13-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

- Kök neden: providerWorker POST context check sonrası Begin çağırır; Begin cached-key branch Verify'den önce döner. GET yolu freshUIDcheck yaparken POST atlar. Authenticated local cached-scope integrity/yanlış işlem durumu sorunu, MEDIUM güvenlik/P1 doğruluk olarak değerlendirildi; CVSS veya remote exploit iddiası yok.

- Düzeltme: var olan actual kube-system GET/error/UID409 guard'ı GET/POST ayrımının önüne taşındı. Cached POST da güncel seçili UID'yi doğrular;16satırlık dar hareket, Manager/auth/journal şeması değişmedi. Aynı15sn context ve failure() RBAC/upstream error ayrımı korundu.

Kök neden: physicalCLIinventory Home/Profile iken nonblockinglock StateDir/Profile konumunda. Localtrustedikiapp/customStateDir önkoşulluMEDIUM/P1 concurrency doğruluk bulgusu; anonim/RBAC bypass gösterilmedi. Runtimefix henüz yok.

PROV-LOCK-002 düzeltmesi: cfg.Home/.kubeview-provider-locks physicalprofil kilidi eklendi, eskiStateDirjournal kilidi korundu. Constructor hatasında her ikisi bırakılır; Close cancel/wgjoin sonrasında ikisini bırakır. Journalformat/workerAPI/türler değişmedi. OrijinalPoC2a146… aynıkaldığı ilk koşudaGREEN oldu.

Test-helper prebind düzeltmesi: ownedTCP activeclose fixture barebindEADDRINUSE48, aynıSDKGoListenerSO_REUSEADDRbind başarılı. scripts/release-provider-lab.py preflight GoListener ile aynısocketoptionı kullanıyor; üretimendpoint değişmedi.26safcasePASS ve helperSHA4613d23… . Bu fixture ilk kayıtsızOSError nedenini geriye dönük kanıtlamaz. Kanıt: artifacts/release-audit/ra-20261111/provider-rebind-harness-fix/REPORT.md;4/4SHA doğrulandı. DüzeltilmişgerçekHTTP sonuçları ayrı yeni run-id altında beklenecek.

#### TEST-06.13-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

- [x] Orijinal1e6f test değiştirilmeden bir kez retest edildi:3casePASS; good/wrongcontext/changedUID namespace reads1/0/1, cachedgood202sameoperation, bad409/nooperation, CLI0.
- [x] Ek valid-session namespace403/503/404 negatifleri ve combined12top/33subcase/0SKIP geçti. Dar2test/6subcase race dePASS; tamrace/gerçekcluster yerine sunulmadı. İlkRED korunur.
- Source davranış sınırı: unsupportedmethod/body ve cancel öncesi UIDerror önceliği artık ortakguard'dan gelir; cancel Verify kendi ekread'ini korur. Kontrol atomik clusterUID garantisi değildir.

RetestPASS: tümprovision10PASS+1internalchildSKIP; targetedserver6top/30altPASS,0SKIP; focusedrace5PASS+1internalchildSKIP. Internalchild varsayılanSKIP olsa da iki ayrıGoTestbinary subprocess parenttesttegerçek çalıştı; aynıphysicalHome/differentStateDir dışlama veClose sonrası bırakma, Homesymlinkalias veinvalidjournalfailurecleanup doğrulandı. Rootkaynak/review.json ve24checksum inceledi. Kanıt: provider-profile-lock-retest-worker/REPORT.md.

İlk gerçek iki-app HTTP kontrolü (11Kasım): sourcef32/build5f1c22…; Aavailable/canAdd true, farklıStateDir aynıHome/Profile Bavailablefalse/workers503. ExactPID ile ikisi kapandı; B yeniden start öncesi OSError, errno/stack kaydedilmemiş. Bu nedenle gerçek restart kabulü FAIL, ilk hatanın nedeni bilinmiyor. İkiapp/node/profilcleanup iyi olsa da tamfazPASS değildir. HiçworkerPOST/CLI/VM değişikliği yok. Kanıt: artifacts/release-audit/ra-20261111/provider-profile-lock-http-worker/REPORT.md;10/10SHA doğrulandı.

12Kasım correctedHTTP: sourcef32/build5f1c22… . Aavailable/canAddtrue200; aynıHome/Profile farklıStateDir B503/false; exactA+Bclose sonrası BsameState restart200/true. 19HTTPattempt(max8/sn), concurrency1,3managementPOST; workerPOST/CLI0. HTTPassertions4.549sn/300PASS. Ancak hazırlık/recovery dahil kayıtlıphasewall830.384sn,300snplan+530.384 aşımı; bütçeuyumu geçti diye sunulmaz. İlkOSError ve yeniresumeAttributeError/interrupt/transporttimeout ayrı korunur. Mevcutownedlab kubelet+CPalias normalresume onarımları ayrıca kayıtlıdır; CNI/bootstrap/newNode yapılmadı. Kanıt: artifacts/release-audit/ra-20261112/provider-profile-lock-http-retest-worker/REPORT.md.

#### TEST-06.13-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

- [x] Geçici fake journal/lock ve Server test cleanup; listener/CLI/cluster başlamadı. Root source/test/rapor ve3checksum doğruladı; ilkRED korunur. Farklı StateDir arasında global lock kanıtı yok.

- [x] Root productiondiff/test ve8checksum/raporu okudu; temporary manager/lock/journal cleanupPASS. Repo dışı provider/CLI veya gerçekNode çalışmadı.
- Gerçek helper eski binary ile hard-blocked; yeni fixruntimeSHA gelmeden actualtest çalışmaz.

176.128sn/360; indirilenyeniSDK/dependency, gerçekCLI/VM/K8s0. Dar localfilesystem concurrencyfix doğrulandı; providerUI/gerçekE2E ve eskiPendingjournalrecovery genel kapıları kapanmadı. Yeni runtime/binary/finalpaket gerekir; gerçekworkerkanıtı eski4c/sourcekimliğinde kalır.

12Kasım root34/34artifact-relativeSHA ve rapor incelemesi: exact3appPID/birth/PGID kapandı/exit0,19846/47free, appchildren0, original2NodeUID/Ready+fullbaseline/stablemetadata/spec eşit. Profil4733b8…byteaynı; globalconfigyalnızstat. Journalnull/0; intentional0600lock. İki ownedlabcontainer sonrakiuygulanabilirtest için çalışır bırakıldı. GerçekHTTPkilitleme kanıtı, gerçeksame-keynewworker/lifecycle/finalpaketgenel kabulünün yerine geçmez.

#### TEST-06.13-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- PROV-CACHE-001 dar public-HTTP sorunu FIXED+UNIT/race retest geçti; ilkFAILED koşu tarihsel korundu. Faz IN_PROGRESS: gerçek same-key tekworker ve profil-lock/concurrency/restart kapsamı henüz tamamlanmadı.
- Cachedgood result korunur; yanlışactualUID ve UIDokuma hatası eskioperation döndürmez. Doğrudan internalManager callers aynıpublicboundaryvarsayımını korumalı; yeni caller değişirse test gerekir. Atomik UID veya globalfarklıStateDirlock iddiası yok.

### TEST-06.14 — Minikube hata/timeout/reconcile/cleanup

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Minikube hata/timeout/reconcile/cleanup; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.3.1/V8.3.3; API10:2023; CAT06 gerçek mTLS/provider. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.14-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.14-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.14-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.14-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.14-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.14-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.14-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-07 — Statik analiz/bağımlılık/sır

### TEST-07.01 — Go vet ve lint/tip kontrolü

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Go vet ve lint/tip kontrolü; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-07.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-07.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-07.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-07.02 — Güvenlik odaklı kaynak analizi

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Güvenlik odaklı kaynak analizi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-07.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-07.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-07.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-07.03 — Govulncheck erişilebilir Go zafiyetleri

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Govulncheck erişilebilir Go zafiyetleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER
- Kaynak / build / paket kimliği: 36d5b8f + source-checkpoint01.json exact runtime hashes; Go1.26.11
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:20:48.364084+03:00
- Bitiş zamanı: 2026-11-11T13:43:38.650778+03:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.03-S1 — Hazırlık
- [x] Sahip olunan repo/fixture sınırı ve kaynak kimliği doğrulandı.
- Yapılan: worker görevi, dosya sahipliği, tarama/test bütçesi ve kaynak SHA kaydedildi.
- Kullanılan komut / çalışma dizini: git rev-parse HEAD; /Users/yunusemre/Desktop/KubeView.
- Beklenen: yalnız bu repo ve sentetik test hedefleri.
- Gözlenen: izlenen runtime temiz,36d5b8f; dış üretim hedefi yok.
- Kanıt: artifacts/release-audit/ra-20261111/start.json; worker raporu devam ediyor.
- Sonuç: hazırlık tamam; pozitif/negatif sonuç henüz yok.

#### TEST-07.03-S2 — Normal kullanım / pozitif kontrol
- [x] Güncel kaynak ve main-only govulncheck tarandı.
- Yapılan: Go1.26.5, govulncheck1.9.0; ./... ve main giriş noktası ayrı.
- Beklenen: bilinen erişilebilir ciddi açık bulunmamalı; uyarılar triyaj edilmeli.
- Gözlenen:42 unique advisory;21symbol/15package/6module. JSON exit0 temiz sonuç anlamına gelmedi.
- Kanıt: artifacts/release-audit/ra-20261111/dependency-worker/go-findings-summary.json; go-advisories.json
- Sonuç: kabul FAILED; ulaşılabilirlik ve sürüm düzeltmesi devam ediyor.

#### TEST-07.03-S3 — Negatif / sınır / arıza kontrolü
- [x] Scanner finding içeriği ve bilinen baseline pozitif kontrolü değerlendirildi.
- Yapılan:42baseline advisorynin affect/reachability/önkoşulu triyaj edildi; JSON exit0 temiz sayılmadı.
- Beklenen: source giriş noktası düzeltme sonrası0finding; package/module eşleşmesi exploit gibi yazılmamalı.
- Gözlenen: patched main JSON config Go1.26.11;0finding. Son runtime değişiklikleri sonrası ayrı root tekrarında da0.
- Kanıt: dependency-worker/go-baseline-triage.json; dependency-worker/remediation-manifest.json; candidate-main-govulncheck.jsonl
- Sonuç: source tarama kapısı geçti; container/binary/native platform testleri ayrı.

#### TEST-07.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: DEP-001 (42baseline advisory, farklı kanıt seviyeleri).
- Önem derecesi: her advisory önkoşulu worker triage tablosunda; hepsi doğrulanmış exploit sayılmadı.
- Kök neden: Go1.26.5 ve eski x/net/text/SPDY graph.
- Değiştirilen dosya: backend/go.mod/sum; Dockerfile/CI builder1.26.11. Kubernetes0.30.0 korundu.
- Düzeltme: çalışma farkı; source-checkpoint01.json hash kaydı.

#### TEST-07.03-S5 — Tekrar test ve regresyon
- [x] Root final kaynak main scan0finding.
- [x] Worker vet+unit ve root final race geçti; opt-in25SKIP korunur.
- [x] Frontend220/220 vebuild komşu kapısı geçti.
- Sonuç ve kanıt: source-checkpoint01.json; final-go-race.jsonl; frontend-unit-candidate.log. Gerçek SPDY/provider kabulü sayılmaz.

#### TEST-07.03-S6 — Temizlik ve inceleme
- [x] Scanner/baseline fixture ve ham redakte çıktılar hashleriyle saklandı; localtool .git içinde.
- [x] Final modül/scope/session source hashleri ilişkilendirildi.
- [x] Root minimum sürümleri, graph değişimini ve parsed JSON config/finding countunu inceledi.
- İnceleyen: ANA MÜDÜR, worker ile aynı ajan sistemi.
- Kalan sınırlar: Darwin/arm64 main source, bugünkü advisory DB. Binary/Linux/OS taraması CAT07.05/20de.

#### TEST-07.03-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar gerekçesi: baseline findingler triyaj ve patched main0finding iki source checkpointinde doğrulandı.
- Yeniden çalıştırma: bağımlılık, toolchain, import graph, platform/buildtag değişimi veya yeniadvisory.

### TEST-07.04 — JS lockfile/dev/runtime advisory taraması

- Kategori: CAT-07.
- Amaç / kullanıcı riski: JS lockfile/dev/runtime advisory taraması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER
- Kaynak / build / paket kimliği: 36d5b8f; frontend lock SHA ecbd67c765f1e244df703e5e1f13c95fa32bd94abf4e9e278bec4b15f34f5d90 (değişmedi)
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:20:48.364084+03:00
- Bitiş zamanı: 2026-11-11T13:35:03.936403+03:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.04-S1 — Hazırlık
- [x] Sahip olunan repo/fixture sınırı ve kaynak kimliği doğrulandı.
- Yapılan: worker görevi, dosya sahipliği, tarama/test bütçesi ve kaynak SHA kaydedildi.
- Kullanılan komut / çalışma dizini: git rev-parse HEAD; /Users/yunusemre/Desktop/KubeView.
- Beklenen: yalnız bu repo ve sentetik test hedefleri.
- Gözlenen: izlenen runtime temiz,36d5b8f; dış üretim hedefi yok.
- Kanıt: artifacts/release-audit/ra-20261111/start.json; worker raporu devam ediyor.
- Sonuç: hazırlık tamam; pozitif/negatif sonuç henüz yok.

#### TEST-07.04-S2 — Normal kullanım / pozitif kontrol
- [x] Gerçek frontend lockfile npm audit ile tarandı.
- Yapılan: npm audit --json, tüm prod/dev lock kapsamı.
- Beklenen: advisory envanteri doğru; sadece exit koduna dayanılmamalı.
- Gözlenen:0 advisory;204 locked package.
- Kanıt: artifacts/release-audit/ra-20261111/dependency-worker/npm-audit-validation.json
- Sonuç: bu lockfile ve veri tabanı anı için negatif tarama.

#### TEST-07.04-S3 — Negatif / sınır / arıza kontrolü
- [x] Bilinen zafiyetli izole pozitif kontrol sınandı.
- Yapılan: .git altında lodash4.17.20 lock-only/ignore-scripts; yükleme/çalıştırma yok.
- Beklenen: scanner bilinen advisoryyi bulmalı.
- Gözlenen: exit1 ve GHSA-35jh tespiti; node_modules oluşturulmadı.
- Kanıt: artifacts/release-audit/ra-20261111/dependency-worker/npm-positive-audit.stdout
- Sonuç: scanner pozitif kontrol geçti; nihai inceleme bekliyor.

#### TEST-07.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: bu lockfile için npm advisory eşleşmesi yok.
- Önem derecesi ve gerekçesi: N/A; bilinmeyen açık garantisi verilmez.
- Kök neden / değiştirilen dosya: N/A, frontend bağımlılığı değiştirilmedi.

#### TEST-07.04-S5 — Tekrar test ve regresyon
- [x] İlgili normal lockfile envanteri ve audit JSON içeriği doğrulandı.
- [x] Bilinen zafiyetli izole lock-only pozitif kontrol tarayıcının çalıştığını doğruladı.
- İlk sorunu üreten test: NOT_APPLICABLE; bu taramada ürün bulgusu yok.
- Sonuç ve kanıt: artifacts/release-audit/ra-20261111/dependency-worker/npm-audit-validation.json; 204/204 envanter eşliği,0advisory; pozitif kontrolde4advisory/exit1.

#### TEST-07.04-S6 — Temizlik ve inceleme
- [x] Pozitif fixture yalnız .git içinde saklandı; hiçbir paket çalıştırılmadı veya global kurulmadı.
- [x] Frontend lock hash kaynak manifestiyle eşleşti.
- [x] Root JSON, komut ve pozitif kontrol çıktısını ikinci kez inceledi.
- İnceleyen: ANA MÜDÜR; worker ile aynı ajan sistemi, profesyonel bağımsız pentest değildir.
- Kalan sınırlar: npm registry advisory DB revision bildirmiyor; gizli/unknown açıklar test dışı.

#### TEST-07.04-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar gerekçesi: lock tüm prod/dev kapsamıyla0advisory ve scanner pozitif kontrolüyle doğrulandı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: package/lock veya advisory verisi değişimi.

### TEST-07.05 — Container/base image/manifest taraması

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Container/base image/manifest taraması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + KV-DEPENDENCY-WORKER
- Kaynak / build / paket kimliği: runtime-binary-worker exacttools; containerhenüzüretilmedi
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: FAILED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.05-S1 — Hazırlık
- [x] Trivy0.74DB yeni privatecachee güncellendi; externalGobinaryler matchedfinding iletarandı.
- Gözlenen: KubeViewcandidate01binary0finding; resmiHubble1.20.2=17advisory; minikube1.38.1=97.
- Kanıt: runtime-binary-worker/REPORT.md; trivy-db-update.log.
- Sonuç: container/source/externaltoplamı aynısayılmaz; araçlar ayrıtriyajda.

#### TEST-07.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- 11 Kasım ek SCA: owned collector1.20.2 ARM64 524component/advisory rows/105IDs;131High rows/20HighIDs,0Critical. Resmi1.20.4 adayında aynıDB/platform:125rows/59IDs;15High rows/3HighIDs. Hiçbir aday image kurulmadı/çalıştırılmadı.
- Kalıntılar: x/net HTMLparser, apt/libapt, operator go-jose; erişilebilirlik/düzeltme açık, otomatik risk kabulü yok.
- Kanıt: artifacts/release-audit/ra-20261111/provider-image-worker/REPORT.md; artifacts/release-audit/ra-20261111/provider-patch-candidate-worker/REPORT.md
- Bu sonuç appDocker/finalmanifest taramasının yerine geçmez.

#### TEST-07.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- Bounded statik erişilebilirlik incelemesi: yalnız dört exact1.20.4 aday imajı network-none/read-only/Running=false containerlardan veri olarak çıkarıldı; kod çalıştırılmadı. On Go ELF dosyasının tam function-name tabloları ve üç ana binary raw-byte kontrolünde HTML parser ismi bulunmadı. Bu exact dosyalar için sınırlı link kanıtıdır; bütün x/net veya native/dynamic kod için genel istisna değildir.
- Kaynak: artifacts/release-audit/ra-20261111/provider-reachability-worker/REPORT.md; pcln.py; *-pclntab.json; binary-string-crosscheck.json.

#### TEST-07.05-S4 — Bulgular ve düzeltme
- Bulgu: externalscanner semboleşleşmesi actualkomutexploitkanıtı değildir.
- Hubble1.20.4 adayı17→3kaldığıiçin temizdiye kabul edilmedi.
- Aynıtag customHubbleGo1.27.4/net0.62/cel0.30 tekderlemede0finding;RootSHA doğruladı,CLIhelpuyumuPASS;gerçekmTLS/provideraçık.
- Minikube1.39resmibinary97→39matchedadvisory;ilkRoot325catalogsayımı yanlıştı, geçmişJSONkorundu,doğrufindingjoinworkerda.
- Riskkabulü/kapama: verilmedi; containerveexternalfeasibility incelemesi sürüyor.

- DEP-002: provider bağımlılıklarında High eşleşmeleri; exacttetikleyici ve sürüm/erişilebilirlik değerlendirmesi raporda. Override/ignore uygulanmadı.
- DEP-003: özel minikube.3 go-jose4.1.4→4.1.6 yeniHigh; bir darpatched.4build görevi verildi, henüz retest sonucu yok.

- govulncheck1.9.0 stripped ELF için sembol bilgisi yoksa bilinen advisory fonksiyonlarını konservatif olarak rapora ekleyebilir. Relay/agent JSON fonksiyon adları gözlenen link kanıtı diye kullanılmadı; scanner kaynak excerpt/hash ile sınırlama doğrulandı.
- Operator go-jose RSA private JWK parser'ı gerçekten linkli. Saldırgan girdisinden çağrı zinciri kanıtlanmadı; aynı commit'teki SPIRE girişinin X509Source kullanması tek başına JWKS erişimini kanıtlamaz. Bulgu açık; risk kabulü veya patch uygulanmadı.
- APT chart/default startup yollarında çalıştırılmıyor; paket hâlâ taranan etkilenmiş sürümde. Runtime bakım yolu incelenmedi. Mevcut1.20.2 lab ayarları çalışan1.20.4 adayı kanıtı değildir.

12 Kasım tarihsel kanıt inceleme/checkpoint: Resmi1.20.4 metadata incelemesi: gözlem11Kasımda daha yeni stable1.20.x bulunmadı; immutabletag/Helm/source/advisory eşleşti. Kaynak floor gerçek imaj düzeltmesi değildir; üç HighID açık. Mevcutlab1.20.2 değiştirilmedi. Kanıt: artifacts/release-audit/ra-20261111/provider-official-patch-review-worker/REPORT.md; SHA256SUMS bütün satırları root tarafından doğrulandı. İlk başarısızlıklar değiştirilmedi.

12 Kasım tarihsel kanıt inceleme/checkpoint: Candidate1 OpenPGP advisorysi unsafeOpenPGP modülüne ait; fullpclntab172260entry/184657name içindeOpenPGPyok. SCTPsinkgerçeklinked fakat operatorattacker-ingress kanıtlanmadı. Waiver yok; exactcrypto/gopacket iki floor önerildi; kaynak+advisory/proposedpatch ayrı korunur. Kanıt: artifacts/release-audit/ra-20261111/provider-operator-findings-review-worker/REPORT.md; SHA256SUMS bütün satırları root tarafından doğrulandı. İlk başarısızlıklar değiştirilmedi.

12Kasım teknikadjudication: exactAPTcandidateCilium8x/netHighrow için GO-2026-6860 affectedhtmlpackage/7symbol tamGoentry+funcname/inliningtablolarında yok; mevcut8ELFSHA eski8/13Ciliumscopeileaynı. OperatorgopsUnknownCVE-2026-39824 primaryWindowsgoos/windowspackageyi kapsar; gerçekLinuxARM64ELF4256entry/6089nameiçinkodyok. Exact9rowNOT_AFFECTED/FALSE_POSITIVE_MODULE_MATCH; moduleversionsbelowfloor/scannerrawsilinmedi, waiver/globalclean/13/13scopeiddiasıyok. ParserilkSyntaxFAILayrı korunur; peakRSS333856768B. Teknikveri360snönce, rapor374.242/360(+14.242)deadlineNotExceededfalse. Root13/13SHA+primaryadvisory/fulltableprojection/rapor inceledi. Kanıt: artifacts/release-audit/ra-20261112/provider-go-adjudication-worker/REPORT.md. Diğerprovider/Medium/Unknown/mainCVE/TLS/lisans/paketkapıları kapanmaz.

OSMediumattempt01FAIL: exactlocalparentFROM/COPY/signeddebsSHA+strict2packagesimulationgeçti, actualapt-get --no-download local.deb zlibepoch-encodedpathnameinternalerror exit100/1.943sn. EnvoyNOTRUN, adayfinalimage/scannerüretilmedi. ExactRUNownership/2CPU/4GiB/networknonevecleanupyokluğudoğrulandı. Root18/18SHAveilkraporokudu; bufailedattemptdüzeltmebaşarısıdeğildir. Onaylıtekv2retry ayrıattempt02altındadır; ilk18fileimmutabledir. Kanıt: artifacts/release-audit/ra-20261112/provider-os-medium-worker/attempt01/REPORT.md.

#### TEST-07.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

- DEP003 dar özel minikube patched.4 build+version/help PASS. Yalnız go-jose4.1.4→4.1.6; exactbinary98e42baf… ve214component SBOM:8→5row/3→2HighID, üçgo-jose kaydı kalktı. KalanDockerdaemon/distribution/main/devel kapsamı ayrı. Gerçek worker sağlama henüz yapılmadı.
- Kanıt: artifacts/release-audit/ra-20261111/minikube-jose-patch4-worker/REPORT.md; RECIPE.md; binary-identity.json; trivy-sbom-summary.json

12 Kasım tarihsel kanıt inceleme/checkpoint: Privateoperatorcandidate1 ELF7bba6629… gerçekten üretildi; x/net0.62+jose4.1.6/Go1.26.11. İlkELFscanner0Results BLOCKED ve ilkSBOMflagFAIL korunur; düzeltilmiş164componentinventoryde MediumSCTP+UnknownOpenPGP kaldı. İmaj/kuruluoperator/TLS kabulü değildir. Kanıt: artifacts/release-audit/ra-20261111/provider-operator-candidate-worker/REPORT.md; SHA256SUMS bütün satırları root tarafından doğrulandı. İlk başarısızlıklar değiştirilmedi.

12 Kasım tarihsel kanıt inceleme/checkpoint: Privateoperatorcandidate02 ELF9cde6566… gerçekbuildPASS; cryptoexactpseudo+gopacket1.7.2 dışında incrementalgraph değişmedi. AynıDB164componentinventory0finding, fullimage/anaCiliummodülü kapsandı demek değildir. KısıtlıLinuxARM64Docker --version gerçekexit0 veexactCIDcleanup; henüz labinstall/TLS/controller kabulü yok. Kanıt: artifacts/release-audit/ra-20261111/provider-operator-candidate02-worker/REPORT.md; SHA256SUMS bütün satırları root tarafından doğrulandı. İlk başarısızlıklar değiştirilmedi.

12Kasım yeni gerçekmergedimage: localoperator image02 descriptor0f5f919c…; exactofficialARM64manifestf72cbe83… üstünecandidate029cde6566…COPY. GerçekTrivyikiGoELFtarget/OSyok: baseline2High/4Medium/2Unknown → candidate0High/0Medium/1Unknown(gopsWindowsadvisory, açık). Operator scratch/APTyok; Cilium/EnvoyAPTkapısı ayrı. CA/gops/license/config/modesaynı; +114819234B uncompressedCOPYlayer, eskioperatorlowerlayerkalır. --version constrainedexit0, exactcontainercleanup. 38/38artifact-relativeSHArootkontrolüPASS. Bu finalcontroller/TLS/lab/lisans/kaynağınanaCVEkapsamı kabulü değildir. Kanıt: artifacts/release-audit/ra-20261112/provider-operator-image-worker/REPORT.md.

12Kasım APT-only localcandidates: Cilium107f5725…resolute apt/libapt3.2.0→3.2.1ubuntu0.1; Envoy5872d9d1…noble2.8.3→2.8.4ubuntu0.1. SignedUbuntuInRelease/gpgv+by-hashPackages ile exact4debSHA doğrulandı. Nobleilkmutableindexhashmismatchreddedildi/korundu. Yalnız2paket/image,noRemv/noekdep; config/layerprefix/providerbinary/CA/license/sourcekeySHAaynı. AynıDB realOS124+13Go/Cilium,95+1Go/Envoy; CVE-2026-1095184rowgiderildi. KalanCilium8High/64Medium/6Low/4Unknown, Envoy0High/23Medium/4Low. Highx/netadjudicationayrı; taramaPASSfalseclean/genelgatekapanışıdeğil. Actual18.755sn/600, exact15jobcontainer/supervisorcleanup. Root107/107SHAdoğruladı. Kanıt: artifacts/release-audit/ra-20261112/provider-apt-images-worker/REPORT.md.

12Kasım OS Medium corrected attempt02: actuallocal imagebuild+fullscanPASS. Ciliumpcre2+zlib9Mediumrow, Envoypcre2 7Mediumrow giderildi; ek/değişenhedefdışıtuple0. Config/layerprefix/provider/native/CA/licenseSHAaynı; GoJSON13+1targetaynı. KalanrawCilium8High/55Medium/6Low/4Unknown, Envoy16Medium/4Low; hiçbirglobalignore/waiver yok. LocalimageID10169bb9…/4e6caf59…, engine+721773/+533459B; lowerlayers eski dosya/deb tutar. Tekretryactual--no-download kaldırır, networknone+signedhash/simülasyon/noRemv/allowlist korunur. Actual8.059sn, toplam524.169/600sn. Kanıt: artifacts/release-audit/ra-20261112/provider-os-medium-worker/attempt02/REPORT.md.

#### TEST-07.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

- [x] Dört owned extraction containerı exact ID/owner guard sonrası silindi; hiçbiri başlatılmadı. Binaryler private .git alanında, yalnız küçük rapor/kaynak/receipt verileri artefakttadır. Image cache korunur, kullanıcı containerlarına dokunulmadı.
- [x] Root rapor/parser/correction kaydını okudu;50checksum doğruladı. İlk startswith-only sonuç ve erken vendor-prefix açıklaması superseded olarak korunur; geçerli kanıt diye kullanılmaz. Bağımsız profesyonel üçüncü taraf inceleme değildir.

APTjoblocalimages/contextdurdurulmuşyereldetutulur; registry/CNI/currentpins/labdeğişmedi. Operatorcandidatebinary9cde…/image0f5f…aynı. EngineboyutartışıCilium1847434B/Envoy1628057B; uncompressedlayer5447680/5099520B ayrıölçüm. Runtime/TLS/anaCVE/lisans ve kalanseveritykapılarıaçık.

12Kasım ikinciinceleme: providerworker rawfullJSONdiff/93remaining+16removedCSV/targetdışıtuple/GoJSON/config/layer/selectedELFasset/signature-receipt/retry ve cleanupkayıtlarını yeniden kontrol etti;64+18+107SHA doğrulandı. Rootattempt0264SHAve2reviewSHA/ikiREPORTokudu. EnvoyshortRUNliveinspect/fullCIDyokluğu aynen korunur; recorded6container/7PIDabsence yeni liveCNI kabulü değildir. Yerelimageskurulmadı/yayımlanmadı, current1.20.2/pinsaynı. Kanıt: artifacts/release-audit/ra-20261112/provider-os-medium-second-review-worker/REPORT.md.

#### TEST-07.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar: FAILED (tam ilan edilen kapsam). Yerel operator/APT/pcre2/zlib düzeltmeleri kendi dar taramalarında doğrulandı; eski başarısızlıklar korunur. Kurulu1.20.2 provider/finalKubeViewimage/manifest/paket/native-source/lisans/kalantaramabulguları ve gerçek yeniTLS/CNI kurulumu kabul edilmedi.
- Raw8High exactELFadjudication ayrı, globalignore/risk kabulü yok. İmaj/kaynak/komut/config/dağıtım yolu değişince ilgili kapılar yenilenir.

### TEST-07.06 — Çalışma ağacında sır taraması

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Çalışma ağacında sır taraması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + KV-DEPENDENCY-WORKER ikinci inceleme
- Kaynak / build / paket kimliği: source-checkpoint01 runtime + audit artifacts; scanner8.30.1
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:46:51.372718+03:00
- Bitiş zamanı: 2026-11-11T13:46:51.372718+03:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.06-S1 — Hazırlık
- [x] Yalnızrepo workingtree,redact100,90s/4MiB ilk sınır.
- Yapılan/komut: gitleaks dir . --redact=100 --timeout90 --max-target-megabytes4 (ayrı flags rawlogda).
- Gözlenen:509.82MB/24.6s,1451aday,98skippedlarger files.
- Kanıt: secrets-worktree.log; secrets-worktree-redacted.json (bu run).
- Sonuç: sınır kaydedildi.

#### TEST-07.06-S2 — Normal kullanım / pozitif kontrol
- [x] Tüm1451aday ayrıworker tarafından kaynak/üreticiyle sınıflandırıldı.
- Beklenen: hash gibi görüneni otomatik geçme.
- Gözlenen:1161SHA256,13keyHash,10generationUUID,2resourceUID,189publicGitmetadata,76ölçümgroupkey;unresolved0.
- Kanıt: secret-review/worktree/REPORT.md; classified-findings.json
- Sonuç: credential adayı kalmadı.

#### TEST-07.06-S3 — Negatif / sınır / arıza kontrolü
- [x] İlkboyutsınırında kalan13JSON/txt dosya ayrı20s/file bütçesiyle tarandı.
- Beklenen: bunlar taranmadan text kapsamı temiz sayılmamalı.
- Gözlenen:13/13exit0,0finding,timeout0;binary/video/archive bu text fazı dışındadır.
- Kanıt: secrets-large-text.json; secrets-large-text/; secrets-positive-control.json
- Sonuç: plaintext boyut boşluğu kapandı; archive/binary paket fazlarında.

#### TEST-07.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği:1451 teknik sınıflandırılmış scanner yanlış pozitif; gerçek authsecret yok.
- Değişiklik: ignore veya kullanıcı verisi silme yok.
- Kök neden: provenance/kimlik/gruplama alan isimleri heuristic eşleşmesi.

#### TEST-07.06-S5 — Tekrar test ve regresyon
- [x] Root ikinci inceleme ve13büyüktext supplement sonuçlarını kontrol etti.
- [x] Detector sentetikgithub-pat pozitifkontrolü PASS.
- Ürün retesti: NOT_APPLICABLE; ürünbulgusu yok.
- Sonuç ve kanıt: secrets-positive-control.json; secret-review/worktree/review-manifest.json.

#### TEST-07.06-S6 — Temizlik ve inceleme
- [x] Sahte pozitif token dosyası temizlendi.
- [x] Exactscan findingleriredakte vehashli saklandı.
- [x] Root+worker incelemesi tamamlandı.
- İnceleyen: ANA MÜDÜR + KV-DEPENDENCY-WORKER; profesyonel3.taraf değildir.
- Kalan sınırlar: binary/video/archive/privateharicistate bu plaintext fazı dışında; scanner unknownmiss mümkün.

#### TEST-07.06-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar gerekçesi: tümtext kapsamındaki adaylar ve büyüktext boşlukları değerlendirildi; bilinmeyen açık/sır garantisi yok.
- Yeniden çalıştırma: yeni runtime/config/kanıt içeriği veya finalpackage.

### TEST-07.07 — İlgili Git geçmişinde sır taraması

- Kategori: CAT-07.
- Amaç / kullanıcı riski: İlgili Git geçmişinde sır taraması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER bağımsız redakte inceleme; root tarama
- Kaynak / build / paket kimliği: başlangıç36d5b8f tüm84commit/refs;49999815 artifact-only kayıt eklemesi ayrıca final arşivde taranacak
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:35:03.936403+03:00
- Bitiş zamanı: 2026-11-11T13:46:51.372718+03:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.07-S1 — Hazırlık
- [x] Yerel Git geçmişi tarama hedefi olarak doğrulandı.
- Yapılan: gitleaks8.30.1 git --all;90s üst sınır,redact100, harici yükleme yok.
- Beklenen: olası sırlar değerleri görünmeden sınıflandırılmalı.
- Gözlenen:84commit/324.19MB,11.4s;386generic-api-key adayının tamamı tarihsel benchmark/artifact dosyalarında.
- Kanıt: artifacts/release-audit/ra-20261111/secrets-history.log; secrets-history-redacted.json
- Sonuç: henüz temiz/güvensiz kararı verilmedi; tüm adaylar triyajda.

#### TEST-07.07-S2 — Normal kullanım / pozitif kontrol
- [x] Yerel84commit/324.19MB tarandı;386aday içerik/üretici koduyla sınıflandırıldı.
- Beklenen: herfinding açıklanmalı, gerçeksır outputa çıkmamalı.
- Gözlenen:365source/assetSHA256,13idempotencyhash,6generationUUID,2resourceUIDlog;unresolved0.
- Kanıt: secret-review/REPORT.md; classified-findings.json; producer-verification.json (bu run dizini).
- Sonuç: bu tarihsel kapsamda rotationgerektiren authsecret adayı yok.

#### TEST-07.07-S3 — Negatif / sınır / arıza kontrolü
- [x] İzole sahte github-PAT biçimli pozitif scanner kontrolü çalıştırıldı.
- Yapılan: yalnız .git geçici dosya; sağlayıcıya gönderilmedi, sonra silindi.
- Beklenen: github-pat kuralı eşleşmeli.
- Gözlenen:exit1,github-patfinding;redact100.
- Kanıt: artifacts/release-audit/ra-20261111/secrets-positive-control.json; secrets-positive-redacted.json
- Sonuç: detector pozitif kontrolü geçti.

#### TEST-07.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği:386scanner adayının tamamı teknik bağlamla yanlış pozitif olarak sınıflandırıldı.
- Önem/kök neden: hash/UUID alanlarının anahtar adları genel-api-key kuralına takıldı;2log da resourceUID.
- Değiştirilen dosya: yok; ignore,history rewrite veya credential silme yapılmadı.

#### TEST-07.07-S5 — Tekrar test ve regresyon
- [x] Root tümfindingcount/rule/path dağılımı ve üretici ispatlarını inceledi.
- [x] Sahte pozitif kontrol PASS.
- Ürün sorunu retesti: NOT_APPLICABLE; authsecret bulunmadı.
- Sonuç ve kanıt: secret-review/review-manifest.json + producer-verification.json.

#### TEST-07.07-S6 — Temizlik ve inceleme
- [x] Geçici pozitif token dosyası silindi; hesap/credential yaratılmadı.
- [x] Redakte scan ve386fingerprint sınıflandırması kaynak kimliğiyle saklandı.
- [x] KV-DEPENDENCY-WORKER bağımsız ikinci inceleme tamamlandı; aynıajan sistemi.
- İnceleyen: worker ve ANA MÜDÜR.
- Kalan sınırlar: scanner misses/diğer özel state kapsamı yok; yeni commit/final package ayrıca taranır.

#### TEST-07.07-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar gerekçesi:84commit taraması,386finding tektek teknik sınıflandırma ve pozitif kontrol.
- Yeniden çalıştırma: yeni sırşüphesi/ilgili commit veya scannerkuralı değişimi.

### TEST-07.08 — Son dağıtım arşivlerinde sır taraması

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Son dağıtım arşivlerinde sır taraması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-07.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-07.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-07.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-07.09 — SBOM ve dependency envanteri

- Kategori: CAT-07.
- Amaç / kullanıcı riski: SBOM ve dependency envanteri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + dependency worker
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:20:17.412070+00:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.09-S1 — Hazırlık
- [x] Exactbinary buildinfo tabanlı104Hubble/214minikube bileşen CycloneDX envanteri hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/provider-patch-candidate-worker/sbom-provenance.json

#### TEST-07.09-S2 — Normal kullanım / pozitif kontrol
- [x] AynıTrivyDB SBOM analizi: Hubble0eşleşme; minikube8row/3HighID, go-jose yeniHigh.
- Sınır: directMachO fs analizörü bileşen tanımadı, BLOCKED_GOBINARY_COVERAGE. SBOM main/devel/native kapsamaz; finalürün/containerSBOM kabulü açık.

#### TEST-07.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-07.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-07.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-07.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: araç envanteri var; final paket/source/SBOM bağlantısı ve container envanteri tamamlanmadı.
- Yeniden test: dependency/binary/paket değişimi.

### TEST-07.10 — Bağımlılık düzeltmesi build/işlev regresyonu

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Bağımlılık düzeltmesi build/işlev regresyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-07.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-07.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-07.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.



### TEST-07.11 — Yeni Hubble CLI kaynak, derleme ve araç güvenliği

- Kategori: CAT-07.
- Amaç / kullanıcı riski: Bağımlılık düzeltmesi build/işlev regresyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: Go security/govulncheck; NIST SSDF1.1 (süreç çerçevesi,sertifika değil); CAT07. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER
- Kaynak / build / paket kimliği: Hubble1.20.4 commit3e268bbcc7243b90300debb6e5de3062656669ce; x/net.62 graph; binary yok.
- Ortam / kullanılan kimlik ve yetki: Private Go1.27.4 kaynak; no CLI/provider/cluster execution; tek build,8dk sınır.
- Başlangıç zamanı: Exact worker command/execution manifestinde.
- Bitiş zamanı: FAIL handoff13:45UTC; exact worker manifestinde.
- Durum: FAILED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.11-S1 — Hazırlık
- [x] Resmi tag/commit/tree/arşiv ve7130regularGitblob doğrulandı; eski kaynak/binary hashleri korunur.
- Kanıt: artifacts/release-audit/ra-20261111/hubble-1204-patch-worker/REPORT.md; RECIPE.md

#### TEST-07.11-S2 — Normal kullanım / pozitif kontrol
- [x] Tek graph update PASS: x/net.62 ve gerekli x/*closure; baselinecel-go.30/gRPC1.83.2 korunur.
- [ ] Binary/version/help/SCA pozitif sonucu yok.

#### TEST-07.11-S3 — Negatif / sınır / arıza kontrolü
- [x] Tek build kalan61.186sn sonunda SIGTERM; job8dk sınırı, peak537100288byte.
- Gözlenen: Cilium1.20.4/Kubernetes.36.5 indirme ve compile zamanı tüketti; API derleme hatası gözlenmedi, binary yok.
- Sonuç: FAILED bounded timeout; sonraki CLI/SCA SKIP, PASS değil.

#### TEST-07.11-S4 — Bulgular ve düzeltme
- Bu işte runtime bug/exploit gösterilmedi; özel CLI adayı tamamlanamadı. Ürün pini/cluster değişmedi.
- Somut sonraki soru: aynı exactgraph/ısınmış cache ile tek240sn warmbuild tamamlanır mı? Kör retry yok.

#### TEST-07.11-S5 — Tekrar test ve regresyon
- [ ] Retest henüz yapılmadı. Binary yokken version/help/tarama SKIP.
- Sonlu plan: en fazla1warmbuild240sn+60snverification; aynısource/modulehash; GOMAX1-2/-p1/RSS2GiB/free10GiB.

- Tekwarmretest FAILED:240snistenen/494.590snölçülen wall-time, no-binary, noAPIerror. Deadlineenforcementfail ve izlenmeyenaralık açık. Version/help/GoDB/SBOM SKIP. İlkFAIL34dosyası aynı.
- Rootpmset16:52:28ClamshellSleep, buildbaşlangıcından18.733snsonra;17:00:24DarkWake ve18:52:49fullWake kayıtlarıoverlap. Bu aktifCPUölçümü veya derleyicihatası kanıtı değil.
- Kanıt: artifacts/release-audit/ra-20261111/hubble-1204-warm-retest-worker/REPORT.md; result.json; ROOT_ENVIRONMENT_ADDITION.json; tested-warm-runner.py
- Daha fazla derleme otomatikbaşlatılmayacak; önce awake/izleme/sağlayıcı eşleşmesi yolu netleşmeli.

#### TEST-07.11-S6 — Temizlik ve inceleme
- [x] Build process sonlandı; binary üretilmedi; eski1.20.2özelCLI/source korunur.
- [x] Exactargv/log/resource/license/sourcehash kanıtları saklandı. Root raporu okudu; globalCLI veya cluster değişmedi.

#### TEST-07.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: FAILED bounded compile timeout; binary/CLI/SCA kapıları eksik.
- Yeniden test: yalnız yukarıdaki somut warmbuild sorusu için tek sonlu retest.

## CAT-08 — Portlar/erişim/TLS

### TEST-08.01 — Loopback IPv4/IPv6 ve LAN bind

- Kategori: CAT-08.
- Amaç / kullanıcı riski: Loopback IPv4/IPv6 ve LAN bind; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.4.1/V4.4.1 (loopback HTTP için uygulanabilirlik ayrıca); CAT08. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: candidate04 binary08bd0cee5a5d…; backend runtime4ec aynı
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T12:03:44Z
- Bitiş zamanı: 2026-11-11T12:06:00Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-08.01-S1 — Hazırlık
- [x] Ownedloopback19849 boş; ayrıprivate config/data ve bilinenbinary.
- Yapılan: iki explicit replaymode listener; normalmode nonloopback negatifinde explicit boş kubeconfig.
- Sınır: ağ taraması yok, başka süreç kapatılmadı.

#### TEST-08.01-S2 — Normal kullanım / pozitif kontrol
- [x] Gerçek LISTEN varsayılan127.0.0.1:19849 ve açık IPv6[::1]:19849; HTTP200normalcontexts.
- Kanıt: artifacts/release-audit/ra-20261111/bind-surface/result.json
- Sonuç: PASS; listenerguard aynıproductionmain.

#### TEST-08.01-S3 — Negatif / sınır / arıza kontrolü
- [x] YanlışHost403; replayLANconfigexit2; normalmode0.0.0.0tokensizexit1 (API_TOKEN gerekir).
- Gözlenen: porttaLISTENkalmadı.
- Kanıt: bind-surface/normal-lan-no-token-retest.json
- Sonuç: PASS; LAN port taraması yapılmadı.

#### TEST-08.01-S4 — Bulgular ve düzeltme
- Bulgu: ilk normalmode test driverı İngilizce loopback kelimesi aradı; Türkçe retmetni assertionFAIL verdi.
- Düzeltme: dildenbağımsız API_TOKEN/127.0.0.1 kontrolü; runtime değişmedi.
- Kanıt: bind-surface/normal-lan-first-driver-error.md

#### TEST-08.01-S5 — Tekrar test ve regresyon
- [x] Aynı normalmode negatif doğru assertion ile tekrarlandı, exit1/remainingListenerfalse.
- [x] IPv4/IPv6 normalGET ve yanlışHost kontrolü ayrı geçti.

#### TEST-08.01-S6 — Temizlik ve inceleme
- [x] Herownedapp SIGTERM/bekleme veya kendi retçıkışı; lsof19849boş.
- [x] Binaryhash/başlangıçbitiş kayıtlı.
- [x] Rootkomutlar ve rawçıktı incelemesi tamamlandı.
- Kalan sınırlar: externalTLS/proxy/forwardchild diğerfazlar.

#### TEST-08.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: defaultIPv4loopback, explicitIPv6 ve tokensizLANbaşlangıçreddi geçti.
- Yeniden test: CLIconfigure/mainlistener/TokenHostguard değişirse.

### TEST-08.02 — Dev/metrics/profiler/debug port yüzeyi

- Kategori: CAT-08.
- Amaç / kullanıcı riski: Dev/metrics/profiler/debug port yüzeyi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.4.1/V4.4.1 (loopback HTTP için uygulanabilirlik ayrıca); CAT08. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-08.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-08.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-08.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-08.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-08.03 — WS/forward/provider child lifecycle ve LISTEN cleanup

- Kategori: CAT-08.
- Amaç / kullanıcı riski: WS/forward/provider child lifecycle ve LISTEN cleanup; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.4.1/V4.4.1 (loopback HTTP için uygulanabilirlik ayrıca); CAT08. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-08.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-08.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-08.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-08.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-08.04 — Yanlış Host/Origin/proxy/redirect

- Kategori: CAT-08.
- Amaç / kullanıcı riski: Yanlış Host/Origin/proxy/redirect; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.4.1/V4.4.1 (loopback HTTP için uygulanabilirlik ayrıca); CAT08. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-08.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-08.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-08.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-08.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-08.05 — TLS chain/hostname/expiry/mTLS client reddi

- Kategori: CAT-08.
- Amaç / kullanıcı riski: TLS chain/hostname/expiry/mTLS client reddi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.4.1/V4.4.1 (loopback HTTP için uygulanabilirlik ayrıca); CAT08. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-08.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-08.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-08.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-08.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-08.06 — Plaintext/insecure fallback ve güvenilir özel endpoint ayrımı

- Kategori: CAT-08.
- Amaç / kullanıcı riski: Plaintext/insecure fallback ve güvenilir özel endpoint ayrımı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.4.1/V4.4.1 (loopback HTTP için uygulanabilirlik ayrıca); CAT08. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-08.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-08.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-08.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-08.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-08.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-09 — Session/CSRF/WebSocket

### TEST-09.01 — Session/nonce entropy/expiry/revoke/replay

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Session/nonce entropy/expiry/revoke/replay; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER ve root ikinci kaynak/kanıt incelemesi
- Kaynak / build / paket kimliği: 9e87141b + test SHA8cbb0e03a58ea10e8401861fbeefc96ff27adb147a6211a562f9b0b6f17c9568. Runtime connection.go/server.go ve eski expiry testleri49999815 ile byte-eşit.
- Ortam / kullanılan kimlik ve yetki: UNIT/fake/in-process HTTP ve simulatedTLS request flag. Gerçek TLS/browser/8saat/cluster veya istatistiksel entropy deneyi değil.
- Başlangıç zamanı: 2026-11-11T13:42:17.092651+03:00
- Bitiş zamanı: 2026-11-11T17:33:17.319906Z; dar2top/2HTTP-TLSalt durum PASS,0SKIP, retry0, package0.721sn.
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.01-S1 — Hazırlık
- [x] Üretim operator() / resetOperator() / protect() akışı izlendi.
- Yapılan: sentetik kısa absolute expiry; gerçek8saat bekleme yok, dış hedef yok.
- Kullanılan komut / çalışma dizini: backend; go test ... -run TestReleaseOperatorResetCancelsAtAbsoluteExpiryWithoutAnotherRequest.
- Beklenen: süre bitince başka HTTP olmadan context iptali.
- Gözlenen: eski WithCancel250ms sonra da canlı kaldı; ayrı red log korundu.
- Kanıt: artifacts/release-audit/ra-20261111/session-expiry-red.log
- Sonuç: SEC-002 MEDIUM yeniden üretildi.

#### TEST-09.01-S2 — Normal kullanım / pozitif kontrol
- [x] UUIDv4 cookie/nonce biçimi ve küçük örnek freshness:8creation/16kimlik, değerler kayda alınmadı. Statik pinned uuidv1.3.0 kaynağı crypto/rand.Reader kullanır; repo override yok. Küçük örnek istatistiksel entropy kanıtı değildir.
- [x] HttpOnly/Strict/path/28800MaxAge ve HTTP/simulatedTLS Secure flagları doğrulandı. Geçerli grant ile fake PUT pozitif, yeni cookie+nonce sonrası açık regrant ile tekrar pozitif geçti.
- Access cookie configured API_TOKEN taşır; yeni UUID yönetim cookie/nonce ile karıştırılmadı. API_TOKEN server8h-expiring bearer session değildir.

#### TEST-09.01-S3 — Negatif / sınır / arıza kontrolü
- [x] Kısa expiry, yeni session deadline ve reset iptali sınandı.
- Yapılan:25ms sentetik expiry; reset eski ctxi iptal eder, yeni ctx özgün deadlinea bağlı.
- Beklenen: yeni/eskiscope lifetime uzamamalı.
- Gözlenen: context deadline ve iptal assertionları PASS.
- Kanıt: artifacts/release-audit/ra-20261111/session-scope-retest.log
- Sonuç: dar regresyon geçti; bütün session/replay/browser kapıları henüz kapanmadı.

- [x] Yeni expire/replay: geçerli grant sonrası fixture past-expiry; aynı operator cookie+nonce PUT403, past deadline reset context'i iptal durumda tutar; eski cookie re-enable403, yeni cookie altında eski nonce409, rejected paths fake workload mutation0. Yeni kimlik açık regrant olmadan yazamaz.

#### TEST-09.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: SEC-002.
- Önem derecesi ve gerekçesi: MEDIUM; önceden yetkili aktif stream session expiry sonrası HTTP gelmezse sürebiliyor.
- Kök neden: expiry yalnız operator() opportunistic cleanup ve yeni authorizationda kontrol ediliyordu.
- Değiştirilen dosya / fonksiyon: connection.go operator/resetOperator context.WithDeadline; public TTL ayarı veya yeni loop yok.
- Düzeltme çalışma farkı: mevcut candidate; root yaptı, worker bu ikinci testi araç engeli yüzünden yapamadı.

#### TEST-09.01-S5 — Tekrar test ve regresyon
- [x] İlk kısa expiry regresyonu tekrar çalıştırıldı.
- [x] Session/scope/grant komşu unitler PASS.
- [x] Odaklı race16top-level PASS.
- Sonuç ve kanıt: session-scope-retest.log; security-race.jsonl. Gerçek8saat stream/browser replay kabulü sayılmaz.

- [x] Eksik iki dar test tek koşuda2top/2alt durum PASS; retry0. Mevcut operator/revoke/scope grupları runtime/test hashleri49999815 ile aynı olduğu için yeniden çalıştırılmadı; önceki loglar kendi kaynağında bağlandı.
- Kanıt: artifacts/release-audit/ra-20261111/session-lifecycle-worker/REPORT.md ve result.json; mevcut session-scope-retest.log/expiry-red/security-race kaynakları korunur.

#### TEST-09.01-S6 — Temizlik ve inceleme
- [x] Listener/browser/cluster başlamadı, yalnız fake fixture ömrü; product/global RNG/init değişmedi. Root yeni test/rapor ve3checksum okudu. Önceki expiry/revoke/reset kanıtları exact runtime/test hash eşitliğiyle yeniden kullanılabildi; gereksiz tekrar yok.
- Gerçek8saat, RNG failure, gerçek TLS/browser cookie kalıcılığı, fiziksel gizlilik ve genel auth-key revocation kabulü yok. Statik erişim anahtarı sözleşmesi docs/SECURITY.md içinde açıkça ayrılır.

#### TEST-09.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI — mevcut operator session/nonce CSPRNG kaynak kullanımı, cookie flagları, absolute deadline/reset/revoke ve expired replay/regrant kontrolleri scoped UNIT kanıtla doğrulandı; eski SEC002 red→fix→retest/race tarihçesi korundu.
- API_TOKEN statik uygulama erişim anahtarıdır; access cookie8h browser retention server-side bearer expiry değildir. Bu faz onu per-user revocable authsession olarak onaylamaz; local-first tek operatör sınırı ve ayrı auth threat-model kapıları korunur.
- Değişen session/auth/crypto/expiry/cookie/context sözleşmesi ilgili retesti gerektirir. Native browser/TLS/8h gerçek runtime veya ASVS sertifikası iddia edilmez.

### TEST-09.02 — Backend read-only doğrudan endpoint

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Backend read-only doğrudan endpoint; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root kanıt/kaynak ikinci incelemesi
- Kaynak / build / paket kimliği: de0b41eb + yeni test helper SHA13c1c574e79918849c3da6f9f8bdd680ea946a91915b8fcef70c29f6b1adc96e. Ürün server/auth/resource kaynakları değişmedi.
- Ortam / kullanılan kimlik ve yetki: In-process production Register/protect, gerçek session/nonce/grant, typed/dynamic fake client ve sentetik nesneler. Gerçek Kubernetes/SPDY/provider veya browser testi değil.
- Başlangıç zamanı: 2026-11-11T17:08:05.794317Z (başarılı retest; ilk FAIL ayrı tutulur)
- Bitiş zamanı: 2026-11-11T17:08:12.024351Z;7top/27alt durum PASS,0SKIP.
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.02-S1 — Hazırlık
- [x] Listener/cluster açmadan in-process ServeMux ve sentetik net.Pipe canary hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/source-identity.json
- Sonuç: yalnız owned/sentetik fixture.

#### TEST-09.02-S2 — Normal kullanım / pozitif kontrol
- [x] Dar sentetik normal+negatif kontroller yürütüldü.
- Gözlenen: Forward create server/browser read-only403; gerçek API smoke genel create readonly403. Bütün mutasyon aileleri henüz ayrı doğrulanmadı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md ve preview-final-tests.log
- Sonuç: unit alt kapsam PASS, geniş faz açık.

- [x] Yeni paired unit kontrol: gerçek diagnostic+nonce+enabled grant tutulurken globalReadOnly=true yazmaları403 ile durdurdu. Write-enabled CRUD/restart/resize pozitifleri fake mutation'a ulaştı. Exec/forward pozitifleri Pod GET sonrası eksik transport503, provider pozitif unconfigured503: gerçek işlem başarısı iddiası yok.
- [x] Secret metadata GET200 kaldı; unsupported generic PATCH405 read-only guard başarısı sayılmadı. İlk gerçek owned Resources/Scale create403 kanıtları kendi source/run sınırlarında ayrıca korunur.

#### TEST-09.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Eksik gerçek/browser/final paket koşulları raporda açık tutulur; SKIP/PASS karışmaz.
- Gözlenen: ilkCONNECT405varsayım testiFAIL, standard authority404red ile düzeltildi; runtime bypass değildi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-inprocess-regressions-initial.log ve preview-final-tests.log

- [x] Create/replace/delete/action/resize PATCH/exec/previewcreate/rawforward/provision: geçerli session/grant ile açık read-only403 ve sıfır fake mutation; Pod transport preflight öncesi red doğrulandı. Mevcut management/nonce/namespace/drain ve capability komşu testleri7top/27alt durumla geçti.
- Gerçek cluster/SPDY/provider tamamlanması bu guard fazının kapsamı değildir; ilgili E2E fazları açık.

#### TEST-09.02-S4 — Bulgular ve düzeltme
- Yeni üretim bypass bulgusu yok. İlk provisioning fixture, httptest'in non-loopback192.0.2.1 adresinde localOperator tarafından daha erken reddedildi; yalnız sentetik RemoteAddr loopback yapıldı. Güvenlik kontrolü veya assertion gevşetilmedi.
- Yeni dosya backend/pkg/server/release_readonly_endpoints_test.go; ürün değişmedi. Root'un task faz numarası yanlıştı: worker09.03 yazdı, canonical09.02'dir. Raw rapor korunur ve ROOT_REVIEW.md eşlemeyi açıklar.

#### TEST-09.02-S5 — Tekrar test ve regresyon
- [x] İlk harness FAIL korundu; izinli tek loopback-fixture retesti7top/27alt durum,0SKIP ile geçti. GOMAXPROCS1/-p1/-parallel1/timeout30s; önceki ilk45s argv ayrı kayıtlı.
- [x] Write-enabled pozitifler ve komşu management/namespace/drain/capability yolları geçti. Bu guard deneyi gerçek API operation completion veya concurrency kabulü değildir.

#### TEST-09.02-S6 — Temizlik ve inceleme
- [x] Listener/browser/cluster/provider/app başlamadı; sahte clientlar test ömründe kapandı. Root kaynak/rapor ve5checksum doğruladı; yeni ROOT_REVIEW eşleme/sınır kaydını ekledi.
- Aynı ajan sistemi ikinci incelemesidir; bağımsız profesyonel pentest değildir.
- Açık existing-preview/global-flag transition testi yapılmadı; READ_ONLY startup yapılandırmasıdır ve geçerli üretim transition yolu saptanmadı. Yeni runtime toggling eklenirse bu yol ayrıca sınanmalı.

#### TEST-09.02-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI — doğrudan endpoint read-only guard ve ayrı write-enabled kontrolleri, sahte mutasyon/transport sayaçlarıyla doğrulandı. İlk hatalı harness denemesi korunur.
- Kapsam UNIT/synthetic HTTP + önceki gerçek create403 gözlemidir; gerçek exec/forward/provider veya bütün Kubernetes işlemleri geçti denmez. Ayrı TEST09.03 write-grant fazı kapanmaz. Server authorize/routes/session/read-only sözleşmesi değişirse retest gerekir.

### TEST-09.03 — Hedefe bağlı write-grant

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Hedefe bağlı write-grant; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER + ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7 backend runtime aynı; yeni release_origin_preview_test.go sentetik test farkı
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.03-S1 — Hazırlık
- [x] Listener/cluster açmadan in-process ServeMux ve sentetik net.Pipe canary hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/source-identity.json
- Sonuç: yalnız owned/sentetik fixture.

#### TEST-09.03-S2 — Normal kullanım / pozitif kontrol
- [x] Dar sentetik normal+negatif kontroller yürütüldü.
- Gözlenen: Preview current/missing/stale nonce, owner ve grant sınandı; gerçek cross-harbor grant/testleri ayrı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md ve preview-final-tests.log
- Sonuç: unit alt kapsam PASS, geniş faz açık.

#### TEST-09.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Eksik gerçek/browser/final paket koşulları raporda açık tutulur; SKIP/PASS karışmaz.
- Gözlenen: ilkCONNECT405varsayım testiFAIL, standard authority404red ile düzeltildi; runtime bypass değildi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-inprocess-regressions-initial.log ve preview-final-tests.log

#### TEST-09.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-09.04 — Foreign/null/eksik Origin politikası

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Foreign/null/eksik Origin politikası; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER; root ikinci kaynak/kanıt incelemesi
- Kaynak / build / paket kimliği: 4ec526b7 backend runtime; yeni test dosyası hash/source-identity.json
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T11:46:26Z
- Bitiş zamanı: 2026-11-11T11:54:54Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.04-S1 — Hazırlık
- [x] Gerçek Register/protect guardı, sentetik operatör/token ve listener açmayan net.Pipe hedefi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/test-runs.json

#### TEST-09.04-S2 — Normal kullanım / pozitif kontrol
- [x] Same-origin+cookie-only ve eksikOrigin CLI normalpreview/login geçti; WS doğruOrigin missingUpgrade400handshake kapısına ulaştı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-final-tests.log
- Sonuç: normal handler erişimi PASS, kurulmuşWS iddiası yok.

#### TEST-09.04-S3 — Negatif / sınır / arıza kontrolü
- [x] Foreign/null/scheme/port/FetchMetadata crosssite reddi; denied çağrı workload transport’a ulaşmadı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-final-tests.log ve existing-security-tests.log
- Sonuç: Origin politikası unit kabulü PASS. BrowserCSRF/DNSrebinding ayrı faz.

#### TEST-09.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: bu origin politikasında yeni bypass doğrulanmadı.
- İlk CONNECT405beklentiFAIL testin authority-form varsayımıydı; runtime değişmedi.

#### TEST-09.04-S5 — Tekrar test ve regresyon
- [x] CONNECT test girdisi/404 beklentisi düzeltildi; ayrıretest ve finaltest logları PASS.
- [x] Yetkili cookie-onlynormalpreview/login ve mevcutguardregresyonları korundu.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md

#### TEST-09.04-S6 — Temizlik ve inceleme
- [x] In-process bağlantı/transport temizliği; süreç/listener/lab oluşturulmadı.
- [x]16benzersiztoptest/29yenisubcase,0sonFAIL/0SKIP; kaynak kimliği ayrı.
- [x] Root kod+rapor+ilkFAIL ve sonlogayı okudu.
- Kalan sınırlar: gerçek saldırgan sayfa/WS/previewJS davranışları bu fazın dışındaki09.05/09.06/11.06’da açık.

#### TEST-09.04-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: Foreign/null/missingOrigin politika matrisi aktif backend guard yolunda geçti.
- Yeniden test: protect/Origin/FetchMetadata/router/preview auth değişirse.

### TEST-09.05 — Kontrollü saldırgan sayfasından CSRF

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Kontrollü saldırgan sayfasından CSRF; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER; rootikincikod/kanıtincelemesi
- Kaynak / build / paket kimliği: source496729e2backendruntimeaynı; iki yeniopt-in testhelperı source-identity.json
- Ortam / kullanılan kimlik ve yetki: SADECEfakeK8s+net.Pipeupstream/syntheticoperator; gerçekChromium156vePlaywrightWebKit27.2; owned19849
- Başlangıç zamanı: 2026-11-11T12:28:11Z
- Bitiş zamanı: 2026-11-11T12:36:35Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.05-S1 — Hazırlık
- [x] GerçekproductionServer.Register/proxyForward yolu, yalnızopt-in _test.gofixture;145sömür/19849freeguard, dışrequestrej,30requestbrowserlimit.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/source-identity.json

#### TEST-09.05-S2 — Normal kullanım / pozitif kontrol
- [x] İkibrowserdacookie-onlynormalpreview200; JSkoduçalışır, originopaque/null, cookie/localStorageSecurityError, openernull.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-02/result.json
- Sonuç: gerçekbrowserizolasyonPASS; gerçekK8s/SPDYdeğil.

#### TEST-09.05-S3 — Negatif / sınır / arıza kontrolü
- [x] Geçerlinoncebilinsebile6null-Originread/managementisteğitarayıcıbaşına403; bozukupstreamCSP/CORS/SetCookieoverrideve2darredirectprefixkontrolügeçti.
- Gözlenen: toplam16HTTP/browser; routeintercept14, takipredirectfarkıayrı.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/REPORT.md
- Sonuç: sınanmışcanarykapsamındaPASS, payload/dışexfilyok.

#### TEST-09.05-S4 — Bulgular ve düzeltme
- Bulgu: ilkWebKitdenemesindehelper302metadataCSPbekledi; final200opaqueCSPdoğruydu.
- Düzeltme: assertionuygulananfinaldokümanabağlandı; runtimekodudeğişmedi. İlkFAILkorundu.

#### TEST-09.05-S5 — Tekrar test ve regresyon
- [x] Ayrıattempt02ChromiumveWebKitPASS, firstattempt01FAILsilinmedi.
- [x] PozitifnormalpreviewveAPI-lookingredirectnegatifibirltekontrol edildi.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-01/result.json ve attempt-02/result.json

#### TEST-09.05-S6 — Temizlik ve inceleme
- [x] Fixtureexit0, ikibrowser/childkapalı,19849bindprobeportserbest.
- [x] Rawcredential/HTML/HAR/storage/noncevalueartefaktayazılmadı; sourcehashlervar.
- [x] Rootraporvesourceguard/sonuçlarıinceledi; aynıajansistemi profesyonelüçüncütarafpentestdeğil.
- Kalan sınırlar: arbitraryredirect/download/upgrade/trailer, nativeSafari, gerçekK8sRBAC/SPDY/normalUIayrıtestlerdir.

- Git checkpoint incelemesi: preview-browser-worker/source-identity.json içindeki10helper/runtime dosyası current9e87141b ile byte-eşit. Önceden tamamlanan browser job ve iki helper artık aynı kanıtla Git'e kaydedilir; yeni test çalışmış gibi sayılmadı.
- Reuse kanıtı: preview-browser-worker/ROOT_REUSE_REVIEW.json ve ROOT_REVIEW.md. Main UI-only CSP'nin sonraki değişikliği ayrı mux/route testinde doğrulandı; bu fake-upstream fixture o main handler'ı içermez. Default opt-in SKIP, browser PASS değildir.

#### TEST-09.05-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: buphaseinbrowsergüvensınırı sentetikotorite+gerçekbrowserilekanıtlandı. GerçekkümeE2Eolaraksayılmaz.
- Yeniden test: protect/Origin/session/proxyCSP/headerstrip/previewlinkdeğişirse.

### TEST-09.06 — Cross-site WS erişimi

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Cross-site WS erişimi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER + ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7 backend runtime aynı; yeni release_origin_preview_test.go sentetik test farkı
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.06-S1 — Hazırlık
- [x] Listener/cluster açmadan in-process ServeMux ve sentetik net.Pipe canary hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/source-identity.json
- Sonuç: yalnız owned/sentetik fixture.

#### TEST-09.06-S2 — Normal kullanım / pozitif kontrol
- [x] Dar sentetik normal+negatif kontroller yürütüldü.
- Gözlenen: Login/WS origin gate unit geçti; acceptedWS missing-upgrade400, gerçek handshake değil. Browser cross-site WS henüz çalışmadı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md ve preview-final-tests.log
- Sonuç: unit alt kapsam PASS, geniş faz açık.

#### TEST-09.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Eksik gerçek/browser/final paket koşulları raporda açık tutulur; SKIP/PASS karışmaz.
- Gözlenen: ilkCONNECT405varsayım testiFAIL, standard authority404red ile düzeltildi; runtime bypass değildi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-inprocess-regressions-initial.log ve preview-final-tests.log

#### TEST-09.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-09.07 — DNS rebinding sınırı

- Kategori: CAT-09.
- Amaç / kullanıcı riski: DNS rebinding sınırı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR; ikinci kanıt incelemesi providerworker sonrasında
- Kaynak / build / paket kimliği: runtimef32d6b23 privateprofilelock10 SHA5f1c22b9…; yeni product değişikliği yok
- Ortam / kullanılan kimlik ve yetki: Owned127.0.0.1:19844; fresh0700 appdata/eksik kubeconfig; providersdisabled; ilk token-free loopback modu
- Başlangıç zamanı: 2026-11-12T17:01:26.302697+00:00
- Bitiş zamanı: 2026-11-12T17:08:06.552467+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.07-S1 — Hazırlık
- [x] Frozenf32source ve binary5f1c22b9 SHA doğrulandı; fresh0700workspace/eksikkubeconfig/providersdisabled/noAPI_TOKEN; ownedIPv4loopback19844/PID/birth/PGID.
- Plan30s/≤60request/eşzamanlılık1/110msarası/≤2MiBresponse. GerçekDNSservisi/üçüncü taraf hedefi yok.

#### TEST-09.07-S2 — Normal kullanım / pozitif kontrol
- [x] Localhost/127.0.0.1/[::1]Host+aynıOrigin veCLIOriginyok contexts200;configuredfalse/readOnlytrue/contextsboş. Son yerelolumlu kontrol200; actualversioncommitf32eşleşti.
- GerçekIPv6listener sınanmadı;IPv4soketteIPv6Host kabulü ayrı birkontroldür.

#### TEST-09.07-S3 — Negatif / sınır / arıza kontrolü
- [x] Yedi saldırganHost/alternatifadres gösterimi hemaynıOrigin hemOriginyok403; forwardedheader spoof403; yabancı/opaqueOrigin403; dörtAPI/session/WSgirişi403.
- WSupgrade/gerçekbrowserDNS bu testte yok; post-rebindHTTPguard sınırı doğrulandı.

#### TEST-09.07-S4 — Bulgular ve düzeltme
- Ürünün30HTTPguard kontrolünde güvenlik sınırı ihlali yok. İkinci inceleme testyardımcısının ilkstartuphealth loopunu ortakrequestbudget dışında buldu; ilk koşu global30s/60requestgarantisi değildir.
- Sadeceyeni helper request() ortakcounter/deadline/responsetimeout ile düzeltildi. İlkprobe/result/SHA korunur. Publichealth/version/static guarddışıdır; kapsam korumalıAPI/session/WSentrydir.

#### TEST-09.07-S5 — Tekrar test ve regresyon
- [x] Aynı30kontrol correctedhelper ilePASS; startup dahil31actualHTTPrequest/3.759sn. İkiUNIT exhaustedcounter/expireddeadline /healthzyi bile ağöncesi reddetti.
- [x] Pozitifcontexts kontrolleri negatifmatrisin öncesinde ve tamamından sonra200; hergruptan sonra değil.
- Kanıt: artifacts/release-audit/ra-20261112/dns-rebinding-bounded-retest-root/REPORT.md +result.json+guard-unit.json. Ürün hatası/fixretesti değil, harnesssınırdüzeltmesidir.

#### TEST-09.07-S6 — Temizlik ve inceleme
- [x] Her iki exactPID/birth/PGIDapp exit0/processyok/19844free/binaryaynı. Privateboşworkspace tutuldu; kubeconfig/credential/Kubernetes/provider yüklenmedi.
- [x] Providerworker ilkkanıt30/30+3manifest/currentfrozen3source/binarySHAyı bağımsızinceledi; globalbudget/publicroute/IPv6/WS sınırlarını belirtti. Rootcorrectedhelperdiff/31request/2UNIT/retest/SHAyı inceledi.
- Aynıajan sistemi incelemesidir; profesyonel üçüncü taraf pentest değildir.

#### TEST-09.07-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- VERIFIED_DONE: token-free varsayılanlocal korumalıAPI/session/WSgirişinde post-rebindHTTPHost sınırı doğrulandı; gerçekDNS dönüşümü/browser/IPv6listener/tokenliuzak/WSupgradegenelgüvenlik kapıları değildir.
- Guard/SameOrigin/tokenmode/HTTPregister/binding veya ilişkiligüven sınırı değişirse retest.

### TEST-09.08 — Management enable endpoint koruması

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Management enable endpoint koruması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-09.09 — Context/credential değişiminde eski grant

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Context/credential değişiminde eski grant; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-09.10 — Token URL/history/referrer/log sızıntısı

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Token URL/history/referrer/log sızıntısı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V3.3.2/V3.3.4/V3.5.1/V4.4.2; CAT09. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-10 — API nesne/işlem yetkilendirmesi

### TEST-10.01 — Workspace/harbor/connection/namespace/GVR/UID/container/operation ID manipülasyonu

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Workspace/harbor/connection/namespace/GVR/UID/container/operation ID manipülasyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-10.02 — Başka limanın kaynağı read/write

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Başka limanın kaynağı read/write; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root ikinci inceleme
- Kaynak / build / paket kimliği: 36d5b8f baseline; düzeltme henüz uygulanıyor
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:27:50.872547+03:00
- Bitiş zamanı: —
- Durum: RETEST_REQUIRED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.02-S1 — Hazırlık
- [x] Sahip olunan sentetik fixture hazırlandı.
- Yapılan: httptest + fake Kubernetes; out-of-selector sentetik Secret, gerçek credential yok.
- Kullanılan komut / çalışma dizini: go test -p 1 ./pkg/server -run TestReleaseSecretDiscovery -count=1; backend.
- Beklenen: keşif eksik olsa da liman kapsamı dışındaki Secret reddedilmeli.
- Gözlenen: normal keşifte403; yalnız Secret keşif girişi kaldırılınca200.
- Kanıt: artifacts/release-audit/ra-20261111/security-worker/regression-secret-discovery.log
- Sonuç: başlangıç kusuru yeniden üretildi.

#### TEST-10.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.02-S3 — Negatif / sınır / arıza kontrolü
- [x] Eksik API Discovery ile kapsam aşımı sentetik olarak yeniden üretildi.
- Yapılan: aynı istek ve yetki; yalnız keşifte Secrets çıkarıldı.
- Beklenen:403, hassas alan dönmemeli.
- Gözlenen:200 ve sentetik canary döndü; test assertion FAILED.
- Kanıt: artifacts/release-audit/ra-20261111/security-worker/regression-secret-discovery.log
- Sonuç: SEC-001 HIGH doğrulandı; düzeltme/retest açık.

#### TEST-10.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: SEC-001.
- Önem derecesi ve gerekçesi: HIGH; seçili limanın selector kapsamı dışındaki Secret broad backend credential ile okunabiliyor.
- Kök neden: authorizeWorkspace hedef GVR keşifte bulunmadığında fail-open.
- Değiştirilen dosya / fonksiyon: backend/pkg/server/workspace_scope.go / authorizeWorkspace (worker sahibi).
- Düzeltme commit veya çalışma farkı: devam ediyor; henüz kapatılmadı.

#### TEST-10.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-10.03 — Aynı adlı farklı küme kaynağında işlem

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Aynı adlı farklı küme kaynağında işlem; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-10.04 — Reader→admin cache/metrics/Secret/flow sızıntısı

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Reader→admin cache/metrics/Secret/flow sızıntısı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-10.05 — Client capability/owner/admin enjeksiyonu

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Client capability/owner/admin enjeksiyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-10.06 — Generic YAML/patch kapsam aşımı

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Generic YAML/patch kapsam aşımı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-10.07 — Reveal/exec/forward/provisioning alternatif auth

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Reveal/exec/forward/provisioning alternatif auth; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-10.08 — Revoke sonrası watch/cached yanıt

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Revoke sonrası watch/cached yanıt; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + Backend worker (düzeltme/sentetik test); Provider worker (gerçek E2E test hazırlığı).
- Kaynak / build / paket kimliği: Product15770296056ca2629601dba540c04741e1822e0d; yeni opt-in helperSHA d667e550f8d4c53595585d6e5a03f8e38c356089ebef09fa4a7a1a019b1811cb. Normal UI/finalbinary kabulü değil.
- Ortam / kullanılan kimlik ve yetki: Ownedkvml-d32afbf634e8-a/gerçekK8s1.35.1; sealedQA56a3bd1d…;2gerçek600snSA tokenkimliği; production HTTP/loopbackWS19846. Credentials/Secretdeğerleri kayda alınmadı.
- Başlangıç zamanı: 2026-11-12T23:29:36.786379+03:00
- Bitiş zamanı: 2026-11-12T21:31:21.025074+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: Aynıcredential altında gerçekRBACiptali sonrası yeniHTTP/cacheokuması403 ve aktifWStüketicinin açıkfailedscope/trueclose ile sonlanması; başka yetkiliidentity200+UPDATE devamı; exactUID/source/cleanup kanıtı. Anlık/atomikiptal veya diğerakıştürleri kapsam dışı ayrı kapılardır.

#### TEST-10.08-S1 — Hazırlık
- [x] Ownedcluster/container/network, kube-system/marker/namespace UID+seal ve özgün2NodeUID doğrulandı. HazırlıkhelperFAILları ayrı saklandı; snapshotReadyTrue yerine freshNodeLease önkoşulu eklendi.
- İlk gerçek koşu NodeUnknown nedeniyle fixtureöncesiFAIL; önceki sonuç korunur. Workerın eksik ownedcontrolplaneDNS kaydı düzeltildi,3ardışıkReady+freshLease kontrolü geçti. NamespacePodSecuritypolitikası değiştirilmedi.
- Kaynak: product15770296 + exacttestSHA/plan. Fixtures:2SA/1Role/2RoleBinding/1çalışmayanPSAuyumluPod; birdenfazlaNode/VM/CNI kurulmadı.

#### TEST-10.08-S2 — Normal kullanım / pozitif kontrol
- [x] İki farklı gerçekTokenRequest kimliği SelfSubjectReview ile doğrulandı; normal login→workspace→connection→harbor→WS yolu kullanıldı.
- [x] AynısentetikPodUID snapshot+exactRV/annotationUPDATE iki kimlikte görüldü. Gatewayreadonly ve distinctclientID doğrulandı; fakeAPI/authresponse yok.

#### TEST-10.08-S3 — Negatif / sınır / arıza kontrolü
- [x] Yalnız A ownedRoleBindingi UID/currentRV ile silindi. AynıcredentialID ile gerçekSSARAllowedfalse; APIget403/gatewayget403, Bget200. SSARyanıtıHTTP403 varsayılmadı.
- [x] A exactPodGVR/namespaceforbidden/nonauthoritative/syncedfalseSTATUS sonra gerçekCloseError/EOF aldı; timeoutFAIL. Bilinen failure sonrasıcanary Adayayımlanmadı, BexactUPDATEaldı.
- Test18explicitSSAR/2controlledUPDATE ile sınırlı. Upstreamwatch lifetimeinstrumented değil; heartbeat-onlynedensellik iddiası yok.

#### TEST-10.08-S4 — Bulgular ve düzeltme
- SEC-WATCH-REVOKE-001 MEDIUM: unchangedcredential altında aktifwatch izninin yenilenmemesi strictfakeRED ile doğrulandı; root15770296 boundedasyncSSAR/writerpublicationbariyeri düzeltmesini pushladı.
- Frontend failedscopeSTATUS yok sayılması e73cb0da ile giderildi.
- Sabit5saday,64namespace/30QPS yanlıştimeoutunu önlemek için5s+2N/30s oldu; QPS/Burst ve kapsam düşürülmedi. İptalperiyodiktir; büyük-kapsampenceresi ve gerçekAPImaliyeti SECURITY.mdde açık.
- Roothelper/parser/şema/startup/PSAfixture/cleanupLIFO hataları tarihselkanıtta korunur; ürünarızası veya gizliPASS gibi sunulmaz.

#### TEST-10.08-S5 — Tekrar test ve regresyon
- [x] StrictRED→ilkGREEN→dar race→finalnonrace kaynak ayrımı korundu. Final8ana/13alt; race9ana/9alt(safReachablehelperöncesi), root23auth/31alt+6snapshot/watch ve frontend46test geçti.
- [x] Gerçektest:1anaPASS/0SKIP+paketPASS;15,332s test/18,574s Go+cleanup. İlkgerçekönkoşulFAIL0,024s/no fixtureolarakkorundu.
- Kanıt: active-watch-real-e2e-attempt02-root/{REPORT.md,plan.json,execution.json,safe-result.json,ROOT_ADJUDICATION.json}; ilkgerçekattempt01 ayrı.

#### TEST-10.08-S6 — Temizlik ve inceleme
- [x]6exactfixtureUID=6GET404absence; mainPassed/allSixFixturesAbsent/brokerEmpty/listenerClosed/namespaceNotDeleted/within180true, failedfalse.
- [x] Before/aftersource/finaltestSHA doğrulandı;4capturedownedprocessrefabsent. Bu tümkısayaşayanprocesslerin eksiksizcensusu değildir.
- [x] Farklıworker sanitizedkanıt/sourceSHA/UIDjournal/cleanup/statusları85sn içinde ikinci kez inceledi;10SHArootdoğruladı. Aynıajansistemi, profesyonelüçüncütarafpentestdeğil.
- [x] OwnedikiNodecontainer tekrarSTOPPED; sealedQAempty ve manualprofil/state/profilekorundu. Finalstop11,828s; diğerprojecontainerları dokunulmadı.

#### TEST-10.08-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- VERIFIED_DONE: dar gerçekRoleBinding/revoke→HTTP/cache403→aktifWSfailedscope/trueclose→izinlipeer200/UPDATE ve doğruUID/temizlik sözleşmesi.
- Kaynak/namespaceyetkisi, stream/writer/SSAR/credentialbroker, protokol veya ilgili dependency değişirse retestgerekir.
- Açık: periyodikiptalpenceresi/gerçekAPItoplamCPU, log/exec/forward/flowyenilemesi, browser/çokluliman/finalpaket ve genelrelease. BunlarbuPASSilekapanmaz.

### TEST-10.09 — Paylaşılan Node etki onayı

- Kategori: CAT-10.
- Amaç / kullanıcı riski: Paylaşılan Node etki onayı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.1/V8.2.2/V8.2.3/V8.3.1/V8.3.2; API1/API3/API5:2023; CAT10. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-11 — XSS ve önizleme

### TEST-11.01 — Stored/reflected/DOM XSS kaynak/log/event/import

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Stored/reflected/DOM XSS kaynak/log/event/import; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root ikinciinceleme
- Kaynak / build / paket kimliği: visual06 e582a5bd… (550400a3 frontend eşdeğer); TEST/REPLAY browser intercept, sourcehash manifestte
- Ortam / kullanılan kimlik ve yetki: Owned07app19847PID925; Chromium156; 7inertpayload/60toplamHTTP/≤64KiB; backend mutasyonu yok.
- Başlangıç zamanı: 2026-11-11T13:32:41.481Z
- Bitiş zamanı: Dar fixture işi 2026-11-11T13:35:52.123Z; fazın kalan kontrolleri açık.
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.01-S1 — Hazırlık
- [x] Exact owned07 PID/listener/binarySHA doğrulandı; API/WS yalnız tarayıcı içinde açıkTEST/REPLAY fixture ile intercept edildi. Kubernetes/veri/kamera/selectionhook enjeksiyonu yok.
- Komutlar/sourcehash: artifacts/release-audit/ra-20261111/untrusted-content-worker/source-and-results.json

#### TEST-11.01-S2 — Normal kullanım / pozitif kontrol
- [x] Normal finder/Node/Pod açma, plainad/UID, annotation/event/log/error pozitif metni ve arama test edildi; YAMLcopy/download kontrolleri enabled, tıklanmadı.
- Gözlenen: ilkiki denemede4ortakcheckPASS; üçüncü kalan5checkPASS. Tekkesintisiz9checkgreenrun iddiası yok.

#### TEST-11.01-S3 — Negatif / sınır / arıza kontrolü
- [x] İnert HTML/SVG/script/javascript/data veANSI/longstring denenmişyüzeylerde çalıştırılabilirDOM üretmedi; canaryrequest veexecutionflag0.
- İlkikiFAIL: Olaylar1 accessible adı içinhelperselector timeout; ürünXSS değil, rawFAILkorundu.
- Özel sınır: HTMLbenzeri fixturePodadı geçerli Kubernetesadı değildir, gerçekrename veya API doğruluğu sayılmaz.
- Stored/frontendDOM/log/event/error literal kontrolleri var; import/backend reflection ve gerçekK8s kaynak teslimi henüz ayrı çalışılmadı.

#### TEST-11.01-S4 — Bulgular ve düzeltme
- Bu dar fixture setinde exploit/bypass bulunmadı; genelgüvenlikgarantisi değil. Ürünkodudeğişmedi.
- Helperselector onarımı ayrı ilkFAIL/remainingPASS kayıtlarında. Main CSP script-src yokluğu ayrıdefense-in-depth incelemesine taşındı; XSSengeli CSP’ye yanlışbağlanmadı.

#### TEST-11.01-S5 — Tekrar test ve regresyon
- [x] Kalan event/log/error kontrolleri normalfinderile tekrar çalıştırıldı.
- [ ] Bu fazın tümkapsamı henüz doğrulanmadı.
- Sonuç: toplam9ayrıkontrolPASS; ilk2harnessFAILsilinmedi; sınırlı fixturekanıtı.

#### TEST-11.01-S6 — Temizlik ve inceleme
- [x] Tarayıcılar/contextler kapandı; applab değişmedi. Clipboard/hostwrite/outboundexfil yok.
- [x] Worker önemli PNG/video karelerini açtı; root annotation/logPNGlerini ayrıca açtı.
- Kanıt: artifacts/release-audit/ra-20261111/untrusted-content-worker/REPORT.md; owned-identity.json; attempt-*/result.json
- Orijinal77MiBWebM seti yerelde korunur; Gitaltkümesi PNG/JSON/log/helper/rapor; DELIVERY_SHA256SUMS ile doğrulanır.

#### TEST-11.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: dar frontendfixture senaryoları geçti; Stored/frontendDOM/log/event/error literal kontrolleri var; import/backend reflection ve gerçekK8s kaynak teslimi henüz ayrı çalışılmadı.
- Yeniden test: ilgili render/HTML/link/logparser/clipboard/CSP/sourcepayload değişimi.

### TEST-11.02 — Metin/markdown/HTML ve link şemaları

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Metin/markdown/HTML ve link şemaları; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root ikinciinceleme
- Kaynak / build / paket kimliği: visual06 e582a5bd… (550400a3 frontend eşdeğer); TEST/REPLAY browser intercept, sourcehash manifestte
- Ortam / kullanılan kimlik ve yetki: Owned07app19847PID925; Chromium156; 7inertpayload/60toplamHTTP/≤64KiB; backend mutasyonu yok.
- Başlangıç zamanı: 2026-11-11T13:32:41.481Z
- Bitiş zamanı: Dar fixture işi 2026-11-11T13:35:52.123Z; fazın kalan kontrolleri açık.
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.02-S1 — Hazırlık
- [x] Exact owned07 PID/listener/binarySHA doğrulandı; API/WS yalnız tarayıcı içinde açıkTEST/REPLAY fixture ile intercept edildi. Kubernetes/veri/kamera/selectionhook enjeksiyonu yok.
- Komutlar/sourcehash: artifacts/release-audit/ra-20261111/untrusted-content-worker/source-and-results.json

#### TEST-11.02-S2 — Normal kullanım / pozitif kontrol
- [x] Normal finder/Node/Pod açma, plainad/UID, annotation/event/log/error pozitif metni ve arama test edildi; YAMLcopy/download kontrolleri enabled, tıklanmadı.
- Gözlenen: ilkiki denemede4ortakcheckPASS; üçüncü kalan5checkPASS. Tekkesintisiz9checkgreenrun iddiası yok.

#### TEST-11.02-S3 — Negatif / sınır / arıza kontrolü
- [x] İnert HTML/SVG/script/javascript/data veANSI/longstring denenmişyüzeylerde çalıştırılabilirDOM üretmedi; canaryrequest veexecutionflag0.
- İlkikiFAIL: Olaylar1 accessible adı içinhelperselector timeout; ürünXSS değil, rawFAILkorundu.
- Özel sınır: HTMLbenzeri fixturePodadı geçerli Kubernetesadı değildir, gerçekrename veya API doğruluğu sayılmaz.
- img/SVG/script/javascript/data metinleri element/anchor olmadı; markdown/linkify varyantları kapsam dışı kaldı.

#### TEST-11.02-S4 — Bulgular ve düzeltme
- Bu dar fixture setinde exploit/bypass bulunmadı; genelgüvenlikgarantisi değil. Ürünkodudeğişmedi.
- Helperselector onarımı ayrı ilkFAIL/remainingPASS kayıtlarında. Main CSP script-src yokluğu ayrıdefense-in-depth incelemesine taşındı; XSSengeli CSP’ye yanlışbağlanmadı.

#### TEST-11.02-S5 — Tekrar test ve regresyon
- [x] Kalan event/log/error kontrolleri normalfinderile tekrar çalıştırıldı.
- [ ] Bu fazın tümkapsamı henüz doğrulanmadı.
- Sonuç: toplam9ayrıkontrolPASS; ilk2harnessFAILsilinmedi; sınırlı fixturekanıtı.

#### TEST-11.02-S6 — Temizlik ve inceleme
- [x] Tarayıcılar/contextler kapandı; applab değişmedi. Clipboard/hostwrite/outboundexfil yok.
- [x] Worker önemli PNG/video karelerini açtı; root annotation/logPNGlerini ayrıca açtı.
- Kanıt: artifacts/release-audit/ra-20261111/untrusted-content-worker/REPORT.md; owned-identity.json; attempt-*/result.json
- Orijinal77MiBWebM seti yerelde korunur; Gitaltkümesi PNG/JSON/log/helper/rapor; DELIVERY_SHA256SUMS ile doğrulanır.

#### TEST-11.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: dar frontendfixture senaryoları geçti; img/SVG/script/javascript/data metinleri element/anchor olmadı; markdown/linkify varyantları kapsam dışı kaldı.
- Yeniden test: ilgili render/HTML/link/logparser/clipboard/CSP/sourcepayload değişimi.

### TEST-11.03 — ANSI/control/clipboard sınırları

- Kategori: CAT-11.
- Amaç / kullanıcı riski: ANSI/control/clipboard sınırları; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root ikinciinceleme
- Kaynak / build / paket kimliği: visual06 e582a5bd… (550400a3 frontend eşdeğer); TEST/REPLAY browser intercept, sourcehash manifestte
- Ortam / kullanılan kimlik ve yetki: Owned07app19847PID925; Chromium156; 7inertpayload/60toplamHTTP/≤64KiB; backend mutasyonu yok.
- Başlangıç zamanı: 2026-11-11T13:32:41.481Z
- Bitiş zamanı: Dar fixture işi 2026-11-11T13:35:52.123Z; fazın kalan kontrolleri açık.
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.03-S1 — Hazırlık
- [x] Exact owned07 PID/listener/binarySHA doğrulandı; API/WS yalnız tarayıcı içinde açıkTEST/REPLAY fixture ile intercept edildi. Kubernetes/veri/kamera/selectionhook enjeksiyonu yok.
- Komutlar/sourcehash: artifacts/release-audit/ra-20261111/untrusted-content-worker/source-and-results.json

#### TEST-11.03-S2 — Normal kullanım / pozitif kontrol
- [x] Normal finder/Node/Pod açma, plainad/UID, annotation/event/log/error pozitif metni ve arama test edildi; YAMLcopy/download kontrolleri enabled, tıklanmadı.
- Gözlenen: ilkiki denemede4ortakcheckPASS; üçüncü kalan5checkPASS. Tekkesintisiz9checkgreenrun iddiası yok.

#### TEST-11.03-S3 — Negatif / sınır / arıza kontrolü
- [x] İnert HTML/SVG/script/javascript/data veANSI/longstring denenmişyüzeylerde çalıştırılabilirDOM üretmedi; canaryrequest veexecutionflag0.
- İlkikiFAIL: Olaylar1 accessible adı içinhelperselector timeout; ürünXSS değil, rawFAILkorundu.
- Özel sınır: HTMLbenzeri fixturePodadı geçerli Kubernetesadı değildir, gerçekrename veya API doğruluğu sayılmaz.
- ANSI CSI/OSC8/CR/backspace/bidi rawtext, komut veya link değil. Clipboard yazılmadı, bidi escape sunumu yok; tümclipboard sınırı kapanmaz.

#### TEST-11.03-S4 — Bulgular ve düzeltme
- Bu dar fixture setinde exploit/bypass bulunmadı; genelgüvenlikgarantisi değil. Ürünkodudeğişmedi.
- Helperselector onarımı ayrı ilkFAIL/remainingPASS kayıtlarında. Main CSP script-src yokluğu ayrıdefense-in-depth incelemesine taşındı; XSSengeli CSP’ye yanlışbağlanmadı.

#### TEST-11.03-S5 — Tekrar test ve regresyon
- [x] Kalan event/log/error kontrolleri normalfinderile tekrar çalıştırıldı.
- [ ] Bu fazın tümkapsamı henüz doğrulanmadı.
- Sonuç: toplam9ayrıkontrolPASS; ilk2harnessFAILsilinmedi; sınırlı fixturekanıtı.

#### TEST-11.03-S6 — Temizlik ve inceleme
- [x] Tarayıcılar/contextler kapandı; applab değişmedi. Clipboard/hostwrite/outboundexfil yok.
- [x] Worker önemli PNG/video karelerini açtı; root annotation/logPNGlerini ayrıca açtı.
- Kanıt: artifacts/release-audit/ra-20261111/untrusted-content-worker/REPORT.md; owned-identity.json; attempt-*/result.json
- Orijinal77MiBWebM seti yerelde korunur; Gitaltkümesi PNG/JSON/log/helper/rapor; DELIVERY_SHA256SUMS ile doğrulanır.

#### TEST-11.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: dar frontendfixture senaryoları geçti; ANSI CSI/OSC8/CR/backspace/bidi rawtext, komut veya link değil. Clipboard yazılmadı, bidi escape sunumu yok; tümclipboard sınırı kapanmaz.
- Yeniden test: ilgili render/HTML/link/logparser/clipboard/CSP/sourcepayload değişimi.

### TEST-11.04 — Aşırı uzun içerik ve render maliyeti

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Aşırı uzun içerik ve render maliyeti; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER; root ikinciinceleme
- Kaynak / build / paket kimliği: visual06 e582a5bd… (550400a3 frontend eşdeğer); TEST/REPLAY browser intercept, sourcehash manifestte
- Ortam / kullanılan kimlik ve yetki: Owned07app19847PID925; Chromium156; 7inertpayload/60toplamHTTP/≤64KiB; backend mutasyonu yok.
- Başlangıç zamanı: 2026-11-11T13:32:41.481Z
- Bitiş zamanı: Dar fixture işi 2026-11-11T13:35:52.123Z; fazın kalan kontrolleri açık.
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.04-S1 — Hazırlık
- [x] Exact owned07 PID/listener/binarySHA doğrulandı; API/WS yalnız tarayıcı içinde açıkTEST/REPLAY fixture ile intercept edildi. Kubernetes/veri/kamera/selectionhook enjeksiyonu yok.
- Komutlar/sourcehash: artifacts/release-audit/ra-20261111/untrusted-content-worker/source-and-results.json

#### TEST-11.04-S2 — Normal kullanım / pozitif kontrol
- [x] Normal finder/Node/Pod açma, plainad/UID, annotation/event/log/error pozitif metni ve arama test edildi; YAMLcopy/download kontrolleri enabled, tıklanmadı.
- Gözlenen: ilkiki denemede4ortakcheckPASS; üçüncü kalan5checkPASS. Tekkesintisiz9checkgreenrun iddiası yok.

#### TEST-11.04-S3 — Negatif / sınır / arıza kontrolü
- [x] İnert HTML/SVG/script/javascript/data veANSI/longstring denenmişyüzeylerde çalıştırılabilirDOM üretmedi; canaryrequest veexecutionflag0.
- İlkikiFAIL: Olaylar1 accessible adı içinhelperselector timeout; ürünXSS değil, rawFAILkorundu.
- Özel sınır: HTMLbenzeri fixturePodadı geçerli Kubernetesadı değildir, gerçekrename veya API doğruluğu sayılmaz.
- 61.943byte fixturelog yanıtı16.876karakter boundedgörünüm+truncation; CPU/GC/rendercost ölçülmedi, yük/perf fazı kapanmaz.

#### TEST-11.04-S4 — Bulgular ve düzeltme
- Bu dar fixture setinde exploit/bypass bulunmadı; genelgüvenlikgarantisi değil. Ürünkodudeğişmedi.
- Helperselector onarımı ayrı ilkFAIL/remainingPASS kayıtlarında. Main CSP script-src yokluğu ayrıdefense-in-depth incelemesine taşındı; XSSengeli CSP’ye yanlışbağlanmadı.

#### TEST-11.04-S5 — Tekrar test ve regresyon
- [x] Kalan event/log/error kontrolleri normalfinderile tekrar çalıştırıldı.
- [ ] Bu fazın tümkapsamı henüz doğrulanmadı.
- Sonuç: toplam9ayrıkontrolPASS; ilk2harnessFAILsilinmedi; sınırlı fixturekanıtı.

#### TEST-11.04-S6 — Temizlik ve inceleme
- [x] Tarayıcılar/contextler kapandı; applab değişmedi. Clipboard/hostwrite/outboundexfil yok.
- [x] Worker önemli PNG/video karelerini açtı; root annotation/logPNGlerini ayrıca açtı.
- Kanıt: artifacts/release-audit/ra-20261111/untrusted-content-worker/REPORT.md; owned-identity.json; attempt-*/result.json
- Orijinal77MiBWebM seti yerelde korunur; Gitaltkümesi PNG/JSON/log/helper/rapor; DELIVERY_SHA256SUMS ile doğrulanır.

#### TEST-11.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: dar frontendfixture senaryoları geçti; 61.943byte fixturelog yanıtı16.876karakter boundedgörünüm+truncation; CPU/GC/rendercost ölçülmedi, yük/perf fazı kapanmaz.
- Yeniden test: ilgili render/HTML/link/logparser/clipboard/CSP/sourcepayload değişimi.

### TEST-11.05 — CSP/frame-ancestors/MIME/nosniff

- Kategori: CAT-11.
- Amaç / kullanıcı riski: CSP/frame-ancestors/MIME/nosniff; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-SECURITY-WORKER + root ikinciinceleme
- Kaynak / build / paket kimliği: CSP ürün düzeltmesi d0be9753; csp07 binary SHA322bd5b5b4dc396c8b9b2c555ae7e2017ebe7a00d58dff221603a044d2389aa2, frontend550400a3/index0e478e0c. Son test dosyası SHA5248f666fa430a7d94d054098b755715ecb901463940b69ca6644ffb08f1221b.
- Ortam / kullanılan kimlik ve yetki: Owned07 TEST/REPLAY M5: Chromium156 headed, gerçek ANGLE Metal Apple M5; ayrı Playwright WebKit27.2 Apple GPU; DPR1,1440×940,20Node/300Pod. Go1.26.11 unit testleri. Native Safari, gerçek Kubernetes forward ve final paket değildir.
- Başlangıç zamanı: unitmanifest/red-meta ve browser2026-11-11T15:59:10.717Z
- Bitiş zamanı: Browser2026-11-11T16:40:09.318Z; son MIME/header testinin gerçek başlangıç/bitiş zamanı main-security-headers-final-worker/result.json içinde.
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.05-S1 — Hazırlık
- [x] MevcutfrontendHandler ve siblingAPI/WS/previewroute sınırı incelendi; frontend/embedded bytes eşit. Mevcutbundle inlinebootstrap/eval/Function/workerimport code göstermedi; bu statiktarama runtimekabulü değil.
- Kaynak/argv/provenance: artifacts/release-audit/ra-20261111/main-csp-worker/green-meta.json; main-csp-browser-worker/candidate.json

#### TEST-11.05-S2 — Normal kullanım / pozitif kontrol
- [x] Son main package8top/40alt durum PASS, SKIP0: gerçek frontendHandler HTML/SPA ve JS MIME, nosniff/DENY/no-referrer, başarılı GET gövdesi/HEAD ve eksik JS404 metin sınırı doğrulandı.
- [x] Actual binary/document/module/index/CSP, normal Bul mouse tamamlanması, tür filtresi ve exact Node/Pod UID, seçili app container log açılışı HTTP200/UID/protocol, ayarlar/ESC ve aynı canvas iki tarayıcıda geçti.
- Beklenmeyen CSP olayı/pageerror0. Log açılışı kanıtı ilk log satırı teslimi veya bütün log işlevlerinin kabulü değildir. Ölçülen click await süresi ürün gecikmesi benchmark'ı değildir.
- Kanıt: artifacts/release-audit/ra-20261111/main-csp-target-worker/REPORT.md ve main-security-headers-final-worker/REPORT.md.

#### TEST-11.05-S3 — Negatif / sınır / arıza kontrolü
- [x] Ana UI exact same-origin script/worker politikası, API/WS/encoded/canonical route sınırları ve ayrı opaque preview sandbox header bileşimi unit ile doğrulandı; global politika eklenmedi.
- [x] İki gerçek tarayıcıda zararsız inline script çalışmadı ve script-src-elem/enforce ihlali gözlendi. Blob Worker postMessage pozitif kontrolü, terminate ve URL revoke geçti.
- [x] Eksik JS isteği HTML200'e çevrilmedi;404 text/plain ve nosniff kaldı.
- Sınır: external-script browser canary NOT RUN. Exact script-src unit kontrolü ve inline browser gözlemi, external script çalıştırma/reddetme gözlemi diye sunulmaz. Preview composition sentetik transporttur; gerçek Kubernetes forwarded HTML ayrıca açık fazdır.

#### TEST-11.05-S4 — Bulgular ve düzeltme
- Değişiklik: backend/main.go frontendHandler birpolicysatırı; yeni security_headers_test.go. ÖncekiXSSsetinde bypassbulunmadı; bu defense-in-depth, exploitseverityiddiasıyok.
- RuntimeilkFAILdeNodepaneli açık; hangiilkhelperclicktakıldığı kaydedilmedi. Retesttamlog: Bulbuttonvisible/enabled/stable, performingclick aşamasındatimeout. Videotaildialogunaçıldığınıgösterir; awaittamamlanmadı.
- RootnedenCSP veyaGPU/CPU/harness olarak kanıtlanmadı; ürünhatası/başarıdiyevarsayılmadı.

#### TEST-11.05-S5 — Tekrar test ve regresyon
- [x] Mainunitred→smallfix→green7/32.
- [x] Tekizinlibrowserretst deFAIL; ilk49.373sn ve retst59.325sn, heartbeatgap0/boundedtrue fakat assertiongeçmedi. RetstCSPviolations[]/pageerrors[] yalnızulaşılanakış.
- [ ] WebKit, inline/blockWorker/log/settings ve gerçekK8sforwardJS açık.
- Kanıt: main-csp-browser-worker/result.json; retest-01/result.json; retest-action-log.txt; REPORT.md

- Yeni tanılama: ON dialog açıldı, click action done→scheduled navigation wait7007ms timeout. OFF dünya hazır önkoşuluna ulaşmadı: A/B INCONCLUSIVE, nedensellik sonucu yok.
- Chromium keyboard UID scroll-stability timeout. WebKit exact Node UID görünür; Pod app-0 ile Deployment app-0 için helper tür filtresi eksikti. İlk satır seçilmedi, PASS üretilmedi. Inline/Worker/log/settings hâlâ çalışmadı.
- Chromium GL renderer SwiftShader: Metal performans referansı değil. Dört context90sn altı/gap0/browserclosed; app ve Hubble kimlikleri aynı.
- Kanıt: artifacts/release-audit/ra-20261111/main-csp-diagnostic-worker/REPORT.md; result.json; identity-after.json.
- Sıradaki somut kontrol: normal load tamamlanması, doğru kind filtresi ve ilan edilen gerçek renderer koşulu. Ürün CSP geri çekilmedi.

- Yeni sonlu target koşusu: Chromium Metal ve WebKit normal akışları PASS; sırasıyla4.609/5.816sn tüm case, heartbeatgap0 ve context cleanup. Bu süreler CPU/FPS/physical-feedback ölçümü değildir.
- Son MIME/header testinde ilk HEAD404 body assertion harness hatasıydı: doğrudan ResponseRecorder, HTTP sunucusunun HEAD gövde bastırmasını uygulamaz. Yalnız başarılı HEAD body koşulu düzeltildi; ürün main.go değişmedi. İlk FAIL korundu, izinli tek retest8/40PASS,0SKIP,0.675sn.

#### TEST-11.05-S6 — Temizlik ve inceleme
- [x] Her iki context/browser kapandı; timer ve worker temizliği tamamlandı. Uygulama/lab süreç kimlikleri koşu boyunca aynıydı; root sonrasında yalnız owned uygulama/relay/node containerlarını durdurdu. Profiller ve private veri korunur.
- [x] Root helper/test farkını ve raporları okudu; target11 ve son header5checksum doğrulandı. Root Chromium Node ve WebKit Pod/log PNG'lerini gerçekten açtı; worker altı görüntüyü açtı.
- Aynı ajan sisteminin ikinci incelemesidir; profesyonel üçüncü taraf pentest değildir. Tam log teslimi, native Safari/Retina, gerçek Kubernetes preview JS ve fiziksel gecikme bu gate'in kapsamı değildir.

#### TEST-11.05-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI — mevcut UI header/MIME sınırı, route/preview bileşimi, normal Chromium/Metal ve WebKit kullanıcı akışı, inline reddi ve blob worker pozitif kontrolü geçti.
- Önceki SwiftShader/load/tür filtresi sorunlu denemeler tarihsel FAIL/INCONCLUSIVE olarak korunur; yeni PASS nedensel A/B veya performans iyileşmesi kanıtı değildir.
- Son header testindeki ilk ResponseRecorder HEAD404 harness FAIL'i ve düzeltilmiş tekrar ayrı saklandı. External script canary ve gerçek forwarded workload tarayıcı testi yapılmış sayılmadı. İlgili runtime/route/CSP/frontend değişikliğinde retest gerekir.

### TEST-11.06 — Workload preview HTML/JS yönetim origin izolasyonu

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Workload preview HTML/JS yönetim origin izolasyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER; rootikincikod/kanıtincelemesi
- Kaynak / build / paket kimliği: source496729e2backendruntimeaynı; iki yeniopt-in testhelperı source-identity.json
- Ortam / kullanılan kimlik ve yetki: SADECEfakeK8s+net.Pipeupstream/syntheticoperator; gerçekChromium156vePlaywrightWebKit27.2; owned19849
- Başlangıç zamanı: 2026-11-11T12:28:11Z
- Bitiş zamanı: 2026-11-11T12:36:35Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.06-S1 — Hazırlık
- [x] GerçekproductionServer.Register/proxyForward yolu, yalnızopt-in _test.gofixture;145sömür/19849freeguard, dışrequestrej,30requestbrowserlimit.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/source-identity.json

#### TEST-11.06-S2 — Normal kullanım / pozitif kontrol
- [x] İkibrowserdacookie-onlynormalpreview200; JSkoduçalışır, originopaque/null, cookie/localStorageSecurityError, openernull.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-02/result.json
- Sonuç: gerçekbrowserizolasyonPASS; gerçekK8s/SPDYdeğil.

#### TEST-11.06-S3 — Negatif / sınır / arıza kontrolü
- [x] Geçerlinoncebilinsebile6null-Originread/managementisteğitarayıcıbaşına403; bozukupstreamCSP/CORS/SetCookieoverrideve2darredirectprefixkontrolügeçti.
- Gözlenen: toplam16HTTP/browser; routeintercept14, takipredirectfarkıayrı.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/REPORT.md
- Sonuç: sınanmışcanarykapsamındaPASS, payload/dışexfilyok.

#### TEST-11.06-S4 — Bulgular ve düzeltme
- Bulgu: ilkWebKitdenemesindehelper302metadataCSPbekledi; final200opaqueCSPdoğruydu.
- Düzeltme: assertionuygulananfinaldokümanabağlandı; runtimekodudeğişmedi. İlkFAILkorundu.

#### TEST-11.06-S5 — Tekrar test ve regresyon
- [x] Ayrıattempt02ChromiumveWebKitPASS, firstattempt01FAILsilinmedi.
- [x] PozitifnormalpreviewveAPI-lookingredirectnegatifibirltekontrol edildi.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-01/result.json ve attempt-02/result.json

#### TEST-11.06-S6 — Temizlik ve inceleme
- [x] Fixtureexit0, ikibrowser/childkapalı,19849bindprobeportserbest.
- [x] Rawcredential/HTML/HAR/storage/noncevalueartefaktayazılmadı; sourcehashlervar.
- [x] Rootraporvesourceguard/sonuçlarıinceledi; aynıajansistemi profesyonelüçüncütarafpentestdeğil.
- Kalan sınırlar: arbitraryredirect/download/upgrade/trailer, nativeSafari, gerçekK8sRBAC/SPDY/normalUIayrıtestlerdir.

- Git checkpoint incelemesi: preview-browser-worker/source-identity.json içindeki10helper/runtime dosyası current9e87141b ile byte-eşit. Önceden tamamlanan browser job ve iki helper artık aynı kanıtla Git'e kaydedilir; yeni test çalışmış gibi sayılmadı.
- Reuse kanıtı: preview-browser-worker/ROOT_REUSE_REVIEW.json ve ROOT_REVIEW.md. Main UI-only CSP'nin sonraki değişikliği ayrı mux/route testinde doğrulandı; bu fake-upstream fixture o main handler'ı içermez. Default opt-in SKIP, browser PASS değildir.

#### TEST-11.06-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: buphaseinbrowsergüvensınırı sentetikotorite+gerçekbrowserilekanıtlandı. GerçekkümeE2Eolaraksayılmaz.
- Yeniden test: protect/Origin/session/proxyCSP/headerstrip/previewlinkdeğişirse.

### TEST-11.07 — Preview upstream cookie/header/token temizliği

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Preview upstream cookie/header/token temizliği; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER; rootikincikod/kanıtincelemesi
- Kaynak / build / paket kimliği: source496729e2backendruntimeaynı; iki yeniopt-in testhelperı source-identity.json
- Ortam / kullanılan kimlik ve yetki: SADECEfakeK8s+net.Pipeupstream/syntheticoperator; gerçekChromium156vePlaywrightWebKit27.2; owned19849
- Başlangıç zamanı: 2026-11-11T12:28:11Z
- Bitiş zamanı: 2026-11-11T12:36:35Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.07-S1 — Hazırlık
- [x] GerçekproductionServer.Register/proxyForward yolu, yalnızopt-in _test.gofixture;145sömür/19849freeguard, dışrequestrej,30requestbrowserlimit.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/source-identity.json

#### TEST-11.07-S2 — Normal kullanım / pozitif kontrol
- [x] İkibrowserdacookie-onlynormalpreview200; JSkoduçalışır, originopaque/null, cookie/localStorageSecurityError, openernull.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-02/result.json
- Sonuç: gerçekbrowserizolasyonPASS; gerçekK8s/SPDYdeğil.

#### TEST-11.07-S3 — Negatif / sınır / arıza kontrolü
- [x] Geçerlinoncebilinsebile6null-Originread/managementisteğitarayıcıbaşına403; bozukupstreamCSP/CORS/SetCookieoverrideve2darredirectprefixkontrolügeçti.
- Gözlenen: toplam16HTTP/browser; routeintercept14, takipredirectfarkıayrı.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/REPORT.md
- Sonuç: sınanmışcanarykapsamındaPASS, payload/dışexfilyok.

#### TEST-11.07-S4 — Bulgular ve düzeltme
- Bulgu: ilkWebKitdenemesindehelper302metadataCSPbekledi; final200opaqueCSPdoğruydu.
- Düzeltme: assertionuygulananfinaldokümanabağlandı; runtimekodudeğişmedi. İlkFAILkorundu.

#### TEST-11.07-S5 — Tekrar test ve regresyon
- [x] Ayrıattempt02ChromiumveWebKitPASS, firstattempt01FAILsilinmedi.
- [x] PozitifnormalpreviewveAPI-lookingredirectnegatifibirltekontrol edildi.
- Kanıt: artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-01/result.json ve attempt-02/result.json

#### TEST-11.07-S6 — Temizlik ve inceleme
- [x] Fixtureexit0, ikibrowser/childkapalı,19849bindprobeportserbest.
- [x] Rawcredential/HTML/HAR/storage/noncevalueartefaktayazılmadı; sourcehashlervar.
- [x] Rootraporvesourceguard/sonuçlarıinceledi; aynıajansistemi profesyonelüçüncütarafpentestdeğil.
- Kalan sınırlar: arbitraryredirect/download/upgrade/trailer, nativeSafari, gerçekK8sRBAC/SPDY/normalUIayrıtestlerdir.

- Git checkpoint incelemesi: preview-browser-worker/source-identity.json içindeki10helper/runtime dosyası current9e87141b ile byte-eşit. Önceden tamamlanan browser job ve iki helper artık aynı kanıtla Git'e kaydedilir; yeni test çalışmış gibi sayılmadı.
- Reuse kanıtı: preview-browser-worker/ROOT_REUSE_REVIEW.json ve ROOT_REVIEW.md. Main UI-only CSP'nin sonraki değişikliği ayrı mux/route testinde doğrulandı; bu fake-upstream fixture o main handler'ı içermez. Default opt-in SKIP, browser PASS değildir.

#### TEST-11.07-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: buphaseinbrowsergüvensınırı sentetikotorite+gerçekbrowserilekanıtlandı. GerçekkümeE2Eolaraksayılmaz.
- Yeniden test: protect/Origin/session/proxyCSP/headerstrip/previewlinkdeğişirse.

## CAT-12 — Import/dosya/host komutları

### TEST-12.01 — Kubeconfig exec plugin trust sınırı

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Kubeconfig exec plugin trust sınırı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR; release_backend_resume ayrı kaynak/kanıt incelemesi
- Kaynak / build / paket kimliği: Runtime f32d6b23; test-only workingdiff release_kubeconfig_trust_test.go SHA7b39ad28075a041ae0b63e57e4e8f3e38154b65e1c6bdb85e27de8373bb6c612; ilk/retestmanifest ayrı
- Ortam / kullanılan kimlik ve yetki: Sahip olunan loopback19848 canary API, sentetik testbinary exec plugin, temp0700 workspace/kubeconfig; gerçek Kubernetes veya kullanıcıcredential yok.
- Başlangıç zamanı: 2026-11-12T10:30:45.651639+00:00
- Bitiş zamanı: 2026-11-12T10:42:10.271638+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.01-S1 — Hazırlık
- [x] Aktif server.client standart client-go loader ve trustedWorkspaceContext/workspace import sınırı koddan izlendi; eskipkg/k8s/client aktif yol sanılmadı.
- Fixture: yalnız owned127.0.0.1:19848, testbinary authhelper+tempmarker. Bütçe: iki odaklıtest,60sn testtimeout/120sn wrapper, GOMAXPROCS2/package1; hiçbir host/provider/labmutasyonu yok.
- Beklenti: açık operatör kubeconfig execplugin çalışabilmeli; browser bağlantı/import payloadı yeni executable/kubeconfig/context yetkisi sağlayamamalı. Normalcontext listeleme authprogram çalıştırmamalı.
- Kaynak/devam/test sonuçları artifacts/release-audit/ra-20261112/kubeconfig-trust-root/ altında saklanacak. Diğer kaynak değişirse ilgili kanıt yeniden değerlendirilecek.

#### TEST-12.01-S2 — Normal kullanım / pozitif kontrol
- [x] Trustedoperator kubeconfig gerçekclient-goexecchild çalıştırdı; marker+exactBearerile1HTTPSnamespaceGET doğrulandı.
- [x] TLSStartTLS/CADataexactcertificate, insecureverificationyok.
- [x] Contextlisteleme/trustsorgusu/unknowncontext programı çalıştırmadı; ilkTLSsizfixtureFAILhistoryolarak korunur.
- Kanıt: artifacts/release-audit/ra-20261112/kubeconfig-trust-retest-root/REPORT.md; ilkkoşu ../kubeconfig-trust-root/ altında.
- Veri: sentetikHTTPSAPI+gerçekexecsubprocess; gerçekKubernetesE2Edeğil.

#### TEST-12.01-S3 — Negatif / sınır / arıza kontrolü
- [x] Unknowncontext/stringpath/URL422 veconnections0. Browserexec/kubeconfigalanları çalışmadı/persistolmadı.
- [x] Knowncontext200 pozitifkullanılabilir; importcontext/bound temizlendi; workspace/exportinjectedpath/execgöstermedi; shellcanarymarker oluşmadı.
- Browsernegatifler üretimhandler+fakeK8sfixture; arbitrarykubeconfigfile upload yeteneği bulunmadı. SSRF/CAwronghostname/diğerpluginler ayrıfazlardır.

#### TEST-12.01-S4 — Bulgular ve düzeltme
- Ürün güvenlik açığı tespit edilmedi; bu karar yalnızbu testkapsamıyla sınırlı.
- İlkikiFAIL testfixturekaynaklıydı: plainHTTP client-goauthyüklemez, validation422iken400beklendi.
- Fixyalnıztest: pinnedCAtestTLS ve422expectation; ilkGoSource/JSONL/manifestsdeğişmedi. Runtimeclient/handler/import kodu değişmedi.

#### TEST-12.01-S5 — Tekrar test ve regresyon
- [x] Aynıruntime, fixture-onlyfix ileiki asıltestgeçti;3topPASS=1defaulthelper+2asıltest,0SKIP. Childhelperayrıca gerçektenexecoldu.
- [x] Normaltrustedexec ve browsercontext/import komşunegatifleri tek2.704snkoşuda doğrulandı.
- Gerçekküme/providergenelmatrisinitest-onlyiçintekrar etmek NOT_APPLICABLE; bu fazyereltrusttransport/sentetikhandler testidir.

#### TEST-12.01-S6 — Temizlik ve inceleme
- [x] GoTempDir/envcleanup veapi.Close/s.Close/exec.Cmd.Run wait/reap kaynaktanvebaşarılıkoşudestekli; rootsonraki19848lsof listenerfree. AyrıchildPID/tempdirsnapshotölçülmedi.
- [x] İlk/retesttestSHA ve runtime/dependencybyteseşitliği farklıworkerincelemesinde doğrulandı;4/4reviewchecksumrootkontrolüPASS.
- [x] İkinciinceleme176.564/180sn, critical0/NARROW_TEST_EVIDENCE_ACCEPTED. Profesyonelbağımsızüçüncütarafpentestdeğil.
- Sınır: ayrıwrongCA/hostnamecaseyok; mevcutbefore/afterReadFilehatalarıassertedilmiyor, broadfilesysteminvariantauditdeğildir. Pozitifgerçekclient-call/browsernegatiffakefixturetekgerçekkümeUIE2Edeğildir.
- Kanıt: artifacts/release-audit/ra-20261112/kubeconfig-trust-second-review-worker/REPORT.md.

#### TEST-12.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Yereloperatörkubeconfigexec trustpozitifi ve browsercontext/exec/path/importauthoritynegatifleri doğrulandı. GerçekKubernetes/pluginçeşitleri veya bütünsecurity/PATH/SSRF/paketkapıları kapanmaz.
- İlkfixtureFAIL tarihsel korunur. Değişensınırlar server.client/trustedWorkspaceContext/workspaceimport/Connectionmodel/client-goloader ise retest gerekir; yalnızbelge değişimi uzun koşu gerektirmez.

### TEST-12.02 — Path/symlink/traversal/archive çıkarma

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Path/symlink/traversal/archive çıkarma; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-12.03 — YAML/JSON depth/size/alias/duplicate politikası

- Kategori: CAT-12.
- Amaç / kullanıcı riski: YAML/JSON depth/size/alias/duplicate politikası; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR + Provider worker (önce yalnız workspace JSON parser altkapsamı; YAML/resource parser ayrı açık).
- Kaynak / build / paket kimliği: HEAD362e91c3/runtime15770296; yeni parserguard testdosyası çalışma aşamasında.
- Ortam / kullanılan kimlik ve yetki: In-process/fakeK8s workspacehandler; ençok4MiB/2largebody,1sonluGoçalışması, gerçekK8s/credential/browser yok.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

13 Kasım +03: mevcutJSONdecode MIME/2MiB/singlevalue ve workspaceImport/Store.Update sözleşmesi için yeni sınırlı pozitif/negatiftestler hazırlanıyor. FutureSchema, unsafePreferences, badreference, deepnest, malformed/trailingJSON/largebody ve mevcutduplicate-last/unknown-ignore politikasında authority/persistence güveni incelenecek. YAMLalias/diğerresourceparser/prototypepollution bu küçükJSON grubuyla tamamlanmış sayılmayacak.

#### TEST-12.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

14 Kasım rootkapanışı: workspaceJSONpozitifleri ve3ana/9alt son retest + ImportInto boundedfuzz kaynak/kanıtları doğrulandı (TEST13.01). Bu fazın YAML/alias/diğerkaynakparser bölümleri çalışmadı.

#### TEST-12.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

WorkspaceJSON için MIME/size/depth/tekdeğer/unsafe/schema/reference/nonce ve duplicateobject/scalarpolitiği doğrulandı. Unknownfieldignore persist/yetki üretmez. YAMLalias/duplikasyon ve genericresourceparser için bu sonuç otomatikPASS değildir.

#### TEST-12.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

IN_PROGRESS: yalnız workspaceJSON altkanıtı var; YAML/alias/diğerparser sınırları tamamlanmadı, bu faz VERIFIED_DONE yapılmadı.

### TEST-12.04 — Prototype pollution

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Prototype pollution; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-12.05 — Kısmi config/migration/restore

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Kısmi config/migration/restore; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-12.06 — Export credential/write-grant taşımıyor

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Export credential/write-grant taşımıyor; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-12.07 — Minikube/Hubble command/argument injection

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Minikube/Hubble command/argument injection; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-12.08 — PATH/cwd/sabit binary seçimi

- Kategori: CAT-12.
- Amaç / kullanıcı riski: PATH/cwd/sabit binary seçimi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 496729e2 + scripts/manual_lab.py explicitminikube çalışma farkı; root-retest manifest sourcehash
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:20:17.412070+00:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.08-S1 — Hazırlık
- [x] Yalnız sentetik executable fixture; shell karakterleri dosya adında, gerçek shell çalıştırılmadı.
- Komut: python3 -m unittest discover -s manual-lab/tests -p test_runner.py
- Kanıt: artifacts/release-audit/ra-20261111/packaging-root-retest/manual-runner.log

#### TEST-12.08-S2 — Normal kullanım / pozitif kontrol
- [x] Varsayılan CLI sürüm sabiti, explicit executable, doctor path/SHA/custom işareti ve literal argv pozitif kontrolleri dahil25runner test PASS.
- [ ] Backend provider PATH/fixedbinary yüzeyi bu dar sonuçla kapanmaz.

#### TEST-12.08-S3 — Negatif / sınır / arıza kontrolü
- [x] Göreli/missing/nonexecutable/looped symlink, yanlış sürüm/özel marker ve shell-metni negatif testleri geçti.
- Sonuç: unit PASS; gerçek özel CLI worker sağlama kabulü henüz yok.

#### TEST-12.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: runner katmanı doğrulandı; backend provider/final paket kapsamı açık.
- Yeniden test: runner/provider binary resolution veya sürüm sınırı değişikliği.

### TEST-12.09 — SSRF/redirect credential canary

- Kategori: CAT-12.
- Amaç / kullanıcı riski: SSRF/redirect credential canary; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-12.10 — Test/debug endpoint release yüzeyi

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Test/debug endpoint release yüzeyi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.3.6/V1.5.2/V5.3.2; API7:2023; CAT12. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-13 — Fuzz/race/eşzamanlılık

### TEST-13.01 — Workspace/import/parser bounded fuzz

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Workspace/import/parser bounded fuzz; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR; önceki Backend/Provider worker uygulama ve karşılıklı ikinci incelemeleri.
- Kaynak / build / paket kimliği: Runtime15770296/auditHEAD362e91c3 + iki yeni test. FinalparserSHA71b3a61b23a939ff8dc66ba75cf7810a13bb3a1bb856fd7d8b6d4073cea00e4d; exactdiğerkaynak/kanıtSHA ROOT_REVIEW.json.
- Ortam / kullanılan kimlik ve yetki: Sentetikdoküman/privateTemp/in-processhandler; SDKGo1.26.11;2sonluworker p1/parallel1/GOMAXPROCS2, yeniFuzzImport10sn; ownedlabstopped/gerçekK8s yok.
- Başlangıç zamanı: 2026-11-11T14:05:10.000694+03:00
- Bitiş zamanı: 2026-11-14T12:41:04.069043+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: Sınırlı workspace Validate/Export, ImportInto/Store.Update invariants ve production JSON handler pozitif/negatifleri; exactkaynak/hamsonuç/temizlik/ikinciinceleme. Tüm YAML/parser/endpoints güvenliği değildir.

#### TEST-13.01-S1 — Hazırlık
- [x] Önceki111850-case Validate→Export fuzzın store.go/store_test.go/go.mod/go.sum4SHA eşitliği doğrulandı; yeniden koşulmadı.
- [x] Yeni ImportInto fuzz8seed/64KiBcap/10sn/1worker; unit ve HTTPgrupları ayrı Go1.26.11/p1/parallel1/GOMAXPROCS2/RSS1.5GiB/disk10GiB sınırlarıyla çalıştı. Kaynak ve planlar kanıtta.

#### TEST-13.01-S2 — Normal kullanım / pozitif kontrol
- [x] Import3ana/9alt PASS: authoritystrip, mevcuttrustedstate/prefix, yeniID/ref/ilişki remap, sourcemutation/alias kontrolleri; kapasite transaction reddinde disk/snapshot/revision/reopen değişmezliği.
- [x] NormalJSON nonce+namespace/selectorUID ve validHTTPimport pozitifleri; son rootretesti mevcutconnection/harbor prefixini de doğrudan doğruladı.

#### TEST-13.01-S3 — Negatif / sınır / arıza kontrolü
- [x] HTTPmalformed/trailing400; MIME415; nonce403; futureSchema/unsafe/depth/reference422;2097435bytebody400. Her ret snapshot/revision/directory/backupbytes değişmezliğini kontrol eder.
- [x] Duplicateobjectunsafe→safe merge credentialı sakladığı için422+değişmezlik; scalarduplicate revision sondeğeri ile200; unknownfieldpersist/authority yok.
- [x] Yeni fuzz563506motor yürütmesi/17interesting/8seedPASS; geçerliimport sayısı değildir.64KiBüstü kapsam dışı; bütünbüyükbodygüvenliği iddiası yok.

#### TEST-13.01-S4 — Bulgular ve düzeltme
- Ürün kusuru/fixi bulunmadı. İlkparserfixture200beklentisi yanlıştı; gerçek422 güvenli reddir. İlkRED/ilk kaynak immutableattempt01de; yeni pozitif/negatifayrımı test-onlydüzeltmedir.
- Peerreview post-importexistingbinding assertion eksikliğini buldu. Rootikiassertion ekleyip ayrıfinalsource kısa retest yaptı; önceki grubun kapsamı geriye doğru genişletilmedi.
- Rootmanifestpath/basename varsayımı doğrulayıcıda hata oluşturdu; kayıt korunarak gerçekdosya yollarıyla kontrol tamamlandı.

#### TEST-13.01-S5 — Tekrar test ve regresyon
- [x] Correctedparserattempt02:3ana/9altPASS; finalprefixsource rootretesti3ana/9altPASS/0SKIP(3,422sn).
- [x] Unit/fuzz/raw packagePASS ve before/after sourcechecks; ilkRED ayrı. Eski111850fuzz yenidenkoşulmadı; yeniImportfuzz tek çağrı.
- Kanıt: workspace-import-parser-closure-root/REPORT.md ve ROOT_REVIEW.json; bağlıunit/fuzz/parserattempt02/rootretetleri.

#### TEST-13.01-S6 — Temizlik ve inceleme
- [x] Dört manifestte36+2+19+2girdi doğrulandı; eskiparsertestSHA exactarchivedattempt02source ile, güncel71b3source ayrıretetplanıyla eşleşir.
- [x] Capturedprocess/groupcleanup, privateTemp ve corpuskorunumu receipts/source ile kontrol edildi; corpus17dosya metadata/sha peerincelemesinde doğrulandı.
- [x] Karşılıklıpeerreview (aynıajansistemi, profesyonelüçüncütarafdeğil); parserpeer124,5/120sn süreçhedefi aşımı ayrı saklanır.
- Kalan: YAML/alias/diğerparser/endpointler, actualKubernetes/UI/finalbinary, tümvaliditepolitikasını bağımsızoracleileispat ve unsampledprocesscensus yok.

#### TEST-13.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Yalnız tanımlı boundedworkspace/import/parser sözleşmesi. TEST12.03kısmiJSON olarak açık; genel NOT_RELEASE_READY değişmez.
- Import/Export/Validate, storetransaction, JSONdecode/handler veya ilgili dependency değişirse ilgili kontroller retestgerekir. Test/doc-only değişim eski uzunkoşuları kendiliğinden yeniden gerektirmez.

### TEST-13.02 — UID/isim/context generation

- Kategori: CAT-13.
- Amaç / kullanıcı riski: UID/isim/context generation; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-13.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-13.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-13.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-13.03 — Duplicate/out-of-order/resync/reconnect

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Duplicate/out-of-order/resync/reconnect; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-13.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-13.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-13.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-13.04 — Eşzamanlı edit/delete

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Eşzamanlı edit/delete; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-13.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-13.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-13.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-13.05 — İki limanda eşzamanlı mutation

- Kategori: CAT-13.
- Amaç / kullanıcı riski: İki limanda eşzamanlı mutation; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7; binary1003a43a6a80…
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T11:46:47Z
- Bitiş zamanı: 2026-11-11T11:46:58Z
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.05-S1 — Hazırlık
- [x] İki owned namespace ve UID/label korumalı gerçek Ready fixture hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-operations/run.json

#### TEST-13.05-S2 — Normal kullanım / pozitif kontrol
- [x] Barrier ile aynı anda A scale ve B metadata PUT gönderildi.
- Gözlenen: A accepted1/conflict1; B accepted; A generation+1, B spec ve Pod UID kümesi değişmedi.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-operations/run.log
- Sonuç: PASS.

#### TEST-13.05-S3 — Negatif / sınır / arıza kontrolü
- [x] Aynı UID/RV scale iki kez; tek kabul+409. Kabul edildiği bilinen yanıt test transportunda gizlendi, UID GET ile reconciliation; retry yok.
- Sonuç: PASS; gerçek ağ timeout/cancel testi DEĞİLDİR.

#### TEST-13.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: bu sonlu eşzamanlı dispatch testinde yeni bulgu yok.
- Kök neden/düzeltme: NOT_APPLICABLE.

#### TEST-13.05-S5 — Tekrar test ve regresyon
- [ ] İlk hata retest: NOT_APPLICABLE (yeni hata yok).
- [x] Yetkili normal işlemler ve B spec/Pod UID izolasyonu readback ile geçti.
- Kanıt: artifacts/release-audit/ra-20261111/real-api-operations/run.log

#### TEST-13.05-S6 — Temizlik ve inceleme
- [x] Exact UID cleanup ve audit LIST0; default workspace değişmedi.
- [x] Kaynak/binary kimliği receiptte doğrulandı.
- [x] Root test kodunu/JSON ve logu inceledi.
- Kalan sınırlar: gerçek ağ timeout/cancel, normal UI ve cross-cluster başka fazlar.

#### TEST-13.05-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: iki limanda eşzamanlı gerçek mutation, çift UID/RV ve final içerik izolasyonu geçti.
- Yeniden test: dispatch/UID-RV/grant/scope değişirse.

### TEST-13.06 — Revoke sırasında log/metrics/flow publish

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Revoke sırasında log/metrics/flow publish; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-13.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-13.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-13.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-13.07 — Timeout/cancel/geç callback

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Timeout/cancel/geç callback; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-13.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-13.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-13.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-13.08 — Go race

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Go race; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 4999981 backend kaynak;4ec526b7 aynı backend hashleri (yalnız frontend ve kanıt commit değişikliği)
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:41:27.239056+03:00
- Bitiş zamanı: 2026-11-11T13:41:48.070118+03:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.08-S1 — Hazırlık
- [x] Go1.26.11, GOMAXPROCS2, -p1/-parallel2 ve explicit opt-in guardlarıyla tam ./... race koşusu.
- Kanıt: artifacts/release-audit/ra-20261111/final-go-race.jsonl

#### TEST-13.08-S2 — Normal kullanım / pozitif kontrol
- [x] {'pass': 96, 'fail': 0, 'skip': 25} top-level test sonucu; race diagnostic yok.
- Gözlenen:96PASS/25SKIP; SKIP gerçek-lab opt-inler, PASS sayılmaz.
- Kanıt: final-go-race.jsonl
- Sonuç: çalıştırılan Go testlerinde race kabulü PASS.

#### TEST-13.08-S3 — Negatif / sınır / arıza kontrolü
- [x] Aynı test kümesindeki eşzamanlı stream/cancel/scope/grant testleri race instrumentation altında geçti.
- Sınır: race dedektörü çalışmayan gerçek-lab yollarını veya bütün olası yarışları kanıtlamaz.

#### TEST-13.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: bu race koşusunda yeni data race bulunmadı.
- Düzeltme: NOT_APPLICABLE; önceki SEC001/002 düzeltmelerini kapsar.

#### TEST-13.08-S5 — Tekrar test ve regresyon
- [ ] İlk race hatası retest: NOT_APPLICABLE; yeni hata yok.
- [x] Odaklı SEC001/002 race ve normal suite de geçti.
- Kaynak yeniden kullanım:4ec backend runtime değişmedi, frontend-only fark Go race’i etkilemez.

#### TEST-13.08-S6 — Temizlik ve inceleme
- [x] Test süreci bitti; fixture cleanup in-process.
- [x] Kaynak ve toolchain kayıtları eşleştirildi.
- [x] Root JSON start/end/fail/race ve top-level sayımları inceledi.
- Kalan sınırlar:25opt-in SKIP, gerçek E2E ilgili fazlarda açık.

#### TEST-13.08-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: çalıştırılan sentetik/backend suite için Go race kontrolü geçti.
- Yeniden test: backend concurrency/cache/session/stream/runtime modül değişikliği.

### TEST-13.09 — Frontend mount/unmount yaşam döngüsü

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Frontend mount/unmount yaşam döngüsü; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-13.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-13.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-13.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-13.10 — Kritik guard/reducer sınırlı mutation testing

- Kategori: CAT-13.
- Amaç / kullanıcı riski: Kritik guard/reducer sınırlı mutation testing; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.5.2/V16.5.3; CAT13 bounded fuzz/race/yaşam döngüsü. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: KV-DEPENDENCY-WORKER + root ikinci inceleme
- Kaynak / build / paket kimliği: 49999815 resourceStore.js/resourceScopes.js/tests/store.test.js exacthash; bu kaynaklar değişmedi
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T14:05:10.000694+03:00
- Bitiş zamanı: 2026-11-11T14:05:10.000694+03:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.10-S1 — Hazırlık
- [x] Gerçek reducer ve17mevcuttest izole .git kopyalarına alındı.
- Yapılan: tekseriNode işi,30s/run;prodhashlerbaşta/sonda aynı.
- Beklenen: öncebaselineçalışmalı.
- Gözlenen:17/17PASS.
- Kanıt: fuzz-mutation-worker/REPORT.md; mutation-source-manifest.json
- Sonuç: izolasyon doğrulandı.

#### TEST-13.10-S2 — Normal kullanım / pozitif kontrol
- [x] Değişmemiş reducer/test normal kontrolü geçti.
- Gözlenen:17PASS/0FAIL.
- Kanıt: fuzz-mutation-worker/mutation-results.json
- Sonuç: testloader/syntax kontrolü var.

#### TEST-13.10-S3 — Negatif / sınır / arıza kontrolü
- [x] İki yanlış mantık mutasyonu ve bir eşdeğer kontrol çalıştı.
- Yapılan: generationguard kapalı;DELETE UID yerineaddress;1000→10**3eşdeğer.
- Beklenen: mantıkmutantları assertion ile yakalanmalı.
- Gözlenen:2ve3ERR_ASSERTIONFAIL;syntax/loadhatası0;eşdeğer17PASSvebaşarıpuanına katılmadı.
- Kanıt: mutations.patch + mutation-results.json aynı worker dizininde.
- Sonuç: iki kritikguard için test duyarlılığı kanıtlandı; repogenelimutationcoverage iddiası yok.

#### TEST-13.10-S4 — Bulgular ve düzeltme
- Bulgu: yeniürünhatası yok; testduyarlılığı deneyi.
- Üretim değişikliği: yok.

#### TEST-13.10-S5 — Tekrar test ve regresyon
- [x] İki mutant ilk gerçekassertionlaöldü.
- [x] Baseline/eşdeğer17/17normal davranış.
- Komşu gerçekUI/Kubernetes: NOT_APPLICABLE, bu safreducerfazı.
- Kanıt: fuzz-mutation-worker/REPORT.md.

#### TEST-13.10-S6 — Temizlik ve inceleme
- [x] İzole .git fixture korundu;runtimehashleri değişmedi.
- [x] Kaynak/test/patch/hash sonuçları eşleştirildi.
- [x] ANA MÜDÜR hataadlarını veeşdeğer kontrolünü inceledi.
- Kalan sınır: yalnıziki yanlış davranış; unknownbuggenelcoverage yok.

#### TEST-13.10-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- Karar: seçilmişguardtestleri gerçekyanlışmantığı yakalıyor; eşdeğer/syntaxmutant skoru şişirmedi.
- Yenidençalıştırma: reducer/generation/UIDDELETE veya ilgiliassertion değişimi.

## CAT-14 — Kontrollü pentest zincirleri

### TEST-14.01 — Authentication-aware pasif/aktif owned endpoint taraması

- Kategori: CAT-14.
- Amaç / kullanıcı riski: Authentication-aware pasif/aktif owned endpoint taraması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V3.5.1/V16.5.3; API1/API7:2023; CAT14 owned canary. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-14.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-14.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-14.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-14.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-14.02 — Reader→yanlış nesne→işlem canary zinciri

- Kategori: CAT-14.
- Amaç / kullanıcı riski: Reader→yanlış nesne→işlem canary zinciri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V3.5.1/V16.5.3; API1/API7:2023; CAT14 owned canary. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-14.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-14.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-14.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-14.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-14.03 — Zararlı preview→yönetim API canary zinciri

- Kategori: CAT-14.
- Amaç / kullanıcı riski: Zararlı preview→yönetim API canary zinciri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V3.5.1/V16.5.3; API1/API7:2023; CAT14 owned canary. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-14.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-14.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-14.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-14.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-14.04 — Bulgu PoC red/fix/retest ve normal kullanıcı regresyonu

- Kategori: CAT-14.
- Amaç / kullanıcı riski: Bulgu PoC red/fix/retest ve normal kullanıcı regresyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V3.5.1/V16.5.3; API1/API7:2023; CAT14 owned canary. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-14.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-14.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-14.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-14.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-14.05 — İkinci reviewer bulgu/düzeltme incelemesi

- Kategori: CAT-14.
- Amaç / kullanıcı riski: İkinci reviewer bulgu/düzeltme incelemesi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V8.2.2/V3.5.1/V16.5.3; API1/API7:2023; CAT14 owned canary. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-14.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-14.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-14.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-14.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-14.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-15 — Yük ve tükenme

### TEST-15.01 — Normal beklenen yük

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Normal beklenen yük; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.02 — Kademeli artan yük

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Kademeli artan yük; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.03 — Kısa spike

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Kısa spike; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.04 — Yavaş istemci ve bağlantı fırtınası

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Yavaş istemci ve bağlantı fırtınası; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.05 — Büyük body/message/log

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Büyük body/message/log; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.06 — Çok liman/abonelik isteği

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Çok liman/abonelik isteği; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.07 — Event/flow burst

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Event/flow burst; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.08 — Bounded queue/backpressure/reddetme

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Bounded queue/backpressure/reddetme; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-15.09 — Yük kalkınca UI/data/cleanup toparlanması

- Kategori: CAT-15.
- Amaç / kullanıcı riski: Yük kalkınca UI/data/cleanup toparlanması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: API4:2023 sınırsız kaynak tüketimi; CAT15 önceden kaydedilen hız/boyut/stop bütçesi. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-15.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-15.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-15.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-15.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-15.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-16 — A/B benchmark

### TEST-16.01 — Harness saat/PID/güç/fixture/kamera/faz/env doğrulaması

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Harness saat/PID/güç/fixture/kamera/faz/env doğrulaması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR + release_backend_resume; sonraki PID kontrolü aynı worker
- Kaynak / build / paket kimliği: A36d5b8f / Bf32d6b23 frozen frontend; common backend.test SHA9d35acc9…; harness kaynak SHA manifestlerde
- Ortam / kullanılan kimlik ve yetki: MacM5/macOS27, Chromium Metal, medium/DPR1/1440x900; read-only sentetik M20Node/300Pod; Kubernetes credential kullanılmadı
- Başlangıç zamanı: 2026-11-12 (ayrı işler exact zamanları manifestlerde)
- Bitiş zamanı: 2026-11-12T18:19:27.042531+00:00
- Durum: VERIFIED_DONE
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.01-S1 — Hazırlık
- [x] Donmuş A/B frontend ve ortak f32 benchmark backend üretildi; ikiVite+birgo test-c, lock/cache sürümleri eşleşti.
- Kanıt: artifacts/release-audit/ra-20261112/perf-baseline-plan-worker/REPORT.md; perf-matching-build-worker/REPORT.md.
- Bu yalnız frontend-browser-common-backend ailesidir; full-runtime A/B değildir. Yeni taglar tarihsel artefaktların üzerine yazmaz.

Yeni sonluplan: perf-native-harness-validation-root/plan.json. ExplicitoldMcontrolledFOV38 aynıpose iki frozenfrontendte, production24değişmez. Aynıoldpose/FOV24te8gemiden2merkezfrustumdaydı; safprojection38te8/8, gerçekPNG/UID/draw kapsamı henüz sınanacak. İki seri30sısınma+3skısa harnesspenceresi/tekçift≤120s; performans kabulü değil. PIDworkercompletion/rootreview/commit sonrası; ownedrealLabdurdu, ağırscan/build yok. İlkFAIL saklanır, otomatikretry yok.

#### TEST-16.01-S2 — Normal kullanım / pozitif kontrol
- [x] Bir A/B comparability smoke, aynı UID/panel/sekme/filo/FOV24 ve draw footprint ile geçti; ikiPNG incelendi.
- Logical detailed kapsam8Node/120Pod; projected/raycast-visible merkez yalnıznode0/node2, kadraj dar/kırpık. Tam görünüm eşdeğerliği/ölçüme hazır olma henüz sağlanmadı.
- Kanıt: artifacts/release-audit/ra-20261112/perf-camera-comparability-worker/REPORT.md. CPU/FPS/gecikme ölçüm penceresi yok.

RootcontrolledM38nativevalidationPASS: iki30sısınma+3snonacceptancepencere73.752/120s. AynıA/Bsource/commonbackend/Chromium156Metal/medium/DPR1;camera/filo/node0Özet/gerçekbody/scopeaynı. Herikiside20/300canonical,8/120detailed veprojectednode0–7;426calls/71170tri/32geometry/4texture. RootikiPNGyi açtı;normalmerkez/iskele/öngemiokunuyor,sağgeometri doğaloverlayarkasında. Production24defaultaynı;bucontrolledhistoricalM38protocolüdür. Kanıt: artifacts/release-audit/ra-20261112/perf-native-harness-validation-root/REPORT.md.

#### TEST-16.01-S3 — Negatif / sınır / arıza kontrolü
- [x] Kamera FOV24/38 farkı, eksik/bilinmeyen/gerçek FOV uyumsuzluğu reddedildi; pinned eski38 protokolü ayrı.
- [x] Performans karşılaştırıcısı yalnız comparability envanterini sonuç diye kabul etmedi.
- PID-birth halen açık: mevcut CPU collector yalnızPID kullanıyor; PIDreuse/sayaç sıfırlanması koruması eklenip sınanacak. Bu düzelmeden CPU matrisi başlamaz.

GenericCLIconsumer gerçekUNITfixtureRED:12invalidcaseyanlışcomparabletrue/exit0,4bozukgirdi stack/exit1. Düzeltme18/18+expanded28/28GREEN; finalcamera neighborile31/31PASS. Missinginterior/rawsample/identity/role/counter/clock/empty/missing/extra/duplicategrup cleanfalse/exit2, unknownmetricrowyok. Geçerlisentetikpositive ve observed0 korunur. Rawtarihsel raporlar değiştirilmedi. Kanıt: artifacts/release-audit/ra-20261112/perf-generic-comparator-worker/REPORT.md.

#### TEST-16.01-S4 — Bulgular ve düzeltme
- PERF-HARNESS-CAMERA: açıkFOV veactualcamera/panelUID yalnızharness; üretim kamera/su/seyir/LOD/DPR değişmedi.24smokedarkadraj; yenicontrolled38normaloverview ve actualcollector validation planlı.
- PERF-HARNESS-PID: PID-only gerçekhesaplayıcıya karşı6deterministikRED üretildi. Collector C-localeOS lstart/PID/PPID/comm/cohort/role doğrular; browserın gözlenen tümchild/orphanları ayrı backend veobserverdışında sayar. UnknownCPU/RSSnull, gerçek0ayrı. Araörnekcohort/decreasingcounter/missing/reuse/timejump reddi.
- Childkimlikcache yalnızaktifexactidentityleri tutar;30nesilchurn büyümüyor. OS lstart1s, örneklerarası hiçgörülmeyenchild veöncedenorphan körnoktaları açık; kernel-completeCPUiddiasıyok.

Zerocell post-window sözleşmesi darharness değişikliği: panelMatrix v5 artık0eventte de fullcanonicalcompare yapacak; positive producer null-delay alanınınJS<100coercion ilevalidolmasıREDolaraküretildi. validEventProducer yeni explicit0vsnonzeroörnekkuralı;42unitPASS+zero-null9targetPASS. Ürün/renderer/PID/kamera koduaynı;yalnızpostwindowdataretstbekler.

#### TEST-16.01-S5 — Tekrar test ve regresyon
- [x] WorkerPIDregresyon6/6RED→18/18hedefliPASS;repair-sessionneighbor15/15PASS. İlk17/18fixtureşemaFAIL ve nativeprobeimport prechildFAIL korunur. Onaylısyntheticpositivefixturebirth/cohort eklenirken missingbirthnegatifkorundu.
- [x] TekownednativeNodechild168ms/10s;PID/PPID/birth/counter/RSSparse veSIGTERM→absent. App/browser/CPUperformansölçümü değildir;Linux yalnızunit.
- [x] Root26SHA,REPORT/kaynakdiff+boundedcachecase inceledi. Orijinal900s+somutrootreview180s ekbütçe;980.151s/1080.
- Önceki9kameraneighborunit/ilklaunchFAIL ayrıkanıtında. Kanıt: artifacts/release-audit/ra-20261112/perf-process-identity-worker/REPORT.md.
- Genericcompare.mjs consumerı yeni valid/null+interiorsamples semantiği için ayrıca denetlenecek; bütünCPUcomparatorkapıları henüz kapanmadı.

Rootnativecollectorvalidation: iki3srun native11process/browsermain+renderer+GPU+other/backend/observerrol+doğum/cohortPASS;clockfark52.9/47.1ms. Tüm8gemipozu ilerledi;su/seyirayarlarıaynı. Bu kısa diagnosticn1CPU/FPSgecikmekabulüdeğildir. Kernelcompleteclaimyok. Genericcomparatorguard ayrıca işleniyor.

Sıradaki sonlu data-smoke: frozenB/commonbackend, panel-open/M38/warm0/1s, tekkoşu≤30s+ownedcleanup/noK8s; performans/FPSkabulü değil. Actual0producerdelayN0/null ve client/upstream/plannedfullnested equality expected. Başarısızkoşu korunur/otomatikretryyok. Kamera/selection/PIDeskiunchangedkanıtıyenidençoğaltılmaz.

Postwindowv5darretsttamam:42unitPASS+zero-nulltightening9targetPASS, legacy300/n0/nullpredicateRED korundu. TekactualBwarm0/1sdata smoke4.283/30s,noerrors/protocol5/producer0completed0/n0null/validtrue/bothfullcanonicalverdicttrue/workloadintegritytrue. Ownedcleanup/5192free. İlkcontrollerhazırlamaSyntaxErrornoapp kaydı ayrıkorunur. Offline10validnonzerokayıt yenihelperilePASS; eskiCPUseti rerun/overwriteedilmedi. Kanıt: perf-zero-event-contract-root/REPORT.md.

#### TEST-16.01-S6 — Temizlik ve inceleme
- [x] Smoke owned runner/browser/backend cleanup ve5192 port yokluğu kaydedildi.
- [x] Root6+24+18SHA ve neighbor kanıtları doğruladı; ürün runtime aynı.
- [ ] PID birth/ölçüm cohortu, normal overview kadrajı, güç/arka plan yükü izolasyonu ve final5eşleşmiş ölçüm hazır değil.
- Güç şimdi Battery74%; daha önceki AC koşularıyla eşleştirilmez. Ağır A/B henüz başlamadı.

12Kasım20:05Istanbul rootlabizolasyonu: orijinal2Nodecontainer/clusterUID/ownerCMUID ve SecretQANSUID/seal gerçekAPIyleguarded; existingLab.down yalnız exactikiDockercontainerı durdurdu,appregistrations0.22.028snPASS; privateworkspace/config/manualmanifest/QA namespace diskleri korunur. Diğerprojeye müdahale yok. Kanıt: artifacts/release-audit/ra-20261112/perf-lab-isolation-root/result.json. Bu CPU/power/hostload kabulü değildir.

Nativevalidationownedrunner/browser/backendkimlikleriyok/5192free/commonbackend+harnessSHAaynı;canonicaltestsourcefake/readonly/noKUBECONFIG. İkiPNGrootgörselincelemesitamam. Hafifcomparatorpureunitjobeşzamanlıolduğu için bu3spencereler normalCPUbenchmarkından açıkça ayrıldı. n5asılölçümde diğerworkerlar/build/scan duracak.

Root19genericSHA/REPORT+diff inceledi; helperwritekapsamı compare+comparetestile sınırlı. FreshnativeCoreGraphics60Hz/1470x956/2940x1912 mevcut environmentJSONileeşleşti (perffamilyfresh-display.json). MacM5/macOS27/Chromium156/Metal/DPR1/GPUframebuffer/kaynaklar/kameraseçim/filo/role/cohort ve cleanupkontrolü darChromiumM38harnesskapsamında tamamlandı. NativeSafari/Retina/fizikselsunum ayrıN/A/açık; CPUsonucununkendisi doğrulanmadı.

Source-reuse: değişiklik yalnızpostCPUboundary0eventfullcanonicalcheck+pureproducerpredicate/scenarioVersion5. Renderer/clock/PID/probe/FOV/sourcefixtures/kalite/frontassets/backend değişmedi; öncekinativecamera/PID/selectionkanıtları buunchangedyollarda yenidenkullanıldı. Dar0dataactualretst+pozitifoffline10+unit ileilgiligapkapandı; bütünCPUmatrisi/fullruntimekabülü değildir.

#### TEST-16.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI
- VERIFIED_DONE: belirtilenChromium/Metal/M38/medium/DPR1 harness saat/PID/güç/build/fixture/kamera/faz/env kontrolü; gerçekbrowser kısa doğrulama+31generic ve18PID/15neighborunit verootinceleme.
- OSbirth1s/örneklerarasıgörünmeyenchild sınırı açık. Bu geçerli5A/BCPUsonucu,fullruntimeA/B,Δpanel,V11-18,Retina/nativeSafari veya fizikselFPS/gecikme kabulü değildir.
- İlgiliharness/runtime/fixture/browser/quality/platform değişimi etkilenenkontrolü yeniden gerektirir.

### TEST-16.02 — Instrumentation açık/kapalı maliyeti

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Instrumentation açık/kapalı maliyeti; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.03 — M aynı veri 1/5/10/20 liman AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: M aynı veri 1/5/10/20 liman AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.04 — L aynı veri 1/5/10/20 liman AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: L aynı veri 1/5/10/20 liman AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.05 — Yakın/iki liman/geniş harita AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Yakın/iki liman/geniş harita AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.06 — Panel açık/kapalı AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Panel açık/kapalı AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR; ölçüm sırasında diğer test workerları idle
- Kaynak / build / paket kimliği: FrozenA36d5b8f frontend/Bf32d6b23 frontend, commonbackend9d35acc9…; newharness checkpoint+exactSHA her manifestte
- Ortam / kullanılan kimlik ve yetki: MacM5/32GiB/macOS27.0.1, Chromium156/ANGLEMetal/medium/DPR1/1440x900/60HznativeCG; ownedfakeAPI5192/noKUBECONFIG. Gerçeklabstopped
- Başlangıç zamanı: 2026-11-12T17:29:43.124952+00:00
- Bitiş zamanı: —
- Durum: RETEST_REQUIRED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.06-S1 — Hazırlık
- [x] Sonluilkfamilyplan hazır: perf-open-events-five-pairs-root/plan.json;5eşleşmişAB/BA/AB/BA/AB,10seriwindow,her30swarm+60sölçüm,0otomatikretry,1800smax.
- YalnızaçıkNode0Özet/5event-s/M38;canonical20/300,başlangıçdetailed8/120. Fullruntime veyaΔpanelmatrixdeğil. Kapalı/0event diğer15pair ayrıdır.
- [x] ÖncekiFOV38nativeharnessscope/camera/pose/role/PNGeşdeğerliği test16.01de; product24default/kalite/su/seyir değişmez.
- [x] FreshnativeCG60Hz eskienvileeşleşti.
- [ ] Henüzgerçekn5windowbaşlamadı; sonpower≥40/lowpowermode0, portfree/sourcehash/ownedlabstopped/workeridle preflightsonrası.
- Herwindow300plan/apply/received+fullsignature/cohort/clock veM55/p9520/p9933.3/callbackstore100/drawproxy250 bütçesi kontrol edilir; ilkFAILsaklanır/stop, olumluörnekseçmeyok. CPUtimecore/RSSperPID ayrı, GPUCPU≠GPUusage/presentedFPS.
- İlkfeedback/panelreadylatency bu sürekli açıksenaryoda ölçülmez, ayrıV11-16kapısı açık.

Gerçekbaşlangıçpreflight tamam: commit3278451b cleantrackedtree/remoteeşleşti; Battery62/lowpower0/native60Hz/5192free/ownedlab2stopped/tümtestworkeridle. Kaynak/buildFOV38harness kimlikleri donduruldu; actualseriwindowkoşusu başlatıldı. Kanıt: perf-open-events-five-pairs-root/preflight.json. ÖlçümsırasındakiROADMAPilerlemekaydı yalnızbelgedir; runtime/harness/frozenassetSHAdeğişmez vecontrollerherwindowkontroleder.

BalancedmatrixöncesinormalUIgeçişkontrolü: tekfrozenB/M38/noeventrun open→normalDOMclose→nativeNode0reopen PASS; directkameraöncesi/sonrası arasında prepareCamera/focusyok. Aynıcanvas/selectedlabel+outlineUUID/fleet/UIDlar;herkameraalanırawtamaynı.3fullcanonicalsignatureeşit,eventCount0. AktifUI772ms/10s, app+browser+cleanup33.871/120s,19capturedidentityyok/5192free. Worker veRoot3PNGyi açtı,Root18SHA+raporinceledi. ROOT_VISUAL_REVIEW: labelgörünürlükfarklarını yalnızoocclusionile açıklamıyoruz;03tepaneldışısolCrashLooplabel01denfarklı, olasıframe/effect/portalzamansallığıkanıtlanmadı. Seçim/kameraPASS fizikselUIlatency/CPU/pixelequivalence değildir. Kanıt: artifacts/release-audit/ra-20261112/perf-panel-transition-worker/REPORT.md.

Yeni dengelimatrixplanı: perf-panel-balanced-five-blocks-root/plan.json;5block×2build×4condition40window/30+60,10seri6minjob/max4500s. Builtinconditionreversalonceoddblock, AB/BAbuildorderalternating. İlkopen-onlyv4seti bucausalΔpanelv5matrisinepoolyapılmaz. BaşlangıçBattery≥50/nextjob≥40/live≥35/settingslow0aynı, disk10GiB/RSS2+6GiB. Freshpreflight/rootlaunchhenüzgerekiyor; aktüelrun0.

Balancedv5actualbaşladı: preflight2026-11-12T18:43:44.929017+00:00; source7c9e9ffb/remoteaynı/cleantracked, Battery53/low0/owned2labstopped/5192free/tümtestworkeridle.10job40window/max4500s,0retry. Source/plan/validator14SHA+selfsealruntimekontrolü aktif; sadeceROADMAP/non-runtimeprogress güncellenir. Bu ayrıdengelimatris1saatliksüresiboyunca appyenidenbaşlattığından60dkcontinuoussoakolaraksayılmaz.

#### TEST-16.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

İlkpairp0 AB gerçek30/60windowları geçti:2/10window,1/5eşleşme. Herbirinde300plan/apply/received/kalıcıcanonicaltam içerikeşitliği, actualPIDbirth/cohort/clock veMframe/normalcallbackproxy bütçesiPASS. Hamvalidation+p0A/Bsummary veprocesssamples perffamilyklasöründe; n1CPUçıkarımı yok. Sıradaki p1 BA; source/build/kalite/phase sabit, diğerworkerlaridle. BütünfamilyveΔpanelhenüzaçık.

İkinci BA pair tamam:4/10window,2/5pair; bütünperwindow validity/frame/data/normalproxyguardsPASS. İlkdört koşu tarihselçıkarım yapılmadan saklandı; sıradakiAB. Genelphase/Δpanel/fullruntimehenüzaçık.

Üçpairtamam:6/10window,3/5pair; mevcut6validationPASS. Yalnızaçıkpanel5eventfamily; sonuçdeğerlendirmesi5pairsonrası. Retrying/samplediscardyok.

Dörtpairtamam:8/10window,4/5pair; mevcut8validationPASS. SonABçiftiplanınaynısıylasürüyor; beşpairtamamlanmadanCPUsonucuvegenelfazkapanışıyok.

İlkfamilytamam:10/10window,5/5pair,940.337sn/1800;3000plan/apply/received/fullnestedcanonical verdicttrue;MframeveproxybütçeleribütünkoşudaPASS. BrowserCPUmed0.686613→0.682294;pairedΔmed−0.000485core/paired%med−0.073972. Dağılımlarörtüşür;CPUgainiddiasıyok. İlkfamilyyalnızaçıkpanel5event; dengeliΔpanelmatrisiyerinegeçmez.

Balancedv5ilkAjob4/40windowvalid: closed0/open0/closed5/open5 sırası, fullcanonical0/300event/strictcohort-clock/Mbudget vejobendpower+cleanup+portfreePASS. p0-B aynı4koşulda sürüyor; henüzcompletepairedblock0/5, n1Δçıkarımıyok.

2026-11-12 devam kontrolü: 8/40 pencere jobvalidator ile doğrulandı; 1/5 tam A/B blok çifti. Aktif cat16-balanced-p1-B-20261112T185600Z. Ölçüm devam ederken ürün/harness/plan dosyaları değiştirilmedi; diğer worker ve owned lab idle/stopped. Nihai CPU yorumu bütün sonlu aile tamamlanınca yapılacak.

Balancedv5 ikinci B job tamam:12/40window/3job accepted, ilk AB çift tam/1of5; ikinci BA bloğunun A tarafı sürüyor. Perjob4exactcell/fullcanonical0+300/strictcohort-clock/Mbudget ve exactcleanup+portfree/powerguard PASS. Ara CPU çıkarımı veya faz kapanışı yok.

Balancedv5 iki tam blok/16of40window doğrulandı; AB ve BA kaynak sırası ikisi de tamam. Yeni p2AB aynı koşullarla sürüyor. Tamamlanan16cell için tamcanonical ve0/300event, Mdraw/proxy, processbirth/cohort/clock, perjobpower/cleanup kontrolleri geçti. Sonuçlar seçilmeden saklanır; kalan24window ve ikinci inceleme açık.

Balancedv5 20of40window/5seri job doğrulandı; iki tam blok ve üçüncüA tamam. p2B devam ediyor. İlk5job Mframe, fullnestedcanonical0/300, strictcohort-clock, perjobpower+cleanup+5192free PASS. Sonlu aileye ek tekrar yapılmadı; CPU/Δpanel yorumu n5 tamblok ve ikinci inceleme sonrası.

Balancedv5 üç tamblok/24of40window doğrulandı; AB/BA/AB kaynak sırası tamam. Dördüncü BA blok sürüyor. Mframe/fullcanonical0+300/strictobservedcohort-clock ve herjobsonu güç+exactcleanup+portfree PASS; CPUsonucuseçimi/otomatikretry yok. Son iki blok+ikinci inceleme açık.

Balancedv5 28of40window/7job accepted: üç tam blok + dördüncüB. DördüncüA koşul sırasının builtin ters haliyle devam ediyor; ilk28cell için validity/Mframe/fullcanonical/producer/cohort-clock+jobcleanup PASS. Ölçüm sonuna kadar diğer testworkerları idle ve lab stopped; ürün/harness değişikliği yok.

Balancedv5 dört tamblok/32of40window doğrulandı. Planın son AB bloğu başladı; ek tekrar yok. İlk8job ve32cell Mframe/fullcanonical0+300/producer/strictcohort-clock+power/cleanup/portfree kontrolleri PASS. Son8window, tamoffline değerlendirme ve ikinci inceleme açık.

Balancedv5 36of40window/9job accepted; son A da geçti. Planın yalnız son B4koşulu kaldı. Tamamlanan36cell ve9job için Mframe/data/producer/cohort-clock/power/cleanup PASS; ailesonu, tamoffline değerlendirme ve ikinci inceleme bekleniyor. Ürün kaynağı/kalite/ölçüm planı değişmedi; ek tekrar yok.

2026-11-12 22:45:02+03:00: 40/40pencere,5tamblok ve10seri job3677.400941sn içinde tamamlandı.0/300eventhücrelerinde toplam6000plan/apply/receive ve fullnestedcanonical verdictPASS; Mdraw59.991–60.030/sn,worstp9519.1/p9921.9ms. Bunlar mevcutvalidator kapsamındaki sonuçlardır; aşağıdaki ek renderbulgusu nedeniyle aile nedenselCPU kabulü değildir.

#### TEST-16.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

BENCH-RENDER-001: Root ve ikinci reviewer tüm40envanter/rawframe dağılımlarını okudu. p3-B açık5/s fazladan çizim ölçüm boyunca sürüyor: ilk2frame435vs434, sonraki12frame445vs444. BazıB hücrelerinde +1allocatedgeometry var. Kamera/fleet/UID/panel/triangle eşitliği tekbaşına actualrender-work eşdeğerliğini kanıtlamıyor; rawframe line/objectUUID yok. Mevcut automatedcomparator comparable=true yalnız eksikguard evrenini gösterir. Aile kabulü AÇIK; ek60dk koşu otomatik başlatılmadı.

#### TEST-16.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

Ölçümsonu maxsinglebrowserPIDRSSBbeşçifttearttı:+4.531…22.063MiB/med9.391;hepsiRenderer. JSused/totalheap farklarıkarışık, nedenbelirsiz. Zamanserisipeak/retainedmemory/leak/noise/genelRAM diye kapanmadı; kaynakdiff5runtime dosyada namespaceguard/camera/labelplacementdeğişimi var fakat nedenselmekanizma kanıtlanmadı. Ek sonlumemorydiagnosticveuzuntrendkapısı açık. REPORT-IDENTITY-001 ilkoffline reducer absentprovenance.commit→nullalanı; ilksonuç/sourcekorundu, frozenidentitychain/offlineretectdüzeltti,13metricaynı/newCPUrun0.

PRE-RUNreview3helpergap(AC/lowpowerguard,perjobcleanupgating,reserve8vs15) buldu; originalNOTREADY/sourcekorundu. CorrectedBattery/settingspoll+jobend/perjobPID+portgate/reserve15 sourcereview ile doğrulandı. Root7powerASTunit+2actualownedprewrite-reentryfixturePASS; hiçbirappbaşlamadı. Finalprewriteguard supervisor/executionvarsa hiçbiroutputyazmadanrejecteder, source/plan/validatorheshleri veexactopenbody/livejobmetadataeklendi. Eskiarchivedwrapperlar reentry-safe değildir; yalnızbirkezrunedildi/kanıtlarıintact, tekraraynıfolderderunönerilmez. Kayıt: perf-panel-balanced-five-blocks-root/ROOT_REVIEW.md +plan-review-worker/REPORT.md.

Yeni test-aracı bulgusu BENCH-RENDER-001: validator/comparator actualrender-work kimliği/eksik eşdeğerlik kanıtını yeterince denetlemiyor. Henüzürünhatası, bellek sızıntısı veya hover nedeni doğrulanmadı. Enküçüksonraki iş kısa renderedobject/geometry/material+hover/reset tanılamasıdır. İlkarchive helper suffix filtresi0file verdi; ilkRAW_INDEX-initial-zero-files.json başarıdeğil diye korundu. Correctedarchive.py exact70ad/JSONparse/decompress/byteequal ve nooverwrite ile geçti; measurement yenidenkoşulmadı.

Yeni sonlutanılama: yalnız2A/Bjob/30swarm+15active,toplam98.724sn+cleanup/600sphase,0retry. BENCH-RENDER-001 NOT_REPRODUCED; iki tarafta before426/60/32geom, active/after434/60/34. Maincameracallback238→246aynı, sadeceblueNode0outline/R3Fhovermapboş; geçmişfarkınhovernedeni kanıtlanmadı. LiteralUUIDalanları hariçgeometriattribute/indexbyteSHA+material/target/countmultiset4noktadaeşit; bütüninstance/uniform/atomicpose/pixeleşitliğideğil. Hamprofiler=false korunur, ayrıkclassificationinstrumented/noCPUacceptance açık.

BENCH-RENDER-001 otomatikguard kısmı düzeltildi: comparePanels eşleşmişaynıblock+scenario before/aftercalls/triangles/lines/points ve summarycalls/trianglespercentile bilgilerini değerlendirir. Eksik/nonfiniteUNKNOWN, farkREQUIRES_RENDER_EQUIVALENCE_REVIEW; eski otomatikcomparabletrue engellendi. Bu birproduct/sahnefixi değil. Allocationgeometry/texture ayrıobservation; farklıdrawcallsbatchingvarsa semantik/görselincelemeister, otomatikregresyondeğil.

#### TEST-16.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

Offline reduce.mjs syntax ve tam40cell çalışmasıPASS; mevcutcomparePanels sonuçları ve52metrikCSV saklandı. Sayısalworker 40window×5CPUrolünü OS sayaç/duvarsüresinden bağımsız türetti,480araörnek/4.786alan max3.55e−14 fark. OlaylıΔpanel Amed0.010467/Bmed0.044199core, pairedΔB−ΔA med+0.013225/range−0.010735…+0.135490. Renderbulgusu nedeniyle nedenselCPUsonucuyok. Güncelürünoptimizasyonu/kalite/refreshdeğişikliği0.

REDoldcomparator5pass/7expectedfail; correctedtargeted+metrics/generic49/49pass,0skip,0.797s. Yeniartifactte eski40cellofflineoldtrue→newfalse/reviewrequired;3pairedcell işaretlendi,bilinenp3B+1call/+12line dahil. CPUtable/delta/samples/inputs exactaynı ve178historicalfileSHAdeğişmedi; yeniCPUwindow0. Rootdiff/testsve22SHAyıikinciinceledi.

#### TEST-16.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

125capturedrefabsent/5192free/backend+harnessSHAaynı/Battery62→59/otherworkersidle.10rawJSONgzip5.09MB→306KB/decompressSHA,indexmanifestvar. Farklıproviderworker58inputhash/13metricsignedpair/10rawframe+300uniqueeventsve14snapshots/window/source98files+6assetsperfront/cleanup/powerinyenidenhesapladı. RootreviewREPORT+2SHAkontrolü yaptı. Finalnestedobjedump yok;sourcefullnestedcanlıverdiktlerininincelenmesidir. Kanıt: perf-open-events-five-pairs-root/REPORT.md +../perf-open-events-second-review-worker/REPORT.md.

[x]247yakalanmışprocessidentityabsent/5192free/14sealedSHA+backendaynı.371powerrecord Battery53→43/aynıpmset/low0. [x]70rawJSON24,481,650byte→1,604,492gzipbyte roundtripSHAilekorundu. [x]Backendworker sayısal, providerworker127input+2outputSHA/kapsam incelemesini bitirdi; aynıajansistemi, profesyonelüçüncütarafdeğil. Guard+dataPASS, RENDER_COMPARABILITY_UNRESOLVED; RSSvegeometrymekanizması açık. Kanıt: perf-panel-balanced-five-blocks-root/{REPORT.md,ACCEPTANCE.json,RAW_INDEX.json} +perf-balanced-{numeric,evidence}-review-worker/REPORT.md.

Tanılamada75+75plan/apply/receive ve fullcanonicalverdikttrue.39capturedidentityabsent/5192free; kaynak/frozenbackendaynı. Worker8PNGyi,Root4before/afterPNGyi gerçektenaçtı;Root41SHAyı doğruladı. AsyncHashsonrasıtransformörnekleri atomicframepozu değildir; maincamera238/246callback shadowpasslarındışıdır. Tanılama518.3/600s; sorunyenidenoluşmadı diye geçmiş40windowkabulü kapatılmadı. Kanıt: perf-render-identity-diag-worker/REPORT.md +ROOT_VISUAL_REVIEW.json.

Guardfix kod/kanıtı render-work-guard-worker/{REPORT.md,result.json,ROOT_REVIEW.json}. Mevcutactualworld/kamera/UID/GC/gölge/su/seyir kaliteveveri yoludeğişmedi. Eski source/baseline kayıtları yeni guardla eskidengerçekleşmiş gibi düzeltilmedi. Mevcutcounterguard tümsemantic/instance/materialeşitliğinin kanıtıdeğil.

#### TEST-16.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- RETEST_REQUIRED: otomatiksubmitted-workguard açığı RED→GREEN+offlinehamveriyle giderildi; fakat geçmişekçizimin nesne nedeni/RSSmekanizması ve controlledsame-workCPUmatrisinin kabulü açık.
- İkikısatanılamadafarkyenidenoluşmadı; bu findingi kapatmaz. Yeni sonluplan/somutsoru olmadan60dkmatris otomatiktekrarlanmaz.
- Fullruntime/V11-18/continuous60dk/finalpaket ve manuelkapılar ayrıaçık.

### TEST-16.07 — Log statik/akış/uzun satır AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Log statik/akış/uzun satır AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.08 — Trafik açık/kapalı AB sabit provider

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Trafik açık/kapalı AB sabit provider; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.09 — Normal/burst veri AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Normal/burst veri AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.10 — Tek/çok arıza AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Tek/çok arıza AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.11 — Motion-off idle AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Motion-off idle AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.11-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.11-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.11-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.11-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.11-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.11-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.12 — Cold start/liman switch AB

- Kategori: CAT-16.
- Amaç / kullanıcı riski: Cold start/liman switch AB; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.12-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.12-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.12-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.12-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.12-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.12-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.12-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-16.13 — V11-18 eski CPU kapısının ayrı değerlendirilmesi

- Kategori: CAT-16.
- Amaç / kullanıcı riski: V11-18 eski CPU kapısının ayrı değerlendirilmesi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT16 A/B sabit kalite,5eşleşme,30s+60s; M/L CPU/frame bütçeleri; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.13-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.13-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.13-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.13-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.13-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.13-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.13-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-17 — Kaynak optimizasyonu

### TEST-17.01 — Frontend React/store profiler adayı

- Kategori: CAT-17.
- Amaç / kullanıcı riski: Frontend React/store profiler adayı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT17 ölçülen net kaynak kazancı ve eşit kalite/işlev; teknoloji değişimi kanıt gerektirir. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR; profiler henüz çalışmadı
- Kaynak / build / paket kimliği: FrozenfrontendA36d/Bf32, commonbackend9d; başlangıç5pairmekanizmaistatistiği
- Ortam / kullanılan kimlik ve yetki: AynıMacM5/ChromiumM38/DPR1 sentetikcanonicalM; yeni ürün değişikliği yok
- Başlangıç zamanı: 2026-11-12T18:01:07.324485+00:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-17.01-S1 — Hazırlık
- [x] Başlangıçölçümü5pair açıkpanel5eventfamilyden alındı; BRendererRSS5/5artış/+9.391MiB medyan;source5runtimefilediff veused/totalJSheapiletriage yapıldı.
- [ ] HenüzReact/V8allocation/retained/nativeprofilerkoşusu veya küçükürünoptimizasyonadayı uygulanmadı.
- Somutsoru: RSSartışı retainedJS/cachebüyümesi mi, GC/capacity/native/raster ayrımı mı? Kaynakdiff tekbaşına nedenkanıtıdeğildir.
- Kanıt: perf-open-events-five-pairs-root/memory-source-triage.json ve REPORT.md.

#### TEST-17.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.01-S4 — Bulgular ve düzeltme
- Açıkbellekgözlemi:pairedRSS+Bbeşçiftte4.531…22.063MiB;JSheapused/totalişaretlerikarışık. Noise/leak/leakfreediyekapatılmadı. Backend0.003core/browser0.68core ölçümü bufixtureda tarayıcıyıönceliklendirir; başka dil/backendmigrationıDOM/rendererRSSyi çözerdiye varsayılmaz.
- Yeni ürünoptimizasyonu/Worker/WASM/dilgeçişi yok. Profiler+hypothesis+netfayda/retest olmadan toplamtasarrufiddiası üretilmedi.

#### TEST-17.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-17.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-17.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- IN_PROGRESS: baseline+somutmemorysorusu hazır, mekanizma ve adayın totalcosttanısı henüz yok. Uzunaynıworkingset/GC/cleanup kapıları ayrıca açık.

### TEST-17.02 — Log/tablo/layout allocation adayı

- Kategori: CAT-17.
- Amaç / kullanıcı riski: Log/tablo/layout allocation adayı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT17 ölçülen net kaynak kazancı ve eşit kalite/işlev; teknoloji değişimi kanıt gerektirir. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-17.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-17.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-17.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-17.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-17.03 — Raycast/matris/traversal/material adayı

- Kategori: CAT-17.
- Amaç / kullanıcı riski: Raycast/matris/traversal/material adayı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT17 ölçülen net kaynak kazancı ve eşit kalite/işlev; teknoloji değişimi kanıt gerektirir. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-17.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-17.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-17.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-17.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-17.04 — Backend watch/JSON/snapshot/izin/lock adayı

- Kategori: CAT-17.
- Amaç / kullanıcı riski: Backend watch/JSON/snapshot/izin/lock adayı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT17 ölçülen net kaynak kazancı ve eşit kalite/işlev; teknoloji değişimi kanıt gerektirir. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-17.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-17.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-17.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-17.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-17.05 — Çok liman güvenli abonelik paylaşımı adayı

- Kategori: CAT-17.
- Amaç / kullanıcı riski: Çok liman güvenli abonelik paylaşımı adayı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT17 ölçülen net kaynak kazancı ve eşit kalite/işlev; teknoloji değişimi kanıt gerektirir. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-17.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-17.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-17.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-17.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-17.06 — Worker/WASM/dil göçü net maliyet kararı

- Kategori: CAT-17.
- Amaç / kullanıcı riski: Worker/WASM/dil göçü net maliyet kararı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT17 ölçülen net kaynak kazancı ve eşit kalite/işlev; teknoloji değişimi kanıt gerektirir. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-17.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-17.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-17.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-17.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-17.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-18 — Uzun kararlılık ve kurtarma

### TEST-18.01 — Final60dk kesintisiz karma kullanım ve20dk ara kontrol

- Kategori: CAT-18.
- Amaç / kullanıcı riski: Final60dk kesintisiz karma kullanım ve20dk ara kontrol; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT18 kesintisiz60dk/50panel/3reconnect/canonical eşitlik; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: AppleM5/macOS27/Battery45%, estimated48min; ownedlab. Final60minsoak başlamadı.
- Başlangıç zamanı: 2026-11-11T16:03:17.129866+00:00
- Bitiş zamanı: —
- Durum: BLOCKED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-18.01-S1 — Hazırlık
- [ ] Kesintisiz60dk finalsoak için yeterli güç/awakepencere hazır değil.
- Gözlenen: Battery45%/estimated48min; bugün gerçekClamshellSleep de kaydedildi.
- Karar: usertalimatına göre düşük/yetersizpil koşulunda uzunkoşu başlatılmadı; yarımkoşuPASS yok.
- Kanıt: artifacts/release-audit/ra-20261111/hubble-1204-warm-retest-worker/ROOT_ENVIRONMENT_ADDITION.json

#### TEST-18.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-18.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-18.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-18.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: BLOCKED güç/awakepencere ve finalcandidate önkoşulu; yeni60dkbaşarılıkoşu yok.
- Açılma koşulu: finalsourcefreeze, yeterligüç ve kesintisizownedtestpenceresi; dahaönce tamamlananbağımsızfazlar yenidenkoşulmaz.

### TEST-18.02 — 50 panel/log çevrimi ve3 reconnect cleanup

- Kategori: CAT-18.
- Amaç / kullanıcı riski: 50 panel/log çevrimi ve3 reconnect cleanup; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT18 kesintisiz60dk/50panel/3reconnect/canonical eşitlik; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-18.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-18.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-18.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-18.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-18.03 — Son canonical içerik ve aynı working-set trendleri

- Kategori: CAT-18.
- Amaç / kullanıcı riski: Son canonical içerik ve aynı working-set trendleri; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT18 kesintisiz60dk/50panel/3reconnect/canonical eşitlik; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-18.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-18.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-18.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-18.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-18.04 — Gerçek hidden/minimize ve geri dönüş

- Kategori: CAT-18.
- Amaç / kullanıcı riski: Gerçek hidden/minimize ve geri dönüş; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT18 kesintisiz60dk/50panel/3reconnect/canonical eşitlik; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-18.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-18.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-18.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-18.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-18.05 — Uyku/enerji/disk kesinti kurtarma

- Kategori: CAT-18.
- Amaç / kullanıcı riski: Uyku/enerji/disk kesinti kurtarma; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT18 kesintisiz60dk/50panel/3reconnect/canonical eşitlik; güvenlik sertifika iddiası yok. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-18.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-18.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-18.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-18.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-18.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-19 — Gecikme/erişilebilirlik/tarayıcı

### TEST-19.01 — İlk geri bildirim p95≤100ms proxy

- Kategori: CAT-19.
- Amaç / kullanıcı riski: İlk geri bildirim p95≤100ms proxy; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR + KV-SECURITY-WORKER
- Kaynak / build / paket kimliği: csp07binary322bd…; TEST/REPLAY M5, DPR1, Chromium SwiftShader tanılama
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: main-csp-diagnostic-worker/result.json exacttimes
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.01-S1 — Hazırlık
- [x] Ownedapp, HTML/index/hash, canonical20Node300Pod ve pointer/DOM semantiği ayrı kaydedildi.
- Kanıt: main-csp-diagnostic-worker/REPORT.md; result.json

#### TEST-19.01-S2 — Normal kullanım / pozitif kontrol
- [ ] İlk feedbackp95≤100ms ve temelpanelp95≤200ms ölçülmedi.
- Normal Bul dialogu açıldı; Playwright scheduled navigation bekleyişi timeout oldu. Bu7sn fiziksel ekran veya kullanıcı geri bildirim gecikmesi sayılmadı.

#### TEST-19.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: latency dağılımı/fiziksel ölçüm yok; tool completion ile DOM tepkisi ayrıldı.
- Önce harness load/kind/renderer koşulları doğrulanacak.

### TEST-19.02 — Temel panel gerekli kontrolleri p95≤200ms proxy

- Kategori: CAT-19.
- Amaç / kullanıcı riski: Temel panel gerekli kontrolleri p95≤200ms proxy; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-19.03 — İki liman haritası/switch gecikmesi

- Kategori: CAT-19.
- Amaç / kullanıcı riski: İki liman haritası/switch gecikmesi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-19.04 — Arama/focus/form/log/terminal gecikmesi

- Kategori: CAT-19.
- Amaç / kullanıcı riski: Arama/focus/form/log/terminal gecikmesi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-19.05 — Klavye/Escape/focus dönüşü

- Kategori: CAT-19.
- Amaç / kullanıcı riski: Klavye/Escape/focus dönüşü; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-19.06 — Dar ekran/tema/reduced-motion

- Kategori: CAT-19.
- Amaç / kullanıcı riski: Dar ekran/tema/reduced-motion; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-19.07 — Etiket/traffic başlığı kırpılması

- Kategori: CAT-19.
- Amaç / kullanıcı riski: Etiket/traffic başlığı kırpılması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: 2461bbfb +5frontend dosya farkı; visual06 e582a5bd… /index0e478e0c…; exactmanifest
- Ortam / kullanılan kimlik ve yetki: Owned07 M5REPLAY saltokunur, Chromium156/WebKit27.2, DPR1; gerçek02 veya finalarchive değil.
- Başlangıç zamanı: 2026-11-11T14:31:09.525082+03:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.07-S2 — Normal kullanım / pozitif kontrol
- [x] UI-002viewport dışına taşan seçiliPod etiketi gerçekPNG ile doğrulandı.
- Düzeltme: mevcutDreiHtml calculatePosition içinde worldanchor projeksiyonu ve cached label ölçüsüyle viewportclamp; içerik/resize sırasında ölçüm, framebaşına DOMread/observer/timer yok.
- Gözlenen:226frontendtest/build, WebKit1440/1280/76815kontrol PASS; rootworld768PNG açtı, etiket viewportta ve Proje2 adı okunur.
- Kanıt: ui04-label-webkit/result.json; world-768.png; label-fit-unit.log
- Sınır: bütün trafikbaşlığı/overlay konumları henüz test edilmedi.

#### TEST-19.07-S3 — Negatif / sınır / arıza kontrolü
- [x]390phone kullanıcı Limanadön eylemi sonrası iki merkez/finder5kontrol PASS; ilkhelpercachedkadrajFAILkorundu.
- [ ]390globalmaptePodetiketi Proje1isim-balonu ileörtüşüyor; viewporttaşmasıgiderildi fakat buP2açık.
- Kanıt: ui04-phone-framing-chromium/world-390.png rootgerçektengörüntüledi; center390panelkendi scrolluylaokunur.
- Sonuç: kapsamın yalnız clipping bölümü geçti; bütün etiket/trafficbaşlığıkabulü kapanmaz.

#### TEST-19.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

- 11 Kasım ek aday: selected label mevcut cached nameplate sınırlarını gözetir (16anchor/8engel/33aday üst sınırı);228frontend+buildPASS.
- Chromium/WebKit390/768/1440 altıREPLAYekranı worker açtı; root390Chromium+1440WebKit görüntülerini ayrıca açtı. Seçili mavi etiket/ad kesişmesi0; turuncu arıza izleri390isimleri kapatıyor ve uzun liman adları kesiliyor. Bütün UI-002 kapanmadı.
- Kanıt: artifacts/release-audit/ra-20261111/label-overlap-worker/REPORT.md; visual-final-*/result.json; source.diff
- Kaynak:496729e2 üstü3dosyafarkı, binary3ddc2feb…; gerçek02 ve trafikbaşlığı retest henüz yok.

- Ek root onarımı: sabit14000 sis ufku, phone global haritadaki geometrinin görünmesini engelliyordu; ilk unit FAIL→mesafeye uyumlu sis ilePASS. Yakın atmosfer ve kamera pose/zoom korunur. width:max-content, dar dikey etiket kusurunu giderdi.
- 229frontend test+build; Chromium/WebKit390/768/1440 altıekran PASS, altısı image tool ile root tarafından açıldı. GerçekK8s/perf/nativeSafari kabulü değildir.
- Kanıt: artifacts/release-audit/ra-20261111/overview-fog-retest/REPORT.md; manifest.json; visual06-*/result.json. visual05 yanlış hazırlık nedeniyle INVALID ve kullanılmadı.
- Açık: uzun liman isimlerinin kendi aralarında/kenarla çakışması ve turuncu arıza caption'ları; TEST19.07 IN_PROGRESS kalır.

#### TEST-19.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Gerekçe: seçili etiket için dar düzeltme geçti, telefon arıza izleri ve isim okunurluğu açık.
- Yeniden test: label/nameplate/fault caption yerleşimi, CSS, kamera veya viewport değişimi.

### TEST-19.08 — V11-16 fiziksel sunum ayrı kabul kapısı

- Kategori: CAT-19.
- Amaç / kullanıcı riski: V11-16 fiziksel sunum ayrı kabul kapısı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-19.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-19.09 — Native Safari/Retina ile WebKit ayrımı

- Kategori: CAT-19.
- Amaç / kullanıcı riski: Native Safari/Retina ile WebKit ayrımı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT19 ilkfeedback100ms/temelpanel200ms ve fiziksel-proxy ayrımı; klavye/focus/reduced-motion. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR; security worker yalnız bounded kaynak tanılama
- Kaynak / build / paket kimliği: 87e7dfe8 + private capability helper; snapshot native-safari-capability/first-helper.py. Ürün binary kullanılmadı.
- Ortam / kullanılan kimlik ve yetki: macOS27.0.1/Apple M5; installed safaridriver Safari27.0.1, owned port19845. Session/OS ayarı/kişisel sayfa erişimi yok.
- Başlangıç zamanı: 2026-11-11T17:17:48.720855Z
- Bitiş zamanı: Retest2026-11-11T17:23:29.515876Z,0.211336sn/45sn sınırı. Session yaratılmadı; Safari uygulama kabulü yok.
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- İlk native driver probe: version çıktı, readiness döngüsü sonrası launcher-PID lsof ownership guard exit1/CalledProcessError. Session oluşturma aşamasına ulaşılmadı. Kaynak/result ilk haliyle saklandı.

- Tek somut düzeltme: PID filtresi yerine exact port bütün listenerları okundu. Native launcher53153, HTTPService XPC listener53154/PPID1 farklıdır; iki bind adresi de loopback. Bu canlı veri ilk PID-filtresi eksikliğini açıklar.

Yeni ayrı MCPmetadata işi: kurulu safaridriver --mcp doğrudan sahip olunan stdio child ile çalıştı; initialize0.205sn/144byte. Server Safari1.0.0/proposal2024-11-05; client yalnız2025-11-25 desteklediği için spec gereği disconnect. Bu client sürüm sınırıdır; Safari/izin hatası değildir. initialized/tools/list/toolcall gönderilmedi. Kanıt: artifacts/release-audit/ra-20261111/native-safari-mcp-discovery-worker/REPORT.md.

Ayrı compatible probe: documented2024-11-05 agreement→initialized→tools/list,17gerçek tool/paginationfalse.0.170017sn/11811byte; child82246EOFexit0. Bunlar metadata keşfidir; tools/call yok, gerçek automation izni/app/Retina kabulü değildir. Önceki protocol-limit kaydı değişmedi. Kanıt: artifacts/release-audit/ra-20261111/native-safari-mcp-compatible-worker/REPORT.md.

#### TEST-19.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

İlk owned-tab uygulama smoke görevi NOT_RUN_TIME_BUDGET ile durdu:300sn içinde plan/source review sonrası güvenli runtime süresi kalmadı;18:44:19 kaydı korunur. Candidatef9 hash doğrulandı fakat app/driver/tab/tools-call0. Bu ne productFAIL ne automationdenial ne SafariPASS. Kanıt: native-safari-owned-tab-worker/REPORT.md/result.json.

Gerçek capability: owned MCP child86590, create_tab(about:blank) tek yeni handle döndürdü; yalnız o handle close_tab ile kapandı.0.941306sn/403byte, EOFexit0. Bu gerçek browser tool invocationdır; KubeView UI/DPR/Retina veya performance değildir. İzin ayarı değiştirilmedi, mevcut sekmeler okunmadı. Kanıt: native-safari-blank-tab-worker/REPORT.md/result.json.

İlk gerçek app smoke: data-dir0755 yanlış yardımcı izninde app87881exit1; driver/sekme açılmadı. Mevcut0700 güvenlik kuralı korundu. Runtime0.216sn, prep81sn>60sn; ilkstderr atıldığı için tam çıkış mesajı bilinmiyor. Root staticstore.go/private izin sözleşmesini inceledi. Kanıt: artifacts/release-audit/ra-20261111/native-safari-app-smoke-worker/REPORT.md.

Ayrı düzeltme sonrası0700 verified, actualapp88301 sağlıklı ve19843listener owned; native ownsekme88305 açıldı. İlk evaluate yanıtı decodednull olduğundan tüm UI/PNG/DPR assertionları durdu; raw successfulresponse saklanmadı. App/sekme/driver temiz kapandı; port boş. Bu ürünrenderFAIL kanıtı değildir. Kanıt: artifacts/release-audit/ra-20261111/native-safari-app-smoke-retest-worker/REPORT.md.

Farklı ve bounded tanı gerçek kurulu araç sözleşmesini gösterdi: evaluate_javascript functionbody ve explicitreturn istiyor. Ownedblanktab üç sabit expression:1+1→null,JSON.stringify→null,return1+1→2; ham yanıtlar korundu. Önceki app yardımcı kodundaki dışreturn eksikliği belirlendi; uygulama render sonucu hâlâ kanıtlanmadı.0.888sn, exactownhandleclose/EOFexit0. Kanıt: artifacts/release-audit/ra-20261111/native-safari-evaluation-contract-worker/REPORT.md.

Explicitreturn düzeltmesiyle tek native app denemesi JS düzeyine ulaştı: complete/onecanvas/emptyConnectButton/workspace0, gerçekUA Safari27.0.1 ve reportedDPR2. Canvas o gözlemde300x150 intrinsic/rect; fullscreen veya framebuffer/Retina kabulü değildir. İlk screenshot yanıtı helperın one-imageblock varsayımına uymadı; rawshot saklanmadı. Form/PNG/samecanvas/pointer kabulü yapılmadı. Runtime1.651sn, app91715/driver91719/ownedtab cleanup ve port19843 boş. Kanıt: native-safari-app-contract-retest-worker/REPORT.md/result.json.

Nativevisualcapture scopedPASS: installedscreenshot kontratı filepath; explicitownedsavePath iki gerçekPNG üretti. Readiness ilk300x150kareyi reddedip ikinci1024x664CSSviewportı doğruladı. Safari27.0.1/reportedDPR2, canvasintrinsic1433x929 ayrı kaydedildi. Programmatikformopen/type/close samecanvas geçti. Actual2PNG2048x1328 hemworkerhemroot view_image ile açıldı; fullworld/opaqueform/noDashboard görüldü. Runtime2.764sn; exactownapp93508/driver93512/tabcleanup ve19843boş. Kanıt: native-safari-visual-capture-worker/REPORT.md/ROOT_VISUAL_REVIEW.json.

#### TEST-19.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

- [ ] Native Safari uygulama/Retina/automation izni doğrulanmadı. İlk kurulum assertion'ı FAILED; WebKit PASS ile yerine konmadı.
- OS --enable/ayar değişimi yapılmadı; gerçek üretim veya kişisel sayfa hedeflenmedi.

- Authoritative XPC responsibility→owned launcher bağı kurulamadığı için sıkı guard korundu ve POST/session gönderilmedi. Aynı UID/Apple imzası/HTTP200 tek başına kaynak kimliği kabul edilmedi.
- Bu mevcut helper'ın instrumentation sınırıdır; Safari uygulaması bozuk, izin reddedilmiş veya platform desteklenmiyor sonucu değildir. Başka doğrulanmış native yöntem/attribution kanıtı gereklidir.

#### TEST-19.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

Native yardımcı sınırları: önce0700izin, sonra installed function-body explicitreturn sözleşmesi düzeltildi. Şimdi screenshot yanıtı ve async tamviewport readiness için doğru araç kontratı/kalıcı rawresponse gerekiyor; ürünrender veya GPU arızası iddiası yok. Genel faz açık.

#### TEST-19.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-19.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

- [x] Owned driver sonlandırıldı. İlk bindfalse sonucu ayrı durur; sonraki lsof/pgrep boş ve connect refused gözlemi var. Bu bir driver leak kanıtı değildir.
- Kaynak: artifacts/release-audit/ra-20261111/native-safari-capability/REPORT.md; cleanup-followup.json.

- [x] Owned launcher SIGTERM sonrası çıktı; exact port LISTEN kaydı yok. XPC veya kullanıcı PID'si ayrıca öldürülmedi; immediate bindfalse ham kaydı leak diye yorumlanmadı.45sn sınırında, otomatik devam/retry yok.
- Kanıt: artifacts/release-audit/ra-20261111/native-safari-capability-retest/REPORT.md; result.json; tested-helper.py.

MCPmetadata probe child80131 stdinEOF ile exit0; bütünpipes kapandı. Session/page/OS ayarı veya kullanıcı verisi hedeflenmedi. Root üç artefakt hashini doğruladı. İlk HTTP XPC guard sınırı tarihsel kalır; bu metadata işi native app/Retina kabulünü kapatmaz.

Root compatible receipt/SHA/projection sınırını inceledi; toolnames doğru, sadece structural schema taşındı. XPC HTTP guardı gevşetilmedi; alternatif directownedstdio transport doğrulandı. Gerçek fresh-owned-tab uygulama smoke ayrı uygulanabilir sonraki iş.

Root iki worker artefakt hashini ve exact-created-handle cleanup sonucunu inceledi. Stdio native yol artık gerçek blanktab düzeyinde çalıştığı için eski HTTPXPC helper engeli alternatif yolla aşıldı; genel faz actualapp/Retina için IN_PROGRESS kalır.

Root receipt/checksum ve dar yardımcı kaynak yolunu inceledi. İlk başarısız/blocked kayıtlar değişmedi; yalnız own app/tab/process kapatıldı. Bu alt iş genel Safari/Retina veya fiziksel gecikme kabulü değildir.

Root receipt/checksum ve dar yardımcı kaynak yolunu inceledi. İlk başarısız/blocked kayıtlar değişmedi; yalnız own app/tab/process kapatıldı. Bu alt iş genel Safari/Retina veya fiziksel gecikme kabulü değildir.

Root receipt/checksum ve dar yardımcı kaynak yolunu inceledi. İlk başarısız/blocked kayıtlar değişmedi; yalnız own app/tab/process kapatıldı. Bu alt iş genel Safari/Retina veya fiziksel gecikme kabulü değildir.

Bu scope temel nativeSafari boşbaşlangıç ve programmaticDOM akışıdır. Realpointer, directGLdrawingBuffer/rendererDPR2, fizikselRetina veperformans kabulü NOTRUN; phase genel kapsamı IN_PROGRESS kalır. Ekran görüntüsü fizikselpresentedlatency yerine kullanılmadı; eskiV11-16/18/19 kapıları değişmez.

#### TEST-19.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- IN_PROGRESS: İlk HTTP attribution ve NOT RUN kayıtları korundu. Alternatif ownedstdio yolunda gerçek boş sekme açma/kapatma geçti; KubeView uygulama/render/Retina kapsamı henüz doğrulanmadı. WebKit veya metadata PASS ile yerine konmadı.
- Sonraki iş: yalnız owned app sekmesinde native Safari UI ve gerçek raporlananDPR/framebuffer kaydı; fiziksel gecikme/performans kabulü ayrı kalır.

## CAT-20 — Paket/güncelleme/CI

### TEST-20.01 — Repo/Go/Node/Vite olmadan temiz arşiv açılışı

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Repo/Go/Node/Vite olmadan temiz arşiv açılışı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR + packaging worker
- Kaynak / build / paket kimliği: Son başarılı CI: PR head3bdb7c0c; gerçek checkout/build5373657169e8bf332940fd2366022925f48eb85c. Her iki full Git tree2112579043ca1325013f7b5bac6b95fc7d0d3164 eşit. Artifact13874845784 ZIP SHA4a2d8905… doğrulandı; final teslim kabulü değil.
- Ortam / kullanılan kimlik ve yetki: GitHub Actions native Ubuntu Linux CI; ayrı macOS native arşiv incelemesi sürüyor. Yerel AC Power/charging düşük pil; ağır lab/perf/soak kapalı.
- Başlangıç zamanı: 2026-11-11T13:20:17.412070+00:00
- Bitiş zamanı: Native finalization2026-11-11T17:11:45.884645Z. Faz206.97622sn,240sn sınırında. CI43062361657 ayrı native Linux smokePASS.
- Durum: RETEST_REQUIRED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.01-S1 — Hazırlık
- [x] Yeni, özel output dizini ve sentetik build executor fixture hazırlandı; önceki arşivlere dokunulmadı.
- Komut: node --test --test-concurrency=1 scripts/build-release.test.mjs
- Kanıt: artifacts/release-audit/ra-20261111/packaging-root-retest/manifest.json

#### TEST-20.01-S2 — Normal kullanım / pozitif kontrol
- [x] Hazırlanmış/normal frontend, hedef/platform seçimi ve runtime-only manual-lab dosya akışı fixture ile sınandı.
- Gözlenen: 11/11 fixture test PASS.
- Sınır: executor sahte; gerçek binary/tar/temiz paket başlangıcı henüz çalışılmadı.
- Tarihsel ilk8 test: artifacts/release-audit/ra-20261111/packaging-worker/packaging-fixture-tests.log
- Yeni retest: artifacts/release-audit/ra-20261111/packaging-root-retest/packaging.log

- Üç exact kaynak CI koşusunda frontend ve gerçek darwin-arm64/linux-amd64 paket derleme adımı success. Bunlar temiz runtime kabulü veya opt-in gerçek Kubernetes testlerinin geçtiği anlamına gelmez.
- Job/step ve seçili public APT hata kanıtı: artifacts/release-audit/ra-20261111/ci-package-dns-evidence/results.json.

- Yeni CI run43062361657/job130668033624 tüm adımları PASS: Playwright kurulumu, copy-out Linux binary startup, gerçek boş workspace/ilk liman formu browser smoke1PASS ve artifact upload. Önceki DNS FAIL/SKIPPED sonuçları değişmedi; retry/workflow değişikliği yok.
- PR head ile build SHA aynı değildir. Root exact merge commit ebeveynlerini ve full tree eşitliğini git show/diff ile doğruladı; binary provenance5373657 kalır. Kanıt: ci-package-success-3bdb7c0c/merge-identity.json.

- Arşiv incelemesi: ZIP/both tar checksum, iç/dış provenance ve exact allowlist60member/118,777,814expanded-byte sınırında doğrulandı. Link/special/encrypted/duplicate/traversal girişleri kabul edilmedi; extractall kullanılmadı.
- Tek native darwin-arm64 --version0.578202sn/exit0; gerçek build5373657, PATH/usr/bin:/bin, HOME korundu. Fresh cwd boş ve --data-dir yok kaldı. Server/UI veya provider başlamadı.

- [x] Yeni native Mac standalone job: repo/.git dışında yeni0700 bundle, uygulama PATH'i boş owned tools dizini; HOME korundu ve explicit nonexistent kubeconfig kullanıldı. Gerçek embedded HTML/JS/CSS hashleri, health/version,0workspace/contexts ve Chromium/Metal ilk liman formu open/type/close/aynıcanvas geçti.
- Otomasyon Node/Chromium ayrı test aracıdır; app process/runtime gereksinimi değildir. Host'tan Go/Node kaldırılmış olduğu iddia edilmedi.

#### TEST-20.01-S3 — Negatif / sınır / arıza kontrolü
- [x] Output çakışması/symlink, yarışta çıkan arşivin ezilmemesi, eksik/symlink frontend, kirli manual/doc/RBAC girdisi kontrollü test edildi.
- İlk red: 8PASS/2FAIL; clean kapsamı ve hash/provenance yokluğu yeniden üretildi.
- Retest: 11PASS; artefaktlar ayrı.
- Kanıt: artifacts/release-audit/ra-20261111/packaging-root-retest/initial-red.log

- İlk PR-head/build SHA guard farkı korundu; root exact merge parent/full tree kanıtıyla bağladı.12Markdown input/output hash farkı exact merge kaynağından paketleyicinin link dönüşümüyle birebir yeniden üretildi. Source-input ve shipped-output hashleri birbirinin yerine yazılmadı.

- [x] Yeni external bundle hedefi mevcutsa reddedilir; bounded extraction link/special/traversal/duplicate kabul etmez. Port free/PID/birth guard ve read-only/optional-provider kapalı allowlist env kullanıldı. Global kubeconfig veya mevcut kullanıcı scope'u benimsenmedi.
- Yeni app örneğinde kubeconfig yokluğu0context/bağlantısız olarak kaldı; sahte Node/sağlıklı cluster gösterilmedi. Dolu port/expiredcredential/yetkili bağlantı kendi ayrı fazlarındadır.

#### TEST-20.01-S4 — Bulgular ve düzeltme
- Bulgu: PKG-001 P1 paket doğruluğu; eski output ezme ve seçili olmayan paket girdilerinin temiz sanılması.
- Düzeltme: scripts/build-release.mjs exclusive output/archive; runtime allowlist; shipped input clean kapsamı; dış build ve iç provenance hashleri.
- İmza/signed attestasyon üretilmedi. Hazırlanmış frontend hash kaydı source eşitliği kanıtı değildir.

#### TEST-20.01-S5 — Tekrar test ve regresyon
- [x] İlk red kontrolleri ve normal fixture yolları tekrar geçti.
- [ ] Gerçek final arşiv/binary temiz başlangıç ve idempotent manual runner doğrulaması bekliyor.
- Sonuç: fixture11PASS; gerçek kabul IN_PROGRESS.

- [ ] CI temiz Linux startup/browser kontrolü çalışmadı: Playwright apt bağımlılık kurulumunda Ubuntu/archive/security DNS hatası, APT100/install1. Sonraki clean-start ve artifact-upload adımları SKIPPED.
- Aynı işi geçene kadar yeniden başlatma, DNS/TLS bypass veya platform/kapsam azaltma yapılmadı. Yeni commit'in CI sonucu önceki koşulardan bağımsız doğrulanmalıdır.

- [x] Önceki CI DNS engeli yeni bağımsız koşuda tekrarlanmadı; source build ve Linux smoke bu exact merge kaynağında geçti. İndirilen ZIP26,217,476byte/SHA eşleşti. İlk urllib URLError ve tek verified-TLS native curl başarısı ayrı kaydedildi.
- [ ] Bu CI runner'da Go/Node kurulu olduğundan, tamamen araçsız final paket/manual-lab kabulü kapanmadı. macOS native minimal path ve paket girdileri ayrı inceleniyor.

#### TEST-20.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

- Root üç job'ın gerçek step durumları ve hata excerpt'lerini GitHub connector üzerinden okudu. Kod/test/paket derleme success ile temiz paket startup SKIP ayrı tutuldu.
- Yerel owned lab'lar düşük pilde mevcut runner guard'larıyla durduruldu. Private state/profiller korunur, 19846/19847/19848 loopback listenerları kapalı; kullanıcı DB containerları korunur. Kanıt: owned-lab-stop-checkpoint/result.json.

- Root inceleme raporu/manifest/native argv ve17checksum doğruladı. Extracted binary/private ZIP .git alanında; credential veya gerçek cluster içeriği yok. Kanıt: artifacts/release-audit/ra-20261111/ci-package-inspection-worker/REPORT.md.
- Genel job INCOMPLETE: report finalization244.683sn ile240sn faz sınırını4.683sn aştı. Native/inspection gözlemleri orijinal deadline içinde tamamlandı; bu zaman ihlali gizlenmedi ve faz tam PASS yapılmadı. Final temiz kurulum ve manuel profiller hâlâ açık.

- [x] Yeni job206.97622sn içinde finalizasyon+cleanupPASS: exact PID/birth doğrulandı, SIGTERM exit0, port19849 boş. Bundle/workspace korunur.8app-child örneğinde çocuk süreç yok; tam kernel/network audit iddiası yok.
- [x] Root16checksum, helper/launcher/manifest ve iki gerçek PNG'yi inceledi. ROOT_REVIEW.md kapsamı ve önceki report-overrun sınırını ayırır. Runtime/shipped input yolları merge537..current6db arasında yalnız yeni server test dosyası farkı taşır; veri/UI kodu değişmediği için gereksiz tekrar yok.

- Sonraki fark yalnız docs/SECURITY.md içinde statik erişim anahtarı/cookie TTL açıklamasıdır; runtime/asset/packager kodu değişmedi. Bu temel startup kanıtı doc-only gerekçeyle tekrar kullanılabilir. Yeni final arşivde güncel Markdown/hash/provenance ayrıca TEST20.13 kapsamında doğrulanmalı; eski arşiv güncel belgeyi içeriyormuş gibi sunulmaz.

- Yeni runtime providerWorker guard düzeltmesi sonrasında final paketin kimliği değişecek: eski5373657 startupPASS tarihsel kalır. Yeni derlenmiş/ambalajlı adayda gerekli temel startup kontrolü tekrar doğrulanacak; yalnız bu değişmiş runtime/paket yolu hedeflenir, eski uzun testler körlemesine tekrarlanmaz.

#### TEST-20.01-K — Faz kararı
- [x] BİTTİ / DOĞRULANDI — bu exact adayın temel standalone paket başlangıcı: gerçek native macOS harici bundle/boş app PATH ve ayrı Linux copy-out CI smoke, embedded UI, ilk liman formu ve cleanup geçti.
- Kanıt: native-package-startup-worker/REPORT.md, ROOT_REVIEW.md; ci-package-success-3bdb7c0c/REPORT.md. Önceki DNS FAIL ve archive-inspection INCOMPLETE tarihsel kalır.
- Bu karar final bütün sürüm/paket/provenance, imza, gerçek manuel profiller, migration/restart, native Safari/Retina veya manuel onay değildir. Runtime/asset/shipped input/packaging değişirse ilgili startup gate RETEST_REQUIRED olur.

### TEST-20.02 — Boş config/ilk liman gerçek bağlantısı

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Boş config/ilk liman gerçek bağlantısı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.03 — Temiz pakette iki liman gerçek kullanım

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Temiz pakette iki liman gerçek kullanım; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.04 — Eksik araç/dolu port/expired credential

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Eksik araç/dolu port/expired credential; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.05 — Restart/veri/migration/backup

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Restart/veri/migration/backup; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.06 — Başarısız update rollback

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Başarısız update rollback; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.07 — macOS native runtime

- Kategori: CAT-20.
- Amaç / kullanıcı riski: macOS native runtime; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.08 — Linux ilan edilen runtime/emülasyon ayrımı

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Linux ilan edilen runtime/emülasyon ayrımı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.09 — Docker/Helm ilan edilen destek

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Docker/Helm ilan edilen destek; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.10 — Paket test endpoint/private veri yokluğu

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Paket test endpoint/private veri yokluğu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.11 — CI token/PR secret/checkout/workflow injection

- Kategori: CAT-20.
- Amaç / kullanıcı riski: CI token/PR secret/checkout/workflow injection; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: KV-SECURITY-WORKER; root kaynak/rapor ikinci incelemesi
- Kaynak / build / paket kimliği: f1a26cbb çalışma ağacı; .github/workflows/ci.yml ve ilgili paket/test script hashleri ci-trust-review-worker/source-manifest.json içinde.
- Ortam / kullanılan kimlik ve yetki: Salt okunur yerel kaynak incelemesi ve resmi GitHub güvenlik dokümanları; admin/fork ayarları ve gerçek external PR deneyi erişilmedi.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.11-S1 — Hazırlık
- [x] Tek aktif workflow ve çağırdığı paket/test scriptleri hash/satır kimliğiyle incelendi. Yeni test/build/lab veya credential isteği başlatılmadı.
- Kanıt: artifacts/release-audit/ra-20261111/ci-trust-review-worker/source-manifest.json ve workflow-numbered.txt.

#### TEST-20.11-S2 — Normal kullanım / pozitif kontrol
- [x] Kaynakta contents:read, full SHA action pinleri ve persist-credentials:false doğrulandı; shell'e doğrudan untrusted expression yok. Yeni exact3bdb7c0c CI normal test/build/clean-Linux smoke/upload adımları başarıyla çalıştı.
- Sınır: gerçek runner token yetkilerinin tamamı veya fork/organizasyon politikası bu gözlemden çıkarılmadı.

#### TEST-20.11-S3 — Negatif / sınır / arıza kontrolü
- [ ] Gerçek kontrollü external PR/token/cache poisoning deneyi ve repository/org admin ayarları NOT RUN/BLOCKED. Secret isim/değerleri istenmedi.
- Statik incelemede pull_request_target, ayrıcalıklı workflow_run tüketicisi, doğrudan expression-to-shell veya publish/release adımı bulunmadı. Bu sınır bütün olası saldırıların yokluğu değildir.

#### TEST-20.11-S4 — Bulgular ve düzeltme
- CI-TRUST-01 informational: imzasız tested-builds artifact adı güvenilir yayıncı veya promotion kanıtı değildir. Mevcut ayrıcalıklı consumer bulunmadığı için gösterilmiş escalation yok.
- CI-TRUST-02: admin/fork/token ayarlarının ve gerçek dış PR denemesinin kanıt boşluğu. CI-TRUST-03: action/transitive/runner provenance incelemesi tamamlanmadı.
- Ürün/workflow değişikliği veya risk kabulü yok; root rapor ve kaynak sınırını doğruladı.

#### TEST-20.11-S5 — Tekrar test ve regresyon
- NOT_APPLICABLE: doğrulanmış exploit/düzeltme olmadığı için PoC red→green tekrarı yok. Dinamik/admin negatifleri ayrıca yapılmalı; statik inceleme onların PASS sonucu değildir.

#### TEST-20.11-S6 — Temizlik ve inceleme
- [x] Yeni yalnız rapor dizini üretildi; worker test/browser/build/lab/credential/Git işlemi yapmadı. Root4checksum ve ilgili workflow/script sınırlarını okudu.
- Aynı ajan sistemi ikinci incelemesidir; profesyonel bağımsız pentest veya sertifika değildir.

#### TEST-20.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- IN_PROGRESS: bounded statik trust incelemesi tamamlandı; admin/fork/token/cache dinamik kapıları ve action/transitive provenance açık. Exact kaynak CI smoke sonucu ayrı kaydedildi. İlgili workflow/runner/permissions/consumer değişince retest gerekir.

### TEST-20.12 — Action pin/cache/artifact/release yetkisi

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Action pin/cache/artifact/release yetkisi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.12-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.12-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.12-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.12-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.12-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.12-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.12-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.13 — SBOM/checksum/provenance

- Kategori: CAT-20.
- Amaç / kullanıcı riski: SBOM/checksum/provenance; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.13-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.13-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.13-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.13-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.13-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.13-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.13-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-20.14 — İmza/attestation yetenek ve doğrulama

- Kategori: CAT-20.
- Amaç / kullanıcı riski: İmza/attestation yetenek ve doğrulama; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: GitHubActions secure-use; NIST SSDF1.1 süreç çerçevesi; CAT20 exactpackage/provenance. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.14-S1 — Hazırlık
- [x] Packaging/CI worker gerçekbuild-script ve workflowları inceledi; runtime allowlist/readiness sınırları belgelendi.
- Kanıt: artifacts/release-audit/ra-20261111/packaging-worker/REPORT.md

#### TEST-20.14-S2 — Normal kullanım / pozitif kontrol
- [ ] İmza/attestation pozitif doğrulaması henüz yapılmadı.
- Önceki burada yazılan output8fixture sonucu TEST20.01 kapsamındadır; imza kabulü sayılmamıştır. Tarihsel kanıt: artifacts/release-audit/ra-20261111/packaging-worker/packaging-fixture-tests.log
- Güncel build-provenance yalnız hash/kaynak kaydıdır; signed:false.
- Sonuç: NOT_STARTED (imza), paketleme sonucu ayrı fazda.

#### TEST-20.14-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.14-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.14-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.14-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.14-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-21 — Manuel teslim/son inceleme

### TEST-21.01 — Final profil01 boş başlangıç

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Final profil01 boş başlangıç; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.02 — Final profil02 ortak küme iki liman

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Final profil02 ortak küme iki liman; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.03 — Final profil03 bağımsız kümeler

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Final profil03 bağımsız kümeler; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.04 — Final profil04 restricted

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Final profil04 restricted; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.05 — Final profil05 arıza/recovery

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Final profil05 arıza/recovery; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.06 — Final profil06 limanlar arası ağ

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Final profil06 limanlar arası ağ; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.07 — Final profil07 açık replay

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Final profil07 açık replay; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.08 — Cold/idempotent up/down-up/reset/cleanup

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Cold/idempotent up/down-up/reset/cleanup; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.09 — Rehber/doğrulanmış temiz terminal komutu

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Rehber/doğrulanmış temiz terminal komutu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.10 — Kullanıcı PASS/FAIL alanları boş ve ağır lab durumu

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Kullanıcı PASS/FAIL alanları boş ve ağır lab durumu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.10-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.10-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.10-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.10-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.10-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.10-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.10-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.11 — Roadmap/kanıt/paket ikinci incelemesi

- Kategori: CAT-21.
- Amaç / kullanıcı riski: Roadmap/kanıt/paket ikinci incelemesi; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.11-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.11-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.11-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.11-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.11-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.11-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-21.12 — V11-19 final teslim ve manuel onay

- Kategori: CAT-21.
- Amaç / kullanıcı riski: V11-19 final teslim ve manuel onay; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: CAT21 yedi manuel profil,gerçek/replay ayrımı,kullanıcı kararı ve V11-19. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P1.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması; runtime/build freeze; ağır işlerin izolasyonu.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-21.12-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.12-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.12-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-21.12-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-21.12-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-21.12-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-21.12-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.
