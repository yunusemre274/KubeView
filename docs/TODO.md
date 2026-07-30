# TODO.md — Aktif ve Sıradaki Görevler Listesi (Faz 20 Aktif)

> 🚀 **AKTİF FAZ: FAZ 20 — Diğer Genişletmeler (Hubble, Multi-Cluster, PNG Export & Cost Table)**

---

## 🔵 Aktif Görevler (Faz 20)
- [ ] **[GÖREV-2001] PNG Ekran Görüntüsü Dışa Aktarma:** 3D Canvas görüntüsünü anında PNG dosyası olarak yerel bilgisayara indirme ikonu ve fonksiyonu (`html2canvas` / `canvas.toDataURL`). (Sorumlu: `ui-ux-agent`)
- [ ] **[GÖREV-2002] Multi-Cluster Context Seçici:** Kullanıcının kubeconfig'indeki birden fazla cluster context'ini üst barda sekmeler halinde gösterme (`docker-desktop`, `minikube`, `prod-cluster`). (Sorumlu: `devops-agent` & `ui-ux-agent`)
- [ ] **[GÖREV-2003] Cilium Hubble / Istio Algılama:** Gelişmiş ağ modunu otomatik algılama ve sessiz fallback mekanizması. (Sorumlu: `networking-agent`)
- [ ] **[GÖREV-2004] Statik Maliyet Hesabı Tablosu:** Node instance tiplerine göre ($0.0416/saat) tahmini saatlik küme maliyeti gösterim panosu. (Sorumlu: `ui-ux-agent`)

---

## 🟢 Tamamlanan Görevler (Faz 1 - Faz 19)
- [x] **[GÖREV-1901..1904]** 3D HPA Ekstra Mobil Vinç (`HPAMobileCrane.jsx`), 3D Node Affinity Çizgileri (`NodeAffinityLines.jsx`) ve 3D PDB Bakım Bayrağı (`PDBMaintenanceFlag.jsx`). (Yapan: `3d-scene-agent`, `ui-ux-agent`)
- [x] **[GÖREV-1801..1804]** Ingress Deniz Feneri ve NetworkPolicy Bariyerleri. (Yapan: `networking-agent`, `3d-scene-agent`)
- [x] **[GÖREV-1701..1704]** 3D Anomali Efektleri (`CrashLoopBackOff`, `OOMKilled`, `NodeNotReady`). (Yapan: `3d-scene-agent`)
- [x] **[GÖREV-1601..1604]** Pod Silme/Restart mutasyonları, ConfirmationModal ve EventLogDrawer. (Yapan: `backend-agent`, `ui-ux-agent`)

---

## 🔴 Bekleyen / Sıradaki Fazlar
*Tüm 20 faz başarıyla tamamlanmak üzeredir!*
