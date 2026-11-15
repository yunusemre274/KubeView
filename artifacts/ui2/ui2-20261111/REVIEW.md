# Görsel kontrol, 11 Kasım 2026

Veri: yalnız salt okunur HTTP/WebSocket fixture ve geliştirme QA kaynağı. Gerçek Kubernetes mutasyonu, Node provisioning veya Hubble bu turda çalıştırılmadı. Önceki canlı işlev testleri tarihsel kalır.

Referans `Kubeview_UI_2.0.png` açıldı. Önce `ui2-before-3448dda` normal embedded sürümü, sonra UI 2.0 derlenmiş App'i incelendi. Referansın uzun paralel beton iskeleleri, bağlı ana karası, gemi siluetleri, sarı/kırmızı vinçleri, lacivert araçları ve petrol denizi uygulamada görülüyor. Kamera ve iki tesisin oranı yaklaştırıldı; logo/arka plan fotoğrafı model yerine kullanılmadı. Gerçek kaynak sayısı korunur; birebir piksel eşliği iddiası yoktur.

Önemli ara kayıtlar:

- `ui2-first-look-20261111`: **GÖRSEL FAIL / GEÇERSİZ KABUL**. Ham helper yalnız Canvas varlığına bakıp BASELINE_CAPTURED yazdı; kamera milyon birime çıktı,0draw ile dünya görünmedi. Bu sonuç başarı sayılmaz. Analitik fit ve finite-camera/draw kontrolleri eklendi.
- `ui2-look2`–`look5`: inceleme kareleri; küçük tesis, hizalama ve aşırı su parlaması iterasyonları. Açılıp incelendi; nihai performans testi değiller.
- `ui2-final-chromium` r1/r2/r3/r4/r5: geliştirilmekte olan harness FAIL kayıtları korundu. Sönümde mikro Y farkı, örtülü modalın yanlış kapanış sırası, headed kamera drift'i ve1e-13 yüksekliğe exact equality geçerli kabul değildi. Drift nedeni kanıtlanmadı. Kontrollü headless ve sakin başlangıç kullanıldı; X/Z,UID,namespace ve canonical kontroller gevşetilmedi.
- `ui2-final-chromium-r6` ve `ui2-final-webkit`:24/24PASS. Dar ekran rehber/rozet çakışması düzeltildikten sonraki görüntüler açıldı.
- `ui2-facility-red`: aynı adlı komşu merkeze yanlış odak gerçek pointer akışında FAIL. İlk düzeltmede A geçti, B geçişi Yaklaş'ı ezdi (`ui2-facility-green` FAIL). İki sorun giderildikten sonra `ui2-facility-green-r2`:A/BPASS. Bu başarısız dosyalar silinmedi.
- `raycast-tests.txt`: eski sabit ekran koordinatı ve5s yaklaşma varsayımı2FAIL. Güncel hedef/sonlu14.5s bekleme kullanan aynı21/18UIDvevarış kontrolleri `raycast-tests-final.txt`:2PASS.

Son teslim Chromium/WebKit sonuçları ayrı `ui2-delivery-*` dizinlerinde. Başlıklar, paneller,1280/1440/768kareler,boşaltılanUIDizleri incelendi. `living-harbors.mp4`, r6 ham videosunun1–7s bölümüdür;0/2/4s çıkarılmış kareler açılarak gemi/iz hareketi ve ayar açılışı kontrol edildi. Daha önce alınmış video, son tesis-focus düzeltmesini göstermiyor; deniz/modeller aynı kaynaktır. Video sentetik TEST/REPLAY rozetini korur.

Yaklaşık2.5s video açık draw tanılaması production CPU, enerji, gerçekGPU%, M/L bütçesi veya native Safari kabulü değildir. Kalan eski kabul kapıları korunur.
