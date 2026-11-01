# Görsel denetim eksikleri — 1 Kasım 2026

Bu liste [denetim raporunun](VISUAL_FEATURE_AUDIT.md) sonucudur; v1.1 uygulama planı yürütülmedi. Ürün kodu değiştirilmedi. **Doğrulanmış hata**, **eksik ürün davranışı** ve **yalnız kaynak kodundan çıkarılan risk** ayrı tutulur. Kubernetes informer, raw UID, canonical state ve gerçek mutation servisleri korunarak en küçük sonraki işler aşağıdadır. Maliyet/risk nitel mühendislik tahminidir; tamamlanma sözü değildir.

## P0 — yanlış canlı durum

### G00 — On-demand CR, aynı-source reconnect'te yanlış “silindi” oluyor (DOĞRULANMIŞ / HATALI)

- **Kanıt:** `reconnect-resume2.json`; gerçek `audit-custom` UID `381d6947-a8dd-4ee7-a279-016b75fe5f15`, RV956 API'de değişmeden kaldı, snapshot2→3 sonrası açık panel tombstone oldu. Kataloğu yeniden açmak düzeltti. Kullanıcıya yanlış kaynak yokluğu anlatılıyor ve gerçek kaynak işlemleri engelleniyor.
- **Gereken veri:** Snapshot'ın hangi GVR/kapsam için authoritative olduğu, on-demand yüklenmiş GVR/UID kayıtları ve gerektiğinde gerçek GET/LIST404 teyidi.
- **Backend işi:** Snapshot kapsamını açık belirtmek veya aynı yetkili kapsam için keşfedilmiş seçili GVR aboneliğini taşımak. Watch eklenirse yetki/iptal/sonlu kuyruk/snapshot-delta sırası korunmalı.
- **Frontend işi:** `resourceStore.reduceMessage(SNAPSHOT)` ile `ShipyardClusterContext.loadKind` sahipliğini ayırmak; `FacilityWindow` yeniden bağlanma neslinde gerekli GVR'yi uzlaştırmalı. “Listelenmedi/bilinmiyor” ile doğrulanmış DELETE aynı olmamalı. Körlemesine eski CR'yi sonsuza kadar tutmak çözüm değildir.
- **Ek bileşen:** Yeni üçüncü taraf sistem gerekmez; scoped reconciliation/abonelik kaydı yeterlidir.
- **Maliyet/risk:** Orta; yanlış retain yaklaşımı gerçek DELETE'i kaçırabilir, bir GVR'nin verisini diğer cluster/kapsama sızdırabilir.
- **Kabul:** Gerçek CR list/get → selected → aynı-source WS/backend reconnect; mevcut UID canlı kalmalı. Ardından gerçek CR DELETE ve offline silinme/relist; panel doğru silindi olmalı. Aynı ad/yeni UID, RBAC kaybı, namespace/context değişimi ve eski nesil callback ayrı sınanmalı.

## P1 — sekiz temel beklentide eksik davranış

### G01 — Node yangın/duman/batma sekansı yok (soru1)

- **Veri:** Mevcut gerçek Node UID + Ready koşulu + deletion; backend/WS stale ayrı. Ready=False fiziksel ölüm kanıtı değildir; Unknown iletişim kaybıdır.
- **Backend:** Yeni sahte ölüm endpoint'i gerekmez. Mevcut koşullar yeterli; varsa gözlenen transition zamanı korunur.
- **Frontend:** UID başına bounded arıza/sönme/toparlanma görsel state'i, seçilebilir kısmi gövde/işaret ve durum açıklaması. Aynı event/resync tekrarında başlangıca dönmemeli. Canonical Node/Pod'lar tutulmalı; DELETE ayrıca gerçek yokluğu izlemeli. Reduced-motion kısa durum sunumu olmalı.
- **Ek bileşen / maliyet / risk:** Ortak düşük maliyetli flame/smoke mesh/particle sunumu ve ayrı animasyon state makinesi; orta. Görsel olarak kesin donanım ölümü anlatma, gemiyi seçilemez biçimde suya gömme ve kaynak leak riski var.
- **Kabul:** Kendi worker'ında gerçek stop→Unknown/recovery, ayrı açık False enjeksiyonu, gerçek DELETE; doğru UID/diğer filo korunması, timed video, duplicate/resync, context iptali, kaynak sayımı/cleanup.

