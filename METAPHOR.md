# Kubernetes ↔ Tersane

Tersane uygulamanın tam ekran arayüzüdür. Sabit tesisler, kaynak olmasa da açıkça tanımlı uygulama girişleridir; gerçek Kubernetes toplamına eklenmez. Kaynak kimliği cluster + GVR/kind + UID, API adresi ham namespace/name’dir.

| Dünya nesnesi | Gerçek anlamı | Tıklama |
|---|---|---|
| Liman bütünü | Seçili cluster | Küçük bağlantı rozeti context/kapsamı açar |
| Merkez ve kontrol kulesi | Cluster yönetimi / control-plane işlevleri | Geçici Liman Yönetim Merkezi |
| Kargo gemisi | Gerçek Node; control-plane Node da dahildir | O Node’un koşulları, Pod’ları ve işlemleri |
| Palet / yük grubu | Pod UID | Pod ve container içeriği |
| Grup içindeki kutu | Adıyla tanımlı gerçek container | Doğru app/init/sidecar/ephemeral container |
| Sarı / pas kırmızısı vinç | Gözlenen scheduling ve yükleme | Pending yükler ve gerçek olay gerekçeleri |
| Sefer panosu / ana hangar | Workload yönetimi | Deployment, StatefulSet, DaemonSet, ReplicaSet, HPA/PDB |
| Takvim panosu | Job / CronJob | Zamanlama, suspend/resume ve run-now |
| Depo / ambar | PV ve depolama yönetimi | PVC tahsisleri, PV ve StorageClass |
| Talimat panosu | ConfigMap ve yapılandırma | ConfigMap, namespace, quota/limit |
| Kilitli kasa | Secret | Metadata; ayrı yetkili içerik akışı |
| Ağ tesisi | Service / EndpointSlice / NetworkPolicy | Gerçek selector ve endpoint ilişkileri |
| Giriş feneri | Ingress ve kurulu Gateway API | Discovery tabanlı dış erişim kaynakları |
| Personel bölümü | ServiceAccount / Role / Binding | Gerçek kural ve özne ilişkileri |
| Gemi radarı | Aynı Node/kubelet gözlemi | Aynı Node UID’sinin sağlık bilgileri |

Deployment veya StatefulSet replica’ları yeni gemi üretmez. StatefulSet ordinal kimliği gerçek Pod yükündedir; DaemonSet Node’lar üzerinde çalışan gerçek Pod’larla ilişkilidir. Namespace farklı gemilere yayılabilir; fiziksel olarak tek geminin ambarı değildir.

Gemiden oluşturma, seçilen Node’a zorunlu veya tercih edilen affinity ekleyebilir. `spec.nodeName` ile scheduler atlanmaz. Merkezden oluşturma scheduler seçimini varsayılan bırakır. Gerçek nodeName gözlenmeden yük gemiye taşınmaz. Animasyon hiçbir kaynak veya işlem başarısı üretmez.

Tarihsel “numaralı StatefulSet gemi filosu”, “namespace = gemi ambarı” ve kalıcı dashboard eşleştirmeleri 2026-10-24 ürün kararıyla geçersizdir.

## Görsel filo hareketi

Node kimliği sabittir, geminin dünya dönüşümü hareket eder. Güverte yükleri gerçek nodeName ilişkisini korur; başka gemiye fiziksel olarak sürüklenmek bir Kubernetes scheduling olayı değildir. Sağlıklı geminin varsayılan hâli seyirdir; eski sürekli rıhtımda park kararı bu ek ürün kararıyla değişmiştir. Node arızası veya görsel kullanıcı duraklatması son konumu korur. Backend bağlantısı kesilmesi Node arızası değildir.

Yanaşma/vinç işlemi yalnız gözlenen Pod atamasının geçici sunumudur. İlk snapshot/relist yük kuyruğu üretmez. Görsel yükleme sürerken kaynak atanmış/Running/Ready olabilir; panel gerçek durumu gösterir. Uzak veya meşgul gemide kısa varış, gerçek yanaşma yapılmış iddiası taşımaz. Her bölge8 gemi kapasitelidir; namespace hâlâ gemiler arasında ortaktır.

## 1 Kasım 2026 — Gözlenen arıza ve ölçülmüş ağ

Ready=False olan mevcut Node gemisi kısa fren, kontrollü alev/duman ve zamana yayılan yatma/alçalma gösterir; bir üst bölüm/işaret seçilebilir kalır. Bu bir durum metaforudur, fiziksel sunucunun yandığının ölçümü değildir. Ready=Unknown iletişim kaybıdır; uygulama bağlantı kaybı yalnız stale'dir. Aynı UID toparlanır; gerçek DELETE ayrı çıkış izidir. Node kaydı yokken API'de kalan Pod'un nodeName/phase'i değiştirilmez; kıyı işareti ve bulucudan erişilebilir.

Arızalanan kutu gerçek Pod UID + container adı/rolü + restart/termination dönemine bağlıdır. Sağlıklı diğer kutular kalır; başarılı Job/init düşmez. Aynı UID recovery yeniden yükleme, yeni UID yeni yüktür. Normal silmenin SIGTERM/137 sonucu yeni bir arıza sekansı başlatmaz.

