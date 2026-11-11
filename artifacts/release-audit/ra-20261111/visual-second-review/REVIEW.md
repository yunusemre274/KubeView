# Candidate02 — bağımsız ikinci görsel inceleme

İnceleme: 11 Kasım 2026, 11:32:06–11:33:48 UTC. Yalnız mevcut dört PNG araçla açıldı; UI_REVIEW.md, candidate02-binary.json ve iki motorun result.json dosyaları okundu. Kod, ağ, cluster, tarayıcı etkileşimi veya komut testi çalıştırılmadı. Ürün dosyası, roadmap ve Git değiştirilmedi.

**Sonuç:** İncelenen kareler iki ayrı limanı ve kalıcı dashboard olmadan tam ekran dünyayı gösteriyor. Root'un açık **P2 UI-002** kusuru doğrulanıyor. Bu sınırlı ikinci incelemede ek P1/P2 görsel kusur teyit edilmedi. Modal kenarında küçük bir kozmetik parça ve dar tablo için doğrulanması gereken bir erişim gözlemi var; aşağıda sınırlarıyla kaydedildi.

## Görsel olarak görülenler

| Açılan kare | Doğrudan görsel bulgu |
|---|---|
| `ui02-scope02-chromium/world-1440.png` | Proje 1 ve Proje 2 isimleri, ayrı merkez binaları ve üçer iskele açıkça ayırt ediliyor. İki yerleşim de kenarlardan kesilmiyor. Küçük üst araçlar, alt kapsam çipi ve kapatılabilir açıklama dışında dünya açık; kalıcı sidebar/KPI/table dashboard yok. Seçili Pod etiketi çerçeve içinde. |
| `ui02-scope02-chromium/world-768.png` | İki merkezin ve iskelelerin tamamı kadrajda; Proje 1/Proje 2 isimleri okunuyor. Dar görünümde dünya nesneleri küçülüyor, fakat bu karede geometri viewport dışına taşmıyor. Sağdaki Pod balonu tamamıyla görüntü içinde, iskele/merkez bölgesinin bir kısmını örtüyor. |
| `ui02-scope02-chromium/center-768-940ea70a-0b63-4656-8f77-c56620496a4a.png` | Liman Yönetim Merkezi opak, açık renkli geçici pencere olarak dünyayı örtüyor. Başlık, kapanış, sekmeler, oluştur/YAML düğmeleri, arama, tek Deployment satırı ve alt sayfalama okunuyor. Alt başlık ve satırda `kvml-bc565b30-02-p2` görülebiliyor. Pencere yaklaşık x20–747 / y100–800 sınırlarıyla viewport içinde. |
| `ui02-scope02-webkit/world-768.png` | İki ayrı bina/iskele düzeni kadrajda. Proje 1 adı okunuyor. Sağdaki seçili Pod balonu sağ kenardan taşıyor; namespace'in sonu kesiliyor ve Proje 2 isim balonunu örtüyor. Bu, açık UI-002'nin aynı karedeki okunurluk etkisidir; ayrı bir ikinci P2 olarak sayılmadı. |

Opak SoftUI merkez penceresinde dünya dokusu metnin arkasına geçmiyor. Aktif sekme ve ana eylem maviyle ayrılıyor; birincil metinler okunabiliyor. Bu gözlem sayısal kontrast, klavye odağı veya ekran okuyucu kabulü değildir. Üst soldaki dar kimlik çipinin context metni ellipsis ile kısaltılmış; merkez penceresi ve tablo satırı namespace için ayrıca görünür kanıt sunuyor.

## Ek gözlemler

