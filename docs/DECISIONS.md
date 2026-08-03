# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri mevcuttur.

---

## 📜 Karar Listesi

### 🟢 [ADR-024] Static File Server Mimarisi & Çevre Değişkenleri Temizliği
- **Tarih:** 2026-08-03
- **Durum:** Kabul Edildi
- **Bağlam:** Onboarding denetiminde tespit edilen Docker/K8s deployment senaryosundaki `404 page not found` hatası ve README'deki hayali çevre değişkenleri (`ENABLE_METRICS`, `METRICS_INTERVAL`, `LOG_LEVEL`).
- **Karar:**
  1. `backend/main.go` dosyasına `resolveStaticDir()` ile `./public`, `/app/public` ve `../frontend/dist` dizinlerini kontrol eden bir `http.FileServer` handler'ı eklenmiştir. Production build derlendiğinde backend `http://localhost:8000/` üzerinden React 3D SPA uygulamasını tek servis olarak sunar.
  2. Geliştirme ortamında static build bulunmadığında backend zarif bir HTML bilgilendirme sayfası gösterir ve dev server (`http://localhost:5173`) ile çakışmaz.
  3. README configuration tablosundan kodda karşılığı olmayan hayali değişkenler kaldırılmış; aktif olan `PORT`, `WATCH_NAMESPACE` ve `KUBECONFIG` korunmuştur.
- **Sonuç:** Standalone Docker ve K8s deployment'larında takılmadan çalışan 404-free üretim sunucusu elde edilmiştir.

---

### 🟢 [ADR-023] RBAC ClusterRole İzin Kapsamının 3D Görselleştirilen Tüm K8s Kaynaklarına Genişletilmesi
- **Tarih:** 2026-08-03
- **Durum:** Kabul Edildi
- **Bağlam:** 3D sahnesinde görselleştirilen Ingress, ConfigMap, Secret, Job, HPA, ServiceAccount ve RBAC nesnelerinin in-cluster modda ServiceAccount (`tersane-sa`) ile izlenirken `403 Forbidden` alması riski.
- **Karar:**
  1. `deploy/rbac.yaml` ve `charts/tersane/templates/rbac.yaml` içerisindeki ClusterRole izinleri genişletilmiştir: `configmaps`, `secrets`, `ingresses`, `jobs`, `cronjobs`, `horizontalpodautoscalers`, `serviceaccounts`, `roles`, `rolebindings`, `clusterroles`, `clusterrolebindings`, `persistentvolumeclaims`, `persistentvolumes`, `customresourcedefinitions`.
  2. Tüm izinler kesin olarak salt-okunur (`get`, `list`, `watch`) tutulmuştur.
  3. Secret verileri kesinlikle backend kodunda decode edilmemekte ve loglanmamaktadır; izin yalnızca Pod hacim bağı ve varlık tespiti içindir.
- **Sonuç:** In-cluster deployment ortamında sıfır `403 Forbidden` hatası garantilenmiştir.

---

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
