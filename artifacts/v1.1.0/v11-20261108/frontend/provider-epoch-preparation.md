# Provider epoch unit — yalnız kaynak hazırlığı

**Durum: NOT RUN / doğrulanmadı.** Aktif performans ölçümü sırasında yalnız yeni `frontend/tests/provider-epoch.test.js` ve bu not hazırlandı. Test, esbuild, syntax check, formatter, build, browser, cluster veya Git işlemi başlatılmadı. Runtime/frontend/src ve mevcut test dosyaları değiştirilmedi. Root'un ölçüm kuyruğu bittikten sonra vereceği ayrı test lease'i bekleniyor.

Yeni test, üretimdeki gerçek `useWorldProviders` hook'unu esbuild+React18 dispatcher yaklaşımıyla çağırır; kopya reducer veya regex kaynak kontrolü kullanmaz. Bundle sadece test daha sonra açıkça çalıştırıldığında değerlendirilir. Fixture API cevapları sentetik unit verisidir; gerçek Hubble/provider/Kubernetes E2E sonucu değildir.

Hazırlanan sonlu beş vaka:

1. A(epoch1)→B(epoch2)→A(epoch3): eski nonempty A UDP ve B DNS callback'leri abort sonrası bilerek çözülür. Güncel A TCP kaydı ve güncel provider/operation sonucu korunmalıdır. Güncel yanıtın gerçekten state'e kabul edilmesi aynı testte doğrulanır.
2. Aynı hook/API'de namespace alpha→beta: eski alpha pending poll signal'ı aborted olmalı, nonempty geç yanıt beta modeline taşınmamalı. Eski contextA/alpha/subscription ve gerçek unit leaseID ile sabitlenmiş DELETE URL'i doğrulanır.
3. streamSession key değişimi ve gerçek subscribe callback'i: eski pending flow iptal edilmeli, tek listener kalmalı, yeni current yanıt kabul edilmeli, geç eski UID/protokol modeli değiştirmemeli.
4. Başarılı current yanıtın kurduğu1000ms poll timer'ı unmount'ta silinmeli; pending status ve son flow signal'ları aborted, stream listener0 ve DELETE deadline timer0 olmalı. Eski API.url artık kullanılamazken cleanup önceden pinned URL ile çalışmalıdır.
5. Pending nonempty flow yanıtı unmount sonrası çözülür; state update/timer/listener bırakmamalıdır.

Tüm zamanlayıcılar test-local sanal kayıtla kontrol edilir; gerçek timeout/sleep veya ağ kullanılmaz. Deferred transport abort'u otomatik reject etmez; böylece gerçek hook'un cancelled/owner/flowKey guard'ları geç callback'i reddetmek zorundadır. Her test teardown'u pending sonuçları unmount sonrası boşaltır ve global window/fetch/timer işlevlerini geri yükler. Geç setState girişimleri ayrıca sayılır. Bu harness gerçek browser/ReactDOM sunumu veya fiziksel performans iddiası taşımaz.

Root açık test lease'i verdikten sonra hedefli komut:

`cd frontend && node --test --test-concurrency=1 tests/provider-epoch.test.js`

Bu komut henüz çalıştırılmadı. Hazırlık statik akıl yürütmeyle yapıldığı için syntax/harness davranışı ve yeşil sonuç henüz doğrulanmış değildir. Daha sonra bir helper hatası çıkarsa ilk başarısız kayıt korunmalı; yalnız bu tek kanıt dosyası sınırında düzeltilip root ile hedefli tekrar kararı alınmalıdır. Ürün davranışı eklenmedi.

## Performans sonrası ayrı lease ile çalıştırma — tamamlandı

Yukarıdaki NOT RUN bölümü hazırlık anının tarihsel durumudur. Root performans31/31 kuyruğunun ve tüm CPU örneklemesinin bittiğini bildirdikten sonra yalnız bu unit işi için ayrı lease verdi. İlk hedefli koşu doğrudan **5/5 PASS**, fail/skip/cancel0,95.715584ms tamamlandı; helper düzeltmesi veya başarısız tekrar gerekmedi. Kanıt `provider-epoch-targeted-01.txt`; komut `cd frontend && node --test --test-concurrency=1 --test-timeout=60000 tests/provider-epoch.test.js`.

Ardından izin verilen tam seri frontend unit grubu **bir kez** çalıştırıldı:165/165 PASS, fail/skip/cancel0,2733.994709ms. Kanıt `provider-epoch-full-unit-01.txt`; komut `cd frontend && node --test --test-concurrency=1 tests/*.test.js src/harbor/*.test.js src/workbench/*.test.js`.

Beş sentetik unit ortamının her teardown'ı timer0, listener0 ve late-setState0 assertion'larını geçti. Gerçek hook'un current nonempty yanıtı modele girdi; eski nonempty UID/protokol, provider status ve operation callback'leri current modeli değiştirmedi. Source/namespace/stream değişiminde abort ve eski context/namespace/subscription/leaseID'ye pinned fetch DELETE kontrolü geçti. Bu, gerçek Hubble E2E veya production timer/heap ölçümü değildir.

Source/test freeze (öncesi ve sonrası aynı):

| Dosya | SHA256 |
| --- | --- |
| `frontend/tests/provider-epoch.test.js` | `0ac2dc80923c50619ea47ebe906162647063340df052a5540d50c3cdc65ef887` |
| `frontend/src/world/useWorldProviders.js` | `cd43c1af8f8663ce7cf1a82d794e0d85e2d9f783ee6ddeb1ae75a81fd4a4eb46` |

HEAD32a0468ad51516a1bb38aab68760e73984c45ddf; runtime/frontend/src ve backend diff'i boş. Yeni test dosyası hâlâ untracked, Git yazma root'a bırakıldı. Build, browser, cluster, dependency install, runtime edit veya yeni ajan yok. Hedefli/full unit süreçleri exit0 ile tamamlandı; aktif bu işe ait test/timer/listener yok. Artık test kaynağı donduruldu; CI/meaningful commit root'ta.
