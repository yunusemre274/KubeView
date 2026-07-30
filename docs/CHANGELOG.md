# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.2.0 - Faz 2 Tamamlandı] - 2026-07-30

### Eklendi
- `integration-agent` tarafından WebSocket JSON mesaj envelope şeması ve `ShipyardMetaphor` veri yapıları tasarlandı (`backend/pkg/api/schema.go`). (`architecture-agent` onaylı)
- `backend-agent` tarafından Gorilla WebSocket Hub sunucusu (`/ws` endpoint'i) ve client bağlantı yöneticisi yazıldı (`backend/pkg/websocket/hub.go`). (`code-review-agent` onaylı)
- `backend-agent` tarafından K8s Informer event'lerinin WebSocket kanalı üzerinden canlı yayınlanması ve ilk küme durumunun (Initial State Dump) gönderilmesi sağlandı (`backend/pkg/k8s/watcher.go`). (`qa-agent` onaylı)
- `backend-agent` tarafından `main.go` dosyasına HTTP sunucusu ve `/healthz` endpoint'i eklendi.

---

## [v0.1.0 - Faz 1 Tamamlandı] - 2026-07-30

### Eklendi
- `backend-agent` tarafından Go 1.22 `k8s.io/client-go` backend servisi kuruldu (`backend/main.go`, `backend/pkg/k8s/client.go`). (`code-review-agent` onaylı)
- `backend-agent` tarafından `SharedInformerFactory` ile Node ve Pod event'lerini dinleyen `Watcher` modülü geliştirildi (`backend/pkg/k8s/watcher.go`). (`qa-agent` onaylı)
- `devops-agent` tarafından `deploy/rbac.yaml` manifest dosyası oluşturuldu (`ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` salt-okunur izinlerle tanımlandı). (`security-agent` onaylı)
- `doc-agent` ve `master-agent` tarafından projenin altyapı ve mimari belgeleme yapısı kuruldu (`/docs` ve `/AGENTS` klasörleri oluşturuldu).
- `doc-agent` tarafından proje `README.md` dokümanı oluşturuldu.
