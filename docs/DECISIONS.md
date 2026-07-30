# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Bu belge, Tersane projesinde alınan kritik teknik ve mimari kararların gerekçelerini saklar. Kararlar silinmez; güncellenen kararlar eski referanslarıyla açıkça işaretlenir.

---

## 📌 ADR-001...008 (Önceki Kabul Edilen Kararlar)
- ADR-001...007 (Go Backend, Informer/Watch, Read-Only RBAC, Tam 3D, etcd Kaptan/Kubelet Dümenci, Auto Port, UI/UX 60 FPS).
- ADR-008 (Katman Ayrımı 3D Canvas vs HTML UI Overlay).

---

## 📌 ADR-009: Canlı Low-Poly 3D Liman Simülasyonu (Township Estetiği) ve İnteraktif Kamera Lerp Mimarisi
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `3d-scene-agent` & `architecture-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Önceki 3D sahne oldukça dar bir alanda kalmış, zemin ve deniz görselleri yetersiz görünmüş ve nesneler teknik prototip silüetleri gibi kalmıştı.

### Alınan Karar
1. **%85 3D Sahne Oranı:** 3D Canvas ekranın %85'ini kaplayacak şekilde genisletilmiştir.
2. **Referans Görsele Sadık Estetik (Township Estetiği):** Canlı turkuaz-mavi hareketli su materyali, koyu gri beton rıhtımlar, yeşil ada/kara şeridi, ikonik parlak sarı kafesli konteynır vinçleri ve su üstünde salınan kırmızı/lacivert kargo gemileri render edilecektir.
3. **Yumuşak Kamera Lerp İnterpolasyonu:** 3D nesnelere tıklanınca kamera `Vector3.lerp` ile nesneye yumuşakça yaklaşacak, sağda ince 280px detay çekmecesi açılacaktır.

### Sonuç ve Etki
- 3D tersane görsel zenginliği canlı oyun simülasyonu seviyesine çıkarıldı.
