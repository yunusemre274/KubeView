# ROADMAP.md — Faz Zaman ve Durum Takibi

Bu tablo, projenin canlı ilerleme durumunu gösterir. Tahmini süreler değil, **gerçekleşen durumlar** kaydedilir.

> 🏆 **PROJE TAMAMLANDI (v1.0.0-3d Release):** Tüm 11 faz, 3D vizyonu, girilebilir binaları, ağ trafiği görselleştirmesi, otomatik port çakışma önleyicisi ve Helm Chart paketlemesi başarıyla tamamlanmıştır.

| Faz | Durum | Başlangıç | Bitiş | Sorumlu Agent(lar) | Not |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faz 1: Read-Only Backend & K8s API** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `devops-agent`, `security-agent` | RBAC & client-go Informer tamamlandı |
| **Faz 2: WebSocket Akışı & API Sözleşmesi** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `integration-agent` | `/ws` sunucusu ve JSON şeması tamamlandı |
| **Faz 3: Temel 3D Sahne & Dış Mimariler** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `3d-scene-agent`, `architecture-agent` | 3D Liman, Master Node ve Gemi dış modelleri |
| **Faz 4: WebSocket Canlı 3D Güncelleme** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `3d-scene-agent`, `backend-agent`, `integration-agent` | WebSocket canlı akış & anonslar entegre edildi |
| **Faz 5: Kaynak Metrikleri (CPU/RAM)** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `3d-scene-agent` | metrics.k8s.io entegrasyonu & 3D metrik kartları |
| **Faz 6: Deployment & Scaling** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `ui-ux-agent` | Deployment Informer & Sefer Siparişleri paneli |
| **Faz 7: Multi-Namespace & Events** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `ui-ux-agent`, `doc-agent` | Namespace seçici & K8s Event Informer |
| **Faz 8: Auto Port Detect & Fallback** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `ui-ux-agent`, `qa-agent` | Otomatik boş port tarama & fallback çözümü |
| **Faz 9: Girilebilir Binalar & İç Mekanlar** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `3d-scene-agent`, `ui-ux-agent`, `architecture-agent` | Master Node & Gemi içi girilebilir sahneler |
| **Faz 10: Ağ Trafiği & Network Policy** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `networking-agent`, `3d-scene-agent`, `backend-agent` | Kube-proxy ağ binası & 3D canlı akış hatları |
| **Faz 11: Production Build & Helm Chart** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `devops-agent`, `security-agent`, `release-agent` | Multi-stage Dockerfile & Helm Chart (v1.0.0-3d) |

---

## 📌 Lejant (Durum Simgeleri)
- ⚪ **Bekliyor:** Henüz başlanmadı.
- 🟡 **Bekliyor (Sıradaki):** Başlatılmak üzere onay bekliyor.
- 🔵 **Devam Ediyor:** Aktif geliştirme aşamasında.
- 🟢 **Tamamlandı:** Tüm kabul kriterleri doğrulandı ve merge edildi.
- 🔴 **Bloklandı:** Bir bağımlılık veya teknik engel nedeniyle durduruldu.
