# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri ve mimari kararlar.

---

## 📜 Karar Listesi

### 🟢 [ADR-019] İş Yükü Tipi Görsel ve Davranışsal Ayrıştırma Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Kubernetes'teki iş yükü tiplerinin (StatefulSet, DaemonSet, Job, CronJob) standart Deployment/Pod görünümünden görsel ve davranışsal olarak ayrıştırılması gereksinimi.
- **Karar:**
  1. StatefulSet nesneleri için sabit kimlik ve sıra kavramını yansıtmak amacıyla gemiler devriye rotasına sokulmamış, rıhtımda sabit demirli ve `#0` numaralı dikey rozetli olarak modellenmiştir.
  2. DaemonSet nesneleri her Worker Node gemisinin direğinde dönen 3D mavi anten ikonu olarak gösterilmiştir.
  3. Job nesneleri 3D görev şalupası (`JobTaskBoatMesh`) olarak modellenmiş, tamamlanınca yumuşakça silinen, başarısız olunca arıza dramatiği sergileyen yapıya kavuşturulmuştur.
  4. CronJob nesneleri Control Plane Sefer Tarifesi zamanlama paneline bağlanmış ve tetiklendiğinde sahnede canlı Job şalupası üreten mekanizma kurulmuştur.
  5. Her Pod kartına `ownerReferences` verisinden ayıklanan `Yöneten Üst Nesne` alanı eklenmiştir.
- **Sonuç:** K8s iş yükü tipleri 3D sahne diliyle mükemmel uyumlu hale getirilmiştir.

---

### 🟢 [ADR-018] Karada Bağımsız Depolama Ambarı ve Pod Bağlantı Hattı Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Kubernetes `PersistentVolume` (PV) kaynaklarının Pod yaşam döngüsünden bağımsız oluşunun 3D sahnede görselleştirilmesi gereksinimi.
- **Karar:**
  1. Depolama nesnesi (`StorageDepotMesh.jsx`) rıhtımda gemilere yapışık veya gemi güvertesinde değil, karada `[-28, 0.2, 18]` koordinatlarında bağımsız bir sanayi ambarı olarak modellenmiştir.
  2. Depoyu kullanan Pod ile depo ambarı arasında `QuadraticBezierCurve3` ile mor/turkuaz parlayan bir 3D veri bağlantı hattı (`StorageConnectionLine`) çekilmiştir.
- **Sonuç:** PV/PVC kavramsal mimarisi 3D sahne diliyle tam uyumlu hale getirilmiştir.
