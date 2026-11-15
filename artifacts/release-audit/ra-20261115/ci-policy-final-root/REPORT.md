# CI güvenlik guard'ının entegrasyonu — 15 Kasım 2026

**Yerel regresyon kontrolü geçti; TEST20.11 ve TEST20.12 IN_PROGRESS kalır.** Ürün runtime, Kubernetes, sahne, paneller ve bağımlılık sürümleri değiştirilmedi. `.github/workflows/ci.yml` içindeki mevcut paket test komutuna yeni `scripts/release-ci-policy.test.mjs` eklendi. İzinler, event'ler, dört action pin'i, runner, cache, build ve upload sırası korunur.

## Önceki kaynak ve kanıt

[Worker incelemesi](../../ra-20261114/ci-workflow-security-worker/REPORT.md) exact action SHA/sürüm/runtime/lisans, kaynak trust haritası, değişmeyen eski kaynakların tekrar kullanımı ve gerçek CI116 metadata'sını ayırır. İlk 14 PASS çıktısı Node spec reporter biçimindeydi; wrapper TAP beklediği için kendi FAIL kaydını üretti. Ham çıktı değiştirilmeden offline sayım doğrulandı; test tekrar edilmedi. Bu araç hatası ürün veya GitHub güvenlik başarısızlığı değildir.

[İlk entegrasyon](../../ra-20261114/ci-policy-integration-root/result.json) 11 paket testi + 2 policy ana testi + 13 mutant alt testiyle 26 PASS verdi. Aynı ajan sistemindeki ayrı [inceleme](../../ra-20261114/ci-policy-integration-review-worker/REPORT.md) bunu doğruladı. Eski 26 PASS yeni assertion kapsamına taşınmaz.

## Somut guard eksikliği ve düzeltmesi

Root, `include-hidden-files === true` / `overwrite === true` kontrolünün quoted string `'true'` girdilerini yakalamadığını buldu. Yeni 14. mutant iki bayrağa bu girdiyi verirken [EXPECTED_RED](../../ra-20261114/ci-policy-string-input-root/red-result.json) üretti. Yalnız bu leaf başarısızdır; parent'a yansıyan hata ikinci bağımsız kusur değildir. İlk kaynak ve raw TAP korunur.

Shared `disabled` kontrolü artık yalnız tanımsız, boolean false veya açık false/False/FALSE stringlerini kabul eder; bilinmeyen girdi ve expression reddedilir. Mevcut workflow'da bu flag'ler zaten yoktur. Bu, aktif iş akışında gösterilmiş credential sızıntısı/escalation değil, yeni policy regresyon guard'ındaki eksikliktir. Cache-dependency-path etiketi de cache payload yolu yerine doğru `cache-key-input` olarak adlandırıldı.

## Son doğrulama

```sh
node --test --test-reporter=tap --test-concurrency=1 scripts/build-release.test.mjs scripts/release-ci-policy.test.mjs
```

Son kaynakta **27 PASS, 0 FAIL, 0 SKIP**: 11 değişmeyen paket testi, 2 policy ana testi ve 14 negatif alt test. Süre0,187701 sn; gerçek uygulama CPU veya kullanıcı gecikmesi değildir. On beş bounded fixture, her biri≤64 KiB; tek child≤15sn. Yeni bağımlılık veya gerçek build/cluster/browser/fork işlemi yok. [Preflight](preflight.json), [raw TAP](tests.tap), [result](result.json), exact test/workflow snapshot'ları ve [son ikinci inceleme](../ci-policy-final-review-worker/REPORT.md) ayrıdır. Dört kaynak hash'i değişmedi; guard'ın CI'den kaldırılması da negatif fixture ile yakalanır.

İki quoted flag tek mutantta verilmiştir; ayrı flag branch kapsamı, bütün truthy yazımları veya vendor boolean API'siyle tam uyumluluk iddia edilmez. Invocation kontrolü sentaktiktir; PR hem workflow hem guard kodunu değiştirebilir. Guard erken npm adımlarından sonra çalışır ve GitHub server permission/secret sınırlarının yerine geçmez. Tam action bundle/transitive SCA, actual fork/admin/token/cache negatifleri ve signing/promotion kapıları açıktır.

Bu yerel sonuç yeni commit'in remote CI sonucu değildir; push sonrası exact SHA/run/job durumu ayrıca doğrulanmalıdır. İlk başarısızlıklar silinmedi. Genel karar **NOT_RELEASE_READY**; `main`, stable tag/release ve milestone değiştirilmedi.
