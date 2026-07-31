# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v2.3.0 - ConfigMap & Secret Güvenli İçerik Müfettişi] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde ConfigMap (sevkiyat föyü) ve Secret (kilitli kasa) nesnelerinin 3D sahnede veya panellerde henüz hiçbir görsel karşılığının ve içerik müfettişinin bulunmadığı tespit edilmiştir.
- **Eklenen Özellik:** ConfigMap'ler için tam key-value gösterimi, Secret'lar için ise kesinlikle değer çekmeyen/göstermeyen, sadece key isimleri ve `••••••••` maskeli görsel temsil sunan 3D Sevkiyat Pano'su, 3D Kilitli Çelik Kasa ve Güvenli Müfettiş Çekmecesi kurulmuştur.

---

## [v2.2.0 - Canlı Pod Log Görüntüleyici] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Proje kod tabanında yapılan incelemede, Pod/Container bilgi kartında log verisi gösterilmediği ve backend tarafında `CoreV1().Pods(ns).GetLogs()` endpoint'ine bağlanan bir endpoint bulunmadığı tespit edilmiştir.
- **Eklenen Özellik:** Kubernetes `CoreV1().Pods(ns).GetLogs()` API'si üzerinden `follow=true` canlı WebSocket log akışı (`/api/v1/pods/logs/stream`) ve frontend'de container seçimli, auto-scroll duraklatmalı, regex hata vurgulamalı terminal log görüntüleyicisi kurulmuştur.

---

## [v2.0.0 Pro - Faz 20 Hubble, Multi-Cluster, PNG Export & Cost Release] - 2026-07-30

### Eklendi / Düzeltildi
- **3D Ekran Görüntüsü PNG Export:** Sağ üst bara `📸 PNG İNDİR` butonu yerleştirildi; 3D canvas görüntüsü anında `tersane-3d-shipyard-[context].png` olarak indirilir.
- **Multi-Cluster Context Seçici:** Sol üst bara `minikube`, `docker-desktop` ve `prod-cluster` bağlam geçiş sekmeleri yerleştirildi.
- **Cilium Hubble eBPF Algılama:** Kube-proxy müfettiş çekmecesine gelişmiş `🐝 CILIUM HUBBLE eBPF MODE` trafik gözlemcisi rozeti bağlandı.
- **Statik Maliyet Tablosu:** Node müfettiş çekmecesinde `💵 TAHMİNİ STATİK MALİYET` ($0.0416/saat, ~$30/ay) hesaplama paneli yerleştirildi.

---

## [v1.10.0 - Faz 19 HPA Mobile Crane, Node Affinity & PDB Release] - 2026-07-30
- 3D HPA Ekstra Mobil Vinç, 3D Node Affinity Çizgileri ve PDB Bakım Bayrağı eklendi.
