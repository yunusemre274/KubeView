# Gerçek log rolü ve normal UI ömrü

İşlevsel kabul **7 PASS / 0 işlevsel FAIL**. WebSocket close olayının Playwright üzerinden gözlenmesi **BLOCKED**; son raw runner `status=FAIL` olarak korunur. Bağımsız root kernel ölçümü gerçek transport cleanup'ını doğruladı. Bu rapor raw FAIL kaydını PASS'a çevirmez ve eksik wrapper olayını gerçek aktif bağlantı/leak kanıtı saymaz.

## Kaynak ve koşu geçmişi

Product freeze `0f5a5ab6b8e52e645b9e2e71dd063112ca105e98`, production18410, embedded binary SHA256 `b7417ea5216a88de16e3a2307df55a32470f756a958681eac08643858fdc87cf` kullanıldı. İki koşuda da product source SHA256 `1ef0d1b5f36d2d963a3e72137c8a0e090a0363869ac0dee5e3078057d29a8757`; source/build/helper öncesi-sonrası eşliği true. Ürün/e2e/Git/build değişmedi.

İlk koşu `runs/2026-11-09T08-34-40-579Z/result.json` 17.9s sürdü. Gerçek role/app current UI PASS, pause HTTP kapanışı PASS; resume helper'ı yeni isteğin header'ı tamamlanmadan önce eski matching request'i seçtiği için FAIL verdi. Yeni request gerçekte açılmıştı; bu eski kayıtta request2/HTTP200/kimlik header'ları bulunur. Browser context'in kapanması öncesi event gözlemleri beklenmediğinden raw gözlem map'inde bir log ve bir WS terminal olayı eksikti. Browser/context ve fixture cleanup tamamlandı; eski kayıt değiştirilmedi.

Root yalnız bir hedefli tekrar yetkilendirdi. `runs/2026-11-09T08-37-27-546Z/result.json` 29.074s sürdü. Helper strict request-ID sınırı, yeni gerçek response header'ları, salt okunur CDP `Network.dataReceived` byte sayacı ve artan app satır sayacı kullandı. Başka tekrar veya sonsuz retry yapılmadı. Tek iş için main270s + cleanup30s bound vardı; watchdog sonunda temizlendi.

## Gerçek fixture ve UI doğrulamaları

Yalnız A cluster UID `a24740ba-cf3e-461d-b5b3-250deeb060d7`, owned `kv-repair-v11-logui` namespace'i ve tek kendi Pod'u kullanıldı. Her mutasyondan önce namespace UID, exact owner+benzersiz instance label ve Pod UID/RV denetlendi. Var olan namespace/Pod sahiplenilmedi. Ephemeral container gerçek `/ephemeralcontainers` alt kaynağına exact UID/RV snapshot ile PUT edilerek eklendi; fixture cevabı veya WS verisi uydurulmadı.

Son Pod UID `0f3d1c5d-65be-4645-a465-bff85b6779e5` için API şu gerçek rolleri gözledi: app Running/Ready; prepare init terminated exit0; restart-once current Running/Ready, restartCount1 ve lastExitCode42; debug-role spec.ephemeralContainers/status.ephemeralContainerStatuses içinde Running. Exit42 açık kontrollü fixture'dır; OOM/altyapı arızası iddiası değildir.

Normal finder → Pod → Container’lar kartları rol metinlerini doğruladı: `Uygulama container’ı`, `Init container`, `Geçici debug container`. Normal `Logları aç`, container dropdown ve `Önceki container` checkbox'ı ile aşağıdaki gerçek pods/log yanıtları okundu. Her seçimde doğru namespace/context/PodUID/raw container/previous query'si, HTTP200 ve UID/session/guarded-text-v1 response identity header eşliği denetlendi; ham URL/header/session credential kaydedilmedi.

| UI kontrolü | Sonuç |
| --- | --- |
| App current rol ve sentetik marker | PASS |
| Pause → HTTP abort, frozen DOM; resume → yeni stream; double-open; close/reopen | PASS |
| Tamamlanan init logu | PASS |
| Gerçek ephemeral current logu | PASS |
| Restart etmiş app current logu | PASS |
| Aynı container previous logu, current'tan ayrı marker | PASS |
| Son panel kapanışı → bütün log HTTP istekleri terminal/active0 | PASS |

Pause request1'i gerçek `failed/aborted` olayına götürdü. UI'da `Duraklatıldı` ve sunucu akışının kapandığı açıklaması görüldü; kapalı sürede görünüm sabit kaldı. Resume request2 açtı; CDP1695 actual received byte ve app sequence24→28 yeni gerçek veriyi doğruladı. Devam et mevcut seçili tail'i yeniden getirir; aradaki tüm satırların saklandığı iddia edilmez. Zaten açık Loglar sekmesine normal double-click yeni HTTP isteği açmadı, tek stream kaldı. Panel close/reopen request3'ü, sonraki rol seçimleri request4–7'yi ve son current request8'i doğru UID ile açtı. Sekiz gerçek log isteğinin tamamı bitiş/abort olayına ulaştı; activeLogRequests0. Pozitif veriler diğer rol/previous marker'larını içermedi.

App, paused, init, ephemeral, restarted-current ve previous PNG'lerinin altısı açılıp incelendi. Loglar yalnız önceden belirlenmiş sentetik fixture marker'larıdır; gerçek kullanıcı logu veya Secret verisi yoktur. Init ve previous UI `Akış tamamlandı`; app ve ephemeral `Canlı akış` gösterir. Tarihsel 5000satır/1MiB/16KiB/180ms ürün sınırları değiştirilmedi. Bu kısa kabul throughput, bellek veya fiziksel FPS ölçümü değildir.

## WS gözlem sınırı ve cleanup

Final panel kapanışı bütün sekiz log HTTP request'ini terminal duruma getirdi. Ardından `about:blank` navigasyonu tamamlandı, ancak Playwright WebSocket wrapper'ı seçili cluster socket'i için onclose olayını 10s bound içinde bildirmedi. Gözlem map'i erken/manüel temizlenmedi: raw `unclosedSockets=1` ve `lifecycleCleanupError` tam olarak tutulur. Bu, wrapper'ın terminal olayının gözlenememesidir; açık kaldığı kanıtlanmış gerçek OS socket'i veya ürün leak'i olarak raporlanamaz. Bu tek gözlem kapısı BLOCKED; kaynakta düzeltme/üçüncü browser denemesi yapılmadı.

Browser context ve browser `close()` tamamlandı, CDP observer detach edildi. Own Pod ve namespace exact UID+RV DELETE precondition ile silinip GET404 gözlendi. İki cleanup proxy PID21172/22349 son ps kontrolünde yoktu; proxyStopped/watchdogCleared true. Kalan log HTTP isteği0, kalan owned Pod/namespace0; bu işin aktif browser/helper/proxy süreci yoktur. Diğer worker'ın kaynakları ve gateway/Hubble süreçleri değiştirilmedi. Yeni test ancak root'un yeni ayrı lease'iyle başlatılır.

Root'un bağımsız `kernel-socket-close-20261109.json` kaydı currentb741 binary ile ilişkilidir: gateway PID13162/port18410 için lsof yalnız LISTEN gösterir, bağlı HTTP/WS TCP endpoint0; owned Chrome/WebKit process0. Bu, gerçek kernel transport cleanup kanıtıdır ve eksik Playwright terminal olayıyla aynı ölçüm değildir. Wrapper gözlem notu silinmedi. Kernel sonucu Go heap, goroutine, bütün timer veya genel bellek sızıntısının yokluğu olarak sunulmaz.
