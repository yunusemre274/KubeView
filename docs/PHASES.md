# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 24)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 16-20:** Mutasyon İzinleri, Anomali Dramatizasyonları, Ingress Deniz Feneri, NetworkPolicy Bariyerleri, HPA Mobil Vinçler, Cilium Hubble eBPF, Multi-Cluster Seçici, PNG Export, Statik Maliyet Tablosu, Top Navbar Çakışma Düzeltmesi (`LESSON-008`).
- **Faz 21: Canlı Pod Log Görüntüleyici (`v2.2.0`)**
  - Backend K8s API `pods/log` streaming WebSocket endpoint (`/api/v1/pods/logs/stream`).
  - Frontend `PodLogViewer.jsx` terminal log görüntüleyicisi.
- **Faz 22: ConfigMap & Secret Güvenli İçerik Müfettişi (`v2.3.0`)**
  - 3D Sevkiyat Panosu (ConfigMap) ve 3D Kilitli Kasa (Secret) görsel nesneleri.
  - Secret için %100 sıfır değer sızıntısı garantisi.
- **Faz 23: PVC & PersistentVolume Depolama Müfettişi (`v2.4.0`)**
  - Karada gemilerden bağımsız 3D Depo Ambarı nesnesi (`StorageDepotMesh.jsx`).
  - Depo-Pod arası parlayan 3D mor/turkuaz bağlantı hattı.
- **Faz 24: İş Yükü Tipi Ayrımı: StatefulSet, DaemonSet, Job & CronJob (`v2.5.0`)**
  - StatefulSet Pod'ları numaralı (`#0`), sabit demirli gemiler olarak ayrışır.
  - DaemonSet Pod'ları her gemide tekrar eden dönen 3D ekipman anteni olarak görünür.
  - Job'lar geçici 3D görev şalupaları olarak belirip işi bitince kaybolur.
  - CronJob'lar Sefer Tarifesi zamanlama listesinde görünür, tetiklendiğinde yeni Job şalupası üretir.
  - Her Pod kartında açık "Yönetilen Tarafından (Owner)" bilgisi yazar.

---

## 🟢 Kabul Kriterleri Doğrulaması (Faz 24)
- [x] StatefulSet Pod'ları numaralı, sabit duran gemiler olarak diğerlerinden ayrışıyor.
- [x] DaemonSet Pod'ları her gemide tekrar eden, ortak bir ikon olarak görünüyor.
- [x] Job'lar geçici görev tekneleri olarak belirip işi bitince kayboluyor, başarısız olursa görsel olarak farklılaşıyor.
- [x] CronJob'lar bir zamanlama listesinde görünüyor, tetiklendiğinde yeni bir Job teknesi sahneye ekleniyor ve olay günlüğüne düşüyor.
- [x] Her Pod'un bilgi kartında hangi üst nesne tarafından yönetildiği net yazıyor.
