# AGENTS.md — Tüm Ajanlar İçin Ortak Kurallar Rehberi (Canlı 3D Liman Motoru)

Bu dosya, Tersane projesinde görev alan tüm yapay zeka ajanlarının (worker agent & master agent) uymak zorunda olduğu **kesin ve esnetilemez mühendislik kurallarını** içerir.

---

## 🎯 1. Temel İlkeler

1. **Obje Genişletme & Regresyon Önleme Kuralı (KESİN KURAL):**
   - **Yeni bir bilgi alanı veya özellik eklenirken, ilgili state/props/JSX veri objesi ASLA sıfırdan REPLACE EDİLMEZ!**
   - Mevcut alanlar korunarak (`...spread` veya ek JSX blokları ile) genişletilir.
2. **3D Hover Tooltip & Görsel Açıklık Kuralı (ZORUNLU GÖRSEL ETİKET KURALI):**
   - **Yeni bir 3D görsel nesne eklendiğinde, o nesnenin ne olduğunu açıklayan bir hover tooltip'i (`OBJECT_DESCRIPTIONS` dictionary), 3D metin etiketi (`<Text>`) ve tıklama ile açılan detaylı bilgi kartı ZORUNLU olarak birlikte eklenmelidir!**
   - Hiçbir nesne kullanıcının "bu ne?" diye soracağı belirsizlikte bırakılamaz.
3. **Anomali Efektleri Canlı Veri Eşleşme Kuralı:**
   - **3D anomali efektleri (duman, patlama, batma) statik kukla string ID'lerine (`pod-1`, `node-2`) bağlanamaz!**
   - Canlı kümeden gelen Pod ve Node verilerinin gerçek nesne isimlerini veya dizilim indekslerini (`index === 0`, `shipIndex === 1`) dinamik hedeflemelidir.
4. **Centralized 3D Bounding Dimensions & Tiered Stacking Grid Rule:**
   - Tüm nesne bounding boyutları (`WIDTH`, `HEIGHT`, `LENGTH`, `GAP`) `constants/dimensions.js` dosyasında tanımlanır.
5. **Uygulama Geneli Tek Paylaşılan WebSocket Singleton Kuralı (SINGLETON WEBSOCKET MANAGER):**
   - WebSocket bağlantıları her zaman uygulama kökünde (`main.jsx`) `ShipyardClusterContext` içerisindeki modül seviyesi `singletonManager` ile TEK BİR KEZ kurulur.
6. **R3F Geometri ve Materyal Doğrulama Kuralı (WEBGL CONTEXT LOSS ÖNLEME):**
   - Kullanılan tüm JSX `<...Geometry>` ve `<...Material>` etiketlerinin fiilen THREE.js namespace'inde tanımlı intrinsic elementler olduğu doğrulanmalıdır.
7. **WebSocket & Canlı Yayın Akışı Yaşam Döngüsü Kuralı:**
   - WebSocket ve event stream bağlantıları React `useEffect` ve `useCallback` içinde tutulurken asla mutable state değişkenleri callback bağımlılık dizilerine eklenmez.
8. **Otonom Faz Geçişleri:**
   - QA kabul kriterleri karşılanıyorsa `master-agent` otonom olarak sıradaki fazı başlatır.
9. **Git Yetkilendirmesi (TAM YETKİ KURALI):**
   - `release-agent`, commit, branch, merge ve push işlemlerini TAM YETKİYLE otonom gerçekleştirebilir (`git push --force` yasaktır).
10. **3D Event Propagation & Raycasting Hit-Test:**
    - İç içe 3D nesnelerde tıklama (`onClick`) ve hover (`onPointerOver`) event handler'larında `e.stopPropagation()` çağrılmak ZORUNDADIR!
11. **Absolute Overlay Paneller & Sıfır Canvas Resize:**
    - Yan paneller ve bilgi kartları hiçbir zaman canvas ile flex/grid yer paylaşımı yapamaz. Canvas her zaman `position: absolute; inset: 0;` olarak render edilir.
12. **KISS Prensibi:**
    - En basit çalışan çözüm DOĞRU çözümdür. Olay Günlüğü son 1 saatlik in-memory ring buffer ile tutulur.
13. **Bütüncül Gemi ve Liman Çakışma Önleme Kuralı (SHIP & HARBOR COLLISION AVOIDANCE RULE):**
    - **Yerleşim veya hareket mantığı geliştirilirken SADECE alt nesneler (konteynır, vinç, depo) değil, hareket eden/konumlanan TÜM nesne tipleri (özellikle gemilerin kendisi ve liman rıhtım sınırları) bütüncül gözden geçirilir!**
    - Gemiler kara rıhtım binalarının kapladığı alanlara (`x < 4.0`) giremez; devriye rotalarında `phaseOffset` ile gemi-gemi çakışması %100 engellenir.

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
