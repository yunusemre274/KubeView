# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-005] İç İçe 3D Meshes Raycasting Olay Kabarması (Event Bubbling) ve Yanlış Nesne Tıklama Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `3d-scene-agent` & `ui-ux-agent`
- **Ne Yanlış Gitti?:** Gemi (Worker Node) üzerindeki kargo konteynırına (Pod) tıklandığında, tıklama olayı gemi gövdesine kabararak (bubbling) yanlışlıkla Node müfettiş çekmecesini açtı.
- **Kök Neden:** Three.js / React Three Fiber `onClick` ve `onPointerOver` olaylarında `e.stopPropagation()` çağrılmaması ve alt nesnelerin (konteynır) tıklama olayının ebeveyn gruplara (gemi gövdesi) taşınması.
- **Nasıl Düzeltildi?:** Tüm 3D interaktif nesnelerin (`CargoContainer`, `CargoShip`, `KubeletRadar`, `MasterBuilding`) `onClick` ve `onPointerOver` event handler'larına `e.stopPropagation()` eklendi. `userData` nesnesine `{ type: 'container' }`, `{ type: 'node' }`, `{ type: 'kubelet' }` etiketleri atandı.
- **Geleceğe Dönük Kural:** `AGENTS.md` rehberine eklendi: "İç içe 3D nesnelerde tıklama ve hover event handler'larında `e.stopPropagation()` çağrılmak ZORUNDADIR. Raycasting `userData.type` öncelik sırasına göre işlenmelidir."

---

### 🔴 [DERS-004] Yan Panellerin Canvas ile Flex/Grid Yer Paylaşımı Yapması ve Siyahlık Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `3d-scene-agent`
