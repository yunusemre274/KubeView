# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-007] Üst Araç Çubuğu (Top Toolbar) Görünürlük ve pointer-events Kaybı
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `ui-ux-agent`
- **Ne Yanlış Gitti?:** Araç çubuğu ekranın en üstüne sabitlenirken `fixed top-3 left-1/2 -translate-x-1/2` sınıfı verildi ancak `pointer-events-auto` ve yüksek `z-50` katmanı verilmediği için 3D Canvas veya parent div overlay'i altında kalarak tamamen kayboldu/tıklanamaz hale geldi.
- **Kök Neden:** Canvas üzerindeki sabit DOM elemanlarında `z-index` ve `pointer-events-auto` tanımlarının unutulması.
- **Nasıl Düzeltildi?:** Araç çubuğu `z-50 pointer-events-auto shadow-2xl bg-slate-900/90 backdrop-blur-md` sınıfları ile tavana sabitlendi ve tıklanabilirliği sağlandı.
- **Geleceğe Dönük Kural:** `position: fixed/absolute` ile z-index veya konum değişikliği yapılan HER bileşenden sonra, o bileşenin canvas üzerinde GERÇEKTEN görünür ve tıklanabilir kaldığı manuel olarak doğrulanır.

---

### 🔴 [DERS-006] Obje Değişiminde (Object Replacement) Eski Verilerin Silinmesi ve Regresyon Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `frontend-agent`
