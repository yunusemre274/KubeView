# AGENTS.md — Tüm Ajanlar İçin Ortak Kurallar Rehberi (Canlı 3D Liman Motoru)

Bu dosya, Tersane projesinde görev alan tüm yapay zeka ajanlarının (worker agent & master agent) uymak zorunda olduğu **kesin ve esnetilemez mühendislik kurallarını** içerir.

---

## 🎯 1. Temel İlkeler

1. **Obje Genişletme & Regresyon Önleme Kuralı (KESİN KURAL):**
   - **Yeni bir bilgi alanı veya özellik eklenirken, ilgili state/props/JSX veri objesi ASLA sıfırdan REPLACE EDİLMEZ!**
   - Mevcut alanlar korunarak (`...spread` veya ek JSX blokları ile) genişletilir.
2. **Uygulama Geneli Tek Paylaşılan WebSocket Singleton Kuralı (SINGLETON WEBSOCKET MANAGER):**
   - **WebSocket bağlantıları asla alt bileşenlerde veya tekrarlayan custom hook'larda ayrı ayrı `new WebSocket()` çağrılarak AÇILAMAZ!**
   - Her zaman uygulama kökünde (`main.jsx`) `ShipyardClusterContext` içerisindeki modül seviyesi `singletonManager` ile TEK BİR KEZ kurulur.
   - React StrictMode 2x mount etse dahi `singletonManager` socket state ve ref kontrolleri sayesinde backend'e SADECE VE SADECE 1 ADET CANLI SOKET açılır. Tüm alt bileşenler (3D sahne, paneller, grafikler) bu tek paylaşılan Context state'ini salt-okunur tüketir.
3. **WebSocket & Canlı Yayın Akışı Yaşam Döngüsü Kuralı (STATE LOOP VE UNMOUNT ÖNLEME):**
   - **WebSocket ve event stream bağlantıları React `useEffect` ve `useCallback` içinde tutulurken asla mutable state değişkenleri (`isConnected`, `activePort`) callback bağımlılık dizilerine (`deps`) eklenmez!**
   - WebSocket `onmessage` ve JSON parse blokları istisnasız `try/catch` ile sarmalanarak unmount/disconnect döngüleri engellenmelidir.
4. **Otonom Faz Geçişleri:**
   - Bir faz İÇİNDEKİ görevler arasında VE bir fazdan bir sonraki faza geçişte kullanıcı onayı BEKLENMEZ.
5. **Git Yetkilendirmesi (TAM YETKİ KURALI):**
   - `release-agent`, commit, branch, merge ve push işlemlerini TAM YETKİYLE otonom gerçekleştirebilir (`git push --force` yasaktır).
6. **3D Event Propagation & Raycasting Hit-Test:**
   - İç içe 3D nesnelerde tıklama (`onClick`) ve hover (`onPointerOver`) event handler'larında `e.stopPropagation()` çağrılmak ZORUNDADIR!
7. **Absolute Overlay Paneller & Sıfır Canvas Resize:**
   - Yan paneller ve bilgi kartları hiçbir zaman canvas ile flex/grid yer paylaşımı yapamaz. Canvas her zaman `position: absolute; inset: 0;` olarak render edilir.
8. **Unbroken 100% Height Chain & Canvas Boyutu:**
   - `html, body, #root, main` ve `.stage-wrapper` kapsayıcılarında `height: 100%` ve flexbox `min-height: 0` zinciri KESİNTİSİZ korunmalıdır.
9. **KISS Prensibi:**
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
