# TODO.md — Aktif ve Sıradaki Görevler Listesi (Faz 17 Aktif)

> 🚀 **AKTİF FAZ: FAZ 17 — Anomali & Alarm Dramatizasyonu Engine**

---

## 🔵 Aktif Görevler (Faz 17)
- [ ] **[GÖREV-1701] CrashLoopBackOff & OOMKilled 3D Efektleri:** Konteynırdan çıkan duman/alev ve patlama/yok olma animasyonunun kurgulanması. (Sorumlu: `3d-scene-agent`)
- [ ] **[GÖREV-1702] ImagePullBackOff & Evicted Animasyonları:** Vincin boşta sallanması ve konteynırın denize atılma animasyonu. (Sorumlu: `3d-scene-agent`)
- [ ] **[GÖREV-1703] Node NotReady & Self-Heal Animasyonu:** Geminin su alıp eğilmesi ve geri yüzeye çıkma animasyonu. (Sorumlu: `3d-scene-agent`)
- [ ] **[GÖREV-1704] Event Log One-Shot Tetikleyici:** Olay günlüğünden bir anomaliye tıklandığında ilgili görsel dramatizasyon animasyonunun tek seferlik oynatılması. (Sorumlu: `ui-ux-agent` & `3d-scene-agent`)

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 16)
- [x] **[GÖREV-1601..1604]** Pod Silme/Restart mutasyon butonları, Onay Modalı (`ConfirmationModal.jsx`), Global Salt İzleme Modu anahtarı, `kube-system` kilidi ve In-Memory Ring Buffer Olay Günlüğü (`EventLogDrawer.jsx`). (Yapan: `backend-agent`, `ui-ux-agent`)
- [x] **[GÖREV-101..1504]** Altyapı, 3D Canvas, 2D Control Dashboard, Raycasting Hit-Test Düzeltmesi (`LESSON-005`), Kubelet Radar & Canlı Parçacık Ağ Akış Çizgileri. (Tüm Agent'lar)

---

## 🔴 Bekleyen / Sıradaki Fazlar
- [ ] **Faz 18:** Genişletilmiş Kavramlar Katmanı 1 (Ingress Rıhtım Feneri, NetworkPolicy Kırmızı Bariyer, ResourceQuota Ambar Çizgileri).
- [ ] **Faz 19:** Genişletilmiş Kavramlar Katmanı 2 (HPA Ekstra Vinçler, PDB Bakım Bayrağı, Taints/Tolerations Özel Rıhtım).
- [ ] **Faz 20:** Diğer Genişletmeler (Hubble, Multi-Cluster, PNG Export, Maliyet Tablosu).
