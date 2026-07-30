# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler bu dosyada belgelenir. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.2.0 - Faz 12 Katman Ayrımı & Endüstriyel Tasarım Sistemi] - 2026-07-30

### Eklendi / Yeniden Yapılandırıldı
- `ui-ux-agent` & `3d-scene-agent` tarafından 3D Sahne (Katman 1) ve HTML UI Overlay (Katman 2) kesin olarak iki bağımsız katmana ayrıldı (`/docs/ARCHITECTURE.md` [ADR-008]).
- 3D Canvas içindeki tüm yüzen metinler ve butonlar kaldırıldı. Nesnelere tıklanınca sol sabit müfettiş panelinde gösterilmeye başlandı.
- `index.css` dosyasına Google Fonts (`Oswald`, `JetBrains Mono`, `Inter`), özel renk paleti (amber, steel blue, dark navy) ve özel dropdown/kart stillerinden oluşan **Endüstriyel Tersane Tasarım Sistemi** tanımlandı.
- 3D Liman mimarisi tanınabilir modellerle yenilendi: Beton Rıhtım + Sarı/Siyah Emniyet Çizgisi + Turuncu Liman Vinci + Detaylı Kargo Gemisi Silüeti + Güverte Konteynır Izgarası.
- `DeploymentPanel.jsx` ayrıştırılmış bağımsız kart düzenine kavuşturuldu.

---

## [v1.0.0-3d - Nihai 3D Sürüm Yayını] - 2026-07-30
- Multi-stage Dockerfile ve Production Helm Chart güncellendi.
