# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-004] Yan Panellerin Canvas ile Flex/Grid Yer Paylaşımı Yapması ve Siyahlık Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `3d-scene-agent`
- **Ne Yanlış Gitti?:** Sağ bilgi paneli açılıp kapandığında ekranda anlık veya kalıcı siyah boşluk oluştu.
- **Kök Neden:** Sağ bilgi panelinin 3D canvas ile aynı flex/grid kapsayıcısı içinde yer paylaşımlı sibling öğe olarak kurgulanması. Panel açıldığında canvas boyutunun sıkışması, kapanınca ise renderer re-size ve aspect ratio hesaplamalarında anlık karelerde siyahlık kalması.
- **Nasıl Düzeltildi?:** Panel flex/grid hiyerarşisinden tamamen çıkarılarak `position: absolute; top: 0; right: 0; bottom: 0; z-index: 40;` overlay mimarisine geçirildi. Canvas kapsayıcısı (`.stage-wrapper`) kalıcı olarak `position: absolute; inset: 0;` olarak sabitlendi. Çekmece açılış/kapanışı CSS `transform: translateX(100%)` ➔ `translateX(0)` ile sağlandı.
- **Geleceğe Dönük Kural:** `AGENTS.md` rehberine eklendi: "Yan paneller ve bilgi kartları hiçbir zaman canvas ile flex/grid yer paylaşımı yapamaz. Canvas her zaman `position: absolute; inset: 0;` olarak 3D dünyayı render eder, paneller overlay olarak üstüne biner."

---

### 🔴 [DERS-003] CSS / Canvas Yükseklik Zinciri Kırılması ve 300px Sıkışma Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `frontend-agent`
