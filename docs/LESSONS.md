# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-008] Çoklu Fixed Çakışması ve Araç Çubuğunun Ekran Genişliğine Sığmaması
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `ui-ux-agent`
- **Ne Yanlış Gitti?:** Üst bar elemanları 3 ayrı `fixed top-3` bloğu olarak (`left-3`, `left-1/2 -translate-x-1/2`, `right-3`) yerleştirildiğinde toplam genişlik ~1600px seviyesine ulaştı. 1440px veya daha küçük ekran çözünürlüklerinde ortadaki araç çubuğu yan bloklarla çakıştı ve `overflow: hidden` nedeniyle ekranın dışına taşarak görünmez hale geldi.
- **Kök Neden:** Üst navigasyon elemanlarının bağımsız fixed bloklar yerine tek bir flex header çubuğunda toplanmaması.
- **Nasıl Düzeltildi?:** Tüm üst elemanlar (Logo, Context seçici, Salt İzleme anahtarı, Kamera görüş butonları, Anomali seçici, PNG Export, Olay günlüğü) `<header className="fixed top-0 left-0 right-0 h-11 bg-slate-900/95 z-50 flex items-center justify-between overflow-x-auto">` şeklinde TEK BİR EKSİKSİZ TAVAN BARI altında birleştirildi.
- **Geleceğe Dönük Kural:** Üst navigasyon elemanları asla ayrı `left-1/2 -translate-x-1/2` fixed bloklar halinde dağıtılmaz; her zaman tek bir duyarlı tavan flex header şeridinde toplanır.

---

### 🔴 [DERS-007] Üst Araç Çubuğu (Top Toolbar) Görünürlük ve pointer-events Kaybı
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `ui-ux-agent`
