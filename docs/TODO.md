# TODO.md — Aktif ve Sıradaki Görevler Listesi (Faz 16 Aktif)

> 🚀 **AKTİF FAZ: FAZ 16 — Güvenli Mutasyon İzinleri & Halka Arabellek Olay Günlüğü (Event Log)**

---

## 🔵 Aktif Görevler (Faz 16)
- [ ] **[GÖREV-1601] Backend RBAC Sınırlı Yazma Yetkileri:** `client-go` ServiceAccount RBAC tanımlarına `pods/delete` ve `apps/deployments/scale` yazma fiillerinin eklenmesi. (Sorumlu: `devops-agent` & `backend-agent`)
- [ ] **[GÖREV-1602] UI Mutasyon Kontrolleri:** Pod Müfettişi ve Deployment Müfettişi çekmecelerine Pod Silme, Pod Yeniden Başlatma ve Deployment Scale etme (+/- replica) butonlarının eklenmesi. (Sorumlu: `ui-ux-agent`)
- [ ] **[GÖREV-1603] Güvenlik Modalı & Salt İzleme Modu:** Yıkıcı aksiyon öncesi onay modalı, üst barda global "Salt İzleme Modu" (Read-Only Mode) anahtarı ve `kube-system` namespace kilit mekanizması. (Sorumlu: `ui-ux-agent`)
- [ ] **[GÖREV-1604] Olay Günlüğü (Event Log) & Halka Arabellek:** Sağ üstte "Olay Günlüğü" butonu, dikey absolute overlay paneli (`EventLogDrawer.jsx`), son 1 saatin in-memory ring buffer kaydı, olaya tıklayınca 3D nesneye kamera lerp odağı. (Sorumlu: `ui-ux-agent` & `3d-scene-agent`)

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 15)
- [x] **[GÖREV-101..1504]** Tüm Temel Altyapı, WebSocket streaming, 3D Canvas, 2D Control Dashboard, Raycasting Hit-Test Düzeltmesi (`LESSON-005`), Kubelet Radar & Canlı Parçacık Ağ Akış Çizgileri. (Tüm Agent'lar)

---

## 🔴 Bekleyen / Sıradaki Fazlar
- [ ] **Faz 17:** Anomali & Alarm Dramatizasyonu (CrashLoopBackOff duman/alev, OOMKilled patlama, Evicted denize atma).
- [ ] **Faz 18:** Genişletilmiş Kavramlar Katmanı 1 (Ingress Rıhtım Feneri, NetworkPolicy Kırmızı Bariyer, ResourceQuota Ambar Çizgileri).
- [ ] **Faz 19:** Genişletilmiş Kavramlar Katmanı 2 (HPA Ekstra Vinçler, PDB Bakım Bayrağı, Taints/Tolerations Özel Rıhtım).
- [ ] **Faz 20:** Diğer Genişletmeler (Hubble, Multi-Cluster, PNG Export, Maliyet Tablosu).
