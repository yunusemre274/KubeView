# Watch yetki düzeltmesi sonrası komşu guardlar

Tür: sentetik client / gerçek in-process HTTP veya loopback WS. Gerçek Kubernetes, kullanıcı tarayıcısı ve final paket değildir.

- Ana test: 23; alt test: 31; FAIL/SKIP:0. Duvar süresi: 2.294sn.
- Tek count1 çağrısı; komut ve kaynak SHA `plan.json`/`execution.json` içindedir. Önceki başarılı grubu tekrar çalıştırma gerekçesi: production stream.go yetki yenileme ve writer kapanış yolu değişti.
- Kaynak before/after eşit; yakalanan owned PID/birth/command kimlikleri kapanmış. Bu örnekleme kısa ömürlü bütün süreçlerin tam sayımı değildir.
- Bütün gerekli assertionlar ve paket sonucu PASS; rapor temel guardlarla sınırlıdır. Gerçek RBAC, TLS, UI ve performans ayrı kapılardır.
