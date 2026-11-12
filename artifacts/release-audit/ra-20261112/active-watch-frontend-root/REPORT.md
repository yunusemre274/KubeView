# Aktif watch yetki kaybı — frontend durum aktarımı

- Kaynak tabanı: `2be79c84`; önceki ürün `f32d6b23`. Bu kayıt final paket veya gerçek Kubernetes kabulü değildir.
- Tür: sentetik protokol / saf reducer unit testi. Tarayıcı veya gerçek RoleBinding işlemi çalıştırılmadı.
- İlk test: mevcut reducer failed-scope STATUS mesajını görmezden geldi; beklenen `forbidden` yerine `live` çıktı. Üç testte iki FAIL, bir PASS. İlk çıktı `red.stdout` içinde korunur.
- Kök neden: `resourceStore.js:reduceMessage` STATUS dalı global bağlantı alanlarını işliyor fakat `scopes` bilgisini işlemiyordu.
- Düzeltme: sadece bildirilen `forbidden` / `unavailable` kapsamlarını kopyalayarak non-authoritative işaretle. Canonical kaynak nesnesi ve UID, tombstone ve diğer namespace kapsamı korunur. Healthy STATUS kapsamı yeniden yetkili ilan edemez; bunun için başarılı snapshot gerekir.
- Retest: yeni üç test + mevcut store ve workspace komşuları **46 PASS, 0 FAIL, 0 SKIP**, toplam süreç duvar süresi0,507sn. `green.json` tam komut ve kaynak SHA'larını içerir.
- Test edilen sınırlar: eski context/generation mesajı reddi; canonical referansının korunması; başka namespace kapsamına dokunulmaması; önceki state mutasyonsuzluğu; snapshot ile recovery. Aynı-ad yeni UID ve diğer store/workspace testleri komşu gruptadır.
- Ek timer, polling, abonelik, render loop, bağımlılık veya görsel değişiklik yok. CPU kazancı iddia edilmiyor.
- Kalan: backend yetki yenilemesi, gerçek RBAC iptali E2E, normal UI gözlemi ve final paket ayrı kapılardır. İstemciye önceden verilmiş verinin geri çağrılacağı veya iptalin atomik/anlık olacağı iddia edilmez.
