# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-017] Eksiksiz InfoCard Data-Binding Denetimi ve 3D Slot Grid Düzeni
- **Tarih:** 2026-08-04
- **Sorumlu Agent:** `web-frontend-agent` & `3d-graphics-agent`
- **Ne Yanlış Gitti?:** Sahnede seçilebilen 15 farklı 3D nesne tipinden sadece `SHIP`, `POD`, `SERVICEACCOUNT` ve `ROLE` için `<InfoCard>` içerik blokları tanımlanmıştı. `JOB`, `SECRET`, `CRANE`, `CONFIGMAP`, `PVC`, `PV`, `STATEFULSET`, `DAEMONSET`, `KUBELET`, `KUBE_PROXY`, `INGRESS` nesnelerine tıklandığında kart sadece başlık gösterip içi boş kalıyordu. Ayrıca sahneye iki adet Kube-Scheduler vinci render edilerek etiket ve kol çakışması yaratılmıştı.
- **Nasıl Düzeltildi?:** `<InfoCard>` içerisine 15 nesne tipinin tamamı için zengin detay, zaman damgası, güvenlik maskesi ve metrik blokları yazıldı. Pod kartı sekme butonları modern underline indicator tarzında TabBar ile yenilendi, kapatma (X) butonu %65 küçültüldü. Sahnede duplicate olan Scheduler vinci kaldırıldı ve Control Plane çevresindeki yardımcı nesneler için dairesel slot grid koordinatları tanımlandı.
- **Geleceğe Dönük Kural:** Sahnede tıklanabilir ve seçilebilir yapılan HER nesne tipi için `<InfoCard>` içerisinde karşılık gelen veri işleme bloğu yazılmak ve ELLE doğrulanmak zorundadır. Asla boş drawer gösterimine izin verilmez.

---

### 🔴 [DERS-016] Silme (DELETE) Event'lerinin Uçtan Uca Sınanması ve Client-Go Tombstone / Multi-Node Purge Zorunluluğu
- **Tarih:** 2026-08-03
- **Sorumlu Agent:** `k8 sn-backend-agent` & `web-frontend-agent`
- **Ne Yanlış Gitti?:** Pod'lar `kubectl delete pod` ile silindiğinde veya Deployment `--replicas=0` yapıldığında Pod'lar sahnede "Pending" durumunda hayalet olarak kalıyordu. Kök Neden: (1) Go backend'deki client-go Informer `DeleteFunc` callback'i `cache.DeletedFinalStateUnknown` tombstone yapılarını unwrap etmediği için silme olayları sessizce atlanıyordu, (2) Frontend state yönetimi `targetNode` drift nedeniyle silinen Pod'u sadece tek bir node'un dizisinde arıyordu.
- **Nasıl Düzeltildi?:** Backend'e tüm informer tipleri için tombstone unwrap yardımcıları eklendi. Frontend `ShipyardClusterContext.jsx` içerisinde silme ve güncelleme olaylarında silinen `podId` kümedeki TÜM node'ların dizilerinden temizlenecek şekilde jenerik silme mekanizması kuruldu.
- **Geleceğe Dönük Kural:** Silme (DELETE) event'leri, ADD/UPDATE ile aynı titizlikte uçtan uca (backend informer ➔ WebSocket ➔ frontend state) test edilmelidir. Sadece "nesne eklenince görünüyor mu" kontrol etmek yeterli değildir; "nesne silinince gerçekten kayboluyor mu" da HER yeni kaynak tipi eklendiğinde ayrı bir test senaryosu olmalıdır.

---

