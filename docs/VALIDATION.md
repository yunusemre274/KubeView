# Hareketli filo, canlı deniz ve Neumorphism — 2026-10-24

Bu kayıt son hareketli sürümü anlatır. Önceki sabit rıhtım görüntüleri/ölçümleri tarihsel kanıttır; yeni sonuçlar `evidence/motion/` altındadır.

## Ortam ve kapsam

MacBook Air **Apple M5 / 10 CPU / 32 GiB**, Darwin 27; **Chromium 156**, ANGLE Metal Apple M5. Playwright viewport **1440×900 CSS px**, orta kalite; 1280×800 ve768×900 görsel kabulü de yapıldı. **Playwright WebKit** sınandı; gerçek Safari cihaz testi değildir. Chromium standart yazılım renderer ile ağır sahnede context loss gösterebildiğinden Mac testlerinde Metal açıkça seçilir; genel WebGL kaybı/retry ve semantik Bul yolu iki motorda da sınandı.

Gerçek cluster yalnız **kubeview-test**, namespace **kubeview-qa**, Kubernetes 1.35.1, iki Node. Mevcut control-plane cordon durumu korundu; bu görev Node bakımı veya backend endpoint'i eklemedi. Yeni kayıt/test Pod'ları UID/RV önkoşullarıyla silinir; önceden var olan kaynaklar korunur.

## İşlev ve görsel kanıt

Son birleşik paket **30 geçti / 0 hata / 6 bilinçli atlama**: beş WebKit tekrarlı mutasyon ve bir WebKit gerçek upstream reconnect tekrarı. Chromium karşılıkları geçti. [Makineye okunur sonuç](evidence/browser-results.json). **69 frontend testi**, Go testleri, production build, Docker `kubeview:motion` build ve Helm lint/render geçti. Filo testleri dört yanaşma sütununu,1cm aralıkla gövde süpürmesini, kayıtlı kilitlenmeden toparlanmayı ve700 saniyelik sekiz gemi/iptal edilen iş yoğunluğunu kapsar.

- Hareketli gövde/container tıklaması UID'yi korur; pointer-down/up farklı kimlikse seçim iptal edilir. Kamera sürüklemesi yanlış kaynak açmaz.
- Node ve Pod paneli, görsel tek-gemi duraklatma ve açık kamera takibi çalışır. Manuel Orbit başlangıcı takibi bırakır; canvas kimliği korunur.
- Deniz kapatma fazı dondurur, su/iz/salınımı durdurur; seyir sürer. Seyir ve deniz birlikte kapalıyken ek frame0. Ortak duraklatma ve sistem azaltılmış hareketinde veri/kaynak işlemleri devam eder.
- Gerçek create/dry-run, scale/delete, log, Secret edit, namespace ve Node affinity akışları korundu. Gerçek WS1012 kesintisinden sonra aynı Node UID, seçim, canvas ve yakın rota ilerlemesi korundu.
- Uzak yükte kuyruk≈10 sn sonrası320ms sade varışa geçer; tek UID/tek instance ve doğru kanonik Pod sayısı korunur. 'Görsel yükleme sürüyor', Ready bilgisinden ayrı gösterilir.
- Açık/koyu ve normal/yüksek kontrast dört birleşimde gerçek tarayıcı axe AA kontrolü temiz. Normal açık temada metin12.28:1, yardımcı6.00:1, kontrol sınırı3.26:1, focus7.00:1; koyuda12.85/8.40/4.77/9.00. Yüzen denetimlerde suya karşı ayrıca iki tonlu düz focus sınırı vardır. Gölge tek durum göstergesi değildir.

Ekranlar açılıp incelendi: [filo](evidence/motion/fleet-overview.png), [Node paneli](evidence/motion/demo-soft-node.png), [koyu ayarlar](evidence/motion/demo-soft-settings-dark.png), [gerçek container logu](evidence/motion/live-soft-container-logs.png). Renkler ve bilgi alanları opaktır; büyük blur/saydam dashboard yüzeyi yoktur.

[19 sn demo kaydı](evidence/motion/demo-living-fleet.webm) dolaşma, tek gemi duraklatma, Pod seçimi, deniz kapatma, koyu panel ve ortak duraklatmayı gösterir; kalıcı Demo rozeti vardır. [Gerçek yanaşma kaydı](evidence/motion/live-docking-cycle.webm), yalnız test namespace'inde oluşturulmuş gerçek Pod'u gösterir. [Metadata](evidence/motion/live-docking-cycle.json): yanaşma≈4.47 sn, vinçten ayrılma≈6.59 sn, seyire dönüş≈11.03 sn; hata0. Uzun bekleme kısmı videodan kesilmiştir; hareket hızlandırılmamıştır.

## Performans matrisi

