# KubeView çoklu liman: manuel kabul rehberi

Bu paket manuel kabul adayıdır. Aşağıdaki PASS/FAIL alanları kullanıcıya ayrılmıştır;
boş bırakılmıştır. Otomatik test sayısı, stable yayın veya fiziksel ekran gecikmesi
hedefinin sağlandığı anlamına gelmez. Önceki CPU ve fiziksel UI kabul sınırları ayrıca
açıktır. Native Safari performansı ayrıca değerlendirilen isteğe bağlı platformdur.

## Temiz terminalden başlama

Paketi kullanıcıya ait bir dizine açın. Paket kökünde `kubeview`, `scripts/` ve
`manual-lab/` birlikte bulunmalı. macOS/Linux için Python3.9+, Docker Engine/Desktop,
`minikube v1.38.1`, `kubectl` (Kubernetes1.35 ile desteklenen sürüm farkında) gerekir.
Runner paket yüklemez. Uygulama embedded binary'dir; Go, Node, npm ve Vite gerekmez.
Yalnız07 replay için Docker/minikube/kubectl gerekmez.

```sh
cd /paketin/acildigi/dizin
./scripts/manual-lab.sh doctor
./scripts/manual-lab.sh up --profile 02-ortak-kume
./scripts/manual-lab.sh app --profile 02-ortak-kume --write
./scripts/manual-lab.sh status
```

Başka çalışma dizininden mutlak runner yolu da çalışır:

```sh
/paket/scripts/manual-lab.sh doctor --binary /paket/kubeview
```

`--binary` veya `KUBEVIEW_BINARY` açık binary seçer. Aksi hâlde paket kökündeki
`kubeview`, sonra PATH aranır; repo build çıktısı veya `.git` çalışma alanı aranmaz.
`--write`, sunucunun kullanıcıya yönetim niyeti açabilmesine izin verir. Tarayıcıda
seçili liman için ayrıca açık yönetim onayı ve gerçek Kubernetes RBAC gerekir.
Varsayılan sunucu salt okunurdur;07 her durumda salt okunurdur.

Varsayılan state dizini macOS'ta
`~/Library/Application Support/KubeView/manual-lab-v1`, Linux'ta
`${XDG_STATE_HOME:-~/.local/state}/kubeview/manual-lab-v1` olur. Her komutta aynı
`--state-dir /mutlak/ozel/dizin` ile başka bir lab seçebilirsiniz. Bu dizin paket/repo
ve `.git` dışında olmalı; mevcut dolu bilinmeyen dizin benimsenmez. Dizin0700,
kubeconfig/token/workspace dosyaları0600'dür. `private/` içeriğini paylaşmayın.

Portlar varsayılan19701–19707'dir. Dolu, sahip olunmayan port kapatılmaz.
Yeni bir lab'ın ilk komutunda `--base-port 19800` verilebilir; sonraki komutlar kayıtlı
planı kullanır. Her profil ayrı app veri dizini ve sabit port alır.07'nin M/L ve liman
sayısı varyantları da ayrı workspace verisi kullanır; aynı07 portunda sırayla açılır.

A kümesi iki gerçek Node'dur: control-plane+worker. A2 için yaklaşık4GiB,
A+B için6GiB Docker RAM ve ek sistem payı gerekir;2CPU/Node ayrılır. B yalnız03
istendiğinde kurulur. Namespace/profil eklemek VM/Node oluşturmaz. `doctor` gerçek
Docker kaynaklarını, disk boşluğunu, araç sürümlerini, sabit portları ve local
kicbase durumunu gösterir. İlk kurulum Kubernetes/image indirmeleri için ağ ister.
Sabitler: Kubernetes1.35.1, kicbase0.0.50, nginx1.27.5-alpine,
busybox1.37.0. İnternet/proxy/registry hatası fake başarıya dönüştürülmez.

Tüm kubectl/minikube işleri lab'ın private KUBECONFIG/MINIKUBE_HOME değerleriyle
çalışır. Kullanıcının global current-context'i değiştirilmez. `up` aynı kimlikleri
korur; kullanıcı senaryosu değişikliklerini kendiliğinden sıfırlamaz. `reset` yalnız
seçilen profilin kaydedilmiş UID/owner fixture nesnelerini yeniden kurar; namespace,
kullanıcının eklediği bağımsız kaynaklar ve workspace tercihleri korunur.

## Ortak normal UI akışı

