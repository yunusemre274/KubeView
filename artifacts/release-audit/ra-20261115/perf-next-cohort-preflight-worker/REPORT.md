# Sonraki performans kohortu — salt okunur ön hazırlık

15Kasım2026, rootHEAD `e48604e2dfbbba3711a1aa64122b22b31d7c4e40`; runtime15770296. **NOT_READY_TO_MEASURE — yeni build, kontrollü hover sorusu ve root önkontrolü gerekir.** Bu job ölçüm/derleme/test/browser/cluster/agent başlatmadı; ürün/bench/Git/ROADMAP değiştirmedi.21seçilmişsource hashpass485083byte; yeni okumalar328.44sn'de sonlandırıldı. Kimlikler `identities.json`, sonlu koşullu plan `next-plan.json`, gerçek sourceCLI listesi/çalıştırılmamışkomutlar `commands.json` içindedir.

## 1. Yeniden kullanılabilir eski kimlikler / gerekli yeni build

| Bileşen | Gerçek kayıt |
|---|---|
|EskiA|36d5b8f90c8afdec437bdb6e5516541b5bb859bd; tagcat16-36d-20261112T113255Z; frontendaggregate25c0877480526832445bc61d4b6355cdb89024c0f45556772c2a8109e3ede293; indexf682f5740ba518542ed6d84e3008b57a4a592e162b093276b4b3354e12e634a5|
|EskiB|f32d6b2345c0e9fcf350b83ec9a5e9d3fc651e12; tagcat16-f32-20261112T113255Z; aggregate2ebbbd715eb1e449736cf2e4b88489782136a19bbc25a99cf58701c9a234fe4a; index0e478e0c9241d599e651eedcb65b10b31f37e0be1a89e380434a239a817032a3|
|Eski commonbackend|cat16-common-f32-20261112T113255Z; recorded9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8; backend.test65238562byte|
|Ortaklock|ecbd67c765f1e244df703e5e1f13c95fa32bd94abf4e9e278bec4b15f34f5d90; tarihîinstalledgraph6f1b0d74…a0a71|
|Mfixture|kubeview-benchmark-v2/seed20261024; recordedJSONb5cf1d2934a9a1926c5ccad1a7181ce73057c4066e13b35895cef96f43af751b; replaya9fde6d8…e6353b|

İki frozenprovenanceJSON hash'i ve dosya-map aggregate'i **şimdi** doğrulandı. AltıassetSHA/side ve backendSHA eski frozenmanifest'ten alındı;65MBbinary veya bütünassetler sırf önhazırlık için yeniden hashlenmedi. Actualjoböncesi root/runner bunları yeniden doğrulamalı; bugün bütünassetbyteları karşılaştırılmış sayılmaz. Boundedlog36dA kullanılabilir; önceki unbounded6GiB/30snlonglog sürümü kesin yasak.

f32→157 runtimefarkı gitpath karşılaştırması: frontend yalnız `src/data/resourceStore.js` (forbidden/unavailableSTATUSfix); backend `stream.go` ve yeni `watch_authorization.go`. **EskiB frozenbuild'i finalcurrentB diye yenidenetiketlemek yanlış.** Yeniunusedtag ile currentfrontend yenidenfreeze/build gerekir. Lock değişmedi; kurulu dependencygraph güncel olarak tümü tekrar doğrulanmadı. `benchmark_test.go` currentSHA0ed76ead…a76e eskifixturekaynağıyla aynı; gateway/watch yolu yine değiştiğinden currentbackendmaliyetini dahil etmek için yeni currentcommon `backend.test` gerekir.

MinimalfrontendA/B yolu: frozenA36d + yeniB157, **ikisine aynı yeni currentgateway binarysi**. Eski frozenA/B backend symlink'leri değiştirilmez; run.mjs `--backend-tag NEW_COMMON` bunu destekler. Bu lane frontend/browsertoplamını commoncurrentgateway altında kıyaslar. AyrıA-backend vsB-backend maliyet farkını ölçmez; comparePanels zaten backendBinarySHAeşitliği ister. Bununla fullruntime/V11-18/backend/providerkapıları kendiliğinden kapanmaz. ProductionCLI binarysi backend.test yerine kullanılamaz.

## 2. Mevcut harness gerçekte ne yapıyor?

