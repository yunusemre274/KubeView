# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.7.0 - Faz 7 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından Navbar üzerine Ambar (Namespace) seçici dropdown eklendi ve 3D simülasyon filtreleme altyapısı hazırlandı (`frontend/src/components/Navbar.jsx`). (`doc-agent` onaylı)
- `backend-agent` tarafından K8s Core `Events` Informer'ı `watcher.go` dosyasına eklendi ve canlı liman anonslarının WebSocket üzerinden yayınlanması sağlandı (`backend/pkg/k8s/watcher.go`). (`qa-agent` onaylı)

---

## [v0.6.0 - Faz 6 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından `apps/v1` `Deployments` Informer'ı eklendi.
- `frontend-agent` tarafından "📜 Sefer Siparişleri (Deployments)" listesini render eden `DeploymentPanel.jsx` eklendi.

---

## [v0.5.0 - Faz 5 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından `metrics.k8s.io` API entegrasyonu sağlandı.
- `frontend-agent` tarafından 3D Gemi (Node) üstüne CPU ve RAM doluluk çubukları ve interaktif Pod detay kartı eklendi.
