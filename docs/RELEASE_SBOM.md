# Paket envanteri ve SBOM

15 Kasım 2026 çalışması `TEST-20.13` kapsamındadır. Fixture kontrolleri gerçek paket ve bağımlılık taramasının yerine geçmez. Güncel kabul durumu [canlı test kaydındadır](../ROADMAP_FOR_TESTS.md).

`npm run build`, normal Vite çıktısına `package-inventory.json` ekler. Bu derleme zamanı dosyası JavaScript'e kod eklemez. Rollup'ın çıktıda pozitif uzunlukla tuttuğu modüllerin paket sahipliğini, tüketilen birinci taraf kaynakları, yapılandırmayı, public dosyalarını ve manifestin kendisi dışındaki çıktı kümesini/hash'lerini kaydeder. Bu, fonksiyon erişilebilirliği veya bütün CSS/font/asset paketlerinin lisans envanteri iddiası değildir. JavaScript dışındaki dosyaların byte kimlikleri ayrıca bağlanır.

```sh
cd frontend
npm ci
npm run build
cd ..
node scripts/build-release.mjs --prepared --require-clean --output-dir=/mutlak/yol/yeni-aday darwin-arm64 linux-amd64
```

`--prepared`, bağımlılık kurulumunu ve frontend derlemesini atlar; mevcut çıktının kaynak/config/public/output hash'leriyle eşleşmesini zorunlu tutar. Eski, değiştirilmiş veya profiling çıktısı reddedilir. `--require-clean`, paketlenen kaynakların Git'e kaydedilmiş olmasını ister. `--output-dir` yeni bir dizin olmalıdır; önceki kanıt veya arşivler ezilmez. Hedefler çapraz derleme seçimidir; diğer platformlarda çalıştırma kanıtı değildir. Derleme Node/npm/Go ister; çıkarılan uygulama bunları gerektirmez.

Her hedef klasöründe iki ayrı CycloneDX 1.5 dosyası vardır:

- `sbom.binary.cdx.json`: gerçek ikilinin Go BuildInfo modülleri, derleyici/standart kütüphane sürümü ve pozitif rendered JavaScript modüllerinin npm paketleri. Go `h1` modül checksum'ı ikili SHA-256'sı olarak sunulmaz. Go bağımlılık kenarları import grafiği yerine kök montaj üyeliğidir. Yerel/sürümsüz Go replacement sessizce yayınlanmış paket gibi gösterilmez.
- `sbom.frontend-source.cdx.json`: npm lock kaynak grafiği; geliştirme/derleme girdilerini de içerir. Buradaki her paket tarayıcıya teslim edilmiş sayılmaz. `npm sbom` offline, scriptsiz ve boş kullanıcı/global npm config'iyle çalışır; ham registry URL'leri veya kullanıcı ortamı yayımlanmaz.

`build-provenance.json` ikili, iki SBOM, frontend manifesti ve çıktı hash'lerini bağlar. Dış `build.json` ve `SHA256SUMS` son arşivi bağlar. `signed:false` açıkça korunur: checksum ve kaynak kimliği yayıncı imzası, attestation veya zararsızlık garantisi değildir. Kaynak commit'i yanında ilgili çalışma farkı ve gerçek Go VCS durumu ayrı raporlanır.

Paketleme içindeki sınırlı semantik kontroller tam resmî JSON Schema doğrulaması değildir. QA için resmî 1.5 şemaları ve lisansı [testdata/sbom-schema](../testdata/sbom-schema/SOURCES.json) altında exact Git blob kimlikleriyle sabitlenmiştir. QA yardımcısı tüm referansları yerelden çözer, bilinmeyen URI'den şema indirmez. Gerekli format sağlayıcıları eksikse sessizce geçmek yerine hata verir. Uygulama runtime'ına bağımlılık eklenmez.

```sh
python3 -m venv .git/release-audit/sbom-schema-qa-venv
.git/release-audit/sbom-schema-qa-venv/bin/python -m pip install 'jsonschema[format]==4.26.0'
.git/release-audit/sbom-schema-qa-venv/bin/python -m unittest scripts/test_validate_release_sbom.py
.git/release-audit/sbom-schema-qa-venv/bin/python scripts/validate-release-sbom.py /mutlak/yol/yeni-aday/kubeview_1.1.0_darwin-arm64/sbom.binary.cdx.json /mutlak/yol/yeni-aday/kubeview_1.1.0_darwin-arm64/sbom.frontend-source.cdx.json
```

QA venv yolu olduğu gibi kullanılmalıdır: interpreter symlink'ini global Python'a çözmek venv bağımlılıklarını kaybettirir. Son komut yalnız schema/format doğrulamasıdır; ikili/arşiv hash eşitliği ve bağımlılık kapsamı ayrıca kontrol edilir. İmza, OS/provider imajları, zafiyet erişilebilirliği ve final paket kabulü ayrı kapılardır.
