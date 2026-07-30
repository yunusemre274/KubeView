# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.5.0 - Faz 14 Absolute Overlay Çekmece & CSS Transform] - 2026-07-30

### Düzeltildi / Geliştirildi
- `ui-ux-agent` tarafından bilgi kartı (sağ panel) pozisyonlaması flex/grid sibling düzeninden **`position: absolute; top: 0; right: 0; bottom: 0; z-index: 40;`** overlay mimarisine geçirildi.
- Canvas kapsayıcısı (`.stage-wrapper`) kalıcı olarak **`position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0;`** yapıldı.
- Çekmece açılış/kapanışına yumuşak CSS transform animasyonu (`transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)`) eklendi.
- Panel açılıp kapandığında 3D Canvas boyutunun asla değişmediği ve sıfır resize/siyahlık yaşandığı doğrulandı.
- `LESSONS.md` belgesine `[DERS-004]` ve `AGENTS.md` rehberine ilgili kural kaydedildi.

---

## [v1.4.0 - Full Screen 3D & K8s Bilgi Kartı Çekmecesi] - 2026-07-30
- Çift header hatası çözüldü, nesneye özel K8s veri şeması eklendi.
