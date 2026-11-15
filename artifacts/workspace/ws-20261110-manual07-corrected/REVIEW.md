# manual07 —8 varyant PASS, WebKit dar resize yaprağı açık

Resmi normal-kullanıcı runner'ıyla34.32s sonlu koşu:8 Chromium varyantı ve WebKit M/5 tam geçti; son WebKit L/20 vakası768px resize kontrolünde durdu (**9 PASS /1 FAIL**). İlk helper/grant-reset FAIL'i ayrı dizinde korunur. Bu dosya ilk sonucu başarıya dönüştürmez.

Runtime binary `ce72f9dd…d9a4`, frontend `ee974b3b…e559`, fixed runner `098b5008…bbbf`; öncesi/sonrası eşittir. Gerçek API bağlantısı yerine açık TEST/REPLAY Go kaynağı kullanıldı. Her varyant resmi `down --profile07` → `app --replay … --harbors …` ile ayrı normal kullanıcı veri dizininden açıldı. Public workspace GET, gerçek WS SNAPSHOT, görünür etiket, server/UI salt-okunurluk, tek tam1440×900 DPR1 Canvas, yerleşmiş kamera ve projekte Node görünürlüğü kontrol edildi.

| Tarayıcı / yük | Liman sayısı | Canonical Node/Pod | Görünen Node/Pod | Sonuç |
| --- | --- | --- | --- | --- |
| Chromium M |1 /5 /10 /20 |20 /300 |8 /120 |4 PASS |
| Chromium L |1 /5 /10 /20 |50 /1500 |8 /270 |4 PASS |
| WebKit M, normal hareket/light |5 |20 /300 |8 /120 |PASS;1440px native caret, klavye açılış/Escape/odak, harita ve iki normal liman geçişi |
| WebKit L, reduced/dark |20 |50 /1500 |8 /270 |1280px sayı/salt-okunur/native caret/odak/harita PASS;768px yaprağı FAIL, sonraki UID/geçiş/final bölümü NOT RUN |

Birden fazla limanlı geçen vakalar aynı snapshot Node UID'sini normal Bul ile seçti; diğer limana ve geri dönüldü. Public workspace GET özgün UID kaydını doğruladı, seçim ve aynı Canvas korundu.1 limanlı vakalarda normal Bul seçimi yapıldı; iki liman geçişi uygulanabilir değildi. Resource/action/replay-scenario/management-enable isteği0; normal `enabled:false` grant resetleri ayrıca kaydedildi. Browser runtime hatası0.

Tüm12 PNG açılarak incelendi. Sekiz Chromium finalinde tam liman, gövdeleri/yükleriyle8 gemi ve açık sentetik/salt-okunur etiketi görünür. WebKit M/5 haritası ve final dünyası doğru; WebKit L/20 dark haritası1280px içinde, kart listesi kaydırılabilir.768px failure karesi dar ekran düzeni ve Node panelini gösterir; tek zaman örneğinden kalıcı resize hatası çıkarılamaz.

Helper resize beklemesi hedef viewport boyutunu kullanmıyordu: o andaki `innerWidth/innerHeight` eski1280×800 iken bekleme erken geçebilir; sonraki okumada768×900 beklenirken eski canvas geometrisi görülür. R3F Canvas yerel ResizeObserver/useMeasure yoluyla asenkron boyutlandırılır. Bu nedenle kalıcı ürün hatası henüz kanıtlanmadı. Dar helper düzeltmesi `page.viewportSize()` hedefinde `innerWidth/Height`, canvas CSS rect ve DPR1 pixel boyutunun birlikte yerleşmesini bekler. Geçen9 vaka tekrarlanmaz; ek UI koşusu ancak Root'un açık dar lease'iyle yapılır.

Son resmi07 down geçti; app kaydı yok. Sekiz `M/L-h01/h05/h10/h20` veri dizini korundu; gerçek A/B cluster kayıtları değişmedi. Bu sentetik işlev kanıtıdır: gerçek Kubernetes/Hubble, CPU/FPS, fiziksel gecikme, native Safari veya eski açık kabul kapıları için sonuç üretmez. MANUAL:PENDING.
