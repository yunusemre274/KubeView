# Gerçek paket / SBOM / provenance — 15 Kasım 2026

**TEST-20.13 için dar kabul: doğrulandı. Genel sonuç NOT_RELEASE_READY.** İmza/attestation, zafiyet taraması, gerçek Kubernetes/provider, final platformlar, performans, uzun kullanım ve manuel onay ayrı kapılardır.

Kaynak ve paketleme commit'i `4a3e3a17552e9ef35091c37070a8bc19c00f3b43`, runtime temel checkpoint'i `15770296`. Commit çalışma dalına pushlandı; uzak SHA eşleşti. `main` değişmedi. İki hedef gerçek Go1.26.11/CGO0 ile derlendi; frontend Node24.16.0/npm11.13.0/Vite6.4.5/Rollup4.62.3. Sadece sahip olunan özel kaynak kopyası ve repo dışı boş uygulama örneği kullanıldı; kubeconfig/Secret/cluster/provider yoktu.

| Hedef | Gerçek binary SHA-256 | Son tar.gz SHA-256 | Çalıştırma |
|---|---|---|---|
| darwin-arm64 | `819658d5b7044a5ad69eb534e698d3e8d7b0d588f43b4ead87c59a7e699f57af` | `8eb2d9b954b916ce043241437fbf8c3950fd198191ad00226449627b5a1b148c` | Repo dışında native Mac başlangıcı geçti. |
| linux-amd64 | `3dcbe1b1247ceed0e6960996ca68f796694026523f28d4d3cbc434f1e55ec543` | `5e4231e928b31f663d1656d21b9ed564aa62adb4318162a2ce4187c751ea3549` | Yerel dosya çapraz derlendi/byte kontrol edildi; Mac'te native çalıştırılmış sayılmadı. CI121'in ayrı Linux startup adımı başarılı. |

## Gerçekte doğrulananlar

