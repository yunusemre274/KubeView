# TODO.md — Aktif ve Sıradaki Görevler Listesi (3D Revize)

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-901]** Master Node Yönetim Binası ve Gemi (Worker Node) Dümenci Köprüsü için 3D girilebilir iç mekan (interior) sahnelerinin (`frontend/src/components/3d/BuildingInterior.jsx`) geliştirilmesi.
  - **Atanan Agent:** `3d-scene-agent`
  - **Denetleyen Agent:** `ui-ux-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-902]** İç mekan görünümünden kuşbakışı genel mimari görünümüne kesintisiz geçiş butonlarının ve kamera animasyonlarının eklenmesi.
   - **Atanan Agent:** `3d-scene-agent`
2. **[GÖREV-903]** Faz 9 iç mekan görünüm ve etkileşim doğrulamalarının `qa-agent` tarafından yapılması.
   - **Atanan Agent:** `qa-agent`
3. **[GÖREV-1001]** Kube-proxy Ağ Binası ve Pod'lar arası canlı ağ trafiği ışık çizgilerinin render edilmesi.
   - **Atanan Agent:** `networking-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 8)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-401..403]** WebSocket canlı akış entegrasyonu ve `EventStream.jsx` anonslar ticker'ı. (Yapan: `ui-ux-agent`)
- [x] **[GÖREV-501..503]** `metrics.k8s.io` API entegrasyonu & 3D Node CPU/RAM çubukları. (Yapan: `backend-agent`)
- [x] **[GÖREV-601..603]** Deployment Informer entegrasyonu & `DeploymentPanel.jsx` overlay. (Yapan: `backend-agent` & `ui-ux-agent`)
- [x] **[GÖREV-701..703]** Ambar (Namespace) seçici dropdown & K8s Event Informer. (Yapan: `backend-agent` & `ui-ux-agent`)
- [x] **[GÖREV-801]** `netutils.ResolveAvailablePort` otomatik port çakışma önleyici (backend). (Yapan: `backend-agent`)
- [x] **[GÖREV-802]** `useShipyardWebSocket` port fallback tarama mantığı (frontend). (Yapan: `frontend-agent`)
- [x] **[GÖREV-803]** Faz 8 port çakışma testleri ve kabulü. (Yapan: `qa-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
