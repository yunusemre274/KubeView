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
- `IngressLighthouse.jsx`: Ingress / Gateway API Uluslararası Deniz Feneri.
- `NetworkPolicyBarriers.jsx`: 3D Kırmızı lazer güvenlik bariyerleri.
- `OrchestrationHelpers.jsx`: HPA Mobil Vinç, Node Affinity Çizgileri, PDB Bakım Bayrağı.

### 2. Node Hareket Mantığı (Devriye Rotası Mimarisi)
- **Sağlıklı Durum (Ready):** Her gemi Three.js `CatmullRomCurve3` kapalı eğrisi üzerinde `getPointAt(t)` ile yavaşça yol alır. Gemi yönü `getTangentAt(t)` ile otomatik hesaplanır.
- **Anomali Durumu (NotReady / Fail):** Anomali tetiklendiğinde `t` zaman parametresi DONDURULUR (pause). Gemi bulunduğu koordinatta sabitlenir ve batan/alazlanan animasyon oynatılır.
- **Etkileşim:** Tıklama raycasting ile hareketli gemi üzerinde kesintisiz çalışır.

### 3. HTML/CSS Overlay Katmanı
- `Top Header Bar`: Screen Top fixed navbar (`#top-header-bar`, `z-9999 pointer-events-auto`).
- `MasterDashboardOverlay.jsx`: Sağ taraf 420px dikey dark-glassmorphism Control Plane paneli (`z-45`) ve Sefer Tarifesi (CronJob Schedule) paneli.
- `info-panel-drawer`: Sağ taraf 360px dikey nesne müfettiş çekmecesi (`z-40`).
- `PodLogViewer.jsx`: Monospace terminal log görüntüleyici.

### 4. Log Streaming Mimarisi (Faz 21 / v2.2.0)
- **Backend K8s Endpoint:** WebSocket sunucusu `/api/v1/pods/logs/stream?pod=[pod]&namespace=[ns]&container=[c]&tailLines=150` rotasını dinler.
- **Client-Go Akışı:** `CoreV1().Pods(ns).GetLogs(pod, &PodLogOptions{Container: c, Follow: true, TailLines: 150})` ile K8s API'sinden canlı stream açar.

### 5. ConfigMap & Secret Inspection Mimarisi (Faz 22 / v2.3.0)
- **ConfigMap Açık Gösterim:** `ConfigMapInfo` struct'ı `Data map[string]string` içerir.
- **Secret Sıfır Değer Maruziyeti İlkesi (Zero Value Leakage):** Backend `SecretInfo` struct'ı yalnızca `KeyNames []string` tutar; raw `Data` verisi Go tür tanımından tamamen çıkarılmıştır.

### 6. Depolama (PVC/PV) Görselleştirme (Faz 23 / v2.4.0)
- **Karada Bağımsız Depo Ambarı:** 3D Depo Ambarı karada `[-28, 0.2, 18]` koordinatında konumlandırılmıştır.
- **Pod-Depo Bağlantı Hattı:** `StorageConnectionLine` mor/turkuaz parlayan 3D Bezier eğrisi çizer.

### 7. İş Yükü Tipi Ayrımı (StatefulSet/DaemonSet/Job/CronJob) Mimarisi (Faz 24 / v2.5.0)
- **`ownerReferences` Çıkarımı:** Backend `watcher.go` Pod Informer event'lerinde `pod.OwnerReferences` slice'ını tarayarak `OwnerKind` (`Deployment`, `StatefulSet`, `DaemonSet`, `Job`) ve `OwnerName` bilgisini çekip frontend'e iletir.
- **StatefulSet Sabit Demirli Gemi:** Numaralı dikey rozet (`#0`) taşıyan gemiler devriye rotasında hareket etmez, sabit demirli durur.
- **DaemonSet Direk Anteni:** Her worker node gemisinin direğinde dönen 3D mavi anten ikonu olarak gösterilir.
- **Job Görev Şalupası:** Limanda belirip işini yapınca kaybolan 3D şalupa nesnesidir.
- **CronJob Zamanlama:** Control Plane panelinde zamanlama tablosu halinde sunulur, tetiklenince sahnede 3D Job şalupası üretir.

---

## 🔄 Veri Akış Şeması
```text
Kube API / State -> WebSocket Sync & Log Stream -> React State -> R3F Canvas Render & HTML Overlay
```