Uygulamanın yazdığı URL'yi kendi tarayıcınızda açın. Deniz haritası için
**Limanlar ve deniz haritası**, kayıt yönetimi için **Limanlar** kullanılır.
Boş workspace'te **İlk limanını bağla** → **Liman ekle** yolunu izleyin.
**Liman adı**, **Güvenilir bağlantı**, **Cluster / context**,
**Namespace kapsamı (virgülle)** ve **Label seçicisi** alanlarını doldurun;
**Bağlantıyı dene ve kapsamı önizle** ardından **Limanı kaydet** seçin.
İsteğe bağlı **Ortam etiketi** ve **Vurgu rengi** de aynı formdadır. Kayıtlı
limanın bağlantı/kapsamı için **Liman bağlantısını/kapsamını düzenle** kullanılır.
Haritada **Limanlar**, **Denizi uzaktan gör**, **Tekil gözlenen Kubernetes kaynakları**
ve gerçek paylaşımlarda **Paylaşılan Node** metinleri beklenir. Kapasite toplamı
gösterildiği iddia edilmez; tekil kaynak sayısı NodeUID ile değerlendirilir.
Bu metinler frontend sözleşmesidir; teslim build'inde görünmeyen kontrolü PASS
saymayın ve gerçek gördüğünüz metni not edin.

Runner02–06 ilk app açılışında kayıtları bu native HTTP workspace API'siyle kurar;
workspace.json dosyasını tahminle yazmaz. Daha sonraki rename/remove/import
tercihlerinizi tekrar seed ederek ezmez. `--empty-workspace` ilk kaydı da normal
UI'dan yapmak içindir.01 her zaman otomatik seed'i atlar; yeniden açıldığında ise
kullanıcının daha önce kaydettiği workspace korunur.

Node = fiziksel Kubernetes Node UID'si, Pod/kutu = gerçek Pod/container'dır.
Bir liman ayrı VM değildir. Aynı A Node'u iki projede görünebilir; kapasiteyi iki
kez toplayarak yeni fiziksel kapasite oluşturmuş saymayın. Kısıtlı kimlikte görünmeyen
Node metadata'sını admin limanından sızmış sayarak normalleştirmeyin.

## 01 — Boş başlangıç (`http://127.0.0.1:19701/`)

```sh
./scripts/manual-lab.sh up --profile 01-bos-baslangic
./scripts/manual-lab.sh app --profile 01-bos-baslangic
```

İlk açılışta0 kayıtlı liman,0 fixture Pod beklenir. Güvenilir A context'i gerçek ve
ulaşılabilirdir; A'da2 gerçek Node vardır ancak boş workspace otomatik dünya/örnek
Node üretmemelidir. Boş onboarding ile bir liman bağlayın; A context'i ve kapsamı
normal UI'dan seçin. Limanı yeniden adlandırın/konumlandırın; `down --profile ...`
sonra aynı app komutuyla açınca kayıt/tercihler korunmalı. İlk boş ekranı tekrar
incelemek için mevcut workspace'i silmek yerine yeni `--state-dir` kullanın.

Başarısızlık: ilk açılışta kendiliğinden liman/demo/örnek kaynak; restart'ta kayıp.
Reset: fixture yok; workspace kaydını yalnız normal UI'da bilinçli silin.

MANUEL PASS/FAIL: ______  Notlar: ______________________________________

## 02 — Ortak küme (`http://127.0.0.1:19702/`)

```sh
./scripts/manual-lab.sh up --profile 02-ortak-kume
./scripts/manual-lab.sh up --profile 02-ortak-kume
./scripts/manual-lab.sh app --profile 02-ortak-kume --write
./scripts/manual-lab.sh status
```

2 liman, A'da2 fiziksel Node toplamı, her proje namespace'inde1 Deployment/1 Pod;
profil toplamı2 Pod beklenir. İki Pod gerçek worker'a açık required NodeAffinity
ile yerleşir; scheduler çalışır, `spec.nodeName` yazılmaz. İkinci up nesneleri
çoğaltmamalı; status'taki kube-system/Node/PodUID değişmemeli.

Deniz haritasından Proje1→Proje2 geçin; iki Pod'un nodeName/NodeUID eşitliğini
ayrıntılardan kontrol edin. Aynı fiziksel Node'a iki ayrı kimlik üretmeyin. Her
limanda tablo, arama, log ve kaynak penceresinin namespace sınırını inceleyin.
Bir limanı `--empty-workspace` ile kendiniz kurarak selector ekleyin; aynı kapsamı
ikinci limana bağlayın, kaynakları iki kez saymadığını kontrol edin.