### G02 — Container/Pod hata düşmesi yok; rol düzeyindeki efekt kapsamı eksik (soru2)

- **Veri:** Gerçek Pod UID + container adı/rolü + restartCount/termination.finishedAt + phase/reason/deletion. CrashLoopBackOff phase değildir; Completed hata değildir.
- **Backend:** Mevcut raw container status yeterli; yeni veri uydurulmaz. App/init/ephemeral ayrımı korunur.
- **Frontend:** Tek container hatasını bütün Pod'un silinmesi gibi göstermeyen bounded düşme/geri alma sunumu. Canonical konum/owner/nodeName hemen güncel kalmalı. Çoklu container grubu, same UID recovery ve new UID replacement ayrı. Ephemeral status `ContainerTransitions/containerProblem` kapsamına bilinçli eklenmeli; current/last termination önceliği testlenmeli.
- **Ek bileşen / maliyet / risk:** Mevcut coordinator'a ayrı hata görseli; orta. Yanlış container/UID, yinelenen OOM, sahipsiz iz ve Job completion'ı hata gösterme riski.
- **Kabul:** Gerçek çok container restart/CrashLoop ve başarılı Job; kontrollü terminal Failed, mümkünse gerçek OOM/Evicted ayrı; finalizer, DELETE/new UID, duplicate/resync, reduced-motion. Her biri zamanlı kare ve cleanup ile.

### G03 — Node provisioning ve yeni filoya katılım ayrı eksikler (soru3)

- **Veri:** B için gerçek Node ADD/Ready yeterli. A için gerçek altyapı sağlayıcısı/join işlem kimliği ve yetkisi gerekir; yalnız Node nesnesi POST etmek yeterli değildir.
- **Backend:** En küçük B işi yeni provider gerektirmez. A istenirse seçilmiş bir yerel/bulut provider'a dar yetkili, idempotent, iptal/cleanup'ı tanımlı entegrasyon ayrı geliştirme olur.
- **Frontend:** B için gözlenen kayıt→Ready ile ilişkili kısa admission/limana katılma anlatımı. A'nın istek/kabul/sağlama aşamaları ancak provider gerçekten raporluyorsa gösterilmeli. Scheduler makine yaratan aktör olarak etiketlenmemeli.
- **Ek bileşen / maliyet / risk:** B düşük/orta; A ek provider+credential/auth modelinden dolayı yüksek. Altyapı maliyeti ve yarım kalmış VM cleanup riski.
- **Kabul:** Yeni gerçek worker join, Ready gecikmesi/başarısızlık, mevcut gemi fazları; provisioning varsa gerçek request/işlem kimliği/oluşan makine→Node eşlemesi. Demo gemisi ve API Node create bunların kanıtı değildir. Bu denetimde yalnız aynı gerçek worker'ın new UID yeniden kaydı doğrulandı.

### G04 — Deployment hazırlığı için eksiksiz gözlenebilir sunum yok (soru4)

