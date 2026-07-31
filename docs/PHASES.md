# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 25)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 16-20:** Mutasyon İzinleri, Anomali Dramatizasyonları, Ingress Deniz Feneri, NetworkPolicy Bariyerleri, HPA Mobil Vinçler, Cilium Hubble eBPF, Multi-Cluster Seçici, PNG Export, Statik Maliyet Tablosu, Top Navbar Çakışma Düzeltmesi (`LESSON-008`).
- **Faz 21: Canlı Pod Log Görüntüleyici (`v2.2.0`)**
- **Faz 22: ConfigMap & Secret Güvenli İçerik Müfettişi (`v2.3.0`)**
- **Faz 23: PVC & PersistentVolume Depolama Müfettişi (`v2.4.0`)**
- **Faz 24: İş Yükü Tipi Ayrımı: StatefulSet, DaemonSet, Job & CronJob (`v2.5.0`)**
- **Faz 25: RBAC İlişkisel İnceleme ve Güvenlik Rozetleri (`v2.6.0`)**
  - Her Pod kartında tıklanabilir ServiceAccount kimlik kartı ve bağlı rol isimleri.
  - ServiceAccount çekmecesinde bağlı binding'ler, hedef roller ve kullanan Pod'lar listesi.
  - Role/ClusterRole çekmecesinde ham YAML yerine okunabilir **TANIMLI İZİNLER Tablosu** (Resource + Verbs).
  - Yönetim Binası panelinde küme geneli RBAC sayıları özeti.
  - Aşırı yetkili ServiceAccount'lar için (`cluster-admin` bağlı) belirgin kırmızı güvenlik uyarı rozeti (`⚠️ AŞIRI YETKİLİ SERVICEACCOUNT`).

---

## 🟢 Kabul Kriterleri Doğrulaması (Faz 25)
- [x] Her Pod kartında hangi ServiceAccount ile çalıştığı ve bağlı Role/ClusterRole isimleri görünüyor.
- [x] ServiceAccount'a tıklanınca bağlı binding'ler ve kullanan Pod'lar listeleniyor.
- [x] Role/ClusterRole'e tıklanınca izinler (resource + verb) okunabilir bir tabloda gösteriliyor, ham YAML değil.
- [x] Yönetim Binası panelinde cluster geneli RBAC özeti var.
- [x] Aşırı geniş yetkili (örn. cluster-admin bağlı) ServiceAccount'lar görsel olarak öne çıkarılıyor.
