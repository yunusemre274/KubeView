# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 27)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 16-20:** Mutasyon İzinleri, Anomali Dramatizasyonları, Ingress Deniz Feneri, NetworkPolicy Bariyerleri, HPA Mobil Vinçler, Cilium Hubble eBPF, Multi-Cluster Seçici, PNG Export, Statik Maliyet Tablosu, Top Navbar Çakışma Düzeltmesi (`LESSON-008`).
- **Faz 21: Canlı Pod Log Görüntüleyici (`v2.2.0`)**
- **Faz 22: ConfigMap & Secret Güvenli İçerik Müfettişi (`v2.3.0`)**
- **Faz 23: PVC & PersistentVolume Depolama Müfettişi (`v2.4.0`)**
- **Faz 24: İş Yükü Tipi Ayrımı: StatefulSet, DaemonSet, Job & CronJob (`v2.5.0`)**
- **Faz 25: RBAC İlişkisel İnceleme ve Güvenlik Rozetleri (`v2.6.0`)**
- **Faz 26: Zaman İçindeki Kaynak Kullanım Trend Grafiği (`v2.7.0`)**
- **Faz 27: Otomatik Kubeconfig Port Değişimi Algılama ve Yeniden Bağlanma (`v2.8.0`)**
  - minikube yeniden başlatıldığında değişen API Server portunun 3 ardışık hata sonrası diskten `~/.kube/config` re-read ile otomatik algılanması.
  - Process restart gerektirmeden yeni port ile clientset ve informer'ların canlı güncellenmesi.
  - Kubeconfig okunamama hatası ile connection refused ayrımı.
  - WebSocket üzerinden frontend'e `"🔄 API Server adresi güncellendi. Yeni porta yeniden bağlanılıyor..."` durum bildirimi.

---

## 🟢 Kabul Kriterleri Doğrulaması (Faz 27)
- [x] minikube durdurup farklı bir portla yeniden başlatıldığında backend MANUEL yeniden başlatma olmadan birkaç deneme sonrası yeni porta kendi kendine bağlanıyor.
- [x] Bu geçiş sırasında frontend'de "yeniden bağlanılıyor" göstergesi görünüyor, sonra normale dönüyor.
- [x] kubeconfig dosyası tamamen okunamaz durumdaysa ayrı, net bir hata gösteriliyor.
