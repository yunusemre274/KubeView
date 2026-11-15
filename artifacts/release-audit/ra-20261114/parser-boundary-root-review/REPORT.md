# TEST-12.03 — YAML ve generic JSON altkanıtlarının kök incelemesi

14 Kasım 2026. Bu kayıt **IN_PROGRESS**; bütün parser fazının kapanışı değildir. Ürün/runtime değişmedi.

| Altkapsam | Sonuç | Kanıt |
|---|---|---|
| Workspace JSON/import | Önceki TEST13.01 dar kabulü; yeniden çalıştırılmadı | [Kapanış](../../ra-20261112/workspace-import-parser-closure-root/REPORT.md) |
| Aktif YAML formu | İlk 1+10 PASS; kaynak bakımı ve somut cyclic-alias sorusu sonrası 1+11 PASS, 0 skip, 0,171317 sn | [Frontend](../yaml-parser-guards-worker/REPORT.md) |
| Generic resource JSON | İlk fixture timeout-query FAIL; düzeltilmiş exact-query kontrolü 1+12 PASS, 0 skip, 6,565316 sn | [Backend](../resource-parser-guards-worker/REPORT.md) |

Ana müdür iki test dosyasını ve gerçek ResourceForms parseYAML/validate/dryRun ile server decode/resources POST yollarını okudu; ham sonuçları, manifestleri, güncel kaynak hashlerini ve yakalanan süreç temizliğini kontrol etti. Worker yazarlarından ayrı incelemedir; aynı ajan sistemi profesyonel üçüncü taraf pentest değildir.

Frontend mevcut hook dispatcher ile gerçek component'i esbuild eder; browser/focus/ağ E2E değildir. Malformed, duplicate, multi-document, array/scalar kök ve alias amplification yerel hatayla engellenir. Döngüsel alias ayrıştırılır; dry-run sırasında JSON serileştirme hatası gerçek component catch yoluyla gösterilir. Fake API fonksiyonuna giriş vardır fakat teslim edilmiş JSON sayısı sıfırdır; gerçek network capture diye sunulmaz. Submit disabled gözlendi, direct submit callback çağrılmadı. Benign alias/unknown map/own __proto__ bu yolda korunur; global prototype kirlenmedi. Diğer merge yerleri TEST12.04 kapsamında açıktır.

Son testte yanlış annotation başlığı unknown field olarak düzeltildi ve kullanılmayan fixture blokları kaldırıldı. İlk kaynak/sonuçlar korunur. Kabul edilen 128 derinlik/240 KiB ek alan, ürün limiti veya upstream şema onayı değildir. Ek cyclic fixture tek küçük graph'tır; sonsuz nesne genişlemesi oluşturulmadı.

Backend typed SSAR fixture'ı fake, dynamic client-go ise gerçek HTTP ile owned minimal echo API'ye gider. İki pozitif doğru qa namespace, dryRun=All, fieldValidation=Strict, timeout=3s ve validated işlem yanıtını doğrular. On negatif 400/415/422 döner ve her birinde upstream create delta sıfırdır. 9007199254740993 tamsayısı ve 1.25 kesri korunur. Unknown envelope alanı ignore edilir; unknown resource alanı strict isteğe taşınır. Echo API gerçek Kubernetes şema/admission doğrulaması değildir.

Unstructured metadata tekrarında son object kullanılır; workspace struct-map tekrarlarının merge davranışıyla aynı genel politikaya indirgenemez. İlk backend fixture explicit client-go timeout query'sini hesaba katmadı. İlk FAIL korunur; retest exact üç query parametresini doğrular. Beklenti her query'yi kabul edecek şekilde gevşetilmedi; ürün fix'i iddia edilmez.

Açık kalan somut kapsam: explicit frontend byte/depth bütçesi, büyük paste sırasında gerçek browser tepki/heap sınırı, editör dışındaki YAML/kubeconfig parserları ve gerçek upstream şema/admission. Bu sonlu gruplarda exploit yeniden üretilmedi; ölçülmeyen büyük girdiler için güvenlik veya performans garantisi verilmez. Root kayıt helper'ındaki ilk SyntaxError test çalıştırılmadan oldu; test/ürün sonucu değildir ve hiçbir önceki kanıt ezilmedi.

Genel karar **NOT_RELEASE_READY**. Bu test/belge değişikliği uzun benchmark veya eski fuzz koşusunu otomatik tekrar gerektirmez.
