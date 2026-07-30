# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin ve mimari kararların gerekçeleri.

---

## 📜 Karar Listesi

### 🟢 [ADR-015] Gemilerin Devriye Rotası Sırasında Tıklama ve Hareket Davranışı
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Sağlıklı gemilerin (Worker Node) 3D denizde devriye rotasında gezinmesi sırasında tıklama ve kart açılması durumu.
- **Karar:** Bilgi kartı açıldığında geminin devriye hareketi durdurulmaz (duraksatılmaz); gemi sakin rotasına devam eder. Raycasting `groupRef` mesh üzerinde dinamik koordinat güncellenerek çalışır. Anomali durumunda ise gemi bulunduğu noktada sabitlenir.
- **Sonuç:** Liman canlı hissettirir, kullanıcı kartı incelerken de liman yaşamı devam eder.

---

### 🟢 [ADR-014] PNG Ekran Görüntüsü Dışa Aktarma ve Out-of-Scope Bağlantıları
- **Tarih:** 2026-07-30
- **Durum:** Kabul Edildi
