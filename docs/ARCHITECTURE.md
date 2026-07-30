# ARCHITECTURE.md — Aktif Mimarisi (Faz 8 - Auto Port & 3D Vizyon)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 8** ve güncellenmiş 3D vizyonun teknik mimarisini tanımlar. Kod yapısı değiştikçe bu dosya `architecture-agent` tarafından güncellenir.

---

## 🏛️ Mimari Katmanlar ve Teknolojiler

```
+-----------------------------------------------------------------------------------+
|                                KUBERNETES CLUSTER                                 |
|                                                                                   |
|  +------------------+       Watch / Informer        +--------------------------+  |
|  | K8s API Server   | <---------------------------> | Tersane Backend          |  |
|  | & NetworkPolicy  | (Nodes, Pods, Deploy, NetPol) | (Go client-go)           |  |
|  +------------------+                               +--------------------------+  |
|           ^                                                    |                  |
|           | Metrics                                     Auto Port Resolution      |
|  +------------------+                                  (Port 8000 -> 8001...)     |
|  | metrics-server   |                                          |                  |
|  +------------------+                                  WebSocket Stream           |
|                                                                |                  |
|                                                                v                  |
|                                                     +--------------------------+  |
|                                                     | Tersane 3D Engine        |  |
|                                                     | (React 18 + R3F + WebGL) |  |
|                                                     |  - Camera Manager        |  |
|                                                     |  - Interior Scene Loader |  |
|                                                     +--------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 📷 Kamera Modları ve Geçiş Mekaniği

3D motoru 3 farklı kamera perspektifini destekler:
1. **Kuşbakışı Genel Mimari Görünüm (Birds-Eye Architectural Mode):** Tüm cluster'ı (liman, yönetim binaları, ağ kuleleri ve gemiler) yukarıdan ve geniş bir açıdan kapsar. Küme bileşenleri arası mantıksal ağ bağlarını gösterir.
2. **Dış Mekan Görünümü (Exterior Object Mode):** Seçilen binanın veya geminin dış detaylarına (bacalar, metrik çubukları, kargo deck'leri) odaklanan orta mesafe görünümü.
3. **İç Mekan / Girilebilir Görünüm (Interior First-Person Mode):**
   - **Master Node Binası İçi:** Kullanıcının girip pencerelerden limandaki canlı gemileri seyrettiği, önündeki kontrol paneli ekranlarını incelediği iç sahne.
   - **Gemi (Worker Node) İçi:** Kullanıcının gemi ambarına ve kaptan köprüsüne girip dümenciyi (Kubelet) ve kargo paletlerini (Pod) izlediği iç sahne.

---

## 🔌 Otomatik Port Çakışma Önleme Stratejisi (Auto Port Detection)

1. **Arama Aralığı:**
   - Backend: Varsayılan port `8000`. Port doluysa `8000-8020` aralığı sırayla taranır.
   - Frontend: Varsayılan port `5173`. Port doluysa `5173-5190` aralığı sırayla taranır.
2. **Çalışma Mantığı:**
   - Go backend `net.Listen("tcp", ":port")` denemesi yapar. `EADDRINUSE` (port dolu) hatası alınırsa port numarası +1 artırılarak tekrar denenir.
3. **Kullanıcı Bilgilendirmesi:**
   - Kullanılan port terminal çıktısında belirgin banner olarak yazdırılır:
     `[PORT-RESOLVER] ⚠️ Port 8000 in use. Automatically switched to port 8001.`

---

## 🌐 Ağ Trafiği & NetworkPolicy Görselleştirme Altyapısı

- **Kube-proxy Binası:** Ağ trafiğini ve kargo rotalarını düzenleyen bağımsız 3D telsiz/ağ kulesi mimarisi.
- **Canlı Ağ Hatları:** Pod'lar ve Service'ler arası aktif trafik flow'ları Three.js `Line2` / `TubeGeometry` parçacık efektleri ile renklendirilir.
- **NetworkPolicy Engellemeleri:** K8s `networking.k8s.io/v1` NetworkPolicy nesneleri okunarak engellenen bağlantılar üzerine kilitli 3D gümrük bariyeri render edilir.

---

## 📁 Proje Dosya ve Klasör Yapısı (Faz 8)

```
.
├── AGENTS/                      # 14 Uzman Ajan Tanım Dosyası (3D, UX, Networking dahil)
├── docs/                        # Proje Dokümantasyonu ve ADR'lar
├── deploy/                      # Kubernetes Manifestleri (RBAC, Deployment, Service)
├── backend/                     # Go Backend
│   └── pkg/
│       ├── api/
│       │   └── schema.go        # WS & Metaphor Şemaları
│       ├── k8s/
│       │   └── watcher.go       # Informers (Nodes, Pods, Deployments, Events, NetPol)
│       ├── netutils/
│       │   └── port_resolver.go # Otomatik Port Çakışma Çözücü
│       └── websocket/
│           └── hub.go
└── frontend/                    # React 3D Engine
    └── src/
        ├── camera/
        │   └── CameraManager.jsx # Kamera modları ve serbest uçuş kontrolleri
        ├── components/
        │   ├── ShipyardScene.jsx # 3D Render Katmanı
        │   ├── DeploymentPanel.jsx
        │   ├── EventStream.jsx
        │   └── Navbar.jsx
        └── hooks/
            └── useShipyardWebSocket.js
```
