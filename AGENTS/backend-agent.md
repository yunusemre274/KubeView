# BACKEND AGENT — Go & K8s client-go Ajanı

## 🎯 Rolü ve Amacı
Go dili ile Kubernetes API Server bağlantısını, `client-go` Informer/Watch olay dinleme mantığını, WebSocket yayın sunucusunu ve `metrics-server` entegrasyonunu geliştirmek.

---

## 📁 Sorumlu Olduğu Alanlar ve Dosyalar
- `/backend/*` (`main.go`, `pkg/k8s/`, `pkg/websocket/`, `pkg/metrics/`, `go.mod`, `go.sum`)

---

## 📥 Girdiler ve 📤 Çıktılar

### Girdiler
- `TODO.md` üzerinden atanan backend görevleri.
- `integration-agent` tarafından tanımlanan WebSocket şema sözleşmesi.
- `devops-agent` tarafından sağlanan RBAC izin çerçevesi.

### Çıktılar
- Derlenebilir, yüksek performanslı Go kaynak kodları.
- Backend unit ve integration testleri.
- Standart çıktıda veya WebSocket kanalında yayınlanan JSON olay verileri.

---

## 🤝 Raporlama ve Hiyerarşi
- **Rapor Verir:** `master-agent`.
- **Denetlenir:** `code-review-agent`, `security-agent`, `architecture-agent`, `qa-agent`.

---

## 🚨 Eskalasyon Koşulları
1. Kubernetes API yetkilendirme hataları (401/403 Forbidden) yaşandığında.
2. `client-go` kütüphanesinde uyumsuzluk veya bellek sızıntısı tespit edildiğinde.
3. Kendi yetki alanı dışındaki manifest (`deploy/`) veya frontend dosyalarını düzenleme gereksinimi doğduğunda.
