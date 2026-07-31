# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v2.5.0 - İş Yükü Tipi Ayrımı: StatefulSet, DaemonSet, Job & CronJob] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde Pod'ların hangi üst nesne (Deployment, StatefulSet, DaemonSet, Job, CronJob) tarafından yönetildiğinin 3D sahnede ayırt edilmediği, tüm Pod'ların genel "gemi üstü konteynır" görünümüne indirgendiği ve bilgi kartlarında "Yönetilen Tarafından" alanının bulunmadığı tespit edilmiştir.
- **Eklenen Özellik:**
  - **StatefulSet:** Numaralı (`pod-0`, `pod-1`), limanda sabit demirli özel gemi filosu (`StatefulSetShip.jsx`).
  - **DaemonSet:** Her Worker Node gemisinin direğinde otomatik beliren 3D standart ekipman anteni (`DaemonSetEquipment.jsx`).
  - **Job:** Limanda belirip görevini tamamlayınca yumuşakça süzülen 3D görev şalupası (`JobTaskBoatMesh.jsx`).
  - **CronJob:** Master Dashboard Sefer Tarifesi paneli, zamanlayıcı yönetimi ve canlı Job şalupası tetikleme mekanizması.
  - **Pod Kartı:** Her Pod kartında açık "Yönetilen Tarafından: Deployment / StatefulSet / DaemonSet / Job" bilgisi.

---

## [v2.4.0 - PVC & PV Depolama Müfettişi] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde PersistentVolumeClaim (PVC) ve PersistentVolume (PV) nesnelerinin 3D sahnede veya müfettiş çekmecelerinde henüz hiçbir 3D görsel nesnesinin ve veri müfettişinin bulunmadığı tespit edilmiştir.
- **Eklenen Özellik:** Karada gemilerden (Pod) bağımsız 3D Liman Depolama Ambarı (`StorageDepotMesh.jsx`), Pod-Depo arası parlayan 3D bağlantı hattı (`StorageConnectionLine.jsx`), PVC (kapasite, StorageClass, erişim modları, bağlı PV, kullanan Pod) ve PV (kapasite, reclaim policy, backend tipi, bağlı PVC) müfettiş çekmeceleri kurulmuştur.

---

## [v2.3.0 - ConfigMap & Secret Güvenli İçerik Müfettişi] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde ConfigMap (sevkiyat föyü) ve Secret (kilitli kasa) nesnelerinin 3D sahnede veya panellerde henüz hiçbir görsel karşılığının ve içerik müfettişinin bulunmadığı tespit edilmiştir.
- **Eklenen Özellik:** ConfigMap'ler için tam key-value gösterimi, Secret'lar için ise kesinlikle değer çekmeyen/göstermeyen, sadece key isimleri ve `••••••••` maskeli görsel temsil sunan 3D Sevkiyat Pano'su, 3D Kilitli Çelik Kasa ve Güvenli Müfettiş Çekmecesi kurulmuştur.
