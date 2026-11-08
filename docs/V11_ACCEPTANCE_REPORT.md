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
