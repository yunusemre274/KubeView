Owned06 gerçek Hubble + UI doğrulaması tamamlandı. Dar akış kontrolleri Chromium 156.0.8078.4 ve Playwright WebKit 27.2'de PASS. Bu sonuç gerçek owned Kubernetes, Hubble ve tarayıcı arayüzü kanıtıdır; performans, native Safari, farklı namespace yetkilendirmesi veya eksiksiz trafik ölçümü kabulü değildir.

Çalışan binary root'un verdiği scope04 adayı olarak korundu: SHA256 `08bd0cee5a5dfc03b8df6b24b778d9f779266cfc2c09a0bbda0f03049e970c7d`, app PID `80336` / port `19846`, relay PID `80393` / port `19848`. Root'un runtime kaynak referansı `496729e2`; helper provenance alınırken ortak checkout HEAD'i root tarafından `2461bbfb6824455a06c4fd9366ecd72a7928654e` olmuştu. Bu checkout HEAD'inin çalışan binary olduğu iddia edilmiyor. Binary hash her guard çağrısında dosyadan yeniden doğrulandı. Ürün kodu, app/cluster/node lifecycle veya root'un label değişiklikleri değiştirilmedi.

Kimlik sınırı: exact state dizini `~/Library/Application Support/KubeView/release-audit-hubble-20261111-cold01`, labId `kvml-d32afbf634e8`, cluster kube-system UID `e84bb50e-8d64-4bc2-905c-9b5ba193e53a`. Client namespace `kvml-fbf634e8-06-client` UID `863e13d5-da6d-481d-9484-64eb088d8df8`; server namespace `kvml-fbf634e8-06-server` UID `f383d95d-46b9-4332-b2e7-ad13d180dfc0`. Server Pod UID `bf81944b-e0b4-46e9-af8e-b5560881bd39` boyunca aynı kaldı.

`scripts/release-flow-lab.py`, `Lab.guard_cluster`, `Lab.ns_guard` ve `process_identity` okundu. Release-flow helper'ın main'i çalıştırılmadı; ek cross-node probe Pod oluşturduğu için bu işin sınırına uymaz. Artifact içindeki `owned-traffic.py` yalnız `inspect` ve mevcut `traffic-start`, `traffic-increase`, `traffic-stop` senaryolarını çağırır. Her çağrı container exact identity/owner, kube-system UID, owner marker UID, namespace UID/owner/profile, app binary SHA/PID/doğum-komut identity/listener ve relay identity/listener kontrollerinden geçer. Mutasyon mevcut runner'ın lock/global kubeconfig hash/nesne guard'ları üzerinden mevcut Deployment replica sayısını değiştirir. Yeni Pod tanımı, exec, probe, node veya namespace eklenmedi; Deployment'ın mevcut Pod şablonu 0→1→3→0 ölçeklendi. Kubernetes Pod LIST gözlemlerinde en yüksek client sayısı 3.

Normal UI yolu iki motorda da gerçek tıklamalarla geçti: Bul → aramada “Ağ Yönlendirme Tesisi” → görünen “Ağ tesisi” satırı → Ölçülmüş trafik → Ölçülmüş trafik katmanını aç. Enable için ayarlar fallback'i gerekmedi. Deniz görünümü gerçek “Limanlar ve deniz haritası” → “Denizi uzaktan gör” ile açıldı. State, selection veya camera enjeksiyonu yoktur. `canvas.__harbor` üzerinden yalnız scene/stat/matris okumaları yapıldı.

| Kontrol | Chromium | WebKit |
|---|---:|---:|
| Normal tesis enable / provider live | PASS | PASS |
| 1 gerçek Ready client UID → gerçek server UID; UI accessible action + API eşleşmesi | PASS | PASS |
| 3 Ready client UID'nin ayrı API source eşleşmeleri | 3/3 | 3/3 |
| Dünya PNG'sinde rendered flow | 20 | 27 |
| Aynı flow ID'ye bağlanan yönlü, hareketli matris örneği | 2 | 3 |
| Flow GET 200 / diğer status | 51 / 0 | 29 / 0 |
| Stop dönüşü → API pair 0 + renderedFlows 0 | 9.499 sn | 6.845 sn |
| UI layer kapatma ile subscription DELETE | 200 | 200 |
| Final client Pod LIST 0 / browser kapalı | PASS | PASS |

