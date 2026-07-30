# ARCHITECTURE.md — Aktif Mimarisi (Faz 4)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 4** mimarisini tanımlar. Gelecek fazların spekülatif mimarisi buraya yazılmaz. Kod yapısı değiştikçe bu dosya `architecture-agent` veya değişiklik yapan ilgili agent tarafından güncellenir.

---

## 🏛️ Faz 4 Mimari Bileşenleri

Faz 4 kapsamında sistem uçtan uca canlı akışla birleştirilmiştir:
1. **Kubernetes RBAC Manifestleri:** Read-only `ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` tanımları (`deploy/rbac.yaml`).
2. **Go Informer Watcher:** `client-go` Informer'ları ile küme olaylarını dinleyen ve local cache tutan backend modülü (`backend/pkg/k8s/watcher.go`).
3. **WebSocket Hub & Server:** `/ws` endpoint'i üzerinden WebSocket akışı sağlayan HTTP sunucusu (`backend/pkg/websocket/hub.go`).
4. **React + Three.js Canlı 3D Visualizer:** WebSocket istemci hook'u (`useShipyardWebSocket.js`) ile canlı verileri alan, Three.js 3D gemilerine/kargo paletlerine anlık yansıtan ve canlı liman anonsları bandını (`EventStream.jsx`) render eden frontend uygulaması (`/frontend`).

---

## 🔄 Veri Akışı (Faz 4)

```
+------------------------+      Watch / Informer        +---------------------------+
| K8s API Server         | <--------------------------> | Go Backend (client-go)    |
| (Nodes, Pods, Events)  |                              |  - Local State Cache      |
+------------------------+                              +---------------------------+
                                                                      |
                                                                      v
                                                        +---------------------------+
                                                        | WebSocket Hub (/ws)       |
                                                        +---------------------------+
                                                                      |
                                                                      v (Live WS Delta Events)
                                                        +---------------------------+
                                                        | React Three.js 3D Client  |
                                                        |  - useShipyardWebSocket   |
                                                        |  - Dynamic 3D Render      |
                                                        |  - EventStream Ticker     |
                                                        +---------------------------+
```

---

## 💻 Kullanılan Teknolojiler ve Tercih Gerekçeleri

| Teknoloji | Sürüm | Seçim Gerekçesi |
| :--- | :--- | :--- |
| **Go** | `1.22+` | Düşük kaynak kullanımı, yüksek performans. |
| **client-go** | `v0.30+` | API Server ile resmi ve kararlı iletişim. |
| **gorilla/websocket** | `v1.5.1` | Yüksek performanslı WebSocket sunucusu. |
| **React & R3F** | `18.3+ / 8.16+` | WebGL tabanlı 60 FPS 3D render ve reaktif state yönetimi. |

---

## 📁 Proje Dosya ve Klasör Yapısı (Faz 4)

```
.
├── AGENTS/                      # Ajan tanım ve kural dosyaları
├── docs/                        # Proje dokümantasyonu
├── deploy/                      # Kubernetes manifestleri
│   └── rbac.yaml                # ServiceAccount, ClusterRole ve Binding
├── backend/                     # Go Backend kaynak kodları
└── frontend/                    # React + Three.js Frontend kaynak kodları
    ├── src/
        ├── hooks/
        │   └── useShipyardWebSocket.js # Reconnect destekli canlı WebSocket hook'u
        └── components/
            ├── ShipyardScene.jsx # Canlı 3D Canvas render
            ├── EventStream.jsx   # Canlı Liman Anonsları ticker bileşeni
            ├── Navbar.jsx        # Üst durum barı
            └── LegendModal.jsx   # Metafor rehberi modalı
```
