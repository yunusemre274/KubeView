# TODO.md — Aktif ve Sıradaki Görevler Listesi

> ⚠️ **KURAL:** Bu liste en fazla 10 madde içerebilir. 10 maddeden uzunsa görevler `PHASES.md` dosyasına taşınmalıdır.

---

## 🔵 Aktif Görevler
- [ ] **[GÖREV-401]** React frontend'de WebSocket istemci hook'unun (`src/hooks/useShipyardWebSocket.js`) yazılması ve canlı state güncelleme mantığının kurulması.
  - **Atanan Agent:** `frontend-agent`
  - **Denetleyen Agent:** `integration-agent`

---

## 🟡 Sıradaki Görevler (Öncelik Sırasıyla)
1. **[GÖREV-402]** Yeni Pod eklendiğinde kargo yükleme animasyonunun, Pod silindiğinde kaybolma animasyonunun Three.js ile tetiklenmesi.
   - **Atanan Agent:** `frontend-agent`
2. **[GÖREV-403]** Faz 4 uçtan uca canlı akış animasyon testlerinin `qa-agent` tarafından yapılması.
   - **Atanan Agent:** `qa-agent`

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 3)
- [x] **[GÖREV-101]** RBAC Manifestlerinin hazırlanması (`deploy/rbac.yaml`). (Yapan: `devops-agent`)
- [x] **[GÖREV-102..104]** Go `client-go` backend servisi ve Informer watcher yapısı. (Yapan: `backend-agent`)
- [x] **[GÖREV-201..203]** WebSocket Hub sunucusu ve JSON streaming altyapısı. (Yapan: `backend-agent` & `integration-agent`)
- [x] **[GÖREV-301]** React + Three.js (R3F) 3D frontend projesinin kurulması (`/frontend`). (Yapan: `frontend-agent`)
- [x] **[GÖREV-302]** 3D Gemi (Node), Kargo (Pod), Liman sahnesi ve Metafor rehberi modalı. (Yapan: `frontend-agent`)
- [x] **[GÖREV-303]** Faz 3 görsel doğrulamaları ve kabulü. (Yapan: `qa-agent`)

---

## 🔴 Bekleyen / Bloklanmış Görevler
*Şu an bloklanmış bir görev bulunmamaktadır.*
