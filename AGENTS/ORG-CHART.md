# ORG-CHART.md — Organizasyon Şeması ve Dosya Sorumluluk Haritası (3D Revizyon)

Bu doküman, Tersane projesindeki aktif yapay zeka ajanlarının hiyerarşisini, görev tanımlarını ve sorumlu oldukları dosya/kod alanlarını (file ownership matrix) gösterir.

---

## 🏛️ Organizasyon Şeması

```
                            +--------------------------+
                            |       MASTER AGENT       |
                            |    (Proje Direktörü)     |
                            +--------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
  +--------------+               +---------------+               +---------------+
  | INTEGRATION  |               | ARCHITECTURE  |               |   SECURITY    |
  |    AGENT     |               |     AGENT     |               |     AGENT     |
  +--------------+               +---------------+               +---------------+
         |                               |                               |
  +------+------+                 +------+------+                 +------+------+
  |             |                 |             |                 |             |
  v             v                 v             v                 v             v
+----------+  +----------+    +----------+  +----------+    +----------+  +----------+
| BACKEND  |  | NETWORKING|   | 3D SCENE |  |  UI/UX   |    | CODE     |  | QA AGENT |
|  AGENT   |  |  AGENT   |    |  AGENT   |  |  AGENT   |    | REVIEW   |  | (Kabul)  |
+----------+  +----------+    +----------+  +----------+    +----------+  +----------+
                                                                               |
                                                                 +-------------+-------------+
                                                                 |                           |
                                                                 v                           v
                                                          +--------------+           +---------------+
                                                          |  DOC AGENT   |           | RELEASE AGENT |
                                                          +--------------+           +---------------+
```

---

## 📋 Ajan Rol Özeti ve Tek Cümlelik Tanımlar

| Ajan Adı | Katman | Tek Cümlelik Sorumluluk Tanımı |
| :--- | :--- | :--- |
| **`master-agent`** | Yönetim | Nihai karar mercii; görev dağıtımı yapar, 3D vizyonunu ve faz geçişlerini onaylar. |
| **`integration-agent`** | Yönetim | Backend-Frontend arası WebSocket/REST veri sözleşmelerini ve 3D sahne DTO'larını yönetir. |
| **`backend-agent`** | Mühendislik | Go dilinde `client-go` Informer'ları, WebSocket hub'ı ve otomatik port çakışma önleyiciyi geliştirir. |
| **`networking-agent`** | Mühendislik | Kube-proxy ağ binasını, NetworkPolicy kurallarını ve 3D canlı ağ akış çizgilerini yönetir. |
| **`3d-scene-agent`** | Mühendislik | Three.js / R3F ile 3D binalar, gemiler, girilebilir iç mekanlar (interior) ve kamera modlarını geliştirir. |
| **`ui-ux-agent`** | Mühendislik/Kalite| 60 FPS performansını, glassmorphism HUD panellerini ve iç/dış mekan geçiş estetiğini denetler ve uygular. |
| **`devops-agent`** | Mühendislik | Kubernetes manifestlerini, multi-stage Dockerfile ve Helm Chart paketlerini hazırlar. |
| **`security-agent`** | Kalite/Güvenlik | RBAC'ın kesinlikle read-only olduğunu denetler; ağ izin sınırlarını onaylar. |
| **`architecture-agent`** | Kalite/Güvenlik | Mimari bütünlüğü ve KISS prensibine uyumu denetler, `ARCHITECTURE.md` belgesinin sahibidir. |
| **`code-review-agent`** | Kalite/Güvenlik | Kod kalitesini, DRY uyumunu ve standartları denetler (Four-Eyes ilkesi). |
| **`qa-agent`** | Kalite/Güvenlik | `PHASES.md` kabul kriterlerini doğrulayıp faz onayını verir. |
| **`doc-agent`** | Destek | `README.md`, `/docs` ve metafor haritasının tutarlı kalmasından sorumludur. |
| **`release-agent`** | Destek | Git dallanma, commit formatı ve CHANGELOG sürüm etiketlerini yürütür. |

---

## 📁 Dosya Sorumluluk Haritası (File Ownership Matrix)

| Dosya / Klasör Yolu | Sahibi (Primary Owner) | İzin Verilen Diğer Agent'lar |
| :--- | :--- | :--- |
| `/docs/PROJECT.md` | `master-agent` | `doc-agent` |
| `/docs/PHASES.md` | `master-agent` | `qa-agent` |
| `/docs/ROADMAP.md` | `master-agent` | `release-agent` |
| `/docs/ARCHITECTURE.md` | `architecture-agent` | Tüm worker agent'lar |
| `/docs/TODO.md` | `master-agent` | Tüm worker agent'lar |
| `/docs/DECISIONS.md` | `master-agent` | `architecture-agent`, `security-agent` |
| `/backend/*` | `backend-agent` | `networking-agent`, `code-review-agent` |
| `/frontend/src/camera/*` | `3d-scene-agent` | `ui-ux-agent` |
| `/frontend/src/components/3d/*` | `3d-scene-agent` | `networking-agent` |
| `/frontend/src/components/ui/*` | `ui-ux-agent` | `doc-agent` |