Başarısızlık:4 fiziksel Node/toplam kapasite; proje dışı Pod/log; ikinci up duplicate.
Reset: `./scripts/manual-lab.sh reset --profile 02-ortak-kume`.

MANUEL PASS/FAIL: ______  Notlar: ______________________________________

## 03 — Bağımsız kümeler (`http://127.0.0.1:19703/`)

```sh
./scripts/manual-lab.sh up --profile 03-bagimsiz-kumeler
./scripts/manual-lab.sh app --profile 03-bagimsiz-kumeler --write
./scripts/manual-lab.sh status
```

Bu komut ihtiyaç üzerine B1 kurar.2 liman; A2+B1=3 fiziksel Node; her kümede aynı
namespace adı, `same-app` Deployment ve `same-pod` standalone Pod bulunur.
Her kümede2, profil toplamı4 Pod vardır. Generated Deployment Pod adı farklı
olabilir; exact same name karşılaştırması standalone `same-pod` üzerindedir.
Kube-system/namespace/PodUID'ler kümeler arasında farklı olmalıdır.

A/B arasında geçin; aynı adın log, seçim, metrik ve düzenleme taslağını diğer UID'ye
bağlamadığını kontrol edin. A'daki nesneyi silmek B'yi silmemeli. Cross-cluster DNS,
HTTP, Service veya ölçülmüş iletişim çizgisi kendiliğinden oluşmaz; ClusterMesh,
federasyon vecross-cluster tünel bu profile kurulmaz.

Başarısızlık: adlar üzerinden birleşen kümeler; A silmesinin B kaynağını kaldırması.
Reset: `./scripts/manual-lab.sh reset --profile 03-bagimsiz-kumeler`.

MANUEL PASS/FAIL: ______  Notlar: ______________________________________

## 04 — Kısıtlı yetki (`http://127.0.0.1:19704/`)

```sh
./scripts/manual-lab.sh up --profile 04-kisitli-yetki
./scripts/manual-lab.sh app --profile 04-kisitli-yetki --write
```

Aynı A/namespace üzerinde2 liman vardır: ayrı admin ve namespaced okuyucu.
Gerçekte2 Node ve1 fixture Pod; okuyucu Node/Namespace LIST yapamaz, write ve
Secret okuma izni yoktur. Bu limanda gerçek0 fiziksel Node iddiası yerine
**erişim kısıtlı/bilinmiyor** ayrımı aranır. Yönetim düğmesinin reddini, yetkili
namespace Pod/log erişimini ve admin metadata'sının okuyucuya taşınmamasını kontrol
edin. Token RAM'de TokenRequest ile üretilip yalnız0600 private kubeconfig'e yazılır.
`up`/app açılışı TokenRequest'i yeniler; gerçek server expirationTimestamp
ve5dakikalık yenileme sınırı doctor çıktısında gösterilir. Sunucunun verdiği süre
istendiğinden kısa/uzun olabilir; bu sınırda tekrar `up`, ardından app restart kullanın. SA/Role/Binding owner+UID ve kural değişikse yenileme reddedilir.

Başarısızlık: reader'ın admin Node/Secret/write yetkisi kullanması;403'ün boş küme
veya başarılı işlem gibi görünmesi. Reset yalnız04 fixture'larını yeniden kurar.

MANUEL PASS/FAIL: ______  Notlar: ______________________________________

## 05 — Arıza/toparlanma (`http://127.0.0.1:19705/`)

```sh
./scripts/manual-lab.sh up --profile 05-ariza-toparlanma
./scripts/manual-lab.sh app --profile 05-ariza-toparlanma --write
./scripts/manual-lab.sh scenario --profile 05-ariza-toparlanma --name container-crash
./scripts/manual-lab.sh scenario --profile 05-ariza-toparlanma --name container-recover
./scripts/manual-lab.sh scenario --profile 05-ariza-toparlanma --name bad-image
./scripts/manual-lab.sh scenario --profile 05-ariza-toparlanma --name unschedulable
./scripts/manual-lab.sh reset --profile 05-ariza-toparlanma
```

Başlangıçta1 liman, A2 Node,1 sağlıklı Pod/2 container; bad-image ve unschedulable
Deployment'ları0 replica ile bekler. Crash yalnız `controlled` container'ın gerçek
exit42/restart durumunu tetikler; `healthy` kutu çalışır. Recover paylaşılan emptyDir
bayrağını sağlıklı container üzerinden kaldırır; aynı PodUID toparlanabilir.
Exec API'si ad-adreslidir; runner UID'yi hemen önce/sonra doğrular, atomik UID
önkoşulu olduğu iddia edilmez. Image/unsched senaryoları ayrı gerçek Pod'lar ekler;
Event/ImagePullBackOff/Pending gerekçelerini UI'da inceleyin.

