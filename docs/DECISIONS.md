# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri mevcuttur.

---

## 📜 Karar Listesi

### 🟢 [ADR-022] Dinamik Kubeconfig Port Sapması Otomatik Kurtarma Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** minikube / Docker-desktop gibi yerel geliştirme kümelerinde API sunucu portunun yeniden başlatmalarda değişmesi ve backend'in takılı kalması sorunu.
- **Karar:**
  1. Backend K8s istemcisi API sunucu adresini static önbelleklemez. 3 ardışık bağlantı hatasından sonra diskteki `~/.kube/config` dosyasını re-read eder.
  2. Adres değişikliği tespit edildiğinde (`newHost != currentHost`), backend process'i kapatılmadan bellek içindeki clientset ve informer fabrikası yeni port adresiyle yeniden başlatılır.
  3. Kubeconfig okunamama hataları (`ErrKubeconfigUnreadable`) ile ağ bağlantı hataları net biçimde ayrıştırılır.
  4. Durum WebSocket üzerinden UI'ya iletilir.
- **Sonuç:** Kullanıcı müdahalesi gerektirmeyen self-healing K8s bağlantı altyapısı kurulmuştur.

---

### 🟢 [ADR-021] Bellek-İçi Kısa Süreli Metrik Ring Buffer Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Zaman serisi metrik trend grafiklerinin gösterilmesi için veri saklama yaklaşımının belirlenmesi.
- **Karar:**
  1. Prometheus/InfluxDB veya disk tabanlı bir veritabanı eklenmemiş; projenin "kolay kurulumlu self-hosted izleme aracı" felsefesine uygun olarak (KISS ilkesi) metrikler yalnızca bellek içinde son 1 saatlik (30s örneklemeli, 120 nokta) döner bir ring buffer'da tutulmuştur.
  2. Grafikler WebGL 3D render loop'undan tamamen ayrık SVG elemanları olarak çizilmiş ve grafik güncellemeleri 5 saniyelik düşük frekanslı döngüye bağlanmıştır.
- **Sonuç:** Kalıcı depolama yükü yaratmayan, 60 FPS 3D performansı koruyan canlı zaman serisi trend grafik yapısı kurulmuştur.