- `run.mjs` sourceoption listesi vardır; **güvenli `--help` dispatch'i yoktur**. Guessedhelp komutu çalıştırılmadı; bilinmeyenflag bazıyollarda gözardı edilebilir. panel-build'ınusage metni de gerçekhelpmode değildir.
- `--panel-matrix`, `--panel-target node`, `--scenarios panel-closed,panel-open,panel-closed-events,panel-open-events`, repeat-offset vevisual/inputlock vardır. panelprotocol5: aynıNode0/worker-001/Özet; closed koşulda panelkapalı fakat seçimkalır. `pick` actualprojectTargets→normalmouseclick→titlewait; sahnearray'ine seçim enjeksiyonu değildir.
- Herpanelcell freshfixture/browserpath; normalpreferencesreload; nodepick/normalclose; **zaten** mouse8,8; warmup30; prepareCamera(false) controlsinputdisable+canvaspointerEventsnone; visualreset+ikiRAF; ölçümbaşlangıcı. resetVisual fleet/clock/water'ı ve kararlıslots'u sıfırlar, **Reacthover veya R3Fhovermap temizleme garantisi vermez**.
- Inputguardtrustedkeydown/up/pointerdown/up/click/wheel/touch'u yakalar; pointermove/out buisimlistesinde yoktur. Mouse8,8 hareketinin dahaöncegerçekhover edinilmemişken başarılı olması stalehover hipotezini çürütmez. Fakat aynı nötrmouseA/B tanısını yeniden yapmak yeni soru değildir.
- Kamera38override, sabitposition/quaternion/target/zoom; medium/shadows/sea/patrol/DPR1/1440×900framebuffer; canonical20Node300Pod/detailed8ship120Pod envanteri ve fleetbaşlangıçpose'ları karşılaştırılır. Finalürününvarsayılan24FOV görünümünün performansı bu38referanslane ile aynı iddia edilmez.
- CPU `processCoverage` PID+birth/cohort+clockwindow ve actualprocessCPUdelta kullanır. Browsermain/renderer/GPUprocessCPU/backend ayrı; GPUprocessCPU gerçekGPUutilization değildir. Gözlenmeden doğupbiten/örneklerarasındaorphanprocess körnoktası kayıtlıdır.
- Güncel `panel-compare.mjs` **submitted-work guard** before/aftercalls/triangles/lines/points, summarycalls/triangles dağılımı veallocationobs yapar. Eşitcounteryalnızcountereşitliğidir; eşitpixel/uniform/perinstancekanıtı değildir. Diferans açıksemantic/visualreview ister; gerçekbatching kazancı diye kanıtlanırsa otomatikreddinötesi rootkararı mümkündür.
- **Dikkat:** eski `panel-accept.mjs` ayrıaggregate yolu doğrudan buyeni submittedguard'ı çağırmıyor. Sonuçkabulü yalnız bueskiagregatöre bırakılamaz: güncelcomparePanels + exactgrid/canonical/process validator + rootsemanticreview gerekir.

## 3. BENCH-RENDER-001 için gerçekten yeni, sonlu soru

Eski40window10job/5pair,3pairedcell farkı yüzünden causalCPUacceptedfalse; rawveri korunur. Önceki98snAsonraBdiagnostic normalnötrmouse altında4maincamera snapshotında eşitobjectinventory buldu; olayı yenidenüretmedi. Tekframe/maincamera callback'leri shadowpass'i kapsamaz; sonradan hash/transformserialization atomicframepose değildir. R3Fhovermap'in boş olması geçmişReacthoverstate'in hiçkalememiş olduğunu kanıtlamaz.

Source'ta CargoLayer seçili/hoveredkutuda wireframebox, CargoShip selected/hovered durumda HULL_EDGES LineSegments çizer. **Bu bulgu+12line'ınhangisinden geldiğini kanıtlamaz.** Boxwireframe veEdgesGeometry farklılineadetleri üretebilir; raweskiobjectUUIDyok. “12line=cargohover” veya “noise” sonucu kurulamaz.

Yeni kontrollüsoru: **Node0 seçiliyken gerçekPod'a kasıtlı pointerhover edinildikten sonra guard/CSSpointerEventsnone/reset sırası, normalpointerleave'inönceyapıldığı kontrolün aksine retainedhoverobject bırakıyor mu?** Önceki tanıhover'ı kasıtlıkurmadığından bu ayrısorudur.

Önerileniki **currentB-only** kısa diagnosticjob; mevcutözelcapturehelper'ınnarrowuyarlaması root'ta, desteklenmeyenhoverCLIflag yok. Kontrol: normalNode0click→visibleexactPod/container'a normalmousehover→normalpointerleave→guard/reset. Treatment: aynıhover→guard/CSSdisable→neutralmouse/reset. Herikisi5snwarmup+10sngözlem/90snjobcap/global210sn/0retry. Actualtargetekranüstünde canvas'a hitolmalı; seçiliNodepaneli/UIDkaybolmamalı. Before/hover/guard-reset/cleanupframe'lerinde actualsubmittedobject+geometry/index/material+nearestUID+camera vehoverprop/map kaydedilmeli. Sağlamvisibleexacttarget bulunmazsa **BLOCKED**; başkaUID/propzorlama/meshdelete ile sonuçüretilmez.

