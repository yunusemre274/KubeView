# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.4.0 - Faz 13 Full Screen 3D & K8s Bilgi Kartı Çekmecesi] - 2026-07-30

### Eklendi / Düzeltildi
- `ui-ux-agent` tarafından `App.jsx` içerisindeki çift header render hatası giderildi.
- Varsayılan 3D Canvas ekran alanı **%100 tam ekrana** çıkarıldı. Kalıcı büyük başlıklar ve sayaç panelleri kaldırıldı; sol üstte sadece %3 yer kaplayan logo rozeti bırakıldı.
- `ShipyardScene.jsx` içerisine tıklanan nesnenin GERÇEK tipine göre (Pod, Worker Node, Control Tower Master Node, Scheduler Crane, Kube-proxy) **dikey tam yükseklikte (%100 height, ~%15 width / 320px)** özel K8s Bilgi Kartı Çekmecesi eklendi.
- Liman mimarisi çoklu gantry vinçler, karada bekleyen konteynır yığınları (Pending Pods metaforu) ve namespace kodlu depolarla zenginleştirildi.
- `LESSONS.md` belgesine `[DERS-002]` kaydı eklendi.

---

## [v1.3.0 - Canlı 3D Liman Motoru & Township Estetiği] - 2026-07-30
- Canlı mavi su yüzeyi, sarı vinç, salınan gemiler ve kamera lerp geçişleri yapıldı.
