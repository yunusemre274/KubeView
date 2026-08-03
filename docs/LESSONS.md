# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

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