[Ham rapor](evidence/motion/fleet-performance.json). Sentetik kaynaklar; gerçek20/50 Node cluster denemesi değildir. Her satır3 saniyelik ölçüm; aktif desenlerden önce1700ms yerleşme süresi. Arka planda diğer geliştirme/test süreçleri vardı. Her bölgede8 gemi görünür; bütün kanonik kaynaklar korunur.

| Kanonik kaynak | Görünen | Seyir+deniz | Yalnız seyir | Yalnız deniz | İkisi kapalı | Node paneli açık |
|---|---|---:|---:|---:|---:|---:|
|20 Node /300 Pod |8 Node /120 Pod |59.90 FPS|60.27 FPS|59.92 FPS|0 ekframe|59.90 FPS|
|50 Node /1500 Pod |8 Node /240 Pod |60.21 FPS|59.94 FPS|59.94 FPS|0 ekframe|59.94 FPS|

Seyir+denizde246 draw call,47478/56118üçgen; panel açıldığında247 call. Bunlar bu kısa profillerde başlangıç hedeflerini karşılar; tüm50 geminin aynı anda çizildiği veya her donanımda60 FPS garantisi değildir.

## Uzun koşu ve görünmez pencere

Son sürümde **601.6 sn /589 örnekleme döngüsü /51 GC ölçümü /9aynıUID resync**. Her20 döngüde Pending→schedule→delete, panel aç/kapat ve ayrıca600 fixture güncellemesi uygulandı. Hiçbir gerçek Kubernetes mutasyonu yapılmadı. Çarpışma örneği0, JavaScript hatası0. İlk gemi **en az3.48 tur**, diğer boşta gemiler3.42–3.48 tur; yükleme/ayrılma işleri alan gemide sayılan alt sınır2.90 tur. Uzun örnekleme aralığı dışlandığı için tur ölçümü bilinçli alt sınırdır. Saf700 sn yoğun testte bütün sekiz UID üç turu geçer.

JS heap GC sonrası **19.89→21.49 MiB**, aralık19.89–21.50 MiB. Başlangıç/son farkı≈1.60 MiB; sürekli sınırsız artış görülmedi fakat bu24saatlik üretim leak kanıtı değildir. GPU nesneleri **29 geometri/3 texture** kaldı. Sonunda300kanonik Pod/120görünür slot; transfer/kuyruk/çıkış hayaleti0. GPU byte belleği ve tarayıcı toplam proses belleği ayrıca ölçülmedi. Go RSS ayrı tek noktada54.1 MiB idi; bir trend veya 'toplam uygulamaRAM'i değildir.

Uzun koşuda sekme değişimi `document.hidden=false` kaldı; bu yüzden onun gizlenme denemesi başarılı sayılmaz. Ham rapordaki tek `unexpected route jump` denetim uyarısı,60 saniyelik **örnekleme boşluğu**dur; tek karelik animasyon sıçraması veya JS hatası değildir. Ham kayıt korundu, `samplingWarnings` / `pageErrors` ayrımı eklendi.

Ayrı [gerçek görünmezlik kaydı](evidence/motion/visibility-check.json): native Chromium geçici profille başlatıldı, CDP `noDefaults` ile Playwright'ın sürekli-focus varsayımı kaldırıldı ve OS penceresi küçültüldü. `hidden=true` **60001ms**, bu sırada ekframe **0**, su fazı/şiddeti birebir aynı.600 fixture işlemi sonunda tek atanmış yeni Pod korundu; geri dönüşte kanonik33 Pod, transfer/kuyruk/hayalet0. Geri dönüş+küçültme geçişini kapsayan hareket15.13birim;60 sn'lik zaman tek kareye uygulanmadı. JS hatası0. Bu testte credential/token profili kullanılmadı; geçici profil temizlendi.

## Tekrar çalıştırma ve sınırlar

`frontend` dizininden `npm run test:e2e` çalışan Vite/backend ister. Canlı senaryolar için yalnız `KUBEVIEW_TEST_CONTEXT=kubeview-test KUBEVIEW_TEST_NAMESPACE=kubeview-qa` bayraklarını kullanın. `node e2e/record-fleet.mjs` demo kaydı; `RECORD_SOURCE=live` ve iki test bayrağı gerçek kayıt oluşturur. `node e2e/fleet-benchmark.mjs` yaklaşık11 dakikalık sentetik profil, `node e2e/visibility-check.mjs` gerçek pencere küçültme kontrolüdür. Mac'te Metal açıkça seçilir.

Gerçek Safari donanımı, uzun süreli üretim GPU yükü, bütün operator/CRD kombinasyonları ve canlı tam drain/PDB kesintisi bu görsel ek görevin kanıtı değildir. Önceki backend yetenekleri ve sınırları [CAPABILITIES](CAPABILITIES.md) içinde korunur. Arayüz varsayılanı tam ekran dünyadır; tablolar/paneller geçici nesne etkileşimleridir.
