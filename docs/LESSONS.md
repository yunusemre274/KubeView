# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-002] Çift Header / Üst Üste Binen Component Render Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `frontend-agent`
- **Ne Yanlış Gitti?:** `App.jsx` içerisinde hem bağımsız `<Navbar />` bileşeni hem de `ShipyardScene.jsx` içerisinde yeni bir HTML header katmanı çağrıldı. Bu durum iki farklı sürüm etiketli başlık panellerinin ("v1.0.0-3d" ve "v1.2.0-3d") ekranın sol üstünde üst üste binmesine neden oldu.
- **Kök Neden:** Üst seviye `App.jsx` düzeninin temiz tutulmaması ve alt bileşenlerde bağımsız header tanımları yapılarak unmount/temizleme protokolüne dikkat edilmemesi.
- **Nasıl Düzeltildi?:** `App.jsx` içerisindeki kalıcı `<Navbar />` kaldırıldı. Tüm UI overlay mantığı `ShipyardScene.jsx` içerisindeki tek bir yönetilen overlay katmanına toplandı. Sol üstte sadece %3-4 yer kaplayan minimal marka rozeti bırakıldı.
- **Geleceğe Dönük Kural:** Hiçbir zaman aynı HTML panel/header tanımı birden fazla üst ve alt bileşende tekrarlanmayacak. `App.jsx` doğrudan %100 3D canvas viewport'unu render edecek.

---

### ⚠️ [DERS-001] Erken 2D Varsayımı ve Kapsam Netleştirmesi
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `architecture-agent` & `master-agent`
