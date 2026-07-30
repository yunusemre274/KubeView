# TODO.md — Aktif ve Sıradaki Görevler Listesi (3D Revize)

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-1101]** v1.0.0 Nihai Sürüm: Görsel UI/UX 60 FPS performans cilalaması (polish), multi-stage Dockerfile ve Helm Chart (`charts/tersane`) güncellemesi.
  - **Atanan Agent:** `devops-agent` & `ui-ux-agent`
  - **Denetleyen Agent:** `master-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-1102]** QA ve Güvenlik bağımsız denetimi (`qa-agent` & `security-agent`).
   - **Atanan Agent:** `qa-agent`
2. **[GÖREV-1103]** Proje dokümantasyonu final doğrulaması ve `v1.0.0-3d` etiketli release işlemleri.
   - **Atanan Agent:** `release-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 10)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-401..403]** WebSocket canlı akış entegrasyonu ve `EventStream.jsx` anonslar ticker'ı. (Yapan: `ui-ux-agent`)
- [x] **[GÖREV-501..503]** `metrics.k8s.io` API entegrasyonu & 3D Node CPU/RAM çubukları. (Yapan: `backend-agent`)
- [x] **[GÖREV-601..603]** Deployment Informer entegrasyonu & `DeploymentPanel.jsx` overlay. (Yapan: `backend-agent` & `ui-ux-agent`)
- [x] **[GÖREV-701..703]** Ambar (Namespace) seçici dropdown & K8s Event Informer. (Yapan: `backend-agent` & `ui-ux-agent`)
- [x] **[GÖREV-801..803]** `netutils.ResolveAvailablePort` ve otomatik port fallback taraması. (Yapan: `backend-agent` & `frontend-agent`)
- [x] **[GÖREV-901..903]** Girilebilir Master Node Yönetim Binası ve Gemi İç Mekanı (`BuildingInterior.jsx`). (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-1001]** Kube-proxy Ağ & Telsiz Binası 3D modeli (`NetworkBuilding.jsx`). (Yapan: `networking-agent`)
- [x] **[GÖREV-1002]** Pod'lar arası canlı 3D ağ akış tüpleri (`NetworkFlowStream.jsx`). (Yapan: `networking-agent`)
- [x] **[GÖREV-1003]** NetworkPolicy Informer ve Gümrük Politikaları metafor entegrasyonu (`backend/pkg/k8s/networking.go`). (Yapan: `networking-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
