# Dünya girişleri ve gerçek yetenekler

2026-10-24. **Uygulandı**, her hedef ortamda canlı doğrulandığı anlamına gelmez. Tablo, gerçek servisleri ve eldeki test kanıtını ayırır. Demo açıkça seçilen, mutasyonları kapalı ayrı sağlayıcıdır; canlı hata/boşluk demo verisine dönüşmez.

| Dünya girişi / kaynak | Gerçek işlemler | Ön koşul / sınır | Kanıt |
|---|---|---|---|
| Merkez / Deployment | Liste, create/dry-run, YAML edit/delete, scale, template resources, restart, revision rollback | RBAC + yazma açık; HPA sahipliği manuel scale'i durdurur | Ayrılmış kümede Go yönetim testi; tarayıcıda create → watch → yük seçimi → log → scale → delete |
| Sefer panosu / StatefulSet, ReplicaSet | Genel CRUD; scale; uygun template resources/restart | Tür/strategy/revision korumaları; her türe Deployment rollback uygulanmaz | Servis ve capability kodu; her controller için canlı rollout sınanmadı |
| Sefer panosu / DaemonSet | Genel CRUD, template edit/resources, uygun restart | Replica stepper yok; yerleşim Node'lara bağlı | Kod + genel test; canlı DaemonSet değişikliği sınanmadı |
| Takvim / Job, CronJob | CRUD/YAML, CronJob suspend ve run-now | Bitmiş Job yeniden başlatılmış gibi gösterilmez | Go ayrılmış küme yönetim testi; takvim nesnesi tarayıcı testi |
| Gemi / Node | Gerçek koşullar, Pod listesi, allocatable/kullanım, label/taint YAML, cordon/uncordon, drain | SSAR; namespace kapsamındaki sunucu tam drain'i reddeder; eviction/PDB korunur | Canlı cordon/uncordon ve gerçek worker duraklatma → Ready Unknown; drain/PDB fake-client testi |
| Gemi → yeni Pod veya Deployment | Namespace/image/container kaynak alanları, required/preferred/scheduler placement, server dry-run/create | Node adı+UID GET doğrulaması, metadata.name affinity; scheduler atlanmaz. Mevcut selector/OR terimleri korunur | Go canlı uygun/uygunsuz scheduling testi, gerçek FailedScheduling; tarayıcı gemiden create, UID değişimi reddi |
| Yük / Pod ve container | Gerçek içerik/roller, log/previous/follow, events, metrics, YAML/delete; workload template resources veya ayrı in-place resize | Log ve exec ham Pod adı/container kullanır. Resize API/RBAC/uygunluğu ayrıca gerekir | Canlı log/exec/port-forward; aynı UID resize Go testi. Çoklu rol/kimlik saf ve gerçek canvas fixture testleri; gerçek çok-container log uçtan uca senaryosu sınırlı |
| Pod / terminal ve port-forward | Kubernetes exec ve SPDY portforward; bounded oturum ve kapatma; sandbox HTTP önizleme | Exec non-TTY satır tabanlıdır. HTTP mutlak asset yolları sınırlıdır; genel host shell endpoint'i yok | Go canlı Pod oturum testi + tarayıcı exec/forward |
| Vinç / scheduling | Gerçek atanmamış Pod'lar ve scheduler koşul/olayları; gözlenen nodeName ile transfer | İlk snapshot transfer kuyruğu değildir; görsel kuyruk kanonik store'u geciktirmez | Lifecycle birim testleri, gerçek raycast/schedule tarayıcı regresyonu, canlı kayıt |
| Depo / PV, PVC, StorageClass | Tür sütunları, detay, yetkili CRUD/YAML | Kapasite PVC/PV tanımından gelir; gerçek disk kullanım telemetrisi yok | Genel CRUD/capability altyapısı + tesis seçim testi; canlı disk provision sınanmadı |
| Ağ tesisi / Service, EndpointSlice, NetworkPolicy | CRUD/YAML, selector/endpoint/owner ilişkileri | Ölçülmüş trafik entegrasyonu yok | Backend discovery ve genel CRUD testleri; canlı ağ politikası etkisi sınanmadı |
| Fener / Ingress, kurulu Gateway API | Discovery katalog, yetkili CRUD/YAML | Gateway API kurulu olmalı; yük dengeleyici sağlama iddiası yok | Katalog kodu; Gateway kurulu olmadığı için canlı Gateway sınanmadı |
| Talimat panosu / ConfigMap | Genel CRUD/YAML | RBAC, RV çatışma ve UID koruması | Go canlı yönetim testi, tarayıcı toplu kısmi hata |
| Kasa / Secret | Genel state yalnız metadata/key adları; amaçlı açma ve amaçlı YAML düzenleme | Ayrı get/update yetkisi; raw değer taslakta yereldir, store/operasyon geçmişine taşınmaz; kayıp keyNames geri yazılamaz | Sanitizasyon birim testi; ayrı reveal/edit/403 tarayıcı senaryosu |
| Personel / ServiceAccount, Role, ClusterRole ve binding'ler | Gerçek subject/roleRef ilişkileri, CRUD/YAML | İsimden yetki türetilmez; gerçek SSAR ve Kubernetes RBAC | Gerçek kısıtlı ServiceAccount: GET200, SSAR delete/log=false, gateway403 ve upstreamForbidden; tüm RBAC kombinasyonları canlı sınanmadı |
| Merkez / Namespace, HPA, PDB, ResourceQuota, LimitRange | Katalog ve tür bilgileri; yetkili CRUD/YAML, HPA alan düzenleme | Cluster kapsamı ve readonly server'da uygulanır | Birim korumalar; canlı HPA/PDB yük testi yok |
| Merkez / Events, CRD, custom resource | Gerçek Events; Discovery GVR ve verb'ler, liste/get/create/edit/delete, isteğe bağlı OpenAPI yardımı | Custom türler açıldığında ve işlem sonrası yetkili GET/list ile yenilenir; bütün CRD instance'ları sürekli watch edilmiyor. Şema yoksa server dry-run belirleyicidir | Discovery/CRUD testleri; gerçek operator/Gateway instance matrisi sınanmadı |

