# Son Job / DaemonSet normal UI kabulü

Tek dar koşu `runs/2026-11-09T08-47-09-785Z/result.json`, 2026-11-09 08:47:09–08:47:21 UTC, **2/2 PASS**, 12.074s. Üç dakika sınırı içinde tamamlandı. Aynı run'da source/helper/binary before-after eşliği true.

Exact commit `32a0468ad51516a1bb38aab68760e73984c45ddf`, embedded macOS binary SHA256 `180941247e252f34d71300967fc71ae146174a3dea3caba734d947e1da80f548`, `resume-status-build.json` ve production18410 başta doğrulandı. Source bu commit'e göre temizdi. Root'un yeni binary SHA bildirimi ve test lease'i gelmeden helper çalıştırılmadı. Bu işte ürün/Git/build/e2e değişikliği yapılmadı; STS, Secret ve log akışları yeniden koşulmadı.

Yalnız owned A cluster UID `a24740ba-cf3e-461d-b5b3-250deeb060d7`, namespace `kv-repair-v11-status` UID `516a0f3e-c3d7-4877-b497-ae53cd9a0c47` kullanıldı. Namespace ilk yokluk sonrası oluşturuldu; owner `kubeview.io/v11-owner=v11-20261108`, benzersiz instance label ve her objenin exact UID/RV/role bilgisi her mutation öncesi doğrulandı. UI'da gerçek context/namespace snapshot'ı beklendi ve browser yönetim niyeti normal bağlantı penceresinden açıkça etkinleştirildi.

## Askıdaki gerçek Job

Gerçek Job UID `6a9b1e8c-9efe-4736-9d4b-753c07e79c3c`, RV32976, `spec.suspend=true`, controller koşulu `Suspended=True / JobSuspended`. API `active` alanını serileştirmemiştir (`actualActiveField=null` olarak kaydedilir); effective active count0 ve API'den gerçek owner UID ile listelenen Pod sayısı0 ayrı ayrı doğrulandı.

Normal Bul → Job → panel başlık durumu **Askıya alındı / warning** gösterdi. `suspended-job-normal-ui.png` açılıp incelendi; kaynak UID ve UI Aktif0 bilgisi eşleşiyor. Önceki0f5 Job screenshot'ındaki Çalışıyor kusuru bu yeni kaynakta giderildi; önceki unsupported CPU/RAM kabulünün tarihsel sonucu/PNG'si değiştirilmedi.

Complete/Failed önceliği ve normal running korunumu ayrı meaningful unit testleriyle doğrulanmıştır; bu dar UI koşusu terminal Job fixture'ı yaratmadı.

## Hazır gerçek DaemonSet

Gerçek DS UID `c18c254f-6007-45f9-bf09-e004cfebb71b`, RV32998, metadata.generation1 ve status.observedGeneration1; known desiredNumberScheduled1 ve numberReady1. Gerçek owner UID'li Pod `cd80bbd8-0444-4197-9678-8f8cbd8478cc` Running, terminating değil ve bütün container'ları Ready idi.

Normal Bul → DaemonSet → panel **Hazır / success** gösterdi. `ready-daemonset-normal-ui.png` açılıp incelendi; desired/ready1 ve generation/gözlenen1/1 doğru. Eksik/partial/stale DS durumları yalnız unit kapsamıdır; sentetik UI/state/status injection yapılmadı ve böyle bir gerçek UI PASS iddia edilmez. Önceki gerçek DS template güncelleme kanıtı ayrı source kayıtlarıyla korunur.

## Cleanup / freeze

Job, DS ve kalan exact owned child Pod, gerçek DELETE Options UID+resourceVersion precondition ile silindi; her biri GET404'e ulaştı. Namespace de UID/RV DELETE→404 ile silindi. Browser context close ve browser disconnected olayları gözlendi; watchdog temizlendi. Log viewer hiç açılmadı, log request sayısı0.

Cleanup proxy PID25253 stopped, son `ps` boş. Helper'ın bağımsız `lsof` ölçümü production18410 için yalnız listener ve bağlı TCP endpoint0 gösterdi. Bu kernel transport cleanup'ıdır; WebSocket protocol-close, Go heap/goroutine veya genel timer leak yokluğu kanıtı değildir. Aktif test/browser/log/proxy ve kalan fixture0. Kaynaklar donduruldu; root'un ağır perf işi için başka test başlatılmayacak.
