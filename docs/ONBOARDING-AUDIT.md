# 🚢 Tersane (K8s Shipyard) — Sıfırdan Kurulum & Onboarding Denetim Raporu

> **✅ BU RAPORDAKİ TÜM BULGULAR 3 AĞUSTOS 2026 İTİBARIYLA TAMAMEN DÜZELTİLMİŞ VE v3.0.0 SÜRÜMÜ OLARAK YAYINLANMIŞTIR.**

**Tarih:** 3 Ağustos 2026  
**Denetim Tipi:** Tarafsız Dış Göz / İlk Kullanıcı Kurulum Denetimi  
**Durum:** ✅ Tüm 11 Madde Düzeltildi (v3.0.0)  

---

## 📊 Özet Bulgular Tablosu

| # | Kategori | Sorun | Ciddiyet | Bu, yeni bir kullanıcıyı nerede durdurur? |
|---|---|---|---|---|
| 1 | **README / Production** | Docker & Deployment manifestinde backend static dosya sunumu (`http.FileServer`) eksik. `http://localhost:8000` açıldığında `404 page not found` dönüyor. | **KRİTİK** | Kullanıcı projeyi K8s/Docker'a deploy eder, tarayıcıda port 8000'i açar ve boş 404 hatası alarak projeden vazgeçer. |
| 2 | **RBAC / K8s** | `deploy/rbac.yaml` içerisindeki ClusterRole izinleri eksik (`configmaps`, `secrets`, `ingresses`, `jobs`, `horizontalpodautoscalers` kaynakları yetkilerde yok). | **KRİTİK** | In-cluster modda ServiceAccount (`tersane-sa`) API Server'dan ConfigMap/Secret/Ingress okumaya çalıştığında `403 Forbidden` hatası alır. |
| 3 | **README** | `README.md` içerisindeki `kubectl apply -f` komutları çalışan lokal dosya yolları yerine varsayımsal raw GitHub URL'leri (`k8s-tersane`) gösteriyor. | **ORTA** | Repoyu klonlayan kişi README'deki `https://raw.githubusercontent...` komutunu kopyaladığında URL bulunamayabilir veya lokal değişiklikleri test edemez. |
| 4 | **README** | Özelliklerde Helm desteği vaat edilmesine ve `charts/tersane` klasörü bulunmasına rağmen README'de Helm kurulum komutu (`helm install`) yazmıyor. | **ORTA** | Helm kullanmak isteyen kullanıcı kılavuzda komut bulamaz, manuel `kubectl` ile uğraşmak zorunda kalır. |
| 5 | **README** | `README.md` yapılandırma tablosunda belirtilen `ENABLE_METRICS`, `METRICS_INTERVAL` ve `LOG_LEVEL` değişkenleri Go kodunda fiilen okunmuyor. | **DÜŞÜK** | Kullanıcı `.env` veya deployment manifestinde bu değişkenleri değiştirir ama backend davranışının değişmediğini görünce kafası karışır. |
| 6 | **README** | `README.md` Yol Haritası (Roadmap) kısmında StatefulSet, DaemonSet ve HPA tamamlanmamış `[ ]` görünürken, kod tabanında bu 3D bileşenler zaten mevcuttur. | **DÜŞÜK** | Projeyi inceleyen kişi bu özelliklerin henüz geliştirilmediğini sanır. |
| 7 | **Başlatma** | Lokalde hem backend hem frontend'i tek komutla başlatan bir script, `Makefile` veya `docker-compose.yaml` yok; ayrı terminal çalıştırması gerekiyor. | **ORTA** | İlk kez kuran kişi iki ayrı klasöre gidip bağımlılıkları manuel başlatmak zorundadır. |
| 8 | **Başlatma** | Backend port çakışmasında 8000-8020 arasını tararken, frontend WebSocket singleton `maxPort` değeri `8005` ile sınırlıdır. | **DÜŞÜK** | Backend 8006+ portuna atanırsa frontend otomatik bağlanamaz ve kopuk kalır. |
| 9 | **Hata Yönetimi** | `App.jsx` içinde WebSocket `isConnected` durumu çekiliyor fakat `ShipyardScene.jsx` bileşenine aktarıldığı halde UI tarafında hiç kullanılmıyor. | **ORTA** | Backend kapandığında veya çöktüğünde ekranda hiçbir "Bağlantı Koptu / Backend Sunucusuna Ulaşılamıyor" uyarısı belirmez; sahne sessizce boş kalır. |
| 10 | **Hata Yönetimi** | Header'daki Küme Seçim kutusu (`🐳 minikube`, `📦 docker-desktop`, `☁️ prod-cluster`) sadece lokal UI eventi logluyor, backend context'ini değiştirmiyor. | **DÜŞÜK** | Kullanıcı cluster değiştirdiğini sanır fakat arkadaki bağlam değişmez. |
| 11 | **İlk Açılış** | Uygulama ilk açıldığında kullanıcıyı karşılayan bir Onboarding Turu, Karşılama Modalı veya ipucu rehberi yok; direkt 3D sahneye giriyor. | **DÜŞÜK** | İlk defa giren kullanıcı 3D nesnelerin ve butonların amacını anlamak için ekranı keşfetmek zorunda kalır. |

