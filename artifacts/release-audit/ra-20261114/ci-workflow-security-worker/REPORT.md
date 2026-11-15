# CAT20.11 / CAT20.12 — CI güven sınırı, pin ve artefakt incelemesi

14 Kasım2026. AuditHEAD `ae7aebc51984a144f10b4780989a6d1a8f19197e`; ürünruntime15770296. Ana müdür ROADMAP/Git sahibidir. Worker yalnız bu rapor dizinini ve yeni `scripts/release-ci-policy.test.mjs` dosyasını yazdı. Workflow/product/dependency/lockfile/Git/index değiştirilmedi. Yeni CI/build/browser/cluster veya fork işlemi başlatılmadı.

**Kaynak/policy kontrolleri geçti; iki bütün faz için IN_PROGRESS önerilir.** Gerçek dışfork/token/admin/cache negatifleri ile tam action/bundle/runner supplychain incelemesi bu çalışmada doğrulanmadı. Bu rapor aynı ajan sistemindeki worker incelemesidir; bağımsız profesyonel üçüncü taraf pentest veya standart sertifikası değildir.

## 1. Önceki kanıtın yeniden kullanımı

11Kasım `ci-trust-review-worker/source-manifest.json` ile aktif `.github/workflows/ci.yml` SHA `39d75d70f69e7c4600843b67baa0ccb322de8329dc13fa7d0ffe41cb60029ea5`, `build-release.mjs`, `prepare-webui.mjs`, frontendpackage ve iki smoke dosyası hashleri birebir eşit. Altı kaynak için reuse karşılaştırması `plan.json`/`source-manifest.json` içinde. Eski statik harita bu değişmeyen yollar için kullanılabilir; eski CI/başarısızDNS veya runtime/clean-start sonuçları yeni kaynakta tekrar çalışmış sayılmadı.

## 2. Aktif trust yolu / exact kod noktaları

Tek aktif workflow `ci.yml`:2–6 pushmain/pull_request/workflow_dispatch;7–8contents:read;9–12tekhostedubuntu-latest job/20dkcap. Jobpermission override/environment/reusableconsumer yok.14–25 dört full40hexSHAaction;checkout15–16persist-credentials:false ve repository/ref override yok. Push/stabletag/release tetikleyicisi yok; `pull_request_target`, `workflow_run`, download-artifact, privilegedpublish/deploy, registrylogin ve secret expression bulunmadı.

Normaltrustyolu: PRmergecheckout → PRkontrollü npm/test/build/package kodu26–38 → extractedLinuxsmoke39–52 → tested-builds upload53–60. PR kodu çalışması bu read-only hostedjob'ın amaçlanan işidir; kaynakta ayrıcalıklı promotionconsumer yok. Source'daki0`${{...}}` ve userinput'suz workflow_dispatch, doğrudanuntrustedexpression→shell yolunu bu dosyada ortadan kaldırır.41–52scriptinde work/app_pid/GITHUB_WORKSPACE quoted; kullanıcının PRbaşlığı/branchismi shellkaynağına sokulmuyor. Bunlar runner'da hiçbir scopedservicecredential bulunmadığı garantisi değildir.

`build-release.mjs:81–109`: committed/clean source guard, allowlistedtargets, `execFileSync`argv, shellmetni üretmeden npm/go invocation.129–142unsignedprovenance/checksum, exclusivearchiveoutput. `prepare-webui.mjs` sabit dist/embed yollarını kullanır. Paketversiyonu ve repokodu PR tarafından değiştirilebilir; bunlar aynıjob'da zaten çalıştırılan untrustedcode sınırındadır. İmzalıgüveniliryayın veya PRartifact'ının güvenli promotion'ı varsayılmaz.

