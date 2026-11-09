# v1.1.0 adayı — kaynak ve kanıt dizini

9 Kasım2026. Bu dizin stable release ilanı değildir. Test edilen runtime `32a0468ad51516a1bb38aab68760e73984c45ddf`; başlangıç `2b76e215fdbe201be1611ccea4c40dcd547b2ba7`. Son durum [kabul raporunda](../../../docs/V11_ACCEPTANCE_REPORT.md), platform ve dağıtım [release notlarında](../../../docs/RELEASE_NOTES_v1.1.0.md).

## Gerçek UI ve API

| Kanıt | Gösterdiği / sınırı |
|---|---|
| [Gerçek workload, eylemler sonrası](qa/runs/2026-11-09T08-30-01-963Z-chromium-f6afdbe9/01-ready-workload-after-actions.png), [ham sonuç](qa/runs/2026-11-09T08-30-01-963Z-chromium-f6afdbe9/result.json) | Normal UI dry-run404, create/owner/Ready,2→3→1, dört kaynak alanı, restart/yeniRS, Podreplacement ve Deploymentdelete404. Tek PNG bütün zincirin yerine geçmez. |
| [A kendi UID/log](qa/runs/2026-11-09T08-20-00-750Z-chromium-6bfe683c/01-a-own-uid-log.png), [B farklı UID/log](qa/runs/2026-11-09T08-20-00-750Z-chromium-6bfe683c/02-b-own-uid-log.png) | İki ayrı kube-systemUID, aynı namespace/ad; kaynaklar ve loglar gerçek API ile eşleştirildi. |
| [G00 offline eski seçim](qa/runs/2026-11-09T08-22-05-119Z-chromium-2cfbe23f/04-offline-replacement-retains-old-stale-selection.png), [yeni UID açık seçim](qa/runs/2026-11-09T08-22-05-119Z-chromium-2cfbe23f/06-new-uid-explicitly-selected.png) | AynıUIDreconnect/offlineDELETE/replacement ayrımı. Backend ayrı gerçek alt şartlar [CR metadata](backend/live-cr-scope-metadata.json). |
| [Salt okunur form](qa/runs/2026-11-09T08-28-13-727Z-chromium-ab74e076/02-actual-readonly-normal-create-form-disabled.png), [gerçek RBAC reddi](qa/runs/2026-11-09T08-32-38-782Z-chromium-253c965c/01-actual-rbac-preview-forbidden-normal-form.png) | UI ve doğrudan API güvenliği farklı testlerdir. [Production auth/Origin/WS5/5](backend/prod-security-result.json). |
| [STS/DS ve sentetik Secret incelemesi](frontend/forms-resume/REVIEW.md) | Gerçek RollingUpdate/template/çok-container metadata korunumu, unsupportedRS/Job/CronJob ve ayrı amaçlı Secret reveal/edit. Secret değeri/maske kayda alınmadı. İlk DS helper FAIL saklı. |
| [Gerçek log rollerinin incelemesi](frontend/logs-resume/REVIEW.md) | App/init/ephemeral/current/previous, pause gerçekHTTPabort, resume ve bütün logların kapanışı7işlevselPASS. Rawrunner WS-close wrapper gözlemindeFAIL; bağımsız kerneltransport0 ayrı delil. |
| [Job/DS yeni32kaynak UI](frontend/status-resume/REVIEW.md) | Askıdaki Job doğru durum, gerçek güncel Ready DS. Eski/bilinmeyen DS riski unit ile test edildi; gerçek runtime hatası diye sunulmaz. |
| [WebKit dolu Node](qa/runs/2026-11-09T08-10-37-722Z-webkit-d3caf439/01-node-filled-real-metrics.png), [Pod](qa/runs/2026-11-09T08-10-37-722Z-webkit-d3caf439/02-pod-filled-real-metrics.png) | Gerçek Metrics API miktar/zaman/birimleriyle grafik noktaları eşleşir. APIyok/Forbidden ayrıca test edildi; sahte sıfır yok. |

Bu normal UI checkpoint'lerinin çoğu `0f5a5ab/b741` binary'sine aittir. Son32kaynak farkı yalnız Job/DS status helper'ı ve semantiksiz satır sarmadır; [incelenmiş uygulanabilirlik](source-applicability-32a0468.json) test tarihlerini değiştirmez.

## Gerçek animasyon, kaynak ve ölçüm ayrımı