---

## 🔍 Detaylı Bölüm İncelemeleri

### 1. README.md Denetimi

#### ❌ Hatalı / Eksik Noktalar:
1. **Static File Serving Eksikliği (En Kritik Nokta):**
   - README Adım 3: `kubectl port-forward svc/tersane-service 8000:8000` sonrası `http://localhost:8000` adresine gidin diyor.
   - Gerçek durum: `backend/main.go` dosyası `http.FileServer` içermiyor. Sadece `/ws`, `/api/v1/pods/logs/stream` ve `/healthz` dinliyor. `http://localhost:8000/` çağrıldığında standart Go HTTP `404 page not found` dönmektedir.
2. **Klonlanan Repo İçi Kurulum Komutları:**
   - README'de: `kubectl apply -f https://raw.githubusercontent.com/k8s-tersane/tersane/main/deploy/rbac.yaml`
   - Olması Gereken: Repoyu bilgisayarına klonlayan kişi için `kubectl apply -f deploy/rbac.yaml` ve `kubectl apply -f deploy/deployment.yaml` komutları net olarak verilmelidir.
3. **Helm Dokümantasyon Eksikliği:**
   - Repo içinde `charts/tersane` klasörü altında geçerli bir Helm chart mevcut. Ancak README'de `helm install tersane ./charts/tersane` veya `helm upgrade --install` komutu hiç yer almıyor.
4. **Hayali (Fictitious) Environment Değişkenleri:**
   - README'de açıklanan `ENABLE_METRICS`, `METRICS_INTERVAL` ve `LOG_LEVEL` çevre değişkenleri Go backend kodunda (`os.Getenv`) aranmamaktadır. Kod tarafında sadece `PORT`, `WATCH_NAMESPACE` ve `KUBECONFIG` okunmaktadır.
5. **Güncelliğini Yitirmiş Yol Haritası (Roadmap):**
   - StatefulSet, DaemonSet ve HPA özellikleri 3D sahnede (`StatefulSetShip`, `DaemonSetEquipment`, `HPAMobileCrane`) aktif olduğu halde README'de `[ ]` olarak işaretlidir.

---

### 2. RBAC / Kubernetes Kurulum Denetimi

#### ❌ Hatalı / Eksik Noktalar:
1. **`deploy/rbac.yaml` İzin Kapsamı Eksikliği:**
   - `deploy/rbac.yaml` dosyası incelendiğinde ClusterRole izinlerinin sadece `nodes`, `pods`, `services`, `namespaces`, `events`, `deployments`, `replicasets`, `statefulsets`, `daemonsets` ve `metrics.k8s.io` ile sınırlı olduğu görüldü.
   - Ancak uygulamada `ConfigMapAndSecretMesh` (ConfigMap/Secret), `IngressLighthouse` (Ingress), `JobTaskBoatMesh` (Job) ve `HPAMobileCrane` (HPA) nesneleri görselleştirilmektedir. Backend k8s watcher in-cluster ortamda çalıştığında bu kaynaklar için `403 Forbidden` yetki hatası alacaktır.
2. **Lokal Tek Tıkla Başlatma Scripti Eksikliği:**
   - Repoda Docker image build edip lokal k8s'e yükleyen veya `docker-compose` ile hem backend hem frontend'i tek komutla ayağa kaldıran bir `Makefile` veya `start.sh` bulunmamaktadır.

---

### 3. Başlatma Süreci Denetimi

