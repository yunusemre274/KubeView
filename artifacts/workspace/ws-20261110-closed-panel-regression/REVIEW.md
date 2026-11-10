# Kapalı log panelinin liman dönüşünde yeniden açılması — red/green

Actual App React dispatcher'da A'nın log sekmesini açıp paneli kapatmak ve B → A yapmak, kapalı resource panelini yeniden açıyordu. Yeni dar test mevcut kaynakta1FAIL üretti; güvenli seçili UID highlight'ı zaten korunuyordu. Bu sentetik state'li gerçek App hook/handler testidir; browser veya gerçek stream kanıtı değildir.

Kaynak etkisi cache'teki `panel:null` bilgisini seçili resource bulunduğu için `{type:resource}` ile eziyordu. Düzeltme panel açma niyetini seçim descriptor'ından ayrı hesaplar. Kapalı panelle dönülen limanda UID highlight'ı geri gelir; panel kapalı kalır. İlk snapshot bekleniyorsa aynı niyet pending seçim çözümüne taşınır. Cold restore, açık resource paneli ve açıkça seçilmiş pending hedef panel açabilir; cache'teki facility paneli geç gelen resource seçimiyle ezilmez. Cache boyutu, UID/Secret korumaları, persist formatı ve renderer/timer yolu değişmez.

Yeni warm-closed, delayed-closed ve delayed-facility testleri ile mevcut cold UID/tab, geç callback ve ResourceForms dirty fresh-GET/resume kontrolleri ve açık safe formun App cache dönüşü14/14 geçti. Eski cold/tab testinin callback bölümünde liman değiştirmeden önce panel artık açıkça tekrar açılır; yanlış otomatik reopen beklentisi ayrı kapalı-panel regresyonu tarafından kaldırıldı. Tam frontend202/202 PASS; production Vite build PASS.

Önceki frontend `ee974b3b…e559`, yeni `ff682d9b…19b9`; yeni index `a31eb27d…b471`. Bu değişiklikten önceki normal UI ve performans kayıtları eski kaynaklarına aittir. Yeni embedded binary üzerinde normal M5 UI log aç → kapat → B → A → açıkça tekrar aç kontrolü ayrı lease/kanıtla yapılır. CPU kazanımı veya20dakika soak sonucu burada üretilmedi. MANUAL:PENDING.