1. **V2-OBS-01 — küçük kozmetik parça (P3 değerlendirmesi):** Chromium merkez-768 karesinde modalın sağ dışında, yaklaşık **x748–758 / y366–410** konumunda beyaz dolgulu/mavi çerçeveli bir etiket parçası kalıyor. Tam bir metin veya kontrol olarak okunamıyor. Yakındaki dünya etiketinin pencere arkasından taşan kısmı olması olasıdır; bunun hangi bileşen olduğu yalnız ekran görüntüsünden kesinleştirilemez. Pencereyi veya ana kontrolleri kapatmıyor. Root isterse modal açıkken dünya etiketlerinin görünürlüğünü ayrıca kontrol edebilir; bu inceleme bunun için etkileşim yapmadı.
2. **V2-OBS-02 — doğrulama gerekli, kusur olarak kapatılmadı/açılmadı:** Aynı merkez karesinin sağında son tablo sütununun başlığı ve image hücresi kısmen kesiliyor (yaklaşık x730–747). Görünen ad, namespace, replica ve hazır sayıları okunuyor. Yatay kaydırma veya başka bir erişim yolu ekran görüntüsünde gösterilmiyor; bu nedenle “image bilgisine erişilemiyor” sonucu çıkarılamaz. Dar tablo için scroll/focus kontrolü ayrıca gereklidir.

İskelelerin kesilmesi, iki limanın birbirine karışması, ana pencerenin viewport dışına çıkması veya kalıcı dashboard eklenmesi yönünde bu dört karede yeni kanıt yok.

## Kaynak ve doğru kimlik kanıtının sınırı

`candidate02-binary.json` ve iki result.json aynı binary SHA256'yi bildiriyor:
`1003a43a6a808193d0d36695a4d7782fee8b754fb92df99ab0220511df1f7bf0`.
Frontend index SHA256:
`29b73d5325ec01a5c4ffe0ff20002c7ec131b46c40c2ce4b2ac614cc957834db`.
Manifestin base commit'i `49999815cf27ca47888fdc5d62cb1f7caf3bbd11`; dört dirty runtime dosyasının ayrı hashleri kaydedilmiş ve `notFinalPackage: true`. Bu yüzden temiz final paket veya sadece commit'e eşit runtime iddiası yoktur.

İki motordaki kayıtlarda eşleşen kimlikler:

| Görünür proje | Harbor ID | Namespace | JSON'da doğrulanan Pod UID |
|---|---|---|---|
| Proje 1 | `8a66d537-0eea-4102-af04-c9141006f49e` | `kvml-bc565b30-02-p1` | `6b8f5705-7ae8-4cf8-b311-debaad91e6d9` |
| Proje 2 | `940ea70a-0b63-4656-8f77-c56620496a4a` | `kvml-bc565b30-02-p2` | `124a944e-c096-4672-8075-4e8fab976441` |

result.json dosyaları Chromium 156.0.8078.4 ve Playwright WebKit 27.2 için normal pointer/merkez/finder akışında 1440, 1280 ve 768 genişliklerinde 15'er assertion, tek Canvas, boş `errors` ve boş `workspaceDenials` bildiriyor. Bu ikinci inceleme **1440 ve 768 için yalnız belirtilen dört kareyi** açtı; 1280 görünümünü veya assertion yürütmesini bağımsız olarak tekrar etmedi. Ekran görüntüsü UID'yi göstermez; doğru UID eşleşmesi ilgili JSON kontrol kaydının kanıtıdır. JSON'un gerçek owned Kubernetes kaynağı beyanı ayrıca root'un lab/provenance kanıtlarına dayanır; bu worker cluster'a bağlanmadı.

Bu kareler birer anlık durumdur. Tek başlarına dalga/gemi hareketini, Pod işleminin Kubernetes'te sonucunu, silme/yeniden bağlanma doğruluğunu, uzun süreli kararlılığı veya eksiksiz E2E'yi ispatlamazlar. Video açık işlev koşusunun sayaçları CPU/FPS/fiziksel gecikme kabulü değildir. Native Safari/Retina, final paket, performans kapıları ve kullanıcının manuel PASS/FAIL alanı bu incelemeyle kapanmaz.

## Okunan asıl kanıtlar

- `../UI_REVIEW.md`
- `../candidate02-binary.json`
- `../ui02-scope02-chromium/result.json`
- `../ui02-scope02-webkit/result.json`
- Yukarıdaki tabloda tek tek belirtilen dört PNG.
