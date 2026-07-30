# ARCHITECTURE.md — Nihai Üretim Mimarisi (v1.0.0 - Faz 8)

> 🟢 **PROJE TAMAMLANDI:** Bu belge, Tersane projesinin nihai üretim seviyesi mimarisini tanımlar.

---

## 🏛️ Üretim Mimarisi Bileşenleri

Tersane v1.0.0 tam paketlenmiş bir Kubernetes uygulamasıdır:
1. **Kubernetes RBAC Manifestleri:** Read-only `ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` tanımları (`deploy/rbac.yaml`).
2. **Go Backend Core:** `client-go` Informer'ları (Nodes, Pods, Deployments, Events) ve `metrics.k8s.io` toplayıcısını içeren yüksek performanslı backend servisi.
3. **WebSocket Hub:** `/ws` endpoint'i üzerinden canlı K8s durumlarını 60 FPS istemcilere yayınlayan WebSocket sunucusu.
4. **React Three Fiber 3D Frontend:** Production `dist` bundle haline getirilmiş 3D tersane görselleştiricisi.
5. **Kapsayıcı Paketleme & Helm:** Multi-stage `Dockerfile` ve `charts/tersane` Helm Chart paketi.

---

## 🔄 Nihai Veri Akışı

```
+------------------------+      Watch / Informer        +---------------------------+
| K8s API Server         | <--------------------------> | Go Backend (Tersane)      |
| (Nodes, Pods, Deploy,  |                              |  - Watcher Informers      |
|  Events)               |                              |  - Metrics Collector      |
+------------------------+                              +---------------------------+
           ^                                                         |
           | Metrics API                                             v (WS Stream)
+------------------------+                              +---------------------------+
| metrics-server         |                              | React Three.js 3D UI      |
+------------------------+                              +---------------------------+
```

---

## 📁 Nihai Proje Klasör Yapısı (v1.0.0)

```
.
├── Dockerfile                   # Multi-stage production Dockerfile
├── README.md                    # Proje tanıtımı ve kurulum rehberi
├── LICENSE                      # MIT Lisansı
├── AGENTS/                      # 11 Uzman Yapay Zeka Ajanının Tanım ve Kuralları
├── docs/                        # Proje Yaşam Döngüsü Dokümanları (ADRs, Roadmap, Changelog)
├── deploy/                      # Üretim K8s Manifestleri (RBAC, Deployment, Service)
├── charts/                      # Production Helm Chart Paketi
│   └── tersane/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── backend/                     # Go Backend Kaynak Kodları
└── frontend/                    # React + Three.js Frontend Kaynak Kodları
```
