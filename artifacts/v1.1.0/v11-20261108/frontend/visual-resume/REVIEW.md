# Gerçek UI P2 görsel regresyon incelemesi

Tek test işi `node artifacts/v1.1.0/v11-20261108/frontend/visual-resume/run.mjs` ile 2026-11-09 08:06:31.575–08:06:44.236 UTC arasında çalıştı. Root'un sağladığı yeni production embedded gateway `18410` kullanıldı. Bu worker ürün, e2e, build veya Git kaynaklarını değiştirmedi; yalnız bu artifact dizinine yazdı. İşlevsel/görsel sonuç PASS; performans veya fiziksel frame/latency kabulü değildir.

## Gerçek veri ve etkileşim

- A cluster UID `a24740ba-cf3e-461d-b5b3-250deeb060d7`; yalnız `kv-repair-v11-visual` namespace UID `d7caf112-1bcd-4405-a85b-2d850d8a5482`, `kubeview.io/v11-owner=v11-20261108` altında dört tiny Pod kullanıldı. Cluster/namespace owner+UID her mutasyondan önce denetlendi. Global Node/status/drain/CNI/policy değişikliği yapılmadı.
- Alpine 3.21 istemci, gerçek ve farklı nginx:1.27-alpine server Pod IP'lerine istek gönderdi. İstemci ile `flow-same` aynı Node'da, `flow-cross` başka Node'daydı. Kendi IP'sine trafik kanıt sayılmadı. Yedi gerçek `/api/flows` GET yanıtında UID, zaman, TCP ve pozitif eventCount doğrulandı; en yoğun örnekte 57 ayrı fixture grubu vardı. Değerler `result.json` içindeki `flows` alanında tutulur. Bu sayılar paket/byte/bant genişliği değildir.
- UI'da bağlantı/namespace seçildi; yönetim modu açılmadı. Görünüm ve ayarlar → Ölçülmüş trafik — Hubble checkbox'ı normal UI ile açıldı. 3D akış oku gerçek mouse click ile seçildi; açılan panel gerçek `flow-client` UID `5fdce837-ab9d-4c39-8065-5bc7967a4a53` → `flow-cross` UID `193bcfad-76de-4f60-910a-cd809d41c8b4` endpoint'lerini gösterdi. `flow-normal-mouse-selection.png` açılıp incelendi. Semantik klavye akış seçimi bu dar işte yeniden sınanmadı; PASS iddiası yoktur.
- Sağlayıcı CLI doğrudan `.git/kv-repair-runtime/bin/hubble version` ile `v1.20.2@HEAD-90adec1`, Go1.27.1 darwin/arm64 olarak doğrulandı. Root'un önceden yapılandırdığı gerçek TLS provider kullanıldı; TLS/credential değerleri, payload, URL veya header trace'i kaydedilmedi. Selector topolojisi ölçülmüş akış kanıtı olarak kullanılmadı.

## Açılarak incelenen görseller

`traffic-title-768.png`, `traffic-title-1280.png`, `traffic-title-1440.png` açılıp incelendi. Üçünde de Hubble başlığı okunuyor, satır sarıyor, viewport içinde kalıyor. DOM ölçümünde 320px başlık genişliği, 318px scroll/client genişliği ve `clipped=false` elde edildi. Dar görünümde başlık sağdan 16px içeridedir. Bu kayıt 57 fixture grubuna kadar gözlemdir; sınırsız yoğunluk kabulü değildir.

`container-ready-baseline.png` gerçek ilk 2/2 Ready durumunu gösterir. Sonrasında yalnız controlled-crash container'ına gerçek kubectl exec ile owned emptyDir test bayrağı yazıldı; process gerçek `exit42` üretti. Bu açık kontrollü fault injection'dır, kendiliğinden altyapı arızası değildir. İlk snapshot'ta arızalı fixture kullanılmadı.

