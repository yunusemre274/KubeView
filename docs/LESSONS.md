# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-013] 3D Nesne Çakışmaları ve Katmanlı (Tier-based) Grid Yerleşimi
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `3d-graphics-agent`
- **Ne Yanlış Gitti?:** Gemi güvertesindeki Pod konteynırları ve karadaki liman yapıları (vinçler, depolar, kuleler) sabit/tahmini koordinatlarla yerleştirildiği için, kaynak sayısı (Pod/Node) arttıkça nesnelerin birbirinin içine geçtiği ve gemi yaşam mahalliyle çakıştığı görüldü.
- **Kök Neden:** Nesnelerin gerçek fiziksel bounding kutu boyutları (genişlik, yükseklik, derinlik) hesaba katılmadan tek boyutlu sıradan dizilim yapılması.
- **Nasıl Düzeltildi?:**
  1. `frontend/src/constants/dimensions.js` oluşturularak tüm 3D nesnelerin gerçek bounding boyutları ve güvenlik mesafeleri (gap/margin) merkezi sabitler olarak tanımlandı.
  2. Pod konteynırları için `calculateContainerDeckPosition(index)` fonksiyonu yazıldı. 2 sütunlu X dizilimi, 3 sıralı Z sınırlaması ve güverte dolduğunda Y ekseninde dikey katmanlı (tier-based vertical stacking) istifleme algoritması kuruldu.
  3. Karadaki liman yapıları (StorageDepotMesh, IngressLighthouse, KubeProxy, GantryCrane) bounding kutu boyutlarına göre aralarında emniyetli boşluklar bırakılarak yeniden konumlandırıldı.
- **Geleceğe Dönük Kural:** 3D nesneler asla tahmini/sihirli sayılarla yerleştirilmemeli; gerçek boyut sabitleri ve index'e dayalı grid algoritmaları ile konumlandırılarak sıfır çakışma garantilenmelidir.

---

### 🔴 [DERS-012] R3F Geometri Nesnesi Uyumsuzluğu (<prismGeometry>) ve WebGL Context Loss
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `3d-graphics-agent`
- **Ne Yanlış Gitti?:** `StorageDepotMesh.jsx` bileşeninde oluklu ambar çatısını çizmek için `<prismGeometry>` adında bir JSX etiketi kullanılmıştı. R3F istisna fırlatıp WebGL renderer context'ini düşürüyordu (`Context Lost`).
- **Nasıl Düzeltildi?:** Oluklu çatı geometrisi Three.js'in yerleşik 4 segmentli `<coneGeometry args={[4.6, 1.8, 4]} rotation={[0, Math.PI / 4, 0]}>` Beşik Çatı geometrisi ile değiştirildi.

---

### 🔴 [DERS-011] Çoklu WebSocket Bağlantısı ve Modül Seviyesi Singleton Çözümü
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `web-frontend-agent`
- **Ne Yanlış Gitti?:** Uygulama açıldığında backend loglarında aynı anda 4 ayrı WebSocket istemcisinin bağlandığı görüldü.
- **Nasıl Düzeltildi?:** Modül seviyesinde TEK bir `singletonManager` nesnesi tanımlanarak `ShipyardClusterProvider` ile tüm bileşenlere dağıtıldı.
