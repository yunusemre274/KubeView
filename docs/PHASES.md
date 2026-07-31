# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 21)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 13:** Varsayılan %100 3D Canvas, Çift Header Çözümü (`LESSON-002`), Nesne bazlı K8s müfettiş çekmecesi.
- **Faz 14:** Absolute Overlay Çekmece Mimarisi, CSS Transform animasyonu, sıfır canvas resize (`LESSON-004`).
- **Faz 15:** 3D➔2D Interactive Control Dashboard konsolu, `e.stopPropagation()` Raycasting hit-test düzeltmesi (`LESSON-005`), Dönen 3D Kubelet Radar İkonu ve Canlı Parçacık Ağ Akış Çizgileri (`NetworkTrafficParticles.jsx`).
- **Faz 16-20:** Mutasyon İzinleri, Anomali Dramatizasyonları, Ingress Deniz Feneri, NetworkPolicy Bariyerleri, HPA Mobil Vinçler, Cilium Hubble eBPF, Multi-Cluster Seçici, PNG Export, Statik Maliyet Tablosu, Top Navbar Çakışma Düzeltmesi (`LESSON-008`).
- **Faz 21: Canlı Pod Log Görüntüleyici (`v2.2.0`)**
  - Backend K8s API `pods/log` streaming WebSocket endpoint (`/api/v1/pods/logs/stream`).
  - Frontend `PodLogViewer.jsx` monospace terminal log görüntüleyicisi.
  - Multi-container pod seçim sekmeleri.
  - Auto-scroll duraklatma ve "En Alta İniş" tespiti.
  - Regex tabanlı renkli ERROR/WARN hata vurgulama.
  - Çekmece ve sekme kapanışlarında WebSocket stream bağlantı sızıntısının engellenmesi.

---

## 🟢 Kabul Kriterleri Doğrulaması (Faz 21)
- [x] Bir container'a tıklanıp "Loglar" sekmesi açıldığında GERÇEK, canlı log verisi akıyor.
- [x] Birden fazla container'lı bir Pod'da container seçimi çalışıyor.
- [x] Log paneli kapatılınca arka plandaki stream de kapanıyor (bağlantı sızıntısı yok).
- [x] Çok satırlı/uzun loglarda panel taşmıyor, kendi dikey/yatay scroll alanına sahip (max 500 satır sınırı).
- [x] Duraklat/Devam Et ve Temizle butonları sorunsuz çalışıyor.
