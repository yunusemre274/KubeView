# Son odak ve caption ek kanıtı — 9 Kasım 2026

**UI yön tuşu kanıt boşluğu kapandı.** Gerçek normal form metni/sayı alanı, YAML ve gerçek non-TTY exec girdisinde kamera/hedef izolasyonu gözlendi. Exec içinde dört tuşun native caret hareketi ayrıca ölçüldü. Fiziksel UI sunum gecikmesi ölçülmedi.

Caption PNG incelemesinde 768 ve 1280 genişliklerinde metin okunaklı ve viewport içinde; açılan görüntülerde gerçek düşen kutuyu örtmüyor. Buna rağmen 1280 son örneğin sıfır toleranslı projected-AABB assertion'ı **FAIL** kalır. 1280 bağımsız post-fault API assertion'ına failfast nedeniyle ulaşılmadı. Bunlar toplu PASS olarak yeniden etiketlenmedi.

## Kaynak ve sınırlar

- Runtime commit: `32a0468ad51516a1bb38aab68760e73984c45ddf`.
- macOS ARM64 embedded binary SHA256: `180941247e252f34d71300967fc71ae146174a3dea3caba734d947e1da80f548`.
- Her koşuda runtime dosyaları, binary ve o koşunun helper'ı başlangıç/bitişte eşit. Runtime dosya haritası SHA256: `9f4daf603e3c5cf4651387e1c229a241b6861c3298830e8c0e76fa365f87a25e`.
- Gerçek A kümesi `kube-system` UID: `a24740ba-cf3e-461d-b5b3-250deeb060d7`.
- Yalnız sahipli namespace/Pod'lar; `kubeview.io/v11-owner=v11-20261108` ve her koşuya özel instance etiketi. Her mutasyon öncesi cluster/namespace UID ve owner doğrulandı; silmeler exact resource UID/resourceVersion ile yapıldı.
- Ürün, bağımlılık, build veya Git değiştirilmedi. Hubble/flow, form apply veya performans tekrarı yapılmadı. Kamera/target/fleet yalnız okundu; kalite/DPR setter'ı veya sahte status/görsel enjeksiyonu kullanılmadı.
- Container exit 42 gerçek süreçte kontrollü fixture arızasıdır; kendiliğinden altyapı arızası veya OOM iddiası değildir. Secret, kullanıcı logu, credential, nonce, HTTP header/payload veya trace kaydedilmedi.

## Koşular ve korunan ham sonuçlar

| Koşu | Ham sonuç | Tamamlanan alt kanıt / durma nedeni |
| --- | --- | --- |
| [10:36:38](runs/2026-11-09T10-36-38-216Z/result.json) | FAIL; 19.942 sn | Canvas pozitif kontrolü ve form metni/sayı/YAML geçti. Helper olmayan `/odak/` düğmesini bekledi; gerçek düğme `Sahnede göster`. Arıza henüz tetiklenmedi. |
| [10:37:51](runs/2026-11-09T10-37-51-128Z/result.json) | FAIL; 22.174 sn | Gerçek `Sahnede göster` paneli kendisi kapattı; helper ardından koşulsuz ikinci kapatma bekledi. Arıza henüz tetiklenmedi. |
| [10:39:50](runs/2026-11-09T10-39-50-109Z/result.json) | FAIL; 17.507 sn | 768 gerçek exit 42 ve üç caption örneği geçti. 1280 son projected-AABB assertion'ı durdurdu. Exec çalıştırılmadı. |
| [Exec 10:43:28](exec-runs/2026-11-09T10-43-28-559Z/result.json) | FAIL; 22.525 sn | Terminal açıktı ve tek container healthy seçiliydi. Wrapped label seçenek metnini de içerdiği için helper'ın exact `Container` eşlemesi bulunmadı. Oturum henüz açılmadı; eksik ürün label'ı iddiası değildir. |
| [Exec 10:45:36](exec-runs/2026-11-09T10-45-36-202Z/result.json) | **PASS; 14.415 sn** | Bağımsız exec-only işi: gerçek printf, gönderilmeyen multiline metin, dört native caret hareketi, sabit kamera/hedef, kesintisiz filo ve explicit exec WS kapanışı. |

