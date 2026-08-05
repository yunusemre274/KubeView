# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

## [1.0.0] - 2026-08-05

### 🚀 Kararlı Sürüm Yayın Özeti (v1.0.0 Release Summary)
- **Gerçek Zamanlı 3D Liman Motoru:** Kubernetes cluster nesnelerini (Node, Pod, Deployment, StatefulSet, DaemonSet, Job, ConfigMap, Secret, PVC/PV, Ingress, NetworkPolicy, RBAC, Kubelet, Kube-proxy) somut ve etkileşimli bir tersane simülasyonu olarak sunar.
- **Sıfır Gecikmeli Canlı Senkronizasyon:** `client-go` Informer & Watch entegrasyonu ile WebSocket canlı veri yayın hattı. Pod silme/scale durumlarında tombstone unwrap & multi-node purge garantisi.
- **Tüm Nesne Tiplerinin Zengin İnceleme Kartları:** Sahnede seçilen 15 nesne tipinin tamamı için zengin metrik, IP/DNS, zaman damgası ve bağımlılık kartları.
- **Canlı Log Streaming & Metrik Trend Grafikleri:** Anlık Pod log yayınlayıcısı, CPU/RAM canlı sparkline'ları ve 1 saatlik ring buffer grafik dökümü.
- **Güvenli Mutasyon İşlemleri:** Salt İzleme Modu (Read-Only Mode) anahtarı, kilitli namespace koruması ve onay modalı doğrulaması.
- **Kubeconfig Auto-Heal Altyapısı:** minikube / local k8s yeniden başlatmalarında dinamik port sapmalarını 3 deneme sonrası otomatik algılama ve canlı bağlanma.

### 📋 Bilinen Sınırlamalar / v1.1 İçin Planlanan (Known Limitations)
- **Container Terminal / Exec Erişimi:** İnteraktif container shell (exec) erişimi v1.0.0 güvenlik sınırı nedeniyle kapsam dışı tutulmuştur (v1.1 roadmap).
- **Canlı Inline YAML Düzenleyici:** Canlı küme durumunu doğrudan text düzenleme ile değiştirme riski nedeniyle kısıtlanmıştır; mutasyonlar güvenli buton ve modal ile yapılmaktadır.
- **Web Audio Sesli Anons Efektleri:** Olay günlüğü sesli anons entegrasyonu varsayılan olarak sessizdir; görsel uyarı ışıkları ve anons bantları aktiftir.

---

## [v3.4.0 - 3D Obje İnceleme, InfoCard Yenileme, Çakışma Önleme & Vinç Yönetimi] - 2026-08-04

