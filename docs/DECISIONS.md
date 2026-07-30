# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki önemli mimari ve tasarım kararları bu dosyada belgelenir.

---

## 📋 Karar Listesi

### 🟢 [ADR-011] 3D➔2D Interactive Control Dashboard, Raycasting StopPropagation ve Canlı Parçacık Ağ Trafiği
- **Tarih:** 2026-07-30
- **Durum:** ✅ Kabul Edildi
- **Karar:**
  1. "Yönetim Binasına Gir" aksiyonunda kamera bina içine yumuşakça lerp eder ve 3D sahne yerini tam ekran etkileşimli 2D Control Plane Dashboard Konsoluna (`MasterDashboardOverlay.jsx`) bırakır.
  2. İç içe 3D nesnelerde (gemi üzerindeki kargo konteynırı) raycasting karışıklığını önlemek için tüm interaktif mesh event handler'larına `e.stopPropagation()` zorunluluğu getirildi.
  3. Her gemi direğine dönen 3D Kubelet Radar ikonu (`KubeletRadar`) eklendi ve tıklanabilir Kubelet müfettiş çekmecesi bağlandı.
  4. Kube-proxy ile Düğümler/Master bina arasında canlı akan ışıklı parçacık ağ akış çizgileri (`NetworkTrafficParticles.jsx`) ve UI açma/kapama anahtarı eklendi.

---

### 🟢 [ADR-010] Varsayılan %100 3D Sahne, Dikey K8s Bilgi Kartı Çekmecesi ve Zenginleştirilmiş Liman Mimarisi
- **Tarih:** 2026-07-30
- **Durum:** ✅ Kabul Edildi