Helper düzeltmeleri her defasında root'un ayrı açık yetkisiyle yapıldı. Önceki ham FAIL dosyaları korundu. Son exec işi caption tekrarı değildir. İlk koşunun geçen form/pozitif kontrolü, her iki tarafta aynı runtime dosya haritası ve tam binary SHA doğrulanarak kullanıldı; yeniden çalıştırılmış sayılmaz.

## Normal form/YAML ve exec odağı

Normal canvas ArrowRight pozitif kontrolü kamera ve OrbitControls hedefini **21.255 dünya birimi** hareket ettirdi. Tuş bırakıldıktan ve damping yerleştikten sonra odaklı alanlar sınandı; böylece hiç hareket etmeyen bir kameradan yanlış yeşil sonuç alınmadı.

| Gerçek UI alanı | Gözlem |
| --- | --- |
| Deployment taslağı kaynak adı | Dört yön tuşundan sonra metin aynı; focus korunuyor; kamera/target/quaternion mesafesi 0. |
| Replica sayı alanı | Native ArrowUp `2→3`, ArrowDown `3→2`; kamera/target/quaternion mesafesi 0. |
| Aynı taslağın YAML editörü | Metin ve `replicas: 2` korunuyor; dört tuştan sonra kamera/target/quaternion mesafesi 0. |
| Gerçek non-TTY exec textarea | Gerçek printf sentinel çıktısı doğrulandı. Sonra iki satırlık metin gönderilmeden bırakıldı; caret Left `40→39`, Right `39→40`, Up `40→17`, Down `17→40`; bütün adımlarda focus/metin korunuyor. Kamera/target/quaternion mesafesi 0. |

Form/YAML'de çift yönlü tuşlardan önce/sonra caret konumu aynıydı; bu kayıtta bu iki metin alanının her ara caret konumu ayrı örneklenmedi. Sayı alanının native adımı ve exec'in dört ayrı caret hareketi doğrudan assertion'dır. Form hiç uygulanmadı.

Filo UID'leri korundu; form örneklerinde doğal ilerleme yaklaşık +2.39, exec örneğinde üç Node için +3.0015 dünya rota birimiydi. Bu, filo reseti gözlenmediğini gösterir; frame pacing veya fiziksel presented latency iddiası değildir.

Exec Pod UID `2dc0eb43-307d-4a41-a0d9-f00b1e65cbe8`, container `healthy` ve namespace gerçek `/api/exec` request query'siyle doğrulandı. `Oturumu sonlandır` ardından textarea disabled oldu ve exec WebSocket close olayı kaydedildi. Bağımsız API'de aynı Pod UID, healthy Ready ve restartCount 0 kaldı.

Açılıp incelenen görüntüler: [form metni](runs/2026-11-09T10-36-38-216Z/form-text-arrows.png), [sayı alanı](runs/2026-11-09T10-36-38-216Z/form-number-arrows.png), [YAML](runs/2026-11-09T10-36-38-216Z/yaml-editor-arrows.png), [exec girdisi](exec-runs/2026-11-09T10-45-36-202Z/non-tty-exec-input-arrows.png), [sonlandırılmış exec](exec-runs/2026-11-09T10-45-36-202Z/exec-session-ended.png).

## Gerçek iki-container düşüş caption'ı

İki ayrı Pod önce API'de Running/Ready, her iki container Ready ve restartCount 0 oldu. Normal Bul → Pod paneli → `Sahnede göster` kullanıldı. Her genişlikte kendi `controlled-crash-<width>` container'ına gerçek exec ile yalnız owned emptyDir bayrağı yazıldı; süreç exit 42 verdi. Sağlıklı container'a sinyal gönderilmedi.

