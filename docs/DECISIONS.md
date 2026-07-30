# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Bu belge, Tersane projesinde alınan kritik teknik ve mimari kararların gerekçelerini saklar. Kararlar silinmez; iptal edilenler "İptal Edildi" durumuyla işaretlenir.

---

## 📌 ADR-001: Backend Dili Olarak Go Tercih Edilmesi
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `architecture-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Kubernetes API Server ile iletişim kuracak backend servisinin geliştirilmesi gerekmektedir. Seçenekler arasında Go, Node.js ve Python bulunmaktadır.

### Alınan Karar
Backend geliştirme dili olarak **Go** seçilmiştir.

### Değerlendirilen Alternatifler
- **Node.js (`@kubernetes/client-node`):** JavaScript ekosistemi kolaylık sağlasa da k8s client kütüphanesi Go kadar güncel ve tip güvenli değildir.
- **Python (`kubernetes` client):** Yüksek bellek tüketimi ve async I/O karmaşıklığı nedeniyle elenmiştir.

### Sonuç ve Etki
- `k8s.io/client-go` resmi kütüphanesi sayesinde `SharedInformerFactory` ve yerel event handler desteği mükemmel uyumla kullanılacaktır.
- Düşük RAM kullanımı ve yüksek performans elde edilecektir.

---

## 📌 ADR-002: Kubernetes Veri Çekmede Polling Yerine Informer/Watch Kullanılması
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `backend-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Kubernetes cluster durumunu takip etmek için periyodik API sorgusu (polling) veya WebSocket/HTTP Watch akışı seçenekleri mevcuttur.

### Alınan Karar
API Server'a yük bindirmemek ve sıfır gecikmeli veri almak için **Informer / Watch Pattern** tercih edilmiştir.

### Değerlendirilen Alternatifler
- **Periyodik Polling (Örn. her 3 sn `GET /api/v1/pods`):** API Server'a aşırı yük bindirir, anlık değişimleri kaçırabilir ve ağ bant genişliğini ısraf eder.

### Sonuç ve Etki
- API Server sadece durum değiştiğinde event fırlatır.
- Backend belleğinde local cache tutulabilir ve istemcilere anlık fırlatılabilir.

---

## 📌 ADR-003: Kesin Salt-Okunur (Read-Only) RBAC İlkesi
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `security-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Tersane uygulamasının cluster içerisinde çalışması için ServiceAccount yetkilerine ihtiyacı vardır.

### Alınan Karar
Tersane için oluşturulacak `ClusterRole` nesnesinde izin verilen eylemler (verbs) **SADECE `get`, `list`, `watch`** ile sınırlandırılmıştır. `create`, `update`, `patch`, `delete` gibi yazma yetkileri kesinlikle yasaklanmıştır.

### Değerlendirilen Alternatifler
- **Geniş yetkili ClusterRole (Admin/Edit):** Güvenlik riski oluşturur.

### Sonuç ve Etki
- Uygulama cluster state'ine hiçbir koşulda zarar veremez. Sıfır güvenlik riski sağlanır.
