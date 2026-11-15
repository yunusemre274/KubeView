# 12 Kasım2026 — eşleşmiş açık Node paneli /5event ailesi

**Dar ölçüm ailesi doğrulandı; NOT_RELEASE_READY. CPU optimizasyon kazancı kanıtlanmadı.**

A frozenfrontend36d5b8f (indexf682f574…), Bf32d6b23 (index0e478e0c…), commonGo benchmark backend9d35acc9. Invocation/harness commit3278451b ayrı kimliktir. Bu frontend-browser/common-backend karşılaştırmasıdır; farklı backend runtime sürümlerinin tümuygulamaA/Bsi değildir. Provider/gerçekKubernetes CPU’su ölçülmedi; fakeupstream/producer/tracker aynıGo sürecindedir.

MacBookAirM5/10core/32GiB/macOS27.0.1; Chromium156.0.8078.4/ANGLEMetal,1440x900CSS/rendererDPR1/medium/shadow/deniz/seyiraçık. NativeCG60Hz ve2940x1912pixel/1470x956logical doğrulandı; DPR1emülasyon nativeRetina performansı değildir. Battery62→59/lowpower0; sabitkaynak, değişen frekans/çekirdek yerleşimi ölçülmedi. Enerji verisi yok.

Kontrollü tarihsel M38kamera: production24default değişmedi; kaynaklararası aynıpose/FOV38/target/zoom/fleet/quality. Önceki24dar smoke buCPU setine katılmadı. Canonical20Node/300Pod; başlangıçdetailed8Node/120Pod/projectednode0–7;426call/71170tri/60line,32geometry/4texture. Selectednode0(worker-001)/Özet ve paneliçeriği aynı. ReferansikiPNG önceki nativevalidationda root tarafından açıldı; buanaCPU ailesinde screenshot/video/profiler kapalıydı. Görünür kaynağı gizleyerek/DPR/FPS/kadrajı taraflar arasında değiştirerek kazanç üretilmedi.

5sabitpair/10window; sıraAB,BA,AB,BA,AB. Herwindow30swarm+60s; teşhis resetVisual/hold hazırlıkta, start ile gerçekseyir/sudevamediyor. Herwindow300plan/apply/received (15ADD+15DELETE+270UPDATE), toplam3000. Backendwatch→WS→store tamnested-objectsignature eşitliği canlıtestte karşılaştırıldı ve bütünverdiktlertrue. Finalobjelerin kendisi artefakta ayrıdump edilmedi; ikinciinceleme codepath+canlıverdikt/ham event kayıtlarını doğruladı, bağımsız yeniAPI okuması yapmadı.

OScohort14snapshot/window (yaklaşık5s aralık+boundaries), psPID/PPID/birth/comm/role; gözlenenbrowsermain/renderer/GPU/other ve backend. Hiçgörülmeden iki örnek arasında doğupbitenchild veya aynı1sdoğumluPIDreuse dışlanamaz; kernel-completeCPUtrace değildir. SafetyRSS/ownedprocessmonitoru yaklaşık1s, normalCPUobserver hesabınındışında.940.337sn/1800sn;125capturedprocessrefabsent/5192free; ownedlabstopped, diğerworkerlaridle, build/scan/provider/başkabenchmark eşzamanlıyok.

## Sonuçlar

| Ölçüm | Birim | A medyan [min,max], n=5 | B medyan [min,max], n=5 | Eşleşmiş B−A medyan [min,max] |
|---|---|---|---|---|
| Browser toplam gözlenen CPU | çekirdek | 0.686613 [0.655277, 0.707368] | 0.682294 [0.625851, 0.707012] | -0.000485 [-0.062801, 0.020399] |
| Renderer süreç CPU | çekirdek | 0.434595 [0.414472, 0.445054] | 0.431626 [0.391427, 0.447697] | -0.001758 [-0.044360, 0.015422] |
| GPU süreç CPU | çekirdek | 0.246885 [0.236651, 0.257829] | 0.244377 [0.230437, 0.254996] | 0.000277 [-0.016448, 0.007463] |
| Browser ana süreç CPU | çekirdek | 0.003323 [0.002991, 0.004984] | 0.003157 [0.002991, 0.003988] | -0.000000 [-0.001994, 0.000996] |
| Backend + fake producer/tracker CPU | çekirdek | 0.003158 [0.003157, 0.003489] | 0.003323 [0.002991, 0.003489] | -0.000000 [-0.000332, 0.000166] |
| Ölçüm sonunda en büyük tek browser PID RSS | MiB | 387.156250 [375.984375, 398.015625] | 396.859375 [383.734375, 407.546875] | 9.390625 [4.531250, 22.062500] |
| Backend PID RSS | MiB | 49.187500 [48.562500, 50.421875] | 49.000000 [48.359375, 49.453125] | -0.203125 [-1.656250, 0.250000] |
| Sayfa JS heap used snapshot | MiB | 41.339736 [29.315583, 48.960456] | 43.267190 [23.839598, 46.208479] | -1.916353 [-23.427700, 14.210600] |
| JS draw/submit hızı | /sn | 60.019812 [60.016053, 60.025649] | 60.021211 [60.002864, 60.027908] | 0.002258 [-0.016949, 0.007557] |
| Koşu frame p95 medyanı | ms | 18.600000 [17.800000, 19.400000] | 18.700000 [17.700000, 19.000000] | -0.000000 [-1.700000, 0.500000] |
| Koşu frame p99 medyanı | ms | 19.000000 [18.700000, 20.800000] | 19.000000 [18.500000, 21.100000] | 0.000000 [-2.200000, 2.100000] |
| Koşu callback→store p95 medyanı | ms | 0.800000 [0.700000, 0.900000] | 0.900000 [0.700000, 0.900000] | 0.100000 [-0.100000, 0.100000] |
| Görünür callback→draw proxy p95 medyanı | ms | 19.800000 [14.100000, 22.400000] | 18.000000 [14.800000, 20.500000] | -0.900000 [-7.400000, 3.900000] |

