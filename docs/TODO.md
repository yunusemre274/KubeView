# TODO.md — Aktif ve Sıradaki Görevler Listesi (3D Revize)

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-801]** Go backend'e `pkg/netutils/port_resolver.go` ekleyerek 8000 portu doluysa otomatik 8001..8020 aralığında boş port bulma ve başlatma fonksiyonunu yazmak.
  - **Atanan Agent:** `backend-agent`
  - **Denetleyen Agent:** `architecture-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-802]** Frontend WebSocket hook'una dinamik port fallback mantığının eklenmesi.
   - **Atanan Agent:** `frontend-agent`
2. **[GÖREV-803]** Faz 8 port çakışma ve otomatik yönlendirme testlerinin `qa-agent` ile doğrulanması.
   - **Atanan Agent:** `qa-agent`
3. **[GÖREV-901]** Master Node Yönetim Binası ve Kubelet Dümenci Köprüsü 3D iç mekan (interior) sahnelerinin geliştirilmesi.
   - **Atanan Agent:** `3d-scene-agent`
4. **[GÖREV-1001]** Kube-proxy Ağ Binası ve Pod'lar arası canlı ağ trafiği ışık çizgilerinin render edilmesi.
   - **Atanan Agent:** `networking-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 7)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-401..403]** WebSocket canlı akış entegrasyonu ve `EventStream.jsx` anonslar ticker'ı. (Yapan: `ui-ux-agent`)
- [x] **[GÖREV-501..503]** `metrics.k8s.io` API entegrasyonu & 3D Node CPU/RAM çubukları. (Yapan: `backend-agent`)
- [x] **[GÖREV-601..603]** Deployment Informer & `DeploymentPanel.jsx` overlay. (Yapan: `backend-agent` & `ui-ux-agent`)
- [x] **[GÖREV-701..703]** Ambar (Namespace) seçici dropdown & K8s Event Informer. (Yapan: `backend-agent` & `ui-ux-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
