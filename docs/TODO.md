# TODO.md — Aktif ve Sıradaki Görevler Listesi

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-801]** Backend ve Frontend için çok katmanlı (multi-stage) üretim seviyesi `Dockerfile` ve Kubernetes `deploy/deployment.yaml` manifestinin yazılması.
  - **Atanan Agent:** `devops-agent`
  - **Denetleyen Agent:** `security-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-802]** Production Helm Chart paketinin (`charts/tersane`) yazılması ve `values.yaml` yapılandırmasının hazırlanması.
   - **Atanan Agent:** `devops-agent`
2. **[GÖREV-803]** Trivy/Hadolint güvenlik taramaları, nihai QA doğrulaması ve v1.0.0 sürüm duyurusu.
   - **Atanan Agent:** `release-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 7)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `frontend-agent`)
- [x] **[GÖREV-401..403]** WebSocket canlı akış entegrasyonu ve `EventStream.jsx` anonslar ticker'ı. (Yapan: `frontend-agent`)
- [x] **[GÖREV-501..503]** `metrics.k8s.io` API entegrasyonu & 3D Node CPU/RAM çubukları. (Yapan: `backend-agent` & `frontend-agent`)
- [x] **[GÖREV-601..603]** Deployment Informer entegrasyonu & `DeploymentPanel.jsx` overlay. (Yapan: `backend-agent` & `frontend-agent`)
- [x] **[GÖREV-701]** Navbar Ambar (Namespace) seçici dropdown bileşeni. (Yapan: `frontend-agent`)
- [x] **[GÖREV-702]** K8s Core Events Informer entegrasyonu (`pkg/k8s/watcher.go`). (Yapan: `backend-agent`)
- [x] **[GÖREV-703]** Faz 7 kabul testleri. (Yapan: `qa-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
