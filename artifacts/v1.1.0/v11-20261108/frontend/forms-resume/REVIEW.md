# STS/DS template ve sentetik Secret normal UI kabulü

Product source freeze `0f5a5ab6b8e52e645b9e2e71dd063112ca105e98`, embedded macOS binary SHA256 `b7417ea5216a88de16e3a2307df55a32470f756a958681eac08643858fdc87cf`, production gateway18410 kullanıldı. İki koşunun source SHA256 değeri `1ef0d1b5f36d2d963a3e72137c8a0e090a0363869ac0dee5e3078057d29a8757`; her koşu kendi öncesi/sonrasında source, helper ve binary eşliğini doğruladı. Ürün/e2e/Git/build değişikliği yapılmadı.

## Koşu geçmişi ve dar tekrar gerekçesi

- `runs/2026-11-09T08-26-30-255Z/result.json`: 08:26:30–08:26:54 UTC. STS PASS; DS helper annotation map'inin tamamını eşit saydığı için FAIL. Fail-fast ile unsupported/Secret aşamaları çalışmadı. Bu orijinal FAIL ve PNG'leri korunur.
- Root'un açık talimatıyla `FROM=daemonset` kullanıldı. `runs/2026-11-09T08-28-50-268Z/result.json`: 08:28:50–08:29:09 UTC, DS + unsupported üç tür + sentetik Secret PASS. STS aynı source/binary kimliğinde önce geçtiği için tekrar çalıştırılmadı; bağlantısı ikinci koşunun `reusedStatefulSet` alanında bulunur.
- Düzeltme yalnız helper kabulündeydi: DS için tam olarak `deprecated.daemonset.template.generation` hariç bütün annotation ve label map'leri karşılaştırılır; tüm template/spec/container/env/probe/volume/affinity alanları, yalnız açıkça değiştirilen ilk container kaynakları dışında, tam içerik eşitliğiyle korunur. Gerçek değişen tek annotation anahtarı budur; değer `1→2`. Başka bilinmeyen alan kontrolü kaldırılmadı. Bu DS metadata farkı bir ürün hatası değildi; aşağıdaki ayrı Job durum etiketi gap'i açık kalır.
- Aşama sınırı300s, sonlu devam işi toplam sınırı480s; otomatik retry/sonsuz test döngüsü yoktur. Aynı kaynakta kabul edilen altı leaf vardır: STS, DS, standaloneRS, Job, CronJob, sentetikSecret. Eski helper FAIL başarıya dönüştürülmedi.

## Gerçek normal UI ve API sonuçları

Kube-system UID `a24740ba-cf3e-461d-b5b3-250deeb060d7` A kümesi ve yalnız owned `kv-repair-v11-forms` namespace'i kullanıldı. Her create/update/cleanup öncesi cluster ve namespace UID/owner denetlendi. Her fixture gerçek UID/RV, `kubeview.io/v11-owner=v11-20261108` ve ayrı forms-role ile kayıtlıdır. Namespace ilk yokluk doğrulanıp CREATE ile kuruldu; var olan objeyi sahiplenme yapılmadı. İki koşu ayrı gerçek namespace UID'leriyle tamamlanıp silindi.

STS/DS finder→panel→CPU/RAM form→serverdryrun→Uygula normal UI yoluyla yürütüldü. İki gerçek container vardır; ilk container kaynakları `5m/100m/8Mi/48Mi` yerine requestCPU20m, limitCPU150m, requestMemory24Mi, limitMemory96Mi oldu. Sidecar dahil tüm diğer alanlar API'den tam karşılaştırıldı. Dry-run gerçek spec'i değiştirmedi. Apply POST202 API kabulünü temsil eder; bağımsız gerçek API sorgusu sonrasında RollingUpdate, observedGeneration2, yeni Pod UID ve tüm container Ready sonucu ayrıca beklendi.

STS UID `58fdf7d1-bc20-4b7d-a936-4f75699f6612`, RV30470→30515; eski Pod `54b7e569-9cc6-4370-b32a-24f960340ee4` → yeni Ready Pod `4e332a26-01a5-483a-811e-ff9f1121cb60`. DS UID `3fd9661c-2560-46c0-9753-cf48e838c0ce`, RV30887→30928; eski Pod `917e6e76-661a-4743-82c2-3c873fd5b3f7` → yeni Ready Pod `71b5583f-4580-454d-9e84-c32e79688eb9`. OnDelete/partition bu dar yeni UI işinde sınanmadı; RollingUpdate PASS'ı o stratejilere taşınmaz.

