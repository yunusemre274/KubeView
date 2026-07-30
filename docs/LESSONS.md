# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-006] Obje Değişiminde (Object Replacement) Eski Verilerin Silinmesi ve Regresyon Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `frontend-agent`
- **Ne Yanlış Gitti?:** Node (Gemi) bilgi kartına yeni maliyet alanı eklenirken ve Pod (Konteynır) kartı güncellenirken, JSX ve state nesneleri mevcut alanlar korunmadan sıradan bir obje ile ezildi (replace edildi). Bu durum Node kartındaki IP, sağlık, CPU/RAM ve Pod listesi verilerinin silinmesine, Pod kartının ise boş kalmasına yol açtı.
- **Kök Neden:** Yeni özellik eklerken eski props/JSX yapısını genişletmek (spread/merge) yerine doğrudan yeni bileşeni tek başına render etmek.
- **Nasıl Düzeltildi?:** `ShipyardScene.jsx` ve `MasterDashboardOverlay.jsx` içerisindeki tüm nesne kartı render blokları güncellendi. Node kartına IP, Sağlık, CPU/RAM, Kubelet/Proxy durumu, Pod listesi ve en alta Maliyet Tablosu eksiksiz eklendi. Pod kartı tam veri şemasıyla dolduruldu.
- **Geleceğe Dönük Kural:** `AGENTS.md` rehberine eklendi: "Yeni bir bilgi alanı/özellik eklenirken, ilgili state/props/veri objesi ASLA sıfırdan REPLACE edilmez — mevcut alanlar korunarak (spread/merge ile) genişletilir. Her değişiklik sonrası tüm kartların eksiksiz veri gösterdiği doğrulanır."

---

### 🔴 [DERS-005] İç İçe 3D Meshes Raycasting Olay Kabarması (Event Bubbling) Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `3d-scene-agent` & `ui-ux-agent`
