# METAPHOR.md — Kubernetes & Tersane Kavram-Nesne Eşleştirme Rehberi

Bu belge, Kubernetes bileşenlerinin Tersane 3D simülasyonundaki tam görsel ve davranışsal karşılıklarını tanımlayan **tek resmi referans tablosudur**.

---

## ⚓ Temel ve Genişletilmiş Kavram Tablosu

| Kubernetes Kavramı | Tersanedeki Karşılığı | 3D Sahne Temsili & Görsel Davranış | Faz |
|---|---|---|---|
| **Cluster (Küme)** | **Tersane Havzası / Liman Bütünü** | Tüm deniz, rıhtım, liman binaları ve gemileri içeren alan | Faz 3 |
| **Worker Node** | **Kargo Gemisi (Filo Üyesi)** | Rıhtıma yanaşan, konteynır (Pod) taşıyan ve vinçle yüklenen yük gemisi | Faz 3 |
| **Control Plane (Master Node)** | **Yönetim Binası & Kontrol Kulesi** | Kırmızı çatılı, kuleli ve dönebilen radar sistemi olan ana kontrol binası | Faz 9 |
| **Pod / Container** | **Kargo Konteynırı (Palet)** | Gemi güvertesinde veya karada üst üste dizili renkli çelik konteynır kutusu | Faz 3 |
| **Service (ClusterIP / NodePort)** | **Liman Danışma & Ağ Yönlendirme Binası** | Kube-proxy sinyal fenerli ağ binası ve yönlendirme ışık kanalları | Faz 10 |
| **Deployment / StatefulSet** | **Sefer Sipariş Kartı / Filo Siparişi** | Aynı tipteki gemi ve konteynır gruplarının toplu üretim ve yükleme emri | Faz 6 |
| **Kubelet** | **Gemi Direğindeki Dönen Radar / Dümenci** | Gemi güvertesinde sürekli dönen ve node sağlığını bildiren radar | Faz 15 |
| **kube-scheduler** | **Sarı Liman Gantry Vinci** | Konteynırları karadan gemilere sevk eden ve yükleme kararı veren vinç | Faz 13 |
| **Ingress / Gateway API** | **Uluslararası Giriş Rıhtımı & Fener** | Liman ağzındaki deniz feneri ve dış sefer rotalarını temsil eden ana giriş kapısı | Faz 18 |
| **NetworkPolicy** | **Gümrük Güvenlik Bariyerleri** | İhlal durumunda rıhtım ve gemiler arasında beliren kırmızı lazer bariyer | Faz 18 |
| **ResourceQuota / LimitRange** | **Ambar Kapasite Çizgileri & Uyarı İşareti** | Depo ambar duvarındaki maksimum ağırlık çizgisi ve doluluk barı | Faz 18 |
| **HorizontalPodAutoscaler (HPA)** | **Otomatik Ekstra Vinç & Yükleyici Ekibi** | Pod yükü arttıkça otomatik sahaya giren ekstra hareketli yükleyici vinç | Faz 19 |
| **PodDisruptionBudget (PDB)** | **Maksimum Bakım İzin Bayrağı** | Aynı anda bakıma alınabilecek maksimum gemi sayısını gösteren sarı bayrak | Faz 19 |
| **Taints / Tolerations** | **Özel İzinli Özel Rıhtım Alanı** | Sadece belirli bayrağa (Toleration) sahip gemilerin yanaşabildiği özel rıhtım | Faz 19 |
| **Node Affinity / Anti-Affinity** | **Gemi Rıhtım Tercih Çizgileri** | Gemilerin tercih ettiği rıhtımları bağlayan yeşil/kırmızı magnetik çizgiler | Faz 19 |
| **ServiceAccount** | **Mürettebat Kimlik Kartı & Geçiş Rozeti** | Gemi ve binalarda asılı yetki kimlik kartı ve güvenlik rozetleri | Faz 16 |
| **RBAC (Role/ClusterRole)** | **Liman Genel Yetki Rozetleri** | Yetkili (sarı), Kısıtlı (yeşil), Salt-okunur (mavi) güvenlik bröşleri | Faz 16 |
| **EndpointSlice** | **Gişe Bağlantı Hatları Listesi** | Kube-proxy binasından ilgili gemi rıhtımlarına uzanan çoklu kablo demetleri | Faz 18 |
| **Rolling Update** | **Sıralı Filo Yenileme Animasyonu** | Gemilerin teker teker sırayla yanaşıp eski konteynırları yenileriyle değiştirmesi | Faz 19 |
| **Custom Resource / Operator** | **Özel Sipariş Zırhlı Gemi & Usta Başı** | Standart dışı özel tasarlanmış gemi ve onu otomatik yöneten özel vinç ustası | Faz 20 |
| **Helm Release** | **Toplu Liman Sefer Fişi** | Tüm servis ve gemileri kapsayan toplu sipariş mühürlü manifesto belgesi | Faz 20 |
