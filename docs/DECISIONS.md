# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri ve mimari kararlar.

---

## 📜 Karar Listesi

### 🟢 [ADR-018] Karada Bağımsız Depolama Ambarı ve Pod Bağlantı Hattı Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Kubernetes `PersistentVolume` (PV) kaynaklarının Pod yaşam döngüsünden bağımsız oluşunun 3D sahnede görselleştirilmesi gereksinimi.
- **Karar:**
  1. Depolama nesnesi (`StorageDepotMesh.jsx`) rıhtımda gemilere yapışık veya gemi güvertesinde değil, karada `[-28, 0.2, 18]` koordinatlarında bağımsız bir sanayi ambarı olarak modellenmiştir. Pod silinse dahi verinin ve deponun kalıcılığı bu sayede görselleşir.
  2. Depoyu kullanan Pod ile depo ambarı arasında `QuadraticBezierCurve3` ile mor/turkuaz parlayan bir 3D veri bağlantı hattı (`StorageConnectionLine`) çekilmiştir.
  3. Kümede PVC/PV bulunmayan durumlarda 3D ambar render edilmez; boş durum Master Dashboard'da gösterilir.
- **Sonuç:** PV/PVC kavramsal mimarisi 3D sahne diliyle tam uyumlu hale getirilmiştir.

---

### 🟢 [ADR-017] Secret Değerlerinin Maruziyet Önleme ve Metadata-Only RBAC Politikası
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Kubernetes `Secret` nesnelerinin Tersane 3D arayüzünde görselleştirilmesi ve içerik müfettişinin kurulması durumu.
- **Karar:**
  1. Secret değerleri (`Data` / `StringData`) backend Go kodunda `SecretInfo` tür tanımından ve API iletim şemasından **tamamen çıkarılmıştır**.
  2. Frontend tarafında değerler yanında `••••••••` maskeli görsel temsil ve `🔒 Değerler güvenlik nedeniyle gösterilmez` uyarısı verilir.
- **Sonuç:** %100 sıfır değer sızıntısı (zero value exposure) garanti edilmiştir.

---

### 🟢 [ADR-016] RBAC Yetkilerine `pods/log` Okuma İzininin Eklenmesi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
