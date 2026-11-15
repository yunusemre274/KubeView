# UI 2.0 devamı — kaynak ve kanıt sınırları

Başlangıç f7b2edf; ürün kaynakları daha önceki3091327 ile eşitti (sonraki commit belgeydi). Referans ve önceki/sonraki PNG'ler gerçekten açıldı. Renk karşılaştırması dört su dikdörtgeninin medyanlarına aittir; görüntüyü değiştirmeyen ölçümdür. Bütün ekranın birebir eşleştiği puanı değildir.

- ui2-refine-before-20261111 GEÇERSİZ: Vite HMR sırasında kaynak değişti, NaN geometri uyarıları çıktı. Ham helper BASELINE_CAPTURED yazmış olsa da başarı kabul edilmedi. Karşılaştırmada eski donmuş3091327 görüntüsü kullanıldı; bundan sonra capture-only kip de console hatasını reddeder.
- look1/2/3 ara görsel ayarlar; ilkinde çok çizgili dalga, ikincide fazla geniş/beyaz güneş izi görüldü. Sonraki ölçülü renk/dalga/güneş ayarı final görüntüde incelendi.
- unit-tests.txt ilk koşu218PASS/1FAIL: test Three Quaternion'un dahili callback fonksiyonunu clone ile kıyaslıyordu. Gerçek sayısal quaternion/toArray eşliği ve poz/zoom kontrolüyle düzeltildi; unit-tests-final.txt219PASS.
- ui2-refine-final-chromium ilk koşu: overview'de iki container'dan metrics kutusu yeterli tıklanabilir yüzey vermedi. Gizli hit zorlanmadı; helper normal Node→Sahnede göster eylemini kullanır ve yakınlaştırma gerekip gerekmediğini kaydeder. r2 tüm24 kontrolPASS. Komşu kaynak seçiminde de aynı kaynak/scope doğrulaması sürer.
- Son Chromiumr2 ve WebKit: ayrı24PASS; scoped DELETE, replacement, pause/reduced, klavye ve ayarlar. Gerçek Kubernetes/traffic E2E değildir. Mevcut21/18 kutu ve tamamlanan varış raycast testleri2PASS.
- surface-final:5PASS; actual product shader'ının izole GPU readback'inde yakın19.085/255, uzak0.117/255 ortalama alfa;14627piksel0.7s'de değişti, kapalı=0. Normal Node focus ve Orbit yolu da izlendi. Bu izole readback üretim UI özelliği veya gerçek küme kanıtı sayılmaz.
- animated-foam-and-sea.mp4, son surface ham videosunun MP4 kopyasıdır.4/5/6s kareleri çıkarılıp açıldı; overview→yakın gemi/köpük ve kamera dönüşü incelendi. Ham WebM yerelde korunur. UI TEST/REPLAY etiketi görünürdür.

Depth unit testi gerçek overview kamerasında48 adet12.5mm kaplama çiftinden45'inin eski24-bit quantization'da çakıştığını, adaptif near ile0'a indiğini doğrular. Bu, diğer bütün glitch nedenlerinin test edildiği anlamına gelmez. Karelerde ve Orbit kaydında render kaybı/NaN yoktur; scope/data aynı kalır.

Sürüm/release kabulü ve eski CPU/latency kapıları açık kalır. Kısa video açık rAF draw örneği yalnız tanılamadır; CPU/GPU/enerji kazancı veya native Safari/Retina kanıtı değildir.
