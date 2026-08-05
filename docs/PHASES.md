# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 28)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 16-20:** Mutasyon İzinleri, Anomali Dramatizasyonları, Ingress Deniz Feneri, NetworkPolicy Bariyerleri, HPA Mobil Vinçler, Cilium Hubble eBPF, Multi-Cluster Seçici, PNG Export, Statik Maliyet Tablosu, Top Navbar Çakışma Düzeltmesi (`LESSON-008`).
- **Faz 21: Canlı Pod Log Görüntüleyici (`v2.2.0`)**
- **Faz 22: ConfigMap & Secret Güvenli İçerik Müfettişi (`v2.3.0`)**
- **Faz 23: PVC & PersistentVolume Depolama Müfettişi (`v2.4.0`)**
- **Faz 24: İş Yükü Tipi Ayrımı: StatefulSet, DaemonSet, Job & CronJob (`v2.5.0`)**
- **Faz 25: RBAC İlişkisel İnceleme ve Güvenlik Rozetleri (`v2.6.0`)**
- **Faz 26: Zaman İçindeki Kaynak Kullanım Trend Grafiği (`v2.7.0`)**
- **Faz 27: Otomatik Kubeconfig Port Değişimi Algılama ve Yeniden Bağlanma (`v2.8.0`)**
- **Faz 28: Tersane v1.0.0 Kararlı Sürüm (Stable Release) & Kapsamlı Regresyon Denetimi (`v1.0.0`)**
  - Tüm 3D ve 2D kaynak tiplerinin (Node, Pod, Deployment, StatefulSet, DaemonSet, Job, ConfigMap, Secret, PVC/PV, Ingress, NetworkPolicy, Kubelet, Kube-proxy, RBAC) %100 canlı veri kartı doğrulaması.
  - Pod silme/scale live sync ve client-go tombstone unwrapping doğrulaması.
  - Secret verileri masked-only güvenlik kuralı doğrulaması.
  - Temiz derleme (`go build`, `npm run build`, `go test ./...`) ve v1.0.0 release etiketlemesi.

---

## 🟢 Kabul Kriterleri Doğrulaması (v1.0.0 Release)
- [x] Tüm 3D nesne ve liman yapıları tıklanabilir, zengin ve hatasız bilgi kartı sunuyor.
- [x] Standart Kubernetes araçları (kubectl, Dashboard) ile kıyaslandığında kritik hiçbir eksiklik bulunmuyor.
- [x] Derlemeler (`go build ./...` ve `npm run build`) ve birim testler sıfır hata ile tamamlanıyor.
- [x] `v1.0.0` git release tag'i başarıyla oluşturuldu.
