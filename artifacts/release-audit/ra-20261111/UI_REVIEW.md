# Gerçek iki liman — candidate02 incelemesi

Başlangıç36d5b8f, doğruluk checkpoint49999815 üzerine dört runtimeJS dosyası;
exacthashler `candidate02-binary.json` içinde. Binary1003a43a…7bf0; frontend
index29b73d53…34db. Bu, final temiz arşiv testi değildir.

- Yeni private lab `kvml-aed6bc565b30`, clusterUIDa51d8e09…1f91;
  iki ReadyNode, iki owned namespace, iki farklı gerçek PodUID. Mock/replay yok.
- Chromium ve PlaywrightWebKit27.2 ayrı:15/15 işlev assertionı.1440×900,
  1280×800,768×900, DPR1; normal pointer ve finder; merkez tıklaması, doğru
  namespace/UID, tek ve aynı Canvas. HTTPworkspace reddi0; pageerror0.
- Root Chromium world1440/world768/center768, WebKit world768 ve zamanlı video
  karelerini açarak inceledi. Dalga/gemi hareketi, opak SoftUI ve kalıcı dashboard
  olmaması korunur. Kayıt sırasında video açık; CPU/FPS/physical latency iddiası yok.
- Dar global harita eski kaynakta rıhtımları kesiyordu. `global-overview-red.log`
  ve eski world768 korunur. Yeni actualbounds/lens fit rıhtımları kadrajda tutar.

## Başarısız / reddedilen ara kanıtlar

1. İlk baseline helper ağır raycast'i kamera-stability poll'una katıp zaman
   aşımına uğradı. Kamera poll'u yalnız pose okur; ilk kayıt silinmedi.
2. Aktif limana dönüş, dar ekranda global harita değildir. Helper normal
   **Denizi uzaktan gör** eylemiyle düzeltildi; zorla/DOM seçim yapılmadı.
3. İlk candidate helper15assertion PASS'i root görsel incelemesinde kabul
   edilmedi: bazı kareler sync/stale durumundaydı. Canlı beklemesi eklendi.
4. Eski close helper modal üstünden alttaki paneli tıklıyordu; force-click
   kullanılmadan görünür üst pencere önce kapatıldı.
5. Canlı koşuluyla gerçek yanlış-namespace Podaboneliği bulundu. Backend bunu
   reddetti; arayüz Kısmi erişimde kaldı. `ui-scope-diagnostic.json` ve iki
   unitred kaydı kök nedeni ayırır. İlk unit fixture callback'i no-op ile
   örttüğünden geçerli red `harbor-subscription-red-v2.log` dosyasıdır.
6. Candidate02 sourceguard+scopepreflight sonrası iki motor15/15 ve reddedilen
   workspace isteği0. İlk başarısız/PASS helper çıktıları geriye dönük değiştirilmedi.

Nihai package,50geçiş/log/form, nativeSafari/Retina ve kaynak ölçümü ayrı kapılardır.
Kullanıcının MANUAL PASS/FAIL alanı ve stable onayı boş/açık kalır.
