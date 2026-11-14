# TEST-12.03 — generic resource JSON guardları

14 Kasım2026. Ürünruntime15770296 / auditHEAD57ad606e059d31f50d316a12f6a218f6a2edb11a; yalnız yeni `backend/pkg/server/release_resource_parser_test.go` ve bu evidence klasörü değiştirildi. ROADMAP/Git/index/product dosyaları worker tarafından değiştirilmedi.

**Sonuç:1ana/12alt PASS,0FAIL/0SKIP; tekdüzeltilmişgrup6.565316sn.** İlkfixtureFAIL7.219369sn `attempt01/` içinde aynı hamsonuç/source/plan ile korunur. Genel TEST12.03 kapanış kararı ana müdüre aittir; bu worker yalnız backend genericJSON altkapsamını doğrular.

## Gerçek aktif yol ve sınır

Gerçek kayıtlı `/api/resources` HTTP handler → `server.go:decode` MIME+2MiB+tekJSON → `Mutation.Object` UnstructuredJSON → hammetadata/name/namespaceguard → client-go0.30 `Dynamic.Create` → ownedloopback `httptest.Server` HTTPcapture. TypedSSAR testfixture mevcut fakeAllowed kullanır; resourceendpoint'in read-write operatorcookie/nonce/context fixture'i açıkça kuruludur. Normal ikiPOST'un gerçekwire path'i `/api/v1/namespaces/qa/pods`, queryexact `dryRun=All`, `fieldValidation=Strict`, `timeout=3s`, MIMEapplication/json olmak zorundadır. MinimalAPI yalnız bodyecho201 yapar; Kubernetes şema/admission doğrulaması veya gerçek kaynağın oluşması değildir. `validated` cevabı dry-run olarak assert edilir.

## Pozitif/negatif sonuçlar

| Kontrol | HTTP | Upstream create |
|---|---:|---:|
| Normal Pod/namespace omitted/metadata |201|1|
| BozukJSON/ikinciJSON/arrayobject |400|0herbiri|
| text/plain |415|0|
| Stringmetadata/missingname/nullobject |422|0herbiri|
|2097509bytebody(2MiBüstü) |400|0|
|20095byte, toplam10001nest |400|0|
| Objectnamespaceother / requestqa |422|0|
| Negatiflerden sonra duplicate/numeric/unknown pozitif |201|1|

Heraltkontrol bağımsız önce/sonra capturecount karşılaştırır. İki pozitif exactnamespaceqa iletildiğini ve operationstatusvalidated olduğunu doğrular; ilk normalmetadata/label korunur. Sonpozitifte JSONscalar `dryRun:false,true` sontrue olur. Unstructuredmetadata iki kez verilirse sonobject öncekini değiştirir: sonname `parser-after`, yalnız `kept:second`annotation kalır. Bu, workspace struct-map tekrarlarının merge davranışından farklıdır; tekglobalduplicatepolitiği diye anlatılamaz.

`9007199254740993` tamsayısı client-go→HTTP gövdesinde kayıpsız `json.Number` olarak,1.25kesri aynen doğrulandı. Unknownobjectfield strictKubernetesAPI isteğine korunarak taşınır; fixture bunu echo eder, gerçekAPI'ninunknownfield'i kabul edeceği iddia edilmez. Unknown mutationenvelopefield object'e kopyalanmaz. Body/depth limitleri dışJSONdecode yolunda reddeder; bütüngeçerliJSONderinliklerinin performansı veya bütünresourceşemaları sınanmadı.

## İlk hata ve düzeltme

İlkfixture2queryparametresi bekliyordu. Explicit `rest.Config.Timeout=3s` client-go `rest/request.go`147–150 ve519–520 yolunda HTTPtimeout'a ek olarak `timeout=3s` query'si üretir. Bu meşru üçüncüparametre ilk wireassertion'ı düşürdü; fixture'nin paylaşılanwireerror listesi sonraki altkontrollere de taşındı. İlkstatus beklentileriyle ürünpanic/yanlışnamespace/kayıpsızsayı sorunu görülmedi. Test düzeltmesi exactdryRun/fieldValidation koşullarını koruyup exacttimeout3s/3query assert etti. Ürün beklentisi gevşetilmedi, runtime fix yapılmadı. Bir gerekçeli sonlu retest1/12PASS; ilkFAIL yeniPASS diye yazılmadı.

## Kaynak bütçesi / cleanup

12distinctpayload,herattempt2118861byte; ikiattempt toplam4237722byte(<8MiB); enbüyük2097509byte(<3MiB); depth10001fixture20095byte(<128KiB). Go1.26.11,`-p1 -parallel1 -count1 -timeout60s`,GOMAXPROCS2/GOMEMLIMIT1GiB; supervisor90sn/RSS1.5GiB/disk10GiB. İlkkoşu7.219369sn,sonkoşu6.565316sn;45dakika/fuzz/başkakümeişi yok. Sonpeakörnek süreçRSS toplamı694432KiB; bu fizikselRAM veya benchmark sonucu değildir.

Kaynakbefore/afterSHAeşit; soncaptured5processkimliğinin hepsi temizliksonrası yok. httptestlistener `t.Cleanup(Close)`, serveroperatorcontext `s.Close` ile kapanır; kernel/lifetime exhaustiveprocess/connectiontrace alınmadı. Gerçekkubeconfig/credential/Secret okunmadı; fixturetamamısentetik. Requestbody değerleri rawartefact'e basılmadı; boyut/SHA/status/createDelta kaydı var.

## Tekrar komutu ve kanıt

Repo kökünden Go1.26.11 ile:

```sh
cd backend
GOMAXPROCS=2 GOMEMLIMIT=1GiB KUBECONFIG=/dev/null KV_HUBBLE_ENABLED=false KV_MINIKUBE_ENABLED=false /Users/yunusemre/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin/go test -json -p 1 -parallel 1 -count=1 -timeout=60s -run '^TestReleaseResourceParserBoundedJSONTransport$' ./pkg/server
```

Bu komut kısaaynıgrubu yenidençalıştırır; auditlauncher `run.py` existingexecutionoverwriteguard nedeniyle tekshot'tır. Yeni gerekçeli koşu yenioutputkimliği gerektirir. `go-test.jsonl`, `execution.json`, `plan.json`, `test-source.go.txt`, `result.json`, eski `attempt01/` ve `SHA256SUMS` kaynak/sonuç ilişkisini saklar. Frontendparser,workspaceimport,gerçekKubernetes ve diğer kabulkapıları ayrıca değerlendirilmelidir.
