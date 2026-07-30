# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.3.0 - Faz 12.1 Canlı 3D Liman Motoru & Township Estetiği] - 2026-07-30

### Eklendi / Baştan İnşa Edildi
- `3d-scene-agent` & `ui-ux-agent` tarafından 3D Sahne referans görsel estetiğinde (Township / Hay Day low-poly canlı oyun stili) baştan kuruldu (`frontend/src/components/ShipyardScene.jsx`).
- 3D WebGL Canvas ekranın **%85'ini kaplayacak şekilde** genişletildi.
- Canlı turkuaz-mavi hareketli su yüzeyi (`Ocean`), yeşil ada/kara şeridi ve beton rıhtım altyapısı eklendi.
- İkonik parlak sarı kafesli konteynır vinci (`GantryCrane`), kırmızı çatılı kontrol kulesi binası ve su üstünde salınım (bobbing motion) yapan detaylı kargo gemileri (`CargoShip`) render edildi.
- Tıklanan nesnelere yumuşak kamera yaklaşma (`Vector3.lerp`) ve sağ tarafta 280px genişliğinde kapatılabilir detay çekmecesi eklendi.

---

## [v1.2.0 - Katman Ayrımı & Tasarım Sistemi] - 2026-07-30
- Katman 1 (3D Canvas) ve Katman 2 (UI Overlay) mimari ayrımı yapıldı.