Kızak, merkezden istenen gerçek yerel worker sağlamanın girişidir. İstek taslağı Node sayılmaz; yalnız sağlayıcının doğruladığı gerçek Node UID'siyle eşleşir. Scheduler worker sağlamaz. Merkez/API/controller/scheduler/kubelet işaretleri gerçek kaynak/owner/nodeName/Ready gözlemlerinden türetilmiş temsili süreçtir; iç RPC mesajı ölçülmez.

Ağ katmanları ayrıdır: selector/EndpointSlice topolojisi, Hubble ölçülmüş flow olayları ve temsili kontrol düzlemi. Flow sayısı paket/byte/bant genişliği değildir. Hubble1.20.2 Pod UID veya container adı vermediğinden zamana bağlı doğrulanmış IP/Pod aralıkları kullanılır; belirsiz eşleşme bilinmiyor kalır ve yanlış kutuya çizilmez. Namespace/küme yetkisi dışında endpoint metadata'sı gönderilmez. Trafik penceresi sona erince iz durur; provider kesilmesi Node arızası değildir.

## 9 Kasım 2026 — durum ve yönetim sunumu

Takvim panosundaki askıdaki Job **Askıya alındı** görünür; gerçek Complete/Failed koşulları önceliklidir. Job askısı yeni gemi yaratmaz ve görsel seyri durdurma düğmesiyle aynı işlem değildir. DaemonSet için eksik sayılar sağlıklı filo anlamına gelmez: bilinen desired/ready ve güncel observedGeneration gerekir. Gerçek 1/1 Ready DS **Hazır** kalır. [Son kaynakta normal UI kanıtı](artifacts/v1.1.0/v11-20261108/frontend/status-resume/REVIEW.md).

Workload formu yalnız backend'in doğruladığı gerçek owner UID hedefine gider. D/STS/DS template düzenleme yeni Pod/Ready sonucundan ayrıdır; standalone RS/Job/CronJob sessizce başka workload'a çevrilmez. Pod silme controller replacement'ına yol açabilir; yeni UID ayrı bir yük olarak seçilir. Aynı UID'deki kullanıcı taslağı reconnect GET'iyle ezilmez, RV farkı görünür gözden geçirme ister. Kasa yalnız metadata gösterir; değer reveal/edit'i ayrı yetkili yerel akıştır ve maskeli içerik gerçek Secret yerine yazılmaz.

Context/namespace/stream değişince eski trafik callback'i yeni limana çizilemez. Geç yanıtların reddi ve eski scope lease'inin bırakılması gerçek hook'un sentetik unit testleriyle ayrıca sınanır; bu, gerçek Hubble ölçümünün yerine geçmez. App/init/ephemeral/previous log seçimi gerçek Pod UID ve container adına bağlıdır; pause akışı kapatır, resume seçili tail'i yeniden okur. Bir log veya provider kopması geminin fiziksel ölüm kanıtı değildir.

Güncel aday tam ekran liman ve opak Soft UI pencereleri kullanır. Önceki gerçek Node arızası/worker/vinç kanıtları tarihsel kaynaklarıyla korunur; yeni caption ve bağlantı akışı için incelenmiş kaynak uygulanabilirliği [ayrı kayıttır](artifacts/v1.1.0/v11-20261108/harbor-source-applicability.json). Yayımlama durumu ve test edilmiş aday kimlikleri [release notlarında](docs/RELEASE_NOTES_v1.1.0.md) izlenir.

## 9 Kasım 2026 — proje limanları ve ortak altyapı

Deniz dünyası artık bir workspace içindeki proje limanlarını kapsar. **Liman** tek bir güvenilir Kubernetes bağlantısında seçilmiş namespace kümesi ve isteğe bağlı label kapsamıdır; yeni cluster, namespace veya fiziksel Node değildir. **Workspace** bu limanların kayıtlı koleksiyonu/düzenidir. Küçük Limanlar pusulası ya da merkez liman ekleme ve harita geçişini açar; kalıcı dashboard oluşmaz.

Bir Node gemisi küme kapsamındadır. Aynı doğrulanmış cluster+Node UID, iki projenin limanında o projenin yükleriyle gösterilebilir. **Paylaşılan Node** işareti, iki gemi görünümünün iki sunucu olmadığını anlatır. İzin verilmeyen diğer proje yükleri görünmez. Bilinmeyen cluster kimliği iki context'i aynı altyapı kabul ettirmez. Farklı cluster'ların aynı adlı gemileri ayrı kaynaklardır; bir limana geçmek gerçek Node/Pod taşımaz.

Ortak altyapı çizgisi aynı doğrulanmış kaynağı; yapılandırılmış çizgi gözlenen/elle belirtilen bağımlılığı; ölçülmüş akış yalnız sağlayıcının zamanlı gözlemini anlatır. İlk ikisi canlı paket veya bant genişliği kanıtı değildir. Harita üzerinde ilişki eklemek ağ erişimi yaratmaz. Tek-cluster Hubble gözlemi cross-cluster bağlantı sağladığımız anlamına gelmez.

Yakındaki liman ayrıntılı, diğerleri hafif uzak temsildir; tek Canvas, paylaşılan deniz ve mevcut deniz/seyir/vinç/arıza davranışları korunur. Görsel uyku canonical state'i geciktirmez. Liman kaldırmak yalnız uygulama kaydını ve aboneliği bırakır; Kubernetes kaynağı silmez. TEST/REPLAY yük profili açıkça sentetiktir; gerçek scheduler, worker sağlama veya trafik ölçümü yerine sayılmaz.
