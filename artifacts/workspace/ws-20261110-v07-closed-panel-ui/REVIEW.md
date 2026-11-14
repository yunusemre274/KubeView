# V07 kapalı panel / log yeniden açılışı — normal UI PASS

Yeni frozen index `a31eb27d…b471` HTTP200 gövdesiyle doğrulandı; Root lease'i runtime frontend `ff682d9b…19b9`, binary `4df0498a…94f8` kimliklerini sağladı. Gerçek embedded Go TEST/REPLAY M/5 HTTP/WS kaynağı ve normal Chromium UI kullanıldı; yanıt mock'u veya uygulama state enjeksiyonu yoktu. Gerçek Kubernetes değildir.

Üç kontrol geçti: log1 → açıkça kapat0 → B → A dönüşünde panel hâlâ kapalı ve log açılış sayısı artmadı; ardından aynı exact Pod UID'yi normal Bul ile açıkça seçmek yalnız bir yeni log akışı açtı ve kapanışta aktif akış0 oldu. Server sayaçları ilk açıkça kapatma sonrası2opened/2closed, A dönüşünde yine2/2, açık yeniden inceleme/kapatma sonrası3/3'tür. Başlangıç cold view tarafından açılan ilk log kapatılıp baseline1/1 olarak ayrılmıştır; testin iki bilinçli açılışı ayrı sayılır. B'ye geçerken public workspace GET aynı UID ve logs sekmesini doğruladı; aynı Canvas korundu. Tüm3 gözlenen HTTP log isteği sona erdi.

İki PNG açılarak incelendi. `01-returned-A-panel-still-closed` seçili app-0 highlight'ı ile kapalı paneli, tam dünya ve TEST/REPLAY etiketini gösterir. `02-explicit-reopen-only-one-log` yalnız açık inceleme sonrası özgün app-0/app/logs panelini gösterir. Log gövdesi maskelidir ve kare0 satır gösterir; dolu log payload'ı kanıtı değildir.

Runtime hata0 ve yasak resource/action/scenario yazımı0. Browser/context kapanışı await edildi; helper/Playwright Chromium PID0. Probe sonrası public replay status3opened/3closed, aktif0. Root'un19807 server süreci bu helper tarafından yönetilmez; kapatma/performans freeze sahipliği Root'tadır. CPU/FPS/fiziksel gecikme veya20dakika soak sonucu üretilmedi. Eski UI/perf kanıtları eski frontend kimliklerine aittir; MANUAL:PENDING.
