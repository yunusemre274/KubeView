# Panel ve uygulama kaynak maliyeti — 26–30 Ekim 2026

## 30 Ekim devamı: dolu log tamponu ve son kabul

Yeni oturum `panel-final-20261030T093652Z`; aşağıdaki26 Ekim pil ölçümleri tarihsel v3 araştırmasıdır. Son v5 kaynak SHA'sı `83f7558dab979a0cf32458fb7f9f91049d78b853a68539124abce257badc5e57`. Yeni koşular AC güçte, geçici Chromium profilinin enerji tasarrufu kapalı; pil/AC sonuçları aynı çiftte karıştırılmaz. Ürün kalite/FPS/DPR ayarları değişmedi.

26 Ekim v3'ün20 dakikalık koşusu canonical doğruluk ve cleanup kontrollerini geçti, fakat **akıcılık kabulünü geçmedi**:56,72 çizim/sn, p9521,9 / p9982,9 ms,965 uzun görev.5000 normal satıra dolan log ile takılma ilişkisi ayrı kısa tanılamada yeniden üretildi. Bu başarısızlık başarılı olarak yeniden etiketlenmedi. Eski sınırsız-log sürümü tekrar çalıştırılmadı.

Kısa, input kilitli CPU profilinde v3 `PodLogs` scroll etkisi (`scrollTop = scrollHeight`, minified `index-ct8c3xw9.js:421:2949`)15 saniyenin2220 ms'sini örneklenmiş self duvar süresi olarak aldı. Bu toplam OS CPU yüzdesi değildir.32 satırlık kararlı ordinal grupları kullanan inline v4 adayı yeterli toplam kazanç göstermedi. Block v5 adayı değişmeyen log metin düğümlerini korur; tarayıcı tüm geçmişi tek inline akış olarak yeniden yerleştirmez. Her satır hâlâ DOM'da ve seçilebilir; sanallaştırma, eksik kaynak veya güncelleme seyrekleştirme yoktur. Satır/byte/partial sınırları ve180 ms flush korunur.

Gerçek ürünün5000 satırlık sabit tamponunda v3/v5 metin SHA'sı aynıdır (`422e8df8…9094`). Seçim metni, indirilen dosya, Türkçe filtre, filtreyi kaldırma ve sarma seçenekleri eşitliği geçti. İki ekran görüntüsü açıldı:1.296.000 pikselde154 farklı piksel yalnız veri saati yazısındadır. [Görsel kayıt](../benchmarks/results/panel-final-20261030T093652Z/log-visual-comparison.json). Blok span'ların `innerText` algoritması ek ayraç üretebilir; ürün içeriği ve indirmesi `textContent`/asıl satırlar, tarayıcı selection metni ise ayrıca doğrulanmıştır. OS clipboard'ı değiştirilmedi.

Sonlu seri plan ve ilerleme `benchmarks/panel-finish.mjs` / oturumun `*-state.json` dosyalarındadır. Ana stage üç dengeli blok, önceden sınırlı ekler iki blok çalıştırır; long tek1200sn koşudur. Kurtarma yalnız açıkça listelenmiş eksik/geçersiz hücrelerdir; başarısız işte durur, otomatik retry yapmaz. `--resume` bitmiş aynı argümanlı işleri atlar, yarım sonucu ezmez. `panel-accept.mjs` dosya başına n=1 kaydını toplu n=3 kabulüyle karıştırmaz. Son sonuçlar, başarısız örneklerin dışlanma gerekçeleri ve karşılanmayan CPU hedefleri aşağıdadır.

### Dolu log — beş eşleşmiş production çift

Her hücre30 sn ısınma +60 sn ölçüm, aynı5000satır/468889UTF-8byte başlangıç ve SHA, saniyede10 yeni satır. Kaynak Go sürecinde bağımsız üretilir; her hücrede600–601 satır geldi, panel sürekliliği ve CPU PID kapsamı doğrulandı. Baseline burada yalnız log değişikliğini ayıran **v3**'tür; ana uygulamanın başlangıç sürümüyle karıştırılmaz. AB/BA/AB/BA/AB sırası; ilk üç blokta değişkenlik görüldüğünden iki tam blok eklendi, beşte duruldu.

| Ölçüt | v3 medyan (min–max; n=5) | v5 medyan (min–max; n=5) |
|---|---|---|
| Toplam browser CPU, çekirdek |0,4922 (0,4284–0,4991)|0,4622 (0,4114–0,5747)|
| Renderer CPU, çekirdek |0,3490 (0,3159–0,3637)|0,2630 (0,2356–0,3215)|
| GPU süreci CPU, çekirdek |0,1243 (0,1086–0,1382)|0,1941 (0,1575–0,2471)|
| CPU ms / tamamlanan JS çizim |8,531 (7,230–8,608)|7,701 (6,854–9,576)|
| JS çizim/sn |58,214 (57,226–59,246)|60,021 (60,013–60,024)|
| p95 aralık, ms |41,7 (39,1–45,6)|17,7 (17,3–18,0)|
| p99 aralık, ms |50,9 (46,5–54,2)|17,9 (17,6–18,8)|
| En büyük browser PID RSS, MiB |459,4 (439,7–471,5)|386,2 (356,5–394,4)|
| JS heap, MiB; doğal GC noktası |38,6 (21,8–44,5)|43,6 (24,4–54,8)|

**Karar:** beş çiftin hepsinde takılma giderildi ve en büyük PID RSS'i azaldı. Renderer maliyeti azalırken GPU süreci CPU'su yükseldi; nedenine mevcut örneklenmiş V8 profili cevap vermez. Toplam CPU'nun eşleşmiş `sonra−önce` farkları `+0,0756 /−0,0344 /−0,0398 /+0,0118 /+0,0023` çekirdek; fark medyanı **+0,0023**. Dolayısıyla iki tarafın ayrı medyanlarından hesaplanan≈%6 azalma **tekrarlanabilir net CPU kazancı diye sunulmaz**. Aday akıcılık/RSS düzeltmesi olarak korunur; uygulama geneli CPU iddiası ayrı ana matristen değerlendirilir. JS heap daha düşük değildir; RSS toplam fiziksel RAM veya VRAM değildir. Log koşusunda Δpanel N/A; aynı Node seçili açık/kapalı maliyeti değildir.

Ağır tanılamadaki aynı scroll etkisi v5'te65,55ms/15sn örneklenmiş self süreye düştü;≈%97 toplam OS CPU tasarrufu anlamına gelmez. Kalan en büyük self yolları sıradan Three projectObject/getProgram/renderBuffer/updateMatrixWorld; her biri≈%0,9–1,1 örneklenmiş duvar süresi. Bounds hesabı≈22,5ms/15sn tek başına riskli yeni culling/Worker göçünü gerekçelendirmiyor. Eski logsuz GPU/timeline kaydı bu yeni log compositing farkını açıklamaz. [Bağımsız müdür incelemesi](../benchmarks/orchestration/perf-hotpath-review.md).

### Son ana M matrisi — beş eşleşmiş blok

Başlangıç byte sınırlı sürüm (`b4303be3…0a6e3b`) ile v5 karşılaştırıldı. Her tarafta dört koşul ×beş blok, toplam40 geçerli hücre;30sn ısınma +60sn ölçüm. AC/medium/DPR1/1440×900, aynı seçili `node-0`,8 görünür gemi/120 Pod, kamera ve başlangıç filo fazı. Her5olay/sn hücresi300 olay ve tam canonical içerik kontrolünü geçti. Aşağıdaki değerler medyan (min–max; n=5); GPU süreci CPU'su GPU zamanı değildir.

