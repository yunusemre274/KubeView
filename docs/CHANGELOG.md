# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.7.0 - Faz 16 Güvenli Mutasyon İzinleri & Halka Arabellek Olay Günlüğü] - 2026-07-30

### Eklendi / Düzeltildi
- **Güvenli Mutasyon Kontrolleri:** Pod Silme (`🗑️ SİL`) ve Pod Yeniden Başlatma (`🔄 RESTART`) butonları Pod Müfettişi çekmecesine eklendi.
- **Onay Modalı (`ConfirmationModal.jsx`):** Yıkıcı mutasyon aksiyonlarından önce açılan güvenlik modalı kurgulandı.
- **Global Salt İzleme Modu:** Üst bara `🔒 SALT İZLEME` / `🔓 MÜDAHALE AÇIK` anahtarı yerleştirildi; açıkken tüm mutasyon butonları kilitlenir. `kube-system` namespace kilit mekanizması aktif edildi.
- **Halka Arabellek Olay Günlüğü (`EventLogDrawer.jsx`):** Sağ üst barda "📋 OLAY GÜNLÜĞÜ" butonu, in-memory ring buffer (son 50/1 saatlik olay kaydı), kullanıcı müdahaleleri için `👤 Kullanıcı Tetikledi` rozeti ve olaya tıklayınca 3D nesneye kamera odağı sağlandı.

---

## [v1.6.0 - 2D Control Dashboard, Raycasting Fix & Canlı Ağ Parçacıkları] - 2026-07-30
- 3D->2D lerp geçişli MasterDashboardOverlay konsolu, raycasting stopPropagation düzeltmesi ve canlı ağ parçacıkları eklendi.