Standalone ReplicaSet replicas0, suspended Job ve suspended CronJob gerçek API nesneleriydi. Her biri finder'dan açıldı; gerçek capability yanıtı `supported=false/effect=unsupported`, türüne özgü görünür açıklama ve disabled CPU/RAM düğmesi ile eşleşti. Nesnelerin gerçek spec'i değişmedi. Backend422 doğrudan HTTP negatif testi bu UI işinin kapsamı değildir; önceki API kanıtları ayrıdır.

## Secret sınırı

Secret UID `038fd3ab-fc17-45ed-9ecb-1de6035f9212`, RV30939→30941, yalnız üretilmiş sentetik değeri içeriyordu. Plaintext ve base64 beklenen değerler yalnız RAM'de tutuldu; metadata/boolean dışında hiçbir reveal/editor/request/response body kaydedilmedi. Trace/video yoktur. Reveal/editor açıkken screenshot alınmadı; tek Secret PNG'si editor kapatılıp metadata görünümü yeniden açıldıktan ve DOM/input'ların değeri içermediği doğrulandıktan sonra alındı. Hata ve sonuç yazımları da RAM'deki değerleri sızdırma açısından taradı.

Normal UI'da ayrı yetkili reveal gerçek değerle boolean karşılaştırıldı, gizle sonrası DOM'dan temizlendi. Ayrı edit formu gerçek UID/RV/data içerdi ve bilinmeyen annotation'ı korudu. Gerçek reveal yerine canonical maskeli metadata (`keyNames`, data yok) editöre konup dry-run denendi: UI doğrulaması bunu HTTP göndermeden reddetti, gerçek Secret değişmedi. Ardından gerçek RAM içeriğiyle sentetik yeni değer dry-run edildi; API'de değer değişmedi ve önizleme metadata-only kaldı. Gerçek apply200 sonrasında bağımsız GET sentetik yeni değeri ve aynı UID'yi doğruladı; bilinmeyen annotation/label map'leri korundu. Yeniden açılan metadata paneli değeri göstermedi. İki gerçek canonical WS gözleminde data/stringData/sentinel bulunmadı.

Bu, sentetik tek Secret normal UI sınırının kanıtıdır; genel credential taraması veya bütün mevcut kullanıcı Secret'ları için kapsam iddiası değildir.

## Bilinen gap — henüz düzeltilmedi

`job-unsupported.png` içinde fixture Job `spec.suspend=true` ve active0 olduğu hâlde başlık durumu `Çalışıyor` görünür. `frontend/src/workbench/resourceUtils.js` Job durumunda suspend'i değerlendirmiyor; CronJob için ayrı suspend kontrolü vardır. Root bu yanlış-durum kusurunu kabul etti ve mevcut kaynakta çalışan diğer işleri bitirdikten sonra ayrı source/test/build lease'iyle düzeltmeyi planlıyor. Bu forms raporu kusurun giderildiğini iddia etmez. CPU/RAM unsupported kontrolü yine gerçek kind-specific reason ve capability supported=false ile geçmiştir; genel Job durum etiketi bu ayrı açık gap'tir.

Sonraki ayrı kayıt: bu gap32a0468 commit'inde dar kaynak/unit düzeltmesiyle kapatıldı; yeni18094124… embedded binary üzerinde `../status-resume/REVIEW.md` gerçek normal UI Job etiketini doğrular. Bu yeni kanıt, yukarıdaki0f5 kaynaklı forms sonucunu veya screenshot'ını geriye dönük değiştirmez.

## Görsel inceleme ve cleanup

STS dry-run/Ready, DS dry-run ve RS/Job/CronJob unsupported PNG'leri ile `secret-reopened-metadata-only.png` açılıp incelendi. Formda iki container ve farklı kaynak değerleri okunuyor; unsupported açıklama ve disabled düğmeler görünür. Metafor animasyonu API Ready sonucundan ayrı kalıyor. Secret PNG'sinde yalnız kaynak kimliği/label bilgileri yer alıyor; payload yoktur.

Her koşuda controller/Secret nesneleri ve kalan owned child Pod'lar exact UID+resourceVersion DELETE precondition ile silinip GET404 gözlendi; namespace de UID/RV DELETE→404 ile kapandı. Son namespace sorgusu boştu. Browser/context kapandı; cleanup proxy PID17135 ve19217 için son ps boştu. Aktif forms test/browser/proxy ve kalan forms fixture yoktur. Başka worker'ın kaynaklarına dokunulmadı. Bu rapor sonrası yeni bir iş ancak root'un ayrı lease'iyle başlatılır.
