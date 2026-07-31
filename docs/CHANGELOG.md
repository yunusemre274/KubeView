# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v2.9.0 - 3D Boyut Sabitleri & Katmanlı Grid İstifleme Düzeni] - 2026-07-31

### Düzeltilen Hata ve İyileştirmeler
- **3D Çakışmaların Giderilmesi ve Sıfır Kesişim:** Gemi güvertesindeki Pod konteynırları ve karadaki liman yapıları (vinçler, depolar, kuleler) arasındaki görsel iç içe geçme ve çakışma sorunları giderilmiştir.
- **Eklenen Bileşen ve Mimari:**
  - **`frontend/src/constants/dimensions.js`**: Tüm 3D nesnelerin fiziksel bounding boyutları (`WIDTH`, `HEIGHT`, `LENGTH`) ve aralık sabitleri (`GAP_X`, `GAP_Z`, `GAP_Y`) merkezi dosya altında toplandı.
  - **Katmanlı Dikey Grid İstifleme Algoritması (`calculateContainerDeckPosition`)**: Gemi güvertesindeki Pod konteynırları 2 sütunlu X dizilimi, 3 sıralı Z sınırlaması ve güverte kapasitesi dolduğunda Y ekseninde dikey katmanlı (tier-based vertical stacking) istifleme algoritması ile yerleştirildi.
  - **Liman Yapıları Emniyet Mesafesi:** Karadaki vinçler, depolar, kuleler ve bağlantı hatları bounding box emniyet alanlarına göre yeniden konumlandırıldı.

---

## [v2.8.1 - 3D Canvas Context Loss & Geometri Düzeltmesi] - 2026-07-31

### Düzeltilen Hata
- **R3F Geometri Hatası ve WebGL Context Loss:** `StorageDepotMesh.jsx` bileşeninde Three.js tarafında karşılığı olmayan `<prismGeometry>` JSX etiketi kullanılması nedeniyle R3F'in istisna fırlatıp WebGL canvas context'ini düşürdüğü hatası giderildi.
- **Çözüm:** Oluklu ambar çatısı Three.js'in yerleşik 4-segmentli `<coneGeometry args={[4.6, 1.8, 4]} rotation={[0, Math.PI / 4, 0]}>` Beşik Çatı geometrisi ile değiştirildi.
