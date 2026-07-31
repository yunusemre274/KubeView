# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 22)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 13:** Varsayılan %100 3D Canvas, Çift Header Çözümü (`LESSON-002`), Nesne bazlı K8s müfettiş çekmecesi.
- **Faz 14:** Absolute Overlay Çekmece Mimarisi, CSS Transform animasyonu, sıfır canvas resize (`LESSON-004`).
- **Faz 15:** 3D➔2D Interactive Control Dashboard konsolu, `e.stopPropagation()` Raycasting hit-test düzeltmesi (`LESSON-005`), Dönen 3D Kubelet Radar İkonu ve Canlı Parçacık Ağ Akış Çizgileri (`NetworkTrafficParticles.jsx`).
- **Faz 16-20:** Mutasyon İzinleri, Anomali Dramatizasyonları, Ingress Deniz Feneri, NetworkPolicy Bariyerleri, HPA Mobil Vinçler, Cilium Hubble eBPF, Multi-Cluster Seçici, PNG Export, Statik Maliyet Tablosu, Top Navbar Çakışma Düzeltmesi (`LESSON-008`).
- **Faz 21: Canlı Pod Log Görüntüleyici (`v2.2.0`)**
  - Backend K8s API `pods/log` streaming WebSocket endpoint (`/api/v1/pods/logs/stream`).
  - Frontend `PodLogViewer.jsx` monospace terminal log görüntüleyicisi.
- **Faz 22: ConfigMap & Secret Güvenli İçerik Müfettişi (`v2.3.0`)**
  - ConfigMap için 3D Sevkiyat Panosu ve tam okunabilir key-value içerik müfettişi.
  - Secret için 3D Kilitli Çelik Kasa ve kesinlikle değer çekmeyen/göstermeyen, sadece key isimleri ve `••••••••` maskeli görsel temsil.
  - Pod ilişkilerinin gösterilmesi.

---

## 🟢 Kabul Kriterleri Doğrulaması (Faz 22)
- [x] ConfigMap'e tıklanınca TÜM key-value içeriği okunabilir şekilde gösteriliyor.
- [x] Secret'a tıklanınca key İSİMLERİ görünüyor ama DEĞERLER asla gösterilmiyor, `••••••••` maskeli gösterim var.
- [x] Backend kodunda Secret değerlerini frontend'de gönderen HİÇBİR kod yolu yok (kod denetimi ile doğrulandı).
- [x] Her iki nesne tipi de hangi Pod'lar tarafından kullanıldığını gösteriyor.
- [x] Sahnede 3D Sevkiyat Panosu (ConfigMap) ve 3D Kilitli Kasa (Secret) nesneleri var ve tıklanabiliyor.