- [Yeni tek-container video](frontend/visual-resume/video/page@4e2e027cdc084ceb07131876e4cb4426.webm), [erken](frontend/visual-resume/container-fall-early.png), [orta](frontend/visual-resume/container-fall-middle.png), [geç](frontend/visual-resume/container-fall-late.png), [API/zaman/UID kaydı](frontend/visual-resume/result.json). Gerçek controlledexit42, aynıPodUID, sağlıklı ikinci container yerinde. Gerçek OOM/Evicted değildir.
- [Gerçek Hubble okunun mouse seçimi](frontend/visual-resume/flow-normal-mouse-selection.png), [768pxtrafikbaşlığı](frontend/visual-resume/traffic-title-768.png), [incelenmiş video/kareler](frontend/visual-resume/REVIEW.md). Gerçek farklı same/crossNodePod TCP; flowevent paket/byte değildir. [Ayrı mTLS/RBAC/retry/expiry7altAPI](backend/live-hubble-scope-corrected2-metadata.json).
- [Tarihsel worker/Nodefault/vinç7kısa kayıt](../../pre-v11-repair/repair-20261101T130559Z/delivery/EVIDENCE_INDEX.md), [eşit çekirdek/captionfarkı](harbor-source-applicability.json), [providerçekirdek karşılaştırması](backend/provider-compatibility.json). Bu oturumda yeniworker0 ve yeni gerçekworkerstop0; tarihsel kaynakla nitelikli reuse açıkça işaretlidir. Yeni minikube güvenlik/kapasite [6altgerçekAPI](backend/live-minikube-gate-metadata.json), yeniprovisioning başarısı değildir.
- [Beş yeni gerçek-hook epoch unit](frontend/provider-epoch-evidence.json): geç nonempty yanıt, scope/streamgen, pinnedleaseDELETE ve cleanup.165/165tamseri; sentetik unit gerçek Hubble E2E yerine geçmez.

## Son normal UI odak/caption eki

[İnceleme](frontend/final-focus-caption/REVIEW.md), [gerçekexecPASS](frontend/final-focus-caption/exec-runs/2026-11-09T10-45-36-202Z/result.json), [terminalPNG](frontend/final-focus-caption/exec-runs/2026-11-09T10-45-36-202Z/non-tty-exec-input-arrows.png). Formtext/numeric/YAML ve terminalde kamera/target sabit; canvaspositive gerçekhareket.768/1280fall kareleri açıldı.1280late subpixelAABB köşekesişimFAIL korunur; görsel okunurluk kusuru gözlenmedi, bağımsız1280postAPIassert NOTRUN. FizikselUIlatencyhalenölçülmedi.

## Dağıtım, performans, kalan kapı

[Frozen32kaynak](candidate-frozen-32a0468.json), [macOStestbinary](macos-final-proof.json), [LinuxAMD64emülasyon4/4](platform-final/result-summary.json), [nonrootDocker](docker-final-proof.json), [Helmrender](helm-final-proof.json), [32CIbaşarısı](ci-32a0468.json).

[AC31hücre/1200s/20panel/24log sonuçları ve sınırlar](performance/REVIEW.md), [141hamdosyanın arşivi](performance/raw-measurements.tar.gz), [dosya/SHAmanifesti](performance/raw-measurements-manifest.json). Ana veriler sentetik production tracker/informer/WS/store/sahne yoludur; gerçek sağlayıcı CPU maliyeti değildir. NativeSafari/Retina performansıN/A; JSdraw fizikselpresentedFPS, GPUprocessCPU GPUkullanım%, tekPIDRSS toplamRAM değildir.

[L CPU açıklaması](backend/l-cpu-review.md) ilkAC gözlemini tam kapatmaz. İki ayrı kontrollü pil çifti AC ile birleştirilmez. PNGreadback/actionability üst sınırları fiziksel sunum veya bütün kontrollerin kullanılabilirliği ölçümü değildir. Zorunlu kapılar belirsizken stabletag/release/milestone kapanışı yapılmaz. Başarısız test metadata'sı, erken/reddedilmiş kayıtlar ve kaynak farkları korunur.

[İndirilenCIadaypaketleri](ci-package-proof-594e090.json):594head/09eegeçiciPRmerge tamtreesame, ikiarchiveSHA veMaccleanembeddedindexsmokePASS. Bu stable veya gerçekmainmerge değildir. [CIrun](https://github.com/yunusemre274/KubeView/actions/runs/42604991277).
