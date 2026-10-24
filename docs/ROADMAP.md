# Tam ekran tersane dönüşümü

2026-10-24 kararı: önceki dashboard yerleşimi geçersizdir. Aşağıdaki durum kod ve test kanıtını izler; tarihsel “tüm fazlar tamamlandı” ifadeleri kabul kanıtı değildir.

| Aşama | Durum | Somut çıktı / kalan doğrulama |
|---|---|---|
| A — Güncel kaynak/ref keşfi | Yapıldı | Mevcut API korundu; iki referans açıldı; UI-UX işlev matrisi |
| B — Tam ekran dünya ve geçici pencereler | Uygulandı | Kalıcı sidebar/header/KPI/tablo yok; tesis ve Bul girişleri |
| C — Merkezden gerçek dikey akış | Canlı doğrulandı | Create/dry-run/watch, gerçek yük raycast seçimi, log, scale/delete |
| D — Gemiye hedefli Pod | Canlı doğrulandı | UID kontrolü, required/preferred/scheduler, gerçek assignment |
| E — Diğer tesisler | Uygulandı | Storage/network/config/Secret/RBAC ve discovery katalogları |
| F — Görsel kalite | Görsel doğrulandı | Chromium/WebKit ekranları açıldı; kontrol kulesi, gemi/vinç/hangar, tam viewport kamera |
| G — Kabul, performans, dağıtım | Yerel kabul geçti; sınırlar açık | 21 tarayıcı testi geçti, 5 WebKit canlı mutasyon bilinçli atlandı; canlı video, 10 dk bellek döngüsü ve paketleme; harici ortam sınırları VALIDATION içinde |

Son kanıtlar ve dış yetenek sınırları [CAPABILITIES.md](CAPABILITIES.md) içinde tutulur.