- Önce: Pod UID `56ff1fc5-f1e1-4cd0-b9e2-3f66990ca16d`, RV28449, phase Running; iki container Ready, restartCount0.
- Sonra: aynı Pod UID, RV28471, phase yine Running; controlled-crash ready=false, restartCount1, last terminated exitCode42; healthy ready=true, restartCount0. CrashLoopBackOff bir Pod phase olarak yorumlanmadı.
- `container-fall-early.png` (08:06:41.053 warning), `container-fall-middle.png` (08:06:41.866 falling), `container-fall-late.png` (08:06:42.884 faulted) açılıp incelendi. Düşüş boyunca açıklama okunuyor; Pod tooltip'i ile üst üste binme görülmedi. Son açıklama kaynak hâlâ mevcut bilgisini koruyor. Healthy container için visual lifecycle arıza kaydı oluşmadı. Fall bu işte 1440×900'de sınandı; dar fall caption ve başarılı Job false-alarm yeniden sınanmadı.
- `video/page@4e2e027cdc084ceb07131876e4cb4426.webm` ffprobe ile 1440×900, 10.84s doğrulandı. Videonun 7/8/9 saniyelerinden çıkarılan `video-review-01/02/03.png` karelerinin üçü de açılıp incelendi; baseline → düşüş → mevcut kaynağın arıza izi geçişini gösteriyor.

Kamera resetlenmedi, kalite/DPR değiştirilmedi. Normal finder seçimi yapıldı; ürün state setter veya sahte WS/API cevabı enjekte edilmedi. PNG/video açılarak inceleme görsel kanıttır; no-jank, fiziksel FPS veya dokunmatik gecikme iddiası taşımaz.

## Kaynak farkı ve teslim sınırı

İş sonunda HEAD `0e2d7cf4817ed935a34e14e2c225efd2c6aa1b19`; `git diff --name-only -- frontend/src frontend/e2e frontend/tests` boştu. Git yazma root'a aittir. Form ve connection dosyalarının hash'leri frontend'in son unit freeze'i ile aynıydı:

| Dosya | SHA-256 |
| --- | --- |
| ResourceForms.jsx | `634cb66753b31899b8e3acd41972f46950bde37d5dd1aac47f9f06da46702398` |
| ShipyardClusterContext.jsx | `4373befda5ef637f99fa632a55a9d06e05e202b4b003e37d7e1337283f3fab6e` |
| LifecycleEffects.jsx | `e68fd8a180a44ae7ea0974a8572c099cf16e6be6642f71dde7831a2e32eb607c` |
| MeasuredTraffic.jsx | `2379cfe1f870ff366a336295641592f4958f230dbf03230889662cef333d539d` |

Son iki görsel dosyanın hash'leri önceki QA `2026-11-09T07-54-11-952Z-chromium-fce93bc0` başlangıç kaydıyla da aynıdır. Önceki form/context hash'leri reconnect düzeltmesi nedeniyle farklıdır; o eski koşunun PASS'ı bu kaynağa taşınmadı. Tüm kaynak/build grafiği eşliği root'un freeze/build kaydıyla bağlanmalıdır; bu kısa worker raporu tek başına tüm paket eşliğini iddia etmez.

## Cleanup ve süreçler

Trafik katmanı UI'dan kapatıldı, browser context ve browser kapatıldı. Producer PID10333 ve yalnız cleanup için açılan kubectl proxy PID10484 SIGTERM ile sonlandırıldı; son `ps -p10333,10484` sonucu boştu. Başka worker'ın paylaşılan Hubble süreci durdurulmadı.

Dört exact owned Pod, gerçek DELETE Options UID+resourceVersion precondition ile silindi; her biri için GET404 gözlendi. Namespace de UID/RV precondition ile silindi, ardından `kubectl get namespace ... --ignore-not-found` boş çıktı. `result.json.remaining=[]`; kalan fixture ve bu işe ait aktif browser/producer/proxy yok. Başarısız cleanup kaydı bulunmuyor. Bir sonraki test lease'i root'a bırakıldı; yeni test başlatılmayacak.
