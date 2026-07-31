# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 23)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 13:** Varsayılan %100 3D Canvas, Çift Header Çözümü (`LESSON-002`), Nesne bazlı K8s müfettiş çekmecesi.
- **Faz 14:** Absolute Overlay Çekmece Mimarisi, CSS Transform animasyonu, sıfır canvas resize (`LESSON-004`).
- **Faz 15:** 3D➔2D Interactive Control Dashboard konsolu, `e.stopPropagation()` Raycasting hit-test düzeltmesi (`LESSON-005`), Dönen 3D Kubelet Radar İkonu ve Canlı Parçacık Ağ Akış Çizgileri (`NetworkTrafficParticles.jsx`).
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
  - PVC (kapasite, durum, StorageClass, erişim modları, bağlı PV, kullanan Pod'lar) ve PV (kapasite, reclaim policy, backend tipi, bağlı PVC) müfettiş çekmeceleri.

---

## 🟢 Kabul Kriterleri Doğrulaması (Faz 23)
- [x] Cluster'da PVC/PV varsa, karada gemiden bağımsız bir "depo" yapısı sahnede görünüyor.
- [x] Depo, kullanan Pod'un gemisine görsel bir bağlantı hattıyla (mor/turkuaz parlayan eğri) ilişkilendiriliyor.
- [x] PVC kartı: kapasite (10Gi), durum (Bound), StorageClass (gp3), erişim modu (ReadWriteOnce), bağlı PV, kullanan Pod(lar) eksiksiz gösteriyor.
- [x] PV kartı: kapasite (10Gi), reclaim policy (Retain), durum (Bound), storage backend tipi (AWS EBS gp3) eksiksiz gösteriyor.
- [x] Hiç PVC/PV yoksa sahnede boş/hayalet nesne oluşmuyor, sadece Yönetim Binası panelinde "0 PVC" bilgisi görünüyor.
