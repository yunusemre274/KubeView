# ARCHITECTURE.md — Canlı 3D Liman Mimari Dokümantasyonu

Projenin teknik bileşenleri, veri akışları ve rendering katmanları.

---

## 🏛️ Mimari Katmanlar

### 1. 3D WebGL Rendering Katmanı (Three.js & R3F)
- `ShipyardScene.jsx`: Ana 3D canvas kapsayıcısı. `position: absolute; inset: 0; width: 100%; height: 100%;` (Unbroken height chain).
- `CargoShip.jsx`: Worker Node gemileri. Devriye rotası (CatmullRomCurve3) üzerinde hareket eder.
- `CargoContainer.jsx`: Pod paletleri. Gemi üstüne parent-child dönüşümüyle bağlıdır.
- `IngressLighthouse.jsx`: Ingress / Gateway API Uluslararası Deniz Feneri.
- `NetworkPolicyBarriers.jsx`: 3D Kırmızı lazer güvenlik bariyerleri.
- `OrchestrationHelpers.jsx`: HPA Mobil Vinç, Node Affinity Çizgileri, PDB Bakım Bayrağı.

### 2. Node Hareket Mantığı (Devriye Rotası Mimarisi)
- **Sağlıklı Durum (Ready):** Her gemi Three.js `CatmullRomCurve3` kapalı eğrisi üzerinde `getPointAt(t)` ile yavaşça yol alır. Gemi yönü `getTangentAt(t)` ile otomatik hesaplanır.
- **Anomali Durumu (NotReady / Fail):** Anomali tetiklendiğinde `t` zaman parametresi DONDURULUR (pause). Gemi bulunduğu koordinatta sabitlenir ve batan/alazlanan animasyon oynatılır.
- **Anomali Bitişi (Recovery):** Anomali temizlendiğinde gemi sıçrama yapmadan kaldığı `t` koordinatından rotasına devam eder.
- **Etkileşim:** Tıklama raycasting ile hareketli gemi üzerinde kesintisiz çalışır.

### 3. HTML/CSS Overlay Katmanı
- `Top Toolbar`: Screen Top fixed navigation (`top-3 z-50 pointer-events-auto`).
- `MasterDashboardOverlay.jsx`: Sağ taraf 420px dikey dark-glassmorphism Control Plane paneli (`z-45`).
- `info-panel-drawer`: Sağ taraf 360px dikey nesne müfettiş çekmecesi (`z-40`).
- `EventLogDrawer.jsx`: Son 50 olaylık in-memory ring buffer çekmecesi (`z-50`).
- `ConfirmationModal.jsx`: Güvenlik onay modalı (`z-50`).

---

## 🔄 Veri Akış Şeması
```text
Kube API / State -> WebSocket Sync -> React State -> R3F Canvas Render & HTML Overlay
```
