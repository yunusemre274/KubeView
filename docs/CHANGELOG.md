# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.8.1 - Faz 8 Auto Port Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından `netutils.ResolveAvailablePort` modülü yazıldı (`backend/pkg/netutils/port_resolver.go`). Port 8000 doluysa `8000-8020` aralığında otomatik boş port atanır. (`architecture-agent` onaylı)
- `frontend-agent` tarafından `useShipyardWebSocket.js` hook'una otomatik port tarama ve fallback entegrasyonu eklendi. (`qa-agent` onaylı)

---

## [v0.8.0 - Kapsam Revizyonu & 3D Vizyon] - 2026-07-30

### Eklendi / Değiştirildi
- Proje kapsamı Tam 3D Simülasyon, Girilebilir Binalar/Gemiler, Ağ Trafiği ve Otomatik Port Çakışma Önleme seviyesine revize edildi.
- Metafor tablosu güncellendi: `etcd` = Tersane Kaptanı (Baş Kayıtçı), `Kubelet` = Dümenci / 2. Kaptan.
