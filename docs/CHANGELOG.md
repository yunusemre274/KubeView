# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.10.0 - Faz 10 Ağ Trafiği Görselleştirme Tamamlandı] - 2026-07-30

### Eklendi
- `networking-agent` tarafından `backend/pkg/k8s/networking.go` yazıldı; K8s `networking.k8s.io/v1` NetworkPolicy Informer'ı eklendi. (`security-agent` onaylı)
- `networking-agent` tarafından Kube-proxy 3D Ağ & Telsiz Binası (`NetworkBuilding`) ve canlı 3D ağ akış çizgileri (`NetworkFlowStream`) geliştirildi (`frontend/src/components/3d/NetworkBuilding.jsx`). (`qa-agent` onaylı)

---

## [v0.9.0 - Faz 9 Girilebilir Binalar Tamamlandı] - 2026-07-30

### Eklendi
- `3d-scene-agent` tarafından Master Node Yönetim Binası içi (`MasterBuildingInterior`) ve Gemi Ambarı / Dümenci Köprüsü içi (`ShipInterior`) 3D sahneleri geliştirildi.
- Kamera mod değiştiricisi eklendi.
