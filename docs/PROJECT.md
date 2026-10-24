# KubeView / Tersane ürün sözleşmesi

KubeView, Kubernetes kümesini tam ekran etkileşimli 3D bir tersane olarak sunar. Ana deneyim dünyanın kendisidir; kalıcı dashboard, sidebar, üst uygulama barı, KPI kartları veya açık alt tablo bulunmaz.

Kullanıcı merkezden iş yükü yönetimine, gemiden gerçek Node’a, palet/container kutusundan Pod ve içeriğine geçer. Tablolar, grafikler, YAML, log ve formlar ilgili nesnenin geçici penceresinde yer alır. Pencereyi kapatmak aynı kamera ve seçim bağlamıyla dünyaya döndürür. Nesne bulucu aynı kaynak ve eylem modeline klavye/ekran okuyucu erişimi sağlar.

Gerçek Kubernetes state’i, geçici görsel state’ten ayrıdır. UID, raw namespace/name, context generation, snapshot/relist/delete uzlaştırması ve server RBAC korunur. API kabulü ile gözlenen controller sonucu ayrıdır. Rastgele metrik, sessiz mock log veya boş kümede otomatik örnek Node yoktur. Demo yalnız açık seçimle ve belirgin etiketle çalışır.

Yerel/test denemeleri yalnız `kubeview-test / kubeview-qa` içindir. Node hedefleme scheduler’ı atlamaz; namespace veya workload replica sayısı yeni Node sayısı olarak yorumlanmaz. Helm yaşam döngüsü, VM sağlama ve trafik telemetrisi ayrı entegrasyonlardır.

Görsel hedef: referanslardaki bağlı kara ve paralel beton iskeleler, su havuzları, okunur gemi silueti, portal vinç mekaniği, hangar ritmi ve ölçülü gün ışığı. Marka/filigran kopyalanmaz. Performans hedefleri ölçülmüş başarı yerine raporlanan koşullara göre değerlendirilir.

2026-10-24 kararı önceki dashboard yerleşim talimatlarını geçersiz kılar. Tarihsel belgelerdeki “bütün fazlar tamamlandı” iddiaları güncel özellik kanıtı değildir.
