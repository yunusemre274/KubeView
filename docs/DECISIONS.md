# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri ve mimari kararlar.

---

## 📜 Karar Listesi

### 🟢 [ADR-021] Bellek-İçi Kısa Süreli Metrik Ring Buffer Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Zaman serisi metrik trend grafiklerinin gösterilmesi için veri saklama yaklaşımının belirlenmesi.
- **Karar:**
  1. Prometheus/InfluxDB veya disk tabanlı bir veritabanı eklenmemiş; projenin "kolay kurulumlu self-hosted izleme aracı" felsefesine uygun olarak (KISS ilkesi) metrikler yalnızca bellek içinde son 1 saatlik (30s örneklemeli, 120 nokta) döner bir ring buffer'da tutulmuştur.
  2. Grafikler WebGL 3D render loop'undan tamamen ayrık SVG elemanları olarak çizilmiş ve grafik güncellemeleri 5 saniyelik düşük frekanslı döngüye bağlanmıştır. Böylece 3D canvas saniyede 60 kare (60 FPS) performansını tam korumaktadır.
  3. Veri birikim süresince boş görünüm engellenmiş, `"⏳ Veri toplanıyor... (Xdk/60dk)"` durum göstergesiyle mevcut biriken nokta sayısı kullanıcıya sunulmuştur.
- **Sonuç:** Kalıcı depolama yükü yaratmayan, 60 FPS 3D performansı koruyan canlı zaman serisi trend grafik yapısı kurulmuştur.

---

### 🟢 [ADR-020] RBAC İlişkisel İnceleme ve Aşırı Yetki Uyarısı Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** ServiceAccount, Role/ClusterRole ve Binding RBAC güvenlik bileşenlerinin sahnede görselleştirilmesi gereksinimi.
- **Karar:**
  1. RBAC bileşenleri fiziksel 3D bina veya yapılar olarak sahneyi karmaşıklaştırmak yerine, Pod ve ServiceAccount nesneleri arasında ilişkisel bağlarla entegre edilmiştir (`Pod ➔ ServiceAccount ➔ RoleBinding ➔ Role`).
  2. Role ve ClusterRole izinleri ham YAML olarak gösterilmek yerine insan tarafından rahat okunan UI tablosuna dönüştürülmüştür (`Resource` ➔ `Allowed Verbs`).
  3. Aşırı geniş yetkili (`cluster-admin`) ServiceAccount'lar için hem müfettiş kartında hem de Yönetim Binası özet panelinde belirgin bir kırmızı/turuncu güvenlik uyarısı rozeti gösterilerek farkındalık oluşturulmuştur.
- **Sonuç:** Güvenlik farkındalığı artırılmış, salt-okunur RBAC mimarisi başarıyla kurulmuştur.