### Düzeltilen Hatalar ve İyileştirmeler (Sorun 1, 2, 3 & 4 Fixes)
- **Eksiksiz InfoCard Obje Kartları (Sorun #1 Fix):** Sahnede seçilebilen 15 farklı nesne tipinin (`JOB`, `SECRET`, `CRANE`, `CONFIGMAP`, `PVC`, `PV`, `STATEFULSET`, `DAEMONSET`, `KUBELET`, `KUBE_PROXY`, `INGRESS`, `SHIP`, `POD`, `SERVICEACCOUNT`, `ROLE`) tamamı için zengin detay, zaman damgası, güvenlik maskesi ve metrik blokları eklendi. Hiçbir 3D nesnede boş kart kalmadı.
- **Modern Underline Indicating TabBar (Sorun #2 Fix):** Pod detay panelindeki hantal kutu butonlar kaldırıldı, kehribar ve gökyüzü mavisi alt çizgi vurgulu modern `TabBar` tasarımı uygulandı.
- **Kapatma (X) İkonu Boyut Ayarı (Sorun #3 Fix):** Müfettiş çekmecesinin sağ üstündeki X ikonu, panel başlık boyutuyla orantılı sleek 14px (%65 visual alan) boyutuna indirildi.
- **3D Slot Grid & Çakışma Önleme (Sorun #4 Fix):** Sahnedeki ikinci duplicate Kube-Scheduler vinci kaldırıldı (Kubernetes mimarisine uygun olarak TEK aktif scheduler vinci bırakıldı). Control Plane çevresindeki `ConfigMap`, `Secret` ve `Kube-Proxy` nesneleri için dairesel, çakışmayan 3D slot koordinatları kuruldu. 3D metin etiketlerinin derinlik çakışması engellendi.
- **Dokümantasyon:** `docs/LESSONS.md` (DERS-017) ve `AGENTS/AGENTS.md` (Kural 15) güncellendi.

---

## [v3.3.0 - Hayalet Pod Düzeltmesi & Anlık Deployment Adı Çözümlemesi] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler (Sorun 1 & 2 Fixes)
- **Silinen Hayalet Pod'lar Onarımı (Sorun #1 Fix):**
  1. Go backend informer `DeleteFunc` handler'larına `cache.DeletedFinalStateUnknown` tombstone unwrap mantığı (`unwrapPod`, `unwrapNode`, `unwrapDeployment` vb.) eklendi. Client-go silme paketlerinin sessizce yutulması engellendi.
  2. `ShipyardClusterContext.jsx` içerisinde `processResourceEvent` fonksiyonunda Pod silme ve güncelleme olaylarında `podId` nesnesi kümedeki TÜM node'ların dizilerinden temizlenecek jenerik harita filtresine çevrildi (`targetNode` adres sapmalarında sahnede kalan hayalet Pod'lar %100 temizlendi).
- **Pending & Anlık Deployment Adı Çözümlemesi (Sorun #2 Fix):**
  1. Backend `handlePodEvent` fonksiyonunda `ref.Kind == "ReplicaSet"` olduğunda `ownerKind` doğrudan `"Deployment"` olarak set edildi.
  2. Informer cache sync gecikmelerinde veya Pod henüz `Pending` durumundayken ReplicaSet isminden trailing hash kısmını kesen `extractDeploymentName(rsName)` fallback fonksiyonu yazıldı (`scale-test-574647494` ➔ `scale-test`). Pod kartlarında ham hash'li Pod isminin görünmesi kesin olarak engellendi.
- **Dokümantasyon:** `docs/LESSONS.md` (DERS-016) ve `AGENTS/AGENTS.md` (Kural 14) güncellendi.

---

## [v3.2.0 - İş Yükü Denetim İyileştirmeleri & Owner Zinciri Çözümlemesi] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler (Denetim Raporu Referanslı)
- **Pod ➔ ReplicaSet ➔ Deployment Owner Zinciri (Düzeltme #1 Fix):** Go backend `Watcher` yapısına `ReplicaSet` SharedInformer'ı eklendi (`factory.Apps().V1().ReplicaSets().Informer()`). Pod `OwnerReferences[0]` bir ReplicaSet olduğunda bellekteki bu harita üzerinden üst `Deployment` ismi çözümlenerek Pod bilgi kartında `Owner: Deployment: web-frontend-deploy (RS: web-frontend-deploy-74b89ff448)` şeklinde gösterilmesi sağlandı.
- **Yönetim Binası Canlı Deployment Verisi (Düzeltme #2 Fix):** `MasterDashboardOverlay.jsx` içindeki `mockDeployments` dizisi kaldırıldı. "SEFERLER" sekmesi WebSocket üzerinden gelen canlı `deployments` verisine bağlandı (name, namespace, ready/desired replicas, image, strategy). Cluster'da Deployment yoksa `"Bu cluster'da tanımlı Deployment yok"` mesajı render ediliyor.
- **Bağımsız (Orphan) Pod Fallback Düzeltmesi (Düzeltme #3 Fix):** `len(pod.OwnerReferences) == 0` olan sahipsiz Pod'lar için backend fallback değeri `"Deployment"` yerine `"Standalone"` (Bağımsız Palet) olarak güncellendi. Frontend Pod kartında `Owner: Yok (Bağımsız Palet)` metni eklendi.
- **Dokümantasyon & ADR:** `docs/DECISIONS.md` (ADR-025) ve `METAFOR.md` güncellendi.

---

## [v3.1.0 - Tipografi Ölçeği, Gemi Çakışma Önleme Motoru & Ortak InfoCard Mimarisi] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler
- **Merkezi Tipografi Ölçeği (Sorun #1 Fix):** `frontend/src/index.css` dosyasına kök CSS custom properties (`--font-size-title-lg`, `--font-size-body`, `--font-size-label`, `--font-size-btn`) eklendi. Tüm panel başlıkları (%80), veri satırları (%75) ve buton metinleri (%80) netliği bozulmadan compact oranlara küçültüldü.
- **Gemi & Liman Çakışma Önleme Algoritması (Sorun #2 Fix):** `frontend/src/constants/dimensions.js` içerisine `SHIP_DIMENSIONS` (9.0m x 1.8m x 28.0m) ve `HARBOR_DOCK_BOUNDS` (`x >= 4.0`) sabitleri eklendi. `calculateShipPatrolPosition` fonksiyonu ile açık deniz devriye rotasında çalışan gemilere `phaseOffset = (shipIndex / totalShips) + timeOffset` faz farkı ve `calculateShipDockPosition` ile güvenli yanaşma slotları atandı. 1, 2, 5 veya 10 gemi olduğunda gemilerin birbirine ve rıhtım binalarına çarpışması %100 engellendi.
- **Ortak InfoCard İskelet Bileşeni (Sorun #3 Fix):** `frontend/src/components/InfoCard.jsx` bileşeni oluşturuldu. Tüm nesne detay kartları (Node, Pod, ServiceAccount, Role vb.) Header (Başlık + Durum Rozeti) ➔ Divider ➔ Bölüm Grupları ➔ İki Sütunlu Hizalı Etiket-Değer Satırları ➔ Aksiyon Butonları şablonuna dönüştürüldü.
- **Dokümantasyon & Kurallar:** `docs/ARCHITECTURE.md`, `docs/LESSONS.md` (DERS-015) ve `AGENTS/AGENTS.md` (Kural 13) güncellendi.

---

## [v3.0.0 - Sıfırdan Kurulum & Onboarding Denetim Düzeltmeleri] - 2026-08-03

### Düzeltilen Hatalar ve İyileştirmeler (ONBOARDING-AUDIT.md Referanslı)
- **#1 Static File Server Handler (Kritik #1 Fix):** `backend/main.go` dosyasına `./public`, `/app/public` ve `../frontend/dist` dizinlerini dinleyen `http.FileServer` eklendi.
- **#2 RBAC İzin Genişletmesi (Kritik #2 Fix):** `deploy/rbac.yaml` ve `charts/tersane/templates/rbac.yaml` manifestlerine tüm 3D izlenen kaynaklar için salt-okunur izinler eklendi.
