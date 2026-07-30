# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.5.0 - Faz 5 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından `k8s.io/metrics` kullanılarak `metrics.k8s.io` API entegrasyonu sağlandı (`backend/pkg/metrics/collector.go`). (`security-agent` onaylı)
- `integration-agent` tarafından `ResourceMetrics` veri alanları WebSocket `WSMessage` şemalarına eklendi.
- `frontend-agent` tarafından 3D Gemi (Node) üstüne CPU ve RAM doluluk çubukları (metrics bars) eklendi. (`architecture-agent` onaylı)
- `frontend-agent` tarafından kargo paletine (Pod) tıklandığında anlık CPU/Memory tüketimini gösteren interaktif detay modalı geliştirildi. (`qa-agent` onaylı)

---

## [v0.4.0 - Faz 4 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından otomatik yeniden bağlanma destekli `useShipyardWebSocket.js` React hook'u geliştirildi.
- `frontend-agent` tarafından canlı K8s olaylarını yayınlayan `EventStream.jsx` ("📢 Liman Anonsları") bileşeni yazıldı.

---

## [v0.3.0 - Faz 3 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından React 18 ve React Three Fiber tabanlı `/frontend` 3D sahnesi kuruldu.
