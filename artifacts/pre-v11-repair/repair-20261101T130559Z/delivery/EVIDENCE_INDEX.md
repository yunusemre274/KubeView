# Küçük teslim kanıt seçkisi

6 Kasım 2026. v1.1 öncesi onarımın belgelenmiş kabul kapıları geçti; sürüm 0.4.0 korunur. Bu seçki 1 Kasım işlev kayıtlarıyla 6 Kasım sınırlı UI koşusunu ayırır. Ana yeni pil ölçümü 49/49 hücre ve 20 dakika/20 çevrimle geçti. Doğrudan materyal cleanup tanılaması da geçti; son Git teslimi ayrıca doğrulanır.

[Makinece okunur özet](evidence-summary.json) yalnız seçilmiş alanları içerir. [Seçim manifesti](curated-selection-manifest.json) kaynak SHA-256, boyut, ekran kökeni ve CSV korunumunu kaydeder. Ham JSON, günlük ve videolar üst dizinde kalır; başarısız denemeler değiştirilmedi.

İlk UI koşusu **7 PASSED / 1 FAILED**, sourceUnchanged=true olarak korunur. Altı yeni gerçek UI grubu create/dry-run, scale, Unschedulable, image-pull, quota-admission ve gönderilmemiş taslağın context değişimini kapsar. Bir PASSED grubu eski RBAC kanıtının source eşleşmesiyle yeniden kullanımıdır. Restart helper UID assertionı doğru korunan Terminating eski Podu da saymıştı. [Ayrı 17,52 sn restart-only recovery](../frontend-restart-recovery-20261106T102612Z-review.json) PASSED: iki eski Pod UID DELETE, yeni RS/iki yeni Ready Pod UID, aynı Node UID; ürün kaynağı değişmedi ve önceki yedi grup tekrar koşulmadı. İlk beş ve recovery iki cleanup kaydı observed404 içerir. [İlk ham kayıt](../frontend-final-failures-20261106T102147Z.json).

Panel tanılaması: 20 sentetik M aynı çalışma kümesi çevriminde başlık PNG readback üst sınırı p95 **55,71 ms**, visible/enabled sekme ve kapatma trial üst sınırı p95 **87,34 ms**. physicalPresentedLatencyMs=null; bütün kontrollerin fiziksel ekranda sunulma ölçümü veya 20 dakika karma kabulü değildir. [Tanılama kaydı](../panel-pixel-actionability-20261106T103034426Z.json).

| Ekran | Gösterdiği ve sınırı |
|---|---|
| [01-node-false.png](screens/01-node-false.png) | Ready=False API status injection: color flame/smoke and partial descent; naturalUnknown is separate |
| [02-single-container-water.png](screens/02-single-container-water.png) | One failed actual container at water ring; healthy box remains on deck; label still narrow |
| [03-new-worker-launch.png](screens/03-new-worker-launch.png) | Original videoPTS70.76s; actual new Node enters open water, two prior ships remain |
| [04-crane-envelope.png](screens/04-crane-envelope.png) | Actual gantry rope and load in manually framed envelope; canonicalReady is independent |
| [05-flow-detail.png](screens/05-flow-detail.png) | Actual cross-Node arrow opens measuredTCP panel; upper portion only; status caption clips at high density |
| [06-provider-stale.png](screens/06-provider-stale.png) | Explicit stale/no-live-claim caption;15 historical flows inside10s window; noNodefault |
| [07-process-concept.png](screens/07-process-concept.png) | Explicit representative process caption and actors; actual owner/operation observations, no internalRPCmeasurement |
| [08-restart-open.png](screens/08-restart-open.png) | OriginalFAILED restart helper assertion retained; later separate recovery passed; Ready screenshot alone is notUIDproof |
| [09-admission-rejected.png](screens/09-admission-rejected.png) | Normal form shows actualquota admission refusal after prior successfulpreview |
| [10-restart-recovered.png](screens/10-restart-recovered.png) | Separate restart-only PASSED: observedoperation row; raw record proves oldUID DELETE/newRS/newReadyPodUID and sameNodeUID |

