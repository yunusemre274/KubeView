# 🚢 Tersane (K8s Shipyard)

> **Kubernetes Cluster'ınızı Gerçek Zamanlı Bir Liman ve Tersane Metaforu ile Görselleştirin.**  
> *Kubernetes'in soyut pod, node, service ve controller kavramlarını somut bir simülasyona dönüştüren canlı izleme platformu.*

[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18+-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-client--go-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📸 Ekran Görüntüleri & Demo

<!-- DEMO_PLACEHOLDER_START -->
```
 🚢 TERSANE INTERACTIVE DASHBOARD DEMO
 +-----------------------------------------------------------------------+
 | [ 🏗️ Control Plane / Liman Yönetimi ]                                  |
 |                                                                       |
 |   [ 🚢 Worker Node 1: Gemi Alpha ]     [ 🚢 Worker Node 2: Gemi Beta ] |
 |   +----------------------------+     +----------------------------+   |
 |   | 📦 Pod: Nginx (Palet A)    |     | 📦 Pod: Redis (Palet C)    |   |
 |   | 📦 Pod: API-v1 (Palet B)   |     | 📦 Pod: Worker (Palet D)   |   |
 |   +----------------------------+     +----------------------------+   |
 |                                                                       |
 |  📢 Liman Anonsu (Events): Pod "API-v1" başarıyla yüklendi (Running)  |
 +-----------------------------------------------------------------------+
```
> *(Gerçek 3D / İzometrik ekran görüntüsü veya GIF demosu buraya eklenecektir: `./assets/demo.gif`)*
<!-- DEMO_PLACEHOLDER_END -->

---

## 🎯 Neden Bu Proje?

Kubernetes güçlü, ölçeklenebilir ve modern bulut mimarilerinin omurgasını oluşturan bir teknolojidir. Ancak **`kubectl get pods`**, **`kubectl describe node`** veya standart web panellerinde görünen metin ağırlıklı veriler; Kubernetes eğitimi alan öğrenciler, yeni başlayan geliştiriciler ve teknik olmayan paydaşlar için oldukça **soyut** kalmaktadır.

**Tersane**, bu soyutluğu ortadan kaldırmak için tasarlanmıştır:
- **Somutlaştırma:** Pod'ların oluşturulması bir konteynırın gemiye yüklenmesi, Node arızası ise geminin limana çekilmesi gibi sezgisel görsellere dönüşür.
- **Eğitim Odaklı:** K8s mimarisini ve kaynak akışını tek bir bakışta görsel hafızaya kazır.
- **Gerçek Zamanlı İzleme:** Polling yapmadan, API Server'a doğrudan event-driven (informer/watch) olarak bağlanarak anlık durumu 3D/İzometrik animasyonlarla sunar.

---

## ✨ Özellikler

- 🚢 **Canlı Node ve Pod Takibi:** Cluster'daki tüm Node ve Pod durumlarının anlık tersane animasyonlarıyla izlenmesi.
- ⚡ **Event-Driven Mimari:** Polling yerine Kubernetes `client-go` Informer/Watch pattern ile sıfır gecikmeli WebSocket veri akışı.
- 📊 **Kaynak Tüketimi Görselleştirme:** CPU ve Bellek kullanım oranlarının `metrics-server` entegrasyonu ile gemi doluluk oranına yansıtılması.
- 🎬 **Dinamik Scaling ve Lifecycle Animasyonları:**
  - Yeni Pod oluşturulması ➔ Vinç ile kargo paleti yükleme animasyonu.
  - Pod silinmesi / çökmesi ➔ Kargo kutusunun kaybolması / uyarı ışıkları.
  - Node kapalı duruma geçmesi ➔ Geminin limandan ayrılması / arıza moduna geçmesi.
- 🛡️ **Güvenli ve Hafif:** Sadece salt-okunur (read-only) RBAC yetkileriyle çalışır; cluster state'ine asla müdahale etmez.
- 🌐 **Kolay Dağıtım:** Tek bir YAML manifesti veya Helm şablonu ile dakikalar içinde canlıya alma.

---

## ⚓ Metafor Eşleştirmesi

Kubernetes bileşenlerinin **Tersane** dünyasındaki karşılıkları:

| Kubernetes Kavramı | Tersane Metaforu | Açıklama |
| :--- | :--- | :--- |
| **Cluster** | 🏗️ **Tersanenin Tamamı** | Tüm operasyonun gerçekleştiği liman ve tesis alanı |
| **Control Plane / Master Node** | 🏢 **Tersane Yönetim Binası** | Tüm kararların alındığı ve komutların dağıtıldığı merkez |
| **API Server** | 🗼 **Kontrol Kulesi / Santral** | Tüm iletişimin geçtiği tek erişim ve doğrulama noktası |
| **etcd** | 📚 **Arşiv / Kayıt Odası** | Tersanedeki tüm varlıkların ve durumların tutulduğu ana defter |
| **Scheduler** | 📦 **Sevkiyat Planlayıcısı** | Hangi kargonun hangi gemiye yükleneceğine karar veren birim |
| **Controller Manager** | 👮 **Denetim Müfettişi** | Hedeflenen kargo sayısı ile mevcut durumu sürekli kıyaslayan birim |
| **Worker Node** | 🚢 **Gemi (Kargo Gemisi)** | Konteynırları taşıyan ve işlem gücü sunan ana birimler |
| **Kubelet** | 👨‍✈️ **Geminin Kaptanı / Pusula** | Gemi üzerindeki yükleri yöneten ve kuleye rapor veren yetkili |
| **Kube-proxy** | 📻 **Geminin Telsizcisi** | Gemiler ve ambarlar arası iletişim ağını düzenleyen görevli |
| **Container Runtime** | ⚙️ **Geminin Makine Dairesi** | Konteynırların fiilen çalışmasını sağlayan motor |
| **Pod** | 🧱 **Palet / Kargo Platformu** | Bir veya birden fazla kargo kutusunu bir arada tutan taşıyıcı |
| **Container** | 📦 **Kargo Kutusu** | Uygulamanın kendisini barındıran tekil birim |
| **Namespace** | 🚪 **Geminin Ambarları / Bölmeleri** | Mantıksal olarak ayrılmış çalışma ve depolama alanları |
| **Deployment** | 📜 **Sefer Siparişi** | Kaç adet paletin taşınacağını bildiren genel talimatname |
| **ReplicaSet** | 🧾 **Sipariş Fişi** | İstenen palet sayısının korunmasını garantileyen alt fiş |
| **Service** | 🎟️ **Liman Gişesi / Yönlendirme Tabelası** | Gelen trafiği doğru ambar ve paletlere yönlendiren kapı |
| **Ingress** | 🛂 **Ana Giriş / Gümrük Kapısı** | Dış dünyadan limana giren ana giriş ve yönlendirme noktası |
| **ConfigMap** | 📋 **Sevkiyat Föyü** | Uygulama ayarlarını içeren açık talimat kağıdı |
| **Secret** | 🔐 **Kilitli Kasa** | Şifreler ve hassas anahtarların saklandığı kasa |
| **PersistentVolume / PVC** | 🏭 **Kiralanmış Depo Alanı** | Kalıcı verilerin depolandığı fiziksel alan |
| **Labels / Selectors** | 🏷️ **Barkod / Etiketler** | Yükleri ve bölmeleri gruplamak için kullanılan tanımlayıcılar |
| **Liveness / Readiness Probe** | 🔍 **Gümrük Muayene Memuru** | Kargonun sağlam ve sefere hazır olup olmadığını kontrol eden birim |
| **HPA (Horizontal Pod Autoscaler)** | ⚡ **Otomatik Ekstra Kutu Yükleme** | Yoğunluğa göre otomatik palet ekleyen/çıkaran sistem |
| **Cluster / Node Autoscaler** | 🚢✨ **Otomatik Yeni Gemi Kiralama** | Kapasite yetmediğinde filoya otomatik yeni gemi ekleyen sistem |
| **DaemonSet** | 🧯 **Her Geminin Standart Ekipmanı** | Her gemide bulunması zorunlu olan Yangın Söndürücü/Ekipman |
| **StatefulSet** | 🔢 **Numaralı, Sabit Sıradaki Özel Gemiler** | Kimliği ve sırası değişmeyen özel taşıyıcılar |
| **Job / CronJob** | 🚤 **Tek Seferlik Görev Teknesi / Tarifeli Mekik** | Belirli bir işi tamamlayıp bitiren veya zamanlı seferler |
| **Events** | 📢 **Liman Anonsları** | Limanda gerçekleşen tüm önemli olayların canlı sesli/görsel yayını |

---

## 🏗️ Mimari

```
+-----------------------------------------------------------------------------------+
|                                KUBERNETES CLUSTER                                 |
|                                                                                   |
|  +------------------+       Watch / Informer        +--------------------------+  |
|  | K8s API Server   | <---------------------------> | Tersane Backend          |  |
|  +------------------+ (Node, Pod, Event, Deploy)    | (Go client-go)           |  |
|           ^                                         +--------------------------+  |
|           | Metrikler                                            |                |
|  +------------------+                                   WebSocket STREAM          |
|  | metrics-server   |                                            |                |
|  +------------------+                                            v                |
|                                                     +--------------------------+  |
|                                                     | Tersane Frontend         |  |
|                                                     | (React + R3F / 3D Scene) |  |
|                                                     +--------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Mimari Detaylar
1. **Kubernetes API Entegrasyonu:** Backend service, `client-go` kütüphanesinin **SharedInformerFactory** özelliğini kullanarak API Server üzerindeki değişiklikleri anlık olarak dinler (watch). Gelen event'ler bellekteki durum haritası (State Map) ile senkronize edilir.
2. **Metrik Toplama:** Opsiyonel olarak `metrics-server` API'sinden Node ve Pod bazlı CPU/Bellek tüketim oranları belirli aralıklarla çekilir.
3. **Canlı Akış (WebSocket):** K8s event'leri ve metrik güncellemeleri, JSON formatında WebSocket kanalı üzerinden bağlı frontend istemcilerine push edilir.
4. **Görselleştirme Katmanı:** React ve Three.js (React Three Fiber) tabanlı frontend istemcisi, WebSocket verilerini alarak 3D ortamda gemi hareketleri, vinç yüklemeleri ve durum renk değişimlerini render eder.

---

## 🛠️ Kullanılan Teknolojiler

- **Backend:** ![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white) `k8s.io/client-go` `gorilla/websocket`
- **Frontend:** ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Three.js](https://img.shields.io/badge/Three.js-black?style=flat-square&logo=three.js&logoColor=white) React Three Fiber, Lucide Icons, TailwindCSS
- **Orkestrasyon:** ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white) Minikube / Kind / K3s / Cloud K8s
- **İzleme & Metrik:** Metrics-Server / Prometheus

---

## 🚀 Kurulum ve Çalıştırma

### Ön Koşullar
- `kubectl` CLI aracı kurulu ve yapılandırılmış olmalı.
- Çalışan bir Kubernetes cluster'ı (Minikube, Kind, K3s veya bulut sağlayıcı k8s).
- Lokal geliştirme için: **Go 1.22+** ve **Node.js 18+**.

---

### 1. Kubernetes Üzerine Deploy Etme (Canlı Ortam)

#### Adım 1: RBAC İzinlerini Uygulayın
Tersane'nin cluster durumunu okuyabilmesi için gerekli read-only yetkilerini tanımlayın:

```bash
kubectl apply -f https://raw.githubusercontent.com/k8s-tersane/tersane/main/deploy/rbac.yaml
```

*Örnek `rbac.yaml` içeriği:*
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tersane-sa
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: tersane-reader
rules:
  - apiGroups: [""]
    resources: ["nodes", "pods", "services", "namespaces", "events"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["metrics.k8s.io"]
    resources: ["nodes", "pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tersane-reader-binding
subjects:
  - kind: ServiceAccount
    name: tersane-sa
    namespace: default
roleRef:
  kind: ClusterRole
  name: tersane-reader
  apiGroup: rbac.authorization.k8s.io
```

#### Adım 2: Deployment ve Service Manifestini Uygulayın

```bash
kubectl apply -f https://raw.githubusercontent.com/k8s-tersane/tersane/main/deploy/deployment.yaml
```

*Örnek `deployment.yaml` içeriği:*
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tersane
  namespace: default
  labels:
    app: tersane
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tersane
  template:
    metadata:
      labels:
        app: tersane
    spec:
      serviceAccountName: tersane-sa
      containers:
        - name: tersane
          image: ghcr.io/k8s-tersane/tersane:latest
          ports:
            - containerPort: 8000
          env:
            - name: PORT
              value: "8000"
            - name: WATCH_NAMESPACE
              value: "" # Tüm namespace'leri izlemek için boş bırakın
---
apiVersion: v1
kind: Service
metadata:
  name: tersane-service
  namespace: default
spec:
  type: NodePort
  ports:
    - port: 8000
      targetPort: 8000
      nodePort: 30800
  selector:
    app: tersane
```

#### Adım 3: Uygulamaya Erişin

- **Option A (Port Forwarding):**
  ```bash
  kubectl port-forward svc/tersane-service 8000:8000
  ```
  Tarayıcınızdan `http://localhost:8000` adresine gidin.

- **Option B (Minikube):**
  ```bash
  minikube service tersane-service --url
  ```

---

### 2. Lokal Geliştirme Ortamı Kurulumu

Projeye katkıda bulunmak veya lokalde geliştirmek için backend ve frontend'i ayrı ayrı çalıştırabilirsiniz:

#### Backend (Go)
```bash
# Repoyu klonlayın
git clone https://github.com/k8s-tersane/tersane.git
cd tersane/backend

# Kubeconfig dosyanızın varsayılan konumda (~/.kube/config) olduğundan emin olun
go run main.go
# Backend http://localhost:8000 adresinde dinlemeye başlayacaktır.
```

#### Frontend (React)
```bash
cd ../frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
# Frontend http://localhost:5173 adresinde çalışacaktır.
```

---

## ⚙️ Yapılandırma (Environment Variables)

Uygulama davranışını aşağıdaki çevre değişkenleri ile özelleştirebilirsiniz:

| Değişken Adı | Varsayılan | Açıklama |
| :--- | :--- | :--- |
| `PORT` | `8000` | Sunucunun çalışacağı HTTP / WebSocket portu |
| `WATCH_NAMESPACE` | `""` *(Tümü)* | İzlenecek özel namespace (Boş bırakılırsa tüm cluster izlenir) |
| `ENABLE_METRICS` | `true` | `metrics-server` entegrasyonunun aktiflik durumu |
| `METRICS_INTERVAL` | `5s` | Metrik verilerinin çekilme sıklığı |
| `KUBECONFIG` | `~/.kube/config` | Cluster dışı çalışırken kullanılacak Kubeconfig yolu |
| `LOG_LEVEL` | `info` | Uygulama log seviyesi (`debug`, `info`, `warn`, `error`) |

---

## 🗺️ Yol Haritası (Roadmap)

- [x] Node, Pod, Deployment ve Service nesnelerinin temel görselleştirmesi.
- [x] WebSocket tabanlı canlı durum güncellemeleri.
- [ ] **StatefulSet & DaemonSet:** Özel dizilimli gemi filoları ve standart ekipman animasyonları.
- [ ] **HPA (Autoscaler) Görselleştirmesi:** Kargo miktarının artışıyla dinamik palet ekleme efektleri.
- [ ] **Çoklu Cluster (Multi-Cluster) Desteği:** Aynı arayüzde birden fazla limanı / tersaneyi geçişli izleme.
- [ ] **Sesli Anons Entegrasyonu:** Kritik K8s Event'leri için opsiyonel liman telsiz anons ses efekti.
- [ ] **VR / AR Modu:** WebXR ile 3D tersanede sanal gerçeklik turu.

---

## 🤝 Katkıda Bulunma (Contributing)

Katkılarınız projeyi daha da harika hale getirmek için çok değerli!

1. Bu repoyu Fork edin (`git checkout -b feature/HarikaOzellik`).
2. Değişikliklerinizi commit edin (`git commit -m 'feat: Harika bir özellik eklendi'`).
3. Dalınıza Push edin (`git push origin feature/HarikaOzellik`).
4. Bir **Pull Request** açın.

Lütfen kod standartlarına uyduğunuzdan ve testleri çalıştırdığınızdan emin olun.

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakabilirsiniz.

---

## 🙏 Teşekkürler & İlham Alınan Projeler

Bu proje geliştirilirken Kubernetes ekosistemindeki yaratıcı görselleştirme araçlarından ilham alınmıştır:

- [Kube-Universe](https://github.com/ explicit/kube-universe) - Kubernetes cluster'larını 3D 3D uzay haritası olarak gösteren görselleştirici.
- [K3s Observatory](https://github.com/) - Hafif k8s izleme konseptleri.
- [KubeCraftAdmin](https://github.com/icabrera/kubecraftadmin) - Minecraft dünyasında Kubernetes pod yönetimi fikri.

---

<p center="align">
  <i>Tersane ile Kubernetes öğrenmeyi ve yönetmeyi somut, eğlenceli bir deneyime dönüştürün! 🚢✨</i>
</p>