[GitHub secure-use](https://docs.github.com/en/actions/reference/security/secure-use) minimumtoken/shellinput/pinnedaction yaklaşımını destekler. Bu referanslar workflow'u bağımsız sertifikalandırmaz.

## 3. Exact action kaynakları ve kalan sınır

| Action / pin | Upstream package sürümü | Runtime | Lisans |
|---|---|---|---|
|checkout / fbc6f399…|5.0.0|node24|MIT|
|setup-go /924ae3a1…|6.5.0|node24|MIT|
|setup-node /a0853c24…|5.0.0|node24|MIT|
|upload-artifact /ea165f8d…|4.6.2|node20|MIT|

Dörtimmutablepackage.json/action.yml resmiGitHub üzerinden okundu; exactURLler `upstream-pins.json` içinde. Workflowcomment'leri majorlabel'dır, exactpackageversion ayrıca kaydedildi. Dört resmirepo publicadvisory sayfasında yayınlanmışadvisory görünmedi; bu transitive/npm/bundleCVE taraması veya açıkyok garantisi değildir. FullSHA sourceidentity sağlar; compiledbundle'ın bağımsız reproducibility/imza/provenance veya tümbağımlılıklarının güvenliği bu kontrolle kanıtlanmaz. ubuntu-latest ve Node24major mutable kalır; Go1.26.11 explicitlyseçilidir.

Hedefliupstreamcache kaynakları da okundu: setup-go `src/cache-restore.ts`22–36 lockhash/OS/arch/Go sürümüne bağlı key ve cache.restore; `cache-utils.ts`30–54 cachepathkomutları. setup-node `src/cache-restore.ts`29–55 lockhash/OS/arch/npm key ve normalnpm exactkeyrestore; `cache-utils.ts`19–26 npm cache path'ini package manager'dan öğrenir. `cache-dependency-path` **cache edilecekcredential dosyayolu değildir**, keyhash'ine giren lockfile seçimidir. Testmutantı bunu keyinputboundary değişimi olarak yakalar; mevcuthelper evdizinlerini cachelemiyor diye tüm olası npmconfig/cache manipülasyonları güvenlidir denmez. Gerçek restore/savedcache içeriği servislogları veya runtimecanary ile incelenmedi.

[GitHub cache sınırları](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching) bazbranchcache'in PR'lardan okunabilirliğini ve PRmerge-ref yazma kapsamını açıklar. Cache'e sırkonmamalıdır. Actualservercachepolicy/poisoning/fork scope izolasyonu bu source incelemesinde test edilmedi.

Uploadpath yalnız üçdistpatterni, retention14gün; hidden/overwriteexplicit açılmamış ve pinnedactiondefaults false. `upload-artifact/src/upload/upload-artifact.ts`24–27searchve56–58overwrite dalları incelendi. `if-no-files-found` belirtilmediğinden upstreamdefaultwarn; actualCI116artifact'i ayrıca metadata ile mevcut doğrulandı. Gelecekdelivery için nofileerrorhardening düşünülebilir, bu çalışmada gösterilmiş escalation değildir. Ayrıcalıklıreleaseconsumer veya signingkey bulunmadı; repository/org/branch/environment ayarlarına erişim yapıldı iddia edilmez.

## 4. Yeni sonlu policy guard / küçük mutasyonlar

Yeni `scripts/release-ci-policy.test.mjs` mevcutYAML2.9.1'i frontendresolve ile kullanır; yeni bağımlılık yok. Gerçekci.yml parse edilerek mevcutread-onlylane kabulü;12küçük negatifmutant: privilegedPRtrigger, workflow_runconsumer, globalwritegrant, jobwriteoverride, checkoutcredentialpersist, mutabletag, alternatecheckout, expression→shell, secretenv, cachekeyinputboundary, unrestrictedhiddenartifact ve reusablejob.

13distinctfixture(1gerçek+12mutant),herbiri≤64KiB;2ana/12alt=**14PASS/0FAIL/0SKIP**. TekNodechild15sn/work60s; ölçülen0.127861sn supervisor /65.399625ms Node test süresi. Aucunworkflow/PRshell gerçekten çalıştırılmadı; negatifler GitHubserver'ın bunları reddettiği kanıtı değildir, bu repodaki güvenlikpolicyregresyon assertion'larıdır.

İlkwrapperTAP`#`summary varsaydığı için kendiFAIL kaydını üretti; Node24specformat'ında exit0/14namedPASS/0FAIL/0SKIP rawçıktısı vardı. İlk`execution.json`ve`initial-wrapper-execution.json`korundu;`result.json` offline14record doğrulamasını açıklar. Test yeniden çalıştırılmadı. Kaynakbefore/afterSHAeşit. `policy-test.tap` uzantısına rağmen actualreporterspec; raw değiştirilmedi.

**Yeni policytest henüz mevcutCI komutuyla otomatik çağrılmıyor:** workflow33 yalnızbuild-release.test.mjs çalıştırıyor. Root isterse ayrı anlamlı workflowdüzeltmesinde buguard'ı CI'a bağlayıp normalCI'ı doğrulamalı; buworker bunu yapmadı.

## 5. Normal remoteCI kanıtı (negatif güvenlik deneyi değildir)

Connector'dan read-only bağımsızfetch: CI116/run43597337382/job132454562302, PRhead57ad606e…;18stepcompleted/success,4exactactionref/test/build/cleanLinuxsmoke/upload/poststeps. RootHEADae7…'de test yenidençalışmış sayılmaz. ArtifactsAPI `tested-builds` ID14114409346/26242347byte/digest8d062db0…/expiredfalse/14günretention ve exactrun/head kaydı döndürdü. Artefakt indirilmedi/açılmadı; contents/digest doğrulaması veya finalpaket kabulü iddia edilmez. [CI116](https://github.com/yunusemre274/KubeView/actions/runs/43597337382).

## 6. Faz kararları / sonraki en küçük işler

- **TEST20.11 IN_PROGRESS:** aktifsource trustharitası/legacyreuse/normalCI/policy+12mutant tamam. Repository/orgforkapproval/token/defaultsettings/branchprotection/actualexternalcredential-freePR negatif deneyi gözlenmedi. Sırlistesi/değeri istenmedi; erişim yokkenPASS yazılmamalı.
- **TEST20.12 IN_PROGRESS:** exactpin/version/runtime/license/targetedcache+uploadsource/normalartifactmetadata ve syntheticboundarytests tamam. Tamactionbundle/transitiveSCA, mutablehostedrunnerprovenance, runtimecachepoisoning, gerçekpromotion/signature sınırları tamamlanmadı. Aktifpublishworkflow yokluğu signing/PROMOTIONkontrollerini tamamlandı yapmaz; finaldeliverysözleşmesi ayrıca gerekir.
- CI-TRUST-01informational unsignedcandidate/promotionrisk; bugün mevcutprivilegedconsumer/kanıtlanmışescalation yok. CI-TRUST-02admin/dynamickanıt boşluğu açık. CI-TRUST-03supplychainkanıtı targetedsource ile ilerledi, tamkapanmadı. Yeni doğrulanmışCritical/High exploit bulunmadı; yokluk kapsamla sınırlıdır.
- Rootikinciinceleme/ROADMAP birleştirmesi bekler. Runtime/permission/event/action/cachepath/consumer değişirse bu darpolicy kaynaklarını yeniden değerlendirmek gerekir. Doküman-only değişimde eskiuzuntestleri tekrar etmek gerekmez.

## Tekrar komutu

```sh
node --test --test-reporter=tap --test-concurrency=1 scripts/release-ci-policy.test.mjs
```

Frontendlockbağımlılıkları öncedenkurulu olmalı (`yaml` mevcut2.9.1); bu komut browser/build/CIworkflow tetiklemez. Officialsource/pin/dinamikmetadata kayıtları source policy testinden ayrıdır. NISTSSDF1.1/ASVS5 çerçeveleri buincelemede yolgöstericidir; bağımsızuyumluluksertifikası verilmez.
