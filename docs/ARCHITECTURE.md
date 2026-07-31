# ARCHITECTURE.md — Canlı 3D Liman Mimari Dokümantasyonu

Projenin teknik bileşenleri, veri akışları ve rendering katmanları.

---

## 🏛️ Mimari Katmanlar

### 1. 3D WebGL Rendering Katmanı (Three.js & R3F)
- `ShipyardScene.jsx`: Ana 3D canvas kapsayıcısı. `position: absolute; inset: 0; width: 100%; height: 100%;` (Unbroken height chain).
- `CargoShip.jsx`: Worker Node gemileri. Devriye rotası (CatmullRomCurve3) üzerinde hareket eder.
- `CargoContainer.jsx`: Pod paletleri. Gemi üstüne parent-child dönüşümüyle bağlıdır.
- `WorkloadHelpers.jsx`: StatefulSet Sabit Numaralı Gemi (`StatefulSetShip`), DaemonSet Gemi Direği Anteni (`DaemonSetEquipment`), Job Görev Şalupası (`JobTaskBoatMesh`).
- `ConfigMapAndSecretMesh.jsx`: ConfigMap (Sevkiyat Föyü Panosu) ve Secret (Kilitli Çelik Kasa) 3D nesneleri.
- `StorageDepotMesh.jsx`: Karada gemilerden bağımsız duran 3D Kiralanmış Depo Ambarı (PV/PVC) ve mor/turkuaz bağlantı hattı.

### 2. Node Hareket Mantığı (Devriye Rotası Mimarisi)
- **Sağlıklı Durum (Ready):** Her gemi Three.js `CatmullRomCurve3` kapalı eğrisi üzerinde `getPointAt(t)` ile yavaşça yol alır. Gemi yönü `getTangentAt(t)` ile otomatik hesaplanır.
- **Anomali Durumu (NotReady / Fail):** Anomali tetiklendiğinde `t` zaman parametresi DONDURULUR (pause). Gemi bulunduğu koordinatta sabitlenir ve batan/alazlanan animasyon oynatılır.

### 3. HTML/CSS Overlay Katmanı
- `Top Header Bar`: Screen Top fixed navbar (`#top-header-bar`, `z-9999 pointer-events-auto`).
- `MasterDashboardOverlay.jsx`: Sağ taraf 420px dikey dark-glassmorphism Control Plane paneli (`z-45`), Sefer Tarifesi (CronJob Schedule) paneli ve RBAC Özet & Güvenlik Rozetleri paneli.
- `info-panel-drawer`: Sağ taraf 360px dikey nesne müfettiş çekmecesi (`z-40`).
- `PodLogViewer.jsx`: Monospace terminal log görüntüleyici.

### 4. WebSocket Hook & İstemci Yaşam Döngüsü Mimarisi (`useShipyardWebSocket.js`)
- **Referans Tabanlı Soket Yönetimi (`useRef`):** Soket nesnesi (`wsRef`), bağlanma durumu (`isConnectingRef`) ve aktif port (`activePortRef`) `useRef` ile yönetilir. Mutable state değişkenleri (`isConnected`) `useCallback` / `useEffect` bağımlılık dizisinden tamamen çıkarılmıştır.
- **Strict-Mode & Multi-Mount Koruması:** `connect` fonksiyonunun kimliği sabit kalır; `setIsConnected(true)` çağrıldığında `useEffect` cleanup'ı (`wsRef.current.close()`) tetiklenmez.
- **Sıfır Çökme & Payload Güvenliği:** `ws.onmessage` içerisindeki JSON parse ve payload işleme adımları `try/catch` bloğu içerisindedir; parse hatasında soket kapatılmaz, hata durum bilgisi loglanır.

### 5. Log Streaming Mimarisi (Faz 21 / v2.2.0)
- **Backend K8s Endpoint:** WebSocket sunucusu `/api/v1/pods/logs/stream` rotasını dinler.
- **Client-Go Akışı:** `CoreV1().Pods(ns).GetLogs(...)` canlı stream.

### 6. ConfigMap & Secret Inspection Mimarisi (Faz 22 / v2.3.0)
- **ConfigMap Açık Gösterim:** `ConfigMapInfo` struct'ı `Data map[string]string` içerir.
- **Secret Sıfır Değer Maruziyeti İlkesi (Zero Value Leakage):** Raw `Data` verisi Go tür tanımından tamamen çıkarılmıştır.

### 7. Depolama (PVC/PV) Görselleştirme (Faz 23 / v2.4.0)
- **Karada Bağımsız Depo Ambarı:** 3D Depo Ambarı karada `[-28, 0.2, 18]` koordinatında konumlandırılmıştır.

### 8. İş Yükü Tipi Ayrımı (StatefulSet/DaemonSet/Job/CronJob) Mimarisi (Faz 24 / v2.5.0)
- **`ownerReferences` Çıkarımı:** Backend `watcher.go` Pod Informer event'lerinde ownerKind ve ownerName ayıklar.

### 9. RBAC İlişkisel İnceleme ve Güvenlik Uyarısı Mimarisi (Faz 25 / v2.6.0)
- **İlişkisel Veri Modeli:** `Pod ➔ ServiceAccount ➔ RoleBinding ➔ Role / ClusterRole`.

### 10. Metrik Geçmişi (Trend Grafiği) ve Bellek-İçi Ring Buffer Mimarisi (Faz 26 / v2.7.0)
- **Sadece Bellek-İçi Ring Buffer (Zero Database):** Metrik geçmişi son 1 saatlik (30 saniye aralıklı, 120 nokta) veri bellek içi ring buffer'da tutulur.

### 11. Bağlantı Dayanıklılığı & Dinamik Kubeconfig Yeniden Yükleme (v2.8.0)
- **Dinamik Port Sapması Algılama (Port Drift Recovery):** Backend 3 ardışık bağlantı hatasından sonra diskteki `~/.kube/config` dosyasını otomatik yeniden okur.

---

## 🔄 Veri Akış Şeması
```text
Kube API / State -> WebSocket Sync & Log Stream -> React State -> R3F Canvas Render & HTML Overlay
```
