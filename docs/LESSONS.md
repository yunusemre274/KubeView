# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-011] Çoklu WebSocket Bağlantısı ve Modül Seviyesi Singleton Çözümü
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `web-frontend-agent`
- **Ne Yanlış Gitti?:** Uygulama açıldığında backend loglarında aynı anda 4 ayrı WebSocket istemcisinin bağlandığı (`New client connected` x4) ve hemen ardından hepsinin koptuğu (`Client disconnected` x4) görüldü.
- **Kök Neden:** 
  1. Her alt bileşen veya hook kendi içinde bağımsız `new WebSocket()` çağrısı yapıyordu.
  2. React `<React.StrictMode>` development ortamında 2x mount çalıştırdığından, bağımsız bağlantı noktaları 2 ile çarpılarak backend'e 4 eşzamansız soket açılmasına ve döngüsel kopmalara yol açıyordu.
- **Nasıl Düzeltildi?:**
  1. `frontend/src/context/ShipyardClusterContext.jsx` dosyası oluşturularak modül seviyesinde TEK bir `singletonManager` nesnesi tanımlandı (React render ağacının dışında).
  2. `ShipyardClusterProvider` bileşeni uygulama kökünde (`main.jsx`) sarılarak tek bir WebSocket bağlantısı kuruldu.
  3. Mükerrer socket kontrolleri (`rs === WebSocket.CONNECTING || rs === WebSocket.OPEN`) modül seviyesinde sağlandığı için React StrictMode 2x mount etse dahi backend'e SADECE VE SADECE 1 ADET CANLI WEBSOCKET BAĞLANTISI açılmaktadır.
- **Geleceğe Dönük Kural:** Her component kendi WebSocket bağlantısını açarsa, hem gereksiz çoklu bağlantılara hem de senkronize olmayan state'e yol açar. Gerçek zamanlı canlı veri bağlantıları HER ZAMAN uygulama kökünde TEK bir Singleton Connection Manager + Context Provider ile kurulup bileşenler tarafından paylaşılmalıdır.

---

### 🔴 [DERS-010] React State Döngüsü ve StrictMode Nedeniyle WebSocket Anlık Kopması
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `web-frontend-agent`
- **Ne Yanlış Gitti?:** Frontend'e girildiği anda WebSocket bağlantısı başarıyla açılıp ilk `INITIAL_STATE` verisi alınıyor, fakat hemen ardından soket istemci tarafından kapatılarak backend tarafında `"Client disconnected"` logu düşüyordu.
- **Kök Neden:** `useShipyardWebSocket` hook'undaki `connect` fonksiyonu `useCallback` bağımlılık dizisinde `[activePort, isConnected]` state değişkenlerini tutuyordu. Soket açılıp `ws.onopen` çalıştığında `setIsConnected(true)` çağrılarak `isConnected` state'i değiştiriliyor; bu da `connect` fonksiyonunun kimliğini geçersiz kılarak `useEffect` temizleme (cleanup: `wsRef.current.close()`) fonksiyonunu tetikliyor ve soketi anında kapatıyordu.
- **Nasıl Düzeltildi?:** Bağlantı nesnesi ve bağlanma durumu state yerine `useRef` ile referans bazlı yönetildi.
- **Geleceğe Dönük Kural:** React hook'larında WebSocket bağlantı döngüleri asla mutable state değişkenlerini (`isConnected`) callback/effect bağımlılık dizilerine eklememelidir.

---

### 🔴 [DERS-009] minikube (Docker Driver) API Server Port Değişimi ve Otomatik Kubeconfig Yeniden Yükleme
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `k8s-resilience-agent`
- **Ne Yanlış Gitti?:** minikube (özellikle Docker driver ile) her `minikube stop && minikube start` yapıldığında K8s API sunucusuna rastgele yeni bir host portu atar. Backend rest.Config adresini sadece açılışta bir kez okuyup önbelleğe aldığında, port değiştiğinde sonsuz `connection refused` hatasında takılı kalıyordu.
- **Nasıl Düzeltildi?:** Backend'e 3 ardışık bağlantı/sync hatası sonrası `~/.kube/config` dosyasını diskten yeniden okuma ve process restart gerektirmeksizin yeni clientset oluşturma mekanizması kuruldu.
