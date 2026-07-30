# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.6.0 - Faz 15 2D Control Dashboard, Raycasting Fix & Canlı Ağ Parçacıkları] - 2026-07-30

### Eklendi / Düzeltildi
- **2D Interactive Control Dashboard:** "Yönetim Binasına Gir" aksiyonunda kamera lerp geçişi ile 3D sahne yerini tam ekran etkileşimli **Control Plane Dashboard** konsoluna (`MasterDashboardOverlay.jsx`) bırakır.
- **Raycasting Hit-Test Düzeltmesi:** Konteynır (Pod) ve Gemi (Node) tıklamalarının birbirine karışması sorunu tüm interaktif 3D mesh handler'larına `e.stopPropagation()` eklenerek giderildi (`LESSON-005`).
- **Dönen 3D Kubelet İkonu:** Her geminin direğine dönen 3D Kubelet Radar ikonu (`KubeletRadar`) eklendi ve tıklanabilir Kubelet müfettiş çekmecesi bağlandı.
- **Canlı Ağ Trafiği Parçacıkları:** Kube-proxy yapısından gemilere ve Master binaya doğru ışıklı parçacıkların aktığı canlı ağ trafiği animasyonu (`NetworkTrafficParticles.jsx`) ve UI açma/kapama butonu eklendi.

---

## [v1.5.0 - Absolute Overlay Çekmece & CSS Transform] - 2026-07-30
- Panel layout sıçramaları ve anlık siyahlıklar giderildi.
