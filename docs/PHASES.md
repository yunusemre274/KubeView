# PHASES.md — Geliştirme Fazları (Canlı 3D Liman Motoru)

Proje, KISS (Keep It Simple, Stupid) prensibine uygun olarak küçük, bağımsız ve test edilebilir fazlara bölünmüştür.

---

## 🟢 Faz 1-11: Altyapı, Informer'lar & WebSocket Stream (Tamamlandı)
- Node, Pod, Deployment, Event, NetworkPolicy Informer'ları, WebSocket streaming ve Port Resolver tamamlandı.

---

## 🔵 Faz 12.1: Sahne Kompozisyonu & Canlı 3D Motoru Yeniden İnşası (Aktif)
- **Hedef:** 3D sahneyi referans görseldeki (Desan Tersanesi) canlı, renkli, Township/Hay Day estetiğindeki low-poly liman simülasyonuna dönüştürmek, ekran oranını %85 3D / %15 UI olarak kurgulamak, dalgalı mavi denizi, ikonik sarı liman vincini, salınım yapan kargo gemilerini ve yumuşak kamera Lerp geçişlerini baştan kurmak.
- **Aktif Agent'lar:** `3d-scene-agent`, `ui-ux-agent`, `architecture-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Uygulama ilk açıldığında, kullanıcı hiçbir şeye tıklamadan bile ekranda net bir deniz, en az 2 gemi, en az 1 vinç ve kontrol kulesini AYNI ANDA, geniş bir sahne içinde görebiliyor.
  - [ ] 3D sahne ekranın en az %80-85'ini kaplıyor.
  - [ ] Bir gemiye tıklandığında kamera o gemiye yumuşak geçişle (Lerp) yaklaşıyor ve sağda küçük (~280px), kapatılabilir bir panel açılıyor.
  - [ ] Genel görsel his, referans görseldeki canlı/stilize/"oyun estetiği"ne yakın (Township / Hay Day estetiği, teknik wireframe değil).
