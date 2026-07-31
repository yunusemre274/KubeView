# AGENTS.md — Tüm Ajanlar İçin Ortak Kurallar Rehberi (Canlı 3D Liman Motoru)

Bu dosya, Tersane projesinde görev alan tüm yapay zeka ajanlarının (worker agent & master agent) uymak zorunda olduğu **kesin ve esnetilemez mühendislik kurallarını** içerir.

---

## 🎯 1. Temel İlkeler

1. **Obje Genişletme & Regresyon Önleme Kuralı (KESİN KURAL):**
   - **Yeni bir bilgi alanı veya özellik eklenirken, ilgili state/props/JSX veri objesi ASLA sıfırdan REPLACE EDİLMEZ!**
   - Mevcut alanlar korunarak (`...spread` veya ek JSX blokları ile) genişletilir.
2. **Centralized 3D Bounding Dimensions & Tiered Stacking Grid Rule (KESİN ÇAKIŞMASIZLIK KURALI):**
   - **3D nesne konumlandırmalarında sihirli sayılar (magic numbers) ve tahmini sabitler KULLANILAMAZ!**
   - Tüm nesne bounding boyutları (`WIDTH`, `HEIGHT`, `LENGTH`, `GAP`) `constants/dimensions.js` dosyasında tanımlanır.
   - Tekrarlayan elemanlar (Pod konteynırları, vinçler, depolar) index tabanlı matematiksel grid fonksiyonları (`calculateContainerDeckPosition`) ile yerleştirilerek sıfır çakışma ve katmanlı dikey (tier-based vertical stacking) istifleme garantilenir.
3. **Uygulama Geneli Tek Paylaşılan WebSocket Singleton Kuralı (SINGLETON WEBSOCKET MANAGER):**
   - **WebSocket bağlantıları asla alt bileşenlerde veya tekrarlayan custom hook'larda ayrı ayrı `new WebSocket()` çağrılarak AÇILAMAZ!**
   - Her zaman uygulama kökünde (`main.jsx`) `ShipyardClusterContext` içerisindeki modül seviyesi `singletonManager` ile TEK BİR KEZ kurulur.
4. **R3F Geometri ve Materyal Doğrulama Kuralı (WEBGL CONTEXT LOSS ÖNLEME):**
   - **Yeni bir 3D React Three Fiber (R3F) bileşeni eklenirken kullanılan tüm JSX `<...Geometry>` ve `<...Material>` etiketlerinin fiilen THREE.js namespace'inde tanımlı intrinsic elementler olduğu doğrulanmalıdır!**
5. **WebSocket & Canlı Yayın Akışı Yaşam Döngüsü Kuralı (STATE LOOP VE UNMOUNT ÖNLEME):**
   - **WebSocket ve event stream bağlantıları React `useEffect` ve `useCallback` içinde tutulurken asla mutable state değişkenleri (`isConnected`, `activePort`) callback bağımlılık dizilerine (`deps`) eklenmez!**
6. **Otonom Faz Geçişleri:**
   - Bir faz İÇİNDEKİ görevler arasında VE bir fazdan bir sonraki faza geçişte kullanıcı onayı BEKLENMEZ.
7. **Git Yetkilendirmesi (TAM YETKİ KURALI):**
   - `release-agent`, commit, branch, merge ve push işlemlerini TAM YETKİYLE otonom gerçekleştirebilir (`git push --force` yasaktır).
8. **3D Event Propagation & Raycasting Hit-Test:**
   - İç içe 3D nesnelerde tıklama (`onClick`) ve hover (`onPointerOver`) event handler'larında `e.stopPropagation()` çağrılmak ZORUNDADIR!
9. **Absolute Overlay Paneller & Sıfır Canvas Resize:**
   - Yan paneller ve bilgi kartları hiçbir zaman canvas ile flex/grid yer paylaşımı yapamaz. Canvas her zaman `position: absolute; inset: 0;` olarak render edilir.
10. **Unbroken 100% Height Chain & Canvas Boyutu:**
    - `html, body, #root, main` ve `.stage-wrapper` kapsayıcılarında `height: 100%` ve flexbox `min-height: 0` zinciri KESİNTİSİZ korunmalıdır.
11. **KISS Prensibi:**
    - En basit çalışan çözüm DOĞRU çözümdür. Olay Günlüğü son 1 saatlik in-memory ring buffer ile tutulur.

---

## 📖 2. Görev Başlangıcı ve Bitiş Protokolü

### 📥 Her Görev Öncesi Okunması ZORUNLU Dosyalar
1. `/docs/PROJECT.md` (Vizyon ve sınırlar)
2. `/docs/ARCHITECTURE.md` (Aktif mimari durum)
3. `/docs/TODO.md` (Aktif görevler)
4. `/docs/DECISIONS.md` (Alınan geçmiş kararlar)
5. `/METAPHOR.md` (Kavram-nesne eşleştirme tablosu)
6. `/AGENTS/AGENTS.md` (Bu kural dosyası)

### 📤 Her Görev Sonrası Güncellenmesi ZORUNLU Dosyalar
1. `/docs/TODO.md` (Tamamlanan görevi işaretle)
2. `/docs/CHANGELOG.md` (Değişikliği kaydet)
3. *(Eğer hata yaşandıysa)* `/docs/LESSONS.md`