| Koşul | Önce toplam browser CPU, çekirdek | Sonra toplam browser CPU, çekirdek | p95 / p99 aralık medyanı, ms; önce → sonra | En büyük PID RSS, MiB; önce → sonra |
|---|---|---|---|---|
| Kapalı /0olay |0,3205 (0,2031–0,3358)|0,3097 (0,2612–0,4061)|17,5/17,7 →17,6/17,9|310,7 →303,4|
| Açık /0olay |0,2821 (0,2133–0,3288)|0,3913 (0,2481–0,4442)|17,4/17,7 →17,6/17,8|328,1 →323,1|
| Kapalı /5olay-sn |0,3094 (0,2686–0,3613)|0,3777 (0,3282–0,6938)|17,5/17,7 →17,7/18,4|343,6 →340,0|
| Açık /5olay-sn |0,3682 (0,2928–0,4054)|0,3488 (0,3047–0,4155)|17,6/18,1 →17,7/19,1|377,2 →362,8|

| Signed Δpanel = açık−kapalı | Önce, çekirdek; medyan (min–max) | Sonra, çekirdek; medyan (min–max) |
|---|---|---|
|0olay |−0,0048 (−0,0566–+0,0357)|+0,0108 (−0,0616–+0,1301)|
|5olay/sn |+0,0442 (+0,0242–+0,0713)|−0,0007 (−0,3891–+0,0206)|

**Yorum:** logsuz panel için tekrarlanabilir toplam CPU kazanımı kanıtlanmadı. Özellikle kapalı/5olay ve açık/0olay medyanları yükseldi. Δpanel'in azalması tek başına başarı değildir: kapalı koşulun maliyeti de yükselmiştir. Bütün koşular≈60 JS çizim/sn; en kötü aday p9518,3/p9921,7ms ile M kare bütçesinde kalır, fakat CPU farkını yok saymak için bu bütçe kullanılmaz. Callback→store p95 medyanı0,5→0,6ms; açık/5olay sonraki çizim proxy'si11,7→10,6ms. Bunlar fiziksel sunum ve tüm kontrollerin kullanılabilirliği kanıtı değildir. Dağılımlar, her blok ve süreç kırılımı [40 hücre karşılaştırmasında](../benchmarks/results/panel-final-20261030T093652Z/panel-comparison-5blocks-clock-guarded.json) bulunur; belirgin CPU artışının nedeni ölçülmüş frekans veya çekirdek yerleşimi diye uydurulmaz.

