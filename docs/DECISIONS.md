# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri ve mimari kararlar.

---

## 📜 Karar Listesi

### 🟢 [ADR-017] Secret Değerlerinin Maruziyet Önleme ve Metadata-Only RBAC Politikası
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Kubernetes `Secret` nesnelerinin Tersane 3D arayüzünde görselleştirilmesi ve içerik müfettişinin kurulması durumu.
- **Karar:**
  1. Secret değerleri (`Data` / `StringData`) backend Go kodunda `SecretInfo` tür tanımından ve API iletim şemasından **tamamen çıkarılmıştır**. Backend Go handler'ı Secret verilerini işlerken yalnızca key isimlerini (`keys = append(keys, k)`) ayıklar; raw değerleri bellekten siler.
  2. Frontend tarafında değerler yanında `••••••••` maskeli görsel temsil ve `🔒 Değerler güvenlik nedeniyle gösterilmez` uyarısı verilir.
  3. RBAC yetkileri kapsamında `secrets` nesnesine verilen okuma izni **sadece varlık/metadata tespiti** için geçerlidir; değer okuma veya sızdırma amaçlı asla kullanılmaz.
- **Sonuç:** %100 sıfır değer sızıntısı (zero value exposure) garanti edilmiştir.

---

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