- **Veri:** API kabulü/operation ID; gerçek Deployment→RS→Pod owner UID'leri; generation/observedGeneration; nodeName, conditions/container status ve Events. Her aşama her koşuda gözlenmez.
- **Backend:** Mevcut veriler ilk sunum için yeterli. Controller iç fazlarını gerçek kabul etmek istenirse ayrı audit/trace kaynağı gerekir.
- **Frontend:** Form taslağı, accepted, reconciling ve observed sonuç farklı; merkez/hangar hazırlığını gerçek adımlara bağlamak. Vinç uzak/busy ise sade varışın neyi anlattığını korumak. Gözlenmeyen image/Scheduled yüzdesi üretmemek; eşzamanlı workload'ları UID ile ayırmak.
- **Ek bileşen / maliyet / risk:** Operation/owner bağlamlı görsel sunum, orta. Ölü transfer kuyruğu, sahte ilerleme ve gerçek Ready'yi geciktirme riski.
- **Kabul:** Gerçek UI create/dry-run404, scale/restart, uygun Node yok, imagepull, admission/RBAC reddi, context iptali. Canonical Ready görsel transferi beklememeli. Yakın gemide timed vinç/halat/yük ve son cleanup ayrıca kaydedilmeli.

### G05 — Gerçek ağ/flow/protokol veri kaynağı yok (sorular6 ve7)

- **Veri:** Yetkili ve desteklenen bir gerçek provider (ör. zaten kurulu Hubble/flow-log veya mesh telemetry). Gözlem zamanı/tazelik/kapsam/yön/port ve kaynak-hedef Pod UID eşlemesi gerekir. L7 HTTP/gRPC/TLS kapsamı provider yeteneğine bağlıdır; porttan türetilmez. DNS/UDP desteği ayrıca kanıtlanır.
- **Backend:** Provider adapter'ı, sonlu kuyruk/örnekleme, pencere/toplama, erişim ve context izolasyonu, zamanındaki IP→UID eşlemesi, disconnect/stale davranışı. Genel packet capture/shell endpoint'i açılmaz.
- **Frontend:** Selector topolojisini gerçek flow katmanından ayrı ve etiketli sunmak; zaman penceresi/birim/yön/kaynak/örnekleme/eksik veri açıklaması. Ölçüm durunca animasyon güncel trafik gibi sürmemeli. Mesaj içeriği yoksa bilinmiyor kalmalı.
- **Ek bileşen / maliyet / risk:** Collector/provider entegrasyonu gerekir; yüksek ve ortama bağlı. Bu tur kullanıcı kümesine CNI/eBPF/agent kurulmadı. CPU/ağ hacmi, gizlilik ve yetki riski var; particle eklemek veri entegrasyonu değildir.
- **Kabul:** Own cluster'da iki **farklı** aynı-Node Pod ve iki farklı cross-Node Pod arasında istemci trafiği başlat/artır/durdur; gerçek sayaç/provider penceresi ve görsel tepki eşleştir. Bir Pod'un kendi IP'sine HTTP isteği inter-Pod kanıtı değildir. UID/IP reuse, filtre, provider kopması, şifreli L7 bilinmezliği, background trafik ve örnekleme doğruluğu ayrıca sınanmalı. Mevcut cross-node HTTP başarısızlığı başarıya çevrilmemeli.

### G06 — Genel Kubernetes erişimi listeden daha dar; ölçülemeyen yetenekler var (soru5)

- **Veri:** Gerçek API discovery/SSAR, installed addon ve capability; metrics için gerçek metrics-server veya isteğe bağlı zaman serisi sağlayıcısı. Kubernetes'in bütün özellikleri resource listesi değildir.
- **Backend:** Öncelikle G00. Sonra desteklenen controller action listesi ile UI aynı sözleşmeyi kullanmalı. Gateway/VPA gibi kurulu olmayan API'lerin yokluğu uygulama hatası diye gizlenmemeli. In-place resize “istenmiş” ile gerçekten kubelet'e uygulanmış olarak ayrı izlenmeli.
- **Frontend:** Tür/işlem/izin/animasyon ayrımını kullanıcıya doğru anlatmak; desteklenmeyen eylemi gerçekten açıklamak. Generic YAML özel3D veya tüm yaşam döngüsü desteği diye etiketlenmemeli.
- **Ek bileşen / maliyet / risk:** Capability sözleşmesi orta; metrics provider ayrı/ortama bağlı. Admission/immutable hataları ve yetki aşımı riski. Bu iş “bütün Kubernetes'i ekle” açık uçlu göç değildir; CSV'deki somut satırlar esas alınır.
- **Kabul:** Her seçilen ailede ayrı gerçek read/create/edit/delete/action; immutable/RBAC/409/reconnect/DELETE. Ölçüm yokken Veri yok. Native-sidecar/resize/drain/PDB/rollback/CronJob akışları ayrı gerçek test olmadan tamamlandı yazılmamalı.

