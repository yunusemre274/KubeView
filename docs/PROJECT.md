# KubeView / Tersane ürün sözleşmesi

KubeView, Kubernetes kümesini tam ekran etkileşimli 3D bir tersane olarak sunar. Ana deneyim dünyanın kendisidir; kalıcı dashboard, sidebar, üst uygulama barı, KPI kartları veya açık alt tablo bulunmaz.

Kullanıcı merkezden iş yükü yönetimine, gemiden gerçek Node’a, palet/container kutusundan Pod ve içeriğine geçer. Tablolar, grafikler, YAML, log ve formlar ilgili nesnenin geçici penceresinde yer alır. Pencereyi kapatmak aynı kamera ve seçim bağlamıyla dünyaya döndürür. Nesne bulucu aynı kaynak ve eylem modeline klavye/ekran okuyucu erişimi sağlar.

Gerçek Kubernetes state’i, geçici görsel state’ten ayrıdır. UID, raw namespace/name, context generation, snapshot/relist/delete uzlaştırması ve server RBAC korunur. API kabulü ile gözlenen controller sonucu ayrıdır. Rastgele metrik, sessiz mock log veya boş kümede otomatik örnek Node yoktur. Demo yalnız açık seçimle ve belirgin etiketle çalışır.

Yerel/test mutation denemeleri yalnız görevin sahip olduğu ve kube-system UID, profil, namespace UID/label ile doğrulanan kümelerde yapılır. İlk geliştirme `kubeview-test / kubeview-qa`; güncel v1.1 kabulü ayrı `kv-repair-1101` ve `kv-repair-v11-b` ile `kv-repair-v11-*` namespace'lerini kullandı. Kullanıcının üretim/default context'i otomatik seçilmez. Node hedefleme scheduler’ı atlamaz; namespace veya workload replica sayısı yeni Node sayısı olarak yorumlanmaz. Helm yaşam döngüsü, VM sağlama ve trafik telemetrisi ayrı entegrasyonlardır.

Görsel hedef: referanslardaki bağlı kara ve paralel beton iskeleler, su havuzları, okunur gemi silueti, portal vinç mekaniği, hangar ritmi ve ölçülü gün ışığı. Marka/filigran kopyalanmaz. Performans hedefleri ölçülmüş başarı yerine raporlanan koşullara göre değerlendirilir.

2026-10-24 kararı önceki dashboard yerleşim talimatlarını geçersiz kılar. Tarihsel belgelerdeki “bütün fazlar tamamlandı” iddiaları güncel özellik kanıtı değildir.

## 9 Kasım2026 — v1.1.0 yerel operatör adayı

Başlangıç0.4.0'dan, kaynakları kendi güvenilir kubeconfig'iyle bağlayan ve frontend'i gömülü tekGoikilisi olarak sunan1.1.0adayı hazırlandı. İlk mod saltokunur; serverwriteizni ve context/namespace'e bağlı açık browser yönetim niyeti ayrıdır. Genel multitenantSaaS veya bütün Kubernetes özellikleri vaat edilmez. Yerel minikube worker ve Hubble1.20.2 ölçülmüşflow dar opsiyonel sağlayıcılardır; CNI/collector kullanıcının kümesine otomatik kurulmaz.

[Kabul raporu](V11_ACCEPTANCE_REPORT.md)19satır16PASS/3BLOCKED ve test türlerini ayırır. Runtime32a0468; normalUI/gerçekAPI/platform/20dakika kanıtları mevcut. AçıklanamayanCPU farkı ile fizikselUIlatency hedefi açıkken stabletag/release/milestone kapanışı yapılmaz. [Ürün yolculuğu ve kurulum](../README.md).
