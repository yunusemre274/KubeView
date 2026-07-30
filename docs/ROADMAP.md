# ROADMAP.md — Faz Zaman ve Durum Takibi

Bu tablo, projenin canlı ilerleme durumunu gösterir. Tahmini süreler değil, **gerçekleşen durumlar** kaydedilir.

> 📢 **MILESTONE REVİZYONU (2026-07-30):** Proje kapsamı 2D/statik görünümden **Tam 3D Simülasyon, Girilebilir Binalar/Gemiler, Ağ Trafiği Görselleştirmesi ve Otomatik Port Çakışma Çözümü** seviyesine genişletilmiştir. Detaylar için bkz: `/docs/DECISIONS.md` [ADR-004..007].

| Faz | Durum | Başlangıç | Bitiş | Sorumlu Agent(lar) | Not |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faz 1: Read-Only Backend & K8s API** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `devops-agent`, `security-agent` | RBAC & client-go Informer tamamlandı |
| **Faz 2: WebSocket Akışı & API Şeması** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `integration-agent` | `/ws` sunucusu ve JSON şeması tamamlandı |
| **Faz 3: Temel 3D Sahne & Dış Mimariler** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `3d-scene-agent`, `architecture-agent` | 3D Liman, Master Node ve Gemi dış modelleri |
| **Faz 4: WebSocket Canlı 3D Güncelleme** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `3d-scene-agent`, `backend-agent`, `integration-agent` | WebSocket canlı akış & anonslar entegre edildi |
| **Faz 5: Kaynak Metrikleri (CPU/RAM)** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `3d-scene-agent` | metrics.k8s.io entegrasyonu & 3D metrik kartları |
| **Faz 6: Deployment & Scaling** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `ui-ux-agent` | Deployment Informer & Sefer Siparişleri paneli |
| **Faz 7: Multi-Namespace & Events** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `ui-ux-agent`, `doc-agent` | Namespace seçici & K8s Event Informer |
| **Faz 8: Auto Port Detect & Fallback** | 🔵 **Devam Ediyor** | 2026-07-30 | - | `backend-agent`, `ui-ux-agent`, `qa-agent` | Otomatik boş port bulma geliştirmesi |
| **Faz 9: Girilebilir Binalar & İç Mekanlar** | 🟡 **Bekliyor** | - | - | `3d-scene-agent`, `ui-ux-agent`, `architecture-agent` | Master Node & Gemi içi ilk şahıs modları |
| **Faz 10: Ağ Trafiği & Network Policy** | 🟡 **Bekliyor** | - | - | `networking-agent`, `3d-scene-agent`, `backend-agent` | Kube-proxy ağ binası & 3D akış hatları |
| **Faz 11: Production Build & Helm Chart** | 🟡 **Bekliyor** | - | - | `devops-agent`, `security-agent`, `release-agent` | Multi-stage Dockerfile & Helm Chart |

---

## 📌 Lejant (Durum Simgeleri)
- ⚪ **Bekliyor:** Henüz başlanmadı.
- 🟡 **Bekliyor (Sıradaki):** Başlatılmak üzere onay bekliyor.
- 🔵 **Devam Ediyor:** Aktif geliştirme aşamasında.
- 🟢 **Tamamlandı:** Tüm kabul kriterleri doğrulandı ve merge edildi.
- 🔴 **Bloklandı:** Bir bağımlılık veya teknik engel nedeniyle durduruldu.
