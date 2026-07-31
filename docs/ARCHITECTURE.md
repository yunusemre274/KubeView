# ARCHITECTURE.md — Canlı 3D Liman Mimari Dokümantasyonu

Projenin teknik bileşenleri, veri akışları ve rendering katmanları.

---

## 🏛️ Mimari Katmanlar

### 1. 3D WebGL Rendering Katmanı (Three.js & R3F)
- `ShipyardScene.jsx`: Ana 3D canvas kapsayıcısı. `position: absolute; inset: 0; width: 100%; height: 100%;` (Unbroken height chain).
- `CargoShip.jsx`: Worker Node gemileri. Devriye rotası (CatmullRomCurve3) üzerinde hareket eder.
- `CargoContainer.jsx`: Pod paletleri. Gemi üstüne parent-child dönüşümüyle bağlıdır.
- `ConfigMapAndSecretMesh.jsx`: ConfigMap (Sevkiyat Föyü Panosu) ve Secret (Kilitli Çelik Kasa) 3D nesneleri.
- `IngressLighthouse.jsx`: Ingress / Gateway API Uluslararası Deniz Feneri.
- `NetworkPolicyBarriers.jsx`: 3D Kırmızı lazer güvenlik bariyerleri.
- `OrchestrationHelpers.jsx`: HPA Mobil Vinç, Node Affinity Çizgileri, PDB Bakım Bayrağı.

### 2. Node Hareket Mantığı (Devriye Rotası Mimarisi)
- **Sağlıklı Durum (Ready):** Her gemi Three.js `CatmullRomCurve3` kapalı eğrisi üzerinde `getPointAt(t)` ile yavaşça yol alır. Gemi yönü `getTangentAt(t)` ile otomatik hesaplanır.
- **Anomali Durumu (NotReady / Fail):** Anomali tetiklendiğinde `t` zaman parametresi DONDURULUR (pause). Gemi bulunduğu koordinatta sabitlenir ve batan/alazlanan animasyon oynatılır.
- **Anomali Bitişi (Recovery):** Anomali temizlendiğinde gemi sıçrama yapmadan kaldığı `t` koordinatından rotasına devam eder.
- **Etkileşim:** Tıklama raycasting ile hareketli gemi üzerinde kesintisiz çalışır.

### 3. HTML/CSS Overlay Katmanı
- `Top Header Bar`: Screen Top fixed navbar (`#top-header-bar`, `z-9999 pointer-events-auto`).
- `MasterDashboardOverlay.jsx`: Sağ taraf 420px dikey dark-glassmorphism Control Plane paneli (`z-45`).
- `info-panel-drawer`: Sağ taraf 360px dikey nesne müfettiş çekmecesi (`z-40`).
- `PodLogViewer.jsx`: Monospace terminal log görüntüleyici (otomatik scroll duraklatmalı, regex renk vurgulamalı, container seçimli).
- `EventLogDrawer.jsx`: Son 50 olaylık in-memory ring buffer çekmecesi (`z-50`).
- `ConfirmationModal.jsx`: Güvenlik onay modalı (`z-50`).

### 4. Log Streaming Mimarisi (Faz 21 / v2.2.0)
- **Backend K8s Endpoint:** WebSocket sunucusu `/api/v1/pods/logs/stream?pod=[pod]&namespace=[ns]&container=[c]&tailLines=150` rotasını dinler.
- **Client-Go Akışı:** `CoreV1().Pods(ns).GetLogs(pod, &PodLogOptions{Container: c, Follow: true, TailLines: 150})` ile K8s API'sinden canlı stream açar.
- **Bağlantı Yaşam Döngüsü:** Kullanıcı frontend'de Pod müfettiş çekmecesini veya Loglar sekmesini kapattığında WebSocket istemcisi `ws.close()` çağırır; backend Go `ctx.Cancel()` ile K8s API stream bağlantısını derhal sonlandırır.
- **Bellek ve Scroll Yönetimi:** Frontend React state'inde en fazla 500 satır tutulur (eski satırlar düşürülür). Kullanıcı yukarı scroll yaptığında otomatik kaydırma duraklatılır, en alta indiğinde tekrar aktifleşir.

### 5. ConfigMap & Secret Inspection Mimarisi ve Güvenlik Sınırları (Faz 22 / v2.3.0)
- **ConfigMap Açık Gösterim:** `ConfigMapInfo` struct'ı `Data map[string]string` içerir. Tüm key-value bilgileri ve çok satırlı yapılandırma metinleri okunabilir kod blokları halinde gösterilir.
- **Secret Sıfır Değer Maruziyeti İlkesi (Zero Value Leakage):** Backend `SecretInfo` struct'ı yalnızca `KeyNames []string` tutar; raw `Data` veya `StringData` map verisi Go tür tanımından ve backend iletim şemasından **tamamen çıkarılmıştır**.
- **Frontend Maskeli Görünüm:** Frontend nesnesi sadece key isimlerini ve `••••••••` maskeli değerleri sunar; `🔒 Değerler güvenlik nedeniyle gösterilmez` uyarısı verir.

---

## 🔄 Veri Akış Şeması
```text
Kube API / State -> WebSocket Sync & Log Stream -> React State -> R3F Canvas Render & HTML Overlay
```
