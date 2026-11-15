# Gerçek RoleBinding iptali — üretim HTTP/WS yolu

## Karar

**PASS: sahip olunan Kubernetes API + gerçek iki ServiceAccount + production HTTP/WebSocket.** Tarayıcı, final dağıtım binarysi veya upstream watch'ın yalnız heartbeat yüzünden kapandığının kanıtı değildir. Product source `15770296`; ek opt-in testin exact SHA ve komutu `plan.json` içindedir.

## Pozitif ve negatif gözlem

İki600sn TokenRequest kimliği SelfSubjectReview ile doğrulandı. Her biri normal access-session → workspace → connection → harbor yoluyla bağlandı; aynı sentetik Pod UID'sinin snapshot ve kontrollü UPDATE'i geldi. A'nın yalnız bu koşuya ait RoleBinding'i UID/resourceVersion önkoşuluyla silindi. Aynı credential/client ID korunurken gerçek SSAR get/list/watch `Allowed=false`, gerçek Pod API GET403 ve gateway GET403 oldu. SSAR review HTTP403 olarak varsayılmadı. B gerçek GET200 almaya devam etti.

A'nın eski WS'si doğru Pod GVR/namespace için forbidden, non-authoritative ve synced=false bildirdi, ardından gerçek CloseError/EOF ile kapandı; timeout başarı sayılmadı. Bilinen failure'dan sonraki exact UID/RV/annotation canary A'ya yayımlanmadı; aynı UPDATE B'ye ulaştı.18explicit testSSAR ve2controlled Pod update kullanıldı. İlk olumlu olay21:25:27.060Z, gerçek RBAC denial21:25:27.081Z, terminal/peer/canary gözlemi21:25:42.109Z. Bu zamanlar test olay işaretidir; presented UI/CPU ölçümü değildir.

## Temizlik ve sınırlar

Test15,332sn; Go süreç+derleme+ownedcleanup18,574sn. Tek top-level PASS,0SKIP ve paketPASS. `safe-result.json`: failed=false, mainPassed/allSixFixturesAbsent/brokerEmpty/listenerClosed/namespaceNotDeleted/within180Seconds=true. Altı exact fixture UID'si cleanup GET404 ile doğrulandı; iki özgün Node UID/Ready ve güncel lease, profile/state ve namespace seal korundu. Yakalanan test çocuklarının tamamı kapandı; bu kısa ömürlü tüm süreçlerin eksiksiz census'u değildir. Credential/Secret/token/cookie/nonce değerleri kanıtlara alınmadı.

İlk gerçek koşu aynı kaynak ailesinde NodeReadyUnknown önkoşulunda0,024sn'de FAIL oldu; hiçbir fixture oluşturulmadı (`attempt01/safe-test-result.json`). Worker DNS/lease kurtarma ve testin staleReady'ye karşı freshLease koruması sonrasında bu ikinci koşu yapıldı. İlkFAIL, derleme-only sonucu ve helper parse hatası ayrı saklanır; geçene kadar değişkensiz tekrar yapılmadı.

Lab hazırlığındaki hatalar ürün hatası gibi sunulmaz: root helper eski dynamicAPIportu varsaydı; ardından startup timeout sınıflaması, inactive CPkubelet ve `nodeUIDs`/`nodeUids` şema hatası düzeltildi. Her failure sonrası exactownedcontainerSTOP sonuçları korunur. APIdeki eski ReadyTrue tek başına güncel kubelet bağlantısını göstermedi; workerın eksik ownedcontrolplane DNS kaydı düzeltildi ve3ardışık freshLease/Ready kontrolüyle önkoşul sağlandı. Hazırlıklar cold bootstrap veya uygulama E2E PASS değildir.

Root, taslağın privateguard/cleanup sırası, uniqueinactive scheduler (nodeName boş), namespace'in restricted PodSecurity politikasını karşılayan nonroot/seccomp/no-privilege/capability-drop alanları ve freshLease kontrolünü düzeltti. Namespace politikasına dokunulmadı. Ayrı reviewer önceki PSA uyumsuz template'i NO-GO olarak bildirdi; güncel kaynak için o inceleme PARTIAL kaldı. Actual compile+admission+real test ve root source/proof kontrolü ayrı kanıttır.

Periyodik izin yenileme anlık/atomik iptal değildir; önceden verilmiş bilgi geri çağrılamaz. Upstream watch lifetime bağımsız instrument edilmedi. Gerçek API ve toplu SSAR CPU maliyeti, diğer log/exec/forward/flow oturumları, normal UI/çoklu-liman/regresyon ve final paket kapıları ayrı kalır. Genel yayın kararı NOT_RELEASE_READY.
