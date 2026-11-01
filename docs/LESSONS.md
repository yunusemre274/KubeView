# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

## 26 Ekim 2026 — Panel farkı, gerçek profiling ve ölçüm kontrolü

- İki sürümün panel-açık CPU farkı, paneli açmanın ek maliyeti değildir. Aynı seçili UID/kamera/filo fazında kapalı-açık blokları eşleştir; negatif Δ'yı koru. Bir baseline aykırısında ilk üç örneği ezmeden iki eksiksiz blok eklenerek beşe çıkıldı. Frekans/sıcaklık ölçülmediyse küçük toplam CPU farkına kesin neden atama.
- Normal production React Profiler callback üretmez. Kurulu React18.3.1'in gerçek profiling build'inde callback doğrulandı; iç içe App/Details süreleri toplanmadı. Allocation tahmini retained bellek veya süreç RSS'i değildir.
- Takip scriptinde aynı CLI bayrağını varsayılan ve override olarak iki kez üretmek ilk-değeri-okuyan parser'da süre/tekrar planını değiştiriyordu. Ön kontrollerin gerçek5/15 manifest'leri saklandı; ana40 hücre etkilenmedi. Varsayılan yalnız override yoksa ekleniyor, çift seçenek çalıştırmadan reddediliyor.
- Mac `lowpowermode=0` olsa bile Chromium'un kendi Energy Saver'ı pil%20 civarında30 Hz uygulayabilir. Baseline ve adayda29,9 çizim/sn, yalnız geçici ölçüm profili tercihi0 yapılınca59,9 görüldü. Bu fark optimizasyon kazanımı sayılmadı; ana kullanıcı profili/OS ayarı değiştirilmedi, sonraki yardımcı protokol ayrı tutuldu.
- Sabit kaynak sayısı tek başına doğruluk veya leak kanıtı değildir: UID/RV içeriği upstream/plan signature'ıyla, DOM/listener/timer/observer/WS/GPU adetleri aynı kontrol noktalarında ayrıca izlenir. Aynı sahne fazındaki piksel farkı yalnız saat yazısında kaldı; CSS'i ölçümsüz değiştirmek gerekmedi.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-017] Eksiksiz InfoCard Data-Binding Denetimi ve 3D Slot Grid Düzeni
- **Tarih:** 2026-08-04
- **Sorumlu Agent:** `web-frontend-agent` & `3d-graphics-agent`
- **Ne Yanlış Gitti?:** Sahnede seçilebilen 15 farklı 3D nesne tipinden sadece `SHIP`, `POD`, `SERVICEACCOUNT` ve `ROLE` için `<InfoCard>` içerik blokları tanımlanmıştı. `JOB`, `SECRET`, `CRANE`, `CONFIGMAP`, `PVC`, `PV`, `STATEFULSET`, `DAEMONSET`, `KUBELET`, `KUBE_PROXY`, `INGRESS` nesnelerine tıklandığında kart sadece başlık gösterip içi boş kalıyordu. Ayrıca sahneye iki adet Kube-Scheduler vinci render edilerek etiket ve kol çakışması yaratılmıştı.
- **Nasıl Düzeltildi?:** `<InfoCard>` içerisine 15 nesne tipinin tamamı için zengin detay, zaman damgası, güvenlik maskesi ve metrik blokları yazıldı. Pod kartı sekme butonları modern underline indicator tarzında TabBar ile yenilendi, kapatma (X) butonu %65 küçültüldü. Sahnede duplicate olan Scheduler vinci kaldırıldı ve Control Plane çevresindeki yardımcı nesneler için dairesel slot grid koordinatları tanımlandı.
- **Geleceğe Dönük Kural:** Sahnede tıklanabilir ve seçilebilir yapılan HER nesne tipi için `<InfoCard>` içerisinde karşılık gelen veri işleme bloğu yazılmak ve ELLE doğrulanmak zorundadır. Asla boş drawer gösterimine izin verilmez.

---

