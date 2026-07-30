# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v0.8.0 - Kapsam Revizyonu & 3D Vizyon] - 2026-07-30

### Eklendi / Değiştirildi
- `master-agent` ve `architecture-agent` tarafından proje kapsamı 2D/statik görünümden **Tam 3D Simülasyon, Girilebilir Binalar/Gemiler, Ağ Trafiği ve Otomatik Port Çakışma Önleme** seviyesine revize edildi (`/docs/PROJECT.md`, `/docs/PHASES.md`, `/docs/ARCHITECTURE.md`).
- `doc-agent` tarafından metafor tablosu güncellendi: `etcd` = Tersane Kaptanı (Baş Kayıtçı), `Kubelet` = Dümenci / 2. Kaptan, `Network Policy` = Gümrük ve Erişim Politikaları olarak yeniden tanımlandı (`/docs/PROJECT.md`).
- `backend-agent` ve `ui-ux-agent` için Otomatik Port Çakışma Önleme (Auto Port Detect & Fallback) gereksinimleri Faz 8 aktif görevi olarak kurgulandı (`/docs/TODO.md`).
- `ORG-CHART.md` güncellenerek 3D, UX ve Networking ajan sorumlulukları netleştirildi.

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
