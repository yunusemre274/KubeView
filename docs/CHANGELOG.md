# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

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
