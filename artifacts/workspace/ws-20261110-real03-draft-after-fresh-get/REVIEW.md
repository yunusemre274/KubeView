# Helper FAIL — native caret başlangıcı

Koşu `ee974b3b…e559` runtime kaynağında, gerçek owned03 A/B namespace/Deployment/same-pod UID korumalarıyla yürütüldü. Kubernetes mutasyonu gönderilmedi. İlk beş gözlem içinde dönüşün **tamamlanmış ikinci GET200 + aria-busy=false** sonrasında dirty YAML byte eşitliği, UID, YAML modu ve aynı Canvas korundu (`freshGetCount: 2`). `failure.png` açılıp incelendi; loading metni yok, YAML alanı odaklı ve kontroller açıktır. Özgün sonuç ve kareler korunur.

Koşu native caret helper'ında durdu: macOS Chromium'da `ControlOrMeta+End` için “caret mutlaka bütün textarea sonuna gider” varsayımı sağlanmadı (başlangıç383; helper2159 bekledi). Taslak byte eşitliği bozulmadı ve uygulama hatası gözlenmedi. Bu başarısızlık sonrası same-pod A/B/A log bölümü çalışmadı; tek kapanmış log isteği eski kaydedilmiş panelin açılışına aittir. Bu koşu tamamlanmış F/log kabulü sayılmaz.

Helper platform kısayolu varsayımı kaldırılarak doğal click'in yerleştirdiği gerçek `selectionStart` üzerinden iki native yön tuşunun beklenen farkı denetlenecek şekilde dar düzeltildi. Test selection/camera veya API state'i enjekte etmez. Yeni koşu ayrı ID ile kaydedilir.
