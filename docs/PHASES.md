# PHASES.md — Geliştirme Fazları (Katman Ayrımı & UI/UX Revizyonu)

Proje, KISS (Keep It Simple, Stupid) prensibine uygun olarak küçük, bağımsız ve test edilebilir fazlara bölünmüştür.

---

## 🟢 Faz 1-11: Altyapı, 3D Modeller, Informer'lar & WebSocket Akışı (Tamamlandı)
- Node, Pod, Deployment, Event, NetworkPolicy Informer'ları, WebSocket streaming, 3D binalar/gemiler, iç mekanlar ve port resolver tamamlandı.

---

## 🔵 Faz 12: UI/UX & 3D Mimari Görsel İyileştirme (Design System & Katman Ayrımı) (Aktif)
- **Hedef:** 3D Canvas ile HTML UI Overlay katmanlarını kesin olarak ayırmak, endüstriyel liman tasarım sistemini (renk paleti, tipografi, spacing) uygulamak ve 3D nesneleri (gemi, vinç, dok, kule) tanınabilir low-poly modellere dönüştürmek.
- **Aktif Agent'lar:** `ui-ux-agent`, `3d-scene-agent`, `architecture-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] 3D sahne içinde hiçbir okunabilir metin/buton yok, tamamı HTML overlay'de.
  - [ ] Hiçbir UI elemanı bir diğerinin üzerine binmiyor (farklı pencere boyutlarında test edilmiştir).
  - [ ] Gemi, liman, vinç, kontrol kulesi ilk bakışta ne olduğu anlaşılacak şekilde tanınabilir.
  - [ ] Tüm butonlar/dropdown'lar özel stillendirilmiş, tarayıcı varsayılanında hiçbir bileşen yok.
  - [ ] Tutarlı bir renk paleti ve tipografi sistemi tüm ekranlarda uygulanmış.
  - [ ] Aktif/pasif durum (sekmeler, seçili nesne) her zaman görsel olarak net.
