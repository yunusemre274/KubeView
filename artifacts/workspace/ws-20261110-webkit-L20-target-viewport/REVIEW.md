# Tek eksik WebKit L/20 viewport yaprağı — PASS

Root'un açık dar lease'iyle yalnız `KV_ONLY_CASE=webkit-L-h20` yürütüldü:3.14s,1 vaka/6 kontrol PASS. Önceki8 Chromium varyantı ve WebKit M/5 PASS tekrarlanmadı; önceki `ws-20261110-manual07-corrected`9PASS/1FAIL sonucu ve kareleri korunur. Bu sonuç o dosyanın statüsünü değiştirmez.

Binary `ce72f9dd…d9a4`, frontend `ee974b3b…e559` ve runner `098b5008…bbbf` önceki koşuyla ve kendi before/after hash'leriyle eşittir. Yalnız helper, istenen viewport boyutunu `page.viewportSize()` üzerinden sabitler; `innerWidth/Height`, canvas CSS rect ve DPR1 pixel boyutunun birlikte o hedefe yerleşmesini bekler. Üretim kodu, kalite, kaynak içeriği ve toleranslar değiştirilmedi.

1280×800 ve768×900 dark/reduced durumlarında gerçek public workspace GET20 limanı, gerçek WS SNAPSHOT50 Node/1500 Pod'u doğruladı; görünür envanter8 Node/270 Pod, tek Canvas, açık TEST/REPLAY etiketi ve sunucu/UI salt-okunurluk korundu. Her iki genişlikte klavye ile Bul açılışı, native caret, Escape sonrası odak dönüşü ve20 kartlı harita erişimi geçti. Dar ekranda normal Bul ile snapshot exact Node UID seçildi; diğer limana ve özgün limana dönüldü, public GET seçim UID'sini ve aynı Canvas korunduğunu doğruladı. Son canvas CSS ve pixel boyutu768×900/DPR1'dir.

Üç PNG açılarak incelendi:1280 ve768 dark harita kartları viewport içinde, kaydırılabilir liste ve kapatma kontrolü erişilebilir;768 finalinde dünya, gerçek seçili Node ve açık sentetik etiket görünür.768px finalde bazı3D anomali etiketleri birbirinin üstüne gelir ve alt rehberle sentetik etiket kısmen çakışır. Bu dar işlev testi bütün3D etiketlerin aynı anda okunabilirliği için genel görsel PASS iddia etmez.

Runtime error0, resource/action/replay-scenario/management-enable isteği0; normal `enabled:false` grant reseti ayrı kaydedildi. Son resmi `down --profile07` exit0; app kaydı ve helper/browser PID'si yok. Sekiz normal-kullanıcı varyant dizini ve gerçek A/B cluster kayıtları korundu. Testler sentetiktir; gerçek Kubernetes/Hubble, CPU/FPS/fiziksel gecikme, native Safari ve eski açık kabul kapıları için sonuç üretmez. MANUAL:PENDING.