```sh
./scripts/manual-lab.sh scenario --profile 05-ariza-toparlanma --name node-stop
./scripts/manual-lab.sh scenario --profile 05-ariza-toparlanma --name node-recover
```

Node-stop gerçek **A worker** container'ını durdurur;02/04/05/06 gibi A'yı paylaşan
bütün limanlar etkilenebilir. B bağımsız kalır. Unknown gözlemi Kubernetes grace
süresini bekleyebilir; app/backend kopması tek başına Node arızası değildir.
Recover aynı DockerID/NodeUID'yi doğrular. Reset worker'ı gerekirse açar ve yalnız05
fixture'larını sağlıklı başlangıca getirir. Zorla Pod/Node silme veya status enjeksiyonu
yoktur. İlk snapshot eski Pod'lara yeniden ADD/düşüş animasyonu üretmemelidir.

MANUEL PASS/FAIL: ______  Notlar: ______________________________________

## 06 — Limanlar arası ağ (`http://127.0.0.1:19706/`)

```sh
./scripts/manual-lab.sh up --profile 06-limanlar-arasi-ag
./scripts/manual-lab.sh app --profile 06-limanlar-arasi-ag
./scripts/manual-lab.sh scenario --profile 06-limanlar-arasi-ag --name traffic-start
./scripts/manual-lab.sh scenario --profile 06-limanlar-arasi-ag --name traffic-increase
./scripts/manual-lab.sh scenario --profile 06-limanlar-arasi-ag --name traffic-stop
```

2 liman/namespace, A2 Node. Başlangıç1 server Pod; start ile1 client eklenir(toplam2),
increase ile3 client(toplam4), stop ile client0(toplam1). Client gerçek
`http.<server-namespace>.svc.cluster.local` DNS adını kullanıp Service'e HTTP yapar;
client logunda `HTTP_OK` gerçek başarıdır. `HTTP_FAIL` tek başına NetworkPolicy drop
kanıtı değildir. UI Service/EndpointSlice topolojisini ve varsa provider durumunu
ayrı inceleyin. Vanilla A'da Hubble kurulmaz; ölçülmüşflow yoksa uydurulmuş çizgi,
paket/byte/bant genişliği üretilemez. Stop sonrası gerçek trafik kesilmelidir.

Opsiyonel gerçek Hubble için kurulu **Helm** ve **Hubble CLI1.20.2** gerekir;
Cilium CLI zorunlu değildir. `doctor` sürüm ve gerekli gerçek flags'i salt okunur
kontrol eder; paket/CLI yüklemez. Cilium chart/app1.20.2 yalnız açık extension
isteğiyle indirilir, SHA'sı private state'e sabitlenir. Önce normal A/B lab'larını
kendi state'lerinde `down` ile durdurun; yaklaşık4GiB+telemetry/system payı gerekir.

Bu adayın opsiyonel telemetry E2E kabulü **BLOCKED**: ilk gerçek cold kurulum relay'nin
Cilium öncesi yanlış NodeCIDR'le başlaması ve DNS timeout nedeniyle başarısız oldu.
Dar düzeltmeden sonraki tek warm retry, henüz PodIP'si olmayan relay'yi güvenli
biçimde reddetti; Pod silinmedi. İki denemenin de lab'ı resmî `down` ile durduruldu.
[Cold FAIL](manual-lab/evidence/telemetry-full-tls-cold-01.json) ve
[warm retry FAIL](manual-lab/evidence/telemetry-full-tls-warm-retry-02.json) korunur.
Bu iki runtime FAIL sonrasındaki kaynak, aynı owned PodUID'nin başlangıçta IP
almasını en fazla45s bekler; bu son kaynakla üçüncü integration koşusu yapılmadı.
[12 hedefli unit PASS](manual-lab/evidence/telemetry-relay-startup-wait-unit-01.json)
yalnız mock saat/kaynak sözleşmeleridir; gerçek mTLS/provider UI/ölçülmüş
start–increase–stop/kısıtlı telemetry kabulünün yerine geçmez. Bu alt kontroller bu
koşuda çalıştırılamadı.

