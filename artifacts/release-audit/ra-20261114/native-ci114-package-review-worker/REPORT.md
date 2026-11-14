# CI114 native paket — ikinci kaynak/kanıt incelemesi

14 Kasım2026. Bu inceleme aynı ajan sistemi içindeki ayrı worker incelemesidir; bağımsız profesyonel üçüncü taraf pentest değildir. Yeni uygulama, tarayıcı, build veya küme testi çalıştırılmadı. Ana müdürün ROADMAP/Git/product dosyalarına yazılmadı.

**Karar: dar TEST-20.01 aday standalone başlangıç retestinin kapanışını destekler; genel yayın kabulü değildir.** Linux copy-out CI sonucu root tarafından ayrı bağlanmalıdır. Bu rapor o job'ın çalışmasını bağımsız yeniden gözlemlemiş sayılmaz.

## Kaynak ve paket bağı

- Güncel incelenenHEAD `6ffd1b22a164c6be83ca2783f4daf7e8346aa0d3`; binary build kimliği `71b4098314c71d7c9473d88356edf7200fe62f1f` olarak kalır.
- PRhead `362e91c3f0117aee8f518c20674832da159c0061` ile buildmerge'in tam Git tree'si `26f2bd210eb17229ccd46543517c77fbd07721d8` birebir eşit. HEAD sonrası farklar test/docs/kanıt;118tracked runtime frontend/Go/packager kaynağı currentworktree ile birebir karşılaştırıldı. Binary yeniHEAD ile derlenmiş gibi sunulmaz.
- ZIP `15b43aef1c8038cf33cdd0fe8b0581fead498b550b1bf468488b34fda818cb4d`;22build-input hash'i currentworktree ile eşit. İki içtar'ın28'er member'ı bounded okundu: path/traversal/link/special/duplicate/SUID reddi,256MiB expanded sınırı. Native tüm memberhash'leri root `all-members.json` ile eşit.
- Native tar `a0f7f82dd16da860a3fe448a5ade848e350bea5ed8cba4ff7af35921ca784774`, binary `24ef0ce34d3381644fc14dc16a768bbeb7b8c580d19813ff580780e536378e68`. Linux tar `dfba4276de9a8bb0fed755cc09f0302b6efcdcb7e84e0bf1dbcb88cadc28061b`.
- İç/dışprovenance kaynak/22input/6frontendasset girdileri ve gerçekbinaryhash eşit. Native HTTP HTML/JS/CSS kanıtı bu assethash'lerine eşit. Bu hash/provenance imza, attestation, reproducible-build veya zararsızlık garantisi değildir.

## Gözlenen yürütme kanıtı

`../native-ci114-startup-root/result.json` PASS3.156548sn: repo dışında yeni0700bundle, explicit nonexistentkubeconfig, freshdata, emptyappPATH, HOMEkorunmuş, readonly/providersoff. Health/version/emptyworkspace/0context;headedChromium156/ANGLEMetalM5 ile ilkform open/type/close ve aynıCanvas. Mutasyon/pageerror/haricirequest kaydı0. Beşappchildren örneği boş; captured8browser PID/birth+command kimliği temizliksonrası yok. AppSIGTERMexit0 ve19849LISTENyok.

`../native-ci114-form-scroll-root/browser-result.json` ilkFAILkorunmalı: assertion ilkCanvasbbox'ını R3F/ResizeObserver yerleşimi tamamlanmadan300×150 aldı; sonra1440×900 gördü. Kanıt mevcut normal yerleşimle uyumlu; bu kendi başına panel açılınca ürünresize bug'ı kanıtı değildir.

`../native-ci114-form-scroll-retest-root/` aynıcandidate için PASS2.974692sn. Script initialCanvas1440×900 olana kadar sınırlıexpect.poll bekler; sonraki eşitbbox assertion korunur. Normalpointerwheel preview/save'i viewport'a taşır; contextyokkenSave disabled, bodyScrollY0, aynıCanvasnode ve formclose korunur.0mutasyon/0pageerror;5emptychildsnapshot/8capturedbrowseridentity cleanup; appSIGTERMexit0/portboş. **Reviewer03-form-actions-scrolled.png'yi gerçekten açtı:** preview, Vazgeç ve disabledsave okunur/erişilir; panelopağı/sabitbaşlık/tamdenizCanvas korunur. Tekfoto hareket veya p95kullanılabilirlik kanıtı değildir.

## Sınırlar ve kapanış önerisi

- Uygulama PATH'inde Go/Node/Vite yok;host'tan fiziksel kaldırılmadılar. Otomasyonun absoluteNode/Playwright'ı app runtime bağımlılığı değildir. Processsnapshot'ları ve test akışı absolute-path fallback'in bütün olası davranışlarda hiç kullanılamayacağını kanıtlamaz; minimal bu boşbaşlangıç yolu kanıtlıdır.
- Temizlik sampledidentity kapsamındadır; örnekler arasında doğupbiten süreçler/globalkernel audit'i veya tümömrün kaynakstabilitesi değildir. Helper başlangıçta port/PIDbirthguard ve sonlandırırken retained process/identity guard kullanır; başka kullanıcı process'ini kapatma kanıtı yok.
- Gerçek ilkKubernetesbağlantı/create, doluport/credentialexpiry, providerbootstrap, migration/down-up, iki gerçekliman, yediprofil, nativeSafari/Retina, p95latency/fizikselpresentation, CPU/GPU ve60dksoak bu testte ölçülmedi. İlgili fazlar açık kalmalı.
- Tar28member içindeSBOMyok; ayrıreleaseSBOM/provenance teslimi kontrol edilmeden finalpaket/supplychain kapısı kapanmamalı. Yokluk yeni bir güvenlikexploit bulgusu değildir.
- ÖncekiDNSFAIL, archiveinspectionINCOMPLETE ve ilkformscrollFAIL tarihsel kalır. TEST20.01'in güncelstatus RETEST_REQUIRED iken eskiKcheckbox'ının[x] olması okuyucuyu yanıltabilir; root yeni tarihli karar ve exactkanıt bağlantısı eklemeli, eski sonucu tarihsel diye açık ayırmalı.
- Kaynak/asset/runtime/paketgirdileri değişirse ilgili standalonegate yeniden RETEST_REQUIRED. Yalnız test/docs/kanıtdeğişikliği ürünbitlerini değiştirir gibi yorumlanmamalı.

Makine-okunur karşılaştırma ve bütün exactidentities: [result.json](result.json). Özet: darbaşlangıç ve normalformscroll kanıtı yeterli; bütünürün, bütünplatform veya yayına hazır iddiası desteklenmiyor.
