# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

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