**768:** Pod UID `90e93ef5-22ab-4acc-9cba-ca8a539b7509` korundu. Bağımsız post-fault API'de controlled container restartCount 1 ve last termination exitCode 42; healthy container Ready, restartCount 0 ve başlangıç zamanı değişmemişti. Üç zamanlı örnekte caption taşmıyor, projected marker ve container-body AABB ile kesişmiyor. [Erken](runs/2026-11-09T10-39-50-109Z/fall-768-early.png), [orta](runs/2026-11-09T10-39-50-109Z/fall-768-middle.png), [geç](runs/2026-11-09T10-39-50-109Z/fall-768-late.png) PNG'ler açıldı; metin okunaklı ve gerçek düşen kutudan ayrı.

**1280:** Pod UID `7dcb6ee0-562c-48b7-9061-dd541bf1ffd9`; gerçek Ready baseline ve kontrollü süreç tetiklemesi kaydedildi. Canlı watch'tan türeyen lifecycle aynı UID için count 1 / Error arıza geçişi verdi. Üç caption örneği viewport içinde ve unclipped; marker overlap false. [Erken](runs/2026-11-09T10-39-50-109Z/fall-1280-early.png), [orta](runs/2026-11-09T10-39-50-109Z/fall-1280-middle.png) ve [failfast anındaki geç görüntü](runs/2026-11-09T10-39-50-109Z/failure.png) açıldı. Metin okunaklı; görüntüde düşen kutuyu kapatmıyor.

1280 geç örneğin katı AABB sonucu korunur:

- Caption: x `[445.8513, 665.8513]`, y `[385.5421, 431.1358]` CSS px.
- Container-body projected AABB: x `[395.5779, 446.0102]`, y `[430.8357, 472.9082]` CSS px.
- Köşe kesişimi yaklaşık **0.159 × 0.300 CSS px = 0.0477 CSS px²**. Marker kesişimi yok.

Bu axis-aligned sınırların kesişmesi, dönen gerçek kutu yüzeyinin veya metnin görünür örtülmesini tek başına kanıtlamaz. PNG incelemesi ayrı, sıfır toleranslı geometri assertion'ı ayrı tutulur; ham FAIL silinmedi. Failfast nedeniyle 1280 `afterFailure` bağımsız API snapshot/exit42/healthy-sibling assertion'ı **NOT RUN** ve alan `null` kaldı. Lifecycle kanıtı bağımsız post-API sonucu diye sunulmaz. 1440 tarihsel actual caption kaydı [önceki görsel incelemede](../visual-resume/REVIEW.md) korunur; burada tekrar edilmedi.

## Temizleme ve son freeze

Beş koşunun toplam sekiz Pod ve beş namespace incarnation'ı exact UID/resourceVersion DELETE ardından GET 404 ile doğrulandı. Her browser context kapandı, browser disconnected oldu, watchdog temizlendi ve HTTP log stream sayısı 0 kaldı.

[Son bağımsız kernel kontrolü](kernel-cleanup-final.json), `2026-11-09T10:46:31Z`:

- Beş helper proxy PID'si artık yok; port 19493 endpoint sayısı 0.
- Exclusive test browser süreç sayısı 0.
- Root'un gateway portu 18410: yalnız LISTEN 1, bağlı TCP endpoint 0. Gateway root'a aittir ve bu worker tarafından durdurulmadı.
- Canonical `/ws` için Playwright close olayı her koşuda gözlenmedi; bu ham alanlar false kaldı. Bağımsız kernel sonucu gerçek transport kapanışını gösterir. Exec WS close olayı ayrıca doğrudan gözlendi. Bunlar Go heap/goroutine veya genel leak garantisi değildir.

Worker'ın aktif helper/browser/proxy süreci ve kalan owned fixture'ı **0**. Bütün test/API/browser işleri durdu; yalnız bu inceleme yazıldı. Ürün kaynak/binary freeze korunuyor; başka test veya düzeltme başlatılmayacak. Release/kabul kararı root'tadır.
