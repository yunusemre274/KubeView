# METAPHOR.md — Kubernetes & Tersane Kavram-Nesne Eşleştirme Rehberi

Bu belge, Kubernetes bileşenlerinin Tersane 3D simülasyonundaki tam görsel ve davranışsal karşılıklarını tanımlayan **tek resmi referans tablosudur**.

---

## ⚓ Temel ve Genişletilmiş Kavram Tablosu

| Kubernetes Kavramı | Tersanedeki Karşılığı | 3D Sahne Temsili & Görsel Davranış | Faz |
|---|---|---|---|
| **Cluster (Küme)** | **Tersane Havzası / Liman Bütünü** | Tüm deniz, rıhtım, liman binaları mevkileri | Faz 3 |
| **Worker Node** | **Kargo Gemisi (Filo Üyesi)** | Rıhtıma yanaşan, konteynır (Pod) taşıyan ve vinçle yüklenen yük gemisi | Faz 3 |
| **Control Plane (Master Node)** | **Yönetim Binası & Kontrol Kulesi** | Kırmızı çatılı, kuleli ve dönebilen radar sistemi olan ana kontrol binası | Faz 9 |
| **Pod / Container** | **Kargo Konteynırı (Palet)** | Gemi güvertesinde veya karada üst üste dizili renkli çelik konteynır kutusu | Faz 3 |
| **Deployment** | **Sefer Sipariş Kartı / Filo Siparişi** | Aynı tipteki gemi ve konteynır gruplarının toplu üretim ve yükleme emri | Faz 6 |
| **StatefulSet** | **Numaralı Sabit Gemi Filosu** | Limanda sabit demirli, devriye yapmayan, üzerinde `#0`, `#1` sıra numarası rozeti olan gemiler | Faz 24 |
| **DaemonSet** | **Gemi Direği Ekipmanı** | Her Worker Node gemisinin direğinde otomatik olarak beliren 3D dönen anten/fener ikonu | Faz 24 |
| **Job** | **Geçici Görev Şalupası** | Limanda belirip işini yapan, tamamlanınca yumuşakça süzülen 3D görev teknesi | Faz 24 |
| **CronJob** | **Sefer Tarifesi & Zamanlayıcı** | Yönetim Binası Sefer Tarifesi tablosundaki saat zamanlaması ve sahnede Job üreten zamanlayıcı | Faz 24 |
| **ConfigMap** | **Sevkiyat Föyü / Talimat Panosu** | Rıhtımda dikili, üzeri iğneli talimat kağıtlarıyla dolu tahta/çelik pano (tüm içerik açık) | Faz 22 |
| **Secret** | **Kilitli Emniyet Kasası** | Rıhtımda sabitlenmiş, altın kilitli ve sinyal fenerli çelik kasa (sadece key ismi, değerler gizli) | Faz 22 |
| **PersistentVolumeClaim (PVC)** | **Depo Tahsis Sözleşmesi** | Kiralanmış depolama alanının istenen kapasite (10Gi) ve erişim modları belgesi | Faz 23 |
| **PersistentVolume (PV)** | **Kiralanmış Depo Ambarı Yapısı** | Karada gemilerden bağımsız duran, çelik çatılı, 3D kapasite rozetli sanayi ambarı | Faz 23 |
| **Service (ClusterIP / NodePort)** | **Liman Danışma & Ağ Yönlendirme Binası** | Kube-proxy sinyal fenerli ağ binası ve yönlendirme ışık kanalları | Faz 10 |
| **Kubelet** | **Gemi Direğindeki Dönen Radar / Dümenci** | Gemi güvertesinde sürekli dönen ve node sağlığını bildiren radar | Faz 15 |
| **kube-scheduler** | **Sarı Liman Gantry Vinci** | Konteynırları karadan gemilere sevk eden ve yükleme kararı veren vinç | Faz 13 |
| **Ingress / Gateway API** | **Uluslararası Giriş Rıhtımı & Fener** | Liman ağzındaki deniz feneri ve dış sefer rotalarını temsil eden ana giriş kapısı | Faz 18 |
| **NetworkPolicy** | **Gümrük Güvenlik Bariyerleri** | İhlal durumunda rıhtım ve gemiler arasında beliren kırmızı lazer bariyer | Faz 18 |
| **ResourceQuota / LimitRange** | **Ambar Kapasite Çizgileri & Uyarı İşareti** | Depo ambar duvarındaki maksimum ağırlık çizgisi ve doluluk barı | Faz 18 |
| **HorizontalPodAutoscaler (HPA)** | **Otomatik Ekstra Vinç & Yükleyici Ekibi** | Pod yükü arttıkça otomatik sahaya giren ekstra hareketli yükleyici vinç | Faz 19 |
| **PodDisruptionBudget (PDB)** | **Maksimum Bakım İzin Bayrağı** | Aynı anda bakıma alınabilecek maksimum gemi sayısını gösteren sarı bayrak | Faz 19 |
