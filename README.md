# 🚢 Tersane (K8s Shipyard 3D)

> **Kubernetes Cluster'ınızı Gerçek Zamanlı Bir Liman ve Tersane Metaforu ile Görselleştirin.**  
> *Kubernetes'in soyut pod, node, service ve controller kavramlarını somut, etkileşimli ve 3D bir liman simülasyonuna dönüştüren canlı kontrol platformu.*

[![Release](https://img.shields.io/badge/Release-v1.0.0--Stable-emerald?style=for-the-badge&logo=github)](https://github.com/k8s-tersane/tersane)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18+-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-client--go-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📸 3D Liman Arayüzü & Görsel Mimari

```
+-----------------------------------------------------------------------------------------------+
| 🏢 CONTROL PLANE (Tersane Yönetim Binası)          [ 🌐 Cluster Context: minikube ]             |
|   ├── 🗼 API Server (Kontrol Kulesi)              [ 🔒 Salt İzleme Modu: PASİF ]            |
|   ├── 📚 etcd (Arşiv Odası)                        [ 📸 PNG Ekran Görüntüsü İndir ]           |
|   └── 📜 Live Deployments Overlay                                                             |
|                                                                                               |
| 🚢 WORKER NODES (Kargo Gemileri Filosu)                                                       |
|   ├── 🚢 node-alpha  ➔ 🧱 Paletler: [ 📦 web-frontend ] [ 📦 api-backend ]                    |
|   └── 🚢 node-beta   ➔ 🧱 Paletler: [ 📦 redis-cache ]  [ 📦 worker-job ]                     |
|                                                                                               |
| 🏗️ İNŞAAT VE YARDIMCI ALTYAPI TESİSLERİ                                                      |
|   ├── 🤖 Kube-Scheduler Vinci    ➔ Pod yükleme ve düğüm yerleşim vinci (LeastRequested)       |
|   ├── 🚨 Ingress Deniz Feneri     ➔ Dış trafik gümrük kapısı (tersane.k8s.local)               |
|   ├── 🛡️ NetworkPolicy Bariyeri  ➔ Kırmızı lazer güvenlik çiti (Default-Deny)                  |
|   ├── 📋 ConfigMap Sevkiyat Föyü ➔ Tahta duyuru panosu (ENV, nginx.conf)                       |
|   ├── 🔐 Secret Kilitli Çeli Kasa➔ Ağır çelik kasa (Şifreli veriler masked-only)               |
|   ├── 🏭 PVC/PV Depo Ambarı      ➔ Karadaki kiralanmış kalıcı depolama alanları               |
|   ├── ⚡ HPA Mobil Vinci         ➔ Otomatik kargo yükleme vinci                              |
|   └── 🚤 Job Görev Şalupası      ➔ Tek seferlik tarifeli görev teknesi                        |
|                                                                                               |
| 📢 LİMAN TELSİZ ANONS GÜNLÜĞÜ (Events):                                                      |
|   [12:54:10] 🟢 Pod "web-frontend-deploy-74b89" node-alpha gemisine yüklendi (Running)        |
+-----------------------------------------------------------------------------------------------+
```

---

## 🎯 Neden Tersane?

Kubernetes güçlü, esnek ve modern bulut mimarilerinin omurgasını oluşturur. Ancak **`kubectl get pods`**, **`kubectl describe node`** veya metin ağırlıklı standart web panellerinde görünen karmaşık tablolar; Kubernetes öğrenen öğrenciler, geliştiriciler ve teknik olmayan paydaşlar için oldukça **soyut** kalmaktadır.

**Tersane**, bu soyutluğu ortadan kaldırmak için tasarlanmıştır:
- 💡 **Somut Görsel Hafıza:** Pod'ların oluşturulması gemiye vinçle kargo yüklenmesi, Node arızası geminin su alması/karaya çekilmesi, Ingress ise liman girişindeki deniz feneri olarak somutlaşır.
- 🎓 **Eğitim ve Sunum Odaklı:** K8s mimarisini, controller ilişkilerini ve veri akışını tek bir bakışta anlaşılır kılar.
- ⚡ **Sıfır Gecikmeli Canlı Yayın:** Polling (periyodik sorgulama) yapmadan, Kubernetes `client-go` Informer/Watch mimarisi ile API Server'a doğrudan bağlanarak anlık durumu WebSocket üzerinden 3D animasyonlarla sunar.

---

## ✨ Ana Özellikler

- 🚢 **Canlı Node ve Pod Görselleştirmesi:** Cluster'daki tüm Worker Node'ların kargo gemisi, Pod'ların ise gemi üzerindeki taşıyıcı paletler olarak 3D simülasyonu.
- ⚡ **Event-Driven WebSocket Akışı:** `client-go` Informer & Watch pattern ile sıfır gecikmeli canlı durum yayını. Pod silme/scale durumlarında tombstone unwrap & multi-node purge garantisi.
- 📜 **Canlı Container Log Akışı (PodLogViewer):** Sahnede seçilen herhangi bir Pod'un konteynır loglarını WebSocket üzerinden gerçek zamanlı izleme (`/api/v1/pods/logs/stream`).
- 📊 **Canlı Metrikler ve Zaman Serisi Trend Grafikleri:** `metrics-server` entegrasyonu ile anlık CPU/RAM kullanımı, mini sparkline'lar ve 1 saatlik ring buffer trend grafik dökümü (`DetailedMetricTrendModal`).
- 🏢 **%100 Zengin 3D Obje Müfettişi (InfoCard):** Sahnede seçilebilen 15 farklı nesne tipinin (`Node`, `Pod`, `Deployment`, `StatefulSet`, `DaemonSet`, `Job`, `ConfigMap`, `Secret`, `PVC`, `PV`, `Ingress`, `NetworkPolicy`, `Kubelet`, `Kube-proxy`, `RBAC`) tamamı için zengin detay, zaman damgası ve bağımlılık kartları.
- 🛡️ **RBAC İlişkisel İnceleme & Aşırı Yetki Uyarıları:** ServiceAccount kimlik kartları, Role/ClusterRole izin matrisleri (`resources`, `verbs`) ve `cluster-admin` bağlı hesaplar için otomatik güvenlik ikazı.
- 🔐 **Şifreli Veri Koruma (Masked Secret Policy):** Secret nesnelerinin içerik değerleri asla istemciye gönderilmez; sadece key isimleri ve maskeli değerler (`••••••••`) gösterilir.
- 🔄 **Otomatik Kubeconfig Port Auto-Heal:** minikube / local k8s yeniden başlatmalarında değişen API Server port adreslerini 3 denemede diskten otomatik algılama ve kesintisiz canlı bağlanma.
- 🔒 **Güvenli Mutasyon İşlemleri & Salt İzleme Modu:** UI üzerinden onay modalı doğrulamalı Pod Restart/Delete ve Deployment Scale işlemleri, Salt İzleme (Read-Only) modu ve kilitli namespace (`kube-system`) koruması.
- 📸 **PNG Ekran Görüntüsü Dışa Aktarımı & Multi-Cluster Context Seçici:** 3D sahneyi yüksek çözünürlüklü PNG görseli olarak indirme ve minikube / docker-desktop / prod-cluster bağlamları arasında geçiş yapma.

---

## ⚓ Metafor Eşleştirmesi

Kubernetes kavramlarının **Tersane** dünyasındaki sezgisel karşılıkları:

| Kubernetes Kavramı | Tersane Metaforu | Açıklama |
| :--- | :--- | :--- |
| **Cluster** | 🏗️ **Tersanenin Tamamı** | Tüm operasyonun gerçekleştiği liman ve deniz tesisi alanı |
| **Control Plane / Master Node** | 🏢 **Tersane Yönetim Binası** | Tüm kararların alındığı ve komutların dağıtıldığı merkez bina |
| **API Server** | 🗼 **Kontrol Kulesi / Santral** | Tüm iletişimin geçtiği tek erişim ve doğrulama noktası |
| **etcd** | 📚 **Arşiv Odası / Ana Defter** | Tersanedeki tüm varlıkların ve durumların tutulduğu ana defter |
| **Kube-Scheduler** | 🤖 **Sevkiyat Planlayıcı Vinci** | Hangi kargonun hangi gemiye yükleneceğine karar veren vinç |
| **Controller Manager** | 👮 **Denetim Müfettişi** | Hedeflenen kargo sayısı ile mevcut durumu kıyaslayan birim |
| **Worker Node** | 🚢 **Kargo Gemisi** | Konteynırları taşıyan ve işlem gücü sunan ana gemiler |
| **Kubelet** | 📡 **Geminin Kaptanı / Dümenci** | Gemi üzerindeki yükleri yöneten ve kuleye rapor veren agent |
| **Kube-proxy** | 📻 **Geminin Ağ İstasyonu** | Gemiler ve ambarlar arası iletişim ağını düzenleyen istasyon |
| **Container Runtime** | ⚙️ **Geminin Makine Dairesi** | Konteynırların fiilen çalışmasını sağlayan motor |
| **Pod** | 🧱 **Palet / Kargo Platformu** | Bir veya birden fazla kargo kutusunu bir arada tutan taşıyıcı |
| **Container** | 📦 **Kargo Kutusu** | Uygulamanın kendisini barındıran tekil birim |
| **Namespace** | 🚪 **Geminin Ambarları / Bölmeleri** | Mantıksal olarak ayrılmış çalışma ve depolama alanları |
| **Deployment** | 📜 **Sefer Siparişi** | Kaç adet paletin taşınacağını bildiren genel talimatname |
| **ReplicaSet** | 🧾 **Sipariş Fişi** | İstenen palet sayısının korunmasını garantileyen alt fiş |
| **Service** | 🎟️ **Liman Gişesi / Yönlendirme** | Gelen trafiği doğru ambar ve paletlere yönlendiren kapı |
| **Ingress** | 🚨 **Ana Giriş / Deniz Feneri** | Dış dünyadan limana giren ana giriş ve fener yönlendirme noktası |
| **NetworkPolicy** | 🛡️ **Güvenlik Çiti / Lazer Bariyer** | Ambarlar ve gemiler arasına çekilen kırmızı lazer barierler |
| **ConfigMap** | 📋 **Sevkiyat Föyü** | Uygulama ayarlarını içeren açık tahta duyuru panosu |
| **Secret** | 🔐 **Kilitli Çelik Kasa** | Şifreler ve anahtarların saklandığı ağır çelik kasa |
| **PersistentVolume / PVC** | 🏭 **Kiralanmış Depo Ambarı** | Kalıcı verilerin depolandığı karadaki ambar yapıları |
| **HPA (Autoscaler)** | ⚡ **Otomatik Ekstra Mobil Vinç** | Kargo yoğunluğuna göre otomatik palet ekleyen raylı vinç |
| **DaemonSet** | 🧯 **Gemi Standart Ekipmanı** | Her gemi direğinde bulunması zorunlu olan standart ekipman |
| **StatefulSet** | 🔢 **Numaralı Sabit Gemiler** | Kimliği ve sırası değişmeyen özel taşıyıcı gemiler |
| **Job / CronJob** | 🚤 **Tek Seferlik Görev Teknesi** | Belirli bir işi tamamlayıp bitiren görev şalupası |
| **ServiceAccount / Role** | 🪪 **Kimlik Kartı & Yetki Rozeti** | Personel kimlik kartları ve erişim yetkileri matrisi |
| **Events** | 📢 **Liman Telsiz Anonsları** | Limanda gerçekleşen tüm önemli olayların canlı yayın kaydı |

---

## 🏗️ Mimarisi

```
+---------------------------------------------------------------------------------------------------+
|                                        KUBERNETES CLUSTER                                         |
|                                                                                                   |
|  +-----------------------+     Watch / Informers Stream      +---------------------------------+  |
|  | K8s API Server        | <-------------------------------> | Tersane Backend (Go)            |  |
|  | (v1.22+)              |  (Pods, Nodes, Deploy, RS, SA)    | ├── client-go Watcher & Informer|  |
|  +-----------------------+                                   | ├── Metrics Collector           |  |
|              ^                                               | └── Dynamic Kubeconfig AutoHeal |  |
|              | Metrikler                                     +---------------------------------+  |
|  +-----------------------+                                                   |                    |
|  | metrics-server        |                                            WebSocket STREAM            |
|  +-----------------------+                                                   |                    |
|                                                                              v                    |
|                                                              +---------------------------------+  |
|                                                              | Tersane Frontend (React 18)     |  |
|                                                              | ├── Three.js / React Three Fiber|  |
|                                                              | ├── 3D Shipyard Scene Engine    |  |
|                                                              | └── InfoCard & Master Dashboard |  |
|                                                              +---------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 🛠️ Kullanılan Teknolojiler

- **Backend Engine:** ![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white) `k8s.io/client-go`, `gorilla/websocket`, `k8s.io/metrics`
- **Frontend 3D UI:** ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Three.js](https://img.shields.io/badge/Three.js-black?style=flat-square&logo=three.js&logoColor=white) React Three Fiber (R3F), Drei, Lucide Icons, TailwindCSS
- **Orkestrasyon & Deploy:** ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white) Minikube / Kind / K3s / Cloud K8s, Docker, Helm v3

---

## 🚀 Kurulum ve Çalıştırma

### Ön Koşullar
- `kubectl` CLI aracı kurulu ve aktif bir Kubernetes kümesine bağlı olmalı (`kubectl get nodes`).
- Çalışan bir Kubernetes ortamı (Minikube, Kind, K3s veya bulut k8s).
- Lokal geliştirme için: **Go 1.22+** ve **Node.js 18+**.

---

### Seçenek A: Tek Komutla Kolay Kurulum (Lokal Geliştirme)

Tersane'yi bilgisayarınızda geliştirme modunda çalıştırmak için:

```bash
git clone https://github.com/k8s-tersane/tersane.git
cd tersane

# Backend (Go) ve Frontend (React Vite) sunucularını paralel başlatır:
make dev
# veya alternatif olarak:
./start.sh
```

- **Backend (Go API & WebSocket):** `http://localhost:8000`
- **Frontend (React 3D UI Dev Server):** `http://localhost:5173`

---

### Seçenek B: Production Derlemesi (Single Binary)

Frontend statik çıktılarını Go backend sunucusu ile tek bir çalıştırılabilir dosyada birleştirmek için:

```bash
cd tersane

# Statik frontend paketini derler ve Go binary üretir:
make build

# Uygulamayı başlatın:
./bin/tersane-backend
```

Tarayıcınızdan **`http://localhost:8000`** adresine gittiğinizde backend sunucusu 3D React SPA uygulamasını doğrudan sunacaktır.

---

### Seçenek C: Kubernetes / Minikube Üzerine Deploy Etme (YAML Manifest)

Tersane'yi canlı kümeniz üzerinde salt-okunur Pod olarak çalıştırmak için:

```bash
git clone https://github.com/k8s-tersane/tersane.git
cd tersane

# 1. RBAC Read-Only İzinlerini Uygulayın:
kubectl apply -f deploy/rbac.yaml

# 2. Deployment ve Service Manifestini Uygulayın:
kubectl apply -f deploy/deployment.yaml

# 3. Port Forwarding ile Erişin:
kubectl port-forward svc/tersane-service 8000:8000
```
Tarayıcınızda **`http://localhost:8000`** adresini açın.

---

### Seçenek D: Helm Chart ile Kurulum

Helm paket yöneticisi ile tek komutla dağıtmak için:

```bash
cd tersane

# Helm Chart kurulumu
helm install tersane ./charts/tersane

# Port Forwarding ile erişim
kubectl port-forward svc/tersane 8000:8000
```

---

### Seçenek E: Docker Imajı Derleme

```bash
make docker-build
# Üretilen imaj: tersane:latest
```

---

## 🎮 İntuitif Sahne Kontrolleri

| Eylem | Kontrol | Açıklama |
| :--- | :--- | :--- |
| **Kamera Döndürme (Orbit)** | `Sol Tık + Sürükle` | 3D Liman sahnesini 360 derece etrafında döndürür |
| **Kamera Kaydırma (Pan)** | `Sağ Tık + Sürükle` | Kamerayı eksenlerde yatay/dikey kaydırır |
| **Yakınlaşma / Uzaklaşma** | `Fare Tekerleği (Scroll)` | Gemi ve palet detaylarına yakınlaşır |
| **Obje İnceleme** | `Sol Tık (Objeye)` | Seçilen nesneye odaklanır ve sağ müfettiş çekmecesini açar |
| **Odak Sıfırlama** | `X Butonu` veya `Boşluğa Tık` | Kamerayı varsayılan genel liman açısına döndürür |

---

## ⚙️ Yapılandırma (Environment Variables)

Uygulama davranışını aşağıdaki çevre değişkenleri ile özelleştirebilirsiniz:

| Değişken Adı | Varsayılan Değer | Açıklama |
| :--- | :--- | :--- |
| `PORT` | `8000` | Sunucunun çalışacağı HTTP / WebSocket portu |
| `WATCH_NAMESPACE` | `""` *(Tüm Cluster)* | İzlenecek özel namespace (Boş bırakılırsa tüm cluster izlenir) |
| `KUBECONFIG` | `~/.kube/config` | Küme dışı çalışırken kullanılacak Kubeconfig dosya yolu |
| `STATIC_DIR` | `./public` | Production statik frontend derleme dizin yolu |

---

## 🗺️ Yol Haritası (Roadmap)

### 🟢 v1.0.0 (Kararlı Sürüm — Tamamlandı)
- [x] Node, Pod, Deployment, Service, StatefulSet, DaemonSet, Job, CronJob 3D liman görselleştirmesi.
- [x] WebSocket tabanlı sıfır gecikmeli canlı durum akışı ve tombstone purge garantisi.
- [x] Ingress Deniz Feneri, NetworkPolicy Kırmızı Lazer Bariyerleri ve HPA Mobil Vinçler.
- [x] ConfigMap Sevkiyat Föyü, Secret Kilitli Kasa (Masked-Only Policy) ve PVC/PV Depo Ambarları.
- [x] Canlı Pod Log akış yayınlayıcısı (`PodLogViewer`) ve 1 saatlik metrik trend grafikleri.
- [x] ServiceAccount kimlik kartları, RBAC izin matrisi ve `cluster-admin` aşırı yetki ikazları.
- [x] Salt İzleme Modu (Read-Only), kilitli namespace koruması ve onay modalı doğrulaması.
- [x] Dinamik Kubeconfig port sapması otomatik algılama ve yeniden bağlanma (Auto-Heal).

### 🔵 v1.1.0 (Planlanan Gelecek Sürüm)
- [ ] **Container Exec / Terminal Erişimi:** Güvenli opsiyonel in-browser container shell sekmesi.
- [ ] **Sesli Telsiz Anons Efektleri:** Kritik K8s Event'leri için opsiyonel liman anons ses efektleri.
- [ ] **Gelişmiş Multi-Cluster Dashboard:** Birden fazla uzak limanı eşzamanlı izleme paneli.

---

## 🤝 Katkıda Bulunma (Contributing)

Katkılarınız projeyi daha da harika hale getirmek için çok değerli!

1. Bu repoyu Fork edin (`git checkout -b feature/HarikaOzellik`).
2. Değişikliklerinizi commit edin (`git commit -m 'feat: Harika bir özellik eklendi'`).
3. Dalınıza Push edin (`git push origin feature/HarikaOzellik`).
4. Bir **Pull Request** açın.

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakabilirsiniz.
