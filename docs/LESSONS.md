# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### ⚠️ [DERS-001] Erken 2D Varsayımı ve Kapsam Netleştirmesi
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `architecture-agent` & `master-agent`
- **Ne Yanlış Gitti?:** Başlangıçta arayüzün 2D izometrik veya statik 3D render olabileceği varsayılmıştı. Ancak Kubernetes eğitimi alan kullanıcıların girilebilir binalara, serbest kamera uçuşuna ve ağ trafiği hatlarına ihtiyaç duyduğu sonradan netleşti.
- **Kök Neden:** İlk fazlarda mimari beklentilerin sadece "veri alma" odaklı kurgulanması, 3D kullanıcı etkileşimi (UX) derinliğinin erken aşamada netleştirilmemesi.
- **Nasıl Düzeltildi?:** ADR-004 ile vizyon tam 3D, girilebilir binalar, ağ kuleleri ve serbest kamera modlarına genişletildi. Fazlar yeniden planlandı.
- **Geleceğe Dönük Kural:** Gelecek projelerde ilk tasarım fazında UI/UX ve 3D kamera etkileşim sınırları en baştan `PROJECT.md` içerisinde açıkça tanımlanmalıdır.
