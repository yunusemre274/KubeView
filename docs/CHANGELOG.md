# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.9.0 - Faz 9 Girilebilir Binalar Tamamlandı] - 2026-07-30

### Eklendi
- `3d-scene-agent` tarafından Master Node Yönetim Binası içi (`MasterBuildingInterior`) ve Gemi Ambarı / Dümenci Köprüsü içi (`ShipInterior`) 3D sahneleri geliştirildi (`frontend/src/components/3d/BuildingInterior.jsx`). (`ui-ux-agent` onaylı)
- `3d-scene-agent` tarafından binalara ve gemilere tıklanarak iç mekanlarına girme ("🚪 İÇİNE GİR") mekanizması ve Kuşbakışı Mimari kamera mod değiştiricisi eklendi. (`qa-agent` onaylı)

---

## [v0.8.1 - Faz 8 Auto Port Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından `netutils.ResolveAvailablePort` modülü yazıldı.
- `frontend-agent` tarafından `useShipyardWebSocket.js` hook'una otomatik port tarama ve fallback entegrasyonu eklendi.
