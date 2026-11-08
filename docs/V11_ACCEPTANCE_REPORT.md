# v1.1.0 kabul kaydı

8 Kasım 2026, çalışma **IN PROGRESS**. Stable release/tag henüz yok; milestone açık.
Başlangıç `2b76e215fdbe201be1611ccea4c40dcd547b2ba7`; dal `redesign/harbor-workbench`, upstream eşitti.
İlk tracked çalışma ağacı temizdi; 742 untracked girdi korunuyor, bunlar körlemesine stage edilmiyor.
Kaynak/build başlangıcı: `artifacts/v1.1.0/v11-20261108/start.json`, `baseline-frozen.json`.
Baseline `v11-start-2b76e21` ürün değişikliklerinden önce donduruldu; henüz yeni performans sonucu değildir.

## Mevcut, eklenen, bekleyen

| Alan | Başlangıç | Yeni aday | Kabul |
|---|---|---|---|
| Görsel onarım, gerçek watcher/UID/scope/Hubble/provisioning | Önceki kaynakta kanıtlı | Korunuyor | Yeni session değiştiğinden eski tüm E2E otomatik PASS sayılmaz |
| Bağlantı tanılaması ve açık yönetim izni | Kısmi/eksik | Ayrı API/keşif/yetki/metrics/Hubble kontrolleri; nonce ve scope bağlı browser izni | Unit geçti; gerçek UI bekliyor |
| Namespace metrics ve geç yanıtlar | Kaynak incelemesinde yarış riski | Abort, scope/UID epoch kontrolü, timestamp | Birim test geçti; gerçek dolu Node/Pod grafik bekliyor |
| Operation, double-submit ve belirsiz yanıt | Kısmi | Gerçek rollout/failure/terminating ve GET ile inceleme | Gerçek API/UI bekliyor |
| Kurulum | Go + ayrı frontend derlemesi | Embed edilmiş tek binary hazırlanıyor | Temiz macOS/Linux çalışma testi bekliyor |
| P2 caption | İki okunurluk borcu | Viewport sınırlama/yan yerleşim | Görsel açıp inceleme bekliyor |

19 satırlık yürütme defteri: `artifacts/v1.1.0/v11-20261108/qa/acceptance-ledger.json`.
Her satırın bütün alt şartları ayrıca değerlendirilir; tek alt test bütün satırı PASS yapmaz.

## Test yürütme disiplini

Root Git/index ve küme sahipliği yöneticisidir. Backend ve frontend iki test worker'ıdır; QA ağır test lease almadan çalışmaz.
Performans bütün test/build/encoding işlerinden izole edilir. Bataryada devam etme tercihi korunur; güç koşulları ölçüm manifestinde tutulur.
Yeni gerçek testler yalnız `kv-repair-*` owned profilleri, sabit kube-system UID ve label+namespace UID kontrolü ile çalışır.
Kullanıcının global kubeconfig'i değiştirilmez; private dosyalar `.git/` içindedir, kanıtlara credential girmez.

Safe-gap: `fleet.reconcile/canLaunch`, HEADWAY, merge gate ve LAUNCH_SWEEP gövde açıklığıyla koşullu admission sağlar; keyfi 30 saniye sleep bulunmadı. Aynı güvenliği sağlayan yeni rota kanıtlanmadığı için mevcut davranış korunuyor.

## Başarısız/engelli deneyler

- İlk PDB unit assertion, güvenli hata sınıflandırmasındaki `PodDisruptionBudget` yazımını yakaladı; static sınıflandırma düzeltildi, ilk FAIL ve hedefli tekrar korunuyor.
- Lab restore guard ilk denemesinde config Node `Name` alanının kısa (`m02`) olduğu varsayımı hatalıydı. Shell fail-fast olmadığı için sahip olunan restore başladı. Gerçek üç container'ın sabit ID ve minikube label'ları bağımsız doğrulandı; başka kümeye dokunulmadı. Sonraki orchestration checked subprocess kullanır.

Sonuçlar tamamlandıkça bu belgeye kaynak/build/komut, PASS/FAIL/SKIP/BLOCKED ve kanıt eklenir. Bu dosyanın oluşturulması kabul kapılarını kapatmaz.

## 8 Kasım — gerçek UI kapısında bulunan başlangıç hatası

İlk normal production UI A→B→A testi240s ve ardından readonly testi başarısız oldu; boş React görünümü PASS sayılmadı. Headed Chromium kısa probu da aynı `observeNamespace → resetManagement().then` TypeError'ını gösterdi; headless altyapısına atfedilmedi. Kaynak/build bütünlüğü korundu, ilk kanıtlar `qa/runs/2026-11-08T19-26-12-081Z-chromium-0ea3c244` ve `qa/startup-2026-11-08T19-33-54-667Z.json` altında. Düzeltme ve yeni kabul koşusu bekleniyor. Önceki 39 server/141 frontend unit sonucu bu kapıyı geçmiş sayılmaz.

Dağıtım kilometre taşı `7eaddde75067c28237488d0b4107e4b86573219f` pushlandı; [taslak PR #1](https://github.com/yunusemre274/KubeView/pull/1) milestone #1'e bağlı. Üretim kaynak sürümü1.1.0'a hazırlandı, stable tag/release yok. macOS temiz dizin ve LinuxAMD64 emülasyon gerçek TLS/API smoke ayrı JSON kaydında; Node/Go/Vite çalıştırmadan binary HTML/API sunuyor. Docker image linuxarm64 nonroot10001/readOnlyRootFS ile startup+auth+emptyconfig smoke geçti. Helm render/lint geçti; in-cluster Helm runtime testi yapılmış sayılmaz.

Başlangıç düzeltmesi: configured=false/revoke dönüşü async Promise oldu; namespace followup, yapılandırma yokken stream/metrics başlatmıyor. İki yeni ilk-mount/demo regresyonuyla143/143 frontend unit geçti; `frontend/startup-regression-*` kanıtı. Düzeltilmiş production bundle gerçek UI smoke ve iki-cluster yeniden testi henüz bekliyor.