## Veri ve arayüz kabulü

Kaynak kimliği source + GVR/kind + UID; API adresi ham namespace/name'dir. Snapshot tabanı, generation ve eski context yanıtları ayrılır. RV sayısal sıralanmaz. Delete kabulü, finalizer/grace bitişi değildir. Tabloda/nesnede/panelde aynı store kullanılır. Listeler yalnız geçici pencerelerde bulunur.

Gerçek test kapsamı yalnız **kubeview-test**, namespace **kubeview-qa**: iki Node, Kubernetes **v1.35.1**. Default current-context olan minikube üzerinde mutasyon yapılmadı. Worker pause sonrası tekrar Ready doğrulandı. Canlı fixture'lar UID/RV ile temizlenir; önceden var olan kaynaklara dokunulmaz.

Chromium ve Playwright WebKit test edilir; gerçek Safari cihaz testi değildir. 1440×900, 1280×800 ve dar ekran görüntüleri [world](evidence/world/) altındadır. Video [lifecycle-live.webm](evidence/world/lifecycle-live.webm), kaynak/işlem bilgisi [lifecycle-live.json](evidence/world/lifecycle-live.json) içindedir. Önceki dashboard görüntüleri tarihsel kayıttır.

## Açık sınırlar

- Headed Chromium / Apple M5 Metal kısa sentetik ölçümünde iki profil yaklaşık 60 FPS verdi; büyük profil 20 görünür Node bölgesine ayrılır. Gerçek Safari ve uzun süreli gerçek küme GPU yükü doğrulanmadı. Yazılım renderer ve donanım ölçümleri ayrı: [VALIDATION.md](VALIDATION.md).
- Tam Node drain/PDB kesinti senaryosu gerçek kümede çalıştırılmadı; namespace scope koruması ve eviction/PDB davranışı fake client ile sınandı.
- API gateway tek Kubernetes kimliği kullanır. Per-user impersonation ve bağlantılar arası watch havuzu yoktur; her canlı istemci informer maliyeti oluşturur. Operasyon kaydı tarayıcı oturumundadır, kalıcı iş orkestratörü değildir.
- metrics-server geçmiş deposu değildir; oturum içi gerçek örnekler kadar geçmiş gösterilir. Prometheus, Helm release yaşam döngüsü, bulut VM/Node sağlama ve trafik ölçümü entegrasyonu yoktur.
- Node UID oluşturma öncesi kontrol edilir; Kubernetes affinity isme bağlıdır. Kabulden sonra aynı adla Node yeniden yaratılırsa yerleşim gözlemi UID uyuşmazlığını ayrıca bildirir; atomik UID scheduling kilidi iddia edilmez.
