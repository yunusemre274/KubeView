# Prepared output integrity — 15 Kasım 2026

SBOM-REVIEW-001, P1 paket bütünlüğü sözleşmesi boşluğu: yeni envanter JS/public dosyalarını bağlıyor, HTML/CSS gibi kalan çıktılarda sonradan yapılan değişikliği build-time değerle karşılaştırmıyordu. Önce çalışan fixture, değiştirilmiş HTML için Missing expected exception ile RED verdi (1 FAIL). Bu saldırı/gerçek kullanıcı compromise kanıtı değildir.

`collectPackageInventory` tüm Rollup chunk/asset ve public çıktı setini birleştirir; ayrılmış manifest adı ve public/output çakışması reddedilir. `validateFrontendInventory` self-manifest hariç tam küme/hash eşitliği ister. HTML/CSS/injectedJS/unexpected.txt negatiflerinin her biri embed/Go/tar öncesi reddedilir. CI artık yeni SBOM testlerini de çağırır.

Son komut: `node --test --test-reporter=tap --test-concurrency=1 scripts/build-release.test.mjs scripts/release-ci-policy.test.mjs scripts/release-sbom.test.mjs`. **37 PASS / 0 FAIL / 0 SKIP**,0.399323s test-runner duvar zamanı; uygulama CPU veya performans sonucu değildir. Source before/after aynı; ilk RED/source ve GREEN/raw ayrı korunur. İkinci worker fix kaynaklarını ve raw sonuçları read-only inceledi.

Gerçek Vite lifecycle/npm/Go/schema/extract/native/JS-byte eşitliği henüz çalıştırılmadı. TEST20.13 açık. Değişen UI/çözünürlük/işlev yok iddiası gerçek byte kontrolüyle ayrıca doğrulanacak.
