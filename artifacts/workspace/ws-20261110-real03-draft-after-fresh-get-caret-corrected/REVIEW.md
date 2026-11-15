# Gerçek03 fresh GET / native giriş / same-pod log — dar PASS

Normal macOS Chromium UI koşusu8/8 gözlemle geçti. Runtime frontend `ee974b3b…e559`, dist manifest `4dd698fb…5a0e`; ikisi koşu öncesi/sonrası eşittir. Owned A/B kube-system, namespace, Deployment ve same-pod UID'leri gerçek Kubernetes GET'leriyle doğrulandı. Kubernetes mutasyonu veya dry-run gönderilmedi; taslak yalnız browser belleğindeydi. Önceki5PASS kaydının LIMIT review'u ve yeni ilk caret-helper FAIL sonucu korunur.

| Gözlem | Sonuç |
| --- | --- |
| A → B → A, Deployment same-app | A exact UID ve YAML modu geri geldi; B aynı adlı farklı UID ile salt okunur kaldı, A yönetim niyeti B'ye taşınmadı. |
| Fresh GET tamamlandıktan sonra | İkinci GET200, doğru A UID/namespace, `aria-busy=false`, loading metni yok, editör kullanılabilir. Dirty YAML önceki metinle byte eşit; SHA256 `00f332e1…991`, gönderilmemiş annotation korunuyor. Gerçek GET gövdesinde annotation yok. |
| Native caret / gerçek interior scroll | Fresh GET sonrasında doğal click'in caret383 konumundan iki ArrowLeft381'e geçti; draft değişmedi. Tekerlekle editör scrollTop0→420 oldu. Her iki eylemde kamera/target/quaternion farkı0 ve source aynı. Aynı Canvas korundu. Scroll/caret konumunun liman değişimi boyunca birebir saklandığı iddia edilmez. |
| same-pod log A → B → A | A UID `4f2fa62f…5298`, B UID `44f6c10f…abaa`, tekrar özgün A UID; her biri `web`, doğru harbor/workspace/tab kapsamı, HTTP200. Üç istek de liman değişimi veya panel kapanışında sona erdi. |

Dört PNG açılarak incelendi: `01-A-dirty-form` doğru A/Deployment/YAML formunu; `02-B-own-UID-readonly` doğru B UID ve kapalı edit kontrolünü; `03-A-restored-after-fresh-get-and-native-input` loading'siz kullanılabilir YAML formunu; `04-B-same-pod-own-UID-logs` B/same-pod/web/log sekmesini gösterir. YAML ve log gövdeleri kasıtlı maskelidir; byte eşitliği JSON/hash gözlemine dayanır. Log karesinde0 satır görünür, dolu log payload'ı kanıtı değildir.

Browser context ve browser kapanışı await edildi, helper süreci exit0 ile bitti. Koşu sonu salt okunur süreç taramasında bu helper veya Playwright Chromium süreci yoktu. Playwright WebSocket close-event sayacı1/2 kaldı; bu test kernel TCP/Go heap veya fiziksel sunum gecikmesi ölçmez. Bu dar gerçek UI sonucu bütün F alt şartlarını, yeni frontend genel regresyonunu veya kullanıcının manuel kabulünü kapatmaz. MANUAL:PENDING.