### 🔴 [DERS-016] Silme (DELETE) Event'lerinin Uçtan Uca Sınanması ve Client-Go Tombstone / Multi-Node Purge Zorunluluğu
- **Tarih:** 2026-08-03
- **Sorumlu Agent:** `k8 sn-backend-agent` & `web-frontend-agent`
- **Ne Yanlış Gitti?:** Pod'lar `kubectl delete pod` ile silindiğinde veya Deployment `--replicas=0` yapıldığında Pod'lar sahnede "Pending" durumunda hayalet olarak kalıyordu. Kök Neden: (1) Go backend'deki client-go Informer `DeleteFunc` callback'i `cache.DeletedFinalStateUnknown` tombstone yapılarını unwrap etmediği için silme olayları sessizce atlanıyordu, (2) Frontend state yönetimi `targetNode` drift nedeniyle silinen Pod'u sadece tek bir node'un dizisinde arıyordu.
- **Nasıl Düzeltildi?:** Backend'e tüm informer tipleri için tombstone unwrap yardımcıları eklendi. Frontend `ShipyardClusterContext.jsx` içerisinde silme ve güncelleme olaylarında silinen `podId` kümedeki TÜM node'ların dizilerinden temizlenecek şekilde jenerik silme mekanizması kuruldu.
- **Geleceğe Dönük Kural:** Silme (DELETE) event'leri, ADD/UPDATE ile aynı titizlikte uçtan uca (backend informer ➔ WebSocket ➔ frontend state) test edilmelidir. Sadece "nesne eklenince görünüyor mu" kontrol etmek yeterli değildir; "nesne silinince gerçekten kayboluyor mu" da HER yeni kaynak tipi eklendiğinde ayrı bir test senaryosu olmalıdır.

---

