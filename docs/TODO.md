# TODO.md — Aktif ve Sıradaki Görevler Listesi (Faz 19 Aktif)

> 🚀 **AKTİF FAZ: FAZ 19 — Genişletilmiş Kavramlar Katmanı 2 (Workload Orchestration & Scheduling)**

---

## 🔵 Aktif Görevler (Faz 19)
- [ ] **[GÖREV-1901] HorizontalPodAutoscaler (HPA) Otomatik Ekstra Vinçler:** Pod yükü arttıkça otomatik sahaya giren ekstra hareketli yükleyici vinç simülasyonu. (Sorumlu: `3d-scene-agent`)
- [ ] **[GÖREV-1902] PodDisruptionBudget (PDB) & Taints/Tolerations:** Bakım izinli rıhtım bayrağı ve özel izinli kilitli rıhtım alanları. (Sorumlu: `3d-scene-agent` & `ui-ux-agent`)
- [ ] **[GÖREV-1903] Node Affinity Tercih Çizgileri:** Gemilerin tercih ettiği rıhtımları bağlayan magnetik kılavuz çizgileri. (Sorumlu: `3d-scene-agent`)
- [ ] **[GÖREV-1904] Rolling Update Sıralı Filo Yenileme:** Gemilerin teker teker sırayla yanaşıp eski konteynırları yenileriyle değiştirme animasyonu. (Sorumlu: `3d-scene-agent` & `ui-ux-agent`)

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 18)
- [x] **[GÖREV-1801..1804]** 3D Ingress Gateway Deniz Feneri (`IngressLighthouse.jsx`), 3D NetworkPolicy Kırmızı Lazer Bariyerleri (`NetworkPolicyBarriers.jsx`) ve EndpointSlice müfettiş çekmecesi. (Yapan: `networking-agent`, `3d-scene-agent`)
- [x] **[GÖREV-1701..1704]** 3D Anomali Efektleri (`CrashLoopBackOff` duman/alev, `OOMKilled` patlama, `NodeNotReady` su alma). (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-1601..1604]** Pod Silme/Restart mutasyonları, ConfirmationModal, Global Salt İzleme Modu ve EventLogDrawer ring buffer. (Yapan: `backend-agent`, `ui-ux-agent`)

---

## 🔴 Bekleyen / Sıradaki Fazlar
- [ ] **Faz 20:** Diğer Genişletmeler (Hubble, Multi-Cluster, PNG Export, Maliyet Tablosu).
