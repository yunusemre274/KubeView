# TODO.md — Aktif ve Sıradaki Görevler Listesi

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-501]** Backend'e `metrics.k8s.io` API entegrasyonunun (`pkg/metrics/collector.go`) yazılması ve Node/Pod CPU ve RAM kullanım metriklerinin WebSocket paketine eklenmesi.
  - **Atanan Agent:** `backend-agent`
  - **Denetleyen Agent:** `security-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-502]** Frontend 3D sahnesinde gemi (Node) doluluk göstergesi ve tıklanan kargo paleti detay kartında metriklerin gösterilmesi.
   - **Atanan Agent:** `frontend-agent`
2. **[GÖREV-503]** Faz 5 metrik doğrulamalarının `qa-agent` tarafından yapılması.
   - **Atanan Agent:** `qa-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 4)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `frontend-agent`)
- [x] **[GÖREV-401]** `useShipyardWebSocket.js` hook'u ile canlı state entegrasyonu. (Yapan: `frontend-agent`)
- [x] **[GÖREV-402]** Dynamic 3D container ekleme/silme ve renk güncellemeleri. (Yapan: `frontend-agent`)
- [x] **[GÖREV-403]** `EventStream.jsx` ("📢 Liman Anonsları") canlı ticker bileşeni. (Yapan: `frontend-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
