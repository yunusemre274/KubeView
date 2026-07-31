# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v2.10.0 - Anomali Canlı Hedefleme & 3D Nesne Hover Tooltip Sistem] - 2026-07-31

### Düzeltilen Hatalar ve Eklenen Özellikler
- **Anomali Simülasyonu Düzeltmesi:** Anomali simülasyonlarının canlı K8s Pod/Node verileri üzerinde çalışmama sorunu giderilmiştir. ID karşılaştırmaları canlı verileri ve indeksleri hedefleyecek şekilde güncellendi. Buton seçimiyle duman, patlama, alazlanma ve gemi batma animasyonları, kamera odaklanması ve Olay Günlüğü kaydı kusursuz çalışmaktadır.
- **3D Nesne Visual Etiketleri & Hover Tooltip Sistem:**
  - **`frontend/src/constants/descriptions.js`**: `OBJECT_DESCRIPTIONS` tooltip sözlüğü oluşturuldu.
  - **`frontend/src/components/3d/HoverTooltipOverlay.jsx`**: Nesnelerin üzerine gelindiğinde imleç altında beliren hafif dark-glassmorphism tooltip kutusu eklendi.
  - **Visual 3D Etiketler & Detay Kartları**: Kube-scheduler (vinç), Ingress Gateway (deniz feneri), Kube-proxy (ağ istasyonu), Job (görev şalupası) ve Secret (kilitli kasa) nesnelerine visual 3D metin etiketleri (`<Text>`) ve eksiksiz müfettiş detay döküm kartları entegre edildi.

---

## [v2.9.0 - 3D Boyut Sabitleri & Katmanlı Grid İstifleme Düzeni] - 2026-07-31

### Düzeltilen Hata ve İyileştirmeler
- **3D Çakışmaların Giderilmesi ve Sıfır Kesişim:** Gemi güvertesindeki Pod konteynırları ve karadaki liman yapıları arasındaki görsel iç içe geçme ve çakışma sorunları giderilmiştir.
