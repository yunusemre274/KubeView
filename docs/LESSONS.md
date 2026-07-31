# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-012] R3F Geometri Nesnesi Uyumsuzluğu (<prismGeometry>) ve WebGL Context Loss
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `3d-graphics-agent`
- **Ne Yanlış Gitti?:** `StorageDepotMesh.jsx` bileşeninde oluklu ambar çatısını çizmek için `<prismGeometry>` adında bir JSX etiketi kullanılmıştı. Three.js namespace'inde `PrismGeometry` adında yerleşik bir sınıf bulunmadığı için React Three Fiber "PrismGeometry is not part of the THREE namespace! Did you forget to extend?" hatası fırlatıyor, bu hata tüm 3D Canvas'ı çökertip `THREE.WebGLRenderer: Context Lost` hatasına yol açıyor ve tüm 3D sahne siyah görünüyordu.
- **Kök Neden:** R3F intrinsic element listesinde bulunmayan hayali bir geometri isminin doğrudan JSX elementi olarak kullanılması.
- **Nasıl Düzeltildi?:** Oluklu çatı geometrisi Three.js'in yerleşik ve native geometri sınıfı olan 4 segmentli `<coneGeometry args={[4.6, 1.8, 4]} rotation={[0, Math.PI / 4, 0]}>` ile değiştirilerek %100 Three.js uyumlu gabled/beşik çatı elde edildi.
- **Geleceğe Dönük Kural:** Yeni bir R3F JSX geometri/materyal elementi kullanılmadan önce bunun gerçek bir Three.js sınıfına karşılık geldiği doğrulanmalıdır; özel/var olmayan bir isim kullanılacaksa önce `extend()` ile kaydedilmeli veya yerleşik Three.js alternatifleri seçilmelidir.

---

### 🔴 [DERS-011] Çoklu WebSocket Bağlantısı ve Modül Seviyesi Singleton Çözümü
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `web-frontend-agent`
- **Ne Yanlış Gitti?:** Uygulama açıldığında backend loglarında aynı anda 4 ayrı WebSocket istemcisinin bağlandığı (`New client connected` x4) ve hemen ardından hepsinin koptuğu görüldü.
- **Nasıl Düzeltildi?:** Modül seviyesinde TEK bir `singletonManager` nesnesi tanımlanarak `ShipyardClusterProvider` ile tüm bileşenlere dağıtıldı. Backend'e SADECE VE SADECE 1 ADET CANLI WEBSOCKET BAĞLANTISI açılmaktadır.

---

### 🔴 [DERS-010] React State Döngüsü ve StrictMode Nedeniyle WebSocket Anlık Kopması
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `web-frontend-agent`
- **Ne Yanlış Gitti?:** `connect` fonksiyonu `useCallback` bağımlılık dizisinde `[activePort, isConnected]` state değişkenlerini tuttuğu için `setIsConnected(true)` çağrıldığında `useEffect` cleanup'ını tetikleyip soketi kapatıyordu.
- **Nasıl Düzeltildi?:** Bağlantı nesnesi ve bağlanma durumu state yerine `useRef` ile referans bazlı yönetildi.
