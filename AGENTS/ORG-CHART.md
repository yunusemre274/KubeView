# ORG-CHART.md — Organizasyon Şeması ve Dosya Sorumluluk Haritası

Bu doküman, Tersane projesindeki aktif yapay zeka ajanlarının hiyerarşisini, görev tanımlarını ve sorumlu oldukları dosya/kod alanlarını (file ownership matrix) gösterir.

---

## 🏛️ Organizasyon Şeması

```
                            +--------------------------+
                            |       MASTER AGENT       |
                            |    (Proje Direktörü)     |
                            +--------------------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
  +--------------------------+                           +--------------------------+
  |    INTEGRATION AGENT     |                           |    ARCHITECTURE AGENT    |
  |  (Koordinasyon & Handoff)|                           | (Mimari & KISS Denetimi) |
  +--------------------------+                           +--------------------------+
               |                                                   |
  +------------+------------+                      +---------------+---------------+
  |            |            |                      |               |               |
  v            v            v                      v               v               v
+----------+ +----------+ +----------+       +-----------+   +--------------+  +----------+
| BACKEND  | | FRONTEND | |  DEVOPS  |       | SECURITY  |   | CODE REVIEW  |  | QA AGENT |
|  AGENT   | |  AGENT   | |  AGENT   |       |   AGENT   |   |    AGENT     |  | (Kabul)  |
+----------+ +----------+ +----------+       +-----------+   +--------------+  +----------+
                                                                                   |
                                                                     +-------------+-------------+
                                                                     |                           |
                                                                     v                           v
                                                              +--------------+           +---------------+
                                                              |  DOC AGENT   |           | RELEASE AGENT |
                                                              | (Dokümanlar) |           |  (Git/Versiyon|
                                                              +--------------+           +---------------+
```

---

## 📋 Ajan Rol Özeti ve Tek Cümlelik Tanımlar

| Ajan Adı | Katman | Tek Cümlelik Sorumluluk Tanımı |
| :--- | :--- | :--- |
| **`master-agent`** | Yönetim | Nihai karar mercii; görev dağıtımı yapar, faz geçişlerini onaylar ve çakışmaları çözer. |
| **`integration-agent`** | Yönetim | Backend ve Frontend arasındaki veri sözleşmesini (API/WebSocket) tasarlar, bileşen handoff'larını yönetir. |
| **`backend-agent`** | Mühendislik | Go dilinde `client-go` Informer/Watch mekanizmasını, WebSocket sunucusunu ve metrik entegrasyonunu geliştirir. |
| **`frontend-agent`** | Mühendislik | React ve Three.js (R3F) kullanarak tersane 3D sahnesini, gemi/kargo render'larını ve canlı animasyonları oluşturur. |
| **`devops-agent`** | Mühendislik | Kubernetes RBAC, Service, Deployment manifestlerini, Dockerfile ve Helm Chart paketlerini hazırlar. |
| **`security-agent`** | Kalite/Güvenlik | RBAC'ın kesinlikle read-only olduğunu denetler, bağımlılık güvenlik zafiyetlerini tarar. |
| **`architecture-agent`** | Kalite/Güvenlik | Mimari bütünlüğü ve KISS prensibine uyumu denetler, `ARCHITECTURE.md` dosyasının sahibi olarak güncel tutar. |
| **`code-review-agent`** | Kalite/Güvenlik | Yazılan kodların okunabilirliğini, DRY uyumunu, hata yönetimini ve standartlara uygunluğunu denetler. |
| **`qa-agent`** | Kalite/Güvenlik | `PHASES.md` dosyasındaki kabul kriterlerini kod ile kıyaslar ve test eder; merge onayını verir. |
| **`doc-agent`** | Destek | `README.md` ve `/docs` altındaki belgelendirmelerin tutarlı, okunabilir ve güncel kalmasını sağlar. |
| **`release-agent`** | Destek | Git dallanma (branching), commit formatı, merge düzeni ve CHANGELOG takibini yürütür. |

---

## 📁 Dosya Sorumluluk Haritası (File Ownership Matrix)

| Dosya / Klasör Yolu | Sahibi (Primary Owner) | İzin Verilen Diğer Agent'lar |
| :--- | :--- | :--- |
| `/docs/PROJECT.md` | `master-agent` | `doc-agent` (Salt-okunur düzenleme) |
| `/docs/PHASES.md` | `master-agent` | `qa-agent` |
| `/docs/ROADMAP.md` | `master-agent` | `release-agent` |
| `/docs/ARCHITECTURE.md` | `architecture-agent` | Tüm worker agent'lar (Öneri yapabilir) |
| `/docs/TODO.md` | `master-agent` | Tüm worker agent'lar (Görev güncellemesi) |
| `/docs/DECISIONS.md` | `master-agent` | `architecture-agent`, `security-agent` |
| `/docs/LESSONS.md` | `qa-agent` | Tüm worker agent'lar |
| `/docs/CHANGELOG.md` | `release-agent` | `doc-agent` |
| `/AGENTS/*` | `master-agent` | `doc-agent` |
| `/backend/*` | `backend-agent` | `code-review-agent`, `security-agent` |
| `/frontend/*` | `frontend-agent` | `code-review-agent` |
| `/deploy/*`, `/charts/*` | `devops-agent` | `security-agent` |