Gerçek son metrics API kaydı **3 Node / 3 Pod** örneğidir; gerçek sıfır CPU örnekleri korunur. Bu tüm dolu Pod grafiklerinin normal UI E2E kabulü değildir. [Ham metrik](../final-actual-metrics.json). Gerçek Hubble kaybı stale→15/0 flow expiry→yeni veriyle live olarak kaydedildi; Node fault0. DNS/UDP uç UIDleri null/unverified-time-interval kalır. [Ham provider kaydı](../traffic-provider-recovery-real.json).

[Video kesit ve inceleme kaydı](video-clip-plan.json) kodlandı; yedi kaydın zamanlı kareleri açılıp incelendi. Güncel toplam 72,16 saniye; aşağıdaki 53,5 saniyelik ilk plan tarihsel seçimdir. Container kesiti 13–20 saniyeye düzeltildi; erken kesit reddedilmiş seçim olarak yerelde tutulur. Tam Node False videosu ayrıca eklendi. Altı kesit toplam **53,5 saniye**; kaynak videonun gerçek PTS aralıklarını ve önceden açılmış inceleme karelerini kullanır. Metadata ffprobe ile startPTS0, 25/1 kodlama ve süre olarak kontrol edildi. Kodlama FPS değeri uygulamanın render/presented FPS ölçümü değildir. UTC eşlemesi yaklaşık kalır. Node alevi için açılmış PNG seçildi; incelenmemiş video PTS uydurulmadı.

| Planlanan kesit | Kaynak PTS (sn) | Açılmış inceleme kareleri (sn) |
|---|---|
| new-worker | 67.76–76.76 | 68.76, 70.76, 74.76 |
| crane | 7.6–11.6 | 8, 8.8, 9.6, 10.3, 11 |
| container-fall | 11–14.5 | 11.5, 12.3, 13.1, 14 |
| traffic-start-increase | 8–20 | 9, 19 |
| traffic-stopped | 32–35 | 33 |
| provider-loss-recovery | 7–29 | 8, 17, 28 |

Node False doğal fiziksel arıza deneyi değildir; worker stop→Unknown ayrı kayıttır. Yerel minikube provisioning genel bulut sağlayıcısı değildir. Temsili merkez süreci iç RPC ölçümü değildir. Generic YAML özel 3D temsil değildir. Secret değeri, TLS malzemesi veya kubeconfig seçkiye alınmadı. [Güncel audit](../../../../docs/VISUAL_FEATURE_AUDIT.md), [açık işler](../../../../docs/VISUAL_FEATURE_GAPS.md).

## İncelenmiş kısa kayıtlar

- [new-worker](clips/new-worker.webm) — Actual newly provisioned Node enters from slipway; existing two vessels continue. Prior ~30s safe-gap wait remains in source record.
- [crane](clips/crane.webm) — Actual gantry lift/carry/lower load, manually framed normal zoom.
- [container-fall](clips/container-fall-reviewed.webm) — 13–20s source PTS now covers warning, departure and water marker; warning labels still partly occlude mid-flight. P2 limitation; clean close water marker PNG is separate. Initial 11–14.5s cut rejected, preserved.
- [traffic-start-increase](clips/traffic-start-increase.webm) — Actual same/cross-Node observation arrows and higher flow grouping; caption edge clips at high density (P2).
- [traffic-stopped](clips/traffic-stopped.webm) — Known flow window expired to zero while fleet continues.
- [provider-loss-recovery](clips/provider-loss-recovery.webm) — Actual stale/no-live caption and zero after expiry, then new observations after mTLS forward recovery.
- [node-false-status-injection-full](clips/node-false-status-injection-full.webm) — Healthy→False fire/smoke/partial sink→sameUID recovery; real API status injection, not natural physical worker failure.

Ana pil ölçümü 49/49 hücreyle geçmiştir; [kesin karşılaştırma](../../../../benchmarks/results/repair-final-battery-20261106/comparison.json).20 dakikada20panel çevrimi,24/24log kapanışı,3reconnect/329resync ve tam final içerik eşitliği doğrulandı. Doğrudan materyal envanteri ayrı tanılamadır; bu video incelemesi onun yerine geçmez.

Son materyal tanılaması:40checkpoint/20çevrim,24/24log kapanışı; materyaller40–44,texture3,programcache21–22; scoped sınırlar [inceleme kaydında](../../resume-20261106T1015Z/material-cleanup-review.json). v1.1 etiketi/release'i oluşturulmadı.
