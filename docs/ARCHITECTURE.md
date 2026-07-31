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

### 5. Sahne Yerleşim Mantığı (3D Bounding Dimensions & Tiered Stacking Grid Layout)
- **Merkezi Boyut Sabitleri (`constants/dimensions.js`):** Tüm 3D nesnelerin fiziksel boyutları (genişlik, yükseklik, derinlik) ve aralık parametreleri (`CONTAINER_DIMENSIONS`, `SHIP_DIMENSIONS`, `GANTRY_CRANE_DIMENSIONS`, `STORAGE_DEPOT_DIMENSIONS`) sabitler olarak tanımlanmıştır.
- **Dinamik Katmanlı Güverte İstifleme (`calculateContainerDeckPosition`):** Gemi güvertesindeki Pod konteynırları 2 sütunlu X dizilimi, 3 sıralı Z sınırlaması ve güverte kapasitesi dolduğunda Y ekseninde dikey katmanlı (tier-based vertical stacking) istifleme algoritması ile yerleştirilir. Bu sayede 10+ Pod bulunsa dahi konteynırlar birbiriyle veya gemi köprüsüyle asla çakışmaz.
- **Emniyetli Liman Nesne Temizliği:** Karadaki vinçler, depolar, kuleler ve bağlantı hatları bounding box alanlarına göre hesaplanan emniyetli koordinatlarla yerleştirilmiştir.

```text
Tier 2 (Y=8.7)  [Pod 13] [Pod 14]
Tier 1 (Y=6.2)  [Pod 7]  [Pod 8]  [Pod 9]  [Pod 10] [Pod 11] [Pod 12]
Tier 0 (Y=3.7)  [Pod 1]  [Pod 2]  [Pod 3]  [Pod 4]  [Pod 5]  [Pod 6]
                └──────────────── Güverte (Z: -4.5 -> +6.7) ──────────────┘
```

---

## 🔄 Veri Akış Şeması
```text
Kube API / State -> WebSocket Sync -> Singleton Manager -> React Context -> R3F Tiered Grid Render & Overlay
```
