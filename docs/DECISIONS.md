# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin ve mimari kararların gerekçeleri.

---

## 📜 Karar Listesi

### 🟢 [ADR-016] RBAC Yetkilerine `pods/log` Okuma İzininin Eklenmesi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Faz 21 canlı Pod log görüntüleyici özelliğinin Kubernetes `CoreV1().Pods(ns).GetLogs()` API'si üzerinden çalışması gereksinimi.
- **Karar:** ClusterRole ve ServiceAccount RBAC tanımlarına `pods/log` kaynağı için `get`, `list`, `watch` okuma izinleri eklenmiştir. Bu izin salt-okunur (read-only) bir yetki olup, herhangi bir mutasyon veya kaynak değiştirme riski içermemektedir.
- **Sonuç:** Backend pod log akışlarını Kubernetes API'sinden canlı stream olarak güvenle çekebilir.

---

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