### 🔴 [DERS-015] Kapsamlı Çakışma Önleme ve Tüm Hareket Eden/Konumlanan Nesne Tiplerinin Gözden Geçirilmesi
- **Tarih:** 2026-08-03
- **Sorumlu Agent:** `3d-graphics-agent` & `web-frontend-agent`
- **Ne Yanlış Gitti?:** Önceki fazda çakışma önleme mantığı SADECE konteynır, vinç ve depo gibi alt nesnelere uygulanmış, gemilerin KENDİSİ (worker node'lar) unutulmuştu. Sonuç olarak devriye gezen gemiler birbirinin ve kara rıhtım binalarının içinden geçiyordu.
- **Nasıl Düzeltildi?:** `SHIP_DIMENSIONS` ve `HARBOR_DOCK_BOUNDS` sabitleri eklendi. Gemiler için kapalı devre devriye rotasında `phaseOffset = (shipIndex / totalShips) + timeOffset` faz farkı ve açık deniz yanaşma slotları (`calculateShipDockPosition`) kuruldu.
- **Geleceğe Dönük Kural:** Yeni bir yerleşim veya çakışma önleme kuralı eklenirken SADECE o an üzerinde çalışılan alt nesne tipi değil, sistemdeki TÜM hareket eden/konumlanan nesne tipleri (gemiler, şalupalar, binalar) bütüncül gözden geçirilmelidir.

---

### 🔴 [DERS-014] Anomali Tetikleme Canlı Pod İdentifier Eşleşmesi ve 3D Hover Tooltip Zorunluluğu
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `3d-graphics-agent` & `web-frontend-agent`
- **Ne Yanlış Gitti?:**
  1. Anomali simülasyonu butonuna basıldığında görsel duman/patlama/batma animasyonları tetiklenmiyordu. Kök neden: `CargoContainer` ve `CargoShip` bileşenlerinde anomali kontrolü `podData.id === 'pod-1'` ve `shipData.id === 'node-2'` gibi statik kukla verileri arıyordu; canlı kümeden `default/web-frontend-deploy-74b89` gibi gerçek Pod ID'leri geldiğinde karşılaştırma `false` dönerek görsel efekti çalıştırmıyordu.
  2. Sahnedeki bazı nesnelerin (Scheduler vinci, Ingress feneri, Kube-proxy istasyonu, Job şalupası, Secret kasası) ilk bakışta ne olduğunu açıklayan görsel etiketleri ve tooltip'leri eksikti.
- **Nasıl Düzeltildi?:**
  1. `CargoContainer` ve `CargoShip` anomali kontrolleri canlı küme Pod/Node ID'lerini ve indekslerini (`index === 0`, `shipIndex === 1`) dinamik hedefleyecek şekilde güncellendi. Butona tıklandığında anomali efekti, kamera odaklanması ve Olay Günlüğü kaydı kusursuz çalışmaktadır.
  2. `constants/descriptions.js` içerisine `OBJECT_DESCRIPTIONS` tooltip sözlüğü eklendi. `HoverTooltipOverlay.jsx` ile nesnelerin üzerine gelindiğinde imleç altında açıklayıcı dark-glassmorphism kutusu açılmaktadır.
  3. Kube-scheduler, Ingress, Kube-proxy, Job ve Secret nesnelerinin üzerlerine 3D visual metin etiketleri ve eksiksiz müfettiş döküm kartları bağlandı.
- **Geleceğe Dönük Kural:** 3D görsel efektler asla statik string karşılaştırmalarına dayanmamalıdır. Sahneye eklenen her nesne tipi için visual 3D metin etiketi, hover tooltip'i ve tıklama detay kartı zorunlu olarak birlikte eklenmelidir.

---

### 🔴 [DERS-013] 3D Nesne Çakışmaları ve Katmanlı (Tier-based) Grid Yerleşimi
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `3d-graphics-agent`
- **Ne Yanlış Gitti?:** Pod konteynırları ve karadaki liman yapıları sabit/tahmini koordinatlarla yerleştirildiği için nesneler iç içe geçiyordu.
- **Nasıl Düzeltildi?:** `constants/dimensions.js` ile merkezi boyut sabitleri ve `calculateContainerDeckPosition` dikey katmanlama (tier-based grid) algoritması kuruldu.

## 2026-10-24 — Dünya etkileşimi ve doğrulama

- CSS selector listesinde `[data-autofocus],button,input` öncelik belirtmez; DOM’daki ilk eşleşmeyi seçer. Bulucu odak hedefi ayrı sorguyla önce seçilmelidir.
- Container üst merkezinin ekrana projeksiyonu, tıklanabilir olduğunun kanıtı değildir. Gerçek vinç kirişi/trolley bu noktayı örtebilir; raycast ile görünür yüzey ve parked crane mekaniği doğrulanmalıdır.
- Form stepper içindeki label, ilk button’a bağlanabilir. Numeric input’un erişilebilir adı ayrıca doğrulanmalıdır.
- Mutasyonun API tarafından kabul edilmesi gözlenen sonuç değildir; UI ve test bekleyişi aynı UID/generation/replica üzerinden kurulmalıdır.

- Dünya üzerindeki bildirim rozetinin yalnız z-index'ini artırmak yeterli değildir: Node paneli ile aynı köşedeki denetim tıklanamaz kalabilir. Panel açıkken rozeti boş köşeye taşı; alt sheet'te üstte tut.
- WebGL kaybı gerçek WEBGL_lose_context ile iki tarayıcıda sınandı; semantik Bul → aynı Node paneli yolu GPU'dan bağımsız kalmalı.

- Su, PlaneGeometry'den özel BufferGeometry'ye geçtiğinde kamera fit'i20km denizi model sınırı sanabilir. Fit'te su/izleri dışla; gemi kapsüllerinin seyir rotası örneklerini bilinçli ekle.
- Birleşme için yalnız o anki iki gemi aralığı yeterli değildir: manevra boyunca ana rotada sanal bir lider/rezervasyon gerekir. Uzun test bu eksikliği yakaladı.
- 'Diğer yedi gemi ilerliyor' başarı ölçütü, bir geminin sürekli beklemesini gizleyebilir. Her UID'nin tekrar seyire dönmesini doğrula. Dış yanaşma sütunlarında kıç açıklığını, interpolasyon boyunca bütün gövdeyle test et; önce düz çık, sonra dön.
- Uzun GPU benchmark'ını HMR'den ve paralel tarayıcıların/natif fare olaylarının ölçüm kontrollerini değiştirmesinden ayır. Ham renderer, görünen kaynak sayısı ve açık/kapalı etkileri kaydet.

- Playwright, Chromium ana oturumunda focus emulation açar; ikinci CDP oturumundan kapatmak gerçek görünmezlik sağlamayabilir. Native geçici profili connectOverCDP(noDefaults:true) ile bağlayıp document.hidden değerini gerçekten doğrula. Başarısız görünmezlik denemesini geçmiş sonuçtan silme veya başarı gibi adlandırma.

## 2026-10-24 — Adil benchmark ve log hacmi

- Aynı kaynak sayısı, aynı görünür çalışma kümesi değildir. Informer Store.List sırası değişirse sekiz gemilik bölge farklı UID/Pod'lar seçebilir. Fixture snapshot'ını deterministik sırala; kamera/DPR/kalite yanında görünür UID'leri de karşılaştırma önkoşulu yap.
- Satır sayısı sınırı log byte hacmini sınırlamaz. Newline bekleyen yarım satır ve flush öncesi birikim de sınırlanmalıdır. Çok uzun UTF-8 satırları, bölünmüş chunk ve stream iptali gerçek HTTP testiyle doğrulanmalı; kısaltma kullanıcıdan saklanmamalıdır.
- CPU profilinde pahalı görünen fonksiyona cache eklemek otomatik kazanç değildir. Aynı production koşulunda ölçülen matris cache adayı kazanç göstermedi; geri alındı. Olumsuz veri korunur, kısa tanılama nihai üç tekrarlı kabul yerine geçirilmez.
- Ölçüm aracının bütün kareleri tarayıcı belleğinde tutması uzun koşuda sahte büyüme yaratabilir. Bounded kayıtları periyodik olarak dış harness'e boşalt; profiler/video koşularını ana akıcılık örneklerine karıştırma. Güç kaynağı değişen koşuları aynı koşul sayma.
- Kamera başlangıçta doğru görünse de geciken otomatik fit veya yerel fare girdisi ısınma sırasında pozu değiştirebilir. Pozu ölçüm sınırında da doğrula; sabit kamera ve gerçek etkileşim senaryolarını ayır. Yanlış kadrajla alınmış üçlüden tek iyi örnek seçme veya toleransı büyütme.
- Bağlantı kopmasında bütün watch deltalarının alınması beklenmez. Üretilen, canlı alınan ve snapshot ile uzlaştırılan değişiklikleri ayrı say; tam kaynak içeriğini son upstream/plan ile eşleştir. Aynı sayıya dönmek tek başına doğruluk kanıtı değildir.

- Güvenlik eşiğinde duran baseline da sonuçtur. Eski log renderer'ı30 sn ısınmada6 GiB RSS'i aşınca aynı testi yeniden zorlamak yerine ham başarısızlığı sakla; N/A baseline ile tam hızlanma yüzdesi üretme. Aynı kaynak kodlu3D yollarda bile CPU değişebilir; açıklanamayan artış/düşüşü saklama veya uygulama kazancı diye atama.
# 30 Ekim 2026 — Ölçüm ve worker sınırları

- Paneli kapatma komutunun dönmesi yeterli değildir: DOM'un kapandığını doğrula ve kullanıcı girdi korumasını ısınmaya da uygula. Kararlı ölçüm öncesinde zaten yanlış olan paneli sonradan doğru koşulmuş gibi etiketleme.
- Geçerli önceki hücreleri koruyan kurtarma açık per-cell ledger, eski hata/ham dosya bağlantısı, eşit repeat-ID kümeleri ve tam blok sayımı ister. CPU değerine göre örnek seçme; premeasurement protokol onarımını ve zaman aralığı sınırlamasını açık yaz.
- Sabit800ms beklemek OrbitControls damping'in bittiğini kanıtlamaz. Bounded pose gözlemiyle test ön koşulunu doğrula; başarısız toleransı körlemesine genişletme.
- GPU süreci CPU'su V8 profilinin dışındadır. Renderer CPU düşüşünü, toplam CPU düşüşü veya GPU süresi kazanımı diye sunma; eşleşmiş fark medyanını iki grubun ayrı medyan farkından ayır.
- Worker terminali gerçek süreç/çıktıya bağlı olmalı. Timeout'ta yalnız TERM yetmez: bilinen PID+birth sahipliği, bounded TERM→KILL, output drain ve başarısız cleanup'ta tutulmuş lease gerekir. Bilinmeyen orphan'ı isimden/porttan tahminen öldürme.
- Güç kapısı ölçümden önce durduysa bu bir başarısız test kaydıdır, CPU örneği değildir. Kullanıcının pille devam tercihi varsa eski AC dağılımına pil örneği eklemek yerine yeni kimlikli güç kapsamı aç; uzun koşu ve yardımcı çiftleri bu kapsamda ayrı değerlendir.
- Buffer oluşturma20→0 gibi gerçek API işi azalması, toplam kaynak faydasının kendisi değildir. Beş çiftten üçünde CPU artan ve ek kapasite tutan prototipi sırf mikro ölçüt daha iyi diye production'a alma; olumsuz sonuçları ve değişmeyen ürün dosyalarını koru.
- macOS kapak uykusunda `performance.now` ile OS duvar saati aynı süreyi kapsamayabilir. PID'lerin değişmemesi yeterli değildir:653sn CPU penceresini60sn JS işiyle karşılaştırmak sahte tasarruf üretir. Ortak saat kapısı uygula, uyuyan örneği ham hâliyle koruyup kabulden çıkar.
- Alt stage dosyası bir sinyal/timeout sonrası `running` kalabilir. İlerleme bildirirken merkezi worker kuyruğundaki terminal sonucu öncelikli olmalı; yalnız alt dosyadan canlılık çıkarma. Kapanmış işi çalışıyor gibi bildiren izleyici düzeltildi; geçerli eski hücreler tekrar edilmedi.

## 1 Kasım 2026 — Görsel denetim kanıtı

- Log container/previous seçeneğini değiştirdikten sonra eski metnin kısa süre görünmesi yanlış başarı üretebilir. İlgili yeni isteğin parametre/cevabını bekle, farklı incarnation metnini doğrula ve screenshot sonrasında da kararlı kaldığını kontrol et. Yardımcıdaki OBSERVED etiketi tek başına görsel kabul değildir; gerçek görüntü hata gösteriyorsa eski başarıyı reddet.
- Tam name onayı isteyen silme dialog'unda alanı boş bırakan test, API delete hatası değildir. Canlı UI doğrulamasını tamamlamadan bekleme süresini artırmak veya ürünü değiştirmek yerine test ön koşulunu düzelt; önceki hatayı sakla.
- Uzun kullanıcı duraklatmasından sonra Docker verisi korunurken özel temp kubeconfig/profil ve KIC hostname kaydı kaybolabilir. Yalnız owned container kimliği/cluster UID doğrulamasıyla kurtar; kullanıcı context'ine geçme. `docker start` hemen ardından systemd hazır varsayma. Fresh worker join ile aynı worker'ın yeniden kaydını ayır.
- Native minimize komutunun başarılı olması `document.hidden` olduğunu kanıtlamaz. Gerçek visibility giriş koşulu sağlanmıyorsa background testini engelli bırak; DOM özelliğini taklit ederek native test geçti deme.

## 1 Kasım 2026 — Uygulama ve gerçek olay tekrarları

- Eksilen scoped listeden DELETE çıkarma; yalnız başarılı authoritative kapsam veya gerçek DELETE tombstone'dur. Same-context reconnect seçim/lease'i korumalıdır; kaynak değişimi ayrı epoch'tur.
- Minikube1.38 profil dosyası primary adı boş, worker adı m02 saklar; gerçek host adı profil ile birleştirilir. Docker29'un eksik nesne hatası küçük harflidir. Sürümün gerçek veri/çıktısını test et; yalnız fake Runner sözleşmesi gerçek provisioning kanıtı değildir.
- Normal Pod deletionTimestamp sonrası SIGTERM/137 çıkışı yeni crash efekti başlatmamalı. Yeni Node kızak rotası için yalnız merkez çizgi değil geminin kıç/süpürülmüş alanı da gate rezervasyonuna katılmalı.
- Three0.164 instanceColor için vertexColors bayrağı gerekmez; geometry color attribute'u yokken ayrıca vertexColors açmak alev/okları siyahla çarpabilir. Gerçek ekranı açmadan materyal kabulü yapma.
- SSAR yardımcılarının positional resource/subresource/namespace sırasını gerçek restricted-SA ile sına; admin testi yanlış argümanı maskeleyebilir. Dokümanda başarı zinciriyle negatif denemeyi ayır.
-120ms yalnız background geçişi, anında değişen metinle geçici düşük kontrast üretir; metin/yüzey atomik tema değişsin, kabartma gölgesi korunabilir. Window autofocus RAF'ından önce ölçülen focus testi gerçek klavye odağını kanıtlamaz.
