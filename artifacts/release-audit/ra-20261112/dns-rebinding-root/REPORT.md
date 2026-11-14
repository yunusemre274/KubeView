# DNS rebinding sonrası HTTP Host sınırı — dar PASS

Frozen f32d6b23 / binary5f1c22b9 gerçek uygulaması token-free default loopback modunda30 HTTP kontrolünü geçti. Soket yalnız127.0.0.1:19844e açıldı; saldırgan Host+Origin aynıorigin olduğu durumda bile API403 verdi. EksikOrigin, altalan/alternatifIP yazımı, session/management/WS giriş yolu ve forwarded-header spoof ayrı sınandı. Normallocalhost/IPv4/IPv6Host ve son yetkili yerelcontexts olumlu kontrolü200; boşgerçekmod/configuredfalse/readonlytrue doğrulandı.

Bu test DNS sağlayıcısı kurmaz veya üçüncü taraf alanına DNS/HTTP isteği göndermez: rebinding sonrasındaki Host sınırının gerçek HTTP testidir. Gerçek tarayıcıDNS dönüşümü, gerçekIPv6listener, tokenliuzak kullanım, başarılıWSupgrade veya KubernetesE2E kabulü değildir. WS403 yalnız guard sınırıdır. StaticUI API yetkisi sağlamaz; staticHost davranışı bu fazda test edilmedi.

30kontrol/3.650sn, eşzamanlılık1/110msarası/30sdeadline. Uygulama exactPID/birth/PGID doğrulamasıylaSIGTERM/exit0 kapandı;19844free, binary değişmedi. Fresh0700boşworkspace private.git alanında kaldı; hiçkubeconfig/Secret/token yüklenmedi; providerlar kapalı. Ürün kodu değişmedi. Yeniden üretim bu run-id üzerine yazmaz; yeniout/private run-id ile aynıprobe kullanılmalıdır.

İkinci inceleme bekleniyor; genel güvenlik/yayın kararı NOT_RELEASE_READY.
