# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-009] minikube (Docker Driver) API Server Port Değişimi ve Otomatik Kubeconfig Yeniden Yükleme
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `k8s-resilience-agent`
- **Ne Yanlış Gitti?:** minikube (özellikle Docker driver ile) her `minikube stop && minikube start` yapıldığında K8s API sunucusuna rastgele yeni bir host portu (örn. `51234` ➔ `54321`) atar. Backend rest.Config adresini sadece açılışta bir kez okuyup önbelleğe aldığında, port değiştiğinde sonsuz `connection refused` hatasında takılı kalıyor ve kullanıcının backend'i elle yeniden başlatması gerekiyordu.
- **Kök Neden:** API sunucu adresi ve istemcisinin (clientset) dinamik port değişimlerine karşı diskteki `~/.kube/config` dosyasını yeniden okuma mekanizmasının bulunmaması.
- **Nasıl Düzeltildi?:** 
  1. Backend'e 3 ardışık bağlantı/sync hatası sonrası `~/.kube/config` dosyasını diskten yeniden okuma mekanizması eklendi.
  2. Dosyadan okunan API Server adresi mevcut adresten farklıysa (`newHost != currentHost`), backend process'ini yeniden başlatmaya gerek kalmaksızın yeni clientset oluşturulur ve informer'lar otomatik yeni adrese bağlanır.
  3. Bu durum WebSocket üzerinden frontend'e `"🔄 API Server adresi güncellendi. Yeni porta otomatik yeniden bağlanılıyor..."` olarak iletilir.
- **Geleceğe Dönük Kural:** K8s istemcileri API sunucu adresini static kabul etmemeli; ardışık bağlantı kayıplarında diskteki kubeconfig güncellemeleri kontrol edilerek dinamik re-connection sağlanmalıdır.

---

### 🔴 [DERS-008] Çoklu Fixed Çakışması ve Araç Çubuğunun Ekran Genişliğine Sığmaması
- **Tarih:** 2026-07-31
- **Sorumlu Agent:** `ui-ux-agent`
- **Ne Yanlış Gitti?:** Üst bar elemanları 3 ayrı `fixed top-3` bloğu olarak yerleştirildiğinde toplam genişlik ~1600px seviyesine ulaştı. 1440px veya daha küçük ekran çözünürlüklerinde ortadaki araç çubuğu yan bloklarla çakıştı ve `overflow: hidden` nedeniyle ekranın dışına taşarak görünmez hale geldi.
- **Kök Neden:** Üst navigasyon elemanlarının bağımsız fixed bloklar yerine tek bir flex header çubuğunda toplanmaması.
- **Nasıl Düzeltildi?:** Tüm üst elemanlar TEK BİR EKSİKSİZ TAVAN BARI altında birleştirildi.
- **Geleceğe Dönük Kural:** Üst navigasyon elemanları asla ayrı `left-1/2 -translate-x-1/2` fixed bloklar halinde dağıtılmaz; her zaman tek bir duyarlı tavan flex header şeridinde toplanır.
