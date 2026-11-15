# Teslim binary'sinde gerçek manual05/06 normal UI — PASS

Tek sonlu Chromium koşusu12.85s'de iki profili/16 kontrolü geçti. Teslim binary SHA256 `2aefef7f…3565` dosyadan doğrulandı; her uygulamanın gerçek HTTP200 index gövdesi `a31eb27d…b471` ile eşleşti. Bu index frontend `ff682d9b…19b9` freeze'ine aittir. Root'un taze official-status receipt SHA256'sı `d48b2cfc…1827`; kubeconfig okunmadı, server/cluster/runner başlatılmadı.

| Profil | Normal kayıt ve gerçek gözlem | Sonuç |
| --- | --- | --- |
|05 arıza/toparlanma |1 liman; doğrulanmış A clusterUID;2 gerçek NodeUID; namespace'e ait özgün PodUID,1 Running Pod/2 Ready container |8 PASS |
|06 limanlar arası ağ |2 liman; aynı A clusterUID ve NodeUID'ler; istemci namespace'inde0 Pod, server namespace'inde özgün1 PodUID |8 PASS |

Public workspace GET bağlantı/context/namespace kayıtlarını, gerçek WS snapshot'ları tam Node/Pod UID kümelerini ve sahiplik etiketlerini doğruladı. Normal Bul üzerinden Node/Pod ve Yönetim Merkezi açılıp kapandı; aynı1440×900/DPR1 Canvas korundu. Kapalı dünyada geçici paneller veya görünür kaynak tablosu yoktu. Demo/TEST/REPLAY görünümü yoktu.06 Pod kartında iki limanın aynı fiziksel Node'u paylaştığı açıklaması görünür.

05 panelleri kapandıktan sonra üretim canvas odağında ArrowRight124ms ve ArrowUp168ms basılı tutuldu. Kamera ile OrbitControls target aynı yatay delta kadar hareket etti; y, zoom ve quaternion açısı korunurken doğru kamera yönünde kaydı. Keyup, gerçek toolbar blur ve keyup öncesi canvas refocus sonrasında kamera/target durdu. Bul textbox'ında native iki ArrowLeft caret'i12→10 taşıdı; kamera/target/zoom/angle farkı0 kaldı. Probe mevcut salt-okunur kamera/controls erişimini kullandı; state veya event enjeksiyonu yapılmadı.

Dört PNG açılarak incelendi:05 kapalı dünya ve Ready2/2 Pod kartı;06 boş istemci dünyası ve gerçek server Pod/paylaşılan Node kartı. Tesis/Node aç-kapat akışları JSON kontrolleridir; bu dört karede bütün adımlar ayrıca resmedilmez.

Runtime error0, console error0, resource/action/management-enable/scenario/port-forward mutasyonu0. Normal `enabled:false` grant resetleri ayrı kaydedildi;06 liman geçişinin1 workspace-view PATCH'i uygulama tercihidir. Helper/browser context kapanışı await edildi ve kalan helper/Playwright browser PID0 kontrol edildi. Root app/A yaşam döngüsünün sahibidir; bu helper onları kapatmadı.

Bu koşu gerçek Kubernetes normal UI başlangıç/panel/klavye kanıtıdır. Crash/recovery, HTTP trafik veya Hubble senaryosu başlatılmadı; CPU/FPS/fiziksel gecikme, geometri leak ayrımı ve20dakika kabulü için sonuç üretmez. MANUAL:PENDING.
