# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-010] React State Döngüsü ve StrictMode Nedeniyle WebSocket Anlık Kopması
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `web-frontend-agent`
- **Ne Yanlış Gitti?:** Frontend'e girildiği anda WebSocket bağlantısı başarıyla açılıp ilk `INITIAL_STATE` verisi alınıyor, fakat hemen ardından soket istemci tarafından kapatılarak backend tarafında `"Client disconnected"` logu düşüyordu.
- **Kök Neden:** 
  1. `useShipyardWebSocket` hook'undaki `connect` fonksiyonu `useCallback` bağımlılık dizisinde `[activePort, isConnected]` state değişkenlerini tutuyordu.
  2. Soket açılıp `ws.onopen` çalıştığında `setIsConnected(true)` çağrılarak `isConnected` state'i değiştiriliyor; bu da `connect` fonksiyonunun kimliğini geçersiz kılarak `useEffect` temizleme (cleanup: `wsRef.current.close()`) fonksiyonunu tetikliyor ve soketi anında kapatıyordu.
  3. Soketin kapanması `ws.onclose` handler'ını tetikleyip `setIsConnected(false)` çağırarak döngüsel bir anlık bağlanma/kopma sonsuz döngüsü yaratıyordu.
  4. Ayrıca React `<React.StrictMode>` development modunda çift mount çalıştırdığı için ilk soket daha handshake bitmeden cleanup ile kapatılıyordu.
- **Nasıl Düzeltildi?:**
  1. Bağlantı nesnesi ve bağlanma durumu state yerine `useRef` (`wsRef`, `isConnectingRef`, `activePortRef`) ile referans bazlı yönetildi. `connect` fonksiyonunun bağımlılık dizisindeki mutable state değişkenleri kaldırıldı.
  2. WebSocket açılırken halihazırda `CONNECTING` veya `OPEN` durumunda bir soket olup olmadığı kontrol edilerek mükerrer bağlantılar engellendi.
  3. `ws.onmessage` içerisindeki JSON parse ve payload işleme adımları `try/catch` ile korumaya alınarak olası parsing hatalarının bileşenleri unmount etmesi önlendi.
- **Geleceğe Dönük Kural:** React hook'larında WebSocket bağlantı döngüleri asla mutable state değişkenlerini (`isConnected`) callback/effect bağımlılık dizilerine eklememelidir. Bağlantı lifecycle'ı her zaman `useRef` ile referans bazlı yönetilmelidir.

---

### 🔴 [DERS-009] minikube (Docker Driver) API Server Port Değişimi ve Otomatik Kubeconfig Yeniden Yükleme
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `k8s-resilience-agent`
- **Ne Yanlış Gitti?:** minikube (özellikle Docker driver ile) her `minikube stop && minikube start` yapıldığında K8s API sunucusuna rastgele yeni bir host portu atar. Backend rest.Config adresini sadece açılışta bir kez okuyup önbelleğe aldığında, port değiştiğinde sonsuz `connection refused` hatasında takılı kalıyordu.
- **Kök Neden:** API sunucu adresi ve istemcisinin (clientset) dinamik port değişimlerine karşı diskteki `~/.kube/config` dosyasını yeniden okuma mekanizmasının bulunmaması.
- **Nasıl Düzeltildi?:** Backend'e 3 ardışık bağlantı/sync hatası sonrası `~/.kube/config` dosyasını diskten yeniden okuma ve process restart gerektirmeksizin yeni clientset oluşturma mekanizması kuruldu.
- **Geleceğe Dönük Kural:** K8s istemcileri API sunucu adresini static kabul etmemeli; ardışık bağlantı kayıplarında diskteki kubeconfig güncellemeleri kontrol edilerek dinamik re-connection sağlanmalıdır.
