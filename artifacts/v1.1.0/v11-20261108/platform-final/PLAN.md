# Final Linux platform helper — hazırlanmış, çalıştırılmadı

`linux-install.mjs` yalnız root’un final lease ve tam kimlik değerleriyle çalışır. Bu hazırlıkta test, build, Docker veya cluster çağrısı yapılmadı. Eski `../linux-install-smoke.json`, `721d95d-candidate` sonucudur; final binary kabulü değildir.

Root final build/proof tamamlandıktan sonra gereken process ortamı:

- `KUBEVIEW_PLATFORM_FINAL_LEASE=v11-20261108-platform-final`
- `KUBEVIEW_PLATFORM_EXPECT_COMMIT`: tam40haneli temiz final commit.
- `KUBEVIEW_PLATFORM_EXPECT_BINARY_SHA256`: `dist/kubeview_1.1.0_linux-amd64/kubeview` için tamSHA256.
- `KUBEVIEW_PLATFORM_SOURCE_PROOF`: final artifact JSON yolu; `commit` ve `frontendProvenance.files/sourceSHA256` içermeli.
- `KUBEVIEW_PLATFORM_EXPECT_SOURCE_PROOF_SHA256`: proof dosyasının tamSHA256’sı.

Komut, repo kökünde: `node artifacts/v1.1.0/v11-20261108/platform-final/linux-install.mjs`.

Helper kaynak/proof/dist kimliklerini, gerçek A UID’sini, exact control-plane DockerID’sini ve private Linux cfgserver IP/8443 ile Docker network üyeliğini doğrular. CA doğrulaması korunur; keyfi ek kimlik dosyası/exec plugin veya TLS bypass kabul edilmez. Benzersiz private binary/config/token kopyaları600/700izinle tutulur; public artifact token/config içeriği veya production log içermez.

Tek `owner=v11-20261108` + run etiketi taşıyan container, `alpine:3.21 --platform linux/amd64`, readonly rootfs, `/tmp` cwd, üç readonly binary/identity mount ve yalnız127.0.0.1:18511 publish ile çalışır. Go/Node/Vite veya source-tree mount yoktur. Kontroller: gerçek `--version`, embeddedHTML+JS/CSS exacthash/MIME, missingauth401, authenticatedcontext/readonlyconnection, gerçek3NodeUID ve kube-systemUID. Sonunda aynı DockerID+owner/run etiketi tekrar doğrulanır; stop/rm ve boşport kontrolü yapılır. Kullanıcı Redis/Postgres veya başka container’a işlem yoktur.

Sonuç platformu **macOS ARM64 üzerinde Linux AMD64 emülasyonu** olarak kaydedilir; native Intel, Linux browser veya performance kanıtı değildir. İş için190s, yalnız owned cleanup/son doğrulama için toplam240s’e kadar ayrılmış süre vardır. Zaman aşımında yaratılmış olabilecek container, yalnız aynı benzersiz run etiketi ve exactID ile bulunup temizlenir. Helm lint/template ve tar/checksum doğrulaması root’un ayrı CLI helper’ında kalır; cluster apply yoktur.
