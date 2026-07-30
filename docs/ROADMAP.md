# ROADMAP.md — Faz Zaman ve Durum Takibi

Bu tablo, projenin canlı ilerleme durumunu gösterir. Tahmini süreler değil, **gerçekleşen durumlar** kaydedilir.

> 🏆 **FAZ 16 TAMAMLANDI (v1.7.0 Güvenli Mutasyonlar & Halka Arabellek Olay Günlüğü Release) | SIRADAKİ: FAZ 17 (ANOMALİ & ALARM DRAMATİZASYONU ENGINE):**

| Faz | Durum | Başlangıç | Bitiş | Sorumlu Agent(lar) | Not |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faz 1-15: Core & 3D Engine** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | Tüm Agent'lar | Backend, WS, 3D Canvas, 2D Dashboard, Kubelet Radar |
| **Faz 16: Mutasyon & Olay Günlüğü** | 🟢 **Tamamlandı** | 2026-07-30 | 2026-07-30 | `backend-agent`, `ui-ux-agent` | Safe Mutations, Onay Modalı, Ring Buffer Event Log |
| **Faz 17: Anomali & Dramatizasyon** | 🟡 **Bekliyor (Sıradaki)** | 2026-07-30 | - | `3d-scene-agent`, `ui-ux-agent` | CrashLoopBackOff, OOMKilled, Evicted 3D Efektler |
| **Faz 18: Genişletilmiş Kavramlar 1** | ⚪ **Bekliyor** | - | - | `networking-agent`, `3d-scene-agent` | Ingress, NetworkPolicy, ResourceQuota, EndpointSlice |
| **Faz 19: Genişletilmiş Kavramlar 2** | ⚪ **Bekliyor** | - | - | `3d-scene-agent`, `ui-ux-agent` | HPA, PDB, Taints/Tolerations, Rolling Update |
| **Faz 20: Diğer Genişletmeler** | ⚪ **Bekliyor** | - | - | `devops-agent`, `ui-ux-agent` | Hubble, Multi-Cluster, PNG Export, Maliyet |

---

## 📌 Lejant (Durum Simgeleri)
- ⚪ **Bekliyor:** Henüz başlanmadı.
- 🟡 **Bekliyor (Sıradaki):** Başlatılmak üzere otonom sıraya alındı.
- 🔵 **Devam Ediyor:** Aktif geliştirme aşamasında.
- 🟢 **Tamamlandı:** Tüm kabul kriterleri doğrulandı ve merge edildi.
- 🔴 **Bloklandı:** Bir bağımlılık veya teknik engel nedeniyle durduruldu.
