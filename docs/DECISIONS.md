# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Bu belge, Tersane projesinde alınan kritik teknik ve mimari kararların gerekçelerini saklar. Kararlar silinmez; güncellenen kararlar eski referanslarıyla açıkça işaretlenir.

---

## 📌 ADR-001...009 (Önceki Kabul Edilen Kararlar)
- ADR-001...008 (Go Backend, Informer/Watch, Read-Only RBAC, Tam 3D, etcd Kaptan/Kubelet Dümenci, Auto Port, UI/UX 60 FPS, Katman Ayrımı).
- ADR-009 (Canlı Low-Poly 3D Liman Simülasyonu ve İnteraktif Kamera Lerp Mimarisi).

---

## 📌 ADR-010: Varsayılan %100 3D Sahne, Dikey K8s Bilgi Kartı Çekmecesi ve Zenginleştirilmiş Liman Mimarisi
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `ui-ux-agent` & `architecture-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Önceki tasarımda üst header panelleri üst üste binmiş ve sayaç kartları sahneyi daraltmıştı.

### Alınan Karar
1. **Varsayılan %100 3D Canvas:** Ekranda kalıcı büyük paneller/header'lar tamamen kaldırıldı. Sol üstte sadece %3-4 yer kaplayan minimal logo rozeti bırakıldı.
2. **Sağ Dikey K8s Bilgi Kartı (%100 Height, ~%15 Width):** Nesneye tıklandığında sağ tarafta tam yükseklikte dikey bir şerit açılır. Kapatılınca sahne tekrar tam ekran olur.
3. **Nesneye Özel K8s Şeması:** Tıklanan 3D nesnenin tipine göre (Pod/Container, Worker Node, Control Tower Master Node, Crane/Scheduler, Kube-proxy) Kubernetes standartlarına uygun özel veri kartı gösterilir.
4. **Zenginleştirilmiş Liman Mimarisi:** Çoklu gantry vinçler, karada bekleyen konteynır yığınları (Pending Pods) ve namespace renkli depolar eklendi.

### Sonuç ve Etki
- 3D sahne tam ekran ferahlığına kavuştu; K8s bilgi derinliği profesyonel seviyeye yükseltildi.
