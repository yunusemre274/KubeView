CAT11 untrusted-content dar incelemesi tamamlandı. Ürün kaynak kodu değiştirilmedi. Tek yeni izinli helper `frontend/e2e/release-untrusted-content.mjs`; Git/index/roadmap root'a bırakıldı.

Owned07 PID 925/listener 19847 ve binary SHA e582a5bd4a274ae5e6627eacc2d4866760a03c6763e51593531dd744f5d2b0ef kontrolü geçti (`owned-identity.json`). Tüm API ve WebSocket yanıtları browser içinde TEST/REPLAY fixture olarak intercept edildi. Yalnız mevcut owned app'in static dosyaları okundu. Gerçek Kubernetes, backend store, SSRF, production data veya 06 Hubble testi değildir. Normal finder ve Node/Pod tabs tıklamaları kullanıldı; camera/selection/state hook enjeksiyonu, clipboard/host write veya lab lifecycle yok.

Kaynak incelemesi: `ResourceDetails.jsx` ad/condition/labels, olay reason/message ve YAML stringify çıktısını React text children olarak render eder (978, 1257, 1287 civarı). `PodLogs.jsx` LogTextChunk satır 24 text span; hata satır 386 text; indir satır 301 yalnız text/plain Blob URL üretir. İncelenen bu yüzeylerde HTML parser/linkify veya dangerouslySetInnerHTML yok. `logBuffer.js` tek satırı 16KiB, toplamı 1MiB/5000 satırla sınırlar. `backend/main.go:132` ana document CSP politikası `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`; script-src bulunmaz. Browser mainDocumentCSPPresent=true gözledi. Başarılı XSS reddi CSP script engeline bağlanmadı: payload DOM elementine dönüşmediği ayrıca denetlendi.

Yedi zararsız örnek kullanıldı: literal `<img ... onerror="globalThis.__kvUntrustedExecuted=1">`, SVG/script, javascript: local flag, data: HTML local flag, ANSI CSI+OSC8+CR/backspace/bidi ve 60KiB uzun satır. Dış adres/exfil yok; yalnız yerel flag ve owned local canary path vardır. Uydurma HTML-benzeri Pod adı fixture kimliğidir: geçerli Kubernetes rename veya gerçek API doğruluk başarısı sayılmadı.

İlk iki FAIL korunuyor. Her ikisi Node normal adı/condition text, normal Pod finder/UID, HTML-benzeri fixture adı ve annotation YAML+copy affordance kontrollerini geçti. Ardından event tabının accessible adı `Olaylar1` olduğu için önce exact `Olaylar`, sonra whitespace varsayan regex selector timeout oldu. Bunlar harness failure; ürün XSS bulgusu değildir. Üçüncü bounded deneme yalnız kalan event/log/error akışını normal finder'dan açarak tamamlar; tüm akışın tek kesintisiz green run olduğu iddia edilmez.

Normal pozitifler: plain Node/Pod adı ve gerçek fixture UID bulma; PLAIN-ANNOTATION-OK; PLAIN-EVENT-OK; PLAIN-LOG-OK log ve arama; enabled YAML copy/download affordance (tıklanmadı); PLAIN-ERROR-OK. Negatifler: img/SVG/script DOM elementi ve javascript/data anchor sayısı 0; yerel execution flag 0; canary request 0. ANSI/OSC kontrol kodları raw DOM text'te kalır, terminal komutu/link/stil olarak yorumlanmaz. Bidi/control görünür escape dönüşümü yok; bu ayrı bir metin sunumu sınırıdır, XSS diye sınıflandırılmadı. 61,943 bayt log fixture cevabı 16,876 karakterlik bounded görünüm ve açık truncation bildirimi üretti. Arama literal javascript: metnini güvenle filtreler. Sentetik HTTP403 hata metni literal kalır; eski log çıktısı temizlenir.

İlk FAIL PNG, aşama PNG'leri/video ve raw loglar korunur. Node/annotation, event/log/search/error ekranları araçla açılıp incelendi. Chromium kullanıldı; WebKit/native Safari, performans veya kapsam dışı yetki iddiası yok. Browser sayısı aynı anda 1, her attempt <=60 HTTP ve <=120s, payload <=64KiB. Context/browser kapanışı sonuç dosyalarında yer alır; app/lab aktif bırakıldı.

Attempt 1: FAIL; HTTP 21; canary 0; browserClosed=True; checks=4; 2026-11-11T13:32:41.481Z → 2026-11-11T13:33:40.539Z.
Attempt 2: FAIL; HTTP 20; canary 0; browserClosed=True; checks=4; 2026-11-11T13:34:04.371Z → 2026-11-11T13:34:49.813Z.
Attempt 3: PASS; HTTP 19; canary 0; browserClosed=True; checks=5; 2026-11-11T13:35:18.929Z → 2026-11-11T13:35:52.123Z.

Kaynak SHA, tam komutlar ve assertion ayrıntıları source-and-results.json ve attempt dizinlerindedir. Açık ürün XSS/link/ANSI execution bypass bulunmadı; bu sınırlı fixture setinin sonucudur.

Tüm denemeler toplam HTTP: 60; tüm execution flag ve local canary kontrolleri 0. Browserlar seri ve her deneme 120s altında.
