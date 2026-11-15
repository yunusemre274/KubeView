# GüncelB frontend + currentcommon gateway — gerçek derleme kanıtı

15 Kasım2026. **CURRENT_B_FRONTEND_AND_COMMON_GATEWAY_COMPILED_PASS.** AuditHEAD`e48604e2dfbbba3711a1aa64122b22b31d7c4e40`, ürünruntime`15770296056ca2629601dba540c04741e1822e0d`. Yalnız iki derleme tekkezçalıştı; testassertion/testbinary/server/browser/ölçüm/cluster çalıştırılmadı. Go`test -c` testleri **derler**, çalıştırmaz. Git/index/ROADMAP/product/benchsource değişikliği yok; generatedunused`.build` ve ownedprivate/evidence dosyaları eklendi.

## Kaynakbariyeri

Tracked `e48604e2` frontend+backend için private `git archive` alındı; archiveSHA`a68a8932721b59d4ab5c7bb94845d17e086f87b3bd3bd8631bc917b69c794f86`,323member/4224183expandedbyte. Absolute/traversal/backslash/link/special girişler reddedildi;≤4096member/256MiB sınırı. Privatekök0700; snapshotrepoda `.git/release-audit/perf-current-build-20261115/source` altında. Kullanıcıworktree/untrackeddeğişiklikleri alınmadı/silinmedi. SnapshotGitcommit'i root/diğerworker'ınsonrakiSBOM/Vite/script değişikliklerinden bağımsızdır.

Frontendlock`ecbd67c765f1e244df703e5e1f13c95fa32bd94abf4e9e278bec4b15f34f5d90`; currentworkinglockeşitliği ve155cachedpackageversion karşılaştırması/6kritikmanifest exactversion+SHA kaydı var. Eski/sharednode_modules symlink'i mevcutpanel-build yolu kullanır; `npm ci/install/latest` yok. Hiddeninstalledlock/6manifest beforeafter eşit. Bu kontrol bütündependencyfilebytelarının kriptografiktarama veya yeniCVEacceptance'ı değildir.

## Gerçek komutlar / sonuçlar

- `node benchmarks/panel-build.mjs cat16-current157-20261115T095801Z --source PRIVATE_SNAPSHOT/frontend`: gerçekVitebuild, exit0,09:59:22.190Z→09:59:24.577Z (~2.386sn). Kaynak99dosyaprovmap privatefrontendkopisiyle birebir.
- ExactGoSDK1.26.11 ile privatebackendcwd'de `go test -c -p 1 -o ABS_NEW_COMMON/backend.test ./pkg/server`: exit0,09:59:24.577Z→09:59:30.243Z (~5.666sn). DerlenenGo/GoMod/GoSum ve yardımcıtest kaynakSHA'ları `backend-source-SHA256.json` içinde; beforeafter snapshotdeğişmezliği doğrulandı.

Herikidederleme environment: GOTOOLCHAINlocal/GOMAXPROCS2/GOMEMLIMIT2GiB/CGO0/GOPROXYoff/UV_THREADPOOL_SIZE2/NODE_OPTIONSmax-old-space-size2048. ExactNode/Go/panel-build executablesource SHA'ları result ve actual-build-identities'de. Otomatikretry0; herstage'nin stdout/stderr ve executionkaydı ayrı. ViteoutDirprivatefrontendprojesi dışındadır uyarısı mevcutunusedoutput'u temizlemediğini belirtir; `--emptyOutDir` eklenmedi, eskioutputezilmedi. Go.stderr boş.

| Üretilen | Kimlik |
|---|---|
|Btag|`cat16-current157-20261115T095801Z`|
|Bsourceaggregate|`41b8240d6f4546ef4fd0df415cc8cb84239e3cac7251fff518ea232c10d45ddf`|
|BprovenanceSHA|`909624bb091332e4d2d6b3178dc900f4b67a0571426d2275c209e7357bdcdb4e`|
|BindexSHA|`d0b09c58e230d899fe974a215412826df7a8507c052b63d6a4de174fe3b7a5bb`|
|Commongatewaytag|`cat16-common157-20261115T095801Z`|
|Actualbackend.testSHA|`74cf606a29e072e620fc08b9ac40f277bc72ff5e28ec28b04fdd46eb0a94b1e1`|
|Actualbackend.testbytes|65799938|

Altıactualfrontendasset'in **tamamı** hash'lendi; detay `actual-build-identities.json`/`frontend-provenance.json` içindedir. Profilingfalse. Yalnızsourcebaşlığıylaeşitlik varsayılmadı. YeniBtagiçinbackendlinkoluşturulmadı; ölçümde `--backend-tag cat16-common157-20261115T095801Z` açıkoverride kullanılmalıdır.

**EskiA36d/frozenBf32/oldcommon dosyaları veya linkleri değiştirilmedi.** FrozenAprovenance ve oldbackendlink targetstring beforeaftereşit. Bujob eski65MBcommonbinary içeriğini tekrar hashlemedi; yeniactualbackendSHA hesaplandı. Özelderleme izinleri dışında geçmişfrozenetiket/provenanceyenidenyazımı yok.

## Güvenlik sınırı / cleanup

İlkcanlıönkontrolAC37charging/lowpowermode0; stageörnekleriAC39/39,27resourceörneği. TavanVite120sn/Go180sn/work360sn+60snrapor; ACzorunlu/battery≥30/disk≥10GiB/ownedprocesssumRSS≤4GiB,0retry. Snapshotpreparation+derekleme+cleanup89.377sn; örnekpeakownedRSS1226326016byte(1.142GiB),4GiBtavanaltında. SüreçRSS toplamı kesin fizikselRAM değildir, compilekaynakkullanımı uygulamaCPUperformansı değildir.

Captured8PIDbirth+command kimliğisonrasında yok; sadeceeşleşenownedkimliklerecleanup uygulanır. BaşkaMacprojesi/simülatör/browser/lab durdurulmadı. Sekizcapture bütünkısaömürlüprocesslerin eksiksizkernelcensus'u değildir. Privatekaynakvebuildçıktısı korunur; yeniport/namespace/küme oluşturulmadı. Rapor/execution rawkubeconfig/token/Secret içermez.

## Sonraki iş ve sınırlar

Bu bir **derleme kabulüdür**, startup/UI/doğruluktesti veya CPU/FPS/latencykazancı değildir. Önceki performanspreflight'ın currentB/currentcommonderleme engeli artık buexacte486source için giderildi. Controlledhover/actualrenderidentity tanısı henüz başlatılmadı; yeni ayrı rootgörevi gerekir. EskiBENCH-RENDER-001/CPU/bellek/soak/nativeSafari ve fizikselUIkapıları açık.

SonrakiVite/bağımlılık/SBOM/runtime değişikliği buactuale486build'i finalyeniaday yapmaz; yeni kaynakpaket ile uyumluluk ve gerektiğinderetest/build kimliği root'ta ayrıca değerlendirilmelidir. Frozenbinary/assetler immutable kalır; sharednode_modules veya harnesslock değişirse actualrunner'ın karşılaştırılabilirlikguard'ı esgeçilmez.

`build-once.py.txt` eskihelper'dan daruyarlananactualsupervisor kaynağıdır; mevcutresult varsa tekrarçalışmayıreddeder. İkioutputtag/privatetarget için yeniunusedkimlik olmadan komutlar tekrarçalıştırılmamalı. Kullanıcıproductionappbaşlatma komutu değil; yalnız compilerargv'ları actualstage-executionJSONlarda yer alır.
