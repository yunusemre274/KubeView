# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.4.0 - Faz 4 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından otomatik yeniden bağlanma (reconnect) destekli `useShipyardWebSocket.js` React hook'u geliştirildi. (`integration-agent` onaylı)
- `frontend-agent` tarafından canlı K8s olaylarını ekran altında bant olarak yayınlayan `EventStream.jsx` ("📢 Liman Anonsları") bileşeni yazıldı. (`qa-agent` onaylı)
- `frontend-agent` tarafından 3D kargo paletleri (Pods) durum renk değişimi (Running=Yeşil, Pending=Sarı, Failed=Kırmızı) ve dynamic state güncellemeleri bağlandı.

---

## [v0.3.0 - Faz 3 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından React 18, Vite ve React Three Fiber tabanlı `/frontend` projesi kuruldu.
- `frontend-agent` tarafından Three.js 3D liman, deniz, kargo gemisi (Worker Node) ve kargo paletleri (Pod) render eden `ShipyardScene.jsx` bileşeni geliştirildi.
- `frontend-agent` tarafından Navbar ve Metafor rehberi modalı eklendi.

---

## [v0.2.0 - Faz 2 Tamamlandı] - 2026-07-30

### Eklendi
- `integration-agent` tarafından WebSocket JSON mesaj envelope şeması tasarlandı.
- `backend-agent` tarafından Gorilla WebSocket Hub sunucusu (`/ws` endpoint'i) yazıldı.

---

## [v0.1.0 - Faz 1 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından Go 1.22 `k8s.io/client-go` backend servisi kuruldu.
- `devops-agent` tarafından `deploy/rbac.yaml` manifest dosyası oluşturuldu.
