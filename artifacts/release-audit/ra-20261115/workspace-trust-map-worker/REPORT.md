> Worker bütçe ihlali: rapor finalizasyonu300sn hedefini aştı; actual süre result.json içindedir. Sourceharitası tamam, fakat bujob otomatik tamPASS değildir; root timing/scope kararını ayrı kaydetmelidir. İlkfinalizerassertion hatası korunur.

# TEST-01.03 — Workspace / liman / bağlantı / cache güven sınırları

15 Kasım2026. İncelenenHEAD `2d5aced373b609aa012a7a4f80ed9dfe0410e29f`; ürünruntime `15770296056ca2629601dba540c04741e1822e0d`. Bu yalnız **SOURCE boundaryphase** incelemesidir. Yeni test/build/browser/cluster/ağtarama/altajan çalıştırılmadı; ürün/test/workflow/Git/index/ROADMAP değiştirilmedi.30seçilmişsourcefilehash/satır/simge envanteri `source-inventory.json`, başlangıç/bütçe `plan.json`, mevcutkanıtın uygulanabilirliği `evidence-applicability.json` içindedir.

**Öneri:** rootikinciincelemesi sonrasında bu dar kaynakharitası fazı VERIFIED_DONE yapılabilir. Bu öneri bütün cross-harbor güvenliği, gerçek bütün CRUD/stream/recovery, güncel UI/performance veya yayına hazırlık kabulü değildir. CAT03/04/05/06/10/18/19 kapıları ayrıca değerlendirilmelidir. İnceleme aynı ajan sistemindedir; profesyonel bağımsız üçüncü taraf pentest/sertifika değildir.

## Dağıtım ve güven varsayımı

Ürün local-first tekoperatör modelidir; harborID ayrıbir kullanıcı/tenant ACL'si değildir. App erişimine sahip operatör trustedserverkubeconfig'deki bağlantılardan kendi limanlarını yapılandırabilir. Namespace/label projeüyeliği tanımlar; **Kubernetes yetkisinin yerine geçmez**. Source'taki doğru hedefe bağlama ve client/grant/cache ayrımı, paylaşımlı SaaS kullanıcıisolasyonu gibi sunulmamalı. Bu inceleme uzaktanadminproxy kurulumunu veya çoktenantdeployment'ı onaylamaz.

## 1. Girdi → server türetimi → çıktı / karar tablosu

| Veri / sınır | Güvenilmeyen girdi | Yetkili kaynak ve kontrol | Çıktı / güven anlamı |
|---|---|---|---|
|workspaceID|Header `X-KubeView-Workspace` veya queryworkspaceId|`workspace.go:123–164 bindWorkspaceRequest`: currentStoreSnapshot.ID ile eşitlik; yok400/farklı404|Mevcut özel appworkspace'i; kubeclusterUID değildir|
|harborID/tabID|Header/queryharborId/tabId|Aynı store'da harborlookup; tab≤128 veayraç/yol/whitespace reddi; `operatorKey` cookie+workspace+harbor+tab|Per-tab/per-harbor yönetimniyeti; UUID bilgisi tekbaşına yetki değildir|
|connectionRef/connection.id|Harborconfiguration|Storedharbor.ConnectionRef→storedConnection; Bound/contextzorunlu; create/PATCHcontext trustedserverloader'da olmalı; yeniIDserverUUID|Tarayıcı credential/backendclient seçimini kendi authalanı enjekte ederek değiştiremez|
|context|Query veya kayıtcontext|`server.go:395–414 requestClient` storedconnectionContext'i esas alır; çelişenquery409|Ad adreslemeipucudur, credentialeşitliği veya fizikselclusterkanıtı değildir|
|namespace/selector|Harborconfiguration/query/body|`Store.Validate` nonempty≤64 namespace/validselector; serverWATCH_NAMESPACE genişletilemez; `namespace` whitelist; dynamicbodycheck ve typedmembership|Üyelik ve doğru hedef; RBAC değildir. Selector yoksa izinli küme-kataloğu davranışı geçerlidir|
|GVR/kind|Discovery/query/subscribe|`namespacedResource` actualdiscovery; eksikscopeerr failclosed; selectedcredentialSSAR ve realAPI sonkarar|Katalog kurulumu ve verb yetkisi ayrı; arbitrarykind yazmak izin vermez|
|private credentialfingerprint|Tarayıcıdan alınmaz|`trafficIdentity` providerTransport(APIHost/ServerName/TLS/CA)+authmaterial/tokenfile/cert/key/impersonation/authprovider/execconfig hash'i; `client` bunu private saklar|Config/authmaterial değişince yeni randomclientID; rawfingerprint/frontendcredential yok|
|credentialGeneration / authorizationKey|DTO'da görülebilir opaque alan|`workspaceIdentity`: serverclientID; safeAuthorizationKey clientID+connectionID hash'i|Cache/session nesli; canlıRBACizinlerinin değişmezliği veya bağımsızSSARfingerprint'i **değildir**|
|clusterUID|Clientdeğerine güvenilmez|Seçilicredential ile gerçek kube-system Namespace.Get.UID; erişilemezse confidenceunknown|Yalnız fizikselNode/resource dedup; credential/cache/grant eşitliği değil|
|UID / RV|Kaynak/adres ve mutationprecondition|Gerçek upstreamUID/opaqueRV; ownerUID eşitliği; aynıad/yeniUID ayrı; API conflict/precondition|RV global sayısal saat gibi kıyaslanmaz; isim kimliğin yerine geçmez|
|connectionID query|Yönetimprotokolünün opaque değeri|`protect` içinde X-KubeView-Connection yoksa fallback managementnonce|Bu **storedconnectionRef UUID'sinden farklı alan**; clientID+context+scope+nonce+expiry ile grant doğrulanır|

