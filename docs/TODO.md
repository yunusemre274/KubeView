# TODO.md — Aktif ve Sıradaki Görevler Listesi

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-601]** Deployment ve ReplicaSet objelerinin `client-go` Informer'a eklenmesi (`pkg/k8s/watcher.go`) ve "Sefer Siparişleri" paketlerinin WebSocket üzerinden yayınlanması.
  - **Atanan Agent:** `backend-agent`
  - **Denetleyen Agent:** `architecture-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-602]** Frontend ekranının sol üstüne "Sefer Siparişleri (Deployments)" listesinin ve ölçeklenme (Scale Up/Down) animasyon tetikleyicilerinin eklenmesi.
   - **Atanan Agent:** `frontend-agent`
2. **[GÖREV-603]** Faz 6 kabul kriterlerinin `qa-agent` tarafından test edilip onaylanması.
   - **Atanan Agent:** `qa-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 5)
- [x] **[GÖREV-101..105]** Salt-okunur RBAC & Go `client-go` backend servisi. (Yapan: `devops-agent` & `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301..303]** React + Three.js 3D frontend projesi ve 3D liman/gemi sahnesi. (Yapan: `frontend-agent`)
- [x] **[GÖREV-401..403]** WebSocket canlı akış entegrasyonu ve `EventStream.jsx` anonslar ticker'ı. (Yapan: `frontend-agent`)
- [x] **[GÖREV-501]** `metrics.k8s.io` API entegrasyonu (`pkg/metrics/collector.go`). (Yapan: `backend-agent`)
- [x] **[GÖREV-502]** 3D Gemi CPU/RAM doluluk çubukları & interaktif Pod metrik detay kartı. (Yapan: `frontend-agent`)
- [x] **[GÖREV-503]** Faz 5 metrik testleri ve kabulü. (Yapan: `qa-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
