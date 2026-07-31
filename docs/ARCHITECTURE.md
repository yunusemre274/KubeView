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

### 4. Tek Paylaşılan Singleton WebSocket Yöneticisi & Provider Mimarisi (`ShipyardClusterContext.jsx`)
- **Modül Seviyesi Singleton (`singletonManager`):** WebSocket bağlantı yöneticisi React bileşen ağacının dışında (module-level) instantiaten edilir. React StrictMode 2x mount etse dahi `singletonManager.socket` ve `isConnecting` kontrolleri sayesinde backend'e **EXACTLY 1 ADET CANLI WEBSOCKET BAĞLANTISI** açılır.
- **Merkezi Veri Dağıtımı (React Context Provider):** Bağlantı mesajları (`INITIAL_STATE`, `RESOURCE_EVENT`) merkezi state üzerinde işlenir ve `ShipyardClusterProvider` aracılığıyla 3D sahne, paneller ve tüm alt bileşenlere dağıtılır. Bileşenler kendileri `new WebSocket()` çağırmaz.
- **Merkezi Retry & Hata Yönetimi:** Exponential backoff reconnect döngüsü tek bir noktadan yönetilir. `onmessage` try/catch ile sarmalanmıştır.

```text
[Backend WebSocket Server] (ws://localhost:8000/ws)
           ▲
           │ EXACTLY 1 Singleton Connection
           ▼
[singletonManager] (Module-Level Singleton outside React tree)
           │
           ▼ Context Provider
[ShipyardClusterProvider] (Root Level in main.jsx)
      ┌────┴──────────────────────────┐
      ▼                               ▼
 [App Component]             [ShipyardScene / Panels]
 (Consumes Shared Context)   (Consumes Shared Context)
```

### 5. Log Streaming Mimarisi (Faz 21 / v2.2.0)
- **Backend K8s Endpoint:** WebSocket sunucusu `/api/v1/pods/logs/stream` rotasını dinler.

### 6. ConfigMap & Secret Inspection Mimarisi (Faz 22 / v2.3.0)
- **ConfigMap Açık Gösterim:** `ConfigMapInfo` struct'ı `Data map[string]string` içerir.

### 7. Depolama (PVC/PV) Görselleştirme (Faz 23 / v2.4.0)
- **Karada Bağımsız Depo Ambarı:** 3D Depo Ambarı karada `[-28, 0.2, 18]` koordinatında konumlandırılmıştır.

---

## 🔄 Veri Akış Şeması
```text
Kube API / State -> WebSocket Sync & Log Stream -> Singleton Manager -> React Context -> R3F Canvas & Overlay
```
