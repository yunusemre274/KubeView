# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.6.0 - Faz 6 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından `apps/v1` `Deployments` Informer'ı eklendi ve `Sefer Siparişi (Deployment)` paketlerinin WebSocket yayını sağlandı (`backend/pkg/k8s/watcher.go`). (`architecture-agent` onaylı)
- `frontend-agent` tarafından ekranın sol üstüne "📜 Sefer Siparişleri (Deployments)" listesini ve canlı replica durumlarını render eden `DeploymentPanel.jsx` bileşeni eklendi. (`qa-agent` onaylı)

---

## [v0.5.0 - Faz 5 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından `metrics.k8s.io` API entegrasyonu sağlandı (`backend/pkg/metrics/collector.go`).
- `frontend-agent` tarafından 3D Gemi (Node) üstüne CPU ve RAM doluluk çubukları (metrics bars) ve interaktif Pod detay kartı eklendi.

---

## [v0.4.0 - Faz 4 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından otomatik yeniden bağlanma destekli `useShipyardWebSocket.js` React hook'u geliştirildi.
- `frontend-agent` tarafından canlı K8s olaylarını yayınlayan `EventStream.jsx` ("📢 Liman Anonsları") bileşeni yazıldı.
