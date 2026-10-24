# Tam ekran dünya ve bağlamsal yönetim

## 2026-10-24 ürün kararı

**Ana deneyim %100 etkileşimli limandır. Kalıcı dashboard yoktur.** Önceki sidebar/KPI/split-view tasarımı geçersizdir. `App` tek tam viewport canvas’ı ve onun üzerindeki bağımsız DOM overlay katmanını kurar. Açılışta pencere veya kaynak tablosu yoktur. Sol üst ürün/context rozeti, sağ üst dört yardımcı kontrol ve kapatılabilir kısa rehber bulunur.

Merkez → workload oluştur → gözlenen Pod → gerçek Node gemisine transfer → doğru container → gerçek log zinciri ana akıştır. Gemi → Pod ekle, seçilen Node’u required affinity ile hedefler; merkezden oluşturma scheduler seçimini serbest bırakır. Tablolar, grafikler, YAML ve formlar yalnız geçici nesne pencereleri içindedir.

## Güncel işlev matrisi

| Akış | Güncel uygulama | Kanıt / sınır |
|---|---|---|
| Gerçek kaynak → informer → WS → store | Gerçek; UID ve oturum generation’ı | Backend watcher/snapshot/delete testleri; ayrı test kümesi |
| Tesis → liste / form | Gerçek uygulama işlevi | Sabit tesisler kaynak toplamına eklenmez; boş listede de giriş |
| Gemi / kutu → kaynak | Gerçek UID; kutuda ham container adı | Canvas raycast testleri; dizin kalıcı kimlik değildir |
| Create/edit/delete/dry-run | Gerçek API | UID/RV/RBAC ve namespace kontrolleri |
| Scale/restart/resources/rollback | Gerçek controller işlemleri | API kabulü ve watch sonucu ayrı; HPA ve strategy koruması |
| Node hedefli oluşturma | Gerçek affinity ve scheduler | Her mevcut OR terimine AND; Node UID ön kontrolü |
| Log/exec/port-forward | Gerçek alt kaynaklar | Exec non-TTY; HTTP önizlemede mutlak yollar sınırlı |
| CPU/bellek geçmişi | Gerçek oturum örnekleri | metrics.k8s.io; ölçüm yoksa boşluk; uzun dönem depo yok |
| Demo | Açık seçim, deterministik fixture | Sürekli küçük Demo etiketi; canlı mutasyon kapalı |
| Bulut Node sağlama / Helm / trafik | Eksik ayrı entegrasyon | Bu yetenekler bağlı gibi gösterilmez |

## Referans analizi ve karşılaştırma

`reference_harbor/` içindeki iki görsel açıldı: DESAN tesisli render ve TURKOLINE gemili iskele görünümü. Yeni bir Safari görseli bu dizinde bulunmadı; önceki dashboard ekranları `docs/evidence/` altında tarihsel sorun kaydıdır. Ürüne fotoğraf, logo veya filigran kopyalanmadı.

| Başlık | Referans | Yeni dünya |
|---|---|---|
| Kompozisyon | Bağlı kara, paralel beton rıhtımlar, su havuzları | Ana kara/servis yolu + üç uzun bağlı iskele; kararlı Node slotları |
| Kamera | Eğik kuşbakışı; borda ve tesis birlikte okunur | Yaklaşık 39° başlangıç; gerçek viewport/bounds ile fit; panel açmak kadrajı değiştirmez |
| Gemi | Daralan baş, mavi borda, beyaz köprüüstü | Indexed hull/su hattı/güverte, pencere ve korkuluk; gerçek Pod paletleri |
| Vinç | Sarı/pas kırmızısı ayak, kiriş, ray, trolley | Fiziksel vinç başına tek transfer; halat/spreader; boşken de scheduling girişi |
| Hangar/merkez | Antrasit/sıcak gri metal, yapısal ritim | Oluk/kapı/çatı ayrıntıları; merkez farklı siluetli kontrol kulesi |
| Su | Koyu mavi/yeşil, kontrollü parlama | Yerel normal doku; sürekli tam hız render yok |
| Malzeme | Beton ekleri, mat metal, güvenlik sarısı | Ortak PBR yüzeyler, ray/baba/usturmaça ve servis ekipmanı |
| Işık | Tek güneş yönü ve yumuşak dolgu | Gün ışığı, hemisphere dolgu, kaliteye bağlı gölge |

Prosedürel üretim fotoğraf gerçekçiliği iddiası taşımaz. Kaynak ve yerel font lisansları `frontend/src/harbor/ASSETS.md` içinde.

## Etkileşim ve ölçüler

- Canvas her ekranda `absolute; inset:0`, kök `100dvh`. Gövde kaymaz. Overlay’ler canvas boyutunu değiştirmez.
- Yardımcı kontroller kenardan 12–16 px, 36–40 px yüksekliğinde. Oluşturma eylemleri bu araç çubuğunda toplanmaz.
- Merkez penceresi yaklaşık 880 px / en fazla %78 yükseklik; dünya kenarlarda görünür. İç tablo kendi içinde kayar.
- Node/Pod paneli masaüstünde 400 px, küçük masaüstünde 360 px; dar ekranda %45 alt sheet, kullanıcı isteğiyle %85.
- Yalnız açık “Yaklaş”, “Sahnede göster” veya “Limana dön” kamera hareketi başlatır. Sürüklemede 5 px eşiği seçimi engeller.
- Nesne bulucu ve klavye aynı fiziksel tesis/kaynak akışına bağlanır. Geçici bulucu kalıcı tabloya dönüşmez.
- Gemi → Pod → container geri zinciri tek paneldedir. Form/YAML aynı nesneyi korur; kirli taslak kapanışı onaylanır.
- Namespace bir gemiye ait alan değildir; farklı gemilerdeki yükleri filtreler. Filtre, UID slotlarını ve kanonik sayıları uydurmaz.
- Bekleyen yük yalnız nodeName atanmamış Pod’dur. Assignment gözlenince transfer; ilk snapshot geçmiş yükleri sıraya sokmaz.
- Reduced motion transferleri sadeleştirir. WebGL kaybında retry/düşük kalite ve Bul üzerinden aynı semantik eylemler erişilebilir kalır.

## Panel tasarımı

Açık panel: `#FFFFFF`, metin `#17212F`, yardımcı `#526074`, kenarlık `#DDE3EA`, ana eylem `#2563EB`. Koyu panel: `#111C2E`, metin `#E7EDF5`, yardımcı `#A6B3C5`, kenarlık `#2B3A50`. Dünya gün ışığı korunur. Gövde 14 px, tablo 13 px, yardımcı metin en az 12 px; satır 44 px. Renk durumun tek taşıyıcısı değildir.

Ekranlar `docs/evidence/world/` altında tutulur. Test motoru WebKit, gerçek Safari donanımıyla eşdeğer kanıt olarak sunulmaz. Performans ve tamamlanmamış senaryolar [CAPABILITIES.md](CAPABILITIES.md) içinde belirtilir.
