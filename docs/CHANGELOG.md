# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v3.0.0 - Sıfırdan Kurulum & Onboarding Denetim Düzeltmeleri] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler (ONBOARDING-AUDIT.md Referanslı)
- **#1 Static File Server Handler (Kritik #1 Fix):** `backend/main.go` dosyasına `./public`, `/app/public` ve `../frontend/dist` dizinlerini dinleyen `http.FileServer` eklendi. Docker ve K8s deployment'ında `http://localhost:8000/` üzerinden derlenmiş 3D React SPA uygulaması 404 hatası olmadan tek servis olarak sunulmaktadır.
- **#2 RBAC İzin Genişletmesi (Kritik #2 Fix):** `deploy/rbac.yaml` ve `charts/tersane/templates/rbac.yaml` manifestlerine `configmaps`, `secrets`, `ingresses`, `jobs`, `cronjobs`, `horizontalpodautoscalers`, `serviceaccounts`, `roles`, `rolebindings`, `clusterroles`, `clusterrolebindings`, `persistentvolumeclaims`, `persistentvolumes`, `customresourcedefinitions` için salt-okunur (`get/list/watch`) izinleri eklendi. In-cluster `403 Forbidden` riski tamamen ortadan kaldırıldı.
- **#3 & #4 README Dokümantasyon İyileştirmeleri (Orta #3 & #4 Fix):** `README.md` içerisindeki GitHub URL'leri lokal göreli yollarla (`deploy/rbac.yaml`) değiştirildi. Manuel K8s manifest adımları ve Helm Chart kurulum bölümü (`helm install tersane ./charts/tersane`) ayrı başlıklar altında eklendi.
- **#5 Environment Değişkenleri Temizliği (Düşük #5 Fix):** `README.md` konfigürasyon tablosundan koda karşılığı olmayan `ENABLE_METRICS`, `METRICS_INTERVAL` ve `LOG_LEVEL` satırları kaldırıldı; aktif olan `PORT`, `WATCH_NAMESPACE`, `KUBECONFIG` ve `STATIC_DIR` korundu.
- **#6 Güncel Yol Haritası (Düşük #6 Fix):** README Roadmap bölümü güncellendi; StatefulSet, DaemonSet, HPA, ConfigMap, Secret, Ingress, PV/PVC ve Trend Grafikleri `[x]` olarak işaretlendi.
- **#7 Tek Komutla Paralel Başlatma (Orta #7 Fix):** Kök dizine `start.sh` ve `Makefile` eklendi. `make dev` veya `./start.sh` ile backend ve frontend lokalde tek komutla paralel başlatılabilmektedir.
- **#8 Port Tarama Eşitlemesi (Düşük #8 Fix):** `ShipyardClusterContext.jsx` içerisindeki WebSocket `maxPort` scanner sınırı backend ile eşitlenerek `8020` yapıldı.
- **#9 Bağlantı Kopukluğu Alert Overlay (Orta #9 Fix):** Backend kapalıyken veya bağlantı koptuğunda `ShipyardScene.jsx` üzerinde "⚠️ KUBERNETES BACKEND SUNUCUSUNA BAĞLANILAMADI" banner'ı ve "Yeniden Dene" butonu render edildi. Header'a "CANLI STREAM / BAĞLANTI KOPUK" durum rozeti eklendi.
- **#10 Kozmetik Küme Seçim Rozeti (Düşük #10 Fix):** Header cluster seçim kutusunun yanına `⚡ UI Önizleme` etiketi eklendi.
- **#11 Karşılama & Onboarding Modalı (Düşük #11 Fix):** `OnboardingWelcomeModal.jsx` oluşturuldu. İlk kez giren kullanıcıya 3 adımlık metafor ve kullanım rehberi sunulmakta, header'daki `❓ YARDIM` ikonu ile her zaman tekrar açılabilmektedir.

---

## [v2.10.0 - Anomali Canlı Hedefleme & 3D Nesne Hover Tooltip Sistem] - 2026-07-31

### Düzeltilen Hatalar ve Eklenen Özellikler
- **Anomali Simülasyonu Düzeltmesi:** Anomali simülasyonlarının canlı K8s Pod/Node verileri üzerinde çalışmama sorunu giderilmiştir. ID karşılaştırmaları canlı verileri ve indeksleri hedefleyecek şekilde güncellendi.
- **3D Nesne Visual Etiketleri & Hover Tooltip Sistem:** Visual 3D metin etiketleri (`<Text>`) ve `HoverTooltipOverlay.jsx` entegre edildi.
