# ROADMAP.md — Faz Zaman ve Durum Takibi

Bu tablo, projenin canlı ilerleme durumunu gösterir. Tahmini süreler değil, **gerçekleşen durumlar** kaydedilir. Her görev veya faz tamamlandığında `master-agent` veya `release-agent` tarafından güncellenir.

| Faz | Durum | Başlangıç | Bitiş | Sorumlu Agent(lar) | Not |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faz 1: Read-Only Backend & K8s API** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `devops-agent`, `security-agent` | RBAC & client-go Informer tamamlandı |
| **Faz 2: WebSocket Akışı & API Sözleşmesi** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `integration-agent` | `/ws` sunucusu ve JSON şeması tamamlandı |
| **Faz 3: Statik 3D Sahne Render** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `frontend-agent`, `architecture-agent` | React Three Fiber 3D liman & gemi sahnesi |
| **Faz 4: Canlı Güncelleme & Animasyon** | 🟡 **Bekliyor (Sıradaki)** | - | - | `frontend-agent`, `backend-agent`, `integration-agent` | Faz 3 tamamlandı, başlatılabilir |
| **Faz 5: Kaynak Metrikleri (CPU/RAM)** | ⚪ Bekliyor | - | - | `backend-agent`, `frontend-agent` | Metrics-server gerektirir |
| **Faz 6: Deployment & Scaling** | ⚪ Bekliyor | - | - | `backend-agent`, `frontend-agent` | - |
| **Faz 7: Multi-Namespace & Events** | ⚪ Bekliyor | - | - | `backend-agent`, `frontend-agent`, `doc-agent` | - |
| **Faz 8: Production Build & Helm Chart** | ⚪ Bekliyor | - | - | `devops-agent`, `security-agent`, `release-agent` | Nihai yayın |

---

## 📌 Lejant (Durum Simgeleri)
- ⚪ **Bekliyor:** Henüz başlanmadı.
- 🟡 **Bekliyor (Sıradaki):** Başlatılmak üzere onay bekliyor.
- 🔵 **Devam Ediyor:** Aktif geliştirme aşamasında.
- 🟢 **Tamamlandı:** Tüm kabul kriterleri doğrulandı ve merge edildi.
- 🔴 **Bloklandı:** Bir bağımlılık veya teknik engel nedeniyle durduruldu.
