# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 26)
- **Faz 1-15:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 16-20:** Mutasyon İzinleri, Anomali Dramatizasyonları, Ingress Deniz Feneri, NetworkPolicy Bariyerleri, HPA Mobil Vinçler, Cilium Hubble eBPF, Multi-Cluster Seçici, PNG Export, Statik Maliyet Tablosu, Top Navbar Çakışma Düzeltmesi (`LESSON-008`).
- **Faz 21: Canlı Pod Log Görüntüleyici (`v2.2.0`)**
- **Faz 22: ConfigMap & Secret Güvenli İçerik Müfettişi (`v2.3.0`)**
- **Faz 23: PVC & PersistentVolume Depolama Müfettişi (`v2.4.0`)**
- **Faz 24: İş Yükü Tipi Ayrımı: StatefulSet, DaemonSet, Job & CronJob (`v2.5.0`)**
- **Faz 25: RBAC İlişkisel İnceleme ve Güvenlik Rozetleri (`v2.6.0`)**
- **Faz 26: Zaman İçindeki Kaynak Kullanım Trend Grafiği (`v2.7.0`)**
  - Node kartında CPU/RAM mini SVG sparkline trend grafiği.
  - Sparkline'a tıklayınca açılan eksenli, dual trend çizgili (CPU/RAM) ve hover tooltip'li detaylı grafik modalı.
  - Yönetim Binası panelinde küme geneli canlı yük trend grafiği.
  - 3D WebGL render döngüsünden bağımsız, 60 FPS koruyan hafif SVG çizimi.
  - Yetersiz veri birikiminde `"⏳ Veri toplanıyor... (Xdk/60dk)"` durum bildirimi.
  - Sadece bellek-içi (son 1 saatlik) ring buffer, kalıcı veritabanı yok (KISS ilkesi).

---

## 🟢 Kabul Kriterleri Doğrulaması (Faz 26)
- [x] Node kartında CPU/RAM için mini sparkline trend grafiği görünüyor.
- [x] Sparkline'a tıklayınca/genişletilince daha detaylı, eksenli bir grafik açılıyor.
- [x] Yönetim Binası panelinde cluster geneli kaynak trend grafiği var.
- [x] Grafikler 3D sahnenin performansını (frame rate) düşürmüyor.
- [x] Henüz yeterli veri birikmemişken boş grafik yerine net bir "veri toplanıyor" durumu gösteriliyor.
- [x] Veri sadece bellekte, son 1 saatlik ring buffer olarak tutuluyor, kalıcı depolama eklenmiyor.
