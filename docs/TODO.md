# TODO.md — Aktif ve Sıradaki Görevler Listesi (3D Revize)

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-1001]** Kube-proxy Ağ Binasının 3D sahnede bağımsız telsiz/ağ kulesi olarak çizilmesi ve NetworkPolicy kurallarını okuyan informer'ın (`pkg/k8s/networking.go`) eklenmesi.
  - **Atanan Agent:** `networking-agent`
  - **Denetleyen Agent:** `architecture-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-1002]** Pod'lar ve Service'ler arası canlı 3D ağ akış tüplerinin (`NetworkFlowLines.jsx`) ve 3D gümrük bariyerlerinin render edilmesi.
   - **Atanan Agent:** `networking-agent`
2. **[GÖREV-1003]** Faz 10 ağ trafiği ve NetworkPolicy görselleştirme doğrulamalarının `qa-agent` ile yapılması.
   - **Atanan Agent:** `qa-agent`
3. **[GÖREV-1101]** UI/UX cilalama, multi-stage Dockerfile ve Helm Chart paketlemesi.
   - **Atanan Agent:** `devops-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 9)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-401..403]** WebSocket canlı akış entegrasyonu ve `EventStream.jsx` anonslar ticker'ı. (Yapan: `ui-ux-agent`)
- [x] **[GÖREV-501..503]** `metrics.k8s.io` API entegrasyonu & 3D Node CPU/RAM çubukları. (Yapan: `backend-agent`)
- [x] **[GÖREV-601..603]** Deployment Informer entegrasyonu & `DeploymentPanel.jsx` overlay. (Yapan: `backend-agent` & `ui-ux-agent`)
- [x] **[GÖREV-701..703]** Ambar (Namespace) seçici dropdown & K8s Event Informer. (Yapan: `backend-agent` & `ui-ux-agent`)
- [x] **[GÖREV-801..803]** `netutils.ResolveAvailablePort` ve otomatik port fallback taraması. (Yapan: `backend-agent` & `frontend-agent`)
- [x] **[GÖREV-901]** Girilebilir Master Node Yönetim Binası ve Gemi İç Mekanı (`BuildingInterior.jsx`). (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-902]** Kamera mod değiştiricisi (🦅 Kuşbakışı Mimari, 🏢 Yönetim Binası İçi, 🚢 Gemi İçi). (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-903]** Faz 9 iç mekan kabul doğrulamaları. (Yapan: `qa-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
