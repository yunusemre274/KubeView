# Tam ekran tersane dönüşümü

A–G tablosu ilk tam ekran dönüşümünün tarihsel kilometre taşlarıdır; son hareketli sürümün kabulü alttaki tabloda yer alır.

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

## Hareketli filo / canlı deniz / Neumorphism

| İş | Durum / kanıt |
|---|---|
| UID rotası ve 8 gemi bölgesi | Uygulandı; mevcut UID fazları ekle/sil/sıra/bölge değişiminden ayrıldı |
| Trafik ve geçici yanaşma | Uygulandı; sanal birleşme lideri ve düz çıkıştan sonra dönüş; dört sütundan ayrılma testleri |
| Kargo ve durum eşleştirmesi | Uygulandı; tek UID, görsel yükleme etiketi, 10 sn sonra 320 ms sade varış |
| Canlı deniz | Uygulandı; aynı CPU/GPU analitik model, isteğe bağlı ripple/iz, görünürlük saati |
| Soft UI ve tercihler | Uygulandı; opak açık/koyu/sistem, yüksek kontrast, ayrı etkili hareket tercihleri |
| Kabul | 30 tarayıcı testi geçti; 6 tekrar/guard atlaması; 69 birim testi, 10 dk/üç tur, gerçek 60 sn görünmezlik ve ölçüm raporu tamamlandı |