### G07 — Merkez/control-plane mesaj anlatımı yok (soru8)

- **Veri:** Kavramsal anlatım için mevcut API cevabı, ownerReferences, Pod nodeName/conditions ve Scheduled Event yeterlidir. Birebir RPC için gerçek audit/trace/observability kaynağı ayrıca gereklidir.
- **Backend:** Kavramsal aşamaların kaynağını taşıyan mevcut alanlar korunur; gözlenmeyen controller/RPC aşamaları uydurulmaz. Provider yokken gerçek RPC endpoint'i iddia edilmez.
- **Frontend:** Merkez/API/controller/scheduler/kubelet kavramsal rolleri ve UID ilişkili kısa akış; “temsili” etiketi. Scheduler'ın Node sağlamadığı açık olmalı; provisioning B zinciri ayrı.
- **Ek bileşen / maliyet / risk:** Mevcut sahnede sınırlı sunum orta; gerçek iç RPC telemetrisi yüksek/ayrı entegrasyon. Yanlış mesaj sırası, farklı Deployment'ların karışması ve gizli sahte ilerleme riski.
- **Kabul:** En az iki eşzamanlı gerçek Deployment, scheduling hatası/image hatası, skipped watch aşaması, reconnect ve context iptali; gözlenen/kavramsal adımlar ayrılmalı. Gerçek RPC iddiası varsa provider ölçümüyle korelasyon şart.

## P2 ve henüz runtime doğrulanmamış kaynak riskleri

Bu maddeler doğrulanmış çalışma hatası olarak sayılmadı; maliyeti küçük, hedefli bir sonraki kanıtla öncelikleri netleştirilmeli.