```sh
./scripts/manual-lab.sh down
./scripts/manual-lab.sh doctor --state-dir /kullanici/verisi/kv-telemetry --hubble-binary /kurulu/hubble
./scripts/manual-lab.sh up --profile 06-limanlar-arasi-ag --state-dir /kullanici/verisi/kv-telemetry --telemetry --base-port 19900 --hubble-binary /kurulu/hubble
./scripts/manual-lab.sh app --profile 06-limanlar-arasi-ag --state-dir /kullanici/verisi/kv-telemetry
./scripts/manual-lab.sh scenario --profile 06-limanlar-arasi-ag --state-dir /kullanici/verisi/kv-telemetry --name traffic-start
./scripts/manual-lab.sh scenario --profile 06-limanlar-arasi-ag --state-dir /kullanici/verisi/kv-telemetry --name traffic-stop
./scripts/manual-lab.sh down --state-dir /kullanici/verisi/kv-telemetry
```

Bu **fresh ayrı state** ilk A2 oluşturulurken CNI'siz bootstrap→pinned Cilium
kurulumu yapar; mevcut vanilla A'yı dönüştürmez. Ayrı telemetry lab'ında yalnız06
extension kapsamı kullanılır; B/T eklenmez. Aynı state ile tekrar up mode'u korur.
Cilium/Hubble kaynakları owner+install-intent+UID, forward PID+doğum/komut+port ile
korunur. Hubble agent↔relay ve relay↔backend mTLS açıktır; owned kubectl forward yalnız
127.0.0.1:base-port+8 açılır. Yukarıdaki ayrı port planında app19906, Hubble19908
olur. Backend ve CLI aynı doğrulanmış CA/clientcert/key ile
`ui.hubble-relay.cilium.io` server name kullanır; plaintext/insecure fallback yoktur.
Yalnız açık telemetry lab'ının UID/Helm/owner guard'lı iki sabit Secret'inden
private0700 dizine atomic0600 materyal alınır. Default A/B Secret'leri okunmaz;
materyal değerleri ve özel yollar public kanıtlara/export'a yazılmaz.
Kullanıcının global CLI/kubeconfig/Helm config'i okunmaz.

UI'da configured/available ayrımını, gerçek fresh flow start/stop'u ve stale
sonrası temizliği inceleyin. Default kindnet A'da NetworkPolicy enforcement veya
Hubble flow varmış gibi test yapmayın. Extension policy eklemez/gevşetmez;
L7 redirect kurulmaz, L4 flow sayısı HTTP istek/byte/bant genişliği değildir.
Extension kodunun bulunması gerçek kurulum/provider E2E PASS sayılmaz; teslim
kanıtındaki gerçek koşu durumunu ayrıca kontrol edin. Reset yalnız06 fixture'larını
sıfırlar; Cilium'u ve workspace tercihlerini silmez.

İlk bootstrap'ta relay Cilium'dan önce başlamışsa runner yalnız açık telemetry
lab'ının aktif Node CNI plugin adlarını ve NodeCIDR'lerini doğrular. Yalnız exact
Deployment→ReplicaSet→Pod UID zinciri doğrulanan relay Pod'u, IP'si kendi NodeCIDR'i
dışında **ve** CiliumEndpoint'i yoksa UID/resourceVersion önkoşuluyla bir kez yeniler.
Başlangıçta Pending/boş IP için yalnız aynı PodUID en fazla45s beklenir; UID, owner,
NodeUID/CIDR değişikliği veya timeout silmeyi reddeder.
Belirsiz CNI/owner veya sıradan Ready=False bu işleme yetmez; başka Pod, CoreDNS,
NetworkPolicy veya kullanıcı CNI'si değiştirilmez. Yeni relay IP/endpoint kimliği ve
gerçek readiness tekrar doğrulanır. Başarısız cold denemeden sonraki recovery ayrı
kayıttır; başarılı yeni cold kurulum kanıtı olarak yorumlanmaz.

MANUEL PASS/FAIL: ______  Notlar: ______________________________________

## 07 — Yük/geçiş TEST / REPLAY (`http://127.0.0.1:19707/`)

```sh
./scripts/manual-lab.sh up --profile 07-yuk-ve-gecis
./scripts/manual-lab.sh app --profile 07-yuk-ve-gecis --replay M --harbors 5
./scripts/manual-lab.sh down --profile 07-yuk-ve-gecis
./scripts/manual-lab.sh app --profile 07-yuk-ve-gecis --replay L --harbors 20
```

