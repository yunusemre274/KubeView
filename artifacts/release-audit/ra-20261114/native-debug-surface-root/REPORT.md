# TEST-12.10 — native release test/debug yüzeyi

14 Kasım 2026. **Dar kapsamda VERIFIED_DONE**; genel güvenlik veya release kabulü değildir. Ürün kodu değiştirilmedi. Native build71b40983/binary24ef0ce3… mevcut57ad606e ürün kaynaklarıyla aynıdır; dört surface dosyasının current/preflight/buildcommit hashleri reviewer tarafından ayrıca eşleştirildi.

| Koşu | Sonuç | Açıklama |
|---|---|---|
| [İlk](result.json) | FAIL,19 HTTP denemesi,2,506021 sn | Absent POST için yanlış404 beklentisi; gerçek frontend methodguard405. İlk kaynak/çıktı korunur; ikinci mode çalışmadı. |
| [Düzeltilmiş](../native-debug-surface-retest-root/result.json) | PASS,42 HTTP denemesi,5,512804 sn | Default ve fixture-env modunda normal sağlık/version/workspace ve route kontrolleri. GET404/POST405 exact guard; başka her4xx kabulü yok. |
| [Gerçek ADDR anahtarı](../native-debug-surface-addr-retest-root/result.json) | PASS,21 HTTP denemesi,2,687978 sn | Önceki helperdaki kullanılmayan PORT yerine actual KUBEVIEW_BENCH_ADDR; yalnız bu ek mode, default yeniden çalıştırılmadı. |

Normal kontroller: healthOK, exact version/build, gerçek embedded index, boşworkspace ve contexts. Sekiz debug/benchmark benzeri GET yolu her mode'da normal index ile byte/hash eşit SPA fallback döndürdü; HTTP200 tek başına endpoint varlığı sayılmadı. Dört POST405; disabled replay/status ve unknown API GET404, absent replay/scenario POST405. Actual test-env FIXTURE/ADDR/STATIC/RESULT_DIR/BOOTSTRAP/LOG_GATED verilse de test fixture sonucu yazılmadı ve kubeconfig oluşmadı. Final iki probe'da owned app PID'nin bütün TCP LISTEN adresleri yalnız127.0.0.1:19849; başka uygulamaların portlarına istek veya signal gönderilmedi.

Kaynak: main özel ServeMux kullanır; pprof/expvar production import/registration bulunmadı. __benchmark handlerları Go *_test.go içindedir. Explicit --replay-profile M|L ayrı, belgeli read-only production TEST/REPLAY özelliğidir; bu testte açılmadı. Production JS optional benchmark/DevTools hookları backend HTTP endpoint değildir; kaldırılmış gibi gösterilmez.

Her attempt planı ençok50 istek/10istek-sn/2MiB yanıt/45sn work+60sn phase/1GiB appRSS/disk10GiB. İlk+düzeltilmiş+ADDR toplam82 deneme, üç ayrı gerekçeli kayıt; başarılı probe toplam63 istektir,82 bağımsız test fazı değildir. Kaynak pacing ve socket/subprocess timeout'ları bounded guard sağlar; hard OS realtime watchdog veya bağımsız rate time-series ölçümü yoktur. Bilinmeyen/üçüncü taraf URL, kullanıcı credential'ı, gerçek Kubernetes mutasyonu veya otomatik provisioning/exec/delete taraması yapılmadı.

App SIGTERM exit0, retained PID/birth+command kimliği yok ve19849 LISTEN kapalı; private state/bundle korunur. Direct child örneklemesi kısa ömürlü/reparented süreçler, UDP/unix socket veya tüm host portlarını kapsamaz. CPU/RAM/GPU/enerji iyileşmesi ölçülmedi. [İkinci inceleme](../native-debug-surface-review-worker/REPORT.md) aynı ajan sistemi içindedir; profesyonel üçüncü taraf pentest değildir.

Tekrar komutları repo kökünden ilgili dizinin `python3 .../run.py` çağrısıdır; one-shot helper mevcut result/private kökü ezmeyi reddeder. Yeni tekrar yeni run-ID/output/private kök gerektirir. Paket özel içerik/Secret taraması TEST20.10; enabled replay authorization, tüm platformlar, provider güvenliği ve final release kapıları ayrıca açıktır.

`main` koşullu merge isteği ayrıca incelendi: origin/main bed7ad9b…, current57ad606e için0geride/133ileride ve CI116 success. Bu Git birleştirilebilirliği test edilmemiş sağlayıcı/TLS/render/uzun kararlılık kapılarını kapatmaz. Kullanıcının “yapıyı bozmayacaksa, engelse girişme” koşulu nedeniyle main/remote main değiştirilmedi; mevcut geliştirme dalı pushları sürer. Stable tag/release/milestone işlemi yapılmadı. Genel **NOT_RELEASE_READY**.
