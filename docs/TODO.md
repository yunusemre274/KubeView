# TODO.md — Aktif ve Sıradaki Görevler Listesi (Faz 18 Aktif)

> 🚀 **AKTİF FAZ: FAZ 18 — Genişletilmiş Kavramlar Katmanı 1 (Network & Security Isolation)**

---

## 🔵 Aktif Görevler (Faz 18)
- [ ] **[GÖREV-1801] Ingress / Gateway API Rıhtım Feneri:** Liman ağzında Uluslararası Giriş Rıhtımı ve ışık yayan Deniz Feneri bileşeni (`IngressLighthouse.jsx`). (Sorumlu: `networking-agent` & `3d-scene-agent`)
- [ ] **[GÖREV-1802] NetworkPolicy Kırmızı Bariyerler:** İhlal veya kısıtlama durumunda rıhtım ve gemiler arasında beliren 3D kırmızı lazer güvenlik bariyerleri. (Sorumlu: `networking-agent`)
- [ ] **[GÖREV-1803] ResourceQuota Ambar Çizgileri:** Ambar binası duvarlarında maksimum taşıma kapasitesi doluluk çizgileri ve uyarı panosu. (Sorumlu: `3d-scene-agent`)
- [ ] **[GÖREV-1804] EndpointSlice Kablo Demetleri:** Kube-proxy ağ binasından gemilere uzanan çoklu Endpoint kablo bağlantıları. (Sorumlu: `networking-agent`)

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 17)
- [x] **[GÖREV-1701..1704]** 3D Anomali ve Alarm Efektleri (`CrashLoopBackOff` duman/alev, `OOMKilled` patlama, `NodeNotReady` gemi yan yatma, `ImagePullBackOff` boş vinç, `ReadinessFail` kırmızı bayrak) ve Olay Günlüğü One-Shot tetikleyicisi. (Yapan: `3d-scene-agent`, `ui-ux-agent`)
- [x] **[GÖREV-1601..1604]** Pod Silme/Restart mutasyonları, ConfirmationModal, Global Salt İzleme Modu ve EventLogDrawer ring buffer. (Yapan: `backend-agent`, `ui-ux-agent`)
- [x] **[GÖREV-101..1504]** Tüm Core Altyapı, 3D Canvas, 2D Control Dashboard, Raycasting Fix (`LESSON-005`), Kubelet Radar & Canlı Parçacık Ağ Akış Çizgileri. (Tüm Agent'lar)

---

## 🔴 Bekleyen / Sıradaki Fazlar
- [ ] **Faz 19:** Genişletilmiş Kavramlar Katmanı 2 (HPA Ekstra Vinçler, PDB Bakım Bayrağı, Taints/Tolerations Özel Rıhtım, Rolling Update).
- [ ] **Faz 20:** Diğer Genişletmeler (Hubble, Multi-Cluster, PNG Export, Maliyet Tablosu).
