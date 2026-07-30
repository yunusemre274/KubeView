# ARCHITECTURE.md — Aktif Mimarisi (Faz 3)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 3** mimarisini tanımlar. Gelecek fazların spekülatif mimarisi buraya yazılmaz. Kod yapısı değiştikçe bu dosya `architecture-agent` veya değişiklik yapan ilgili agent tarafından güncellenir.

---

## 🏛️ Faz 3 Mimari Bileşenleri

Faz 3 kapsamında sistem 4 ana bileşenden oluşur:
1. **Kubernetes RBAC Manifestleri:** Read-only `ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` tanımları (`deploy/rbac.yaml`).
2. **Go Informer Watcher:** `k8s.io/client-go` Informer'ları ile küme olaylarını dinleyen ve yerel bellekte tutan Go backend modülü.
3. **WebSocket Hub & Server:** `/ws` endpoint'i üzerinden WebSocket akışı sağlayan HTTP sunucusu.
4. **React + Three.js 3D Frontend:** React 18, Vite ve React Three Fiber (`@react-three/fiber`, `@react-three/drei`) kullanarak 3D deniz, liman dock alanı, kargo gemisi (Worker Node) ve kargo kutuları (Pod) render eden statik istemci arayüzü (`/frontend`).

---

## 🔄 Veri Akışı (Faz 3)

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
                                                                      v (Faz 4'te bağlanacak)
                                                        +---------------------------+
                                                        | React Three.js 3D Client  |
                                                        |  - Canvas / OrbitControls |
                                                        |  - 3D Ships (Nodes)       |
                                                        |  - 3D Cargo (Pods)        |
                                                        +---------------------------+
```

---

## 💻 Kullanılan Teknolojiler ve Tercih Gerekçeleri

| Teknoloji | Sürüm | Seçim Gerekçesi |
| :--- | :--- | :--- |
| **Go** | `1.22+` | Düşük kaynak kullanımı, yüksek performans. |
| **client-go** | `v0.30+` | API Server ile resmi ve kararlı iletişim. |
| **gorilla/websocket** | `v1.5.1` | Yüksek performanslı WebSocket sunucusu. |
| **React** | `18.3+` | Bildirimsel (declarative) bileşen yapısı. |
| **Three.js / R3F** | `v0.164+ / v8.16+` | WebGL tabanlı 60 FPS 3D render ve kolay bileşen yönetimi. |

---

## 📁 Proje Dosya ve Klasör Yapısı (Faz 3)

```
.
├── AGENTS/                      # Ajan tanım ve kural dosyaları
├── docs/                        # Proje dokümantasyonu
├── deploy/                      # Kubernetes manifestleri
│   └── rbac.yaml                # ServiceAccount, ClusterRole ve Binding
├── backend/                     # Go Backend kaynak kodları
└── frontend/                    # React + Three.js Frontend kaynak kodları
    ├── package.json             # Bağımlılıklar (React, Three.js, R3F, Lucide)
    ├── vite.config.js           # Vite sunucu ve derleme konfigürasyonu
    ├── index.html               # Ana HTML şablonu
    └── src/
        ├── index.css            # Tailwind & Glassmorphism stilleri
        ├── main.jsx             # React giriş noktası
        ├── App.jsx              # Ana uygulama düzeni
        └── components/
            ├── ShipyardScene.jsx # Three.js 3D Canvas, Deniz, Gemi & Kargo render
            ├── Navbar.jsx        # Durum göstergesi ve üst bar overlay
            └── LegendModal.jsx   # Metafor rehberi modal overlay
```