M20 Node/300 Pod; L50 Node/1500 Pod sabit fixtures.v2 seed20261024 kaynağıdır.
Context `test-replay-M`/`test-replay-L`, namespace'ler bench-0,bench-1,bench-2,bench-3.
`--harbors 1|5|10|20` aynı canonical scope'u kaydeder:20 liman20×Node/Pod üretmez.
Gerçek scheduler, gerçek kubelet, canlı Kubernetes, gerçek Hubble veya doğal fault
kanıtı değildir. TEST/REPLAY kaynağı görünür ve yönetim zorunlu salt okunur olmalı.
1/5/10/20 varyantlarını sırayla açın;50 geçişte seçimi/pencereyi/logu/tuş odağını
inceleyin. Sonlu UI ölçümü fiziksel sunum gecikmesini kendiliğinden kanıtlamaz.
Reset sabit kaynağı değiştirmez; down+app yeniden başlatır, workspace tercihleri korunur.

MANUEL PASS/FAIL: ______  Notlar: ______________________________________

## A–O kabul defteri (kullanıcı doldurur)

| Madde | Normal kullanıcı denemesi | PASS/FAIL | Not |
|---|---|---|---|
| A | Eski tekcontext migration; restart'ta kimlik/tercih korunumu |  |  |
| B |02 iki namespace; gerçek ortak NodeUID ve kapasite |  |  |
| C | Label selector, overlap, filtreli kaynak arama |  |  |
| D |03 aynı isim/farklı clusterUID/nesneUID izolasyonu |  |  |
| E |04 farklı credential, gerçek403/revoke, admin→reader sızıntısız |  |  |
| F |50 geçiş; in-flight/draft/newUID/ESC/geri/focus sınırı |  |  |
| G | İki limanda eşzamanlı gerçek operasyon; scope'a bağlı grant |  |  |
| H | Rename/remove/export/import; secret dışarı çıkmaz, import unbound |  |  |
| I |05 ortak Node arızası A'ya yayılır, B bağımsız kalır |  |  |
| J |06 gerçek DNS/HTTP start/increase/stop; optionalprovider açık ayrım |  |  |
| K | Cross-cluster sahte Service/flow/ilişki üretilmez |  |  |
| L | Kaynak/UID/container doğru log, metrik ve stream cleanup |  |  |
| M | Bozuk schema/config/credential görünür hata; kayıtlar korunur |  |  |
| N | İlk snapshot ADD/fault/transfer animasyonu değildir |  |  |
| O | Temiz cwd, up iki kez, down/reup, reset, globalcfg değişmez |  |  |

M senaryosu için canlı private dosyayı rastgele bozmayın: önce `down`, kullanıcı
verisinin özel kopyasını alın; bozuk dosyayla uygulamanın hata davranışını inceleyip
aynı özel yedekten geri dönün. Gelecek schema sürümü sessizce overwrite edilmemeli.
Export/import UI'da credential/path içermemeli; import limanlarını gerçek trusted
connection'a yeniden bağlayın. Ayrı teslim/CI kayıtları bu manuel satırları doldurmaz.

## Güvenli kapatma ve tekrar açma

```sh
./scripts/manual-lab.sh down --profile 02-ortak-kume
./scripts/manual-lab.sh down
./scripts/manual-lab.sh status
./scripts/manual-lab.sh up --profile 02-ortak-kume
./scripts/manual-lab.sh app --profile 02-ortak-kume --write
```

Profil seçili down yalnız o app'i kapatır; paylaşılan cluster'ı durdurmaz.
Genel down yalnız kayıtlı PID+doğum/komut/port ve DockerID+minikube label ile sahip
olunan süreçleri durdurur. Ağır lab'lar teslim sonunda **durdurulmuş**, private
verileri korunmuş olmalıdır; gerçek son durum `status` ile okunur. Kapatılmış
kümelerde API yoktur, kaynaklar yok oldu veya DELETE oldu sayılmaz.

Kalıcı silme yalnız lab kimliğini `status` çıktısından elle alıp açıkça vererek:

```sh
./scripts/manual-lab.sh down
./scripts/manual-lab.sh destroy --confirm kvml-TAM_KIMLIK
```

Yanlış kimlik/owner/UID/container/PID eşleşmesi işlemi reddeder. Eski `kv-repair-*`,
kullanıcının cluster'ları, global Docker prune veya wildcard namespace cleanup yoktur.
Destroy restart verisini siler; manuel tekrar denemek istiyorsanız yalnız down kullanın.

MANUEL SONUÇ (kullanıcı): PASS/FAIL ______  Tarih ______  Notlar ___________________