İkihoverpathaynıtemizsonuca gelirse buhipotez reddedilir/inconclusive yazılır; üçüncü otomatikdeneme veya aynıeskiA/Btur yok. Pozitifse exactobjenin draw/lineadetivekaynağı gösterilir, dar düzeltme+regresyon gerekir. Diagnosticsource/inputgeçmişifarkı CPUkazanımı gibi sunulmaz. Kimlik/mechanism belirsizkalırsa tarihselBENCHaçık; root yenikohortun eşdeğerliksözleşmesini açıkincelemeden genişmatris başlamamalı.

## 4. Koşullu minimum yeni matris / süre

Diagnostic/build/equivalence/livepower kapıları **henüz geçmedi**. Geçerse yeniACkohortu:5pairedblock,AB/BA/AB/BA/AB; herbuilddeaynı4koşul; oddrepeat-offsetorder'ı **yalnızrun.mjs** birkez tersçevirir.10job×4window×(30warm+60measure)=**3600sn saf ölçüm/ısınma**, setup/cleanupayrı; önerilenfiniteoutercap4800sn,jobcap8dk,0autoretry. Başarısızilkjob family'yi durdurur; bütünraw/yarımpair korunur. CPUdeğerinegöre örnekseçilmez. Fazlarrestartettiğinden bu CAT18kesintisiz60dksoak değildir.

Herwindow0ya da5event/sn;0/s plan/applied/received0+missingdelaynull;5/s300/300/300,fullnestedclient/upstream/planned eşitlik. AynıselectedUID/tab/quality/camera/fleet/water/patrol/framebuffer korunur. NoFPS/DPR/kapsam/güncellikazaltma; noheavyprofile/video/scan/build/bootstrapaynıanda. M≥55JSdraw/s,p95≤20ms,p99≤33.3ms; normaldata/interactionbudget'ler ayrı. Δpanel=open−closed her0/5rate için withinbuild, sonrabileşmişΔB−ΔA; medyan,min–max,n/pairedfarklar. NegatifΔpanelmümkündür,pozitifezorlanmaz. Tarihsel0.413evrenselhedef değildir.

Root'unbildirdiğiAC22+ başlangıç, buworker'ınlivepowerölçümü değildir; lowpower/thermal/sleep/foreground/isolation ve kesintide stop/cleanupreserve kapısını root ayrıca kaydetmeli. EskiBattery-onlycontroller50/40/35policy'si AC22için körlemesineçalıştırılamaz veya sessizgevşetilemez. YeniACkaynağı/ayarları baştanplanlanmalı, sourcechange pair'i invalidyapmalı. Eski53→43batteryverisi yeniACile pool edilmez; anlıkenerji/pilkazancı iddia edilmez.

## 5. Gerçek komutlar / şu anki engel

`commands.json` gerçeksource'tan doğrulanan **çalıştırılmamış** argvları içerir:

```sh
node benchmarks/panel-build.mjs NEW_CURRENT_B_TAG --source /Users/yunusemre/Desktop/KubeView/frontend
# Yeni private output dizini hazırlandıktan sonra backend/ çalışma dizininde:
GOMAXPROCS=2 GOMEMLIMIT=2GiB /Users/yunusemre/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.26.11.darwin-arm64/bin/go test -c -p 1 -o ABS_NEW_COMMON/backend.test ./pkg/server
```

Yeniunusedtag/path ve sourcehashler önkoşuldur; historicaltag/artefakt ezilmez. Tekjobtemplatede gerçek `--backend-tag`, `--reuse-build`, `--reuse-binary`, dörtkoşul, `--camera-fov38`, `--harbors1`, `--lock-input`, `--lock-visual-start`, `--min-fps55`, `--max-minutes8` vardır. `repair-session`/counterbalance49cell/eskitagbackend varsayımlarını taşır; bu40windowdarplanı başlatacakdoğrukomut değildir. Mevcutboundedrun.py controllerı yenioutput'a kopyalanıp yalnızAC/currentB/currentcommonidentity/updatedvalidator noktaları uyarlanmalı; yepyenibenchmarksistemi gerekmez.

**Bugünkü çıktı önhazırlıktır:** currentBfrozenbuild/currentcommonbinary, controlledhoveridentity sorusu veactualrootpreflight eksik. Eskiölçümler tekrarlanmadı; hiçbir yeniCPU/RAM/GPU/ağ/FPS/latencysonucu üretilmedi. NativeSafari/Retina/fizikselsunum,fullruntime/provider ve bellekmechanism/uzunkararlılık ayrıaçıkkapılardır. Aynıajansistemindekiworkerplanı profesyonelüçüncütarafincelemesi veya yayınkabulü değildir.
