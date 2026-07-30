# ARCHITECTURE.md — Aktif Mimarisi (Faz 2)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 2** mimarisini tanımlar. Gelecek fazların spekülatif mimarisi buraya yazılmaz. Kod yapısı değiştikçe bu dosya `architecture-agent` veya değişiklik yapan ilgili agent tarafından güncellenir.

---

## 🏛️ Faz 2 Mimari Bileşenleri

Faz 2 kapsamında sistem 3 ana bileşenden oluşur:
1. **Kubernetes RBAC Manifestleri:** Uygulamanın API Server'a güvenli ve salt-okunur (read-only) erişmesini sağlayan `ServiceAccount`, `ClusterRole` ve `ClusterRoleBinding` tanımları (`deploy/rbac.yaml`).
2. **Go Informer Watcher:** `k8s.io/client-go` kütüphanesini kullanarak API Server'a bağlanan, Node ve Pod event'lerini `SharedInformerFactory` ile dinleyen ve yerel bellekte küme snapshot'ını saklayan modül.
3. **WebSocket Hub & Server:** `gorilla/websocket` kullanarak `/ws` endpoint'i üzerinden bağlı tüm istemcilere canlı K8s event'lerini yayınlayan, yeni bağlanan istemcilere anında ilk küme durumunu (Initial State Dump) fırlatan sunucu.

---

## 🔄 Veri Akışı (Faz 2)

```
+------------------------+      Watch / Informer        +---------------------------+
| K8s API Server         | <--------------------------> | Go Backend (client-go)    |
| (Nodes, Pods, Events)  |                              |  - SharedInformerFactory  |
+------------------------+                              |  - Local State Cache      |
                                                        +---------------------------+
                                                                      |
                                                                      v
                                                        +---------------------------+
                                                        | WebSocket Hub             |
                                                        |  - ServeWS (/ws)          |
                                                        |  - Initial State Dump     |
                                                        |  - Broadcast Channel      |
                                                        +---------------------------+
                                                                      |
                                                                      v (WS Messages)
                                                        +---------------------------+
                                                        | Frontend / WS Clients     |
                                                        +---------------------------+
```

---

## 💻 Kullanılan Teknolojiler ve Tercih Gerekçeleri

| Teknoloji | Sürüm | Seçim Gerekçesi |
| :--- | :--- | :--- |
| **Go** | `1.22+` | Yüksek eşzamanlılık (Goroutines), düşük bellek tüketimi. |
| **k8s.io/client-go** | `v0.30+` | API Server ile resmi ve en kararlı event-driven iletişim kütüphanesi. |
| **gorilla/websocket** | `v1.5.1` | Go ekosisteminde en performanslı ve güvenilir WebSocket sunucu kütüphanesi. |
| **Kubernetes RBAC** | `rbac.authorization.k8s.io/v1` | Kesin salt-okunur (read-only) erişim kısıtlaması. |

---

## 📁 Proje Dosya ve Klasör Yapısı (Faz 2)

```
.
├── AGENTS/                      # Ajan tanım ve kural dosyaları
├── docs/                        # Proje dokümantasyonu
├── deploy/                      # Kubernetes manifestleri
│   └── rbac.yaml                # ServiceAccount, ClusterRole ve Binding
├── backend/                     # Go Backend kaynak kodları
│   ├── go.mod                   # Go modül tanımı
│   ├── go.sum                   # Bağımlılık kilit dosyası
│   ├── main.go                  # HTTP & WebSocket sunucusu giriş noktası
│   └── pkg/
│       ├── api/
│       │   └── schema.go        # WSMessage & ShipyardMetaphor JSON şeması
│       ├── k8s/
│       │   ├── client.go        # K8s In-cluster & Out-of-cluster client
│       │   └── watcher.go       # Informer & state cache & broadcast entegrasyonu
│       └── websocket/
│           └── hub.go           # WebSocket Hub, client handler ve ping/pong
├── README.md                    # Proje genel tanıtımı
└── LICENSE                      # Proje lisans dosyası
```

---

## ⚡ Bilinen Kısıtlar ve Teknik Borçlar (Faz 2)
1. **Frontend UI Henüz Statik 3D Değil:** 3D React Three Fiber sahneleri Faz 3'te eklenecektir.
2. **Metrik Toplama Devre Dışı:** `metrics-server` entegrasyonu Faz 5'te eklenecektir.
