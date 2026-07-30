# ARCHITECTURE.md — Aktif Mimarisi (Faz 7)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 7** mimarisini tanımlar. Gelecek fazların spekülatif mimarisi buraya yazılmaz. Kod yapısı değiştikçe bu dosya `architecture-agent` veya değişiklik yapan ilgili agent tarafından güncellenir.

---

## 🏛️ Faz 7 Mimari Bileşenleri

Faz 7 kapsamında sistem çoklu namespace filtresi ve canlı K8s Event anons akışı ile genişletilmiştir:
1. **Kubernetes RBAC Manifestleri:** Read-only `ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` tanımları (`deploy/rbac.yaml` - `events` read-only yetkisi dahil).
2. **Go Informer Watcher & Metrics Collector:** `client-go` Informer'ları (Nodes, Pods, Deployments, Events) ile küme durumunu dinleyen ve `metrics.k8s.io` API'sinden metrik çeken backend servisi.
3. **WebSocket Hub & Server:** `/ws` endpoint'i üzerinden K8s olaylarını, metrik güncellemelerini ve liman anonslarını (Events) yayınlayan sunucu.
4. **React + Three.js 3D Visualizer:** 3D Sahne, Deployment paneli, canlı Liman Anonsları (`EventStream.jsx`) ve Navbar üzerinde Ambar (Namespace) filtre seçicisi içeren 3D istemci arayüzü (`/frontend`).

---

## 🔄 Veri Akışı (Faz 7)

```
+------------------------+      Watch / Informer        +---------------------------+
| K8s API Server         | <--------------------------> | Go Backend                |
| (Nodes, Pods, Deploy,  |                              |  - Watcher Informers      |
|  Events)               |                              |  - Metrics Collector      |
+------------------------+                              +---------------------------+
                                                                      |
                                                                      v (WS Messages)
                                                        +---------------------------+
                                                        | React Three.js 3D Client  |
                                                        |  - Namespace Selector     |
                                                        |  - EventStream Ticker     |
                                                        |  - 3D Shipyard Scene      |
                                                        +---------------------------+
```

---

## 💻 Kullanılan Teknolojiler ve Tercih Gerekçeleri

| Teknoloji | Sürüm | Seçim Gerekçesi |
| :--- | :--- | :--- |
| **Go** | `1.22+` | Yüksek başarım ve düşük bellek tüketimi. |
| **client-go & metrics**| `v0.30+` | Resmi K8s API, Informers ve Metrics-server istemcisi. |
| **gorilla/websocket** | `v1.5.1` | Performanslı WebSocket iletişimi. |
| **React & R3F** | `18.3+ / 8.16+` | WebGL 3D render ve dinamik filtreleme UI. |

---

## 📁 Proje Dosya ve Klasör Yapısı (Faz 7)

```
.
├── deploy/                      # Kubernetes manifestleri
├── backend/                     # Go Backend kaynak kodları
│   └── pkg/
│       ├── k8s/
│       │   └── watcher.go       # Informers (Nodes, Pods, Deployments, Events)
│       └── websocket/
│           └── hub.go           # WebSocket Hub
└── frontend/                    # React + Three.js Frontend
    └── src/
        ├── components/
        │   ├── Navbar.jsx        # Ambar (Namespace) seçici dropdown
        │   ├── EventStream.jsx   # Liman Anonsları (Events) canlı bant
        │   ├── DeploymentPanel.jsx # Sefer Siparişleri
        │   └── ShipyardScene.jsx # 3D Render
```