### 🔴 [DERS-015] Kapsamlı Çakışma Önleme ve Tüm Hareket Eden/Konumlanan Nesne Tiplerinin Gözden Geçirilmesi
- **Tarih:** 2026-08-03
- **Sorumlu Agent:** `3d-graphics-agent` & `web-frontend-agent`
- **Ne Yanlış Gitti?:** Önceki fazda çakışma önleme mantığı SADECE konteynır, vinç ve depo gibi alt nesnelere uygulanmış, gemilerin KENDİSİ (worker node'lar) unutulmuştu. Sonuç olarak devriye gezen gemiler birbirinin ve kara rıhtım binalarının içinden geçiyordu.
- **Nasıl Düzeltildi?:** `SHIP_DIMENSIONS` ve `HARBOR_DOCK_BOUNDS` sabitleri eklendi. Gemiler için kapalı devre devriye rotasında `phaseOffset = (shipIndex / totalShips) + timeOffset` faz farkı ve açık deniz yanaşma slotları (`calculateShipDockPosition`) kuruldu.
- **Geleceğe Dönük Kural:** Yeni bir yerleşim veya çakışma önleme kuralı eklenirken SADECE o an üzerinde çalışılan alt nesne tipi değil, sistemdeki TÜM hareket eden/konumlanan nesne tipleri (gemiler, şalupalar, binalar) bütüncül gözden geçirilmelidir.

---

### 🔴 [DERS-014] Anomali Tetikleme Canlı Pod İdentifier Eşleşmesi ve 3D Hover Tooltip Zorunluluğu
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `3d-graphics-agent` & `web-frontend-agent`
- **Ne Yanlış Gitti?:**
  1. Anomali simülasyonu butonuna basıldığında görsel duman/patlama/batma animasyonları tetiklenmiyordu. Kök neden: `CargoContainer` ve `CargoShip` bileşenlerinde anomali kontrolü `podData.id === 'pod-1'` ve `shipData.id === 'node-2'` gibi statik kukla verileri arıyordu; canlı kümeden `default/web-frontend-deploy-74b89` gibi gerçek Pod ID'leri geldiğinde karşılaştırma `false` dönerek görsel efekti çalıştırmıyordu.
  2. Sahnedeki bazı nesnelerin (Scheduler vinci, Ingress feneri, Kube-proxy istasyonu, Job şalupası, Secret kasası) ilk bakışta ne olduğunu açıklayan görsel etiketleri ve tooltip'leri eksikti.
- **Nasıl Düzeltildi?:**
  1. `CargoContainer` ve `CargoShip` anomali kontrolleri canlı küme Pod/Node ID'lerini ve indekslerini (`index === 0`, `shipIndex === 1`) dinamik hedefleyecek şekilde güncellendi. Butona tıklandığında anomali efekti, kamera odaklanması ve Olay Günlüğü kaydı kusursuz çalışmaktadır.
  2. `constants/descriptions.js` içerisine `OBJECT_DESCRIPTIONS` tooltip sözlüğü eklendi. `HoverTooltipOverlay.jsx` ile nesnelerin üzerine gelindiğinde imleç altında açıklayıcı dark-glassmorphism kutusu açılmaktadır.
  3. Kube-scheduler, Ingress, Kube-proxy, Job ve Secret nesnelerinin üzerlerine 3D visual metin etiketleri ve eksiksiz müfettiş döküm kartları bağlandı.
- **Geleceğe Dönük Kural:** 3D görsel efektler asla statik string karşılaştırmalarına dayanmamalıdır. Sahneye eklenen her nesne tipi için visual 3D metin etiketi, hover tooltip'i ve tıklama detay kartı zorunlu olarak birlikte eklenmelidir.

---

### 🔴 [DERS-013] 3D Nesne Çakışmaları ve Katmanlı (Tier-based) Grid Yerleşimi
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `3d-graphics-agent`
- **Ne Yanlış Gitti?:** Pod konteynırları ve karadaki liman yapıları sabit/tahmini koordinatlarla yerleştirildiği için nesneler iç içe geçiyordu.
- **Nasıl Düzeltildi?:** `constants/dimensions.js` ile merkezi boyut sabitleri ve `calculateContainerDeckPosition` dikey katmanlama (tier-based grid) algoritması kuruldu.

## 2026-10-24 — Dünya etkileşimi ve doğrulama

- CSS selector listesinde `[data-autofocus],button,input` öncelik belirtmez; DOM’daki ilk eşleşmeyi seçer. Bulucu odak hedefi ayrı sorguyla önce seçilmelidir.
- Container üst merkezinin ekrana projeksiyonu, tıklanabilir olduğunun kanıtı değildir. Gerçek vinç kirişi/trolley bu noktayı örtebilir; raycast ile görünür yüzey ve parked crane mekaniği doğrulanmalıdır.
- Form stepper içindeki label, ilk button’a bağlanabilir. Numeric input’un erişilebilir adı ayrıca doğrulanmalıdır.
- Mutasyonun API tarafından kabul edilmesi gözlenen sonuç değildir; UI ve test bekleyişi aynı UID/generation/replica üzerinden kurulmalıdır.

- Dünya üzerindeki bildirim rozetinin yalnız z-index'ini artırmak yeterli değildir: Node paneli ile aynı köşedeki denetim tıklanamaz kalabilir. Panel açıkken rozeti boş köşeye taşı; alt sheet'te üstte tut.
- WebGL kaybı gerçek WEBGL_lose_context ile iki tarayıcıda sınandı; semantik Bul → aynı Node paneli yolu GPU'dan bağımsız kalmalı.

- Su, PlaneGeometry'den özel BufferGeometry'ye geçtiğinde kamera fit'i20km denizi model sınırı sanabilir. Fit'te su/izleri dışla; gemi kapsüllerinin seyir rotası örneklerini bilinçli ekle.
- Birleşme için yalnız o anki iki gemi aralığı yeterli değildir: manevra boyunca ana rotada sanal bir lider/rezervasyon gerekir. Uzun test bu eksikliği yakaladı.
- 'Diğer yedi gemi ilerliyor' başarı ölçütü, bir geminin sürekli beklemesini gizleyebilir. Her UID'nin tekrar seyire dönmesini doğrula. Dış yanaşma sütunlarında kıç açıklığını, interpolasyon boyunca bütün gövdeyle test et; önce düz çık, sonra dön.
- Uzun GPU benchmark'ını HMR'den ve paralel tarayıcıların/natif fare olaylarının ölçüm kontrollerini değiştirmesinden ayır. Ham renderer, görünen kaynak sayısı ve açık/kapalı etkileri kaydet.

- Playwright, Chromium ana oturumunda focus emulation açar; ikinci CDP oturumundan kapatmak gerçek görünmezlik sağlamayabilir. Native geçici profili connectOverCDP(noDefaults:true) ile bağlayıp document.hidden değerini gerçekten doğrula. Başarısız görünmezlik denemesini geçmiş sonuçtan silme veya başarı gibi adlandırma.
