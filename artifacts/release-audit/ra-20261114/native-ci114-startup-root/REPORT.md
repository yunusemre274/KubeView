# TEST-20.01 — CI114 native standalone başlangıç retesti

14 Kasım2026, Europe/Istanbul. Bu kayıt **temel bağımsız paket başlangıcının** doğrulamasıdır; genel yayın kabulü değildir. Ürünruntime15770296, denetimHEAD6ffd1b22. CI114 buildmerge71b4098314c71d7c9473d88356edf7200fe62f1f ile PRhead362e91c3f0117aee8f518c20674832da159c0061 tam Git ağacı26f2bd210eb17229ccd46543517c77fbd07721d8 bakımından eşittir. Paketin bütün22 shippedinput kaynağı ve118 trackedruntime dosyası güncel çalışma içeriğiyle ayrıca ikinci incelemede karşılaştırılmıştır. Sonraki test/belge commit'i eski binary'nin buildkimliği olarak yazılmaz.

| Kimlik | Değer |
|---|---|
| CI | [run43311457621 / CI114](https://github.com/yunusemre274/KubeView/actions/runs/43311457621) |
| ZIP SHA256 |15b43aef1c8038cf33cdd0fe8b0581fead498b550b1bf468488b34fda818cb4d |
| darwin-arm64 tar SHA256 |a0f7f82dd16da860a3fe448a5ade848e350bea5ed8cba4ff7af35921ca784774 |
| native binary SHA256 |24ef0ce34d3381644fc14dc16a768bbeb7b8c580d19813ff580780e536378e68 |

İlk ZIP aktarımı doğrulanmışTLS ile20sn sonunda kısmi kaldı; tek sınırlı Range devamı tamamladı. PythonCA hatası ve ilk timeout [tarihsel inceleme dizininde](../../ra-20261112/ci114-package-inspection-root/) korunur; insecureTLS/sertifika bypass yapılmadı. ZIP ve28member native tar checksum/path/type/mode/duplicate/link ve256MiB genişleme sınırından geçti. Link/special/traversal kabul edilmez, extractall kullanılmaz.

## Normal kullanıcı akışı

Tam bundle, repo/.git dışında yeni0700 hedefe açıldı. Uygulama PATH'i boş ve sahip olunan tools dizini, HOME özgün değerdir. Explicit olmayan kubeconfig yolu ve yeni app-data; loopback127.0.0.1:19849, read-only, opsiyonel providerlar kapalı. Uygulama kurulu Go/Node/Vite'ı bulabilecek bir PATH almadan çalıştı. Host'tan bu araçların fiziksel olarak kaldırıldığı iddia edilmez. Harici Node ve Playwright tarayıcısı yalnız otomasyon aracıdır.

MacM5/macOS27.0.1'de headedChromium156.0.8078.4, gerçek ANGLEMetal AppleM5,1440×900 CSS/DPR1. healthOK, versiondarwin/arm64/build71b…, workspace0harbor/0connection/context0, nonexistentkubeconfig yok kaldı. EmbeddedHTML/JS/Three/CSS hashleri result.json'dadır. Varsayılan tam ekran deniz ve boş bağlantı rehberi açıldı; sahteNode veya dashboard yok. Normal İlk limanını bağla düğmesi, Liman adı yazma ve pencereyi kapatma aynı Canvas nesnesiyle geçti. Mutasyon isteği0, dışistek0, pageerror0.

İlk koşu3,156548sn içinde tamamlandı; bu toplam yardımcı süresidir, startup/CPU/p95 kullanıcıgecikmesi sonucu değildir. [01](01-empty-onboarding.png) ve [02](02-first-harbor-form.png) PNG'leri root tarafından gerçekten açılıp incelendi. Formun alt eylemleri başlangıçtaki iç viewport dışındaydı; bunu varsayımla ürün kusuru saymak yerine aşağıdaki hedefli normalwheel kontrolü yapıldı.

## İlk follow-up başarısızlığı ve retest

[İlk follow-up](../native-ci114-form-scroll-root/result.json) toplamFAIL: test Canvas'ın ilk layout'u gelmeden browser varsayılan300×150 ölçüsünü karşılaştırma başlangıcı olarak almıştı. Sonra doğru1440×900 ölçüsünü değişiklik saydı. Preview/save görünürlük ve save-disabled assertionları bu hatadan önce geçti fakat tüm koşu PASS değildir. Orijinal helper, stdout, JSON ve ikiPNG korunur. Ürün kaynağı değiştirilmedi.

[Yeni retest](../native-ci114-form-scroll-retest-root/result.json) ilk normal1440×900 yerleşimini bekler, ardından aynı node ve ölçüleri dondurur. Gerçek mouse.wheel(0,900), preview/save viewport, context yokken save-disabled, bodyScroll0, aynı1440×900 Canvas ve kapanışta aynı DOM node kontrolü PASS. Süre2,974692sn; ikinci kör tekrar değildir, önceki ekran incelemesinin somut kaydırma sorusunu yanıtlar. [03-form-actions-scrolled.png](../native-ci114-form-scroll-retest-root/03-form-actions-scrolled.png) root ve reviewer tarafından açıldı: preview/Vazgeç/disabledsave görünür; opakSoftUI ve sabitdenizalanı korunur.

Her native koşu kendi fresh external01/02/03 kökünü ve appstate'ini korur. AppSIGTERM exit0/portLISTENyok; gözlenen appchild örnekleri boş, yakalanan8tarayıcıPID/doğum/komut kimliği artık mevcut değil. Kimliği değişen veya kullanıcıya ait sürece signal gönderilmez. Bu örnekleme bütün çok kısa ömürlü süreçlerin eksiksiz kernel envanteri değildir.

## Kapsam ve tekrar

Çalıştırılan komutlar proje kökünden `python3 artifacts/release-audit/ra-20261114/native-ci114-startup-root/run.py` ve hedefli `python3 artifacts/release-audit/ra-20261114/native-ci114-form-scroll-retest-root/run.py`. Yardımcılar one-shot'tır: mevcut result/externalhedefi ezmeyi reddeder. Yeni tekrar için ayrı run-ID/kanıt dizini ve yeni externalkök hazırlanmalı; eski sonuçlar silinmez. Bağlantı kurma ve kaynakoluşturma bu boşconfig testinde denenmedi.

CI114'ün ayrı nativeLinux copy-out clean-start ve productionbrowser smoke adımı success; CI runner'da Go/Node kurulu olduğu için bu Mac'in boşappPATH kontrolüyle aynı koşul değildir. [ci-status.json](ci-status.json) exactjob/step özetlerini saklar. CI115/HEAD6ffd1b22 de success; bu CI'nin yeni arşivi indirilip test edilmiş sayılmaz.

İkinciinceleme: [worker raporu](../native-ci114-package-review-worker/REPORT.md) ve result.json. Aynı ajan sistemi içinde ayrı incelemedir, bağımsız profesyonel üçüncütarafpentest değildir. İmza/attestation veya SBOM kabulü, gerçek Kubernetes/manuel01–07, migration/restart/rollback, nativeSafari/Retina, fiziksel ekran sunumu, CPU/RAM/GPU iyileşmesi ve60dkkoşusu bu kararla kapanmaz. Native arşivde28member içindeSBOMyok; ayrırelease/SBOM teslimi TEST20.13'te açık. Genel **NOT_RELEASE_READY**.