API'nin gerçek client namespace/Pod UID ve server namespace/Pod UID çiftleri, guarded Kubernetes LIST ile eşleşti. Tek-client aşamasındaki erişilebilir “Akışı incele” açıklaması aynı UID'leri taşır; WebKit `04-one-client-real-uid.png` her iki Pod UID disclosure'ını açık gösterir. Chromium görüntüsünde akış tablosu yenilenirken source disclosure kapanmıştır; eşleşme assertion'ı accessible açıklama ve API üzerindedir. Tablo satırları canlı olarak değiştiği için her satırın eksiksiz kimlik eşleşmesi iddia edilmiyor.

`06-three-clients-world-arrows.png` iki gerçek proje adını, aralarında measuredTraffic çizgilerini ve “flow olayı ≠ paket” açıklamasını gösterir. Read-only diagnostic örneklerinde API flow ID'leri geometry source/destination uçlarına bağlandı; cone local-Y yönünün source→destination XZ vektörüyle pozitif dot ürünü ve aynı flow ID'nin farklı zamanlardaki matris konum değişimi doğrulandı. Normal dünya hareketi ve flow sıralaması da değişir; bu karşılaştırma saf render clock izolasyonu veya FPS ölçümü değildir. Video ve ondan çıkarılan iki zaman örneği ayrıca korundu; görüntüler araçla açılıp incelendi.

Stop anları Chromium `13:22:50.914Z`, WebKit `13:24:16.836Z`; pair/scene drain `13:23:00.413Z` ve `13:24:23.681Z`. Her iki snapshot/scene pencere değeri 10 saniyedir. Ölçülen süre senaryo helper'ı döndükten başlar; replica patch veya son ağ olayının hassas gecikme benchmark'ı değildir. İki döngünün ilk traffic-start çağrısından final guarded stop dönüşüne tüm boşlukları da içeren üst sınır 181 saniyedir. Tarayıcılar seri çalıştı, GOMAXPROCS=1 kullanıldı. Video kaydı CPU/performance sonucu olarak kullanılmadı.

İlk `attempt-01` FAIL korunuyor: ortak `findFacility` helper'ı uzun tesis adıyla görünen kısa “Ağ tesisi” metnini filtrelediğinden satır sayısı assertion'ı başarısızdı. İlk PNG'ler, sonuç ve raw log değiştirilmedi. Bu denemede trafik başlatılmadı, flow lease açılmadı; guarded stop ve client LIST 0 geçti. Yalnız yeni test helper'ındaki normal DOM satır hedefi düzeltilerek `attempt-02` alındı. İkinci denemede ürün UI enable failure gözlenmedi.

Gözlenen sınırlar: increase sırasında bazı flow kayıtları “Pod UID · eşleşmedi” olarak dürüstçe gösterildi. Dünya PNG diagnostic'inde Chromium unresolved=0; WebKit unresolved=8 ve 27/35 çizildi. Sağlayıcı summarized sayacı sırasıyla 117/118 idi; dropped=0 olması tüm flow olaylarının eksiksiz gösterildiği anlamına gelmez. `flow.nodeUID` null kaldı; ayrı Node UID/cross-node testi bu işte yapılmadı. WebKit dünya karesinde geçici “Görsel yükleme sürüyor” yazısı dar, dikey bir şeritte görünüyor; sonraki stop karesinde kayboluyor. Ürün kodu değiştirilmedi; bu gözlem root'a bildirildi.

Son guarded stop/LIST `2026-11-11T13:24:27.468841Z`: client Pod 0, aynı server Pod Ready 1, aynı app/relay PID+identity+listener+binary SHA. Her browser'ın flow subscription DELETE 200 cevabı var; context/browser kapanışı tamamlandı. App ve lab aktif bırakıldı.

Kanıtlar: `source-identity.json` komutları ve kaynak hash'lerini; `attempt-01.log` ve `attempt-02.log` raw sonuçları; her attempt'in `result.json` dosyası UTC aşamaları, redakte metadata ve cleanup'ı; `checked-summary.json` bağımsız metadata assertion özetini; engine dizinleri PNG/video'yu; `video-frames.json` codec/süre ve yaklaşık örnek zamanlarını içerir. Credential değeri, raw request URL/query, header, L7 payload veya token kaydedilmedi. `SHA256SUMS` teslim dosyalarının hash envanteridir. Yeni izinli test kaynağı: `frontend/e2e/release-real-traffic.mjs`.