| Aday | Veri / backend / frontend / ek bileşen | Maliyet-risk | En küçük kabul testi |
|---|---|---|---|
| Owner CPU/RAM UI/backend sınırı (soru5, source-only P1 adayı) | Gerçek owner zinciri; UI `resolveController` Job/CronJob/RS çözebilir, backend resources action yalnız Deployment/STS/DS kabul ediyor. Ortak capability hedefi gerekir; ek sistem yok. | Düşük/orta; yanlış kapsamta kalıcı değişiklik veya422 | Standalone RS ve Job/CronJob Pod'unda CPU/RAM aç/dry-run/submit; açık destek gerekçesi veya doğru template hedefi; sahte başarı olmamalı |
| Secret annotation koruması (source-only P0 adayı) | Sanitize/reveal annotations'ı atıyor; fullPUT editte kayıp olasılığı. Amaçlı yetkili akış metadata'yı korumalı; ekstra provider yok. | Düşük/orta; metadata veri kaybı. Kullanıcı Secret'ı bu audit için okunmadı. | Yalnız kendi sentetik Secret'ında metadata-only before/after; bilinmeyen annotation korunmalı, maskeler geri yazılmamalı, değerler artefakta girmemeli |
| Storage slot reclaim (source-only P2) | Mevcut PV/PVC UID; FacilityResources allocationMap DELETE slotlarını boşaltmıyor olabilir. Backend olayları aynı; frontend slot reclaim/reset; ek sistem yok. | Düşük; yeni görsel modülün görünmez kalması | Üç own PV/PVC ekle/sil→yenilerini ekle; tablo ve3D yerleri/UID'ler, canonical sayı, context reset |
| Node ghost pose / failed tilt-cargo uyumu (source-only P2) | Son gerçek render pose; canonical değişmez. Ghost yaw/pitch/roll ve küçük failed tilt ortak dönüşüme bağlanmalı; ek sistem yok. | Düşük; yanlış pozisyon/yön, yanlış UID'yi silme görüntüsü | Hareketli Node DELETE timed video +3D matrix readback; Node False'da cargo gövdeye bağlı kalmalı |
| Ağ çizgisi anchor/namespace/bölge sınırı (source-only P2) | Service selector + görünür Pod/Node kapsamı; backend flow yok. İlk6 dışındaki seçili Service ve görünmeyen hedef için yanlış anchor çizilmemeli; ek provider gerekmez. | Düşük/orta; yanıltıcı topoloji | Yedi Service, namespace filtresi, bölge dışı Pod; her çizginin UID/endpoint'ini gerçek kaynakla karşılaştır |
| Logs endpoint'inde UID yarışı (source-only P0 adayı) | HTTP log isteği raw namespace/name/container kullanıyor, UID önkoşulu yok. Backend optional UID kontrolü ve client request guard; yeni provider yok. | Düşük/orta; aynı ad/yeni UID yarışında yanlış incarnation logu | Eski selected UID/log request sırasında aynı-ad replacement; eski istek yeni Pod'a sessiz bağlanmamalı. Bu tur böyle yarış üretilmedi. |
| Dar kadraj / etiket açıklığı (P2 görsel gözlem) | Mevcut dünya sınırları ve viewport; backend değişmez; kontrollü focus/finder korunur. | Düşük; kamera tercihini kaçırma riski |768px'de kenardaki gemi ve yükü finder/focus ile eriş; panel aç/kapat canvas/kamerayı resetlememeli |
| Node yokken atanmış yükün sahneden kaybolması (P2, runtime gözlemi) | E02 canonical21Pod korunurken görünür11→9→11. `renderPods` olmayan Node adını dışlıyor; backend/Pod phase değiştirilmeden açıkça kayıp-Node ilişkisi gösterilmeli. Ek sistem yok. | Düşük/orta; kullanıcı bunu Pod silinmesi sanabilir, sahte Pending veya yeni Node üretmek daha kötü olur. | Node DELETE, Pod hâlâ API'de nodeName ile mevcut; finder/panel ve açık etiketli görsel erişim sürmeli. Yeni UID ile Node döndüğünde aynı Pod çoğaltılmadan doğru temsil edilmeli. |

## Doğrulama engelleri, geliştirme işinden ayrı

- Yeni üçüncü worker provisioning/join: pause sonrasında minikube profil dosyaları silinmişti. Aynı gerçek worker'ın new UID kaydı test edildi; fresh-worker testi hâlâ eksik.
- Gerçek flow/protokol ve ölçüm grafiği: collector/metrics API yok. Eksik sağlayıcıyı animasyonla veya random seriyle örtmek çözüm değildir.
- Native hidden denemesi: Playwright ile minimize edilen kendi penceremiz `document.hidden` olmadı. Giriş koşulu yokken background E2E geçti denmedi; native, focus-emulation etkisi olmayan ayrı harness yolu gerekir. Ek telemetry kurulumu gerektirmez.
- Native Safari, gerçek Evicted/OOM, native-sidecar, resize/drain/rollback, concurrent context/form iptali ve uzun memory/cleanup çevrimi: bu denetimde çalıştırılmadı. Sonraki doğrulama hedefli olmalı; eski bütün CPU benchmark matrisi gereksiz tekrar edilmemeli.
- Previous-log helper'ındaki eski metin yarışı bulundu; eski case OBSERVED etiketi tek başına kabul edilmedi. Ayrı tek-restart fixture/request/content kontrolü esas alınır. Her yeni test, assertion ile screenshot'ın aynı veriyi gözlediğini doğrulamalı.
