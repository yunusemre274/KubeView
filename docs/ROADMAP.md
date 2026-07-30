# ROADMAP.md — Faz Zaman ve Durum Takibi

Bu tablo, projenin canlı ilerleme durumunu gösterir. Tahmini süreler değil, **gerçekleşen durumlar** kaydedilir.

> 🏆 **FAZ 18 TAMAMLANDI (v1.9.0 Ingress Lighthouse & NetworkPolicy Barriers Release) | SIRADAKİ: FAZ 19 (GENİŞLETİLMİŞ KAVRAMLAR KATMANI 2):**

| Faz | Durum | Başlangıç | Bitiş | Sorumlu Agent(lar) | Not |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faz 1-17: Core & Dramatization** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | Tüm Agent'lar | Backend, WS, 3D Canvas, 2D Dashboard, Anomaly Engine |
| **Faz 18: Genişletilmiş Kavramlar 1** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `networking-agent`, `3d-scene-agent` | Ingress Lighthouse, NetworkPolicy Laser Barriers |
| **Faz 19: Genişletilmiş Kavramlar 2** | 🟡 **Bekliyor (Sıradaki)** | 2026-07-30 | - | `3d-scene-agent`, `ui-ux-agent` | HPA, PDB, Taints/Tolerations, Rolling Update |
| **Faz 20: Diğer Genişletmeler** | ⚪ **Bekliyor** | - | - | `devops-agent`, `ui-ux-agent` | Hubble, Multi-Cluster, PNG Export, Maliyet |

---

## 📌 Lejant (Durum Simgeleri)
- ⚪ **Bekliyor:** Henüz başlanmadı.
- 🟡 **Bekliyor (Sıradaki):** Başlatılmak üzere otonom sıraya alındı.
- 🔵 **Devam Ediyor:** Aktif geliştirme aşamasında.
- 🟢 **Tamamlandı:** Tüm kabul kriterleri doğrulandı ve merge edildi.
- 🔴 **Bloklandı:** Bir bağımlılık veya teknik engel nedeniyle durduruldu.