`workspaceHandler`/contexts uçları harborbinding'den amaçlı muaftır; access/origin guard ve workspace mutasyonlarında ayrıcookie/nonce/revision sınırı vardır. `Store.Update` clone+Validate+persist doğrulanmadan commit etmez. Import Context/Bound taşımayıp yeniID/ref üretir; dahaönceki ImportInto/parser kanıtı ayrı tutulur. Configsilme KubernetesDELETE değildir.

## 2. Aktif backend haritası

1. `Server.protect` (`server.go:156–195`): access/origin kontrolü → bindWorkspaceRequest → scopedoperator → requestcontext cancellation. Header/query sadece hedefisteğidir; store kendi connection/ns/selector'ını bağlar.
2. `client` (`server.go:307–394`): trustedkubeconfig/in-cluster loader; fingerprint+defaultnamespace eşitse cachedclientreuse, değişirse yeniUUID ve eskioperatorları retire.128clientreferans sınırı vardır. Raw kubeconfig/cert/token tarayıcıya taşınmaz. Authplugin **config** kimliği plugin'in hergeçicitokençıktısının eşitlikkanıtı değildir; gerçek API/SSAR ayrıca gereklidir.
3. `scopedClient` (`workspace.go:166–174`): baseclient'i kopyalar; ID `baseGeneration:connectionRef`; Dynamic'e workspaceadapter koyar. ClusterUID veya URL benzerliği bu alanın yerine kullanılmaz.
4. `authorize` (`resources.go:21–55`): workspaceguard → serverreadonly/grant (write'da) → exactcredentialSSAR. Çoknamespaceunion için herexplicitnamespace izin; daha geniş allnamespaceSSAR varsayılmaz. `managementAllowed` context/clientID/nonce/expiry/namespace kontrol eder; `resetOperator` eskictx,nonce,members,streamgeneration'ı iptal eder.
5. `workspaceDynamic` (`workspace_scope.go:238–451`): discoveryscopecheck; Get/List/mutation ayrıguardlar. Body namespace r.ns ile eşleşmeli; Update/Delete önce mevcutobjectmembership'i doğrular; unsafeunbounded genericapply/deletecollection desteklenmez. ÇoknamespaceList upstreamtype korur, globalRV uydurmaz. TypedSecret/log/exec/forward `authorizeWorkspace` ile aynımembership'i kullanır; discoverybulunmayınca namedselectorcheck no-op olamaz (SEC001fix).
6. `scopeContains` (`workspace_scope.go:100–181`): aynıcredential+namespace üzerinden selector/template/ownerUID ilişkileri; depth6cap. Brokerownerlookup aynıclientgeneration+connection key'sini ister. Name-only ownerreplacement kabul edilmez. Service/EndpointSlice ilişkisi yapılandırılmıştopolojidir, gerçektrafficölçümü değildir.

Cluster-kataloğu Node/StorageClass/CRD/ClusterRole gibi alanlarda namespace'eaitmiş gibi daraltılmaz; gerçekread/watchRBAC gereklidir. PVclaimnamespace/ClusterRoleBinding subjectns ve cluster-impactacknowledgement ekkontrolleri vardır. `X-KubeView-Cluster-Impact: acknowledged` kullanıcıetkionayıdır; Kubernetesizni sağlamaz.

## 3. Cache, snapshot→delta ve cleanup

`watchBroker.acquire` (`workspace_broker.go:31–92`) exact `scopedclientID + scope.key()` (GVR/exactnamespace/selectorcoverage) üzerinden paylaşır; yeniaktör/credential/connection başka cache'e girer. Broker içindeki upstreaminformer **aynıyetkilicredential için unfiltered** olabilir; `stream.go` herconsumer'a selector/membership uygulamadan browser'a yaymaz. Sunucudaki raw informerobjesinin bulunması, Secret'ın bulkWS'ye gönderildiği anlamına gelmez: sendöncesi `sanitize` copy'si; amaçlıreveal ayrıpath. Buinceleme hostprocessmemory erişimini birclientACL olarak güvenceye almaz.

Broker512entrycap; listenerrefcount+once release; sonabone upstreamctx'yi cancel eder, birabonenin kapanışı diğerini durdurmaz. Operator128/client128/membership4096 ve frontend64canonicalcore sınırları source'da görünür. Bunlar bütüntüketim/stress kabulü değildir.

`stream.go:346…`: yeniserverUUIDgeneration; initiallist/watchSSAR; informer sync sonrası scopeauthoritative snapshot; readybarrier → delta. Membershiptablosu (`workspace_membership.go`) yalnız buoperator'ın öncedengördüğüUIDmetadata'sını taşır; streamgenerationmatch yoksa publish reddi. OUT_OF_SCOPE ayrımetadata olayıdır, gerçekDELETE gibi uydurulmaz. OpaqueRV eşitliğine göre eski/samesync bildirim süzülür; numericglobalorder yok.

15snheartbeat yeni configclientgeneration'ını kontrol eder; farklıysa unsyncedstatus+close. AyrıasyncSSARbatch exactadmittedscope list/watch yetkilerini yeniler; atomicterminalfailure/writeradmission sonraki yayını durdurur. Snapshot veSTATUS forbidden/unavailable kapsamları non-authoritative'dir; “veri eski/erişilemiyor/yetkiyok” canonicalDELETE değildir. Periodikrevoke atomik/anlık değildir; öncedeniletilmişbilgi geriçağrılamaz. Upstreamwatch'ın ilkmi, gatewayheartbeat'in ilkmi kapandığı gerçektestte ayrıinstrument edilmedi. Log/exec/forward/flow establishedsession yetkiyenileme kapsamı ayrıca açık tutulur.

## 4. Frontend kaynak / seçim / form sınırı

`harborScopeKey` (`world/workspace.js:14–17`): workspaceID+connectionID+credentialGeneration+authorizationKey+normalizeNamespaces+selector. **physicalClusterKey** yalnız confidenceverified+clusterUID ile fizikseluniondedup yapar; unknownconnectionfallback ayrıkalır. Aynıküme farklicredential için canonicalcache birleştirilmez. KaynakID UID+cluster+group/resource+namespace bağlamındadır.

`WorkspaceRegistry.configure` exactkeybaşına core oluşturur; herharbor için ayrı `HarborSession` overlay/grant/request/pin/operationhistory. Configuration değişen sessiondispose; kullanılmayancorecleanup; sonretainedharbor için transporthedefi kontrollü devredilir. Activate/deactivate requestleri abort+epochrevision ilerletir, managementintentreadonly yapar. Accept edilmiş ancak ayrılmışişlem originharbor'da detached/unknownrecord olarak kalabilir; başka limana yönlendirilmez.

`ShipyardClusterContext.request` URL'ye workspace/harbor/tab bağlar, AbortController requestset/finallycleanup ve requestEpochguard kullanır. Socketcallback epoch+exactsocket; mesaj workspace/harbor/tab+sessionGeneration; reducer context+generation kontrolü. YetkikaybıSTATUS scopecoverage'i değiştirir; canonicalUID/diğernamespace/tombstone korunur, sağlıklıSTATUS authorityrestore edemez; gerçek başarılısnapshot gerekir.

`App.jsx:199–247`: viewcache yalnız aynısourceKey'ye; exactUID seçimrestore; Secret/sensitiveform cache dışı. `:384–406` seçili/formUID observationpin+on-demand scope. `:582–605` eski formsource/namespace sonucu yeniaktifkaynağa yazılmaz. `ResourceForms.jsx:288,453–525` draftsource+UID/dirtyguard, GET/revealabort, aynıUID/RVfarkında taslak korunumu. Panelkamera bağımsızdır; bu kaynakharitası yeni görsel/klavye testinin yerine geçmez.

## 5. Mevcut kanıt / uygulanabilirlik (yeniden çalıştırılmadı)

| Kanıt | Tür / gerçek sonuç | Güncelkaynak bağı / sınır |
|---|---|---|
|11Kasımsecurity-worker SEC001 regression/retest|Sentetik typed/dynamic discoveryguard RED→GREEN;80namedendpoint requestmatrix|repair-identity'deki2dosya currentSHAeşit. GerçekK8s veya gerçekexec/forwardoturumu sayılmaz|
|12Kasımactive-watch-real-e2e-attempt02-root|GerçekownedKubernetes+2SA+HTTP/WS; A RoleBindingdelete→SSARdeny/API403/gateway403/failedscope/trueclose;B200+UPDATE;6fixtureGET404/brokerempty|Plan12currentSHAeşit. Runtime15770296; tarayıcı/finalbinary/heartbeat-onlynedensellik değildir|
|12Kasımactive-watch-frontend-root RED/GREEN|STATUSfailure reducer2FAIL→46PASS/0SKIP;canonicalUID ve başkaNs korunur|greenreceipt3SHA + baseline2be79companion6SHA currenteşit; actualRoleBinding/browser değil|
|workspace_test.go mevcutaltkontroller|Fakeclient/in-process HTTP/WS; wrongworkspace/context/ns/label/grantharbor-tab/sharedbrokerselectorExit/lastrelease|Sourcefonksiyon envanteri vardır; eskiSKIPopt-in kayıtları gerçekE2E yapılmaz|
|workspace.test.js 50A→B→A|12KasımGREEN'in46testi içinde gerçekmanager+fakecore/fetch gecikmişrequest/URL/abort50geçiş|CompanioncurrentSHAeşit. Bu **unit**,50normalbrowser veya50gerçekAPI işlemi değildir|
|09Kasımvertical03replay50UI / reader→admin→reader / vertical05scaleAonly|ReplaynormalDOM50geçiş; ayrıgerçekK8sUID/logscope veAgrantB'yegeçmiyor tarihselkayıtları|JSONlar mevcutvehashli; tamcurrentbinary/sourceeşitliği kurulmadı. Görseller bujob'da açılmadı; güncelUI/E2Egeçti iddiası yok|

Kanıt yolları veexactSHAler `evidence-applicability.json` içinde. Yeniçalıştırma0. Birdeğişmişyola eskiPASS taşınmadı. Öncedenbulunan SEC001 ve SEC-WATCH-REVOKE-001 örnekleri kaynakhipotezi değil, tarihliRED/fix/retest kayıtlarıdır; activeRoleBinding gerçekAPI+WS kanıtı ile sentetikreducer kanıtı ayrı değerlendirilir.

## 6. Bulgular / sonraki sınır

Bu sınırlısourceincelemesinde yeni doğrulanmışcrosscredentialcacheleak veya yanlışhedefmutation bulunmadı. Bu ifade “hiçbir açık yok” değildir. Şu kanıt sınırları kalır:

- Fingerprint/generation privateconfigkimliğidir, permissionsimmutable değildir; SSARperiyodik ve hergerçekAPIisteğinin RBACsonkararı gereklidir. Yetkiiptali öncedenpaylaşılmışveriyi unutturma garantisi vermez.
- TarihselreconnectsnapshotUIDseti ve herUPDATEopaqueRV/label eşlemesinin tümü mevcutUIkanıtında asserted değil (WORKSPACE_ACCEPTANCE'daki darAPIlimiti korunur).
- Yeni gerçekcurrentbinary50crossharboroperation, Secret/metrics/flow/exec/forward revoke, bütünbackground/longcleanup ve yüksekölçekresource sınırları bujob'da çalıştırılmadı. Sourcephase kabulü bu gate'leri kapatmaz.
- Rootikinciincelemesi pending. Uygulananfix yok; yeniPoCred→green altadımı gerekçeli N/A, geçmişfixkanıtları ayrıreferans. İncelenmeyenyeni işleriDONE yazmamak gerekir.

Bütün çıktı yalnız bu evidence dizinindedir; hiçbir ownedlab/process başlatılmadığından sonlandırılacaktestkaynağı yok. Kaynak/control/paket/GitID ilişkisinin finalkabulü root'tadır.
