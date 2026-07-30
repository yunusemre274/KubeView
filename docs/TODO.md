# TODO.md — Aktif ve Sıradaki Görevler Listesi

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-301]** React + Vite + Three.js / React Three Fiber projesinin (`/frontend`) kurulması ve statik liman/gemi 3D sahnesinin oluşturulması.
  - **Atanan Agent:** `frontend-agent`
  - **Denetleyen Agent:** `architecture-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-302]** OrbitControls ile kamera hareketi ve statik 3D kargo paletinin (Pod) gemiye yerleştirilmesi.
   - **Atanan Agent:** `frontend-agent`
2. **[GÖREV-303]** Faz 3 görsel doğrulamasının ve derleme testlerinin `qa-agent` tarafından yapılması.
   - **Atanan Agent:** `qa-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 & Faz 2)
- [x] **[GÖREV-101]** RBAC Manifestlerinin (`deploy/rbac.yaml`) hazırlanması. (Yapan: `devops-agent`)
- [x] **[GÖREV-102]** Go backend proje yapısının kurulması (`go.mod`, `main.go`). (Yapan: `backend-agent`)
- [x] **[GÖREV-103]** K8s client başlatıcı yazılması (`pkg/k8s/client.go`). (Yapan: `backend-agent`)
- [x] **[GÖREV-104]** `SharedInformerFactory` ile Node ve Pod event handler'larının yazılması. (Yapan: `backend-agent`)
- [x] **[GÖREV-201]** WebSocket JSON mesaj şemasının (`pkg/api/schema.go`) tasarlanması. (Yapan: `integration-agent`)
- [x] **[GÖREV-202]** Gorilla WebSocket Hub sunucusunun (`pkg/websocket/hub.go`) yazılması. (Yapan: `backend-agent`)
- [x] **[GÖREV-203]** Informer event'lerinin WebSocket üzerinden canlı yayınlanması ve Initial State Dump entegrasyonu. (Yapan: `backend-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
