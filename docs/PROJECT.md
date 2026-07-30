# PROJECT.md — Proje Vizyonu ve Genişletilmiş Kapsam

## 📌 Proje Adı: Tersane (K8s 3D Visualizer & Interactive Operator)

Tersane, Kubernetes kümelerini 3D canlı bir liman, yük gemileri, kargo konteynırları ve kontrol kulesi metaforuyla temsil eden ve güvenli müdahale imkanı sunan etkileşimli bir müfettiş platformudur.

---

## 🎯 Projenin Temel Sütunları

1. **3D Canlı Liman Simülasyonu:**
   - Worker Node'lar ➔ Yük Gemileri (Filo)
   - Pod'lar ➔ Kargo Konteynırları
   - Control Plane ➔ Yönetim Binası & Kontrol Kulesi
   - Kube-Scheduler ➔ Sarı Gantry Vinç
   - Kube-proxy ➔ Ağ Yönlendirme Binası ve Işıklı Parçacık Akış Hatları
2. **Güvenli Müdahale ve Mutasyonlar (v1.6+):**
   - Deployment Scale (replica artırma/azaltma)
   - Pod Silme ve Yeniden Başlatma
   - Global "Salt İzleme Modu" kilidi ve onay modalları
3. **Olay Günlüğü & Zaman Geçişi (In-Memory Ring Buffer):**
   - Son 1 saatin olay günlüğü (Event Log).
   - Olay üzerine tıklandığında nesneye kamera odağı ve tek seferlik dramatize animasyon (sürtünme, duman, patlama, denize atma).
4. **Anomali ve Alarm Dramatizasyonları:**
   - `CrashLoopBackOff`, `OOMKilled`, `ImagePullBackOff`, `Pending`, `Evicted`, `Node NotReady`, `Self-heal`, `Readiness fail` durumlarında anında ve olay günlüğünden tetiklenebilen 3D görsel efektler.
5. **Genişletilmiş K8s Nesne Seti (`METAPHOR.md`):**
   - Ingress, NetworkPolicy, ResourceQuota, HPA, PDB, Taints/Tolerations, Node Affinity, ServiceAccount, RBAC, EndpointSlice, Rolling Update, CRD/Operator, Helm Release.