İlk kapalı-panel hücresi başlangıçta açık olduğundan reddedildi. Orijinal başarısız dosya korunur; yalnız bağımsız geçerli ilk hücre açık provenance ile türetildi. Isınma öncesi input koruması/DOM doğrulaması eklendikten sonra19 eksik hücre tamamlandı, iki ek tam blokla beşte duruldu. Bu CPU sonucuna göre örnek seçme değildir. İlk bloğun kesintili zaman aralığı ve eski ısınmada input korumasının bulunmaması sınırlamadır. [Kurtarma ledger'ı](../benchmarks/results/panel-final-20261030T093652Z/matrix-recovery-ledger.json).

### Kapasitesi tutulan instance tamponu adayı — reddedildi

V5'in görünür Pod sayısı değişince oluşturduğu instance tamponları için ayrı frozen prototip denendi (`73dc4f7e…7d47e`). Aktif sayım korunarak geometrik kapasite, ayrı buffer yaşam döngüleri ve yalnız aktif prefix yükleme kullanıldı.15sn/75olay tanılamasında buffer oluşturma/silme/data kurma20→0, görünür matris/çizim/üçgen dağılımları aynı; `bufferSubData`2846→2868 olduğundan bütün upload işi kalkmış değildir. Bu tanılama normal CPU kabulüne karıştırılmaz. Ek tutulan JS typed-array payload **11.720bayt**; VRAM veya fiziksel RAM ölçümü değildir.

30+60sn ×beş eşleşmiş AC çiftte v5 CPU medyanı0,3853 (0,2919–0,4044) → prototip0,3732 (0,3435–0,4778) çekirdek. Eşleşmiş farklar `−0,0609 /−0,0410 /+0,0164 /+0,1859 /+0,0231`; üç çiftte artış, fark medyanı **+0,0164**. Ayrı medyanlardan≈%3,1 düşüş hesaplamak net CPU kazancı kanıtlamaz. Kaynak doğruluğu ve≈60 çizim/sn korunmasına rağmen production'a alınmadı; beşinci tekrarda deney kapatıldı. Prototip ve negatif sonuçlar korunur, gerçek frontend v5'in67 dosyasıyla hâlâ eşittir. [Bağımsız son karar](../benchmarks/orchestration/capacity-acceptance-review-final.json). Prototipin16 Chromium/WebKit testi, production v5'in14 testinden ayrı kanıttır.

### Son doğrulamanın güç kapsamı

AC ana matris/log/kapasite ölçümleri tamamlandıktan sonra cihaz pil gücüne geçti. İlk son-kararlılık işi AC kapısında185ms içinde, **sıfır ölçümle** durdu; başarısız kaydı korunur. Kullanıcının pille devam tercihiyle yeni `panel-validation-20261030T121222Z-battery` oturumu açıldı. Yalnız son v5 kararlılığı ve kalan yardımcı kontrol çiftlerini içerir; güç her koşu içinde ve oturum başlangıcında doğrulanır. Bu pil sonuçları AC CPU dağılımlarına eklenmez.

### Son v5 —20 dakikalık kararlılık

[Yeni1200sn koşu](../benchmarks/results/panel-validation-20261030T121222Z-battery-long-optimized-b0/summary.json)30sn ısınma sonrası tamamlandı: **59,999 çizim/sn, p9517,7/p9918,9ms**, en uzun kare aralığı32,2ms;0uzun görev ve0adet>50ms aralık. Callback→store p950,7ms, ilgili çizim proxy'si17,6ms. DOM/rAF işaretleri fiziksel sunum veya bütün panel kontrollerinin kullanılabilirliği değildir.

5600 upstream olay uygulandı; üç reconnect aralığı nedeniyle5567 canlı mesaj alındı. Son canonical içerik hem upstream hem planla tam signature eşitliğinde, yalnız sayım değildir.40 quiet checkpoint'in tamamında sayılar başlangıç çalışma kümesine döndü; bu40 noktada full-content eşitliği ölçüldüğü iddia edilmez.3reconnect ve329gerçek aynı-sürüm informer resync callback'i gözlendi.21log isteğinin tamamı kapandı; remaining0, worker süreç cleanup'ı tamamlandı. Bu uzun koşu varsayılan frozen backend `aec1e5c6…34ed` kullanır; gated log karşılaştırmasının `e196536a…7076` binary'si değildir.

Bu tek, tek taraflı pil koşusu eşleşmiş CPU tasarrufu kanıtı değildir. Browser CPU0,3979çekirdek (renderer0,2450/GPU süreci0,1467/main0,0047); gözlenen PID değişimi0. En büyük browser PID RSS tepe447,0/son322,7MiB. Go test süreci CPU0,0051çekirdek, RSS tepe123,2/son118,5MiB; fake tracker/üretici de bu süreçtedir. Enerji veya bağımsız gateway CPU kazancı iddiası yoktur.

İlk10dk tampon dolumu, sonraki10dk tekrar açılışlar farklı tutulan veri miktarıdır;5000satırla≈300satır heap/RSS farkı tasarruf diye yorumlanmaz. Dolu5000satır/n6 checkpoint'te DOM814–829, V8 used20,65–49,72MiB; yeniden açılan296–298satır/n19 grupta DOM518–532, V8 used18,23–43,28MiB. Aktif interval1, timeout0–3, observer2Mutation+1Resize, WS1; doğal GC inişleriyle sürekli büyüme görülmedi. Texture3; geometri1026,65sn civarında29→30bir kez artıp sonuna kadar30kaldı. Sebebi mevcut artefaktlardan atfedilemiyor; tamamen sıfır kaynak artışı veya genel leak-free garantisi verilmez. Dolu tamponun480–620sn bölümünde p9517,7/p9918,3ms; en kötü30sn bandında18,6/24,2ms. [Bağımsız ayrıntılı inceleme](../benchmarks/orchestration/backend-final-long-review.json). Yardımcı S/L/burst/interaction/idle/log/DPR2 matrisi60geçerli hücreyle tamamlandı; ayrıntılı tablo aşağıdadır.

### Son işlev, native tarayıcı ve teslim sınırı

Bağımsız son inceleme111geçerli ölçüm hücresini doğruladı:40ana M +10dolu-log +60yardımcı +1uzun kararlılık. Bütün kabul edilen hücrelerde saat/PID kapsamı tam; en büyük OS/browser süre farkı229ms. Mevcut27üretici/full-signature kontrolünün tamamı ve29kontrollü hücrede43/43log kapanışı doğru, remaining0. [Son bağımsız inceleme](../benchmarks/orchestration/perf-final-acceptance-review.json). Bu111sayısına reddedilen kapasite prototipi, uyuyan/eksik örnekler veya kısa tanılamalar katılmaz.

Native Chromium60sn gerçekten küçültüldü:0gizli çizim, gizliyken doğru canonical içerik ve dönünce kontrollü seyir. [Sonuç](../benchmarks/results/panel-final-20261030T093652Z-visibility/result.json). Bu test OS kapağı kapalı uyku testi değildir.

Kurulu Safari27.0.1 WebDriver erişimi30Ekim yine unavailable oldu. Gerçek manuel fallback de ayrı, yalnız bize ait localhost penceresinde denendi; Safari `Allow JavaScript from Apple Events` kapalı hatası verdi. Pencere kapandı, kullanıcı ayarları veya başka sekmeler değiştirilmedi. Native Safari CPU/FPS/heap ve native Retina karşılaştırması **N/A**; Playwright WebKit14testlik işlev setinin parçasıdır ve Safari performansının yerine geçmez. [WebDriver](../benchmarks/results/panel-final-20261030T093652Z-native-safari/availability.json), [gerçek manuel deneme](../benchmarks/results/panel-final-20261030T093652Z-native-safari-manual/result.json).

Bir kurtarma interaction hücresinde yardımcı rendererPID18773→20481 değişti. Frame/işlev kanıtı korundu fakat CPU kapsamı eksik sayıldı. Aynı rapordaki geçerli idle açık provenance ile türetildi; yalnız interaction için tek ek30+60sn koşu tamamlandı. Son on yardımcı ailede3/3tam eşleşme ve bütün kimlik/saat/PID kapıları geçer. [PID kurtarma ledger'ı](../benchmarks/results/panel-validation-20261030T121222Z-battery/interaction-pid-recovery-ledger.json).

**Teslim kabulü kısmidir:** hedefli log akıcılığı/RSS/boş iş ve allocation düzeltmeleri doğrulandı; genel açık-panel/toplam CPU azalması ve bütün fiziksel UI gecikme hedefleri doğrulanmadı. Ölçülen CPU artışları, tek732,2ms DOM-proxy örneği, DPR2heap artışı, tek geometri artışı ve Safari engeli açık kalır. Bütün görevler veya bütün performans kabulü tamamlandı iddiası yoktur. Başka teknolojiye geçmenin net yararı gösterilmedi. Son üretim kaynağının67dosyası frozen v5 ile tekrar eşleşti; kullanıcı değişiklikleri ve eski ölçümler korundu. [Son kaynak doğrulaması](../benchmarks/results/panel-final-20261030T093652Z/final-source-verification.json).

### Güncel kanıtı tekrarlama

Son yardımcı matris sırasında16:55:25'te macOS `Clamshell Sleep` kaydetti. Burst aday/block2 örneğinde OS CPU penceresi652699ms, tarayıcı aktif penceresi60072,7ms idi; CPU'nun0,0506çekirdek görünmesi uyku süresiyle seyrelmiş **geçersiz** sonuçtur. Ham kayıt değiştirilmedi ve kabul dışında tutuldu. Diğer115 production hücresinde fark en fazla229ms. Yeni ortak saat kapısı, OS/browser pencere farkı1sn'yi aşarsa sonucu reddeder;1sn yalnız sınırdaki inventory/IPC payıdır, uyku toleransı değildir. Karşılaştırma geçmiş kayıtlara da bu kapıyı uygular. Bu hata için ve mevcut harness'te12/12 test geçti.

Dış worker7200sn sınırında temiz kapandı;52geçerli hücre korundu, bir geçersiz burst ve yedi eksik hücre yeni kimliklerle, yalnız block2 aday tarafında tamamlandı. Otomatik retry yoktur. İlerleme izleyicisi önce eski `stage.status=running` dosyasına bakıp timeout sonrası yanlış “çalışıyor” mesajı verdi; artık kuyruktaki worker terminal durumu önceliklidir. Bu raporlama hatası açık kaydedildi. [Uyku/kurtarma ledger'ı](../benchmarks/results/panel-validation-20261030T121222Z-battery/sleep-recovery-ledger.json). Kurtarılan block2 çiftlerindeki çok saatlik aralık, kontrol edilmeyen ısı/frekans kayması için sınırlamadır; bu çiftler güçlü nedensel CPU kazancı diye sunulmaz.

Mevcut bağımlılıklar kuruluysa aşağıdaki komutlar yeni adlarla frozen build üretir; eski build'leri ezmez. İkinci komut yalnız geçici kaynak kopyasına kayıtlı v5 farkını ters uygular ve başlangıç dosyalarının tamamını SHA listesine karşı doğrular:

```sh
node benchmarks/panel-build.mjs BENIM_V5_BUILD
node benchmarks/panel-build.mjs BENIM_BYTE_SINIRLI_BASELINE \
  --baseline-from benchmarks/results/panel-final-20261030T093652Z
node benchmarks/run.mjs --phase baseline --build-tag BENIM_BYTE_SINIRLI_BASELINE \
  --profiles M --panel-matrix \
  --scenarios panel-closed,panel-open,panel-closed-events,panel-open-events \
  --repeats 3 --warmup 30 --seconds 60 --disable-browser-energy-saver \
  --lock-input --id BENIM_YENI_BASELINE_RUN
```

`--build-tag` kaynak/build kimliği, `--panel-matrix` aynı seçimi koruyan dört koşul, `--lock-input` yalnız ölçüm sayfasında girdi korumasıdır. İlk temiz çalıştırmada `--reuse-binary` verilmediği için test binary üretilir; sonraki aynı binary koşularında bu bayrak eklenir. Aynı makinede seri, dengeli AB/BA blokları için oturum JSON'unu **yeni id** ile kopyalayıp baseline/candidate etiketlerini bu yeni build'lere ayarlayın; `powerSource` gerçek AC veya battery olmalıdır. `panel-finish.mjs matrix --session YENI_OTURUM.json` bu mevcut sonlu sırayı uygular. Mevcut id ve tarihsel state dosyaları üzerine yazılmaz. `panel-accept.mjs YENI_OTURUM.json` kimlik/tekrar/güç/veri kapılarını, `panel-export.mjs YENI_OTURUM.json` başarısız/diagnostic dahil ham satırları dışa aktarır. JSON/CSV'de `fileSmokeFlag` n=1 dosyasını gösterir;30/60sn süresini kısa koşu saymaz, toplu kabulün yerine geçmez.

### Gerçek müdür/worker düzeni ve işlev kontrolü

Kullanıcının ek talimatıyla üç Codex alt müdürü ve Terminal'de onların gerçek günlük/iş devrini gösteren üç supervisor ile üç test worker'ı kuruldu. Worker'lar ayrı LLM oturumu değildir; tek bir sonlu test işini gerçek alt süreçlerde çalıştırır. Merkezi lease performans işi yanında başka test/build/tarayıcıyı engeller; kaynak grant öncesi frozen SHA listesiyle doğrulanır. [Çalıştırma ve kaynak bütçesi](../benchmarks/orchestration/README.md), [geçiş snapshot'ı](../benchmarks/orchestration/handoff-snapshot.json).

- Frontend worker: son kaynakta14/14 Chromium/WebKit testi. Yeni pause/resume testi gerçek HTTP opened/closed sayacı ve ham Pod/container/tail isteğini kontrol eder. İlk13/14 koşu başarısız olarak korundu; WebKit kamera testinin sabit800ms beklemesi üç kararlı pose gözlemiyle değiştirildi. Mevcut0,1 yön sapması toleransı ve ürün kodu aynı kaldı. [Son sonuç](../benchmarks/results/panel-final-20261030T093652Z-frontend-evidence-v2/result.json).
- Backend worker: frozen gated binary ile tek contract işinde7/7 kontrol; gerçek informer ADD/UPDATE/DELETE, reconnect yeni generation, full canonical eşitlik, gate hataları ve HTTP abort1/1. Önceki uygun Go/race testleri yeniden çalıştırılmadı. [Contract](../benchmarks/results/panel-final-20261030T093652Z-orchestration/backend-contract/result.json).
- Süpervizörün5/5 odaklı testi çıktı drain, TERM→KILL, worker kapanışı, bilinen detached child ve PID yeniden kullanım korumasını doğruladı. Cleanup eksikse lease bırakılmaz. Yalnız sahipliği PID+birth ile doğrulanmış süreçlere sinyal; bilinmeyen orphan'ı tahminen öldürme yoktur. Aktif ölçüm iptal edilmedi, supervisor'lar yalnız boş kontrol noktasında değiştirildi.
- Müdür10 PNG'yi gerçekten açtı; fullscreen ve Soft UI korunur. WebKit bounded-log PNG'si sidecar'a geçerken0satır/bağlanıyor durumundadır, dolu tampon görsel kanıtı sayılmaz. Silinen UID karesinde geçici etiket örtüşmesi kaydedildi; kapsam dışı görsel yeniden tasarım yapılmadı. [Görsel inceleme](../benchmarks/orchestration/frontend-visual-review.json). Bu set1280/dar/koyu veya200ms fiziksel kullanılabilirlik kabulü değildir.

Bu çalışma 25 Ekim raporundan sonraki **byte sınırlı log sürümünü** başlangıç kabul eder. Tarihsel 0,413 çekirdek hedef değildir. Eski 6,06 GiB başarısız log koşusu tekrar çalıştırılmadı. Yeni ölçümler `panel-20261026T082540Z-*` kimlikleriyle ayrıdır; eski ham veriler korunur.

<!-- final-aux-start -->
### Son yardımcı matris —60 hücre / üç eşleşmiş blok

Pilde, Chromium156/Metal, medium,1440×900CSS. S=5Node/50Pod; L=50/1500canonical ve mevcut bölgede8gemi/270Pod; M=20/300canonical,8gemi/120Pod. Ana AC matrisiyle birleştirilmez. DPR1renderer1; DPR2 etiketi **emüle cihaz2 / renderer1,4 / framebuffer2015×1260** demektir; native Retina veya renderer2 değildir. Her hücre30sn ısınma +60sn, AB/BA/AB blokları; kurtarma aralığı yukarıdaki ledger sınırlamasına tabidir.

Aşağıdaki CPU/RSS değerleri medyan (min–max), her tarafta **n=3**. CPU çekirdek eşdeğeri, RSS en büyük tek browser PID'idir. Kare aralığı p95/p99 medyanlarıdır. Gecikmeler **proxy**; fiziksel görünür geri bildirim ve tam panel kullanılabilirliği N/A. `comparable=true` kimlik/veri/saat/PID kapılarının geçmesidir; bütün performans hedeflerinin geçtiği anlamına gelmez.

| Senaryo | Kalite/DPR/tarayıcı | Önce CPU | Sonra CPU | Δpanel | p95/p99 ms önce→sonra | Store / draw / panel DOM proxy p95 ms sonra | En büyük PID RSS MiB önce→sonra | n | Karar |
|---|---|---|---|---|---|---|---|---|---|
|M DPR2 / kapalı|medium/2→1,4/Chromium|0.3175 (0.2344–0.3577)|0.3278 (0.2888–0.3436)|—|17.6/17.8 → 17.6/17.8|N/A / N/A / N/A|400.4 (399.1–401.4) → 395.1 (367.1–395.3)|3+3|CPU karışık (2azalma/1artış); net kazanç kanıtlanmadı|
|M DPR2 / açık|medium/2→1,4/Chromium|0.3580 (0.2008–0.5701)|0.2813 (0.2769–0.3391)|0.0003 (-0.0335–0.2526) → -0.0118 (-0.0623–0.0113)|17.6/17.9 → 17.6/17.7|N/A / N/A / N/A|382.0 (353.9–385.1) → 386.1 (380.9–386.3)|3+3|CPU karışık (2azalma/1artış); net kazanç kanıtlanmadı|
|S dünya (5/50)|medium/1/Chromium|0.2435 (0.2332–0.3001)|0.2699 (0.2401–0.3406)|—|17.6/17.8 → 17.7/17.9|N/A / N/A / N/A|326.0 (274.9–326.7) → 324.5 (320.8–326.0)|3+3|CPU karışık (1azalma/2artış); net kazanç kanıtlanmadı|
|L dünya (50/1500)|medium/1/Chromium|0.3132 (0.3014–0.3243)|0.2434 (0.2374–0.3045)|—|17.3/17.7 → 17.6/17.9|N/A / N/A / N/A|299.0 (276.0–307.6) → 281.0 (280.4–285.2)|3+3|CPU 3/3 azaldı; gözlemsel, genel/nedensel kazanç değil|
|M normal+burst|medium/1/Chromium|0.4729 (0.3869–0.7558)|0.4189 (0.3131–0.4379)|—|17.7/17.9 → 17.7/17.9|0.4 / 17.4 / N/A|337.5 (328.0–340.6) → 331.5 (328.9–332.3)|3+3|CPU karışık (2azalma/1artış); net kazanç kanıtlanmadı|
|M etkileşim|medium/1/Chromium|0.4151 (0.3927–0.4680)|0.3338 (0.3264–0.4336)|—|17.6/18.0 → 17.4/17.8|N/A / N/A / 9.6|354.2 (353.6–354.9) → 352.1 (352.1–352.3)|3+3|CPU 3/3 azaldı; gözlemsel, genel/nedensel kazanç değil|
|M idle (hareketler kapalı)|medium/1/Chromium|0.0032 (0.0028–0.0037)|0.0023 (0.0013–0.0037)|—|Idle; kare bütçesi uygulanmaz|N/A / N/A / N/A|290.1 (288.0–291.2) → 285.2 (284.3–288.6)|3+3|CPU karışık (2azalma/1artış); net kazanç kanıtlanmadı|
|M Pod özeti / log yok|medium/1/Chromium|0.2919 (0.2843–0.2992)|0.2976 (0.2565–0.3562)|—|17.1/17.5 → 17.6/17.8|N/A / N/A / N/A|320.7 (309.2–345.6) → 318.0 (314.4–318.8)|3+3|CPU karışık (2azalma/1artış); net kazanç kanıtlanmadı|
|M log / yeni satır yok|medium/1/Chromium|0.2541 (0.2227–0.2819)|0.3003 (0.2912–0.4108)|—|17.6/17.8 → 17.6/17.8|N/A / N/A / N/A|352.8 (346.4–362.3) → 328.4 (326.4–331.5)|3+3|CPU 3/3 arttı; iyileşme hedefi karşılanmadı|
|M log / uzun satır|medium/1/Chromium|0.2935 (0.2463–0.3747)|0.3793 (0.2709–0.3808)|—|17.4/17.7 → 17.6/17.8|N/A / N/A / N/A|446.9 (443.0–447.3) → 379.9 (378.5–381.2)|3+3|CPU karışık (1azalma/2artış); net kazanç kanıtlanmadı|

Kaynak ve ham run-id listeleri, her çiftin farkı, process kırılımı ve JS heap dağılımı [pil acceptance JSON](../benchmarks/results/panel-validation-20261030T121222Z-battery/acceptance.json), [bütün ham satırların CSV dışa aktarımı](../benchmarks/results/panel-validation-20261030T121222Z-battery/all-runs.csv) içindedir. Sleep örneği CSV'de saklanır fakat `excludedBySession` ve `measurementWindowValid=false` ile işaretlidir; sayısal0,0506 değeri başarı hesabına girmez.

Boşta ilk sürüm≈9, aday≈1JSçizim/60sn; bu koşulun amacı durgun dünyada gereksiz çizimi gözlemlemektir, ana kalite karşılaştırması değildir. Hareketli koşulların tamamında yaklaşık60JSçizim/sn korunur; L≈60'tan30'a düşürülmedi. Kaynak listesi, olay üretimi ve güncellik seyrekleştirilmedi.

**Açık kabul sınırları:** Genel panel CPU hedefi kanıtlanmadı; AC kapalı/5olay CPU beş çiftin tamamında, açık/0olay dört çiftte yükseldi. Pilde sabit-log CPU üç çiftte de arttı. Bunlar gizlenmez veya Δpanel küçüldü diye başarı sayılmaz. Dolu-normal-log setinde ayrıca yalnız aday tarafındaki tek DOM-proxy örneği732,2ms'dir; bütün UI gecikme hedefleri geçti denmez. Net kabul edilen en güçlü kazanç, beş çiftte dolu-log takılması ve en büyük PID RSS azalmasıdır; kaynak/alloc ve render tanılamaları bunun mekanizmasını destekler.

Kalan maliyet sıradan Three traversal/world-matrix/program/submit ve native GPU-süreç işidir. Yeni büyük bağımsız hesap çekirdeği gösterilemedi; ek kapasite prototipi beş çift sonunda toplam fayda göstermedi. Bu sonlu deney dizisi kapatıldı. Worker/WASM/framework göçü veya yeni spekülatif aday eklenmedi; mutlak optimum iddiası yoktur.
<!-- final-aux-end -->

## 26 Ekim tarihsel v3 araştırması: kimlik ve kapsam

Bu başlıktan sonraki26 Ekim kayıtları v3'e aittir. Güncel v5 kararı ve30 Ekim AC/pil sonuçlarının kapsamı yukarıdadır; aşağıdaki pil matrisini yeni AC sonuçlarıyla birleştirmeyin.

- Başlangıç commit: `5cfd30d7e0d6202bc1bd19dd8d0e4979fa2d5e8f`; kullanıcının mevcut farkı `ee1f7742950d53e4fcafcdc4c139ad5c7d310344ffd1aaf1e36bcae4738ed196`. Çalışma ağacı geri alınmadı. Kaynak kopyaları ve build başına SHA listeleri `benchmarks/.build/` içindedir.
- Baseline kaynak SHA: `b4303be395d683868b9185b05254279e5000e4435be752fb6d7f29e4210a6e3b`;26 Ekim adayı v3: `9d3bb7bd63d97926320c314405c8c607aed65cb2f3ae8a6460a742de792b1724`. [Oturum kimliği](../benchmarks/panel-session.json) ve her run manifest'i hangi frozen build'in kullanıldığını belirtir. Invocation Git diff'i frozen kaynak SHA'sı değildir.
- React/ReactDOM 18.3.1, R3F 8.18.0, Drei 9.122.0, Three 0.164.1, Vite 6.4.5, Playwright 1.64.1. Lockfile değişmedi. Go 1.26.5, client-go 0.30.0.
- MacBook Air Mac17,3 / Apple M5, 10 çekirdek, 32 GB; macOS 27.0.1; Chromium 156.0.8078.4 / Metal. Ana set 1440×900 CSS, emüle DPR 1 / renderer DPR 1, medium, 60 Hz, su ve seyir açık, FPS sınırı değiştirilmedi. Güç kaynağı pil; low-power ve diğer güç ayarları manifest'te. Frekans, çekirdek yerleşimi, sıcaklık ve enerji ölçülmedi.
- M fixture: canonical 20 Node / 300 Pod, mevcut bölgelemede görünür 8 gemi /120 Pod. Seed `20261024`; fixture/probe/backend binary SHA'ları manifest'te. Yeni gizleme/LOD/kalite azaltma yapılmadı. Gerçek Kubernetes admission/scheduler/controller ölçümü değildir; fake dynamic client → gerçek informer → WebSocket → store → App kullanılır. Canlı kümeye yazma yoktur.

## Panelin ölçülen anlamı

Önceki harness'in `panel` senaryosu Node UID `node-0` / `worker-001` gemisini gerçek canvas raycast'iyle seçip **Özet** sekmesini açıyordu. Bu panelde geminin Pod listesi, koşulları ve görsel seyir kontrolleri bulunur; log açık değildir. Panel kapanınca aynı Node seçili kalır. Böylece seçim etiketi/outline değişimini panel DOM maliyetiyle karıştırmayız. Kamera takibi kapalıdır, panel canvas'ı yeniden mount etmez veya küçültmez.

Yeni `--panel-matrix`: kapalı/0 olay, açık/0 olay, kapalı/5 olay/sn, açık/5 olay/sn. Her hücrede yeni upstream ve browser context, aynı kamera/UID/filo başlangıç fazı ve ayarlar. Görsel reset yalnız opt-in harness'te, ölçüm öncesindedir; canonical store değişmez. Ölçüm sırasında hareketler normaldir. Açma/kapatma geçişi kararlı panel CPU penceresine dahil değildir; geçişler ayrı etkileşim koşusundadır.

Her hücre 30 sn ısınma +60 sn ölçüm. İlk üç blokta bir CPU aykırısı görüldüğünden planlı beş bloka çıkıldı: baseline ilk 3 + eksiksiz 2 ek blok; aday 5 blok. İlk dosyalar ezilmedi ve örnek seçilmedi. Hücre sırası bloktan bloğa ters, adayda karşı parity kullanılır. Ek baseline dosyasının `smoke:true` alanı yalnız kendi `repeats:2` değerinden gelir; süreleri 30/60'tır, birleşik tekrar sayısı beştir.

`panel-compare.mjs` tüm blokları birleştirir; eksik/çift hücre, farklı fixture/probe/binary, kamera/DPR/başlangıç filo fazı, kaynak sayısı, güç, stale bağlantı, olay kaybı veya browser PID değişiminde karşılaştırmayı reddeder. Δpanel her blok için **açık − kapalı** olarak hesaplanır; negatif değerler korunur.

## Neden analizi ve değişiklikler

| Yol | Kaldırılan gereksiz iş | Doğruluk sınırı |
|---|---|---|
| `ShipyardClusterContext` → `resourceIndex` | Her yayında Node başına tüm Pod listesini filtreleme yerine tek geçişli UID/tür/Node/owner/Event indeksleri; değişmeyen bucket referansları korunur. | Canonical objeler kopyalanıp değiştirilmez; UID replacement, DELETE, source değişimi ve ilgili durum güncellemesi yeni referans üretir. Secret görünürlüğü değişmez. |
| `App` → `ResourceDetails` | Node/Pod paneli ilgili kaynak kümesini alır; kararlı callback/props ve memo ile ilgisiz olayda panel gövdesi hesaplanmaz. Güncellik metni ayrı context tüketicisidir. | Kendi Pod'ları, owner zinciri, olayları, koşulları ve metrik girdileri güncellenir. Silinen hedef yeniden scope'a sokulmaz; aynı adlı yeni UID'ye bağlanmaz. Form taslağı korunur. Genel türler tam kataloğu alır. |
| `FleetFrame` → App | Her 500 ms tüm filo snapshot'ı ve değişmeyen seyir bilgisi için state çağrıları yerine yalnız seçilen UID'nin panel alanları değişince yayın. | Tam filo snapshot arayüzü korunur. Takip ve hareket imperatif frame döngüsünde kalır; yeni loop yoktur. |
| `PodCargo` | Her frame her kutu için tekrarlanan deck şablonu, renk hesabı, trigonometrik dönüşüm ve geçici pose objeleri kaldırılır. UID template cache'i, Node başına dönüş tabanı, doğrudan instance matrisi yazımı. | Aynı instance/geometri/materyal ve hareketler. Seçim gerçek UID/container eşlemesine dayanır. Cache silinen UID'leri temizler; matris eşdeğerliği yaw/pitch/roll/scale testleriyle sınanır. Bu, tarihsel reddedilmiş world-matrix karşılaştırma cache adayı değildir. |
| `PodLogs` | Veri yokken 180 ms boş interval yerine yalnız chunk geldiğinde tek timeout; search/join yalnız girdisi değişince. | Aynı 180 ms flush, 5000 satır/1 MiB/16 KiB ve yarım satır sınırı. Kaynak/container/kapanış abort eder. Pause HTTP isteğini abort eder; resume yeni tail isteğidir, kayıpsız geçmiş replay iddiası yoktur. |
| Eski log inceleme | Yeni içerik gelince eski satırlara bakan kullanıcıyı aşağı çekmek yerine scroll konumu korunur; açık “En alta dön” eylemi. | Canlı stream durmaz. Scroll ölçümü kullanıcı scroll olayı veya gerçek flush'ta; boş scroll döngüsü yoktur. |

Başlangıç 15 sn CPU profilindeki örneklenmiş **self duvar süresi** sıcak noktaları: `vesselPointToWorld` 78,257 ms (minified HarborScene satır14/sütun14069), yerel `setTransform` 35,933 ms (77:14262), localPoint 28,963 ms (77:14200), slot key üretimi30,159 ms (14:23272), `containersForPod`27,029 ms (77:852). Bunlar toplam makine CPU payı değildir; native/idle ve GPU ayrı kalır. Ham `.cpuprofile` ve özet `*-diagnostic-cpu-baseline/` altındadır.

Ayrı React production **profiling build** kullanıldı: normal prod build'deki sıfır callback “React maliyeti yok” diye yorumlanmaz. Başlangıç 15 sn/5 olay-sn tanılamasında ResourceDetails80 commit/53,4 ms, App156 commit/106,3 ms; v3'te ResourceDetails81 commit/7,8 ms, App81 commit/34,2 ms. Paneldeki güncellik yazısının commit'i hâlâ sayılır. İç içe App ve Details süreleri toplanmaz. Bunlar normal sürüm CPU kabul koşusu değildir. [React Profiler davranışı](https://react.dev/reference/react/Profiler).

Başlangıç 15 sn timeline: Layout34 olay/7,157 ms; UpdateLayoutTree910/31,888 ms; Paint67/11,278 ms; MajorGC3/6,716 ms; MinorGC51/39,809 ms. Event türlerinin inclusive süreleri iç içedir ve toplanmaz. Raster/compositing olayının yakalanmaması sıfır maliyet sayılmaz. Sürekli büyük forced-layout döngüsü kanıtlanmadığından Soft UI gölgeleri veya CSS katmanları değiştirilmedi; eski/new CSS byte eşdeğerdir. [Layout thrashing yaklaşımı](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing).

## Mimari / dil kararı

Öncelikli pahalı yol tarayıcıda tekrarlanan JS/React/matris işidir; küçük Go maliyeti bu DOM ve WebGL işini açıklamaz. Bu görevde production backend, API, auth ve watch mimarisi değiştirilmedi. `backend/pkg/server/stream.go` aktif; bağlantı başına informer/cache sürer. Test-only log fixture'ına veri üretimini ölçüm penceresine kapılayan endpoint ve sayaç eklendi; production endpoint değildir.

İlk adım mevcut yoldaki gereksiz işi kaldırmaktır. Worker DOM'u doğrudan yönetemez; tam store'u her olayda klonlamak veya her frame instance matrisini başka thread'e aktarmak ek kuyruk/mesaj/buffer sahipliği getirir. Bu çalışmada kalan büyük, bağımsız bir hesap çekirdeği henüz gösterilmediğinden Worker/WASM/Rust prototipi veya framework göçü yapılmadı. Bu bir kategorik yasak değildir; yalnız microbenchmark üzerinden toplam uygulama kazancı varsayılmadı. [Worker sınırları](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), [transfer sahipliği](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects), [WASM birlikte çalışma](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts).

Kalan zorunlu iş: hareketli görünür gemi/kargoların instance buffer'ı, raycast/OrbitControls, aynı kalitede WebGL submit ve GPU raster; gerçek watch parse/reducer/yayın ve ilgili panel alanları. Su/seyri durdurmak, FPS/DPR düşürmek veya daha fazla kaynak gizlemek optimizasyon sayılmadı. [R3F frame ve kaynak paylaşımı](https://r3f.docs.pmnd.rs/advanced/pitfalls).

## Kanıt ve tekrarlama

Ana ham setler: `benchmarks/results/panel-20261026T082540Z-matrix-{baseline,baseline-supplement,candidate}/`. Her birinde manifest, per-PID süreç örnekleri, ham frame/mesajlar, üretici plan/uygulama sayıları ve full canonical signature karşılaştırması vardır. CPU çekirdek eşdeğeri; RSS süreç başına, JS heap ve Go heap ayrı; enerji/pil tasarrufu iddiası yoktur.

```sh
# Mevcut kaynaklardan yeni ve çakışmayan frozen build (tarihsel build'i ezmez).
node benchmarks/panel-build.mjs BENIM_YENI_ADAYIM
# Aynı fixture, gerçek veri yolu; bir hücre 30 +60 sn, beş dengeli blok.
node benchmarks/run.mjs --phase optimized --build-tag BENIM_YENI_ADAYIM \
  --reuse-build --reuse-binary --profiles M --panel-matrix \
  --scenarios panel-closed,panel-open,panel-closed-events,panel-open-events \
  --repeats 5 --warmup 30 --seconds 60 --id BENIM_YENI_RUN_ID
# Bu oturumun 3+2 baseline bloklarının tamamını beş aday blokla karşılaştır.
node benchmarks/panel-compare.mjs \
  benchmarks/results/panel-20261026T082540Z-matrix-baseline,benchmarks/results/panel-20261026T082540Z-matrix-baseline-supplement \
  benchmarks/results/panel-20261026T082540Z-matrix-candidate \
  benchmarks/results/panel-20261026T082540Z/panel-comparison.json
```

`--reuse-binary` aynı dondurulmuş `.build/backend.test` ister; temiz kurulumda ilk koşuda kaldırılarak test binary üretilir. `--build-tag` Git checkout'unu değiştirmez. `--panel-target pod|center` yalnız dar tanılama varyantıdır. `--react-profile` yalnız ilgili `-react-profile` build ile; `--profile-cpu|--profile-alloc|--profile-frames|--profile-gpu` ana CPU karşılaştırmasından ayrı kullanılır. `--dpr 2` emüle cihaz DPR'ıdır; medium renderer üst sınırı nedeniyle gerçek renderer DPR ve framebuffer ayrıca okunmalıdır.

`.build` bağımlılık/build önbelleğidir ve Git dışında kalır. Bu görevin başlangıç kaynaklarını mevcut kabul edilmiş adaydan yeniden üretmek için `node benchmarks/panel-build.mjs YENI_BASELINE --baseline-from benchmarks/results/panel-20261026T082540Z` kullanılabilir. [39,6 KB kaynak farkı](../benchmarks/results/panel-20261026T082540Z/runtime-source-change.patch) yalnız geçici kopyada ters uygulanır; önce adayın, sonra baseline'ın **bütün dosya SHA'ları** [frozen kayıtla](../benchmarks/results/panel-20261026T082540Z/frozen-builds.json) eşleşmek zorundadır. Bu ters uygulama ayrıca geçici dizinde doğrulandı. Kullanıcının çalışma ağacına patch uygulanmaz; eski güvensiz log sürümüne dönülmez. `--profile` aynı kaynaktan ayrı React profiling build'i üretir.

`--log-matrix --scenarios log-none,log-static,log-normal,log-long` yalnız yeni gated test fixture binary'siyle çalışır (`--backend-tag`); deterministik başlangıç burst'ü ısınmada dolar, normal/uzun üretim ölçüm başlangıcında açılır. `--lifecycle-counts` page JS timer/observer sayaçları ve CDP DOM/listener sayıları ekler; WeakRef GC'yi zorlamaz, native/worker scheduler sayımı değildir. `--network-counts` ayrı CDP callback/decoded byte tanılamasıdır, tam wire traffic değildir.

Görsel ve işlev kanıtı: [Node](../benchmarks/results/panel-20261026T082540Z-v3-evidence/node.png), [container](../benchmarks/results/panel-20261026T082540Z-v3-evidence/container.png), [ayarlar](../benchmarks/results/panel-20261026T082540Z-v3-evidence/settings.png), [dünya/panel kaydı](../benchmarks/results/panel-20261026T082540Z-v3-evidence/world-panels.webm), [12 tarayıcı testi](../benchmarks/results/panel-20261026T082540Z-v3-evidence/result.json). Video/screenshot işi ana CPU setinde kapalıdır. Playwright WebKit sonucu kurulu Safari performansı değildir.



## Ana ölçüm sonuçları

Karşılaştırılabilirlik kapısı **geçti**: 40 hücre, her tarafta beş eksiksiz blok; browser PID doğum/kapanışı yok. Her 5 olay/sn hücresinde planlanan/uygulanan/alınan300 olay; iki fazın her birinde3000 olay. Bütün olay hücrelerinde son canonical içerik upstream ve planla tam signature eşitliğinde. Aynı görünür kaynaklar, başlangıç filo pozları, kamera ve framebuffer doğrulandı. [Makine okunur karşılaştırma](../benchmarks/results/panel-20261026T082540Z/panel-comparison.json).

CPU medyanı (min–max; n), çekirdek eşdeğeridir. Kare sütunu medyan JS çizim/sn ve beş tekrardaki **en yüksek** p95/p99 aralıklarını verir; fiziksel presentation FPS'i değildir. Ana set Chromium/Metal, medium, DPR1.

| Senaryo | Önce browser CPU | Sonra browser CPU | Δpanel medyanı önce → sonra | Çizim/sn önce → sonra; en yüksek p95/p99 ms sonra | Callback-store / çizim proxy p95 üst sınır ms sonra | Karar |
|---|---|---|---|---|---|---|
| Kapalı,0 olay/sn | 0.371 (0.291–0.571; n=5) | 0.370 (0.262–0.412; n=5) | — | 60.00 → 60.01; 18.7/19.0 | N/A / N/A | Anlamlı toplam CPU kazancı iddiası yok |
| Açık,0 olay/sn | 0.381 (0.339–0.541; n=5) | 0.355 (0.285–0.396; n=5) | 0.0083 → -0.0060 | 60.01 → 60.01; 18.6/18.8 | N/A / N/A | Olay yokken fark gürültülü |
| Kapalı,5 olay/sn | 0.364 (0.234–0.391; n=5) | 0.367 (0.239–0.374; n=5) | — | 60.01 → 60.01; 17.7/18.0 | 0.6 / 17.3 | Anlamlı toplam CPU kazancı iddiası yok |
| Açık,5 olay/sn | 0.396 (0.327–0.409; n=5) | 0.370 (0.253–0.376; n=5) | 0.0308 → 0.0017 | 60.00 → 60.01; 17.6/17.8 | 0.6 / 16.7 | Panel farkı azaldı; değişkenlik sınırı aşağıda |

5 olay/sn açık panel toplam CPU medyanındaki gözlenen değişim yaklaşık−%6,6'dır; aralıklar örtüşür. Eşleşmiş Δpanel beş bloktan dördünde azaldı. Δ medyanı0,03077→0,00169 çekirdek; baseline aralığı0,00509–0,09322, aday−0,00022–0,01439. Bir blokta iyileşme görülmedi ve dışlanmadı. Böylece panelin ilave işindeki azalma React tanılamasıyla aynı yöndedir; bu cihaz/pil koşulunda evrensel ya da kesin−%6,6 nedensel hızlanma iddia edilmez. Olay yokken Δ aralıkları baseline−0,23176–0,17079, aday−0,08472–0,08848 olduğu için sürekli panel maliyetine kesin pozitif değer atanamaz. Tarihsel %33 farkın kod kaynaklı olduğu kanıtlanmış değildir.

| Senaryo | Renderer CPU önce → sonra | GPU süreci CPU önce → sonra | Browser ana süreç CPU önce → sonra | En büyük süreç RSS MiB önce → sonra | JS heap son MiB önce → sonra |
|---|---|---|---|---|---|
| Kapalı,0 olay/sn | 0.227 (0.178–0.376; n=5) → 0.209 (0.151–0.234; n=5) | 0.141 (0.112–0.189; n=5) → 0.159 (0.110–0.176; n=5) | 0.0010 (0.0008–0.0048; n=5) → 0.0010 (0.0008–0.0017; n=5) | 312.2 (248.4–315.1; n=5) → 304.0 (302.8–399.3; n=5) | 22.7 (16.0–29.4; n=5) → 21.3 (17.9–114.2; n=5) |
| Açık,0 olay/sn | 0.234 (0.208–0.334; n=5) → 0.203 (0.165–0.231; n=5) | 0.140 (0.126–0.199; n=5) → 0.149 (0.119–0.164; n=5) | 0.0038 (0.0008–0.0085; n=5) → 0.0010 (0.0007–0.0030; n=5) | 337.9 (328.6–344.6; n=5) → 326.0 (322.5–346.4; n=5) | 19.0 (17.7–21.6; n=5) → 19.7 (18.4–26.2; n=5) |
| Kapalı,5 olay/sn | 0.235 (0.140–0.255; n=5) → 0.222 (0.135–0.225; n=5) | 0.125 (0.092–0.132; n=5) → 0.141 (0.102–0.144; n=5) | 0.0020 (0.0010–0.0027; n=5) → 0.0022 (0.0012–0.0037; n=5) | 344.8 (342.4–345.2; n=5) → 338.4 (338.0–346.6; n=5) | 29.1 (19.8–47.5; n=5) → 41.2 (26.1–42.2; n=5) |
| Açık,5 olay/sn | 0.263 (0.203–0.272; n=5) → 0.230 (0.147–0.233; n=5) | 0.130 (0.114–0.134; n=5) → 0.137 (0.104–0.138; n=5) | 0.0023 (0.0013–0.0030; n=5) → 0.0020 (0.0012–0.0042; n=5) | 371.1 (361.7–388.7; n=5) → 356.9 (341.5–360.5; n=5) | 33.3 (25.4–47.0; n=5) → 26.0 (19.3–41.9; n=5) |

GPU **süreci CPU'su**, GPU yürütme süresi değildir. Süreç RSS'leri toplanıp fiziksel RAM denmez; tablodaki en büyük PID çoğunlukla aktif renderer'dır. Heap doğal GC noktasındadır; kapalı/5 olay örneğinde aday heap medyanı daha yüksek olduğundan genel RAM tasarrufu iddia edilmez. İndeks/template cache'leri canlı UID ve bir önceki sürümle sınırlıdır; kalıcı büyüme ayrı churn kontrolüyle değerlendirilir. Per-PID örneklerde bütün browser çocukları dahil, Worker eklenmedi. Ölçüm penceresinde kaybolan/doğan PID olsaydı CPU kapsamı eksik sayılacaktı.

Ana sette en kötü p95 aralığı18,7 ms, p9919,0 ms; bütün hücreler M çizim bütçesinde. Callback→store p95 en çok0,6 ms, ilgili UID/RV çizim proxy'si adayda17,3 ms. Ana panel açılışı ölçüm dışında olduğundan bu sonuç temel panelin200 ms'de kullanılabilir olduğunu veya fiziksel ekrana sunumu kanıtlamaz; o kabul ayrı etkileşim/görsel doğrulamaya aittir.

## Ayrı tanılamalar ve ölçüm hatalarının sınırı

- V8 allocation sampling: 5 sn ısınma +15 sn ölçüm, yaklaşık900'er çizim, n=1/yan. Tahmini toplam **1126,9→602,6 MiB**; önceki en büyük üç kargo yolu185,9/141,9/118,6 MB allocation kaydı oluşturuyordu. Bunlar geçici allocation tahminidir; retained heap veya süreç RSS'i değildir. Aynı kaynağın gerçekten kaldırıldığını gösterir; tek profiling örneğinden production CPU yüzdesi türetilmez. Ham profiller yerel `*-alloc-{baseline,optimized}/traces/`, küçük özetler aynı dizinde `profile-summary.json`.
- Asenkron WebGL GPU timer, ayrı n=1/yan15 sn: GPU medyanı2,433→2,468 ms, p952,474→2,498 ms.901/902 tamamlanan query örneği; aynı kalitede GPU hızlanması iddia edilmez. GPU süreci CPU'suyla karıştırılmaz; `gl.finish` kullanılmadı.
- Son15 sn timeline: Layout34/3,871 ms; UpdateLayoutTree906/25,842 ms; Paint67/6,167 ms; MajorGC3/6,093 ms, MinorGC32/15,761 ms. Önce/sonra ağır trace'ler ana CPU setinden ayrıdır. Style/paint miktarı küçük, CSS değişmedi. Kapsamda sürekli forced-layout döngüsü gösterilmedi; her Layout'u “zorlanmış senkron layout” diye etiketlemiyoruz. Raster/compositing kategorileri bu kayıtta N/A; inclusive süreler birbirine eklenmez.
- Aynı pozdaki [önce](../benchmarks/results/panel-20261026T082540Z-alloc-baseline/M-panel-open-events-0-start.png) / [sonra](../benchmarks/results/panel-20261026T082540Z-alloc-optimized/M-panel-open-events-0-start.png) görüntüleri açıldı.1.296.000 pikselde fark yalnız `(1068,271)–(1093,282)` saat yazısında192 pikseldir. CSS ve Three chunk'ları byte eşdeğer: [piksel ve SHA kaydı](../benchmarks/results/panel-20261026T082540Z/visual-comparison.json). Dünya kadrajı, gemi/konteynır görünümü, panel geometrisi ve Soft UI korunur.

Takip scriptinin ilk halinde varsayılan ve override CLI seçenekleri çift yazılıyordu; mevcut parser ilkini okudu. İlk iki log ön kontrolü fiilen5/15 sn n=1 koştu; manifest'leri bunu doğru gösterir. Hata ana40 hücreden **sonra** fark edildi; o set etkilenmedi. Ön kontrol verisi saklandı, tam kabul diye yeniden etiketlenmedi. Varsayılanlar yalnız override yoksa eklenir ve çift seçenek daha tarayıcı açılmadan reddedilir. Düzeltilmiş sonlu takip listesi `validation-v2/state.json` içindedir; otomatik sonsuz retry yoktur.

Pil%20 civarında default Chromium profilinde baseline ve adayın ikisi de yaklaşık30 çizim/sn'ye düştü; macOS `lowpowermode` hâlâ0 idi. Bu setler60 çizim/sn ana ölçümüne dahil edilmez. Kurulu Chrome'un **geçici benchmark profilinde** `performance_tuning.battery_saver_mode.state` tercihi1'den0'a alınca aynı aday yeniden59,93 çizim/sn oldu. [Kontrollü kayıt](../benchmarks/results/panel-20261026T082540Z-cadence-controlled/summary.json). Bu, uygulama FPS hedefini düşüren bir optimizasyon değildir. Sonraki yardımcı karşılaştırmaların iki tarafında aynı geçici-profil kontrolü ve55 çizim/sn preflight vardır; ana matrisle farklı launcher protokolü doğrudan CPU çifti yapılmaz. Kullanıcının tarayıcı profili ve OS ayarları değiştirilmez. Chrome enerji tasarrufu düşük pilde kare hızını sınırlar: [ürün açıklaması](https://developer.chrome.com/blog/memory-and-energy-saver-mode), [Chromium30 Hz uygulaması](https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/performance_manager/user_tuning/battery_saver_mode_manager.cc).

Native Safari27.0.1 için26 Ekim yeni WebDriver denemesi de HTTP500 `session not created` / Safari automation session bağlantı zaman aşımı verdi. [Güncel erişim kaydı](../benchmarks/results/panel-20261026T082540Z-native-safari/availability.json). Bu availability kontrolü FPS/CPU ölçümü değildir. Chromium6 ve Playwright WebKit6 olmak üzere12 test geçti; bu Native Safari kabulü sayılmaz.
