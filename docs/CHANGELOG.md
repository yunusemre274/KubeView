# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v2.7.0 - Zaman İçindeki Kaynak Kullanım Trend Grafiği] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde CPU ve RAM metriklerinin sadece anlık tek bir sayı (scalar value: `cpu_usage: '320m'`) olarak tutulduğu, zaman serisi geçmişinin bulunmadığı tespit edilmiştir. Olay Günlüğü ring buffer'ı ile çakışmamak adına, sürekli zaman serisi verileri için ayrı bir `metricsHistory` bellek-içi ring buffer yapısı oluşturulmuştur.
- **Eklenen Özellik:**
  - **Bellek-İçi Ring Buffer:** Node ve küme genelinde son 1 saatlik (30 saniye örneklemeli) zaman serisi metrik buffer'ı kuruldu. Kalıcı veritabanı yok (KISS ilkesi).
  - **Node Sparkline & Detaylı Grafik:** Node müfettiş kartında mini SVG sparkline grafiği eklendi. Tıklandığında eksenli (zaman/yüzde), tooltip destekli detaylı trend grafiği modalı açılır.
  - **Master Dashboard Cluster Trend Grafiği:** Yönetim Binası paneli Genel Bakış ve Yük Dağılımı sekmelerinde küme geneli ve node karşılaştırmalı canlı zaman serisi trend grafik eklendi.
  - **Veri Toplanıyor Durumu:** Yetersiz veri birikiminde `"⏳ Veri toplanıyor... (Xdk/60dk)"` ilerleme durum bildirimi kuruldu.
  - **Performans:** Grafik güncellemeleri 3D WebGL render döngüsünden tamamen bağımsız 1 sn interval ile çalışacak şekilde optimize edildi (60 FPS korundu).

---

## [v2.6.0 - RBAC & Güvenlik Rozetleri Müfettişi] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde ServiceAccount, Role/ClusterRole, RoleBinding/ClusterRoleBinding nesnelerinin sahnede veya panellerde hiçbir görsel karşılığının bulunmadığı ve Pod kartlarında dahi ServiceAccount bilgisine yer verilmediği tespit edilmiştir.
- **Eklenen Özellik:**
  - **Pod Kartı:** Her Pod kartına `🪪 KİMLİK KARTI (SERVICEACCOUNT)` ve bağlı `Role / ClusterRole` isimleri eklendi.
  - **ServiceAccount Müfettişi:** ServiceAccount adı, namespace, bağlı RoleBinding'ler, hedef roller ve kullanan Pod'lar listesi (tıklanabilir navigasyonlu).
  - **Role / ClusterRole Müfettişi:** Rol adı, tipi (Role/ClusterRole) ve ham YAML yerine düzgün formatlı **TANIMLI İZİNLER Tablosu** (Resource + Verbs: get/list/watch).
  - **Master Dashboard RBAC & Güvenlik Rozeti:** Küme geneli RBAC sayıları özeti (`12 SA, 8 Role, 3 ClusterRole, 15 Binding`) ve aşırı yetkili ServiceAccount'lar için `⚠️ AŞIRI YETKİLİ SERVICEACCOUNT (cluster-admin bağlı)` kırmızı güvenlik uyarı rozeti.
