# KubeView — yayın öncesi canlı test ve kabul kaydı

- Son güncelleme: 2026-11-11T15:20:07.480399+03:00 — Europe/Istanbul (UTC+03:00).
- Aktif kaynak: `4ec526b7ce1bc39c21b603864c9096f72eb39184`, origin eşit/CI43013585717 SUCCESS; App source-panel guardı ve labelclamp çalışma farkı candidate04 içinde hashli. Packaging/CI/explicitmanualCLI değişikliği ayrıca sürüyor. Kullanıcı untracked dosyaları korunur.
- Build/paket: candidate04 binary08bd0cee5a5d…/indexfdf10156… (`candidate04-binary.json`); finaltemizarşiv değil. Başlangıç36d5b8f kaynak/binaryarşivi korunur; hiçbir eski dist çıktısı ezilmedi.
- Ortam: Apple M5/32GiB, macOS27.0.1, AC güç (başlangıç35% şarj), yerel Chromium/erişilebilir Playwright WebKit; native Safari/Retina ayrı. Linux/Docker/Helm kapsamı ilan edildiği biçimde ayrıca test edilecek.
- Dağıtım modeli: local-first tek yerel operatör; loopback varsayılan, uzak erişimde açık token/TLS/tünel sınırı. İnternete açık çok kullanıcılı SaaS kapsamı yok. Hubble/minikube opsiyonel fakat sunulan yollar zorunlu test kapsamındadır.
- Toplam test fazı: **199**. NOT_STARTED:166; IN_PROGRESS:17; FAILED:0; BLOCKED:0; RETEST_REQUIRED:1; VERIFIED_DONE:15; NOT_APPLICABLE:0.
- Kullanıcı kararı bekleyenler: stable yayın/merge/milestone için manuel onay; V11-16 fiziksel ekran kabulünün yerine proxy kabulü istenirse ayrıca açık karar gerekir. Henüz karar değiştirilmedi.
- Güvenlik bulguları: SEC-001 HIGH ve SEC-002 MEDIUM düzeltme+dar retest geçti; final paket/gerçek yetki incelemesi açık.42Go advisory patch sonrası main source0finding; hepsi istismar sayılmadı. İncelenmemiş kategori vardır; güvenlik garantisi değildir.
- Eski kapılar: V11-16 BLOCKED (fiziksel sunum kanıtı yok); V11-18 BLOCKED (CPU karşılaştırması/final matris eksik); V11-19 BLOCKED (önkoşullar+manuel kabul). FullTLS/cold bootstrap ve kesilmiş uzun koşu yeniden doğrulanacak; eski PASS yeni kaynağa taşınmadı.
- Son tamamlanan faz: TEST03.10gerçek50A→B→A/299kapalırequest; TEST03.05gerçekreaderizolasyonu; TEST08.01gerçekIPv4/IPv6/LANguard. Sıradaki: normalA2down→ayrıHubblecoldstate; yeniözelCLIactualsağlayıcı ve sonpaketkapıları.
- Süreç/lab: owned02app19842 ve04app19844/A2çalışıyor; tarayıcıkoşularıbitti. Workerlar: özelminikubeSDK/gRPCvendoradayı; explicitminikubeCLIrunner. Hubblecoldstate doctorhazır, clusterhenüzyok. İlgisizloncaDocker süreçlerine dokunulmaz.
- Devam: bu dosyanın durum/dependency satırını ve `artifacts/release-audit/ra-20261111/` kayıtlarını okuyun; otomatik bütün lab'ı yeniden başlatmayın.
- **Genel karar: NOT_RELEASE_READY**.

## Merkezi kaynak ve güvenlik bütçesi

Ana müdür roadmap/Git/index/allowlist sahibidir. Başlangıç iki test worker; her biri tek sonlu iş. Normal testte root+2 worker, worker içi test paralelliği1–2. Ölçüm/60dk koşusunda diğer ağır işler durur. Aktif saldırı hedefi yalnız owned uygulama loopback portları19840–19849 ve owned private lab kapsamıdır; üçüncü taraf/üretim hedefleri yok. Canary yalnız loopback. İlk aktif HTTP yük tavanı10 istek/sn, eşzamanlılık4,60sn; fuzz ilk tur10sn/1worker; body negatiflerinde en fazla8MiB ve en fazla10 istek. Bu değerler ilgili faz başlamadan gerekçeli daraltılabilir/genişletilebilir. Global stop: owned test uygulaması RSS>2GiB, toplam owned browser RSS>6GiB, boş disk<10GiB veya thermal/power kesintisi; cluster bootstrap ayrı doctor bütçesi olmadan başlamaz. Ağır uzun koşu düşük pille başlamaz. Hiçbir sahip olunmayan süreç kapatılmaz.

