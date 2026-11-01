# v1.1 öncesi görsel onarım — çalışma kaydı

2026-11-01. **Çalışma sürüyor; v1.1 tamamlanmış değildir.** Sürüm/etiket/release oluşturulmadı.

Başlangıç: `redesign/harbor-workbench`, `5cfd30d7e0d6202bc1bd19dd8d0e4979fa2d5e8f` + denetim/performance/kamera değişiklikleri. Bu ağacın hash manifesti ve özel geri dönüş kopyası `artifacts/pre-v11-repair/repair-20261101T130559Z/start-manifest.json` ile `.git/pre-v11-start-20261101T130559Z/` altında. Mevcut güvenli commitler ve denetlenmiş başlangıç `26ff6e7` uzak geliştirme dalına gönderildi. Tarihsel benchmark dosyaları değiştirilmedi.

## Mimari ve iş sırası

Aktif yol Go `pkg/server/stream.go` bağlantı başına informer/cache → kapsamlı snapshot/delta → tek frontend store → tam ekran HarborScene ve nesne panelleridir. Eski `pkg/websocket/hub.go` aktif ağ geçidi değildir. İlk iş yanlış silinme/log/metadata/owner hedefini düzeltmek; ardından sınırlı görsel yaşam döngüsü, yerel gerçek worker sağlayıcısı, gerçek Hubble akışı ve kabul ölçümleridir. Canonical kaynaklar animasyon bitişini beklemez.

| Alan | Güncel kanıt | Henüz tamamlanmayan kabul |
|---|---|---|
| G00 scoped CR | Gerçek catalog/reconnect/DELETE/offline-delete/relist/yeni UID/RBAC/namespace/context: `frontend-G00-real-2.json`, 6 grup geçti | Son kaynak kimliğiyle regresyon/perf |
| Log UID | Gerçek replacement opening ve first-publish yarışı: `backend-real-log.txt`; yeni UID satırları bastırıldı | Kubernetes logs API atomik UID garantisi sunmaz; kalan yarış sınırı belgelenecek |
| Secret / kaynak hedefi | Sentetik Secret metadata korunumu ve gerçek D/STS/DS template değişikliği; RS/Job/CronJob açık 422: `backend-real-resources-mutation.txt` | Tam rollout bu gated testte ölçülmedi |
| G01–G02 | Ortak bounded koordinatör/Node batma/tek-container düşüşü; 48 harbor unit testi | Gerçek olayla video ve recovery/cleanup |
| G03 | İzinli minikube adaptörü, journal/lock/idempotency; test kümesi `kv-repair-1101` | İlk iki gerçek UI denemesi güvenli ön kontrolde reddedildi; gerçek yeni worker henüz doğrulanmadı |
| G04/G07 | Owner UID ve gerçek durumdan türetilmiş süreç, vinç devri | Gerçek form/işlem videosu ve eşzamanlı workload kabulü |
| G05 | Hubble1.20.2 CLI/protobuf adaptörü; gerçek lab Cilium1.20.2 + mTLS relay | Aynı/farklı Node gerçek iki-Pod trafiği ve yetki kapsamı |
| G06 | Scope/namespace ve template capability düzeltmeleri | Metrics/addon/işlem envanteri güncellemesi |
| Performans | Dondurulmuş başlangıç M: 12, L:3 hücre; 30s ısınma+60s ölçüm, n=3, medium/DPR1 | Son sürüm eşleşmiş ölçüm, yeni efekt/collector maliyeti ve20dk karma koşu |

Kanıt kökü: `artifacts/pre-v11-repair/repair-20261101T130559Z/`. Unit/replay, gerçek API durum enjeksiyonu ve gerçek Kubernetes/traffic E2E ayrı değerlendirilir. Henüz açılmamış video dosyası görsel kabul sayılmaz. Sağlayıcı anahtarları/kubeconfig/TLS dosyaları yalnız `.git/kv-repair-runtime/` içinde, rapor/repoda değildir.

## Güvenli test ortamı ve önceki başarısızlıklar

Yeni lab yalnız bu iş için oluşturuldu: Kubernetes1.35.1, minikube1.38.1, docker/containerd, küme UID `a24740ba-cf3e-461d-b5b3-250deeb060d7`. Kullanıcının kümelerinde CNI/Node değişikliği yapılmadı. Containerd ile `--cni=false` ilk minikube ön kontrolünde reddedildi; boş kendi lab'ı bridge ile başlatılıp Cilium kurulumu yapıldı. Relay'in eski bridge ağıyla başlayan Pod'u yalnız bu yeni lab'da yeniden başlatıldı; mTLS sağlık kontrolü geçti.

İlk worker UI isteği minikube profilinin primary Node adını boş kaydetmesi ve ilk local kubectl cache gereksinimi nedeniyle reddedildi. Profil adı normalizasyonu ve sabit profile `kubectl --ssh` okuması eklendi. İkinci deneme Docker29'un küçük harfli `no such object` yanıtını tanımayan ön kontrolde reddedildi; henüz worker oluşmadı. Başarısız kayıtlar korunur; yeni koşu ayrı run adı kullanır.
