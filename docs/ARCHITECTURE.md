# ARCHITECTURE.md — Aktif Mimarisi (Faz 6)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 6** mimarisini tanımlar. Gelecek fazların spekülatif mimarisi buraya yazılmaz. Kod yapısı değiştikçe bu dosya `architecture-agent` veya değişiklik yapan ilgili agent tarafından güncellenir.

---

## 🏛️ Faz 6 Mimari Bileşenleri

Faz 6 kapsamında sistem Deployment & Scaling görselleştirmeleri ile genişletilmiştir:
1. **Kubernetes RBAC Manifestleri:** Read-only `ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` tanımları (`deploy/rbac.yaml` - `apps/deployments` read-only yetkileri dahil).
2. **Go Informer Watcher & Metrics Collector:** `client-go` Informer'ları (Nodes, Pods, Deployments) ile küme durumunu ve `metrics.k8s.io` API'si ile kaynak tüketimlerini toplayan backend servisi.
3. **WebSocket Hub & Server:** `/ws` endpoint'i üzerinden K8s olaylarını ve Sefer Siparişi (Deployment) güncellemelerini yayınlayan sunucu.
4. **React + Three.js 3D Visualizer:** 3D Gemi ve kargo render'ına ek olarak ekranın sol üstünde "📜 Sefer Siparişleri (Deployments)" listesini render eden frontend uygulaması (`/frontend`).

---

## 🔄 Veri Akışı (Faz 6)

```
+------------------------+      Watch / Informer        +---------------------------+
| K8s API Server         | <--------------------------> | Go Backend                |
| (Nodes, Pods, Deploy)  |                              |  - Watcher Informers      |
+------------------------+                              |  - Metrics Collector      |
                                                        +---------------------------+
                                                                      |
                                                                      v (WS Messages)
                                                        +---------------------------+
                                                        | React Three.js 3D Client  |
                                                        |  - DeploymentPanel.jsx    |
                                                        |  - ShipyardScene.jsx      |
                                                        +---------------------------+
```

---

## 💻 Kullanılan Teknolojiler ve Tercih Gerekçeleri

| Teknoloji | Sürüm | Seçim Gerekçesi |
| :--- | :--- | :--- |
| **Go** | `1.22+` | Yüksek başarım ve düşük bellek tüketimi. |
| **client-go & metrics**| `v0.30+` | Resmi K8s API, Informers ve Metrics-server istemcisi. |
| **gorilla/websocket** | `v1.5.1` | Performanslı WebSocket iletişimi. |
| **React & R3F** | `18.3+ / 8.16+` | WebGL 3D render ve reaktif UI bileşenleri. |

---

## 📁 Proje Dosya ve Klasör Yapısı (Faz 6)

```
.
├── deploy/                      # Kubernetes manifestleri
├── backend/                     # Go Backend kaynak kodları
│   └── pkg/
│       ├── k8s/
│       │   └── watcher.go       # Informers (Nodes, Pods, Deployments)
│       └── websocket/
│           └── hub.go           # WebSocket Hub
└── frontend/                    # React + Three.js Frontend
    └── src/
        ├── components/
        │   ├── DeploymentPanel.jsx # Sefer Siparişleri (Deployments) paneli
        │   ├── ShipyardScene.jsx # 3D Render
        │   ├── EventStream.jsx   # Canlı Liman Anonsları
        │   └── Navbar.jsx        # Üst bar
```
