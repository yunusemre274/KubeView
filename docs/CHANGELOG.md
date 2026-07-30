# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.0.0 - Üretim Sürümü (Faz 8 Tamamlandı)] - 2026-07-30

### Eklendi
- `devops-agent` tarafından multi-stage üretim seviyesi `Dockerfile` yazıldı (Frontend React build + Go backend statically linked binary + Alpine minimal runtime <50MB). (`security-agent` onaylı)
- `devops-agent` tarafından `deploy/deployment.yaml` ve `deploy/service.yaml` manifestleri güncellendi (Non-root user, security context, liveness & readiness probes). (`security-agent` onaylı)
- `devops-agent` tarafından `charts/tersane` altında üretim seviyesi Helm Chart paketi oluşturuldu (`Chart.yaml`, `values.yaml`, templates). (`qa-agent` onaylı)
- `release-agent` ve `master-agent` tarafından tüm 8 faz tamamlanarak v1.0.0 Genel Yayın Sürümü (General Availability) duyuruldu.

---

## [v0.7.0 - Faz 7 Tamamlandı] - 2026-07-30

### Eklendi
- `frontend-agent` tarafından Navbar üzerine Ambar (Namespace) seçici dropdown eklendi.
- `backend-agent` tarafından K8s Core `Events` Informer'ı eklendi.

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