- Gerçek npm lock SBOM toplaması, Go BuildInfo, iki binary ve iki arşiv üretimi geçti:36.571sn toplam yardımcı duvar zamanı. Bu süre CPU veya etkileşim gecikmesi ölçümü değildir. Önceden180sn frontend/240sn paketleme/4GiB owned-groupRSS/10GiB boş disk sınırı kondu; stop veya otomatik retry yok.
- Binary SBOM61 bileşen içerir:45 gerçek Go modülü, gerçek derleyicinin1stdlib kaydı, pozitif rendered JavaScript modüllerine ait15npm kimliği. Go h1 checksum ile binary SHA-256 ayrıdır. Go import kenarları uydurulmadı; assembly üyeliği açıkça etiketlidir.
- Ayrı frontend SOURCE SBOM203 paket/204dependency kaydı içerir;118'i development işaretlidir. Bu203 paketin tamamı runtime'a teslim edilmiş sayılmaz. npm producer sürümü gerçek metadata'dandır. Ham registry URL/header/token/env dökülmedi.
- Dört gerçek CDX dosyası exact pinned1.5 resmî şema ve `date-time/idn-email/iri-reference/uri` formatlarıyla offline doğrulandı. Bilinmeyen ref indirilemez. [Şema çıktısı](actual-schema-result.json) hash ve byte miktarlarını bağlar; şema geçerliliği dependency completeness veya güvenlik garantisi değildir.
- İki son arşiv SHA'sı dış build/checksum ve içerideki binary/SBOM/provenance hash'leriyle eşleşir. Her arşiv30üye içerir. Tüm üye dosyaları staging byte'larıyla;45Go kimliği gerçek BuildInfo ile;15npm kimliği rendered envanterle; deklarasyon ve tüketilen kaynak hash'leri güncel kaynakla ayrıca eşleşti. [Bağımsız root bağlama kontrolü](actual-binding-result.json).
- Vite ek manifest hariç6çıktı dosyası frozen current157 frontend'iyle byte eşittir:3JavaScript, CSS, HTML, favicon.242renderedmodül/0unresolved owner;65tüketilen first-party dosyası ayrı hash'lenmiştir. Sahne/panel kalite veya çözünürlük azaltılmadı. Bu byte eşitliği FPS, fiziksel sunum veya tüm kullanıcı işlevleri kabulü değildir.
- Gerçek Go metadata `vcs.modified=true`, ilgili paket girdileri `runtimeInputsDirty=false` bildirir. Kısmi özel checkout'taki diğer audit dosyaları Go VCS durumunu kirletebilir. Bu ayrım korunur; bütün checkout temizmiş gibi yazılmaz. Kaynak/arşiv kimliği ve tüketilen girdiler ayrıca bağlanmıştır.
- Farklı worker20 fiziksel dosyada43bounded byte/metadata kontrolü yaptı; iki binary'nin Go BuildInfo bloğunu executable çalıştırmadan bağımsız çözdü. Kaynak/PAX commit'i,27declared input,70producer input, arşiv/SBOM/provenance eşleşti. [İkinci inceleme](../sbom-actual-package-review-worker/REPORT.md); aynı ajan sistemi, profesyonel üçüncü taraf denetimi değildir.
- [CI121/run43705093663/job132784357952](https://github.com/yunusemre274/KubeView/actions/runs/43705093663) tüm frontend/Go/benchmark/paketleme/temiz Linux startup/upload adımlarında başarılıdır. [Adım makbuzu](ci121-completed-jobs.json). CI arşivi bu kontrolde indirilmedi; CI binary hash'i yerel arşivle aynıymış gibi sunulmaz.

## İlk başarısızlıklar silinmedi

1. Prepared çıktı kontrolü HTML/CSS'yi build-time hash'e bağlamıyordu. Değiştirilmiş HTML fixture'ı RED verdi. Tüm outputset/content kontrolü eklendi; [37PASS ve ilk RED](../sbom-output-binding-root/).
2. İlk gerçek Vite build komutu exit0 verdi; envanter JS hash'i son disk byte'ıyla eşleşmediği için kabul **FAIL** oldu. Vite preload düzeltmesi envanterden sonra çalışıyordu. Installed Rollup API'sindeki `generateBundle: {order:'post',handler}` sonrası gerçek late-generator regresyonu dahil38PASS; gerçek Vite tekrarında tüm hash'ler eşleşti. [İlk sonuç](frontend-result.json), [ayrı retest](frontend-retest-result.json), [Rollup hook kaynağı](https://rollupjs.org/plugin-development/#build-hooks).
3. Paket helper ilk kaynak arşivinde repo kökünde `LICENSE` olduğunu varsaydı; Git128 ile daha npm/Go başlamadan durdu. Gerçekte commit'te olmayan opsiyonel path seçimi düzeltildi; lisans uydurulmadı. [İlk hazırlık hatası](package-preparation-failure.json).
4. Şema helper ilk launcher'ı venv symlink'ini global Python'a çözdü;0test/format dependencyFAIL. Doğrudan venv yolu aynı iki scriptle15PASS verdi. Normal Python eksik-format negatif kontrolü ayrıca exit2; guard gevşetilmedi. [Şema yardımcı kanıtı](../sbom-schema-worker/REPORT.md).
5. İkinci reviewer ilk binary sentinel'ini UTF-8 metin sanmıştı; ilk helper hatası korunup veri parser'ı düzeltildi. Yeni build gerekmedi; ürün hatası sayılmadı.

## Native paket ve görsel inceleme

[Mac başlangıç sonucu](../sbom-native-startup-root/result.json)3.064sn toplam helper süresidir. Arşiv repo/.git dışında yeni0700kök içine traversal/link/üye/boyut ve hash kontrolleriyle açıldı. Uygulama boş PATH, değişmeyenHOME, açıkça olmayan kubeconfig, readonly ve providersoff ile `127.0.0.1:19849` üzerinde çalıştı. Gerçek version4a3/darwin/arm64;0connection/context/harbor; embedded HTML/JS/CSS ve normal ilk form aç/yaz/kapat;aynıCanvas;0mutation/pageerror. SIGTERMexit0, port boş, yakalanan browser kimlikleri yok.

Root iki orijinal PNG'yi açtı. İlk karede soluk başlangıç zemini, sonraki form karesinde su ve Soft UI görülür; ilk karenin fiziksel GPU sunum zamanı ölçülmedi. Ekran görüntüsü veya başlığın görünmesi bütün panel kontrollerinin≤200ms kullanılabilirliğini kanıtlamaz. Gerçek bağlantı, iki liman, bütün formlar, Safari/Retina ve fiziksel gecikme bu dar başlangıç testi değildir.

## Tekrar üretim ve kalan sınırlar

[Kod/komut sözleşmesi](../../../../docs/RELEASE_SBOM.md), [gerçek argv/bütçe](plan.json), [paket helper'ın tam kaynağı](package-once.py.txt), [native helper/argv](../sbom-native-startup-root/run.py). `--prepared` frontend derlemesini atlar ama bütün kaynak/çıktı bağını doğrular; offline npm metadata komutu yine çalışır. `--require-clean` ilgili kaynakların commitli olmasını ister. `--output-dir` yeni dizindir; tarihi kayıtlar ezilmez. İkili/arşivler özel test alanında korunur, Git'e büyük binary veya hassas veri katılmadı.

Provenance **signed:false**. Resmî şema lisansı korunur; proje kökünde bulunmayan LICENSE icat edilmez. İmza/attestation, yasal lisans değerlendirmesi, provider/OS SBOM'u, SCA, final bütün paket, tüm platformlar, uzun kararlılık, V11-16/18/19 ve kullanıcı onayı açık kalır. Başka dil/Worker/WASM gerektiren ölçülmüş runtime darboğazı bulunmadı; build-time metadata için runtime teknolojisi değiştirilmedi. Bu tur CPU/RAM/GPU/enerji iyileşmesi iddiası içermez.
