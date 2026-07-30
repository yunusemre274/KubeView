# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.8.0 - Faz 17 Anomali & Alarm Dramatizasyonu Engine] - 2026-07-30

### Eklendi / Düzeltildi
- **3D Anomali ve Alarm Efektleri (`AnomalyEffects.jsx`):**
  - `CrashLoopBackOff`: Konteynırdan yükselen 3D duman ve alev parçacıkları (`SmokeAndFlameEffect`).
  - `OOMKilled`: Konteynırın anlık şişip patlama/yok olma halka efekti (`OOMKilledBurstEffect`).
  - `Node NotReady`: Worker Node gemisinin su almaya başlayıp yan yatma animasyonu.
  - `ImagePullBackOff`: Gantry vinç kancasının boşta sallanması.
  - `Readiness Probe Fail`: Direkte sallanan 3D kırmızı uyarı bayrağı (`RedFlagEffect`).
- **Olay Günlüğü Tek Seferlik (One-Shot) Tetikleyici:** Olay günlüğündeki bir anomali kaydına tıklandığında kamera lerp odağı ile ilgili 3D efektin bir kez oynatılması sağlandı.
- **UI Anomali Simülasyon Dropdown:** Alt menüye 3D anomali simülasyon testi seçicisi eklendi.

---

## [v1.7.0 - Faz 16 Güvenli Mutasyon İzinleri & Halka Arabellek Olay Günlüğü] - 2026-07-30
- Pod Silme/Restart mutasyon butonları, ConfirmationModal, Global Salt İzleme Modu ve EventLogDrawer ring buffer eklendi.