Yüzde ve fark tanımı: toplamCPU medyanları0.686613→0.682294; medyanların farkı−0.004319 iken **eşleşmiş farkların medyanı−0.000485çekirdek** ve eşleşmişyüzdemedyanı−0.073972%. Bunlar farklı istatistiklerdir. BeşCPU yüzde farkı−9.119,+2.745,+2.971,−0.074,−2.765; dağılımlar örtüşür. Bu veride tekrarlanabilirCPU kazancı veya öncedenbelirlenen+5%medyan pratikregresyon eşiğini aşanCPUgerilemesi yok. Fazla tekrar yapılmadı; bütün5pair saklandı.

RSS beşpairde deB daha büyük: +4.531…+22.063MiB, pairedmedyan+9.391MiB (%2.395). BütünlargestPIDlerRenderer. Bu **zamanserisipeak veya toplamfizikselRAM değildir**. JSused/totalheap farklarının işaretleri karışık; bellek nedeni henüz açıklanmış değil. Yalnıznoise,leak veya boundedcache diye kapatılmadı. SonluGC/retained/native-memory tanılaması ve uzun aynı-working-settrend kontrolü açık; bu sonuç leak-free kanıtı değildir.

Mbudgetbütün10windowdaPASS: draw≥55/sn,p95≤20ms,p99≤33.3ms. Callback→store p95medyan0.8→0.9ms; iki dağılım0.7–0.9ms, pairedmedyan+0.1ms. Geniş bütçe altında diye otomatikiyileşme iddiası yok; bu veri belirgintekrarlanabilir yavaşlamayı ayırmıyor. Drawproxy yalnız görünürUID altkümesinde; fiziksel sunum/temelpanelusable/ilkfeedback ölçümü değildir. V11-16 açık.

**Δpanel N/A:** bu aile yalnız panel-açık/5eventtir. Açık−kapalı/0ve5event nedenselpanel maliyeti için kendi içinde dengelenmiş4koşul blokları gerekir; sonradanayrıkoşul ekleyip eşleşmişΔdiye sunulmaz.1/5/10/20liman,M/L,log,traffic,burst,60dk,finalpaket veV11-18genelkapıları kapanmadı. İlk n1 koşular ayrı ayrısmoke etiketli; buözet yalnız beşbağımsıztam30/60çifti toplar.

## Kanıt ve tekrar

- execution.json/preflight/postflight: exactargv, güçonsamples, wall/cleanup; p0…p4 A/B summary/process/validation dosyaları.
- RAW_INDEX.json ve raw/*.gz:10rawJSON(5,090,511B→306,253Bgzip), decompressedSHA ve manifestler. Bunlar açık sentetikfixture; gerçekcredential/Secret/log yok. Tarihsel dosyalar ezilmedi.
- paired-summary.json/summarize.mjs: offlinehesaplar ve13ölçüm. İlkabsentbuildProvenance.commit kaynaknull kusuru paired-summary-initial-missing-source.json/summarize-initial-source.mjs.txt ile korundu; source-attribution-retest.json frozenA/B+invocationayrımını düzeltirken bütünsayısalölçümlerin aynı kaldığını doğrular. Yeniölçüm yok.
- ../perf-open-events-second-review-worker/REPORT.md: farklıworker58inputhash, hamframe/message,14snapshotcohort, kaynak/kalite, gzip ve imzalımatematik kontrolü. Aynıajan sistemi incelemesidir, profesyonel bağımsızlaboratuvar değildir.

Mevcutone-shot run.py eski execution.jsonı ezmeyi reddeder. Yeniartifactsrun-id dizininde aynıplan/run.py/validate-window.mjs kullanılır; frozenbuildtagları değişecekse yeniimmutabletag/sourceprovenance vebackendhash doğrulanır. Tekwindow örneği (beşpairyerinegeçmez):

```sh
node benchmarks/run.mjs --phase baseline --build-tag cat16-36d-20261112T113255Z --backend-tag cat16-common-f32-20261112T113255Z --reuse-build --reuse-binary --profiles M --scenarios panel-open-events --panel-matrix --repeats 1 --repeat-offset 0 --warmup 30 --seconds 60 --camera-fov 38 --dpr 1 --harbors 1 --lock-input --lock-visual-start --disable-browser-energy-saver --max-minutes 3 --id YENI_A_P0
```

reuse bayrakları korunmuşfrozenartefaktı seçer; repeat-offset eşleşme kimliği, harbors1 kontrollütekayrıntılıliman, camera-fov38 tarihselMprojeksiyon, lock-input ölçümdeyerelgirdikoruması, lock-visual-start aynıbaşlangıçpose'u, max-minutes sonlurun süresidir. KUBECONFIG gerçekokunmaz; gerçekKubernetes testinin yerine geçmez.
