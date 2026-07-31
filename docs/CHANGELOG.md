# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v2.6.0 - RBAC & Güvenlik Rozetleri Müfettişi] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde ServiceAccount, Role/ClusterRole, RoleBinding/ClusterRoleBinding nesnelerinin sahnede veya panellerde hiçbir görsel karşılığının bulunmadığı ve Pod kartlarında dahi ServiceAccount bilgisine yer verilmediği tespit edilmiştir.
- **Eklenen Özellik:**
  - **Pod Kartı:** Her Pod kartına `🪪 KİMLİK KARTI (SERVICEACCOUNT)` ve bağlı `Role / ClusterRole` isimleri eklendi.
  - **ServiceAccount Müfettişi:** ServiceAccount adı, namespace, bağlı RoleBinding'ler, hedef roller ve kullanan Pod'lar listesi (tıklanabilir navigasyonlu).
  - **Role / ClusterRole Müfettişi:** Rol adı, tipi (Role/ClusterRole) ve ham YAML yerine düzgün formatlı **TANIMLI İZİNLER Tablosu** (Resource + Verbs: get/list/watch).
  - **Master Dashboard RBAC & Güvenlik Rozeti:** Küme geneli RBAC sayıları özeti (`12 SA, 8 Role, 3 ClusterRole, 15 Binding`) ve aşırı yetkili ServiceAccount'lar için `⚠️ AŞIRI YETKİLİ SERVICEACCOUNT (cluster-admin bağlı)` kırmızı güvenlik uyarı rozeti.

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
