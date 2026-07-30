# TODO.md — Aktif ve Sıradaki Görevler Listesi

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-701]** Frontend Navbar'a Namespace seçici (Ambar Filtresi) dropdown bileşeninin eklenmesi ve filtreleme mantığının yazılması.
  - **Atanan Agent:** `frontend-agent`
  - **Denetleyen Agent:** `doc-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-702]** Kubernetes Event nesnelerinin (`events`) `client-go` Informer'a eklenmesi ve canlı anons akışına bağlanması.
   - **Atanan Agent:** `backend-agent`
2. **[GÖREV-703]** Faz 7 kabul testlerinin `qa-agent` tarafından yapılması.
   - **Atanan Agent:** `qa-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 6)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `frontend-agent`)
- [x] **[GÖREV-401..403]** WebSocket canlı akış entegrasyonu ve `EventStream.jsx` anonslar ticker'ı. (Yapan: `frontend-agent`)
- [x] **[GÖREV-501..503]** `metrics.k8s.io` API entegrasyonu & 3D Node CPU/RAM çubukları. (Yapan: `backend-agent` & `frontend-agent`)
- [x] **[GÖREV-601]** Deployment Informer entegrasyonu (`pkg/k8s/watcher.go`). (Yapan: `backend-agent`)
- [x] **[GÖREV-602]** "📜 Sefer Siparişleri (Deployments)" overlay paneli (`DeploymentPanel.jsx`). (Yapan: `frontend-agent`)
- [x] **[GÖREV-603]** Faz 6 kabul testleri. (Yapan: `qa-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
