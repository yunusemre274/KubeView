# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.3.0 - Faz 3 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından React 18, Vite ve React Three Fiber tabanlı `/frontend` projesi kuruldu (`package.json`, `vite.config.js`, `index.html`).
- `frontend-agent` tarafından Three.js 3D liman, deniz, kargo gemisi (Worker Node) ve kargo paletleri (Pod) render eden `ShipyardScene.jsx` bileşeni geliştirildi. (`architecture-agent` onaylı)
- `frontend-agent` tarafından kullanıcı arayüzü üst durum çubuğu (`Navbar.jsx`) ve Kubernetes ↔️ Tersane metafor rehberi modalı (`LegendModal.jsx`) eklendi. (`qa-agent` onaylı)

---

## [v0.2.0 - Faz 2 Tamamlandı] - 2026-07-30

### Eklendi
- `integration-agent` tarafından WebSocket JSON mesaj envelope şeması ve `ShipyardMetaphor` veri yapıları tasarlandı (`backend/pkg/api/schema.go`).
- `backend-agent` tarafından Gorilla WebSocket Hub sunucusu (`/ws` endpoint'i) ve client bağlantı yöneticisi yazıldı (`backend/pkg/websocket/hub.go`).
- `backend-agent` tarafından K8s Informer event'lerinin WebSocket kanalı üzerinden canlı yayınlanması sağlandı (`backend/pkg/k8s/watcher.go`).

---

## [v0.1.0 - Faz 1 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından Go 1.22 `k8s.io/client-go` backend servisi kuruldu.
- `devops-agent` tarafından `deploy/rbac.yaml` manifest dosyası oluşturuldu.
- `doc-agent` tarafından proje dokümantasyon yapısı kuruldu.