#### ❌ Hatalı / Eksik Noktalar:
1. **Ayrık Geliştirme Süreci:**
   - Lokal geliştirme için geliştirici 2 ayrı terminal açıp:
     - Terminal 1: `cd backend && go run main.go`
     - Terminal 2: `cd frontend && npm run dev`
     çalıştırmak zorundadır.
2. **Port Tarama Aralığı Uyuşmazlığı:**
   - Backend `netutils.ResolveAvailablePort(8000, 8020)` ile 8000-8020 aralığını denerken, Frontend `ShipyardClusterContext.jsx` içerisindeki `singletonManager` maxPort sınırını `8005` olarak tutmaktadır. Port 8006 ve üzerinde backend açılırsa frontend otomatik bağlanamayacaktır.

---

### 4. Ön Koşul / Hata Yönetimi Denetimi

#### ❌ Hatalı / Eksik Noktalar:
1. **Frontend Disconnected UI Eksikliği:**
   - `App.jsx` dosyasında `const { isConnected } = useShipyardWebSocket()` çekilip `ShipyardScene` bileşenine aktarılıyor.
   - Ancak `ShipyardScene.jsx` bileşeni `isConnected` props'unu hiç kullanmamaktadır.
   - Backend sunucusu kapalıysa veya bağlantı koptuğunda kullanıcı ekranında "Bağlantı Kesildi / Backend Bulunamadı" uyarısı ve "Tekrar Bağlan" butonu görünmemekte, kullanıcı sadece boş deniz görmektir.
2. **Kozmetik Küme Seçim Menüsü:**
   - Header'daki `<select>` menüsü (`minikube`, `docker-desktop`, `prod-cluster`) sadece UI event kaydı yapmaktadır. Backend tarafında kubeconfig context değiştiren gerçek bir endpoint'e bağlı değildir.

---

### 5. İlk Açılış Deneyimi Denetimi

#### ❌ Hatalı / Eksik Noktalar:
1. **Onboarding / Karşılama Modalı Eksikliği:**
   - Kullanıcı uygulamayı ilk kez açtığında doğrudan 3D sahneye fırlatılmaktadır.
   - "Tersane'ye Hoş Geldiniz! Kargo gemileri Worker Node'ları, konteynırlar Pod'ları temsil eder..." şeklinde 3-4 adımlı basit bir karşılama/ipucu turu mevcut değildir.

---

## 🎯 En Kritik 3-5 Bottleneck (İlk 5 Dakikada Takılma Riski En Yüksek Noktalar)

LinkedIn veya GitHub üzerinden projeyi görüp klonlayan teknik bir kullanıcının ilk 5 dakikada yaşayacağı en kritik engeller:

1. **🔴 Standalone / Docker / K8s Deployment'ta 404 Hatası (Kritik #1):**
   - Kullanıcı README'yi takip edip `deploy/deployment.yaml` ile cluster'a deploy ettiğinde veya Docker container'ını çalıştırdığında `http://localhost:8000` adresi `404 page not found` verir. Çünkü Go backend'de static file server (`./public`) tanımlı değildir. Kullanıcı uygulamanın bozuk olduğunu düşünür.
2. **🔴 Eksik RBAC Manifesti Sebebiyle In-Cluster 403 Hatası (Kritik #2):**
   - Cluster'a deploy edilen backend `ServiceAccount` yetkilerinde ConfigMap, Secret, Ingress, Job ve HPA tanımları olmadığı için Kubernetes API Server'dan `403 Forbidden` alır ve watcher çöker.
3. **🟠 README İçerisindeki Geçersiz GitHub URL'leri ve Eksik Helm Adımı (Kritik #3):**
   - README kopyala-yapıştır komutları varsayımsal `raw.githubusercontent.../k8s-tersane/...` adresine yönlendirir. Lokal clone üzerinde `kubectl apply -f deploy/rbac.yaml` yapılması gerektiği açıkça belirtilmemiştir. Helm chart mevcut olduğu halde komutu yoktur.
4. **🟠 Backend Kapalıyken Frontend'in Sessiz Kalması (Kritik #4):**
   - Frontend başlatılıp backend başlatılmadığında ekranda hiçbir "Backend Sunucusuna Ulaşılamıyor" uyarısı çıkmaz. Kullanıcı WebGL sahnesinin neden boş kaldığını anlayamaz.
