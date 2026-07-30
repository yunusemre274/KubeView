# ARCHITECTURE.md — Aktif Mimarisi (Faz 5)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 5** mimarisini tanımlar. Gelecek fazların spekülatif mimarisi buraya yazılmaz. Kod yapısı değiştikçe bu dosya `architecture-agent` veya değişiklik yapan ilgili agent tarafından güncellenir.

---

## 🏛️ Faz 5 Mimari Bileşenleri

Faz 5 kapsamında sistem kaynak tüketimi görselleştirmesi ile genişletilmiştir:
1. **Kubernetes RBAC Manifestleri:** Read-only `ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` tanımları (`deploy/rbac.yaml` - `metrics.k8s.io` read-only yetkisi dahil).
2. **Go Informer Watcher & Metrics Collector:** `client-go` Informer'ları ile küme durumunu ve `metrics.k8s.io` API'si ile Node/Pod CPU ve RAM kullanım metriklerini toplayan backend servisi (`backend/pkg/metrics/collector.go`).
3. **WebSocket Hub & Server:** `/ws` endpoint'i üzerinden metrik güncelleme paketlerini (`METRICS_UPDATE`) istemcilere yayınlayan sunucu.
4. **React + Three.js 3D Visualizer:** 3D Gemi (Node) üzerindeki metrik gösterge çubuklarını (CPU/RAM bars) ve tıklanan kargo kutusunda açılan anlık tüketim kartını render eden 3D istemci (`/frontend`).

---

## 🔄 Veri Akışı (Faz 5)

```
+------------------------+      Watch / Informer        +---------------------------+
| K8s API Server         | <--------------------------> | Go Backend                |
| (Nodes, Pods, Events)  |                              |  - Watcher Informers      |
+------------------------+                              |  - Metrics Collector      |
           ^                                            +---------------------------+
           | Metrics API (metrics.k8s.io)                             |
+------------------------+                                            v
| metrics-server         | <------------------------------------------+
+------------------------+                                            |
                                                                      v (WS METRICS_UPDATE)
                                                        +---------------------------+
                                                        | React Three.js 3D Client  |
                                                        |  - Node CPU/RAM Bars      |
                                                        |  - Interactive Pod Card   |
                                                        +---------------------------+
```

---

## 💻 Kullanılan Teknolojiler ve Tercih Gerekçeleri

| Teknoloji | Sürüm | Seçim Gerekçesi |
| :--- | :--- | :--- |
| **Go** | `1.22+` | Yüksek başarım ve düşük bellek tüketimi. |
| **client-go & metrics**| `v0.30+` | Resmi K8s API ve Metrics-server istemcisi. |
| **gorilla/websocket** | `v1.5.1` | Performanslı WebSocket iletişimi. |
| **React & R3F** | `18.3+ / 8.16+` | WebGL 3D render ve interaktif modal UI. |

---

## 📁 Proje Dosya ve Klasör Yapısı (Faz 5)

```
.
├── deploy/                      # Kubernetes manifestleri
├── backend/                     # Go Backend kaynak kodları
│   └── pkg/
│       ├── api/
│       │   └── schema.go        # ResourceMetrics & WSMessage
│       ├── k8s/
│       │   └── watcher.go       # Informer & Cache
│       ├── metrics/
│       │   └── collector.go     # metrics.k8s.io CPU/RAM toplayıcı
│       └── websocket/
│           └── hub.go           # WebSocket Hub & Broadcast
└── frontend/                    # React + Three.js Frontend
    └── src/
        ├── components/
        │   └── ShipyardScene.jsx # 3D Node Metrik Çubukları & Pod Detay Modalı
```
