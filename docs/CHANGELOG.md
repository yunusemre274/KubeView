# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.0.0-3d - Nihai 3D Sürüm Yayını (Official Release)] - 2026-07-30

### Eklendi / Tamamlandı
- `release-agent` ve `devops-agent` tarafından v1.0.0-3d Tam 3D Simülasyon platformu yayına alındı.
- Multi-stage Dockerfile (Node 18 frontend build, Go 1.22 backend build, Alpine 3.19 runtime) üretildi.
- Production Helm Chart (`charts/tersane`) v1.0.0-3d etiketine güncellendi.
- Tüm 11 fazın kabul testleri `qa-agent` ve `master-agent` tarafından onaylandı.

---

## [v0.10.0 - Faz 10 Ağ Trafiği Görselleştirme Tamamlandı] - 2026-07-30

### Eklendi
- `networking-agent` tarafından `backend/pkg/k8s/networking.go` (NetworkPolicy Informer) yazıldı.
- Kube-proxy 3D Ağ Binası ve canlı 3D ağ akış çizgileri geliştirildi.
