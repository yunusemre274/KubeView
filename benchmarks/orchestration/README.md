# KubeView test yönetimi

Ana müdür mevcut Codex oturumudur. Frontend, backend ve performans müdürleri
yerleşik Codex alt ajanlarıdır; kararları ve gerçek ilerleme günlükleri burada
tutulur. Terminal'deki küçük manager süreçleri bu günlükleri gösterir ve ana
müdürün onayladığı işi ilgili worker'a devreder. Worker'lar **gerçek yerel test
süreçleridir**; ayrı LLM oturumları veya yeni ajan üreten süreçler değildir.

30 Ekim ortamı: macOS27.0.1, Terminal.app2.15, kurulu CLI0.164.0; çalışan
app-server daemon0.166.0. CLI `--help`, `agents --help`, `exec --help` incelendi;
uydurma ajan/terminal bayrağı kullanılmadı. `open-tab.applescript` gerçek
Terminal sekmelerine komut bağlar. Terminal'in yerel sekme grubunda üç müdür,
üç worker ve mevcut ana Codex oturumu bulunur. macOS scripting sözlüğü bunları
ayrı window ID'leriyle sunsa da ekran görüntüsünde tek yerel sekme grubu
doğrulandı. Açık testler görünür; sekme başlığının kısalması hâlinde Pencere
menüsü özel `KV-*` isimlerini gösterir.

| Sekme | Görev / gerçek çıktı |
|---|---|
| KV-FRONTEND-MANAGER | Frontend alt ajan günlüğü ve iş devri |
| KV-BACKEND-MANAGER | Backend alt ajan günlüğü ve iş devri |
| KV-PERF-MANAGER | Performans alt ajan günlüğü ve iş devri |
| KV-WORKER-01 | Chromium/WebKit doğruluk ve kamera test grubu |
| KV-WORKER-02 | Gated fixture / informer / WebSocket contract işi |
| KV-WORKER-03 | Seri production CPU, render ve kararlılık işleri |

`handoff-snapshot.json` geçişten önceki değişiklikleri, çalışan geçerli ölçümü,
tamamlanan testlerin sürümlerini ve kalan bağımlılıkları kaydeder. Altı hücrelik
mevcut log ölçümü iptal edilmedi; bittikten sonra kaynak sırası devreye girdi.
80 frontend testi ve önceki uygun kanıtlar sırf hiyerarşi için tekrarlanmadı.

```sh
# Gerçek PID, lease ve iş durumları.
node benchmarks/orchestration/control.mjs status
# Ana müdür uygun kontrol noktasında yalnız tek işi serbest bırakır.
node benchmarks/orchestration/control.mjs grant IS_KIMLIGI
# Bütün işler toplandıktan sonra; aktif işi kapatmayı reddeder.
node benchmarks/orchestration/control.mjs shutdown
```

`queue.json` merkezi kuyruğun oturum kaydıdır. Her işin amacı, argv, kaynak,
kabulü, çıktı konumu ve süre sınırı kendi planında bulunur. Kaynak dosyaları
frozen production SHA listesiyle grant sırasında tekrar doğrulanır. Kuyruk
durumu atomik kilit/rename ile değişir. Bir worker aynı anda tek iş çalıştırır.
Tarayıcı/GPU veya ağır CPU işi için tek lease vardır; performans ölçümü yanında
Go testi, build, video veya başka tarayıcı başlatılmaz. Müdürlerin dosya okuma
ve değerlendirmesi paraleldir; GPU ölçümlerini paralelleştirerek süre kazancı
iddia edilmez. Altı supervisor beklerken yaklaşık50 MiB/PID RSS görülmüştür;
bu değerler toplanıp kesin fiziksel RAM olarak yorumlanmaz.

Bağımlılıkların semantik kabulünü ana müdür yapar; `held` iş kendiliğinden
başlamaz. Hata ve yarım çıktı korunur, otomatik retry yoktur. Yeni gerekçeli
deneme yeni iş/run kimliği ister. İlk frontend grubundaki13/14 sonucu ve
WebKit kamera izi saklandı; mouse sönümlemesini sabit800 ms yerine süre sınırlı
gözleyen test düzeltmesinden sonra yeni kimlikte14/14 geçti. Kamera toleransı
ve production kodu değiştirilmedi. Worker02 tek contract işindeki7 kontrolü
geçti; bu7 ayrı Go test fonksiyonu değildir.

Worker stdout dosyaları gerçek alt süreç çıktısıdır; sonuçlar
`benchmarks/results/panel-final-20261030T093652Z-*` altında kalır. Geçerli ölçüm
sırasında sekmeleri yeniden düzenlemek veya ek iş başlatmak yerine lease'in
bitmesini bekleyin. Native Safari erişim kontrolü ve Playwright WebKit sonucu
ayrı anlam taşır; N/A bir Safari performans başarısı olarak yazılmaz.

30 Ekim son kontrol noktası: AC ana matris40geçerli hücre/beşblok, dolu-log10hücre/beşçift tamamlandı. Kapasite prototipi beşinci çiftte net CPU faydası göstermediği için reddedildi; v5 üretim dosyaları korunur. Cihaz pile geçtiğinde AC kararlılık guard'ı ölçüm başlamadan durdu. Önceki kullanıcı tercihine uygun yeni pil oturumu `benchmarks/panel-battery-session.json` içinde; `panel-finish.mjs long|remaining --session benchmarks/panel-battery-session.json` bu kapsamı kullanır. Eski AC ve yeni pil sonuçları tek CPU dağılımına katılmaz. Oturumun `powerSource` alanı AC veya battery olmalı; her run kendi güç değişimi kontrolünü de korur.