A/B önemli aileler: en az5 geçerli eşleşmiş AB/BA tekrar;30sn warm+60sn steady. M≥55draw/s p95≤20ms p99≤33.3ms; L≥30 p95≤40 p99≤50ms (önce60 ise30'a indirme yok). Görüntü/DPR/kalite/kapsam/güncellik eşit. Normal callback→store≤100ms/burst≤250ms; view proxy≤250/500ms; toplam CPU tüm ilgili süreçlerde. Pratik regresyon eşiği başlangıç planında medyan +5% ve dağılım/belirsizlikle birlikte değerlendirilecek; bu eşik eski açıklanmamış farkı otomatik aklamaz.60dk koşusu kesintisiz;20dk ara kontrol,50panel/log,3reconnect. Her testin kendi güvenlik sınırı ayrıca aşağıya yazılır.

## Kategori özeti

| Kategori | Faz | Durum | Geçerli kanıt |
|---|---:|---|---|
| CAT-01 — Mimari, tehdit modeli ve saldırı yüzeyi | 6 | NOT_STARTED:5, IN_PROGRESS:1 | Henüz yok |
| CAT-02 — İki liman ve temel UX | 5 | NOT_STARTED:3, IN_PROGRESS:1, VERIFIED_DONE:1 | Henüz yok |
| CAT-03 — Workspace ve izolasyon | 11 | NOT_STARTED:5, IN_PROGRESS:1, VERIFIED_DONE:5 | Henüz yok |
| CAT-04 — Gerçek Kubernetes işlemleri | 18 | NOT_STARTED:16, IN_PROGRESS:2 | Henüz yok |
| CAT-05 — Log/metrics/Secret | 10 | NOT_STARTED:10 | Henüz yok |
| CAT-06 — Hubble/TLS/provisioning | 14 | NOT_STARTED:13, IN_PROGRESS:1 | Henüz yok |
| CAT-07 — Statik analiz/bağımlılık/sır | 10 | NOT_STARTED:5, IN_PROGRESS:1, VERIFIED_DONE:4 | Henüz yok |
| CAT-08 — Portlar/erişim/TLS | 6 | NOT_STARTED:5, VERIFIED_DONE:1 | Henüz yok |
| CAT-09 — Session/CSRF/WebSocket | 10 | NOT_STARTED:5, IN_PROGRESS:4, VERIFIED_DONE:1 | Henüz yok |
| CAT-10 — API nesne/işlem yetkilendirmesi | 9 | NOT_STARTED:8, RETEST_REQUIRED:1 | Henüz yok |
| CAT-11 — XSS ve önizleme | 7 | NOT_STARTED:4, IN_PROGRESS:3 | Henüz yok |
| CAT-12 — Import/dosya/host komutları | 10 | NOT_STARTED:10 | Henüz yok |
| CAT-13 — Fuzz/race/eşzamanlılık | 10 | NOT_STARTED:6, IN_PROGRESS:1, VERIFIED_DONE:3 | Henüz yok |
| CAT-14 — Kontrollü pentest zincirleri | 5 | NOT_STARTED:5 | Henüz yok |
| CAT-15 — Yük ve tükenme | 9 | NOT_STARTED:9 | Henüz yok |
| CAT-16 — A/B benchmark | 13 | NOT_STARTED:13 | Henüz yok |
| CAT-17 — Kaynak optimizasyonu | 6 | NOT_STARTED:6 | Henüz yok |
| CAT-18 — Uzun kararlılık ve kurtarma | 5 | NOT_STARTED:5 | Henüz yok |
| CAT-19 — Gecikme/erişilebilirlik/tarayıcı | 9 | NOT_STARTED:8, IN_PROGRESS:1 | Henüz yok |
| CAT-20 — Paket/güncelleme/CI | 14 | NOT_STARTED:13, IN_PROGRESS:1 | Henüz yok |
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
- Sorumlu: KV-SECURITY-WORKER
- Kaynak / build / paket kimliği: 36d5b8f; runtime değişikliği henüz yok
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:20:48.364084+03:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-01.01-S1 — Hazırlık
- [x] Sahip olunan repo/fixture sınırı ve kaynak kimliği doğrulandı.
- Yapılan: worker görevi, dosya sahipliği, tarama/test bütçesi ve kaynak SHA kaydedildi.
- Kullanılan komut / çalışma dizini: git rev-parse HEAD; /Users/yunusemre/Desktop/KubeView.
- Beklenen: yalnız bu repo ve sentetik test hedefleri.
- Gözlenen: izlenen runtime temiz,36d5b8f; dış üretim hedefi yok.
- Kanıt: artifacts/release-audit/ra-20261111/start.json; worker raporu devam ediyor.
- Sonuç: hazırlık tamam; pozitif/negatif sonuç henüz yok.

#### TEST-01.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-01.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-01.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-01.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-01.02 — Auth/session/write-grant/RBAC veri akışı

- Kategori: CAT-01.
- Amaç / kullanıcı riski: Auth/session/write-grant/RBAC veri akışı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-01.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-01.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-01.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-01.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-01.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-04.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-04.05 — CPU/RAM request/limit edit

- Kategori: CAT-04.
- Amaç / kullanıcı riski: CPU/RAM request/limit edit; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-04.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-04.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-04.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-04.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-04.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-05.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.08 — Bilinmeyen label/annotation edit korunumu

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Bilinmeyen label/annotation edit korunumu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-05.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-05.09 — Maskeli Secret gerçek veri olarak yazılmıyor

- Kategori: CAT-05.
- Amaç / kullanıcı riski: Maskeli Secret gerçek veri olarak yazılmıyor; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-05.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-05.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-05.09-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-05.09-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-05.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Kaynak / build / paket kimliği: 4ec526b7+hashli App/label düzeltmesi; patched Hubble378850e0a4d1… özel aday
- Ortam / kullanılan kimlik ve yetki: Yeni private release-audit-hubble-20261111-cold01 state planlandı; henüz cluster yaratılmadı.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.01-S1 — Hazırlık
- [x] Doctor: Docker29.5.3/8GiBVM, minikube1.38.1, Helm4.2.3, customHubble1.20.2patched CLI/requiredflags doğrulandı.
- Yapılan: eski normalA CNI değiştirilmeyecek; gerçek50cycle bitince ownnormalA2 down, fresh telemetryA2 tek başına.
- Kanıt: artifacts/release-audit/ra-20261111/hubble-cold01-doctor.json
- Bütçe:2×2048MiB/2CPU node, toplamcoldbootstrap15dk; disk10GiBstop; providerTLS kapatılmayacak.
- Sonuç: hazırlık PASS; coldstart henüz çalışmadı.

#### TEST-06.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.02 — Relay Ready ve gerçek mTLS

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Relay Ready ve gerçek mTLS; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-06.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.03 — Aynı Node farklı Pod gerçek iletişim

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Aynı Node farklı Pod gerçek iletişim; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-06.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.04 — Cross-Node farklı Pod gerçek iletişim

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Cross-Node farklı Pod gerçek iletişim; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-06.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.05 — İki proje/namespace ölçülmüş trafik

- Kategori: CAT-06.
- Amaç / kullanıcı riski: İki proje/namespace ölçülmüş trafik; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-06.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.06 — Start/increase/stop ve pencerenin boşalması

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Start/increase/stop ve pencerenin boşalması; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-06.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-06.12-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.12-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.12-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.12-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.12-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.12-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.12-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-06.13 — Minikube idempotency/profile lock

- Kategori: CAT-06.
- Amaç / kullanıcı riski: Minikube idempotency/profile lock; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-06.13-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.13-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.13-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-06.13-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-06.13-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-06.13-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-06.13-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Durum: IN_PROGRESS
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

#### TEST-07.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.05-S4 — Bulgular ve düzeltme
- Bulgu: externalscanner semboleşleşmesi actualkomutexploitkanıtı değildir.
- Hubble1.20.4 adayı17→3kaldığıiçin temizdiye kabul edilmedi.
- Aynıtag customHubbleGo1.27.4/net0.62/cel0.30 tekderlemede0finding;RootSHA doğruladı,CLIhelpuyumuPASS;gerçekmTLS/provideraçık.
- Minikube1.39resmibinary97→39matchedadvisory;ilkRoot325catalogsayımı yanlıştı, geçmişJSONkorundu,doğrufindingjoinworkerda.
- Riskkabulü/kapama: verilmedi; containerveexternalfeasibility incelemesi sürüyor.

#### TEST-07.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-07.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-07.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-07.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-07.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

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
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T13:42:17.092651+03:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
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
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.01-S3 — Negatif / sınır / arıza kontrolü
- [x] Kısa expiry, yeni session deadline ve reset iptali sınandı.
- Yapılan:25ms sentetik expiry; reset eski ctxi iptal eder, yeni ctx özgün deadlinea bağlı.
- Beklenen: yeni/eskiscope lifetime uzamamalı.
- Gözlenen: context deadline ve iptal assertionları PASS.
- Kanıt: artifacts/release-audit/ra-20261111/session-scope-retest.log
- Sonuç: dar regresyon geçti; bütün session/replay/browser kapıları henüz kapanmadı.

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

#### TEST-09.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-09.02 — Backend read-only doğrudan endpoint

- Kategori: CAT-09.
- Amaç / kullanıcı riski: Backend read-only doğrudan endpoint; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-09.02-S1 — Hazırlık
- [x] Listener/cluster açmadan in-process ServeMux ve sentetik net.Pipe canary hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/source-identity.json
- Sonuç: yalnız owned/sentetik fixture.

#### TEST-09.02-S2 — Normal kullanım / pozitif kontrol
- [x] Dar sentetik normal+negatif kontroller yürütüldü.
- Gözlenen: Forward create server/browser read-only403; gerçek API smoke genel create readonly403. Bütün mutasyon aileleri henüz ayrı doğrulanmadı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md ve preview-final-tests.log
- Sonuç: unit alt kapsam PASS, geniş faz açık.

#### TEST-09.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Eksik gerçek/browser/final paket koşulları raporda açık tutulur; SKIP/PASS karışmaz.
- Gözlenen: ilkCONNECT405varsayım testiFAIL, standard authority404red ile düzeltildi; runtime bypass değildi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-inprocess-regressions-initial.log ve preview-final-tests.log

#### TEST-09.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.05-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.05-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-09.07-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.07-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-09.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-09.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-09.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-09.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-10.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-10.08-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-10.08-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-10.08-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-10.08-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-11.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-11.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-11.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-11.02 — Metin/markdown/HTML ve link şemaları

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Metin/markdown/HTML ve link şemaları; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.02-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.02-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.02-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.02-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-11.02-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-11.02-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-11.02-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-11.03 — ANSI/control/clipboard sınırları

- Kategori: CAT-11.
- Amaç / kullanıcı riski: ANSI/control/clipboard sınırları; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.03-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-11.03-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-11.03-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-11.03-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-11.04 — Aşırı uzun içerik ve render maliyeti

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Aşırı uzun içerik ve render maliyeti; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.04-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.04-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.04-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-11.04-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-11.04-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-11.04-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-11.04-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-11.05 — CSP/frame-ancestors/MIME/nosniff

- Kategori: CAT-11.
- Amaç / kullanıcı riski: CSP/frame-ancestors/MIME/nosniff; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER + ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7 backend runtime aynı; yeni release_origin_preview_test.go sentetik test farkı
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.05-S1 — Hazırlık
- [x] Listener/cluster açmadan in-process ServeMux ve sentetik net.Pipe canary hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/source-identity.json
- Sonuç: yalnız owned/sentetik fixture.

#### TEST-11.05-S2 — Normal kullanım / pozitif kontrol
- [x] Dar sentetik normal+negatif kontroller yürütüldü.
- Gözlenen: Aktif static frontend frame-ancestors/nosniff ve preview CSP/no-referrer/no-store header assertionları geçti; gerçek malicious browser flow ayrı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md ve preview-final-tests.log
- Sonuç: unit alt kapsam PASS, geniş faz açık.

#### TEST-11.05-S3 — Negatif / sınır / arıza kontrolü
- [ ] Eksik gerçek/browser/final paket koşulları raporda açık tutulur; SKIP/PASS karışmaz.
- Gözlenen: ilkCONNECT405varsayım testiFAIL, standard authority404red ile düzeltildi; runtime bypass değildi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-inprocess-regressions-initial.log ve preview-final-tests.log

#### TEST-11.05-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-11.05-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-11.05-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-11.05-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-11.06 — Workload preview HTML/JS yönetim origin izolasyonu

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Workload preview HTML/JS yönetim origin izolasyonu; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER + ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7 backend runtime aynı; yeni release_origin_preview_test.go sentetik test farkı
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.06-S1 — Hazırlık
- [x] Listener/cluster açmadan in-process ServeMux ve sentetik net.Pipe canary hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/source-identity.json
- Sonuç: yalnız owned/sentetik fixture.

#### TEST-11.06-S2 — Normal kullanım / pozitif kontrol
- [x] Dar sentetik normal+negatif kontroller yürütüldü.
- Gözlenen: Opaque CSP header override unit geçti; gerçek browser storage/opener/JS ve yönetimAPI izolasyonu henüz doğrulanmadı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md ve preview-final-tests.log
- Sonuç: unit alt kapsam PASS, geniş faz açık.

#### TEST-11.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Eksik gerçek/browser/final paket koşulları raporda açık tutulur; SKIP/PASS karışmaz.
- Gözlenen: ilkCONNECT405varsayım testiFAIL, standard authority404red ile düzeltildi; runtime bypass değildi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-inprocess-regressions-initial.log ve preview-final-tests.log

#### TEST-11.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-11.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-11.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-11.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

### TEST-11.07 — Preview upstream cookie/header/token temizliği

- Kategori: CAT-11.
- Amaç / kullanıcı riski: Preview upstream cookie/header/token temizliği; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
- İlgili gereksinim / güvenlik standardı kontrolü: ASVS5.0.0 V1.2.2/V3.4.3/V3.4.4/V3.4.5/V3.4.6/V3.5.4; CAT11. Sürüm/kimlik kanıtı docs/RELEASE_THREAT_MODEL.md; fazın uygulanabilirliği sonuçla ayrı değerlendirilir.
- Öncelik: P0.
- Önkoşullar ve bağımlılıklar: TEST-01.01; owned allowlist ve ortam doğrulaması.
- Sorumlu: RELEASE SECURITY WORKER + ANA MÜDÜR
- Kaynak / build / paket kimliği: 4ec526b7 backend runtime aynı; yeni release_origin_preview_test.go sentetik test farkı
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-11.07-S1 — Hazırlık
- [x] Listener/cluster açmadan in-process ServeMux ve sentetik net.Pipe canary hazırlandı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/source-identity.json
- Sonuç: yalnız owned/sentetik fixture.

#### TEST-11.07-S2 — Normal kullanım / pozitif kontrol
- [x] Dar sentetik normal+negatif kontroller yürütüldü.
- Gözlenen: Sentetik net.Pipe reverseproxy credential/header/cookie temizliği geçti; gerçek workload/browser forward kabulü ayrı.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/REPORT.md ve preview-final-tests.log
- Sonuç: unit alt kapsam PASS, geniş faz açık.

#### TEST-11.07-S3 — Negatif / sınır / arıza kontrolü
- [ ] Eksik gerçek/browser/final paket koşulları raporda açık tutulur; SKIP/PASS karışmaz.
- Gözlenen: ilkCONNECT405varsayım testiFAIL, standard authority404red ile düzeltildi; runtime bypass değildi.
- Kanıt: artifacts/release-audit/ra-20261111/origin-preview-worker/preview-inprocess-regressions-initial.log ve preview-final-tests.log

#### TEST-11.07-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-11.07-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-11.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-11.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-12 — Import/dosya/host komutları

### TEST-12.01 — Kubeconfig exec plugin trust sınırı

- Kategori: CAT-12.
- Amaç / kullanıcı riski: Kubeconfig exec plugin trust sınırı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-12.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-12.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-12.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-12.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.03-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.03-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.03-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-12.08-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.08-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-12.08-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

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
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: KV-DEPENDENCY-WORKER; root ekparserkapsamı
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: 2026-11-11T14:05:10.000694+03:00
- Bitiş zamanı: —
- Durum: IN_PROGRESS
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-13.01-S1 — Hazırlık
- [x] MevcutFuzzWorkspaceDocument aynıGo1.26.11kaynakta;GOMAXPROCS2,parallel1,fuzztime10s.
- Gözlenen:3kaynakseed+65mevcutcache;max2MiB.
- Kanıt: fuzz-mutation-worker/fuzz-corpus-manifest.json
- Sonuç: bounded başlangıç.

#### TEST-13.01-S2 — Normal kullanım / pozitif kontrol
- [x] Validate-accepted→Export invariants111850yürütmedePASS.
- Gözlenen:50yeniinteresting,115cache+3seed,hata/failurecorpus0.
- Kanıt: fuzz-mutation-worker/REPORT.md.
- Sonuç: acceptedexportinvariantsfuzz; tüm invalidimport/parserreddi değildir.

#### TEST-13.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-13.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-13.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-13.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-13.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-16.06-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.06-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.06-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-16.06-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-16.06-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-16.06-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-16.06-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-17.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

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
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

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
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-18.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

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
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

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
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
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

#### TEST-19.07-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-19.07-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-19.09-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.09-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.09-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-19.09-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

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

#### TEST-19.09-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.


## CAT-20 — Paket/güncelleme/CI

### TEST-20.01 — Repo/Go/Node/Vite olmadan temiz arşiv açılışı

- Kategori: CAT-20.
- Amaç / kullanıcı riski: Repo/Go/Node/Vite olmadan temiz arşiv açılışı; yanlış işlem/veri sızıntısı/kayıp veya yanıltıcı kabulü önlemek.
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

#### TEST-20.01-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.01-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.01-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.01-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.01-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.01-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.01-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- Sorumlu: ANA MÜDÜR (worker ataması başlamadan kaydedilecek).
- Kaynak / build / paket kimliği: başlangıç `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`; fazda gerçekten kullanılan kimlik henüz yok.
- Ortam / kullanılan kimlik ve yetki: henüz atanmadı; üretim/kullanıcı credential'ı test hedefi değildir.
- Başlangıç zamanı: —
- Bitiş zamanı: —
- Durum: NOT_STARTED
- Kabul ölçütü: bu senaryonun pozitif ve negatif kontrolleri, doğru final veri/kaynak/cleanup ve izlenebilir kanıtla doğrulanmalı; ilgili CAT sözleşmesi korunmalı.

#### TEST-20.11-S1 — Hazırlık
- [ ] Sahip olunan ortam ve fixture hazırlandı.
- Yapılan: henüz çalışılmadı.
- Kullanılan komut / çalışma dizini: —
- Beklenen: güvenli hedef/kimlik/sürüm/bütçe doğrulaması.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.11-S2 — Normal kullanım / pozitif kontrol
- [ ] Yetkili normal davranış doğrulandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: ilan edilen yetkili kullanıcı yolu çalışır.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.11-S3 — Negatif / sınır / arıza kontrolü
- [ ] Riskli veya hatalı durum kontrollü sınandı.
- Yapılan: henüz çalışılmadı.
- Beklenen: kontrollü red/izolasyon/sınırlı kaynak ve doğru hata.
- Gözlenen: —
- Kanıt: —
- Sonuç: NOT_STARTED

#### TEST-20.11-S4 — Bulgular ve düzeltme
- Bulgu kimliği: henüz değerlendirilmedi.
- Önem derecesi ve gerekçesi: —
- Kök neden: —
- Değiştirilen dosya / fonksiyon: —
- Düzeltme commit'i veya çalışma farkı: —
- Kapsam notu: bulgu yok kararı henüz verilmedi.

#### TEST-20.11-S5 — Tekrar test ve regresyon
- [ ] İlk sorunu üreten test yeniden çalıştırıldı.
- [ ] İlgili normal kullanım hâlâ çalışıyor.
- [ ] Komşu davranışlar gerektiği ölçüde sınandı.
- Sonuç ve kanıt: NOT_STARTED; bulgu oluşmazsa ilk-PoC retest gerekçeli NOT_APPLICABLE olabilir.

#### TEST-20.11-S6 — Temizlik ve inceleme
- [ ] Test kaynakları doğru biçimde temizlendi veya manuel teslim için korundu.
- [ ] Sonuçlar kaynak/build kimliğiyle eşleştirildi.
- [ ] Gereken bağımsız ikinci inceleme tamamlandı.
- İnceleyen: henüz atanmadı; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.
- Kalan sınırlar: henüz test edilmedi.

#### TEST-20.11-K — Faz kararı
- [ ] BİTTİ / DOĞRULANDI
- Karar gerekçesi: NOT_STARTED; hiçbir alt adım geçilmiş sayılmadı.
- Yeniden çalıştırılmasını gerektirecek değişiklikler: ilgili runtime/dependency/paketleme veya güven sınırı değişikliği.

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
- [x] Yeni explicit --output-dir ve çakışma koruma testleri8/8stub-executor PASS.
- Sınır: gerçekbuild/paket/SBOM/signature/provenance hâlâbekliyor; unit sonucu finalpaketkanıtı değildir.
- Kanıt: packaging-worker/test.log

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
