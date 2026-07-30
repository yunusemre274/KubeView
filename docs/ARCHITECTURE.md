# ARCHITECTURE.md — Aktif Mimarisi (Faz 13 - Kesin Ekran Yerleşimi & K8s Veri Şeması)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 13** ve güncellenmiş Kesin Ekran Yerleşimi ile Nesne Bazlı K8s Bilgi Kartı Şemasını tanımlar. Kod yapısı değiştikçe bu dosya `architecture-agent` tarafından güncellenir.

---

## 🏛️ Kesin Ekran Yerleşimi ve Yüzdeler

```
+-----------------------------------------------------------------------------------+
| EKRAN (VIEWPORT - %100 YÜKSEKLİK & GENİŞLİK)                                      |
|                                                                                   |
|  [⚓ TERSANE LOGO ROZETİ] -> Sol Üst İnce Rozet (< %3-4 Alan)                     |
|                                                                                   |
|  KATMAN 1: 3D SAHNE (VARSAYILAN DURUMDA EKRANIN %100'Ü)                           |
|  - Canlı Mavi Deniz, Zenginleştirilmiş Liman Mimarisi, Çoklu Vinçler, Depolar     |
|  - Karada Bekleyen Konteynır Yığınları (Pending Pod Metaforu)                     |
|  - Su Üstünde Salınım Yapan Kargo Gemileri (Node'lar & Pod Grid)                  |
|                                                                                   |
|                                                    +------------------------------+
|                                                    | KATMAN 2: DİKEY BİLGİ KARTI  |
|                                                    | (%100 Height, ~%15 Width)    |
|                                                    | (Sadece tıklanınca açılır)   |
|                                                    +------------------------------+
|                                                                                   |
|  [ 🦅 TÜM LİMAN | 🏢 YÖNETİM | 🚢 GEMİ 1 | 🚢 GEMİ 2 ] -> Alt Bar (< %6-8 Height)|
+-----------------------------------------------------------------------------------+
```

- **Varsayılan Durum:** Ekranın **%100'ü 3D canvas** tarafından kullanılır. Kalıcı başlık panelleri, sayaç kutuları veya deployment listeleri ekranda DURMAZ.
- **Sağ Bilgi Kartı Çekmecesi:** Bir 3D nesneye tıklandığında ekranın en sağında **dikey tam yükseklikte (%100 height)** ve ekran genişliğinin **~%15'i (~280-320px)** kadar bir şerit halinde açılır. Kapatma butonuna (`X`) basılınca 3D sahne tekrar %100 genişliğe döner. 3D sahne çekmece açıkken %85 alanda görünmeye devam eder.

---

## 📋 Bilgi Kartı İçerik Şeması (K8s Nesne Tipine Göre)

### 1. Konteynır (Pod/Container) Tıklanınca:
- **Pod Bilgisi:** Pod Adı, Namespace, Hangi Node Üzerinde Çalıştığı.
- **Container Listesi:** İsim, İmaj (`image`), Durum (`Running/Pending/CrashLoopBackOff`), Restart Sayısı.
- **Ağ Bilgisi:** Pod IP Adresi, Bağlı olduğu Service ClusterIP ve FQDN DNS adı (`service.namespace.svc.cluster.local`).
- **Kaynaklar:** CPU/RAM Kullanımı + Limit/Request değerleri.
- **Durum:** Pod Durumu ve Son Event Loglar.

### 2. Gemi (Worker Node) Tıklanınca:
- **Node Bilgisi:** Node Adı, Durum (`Ready/NotReady`), IP Adresi.
- **Kapasite & Kullanım:** Toplam CPU/RAM Kapasitesi vs O Anki Kullanım Miktarı.
- **Pod Listesi:** Üzerinde çalışan toplam pod sayısı ve pod isim listesi.
- **Servis Sağlığı:** Üzerindeki Kubelet ve Kube-proxy durumu.

### 3. Kontrol Kulesi (Master Node) Tıklanınca:
- **Cluster Özeti:** Toplam Worker Node (Gemi) sayısı ve bağlı kapasite.
- **Control Plane Bileşen Sağlığı:** API Server, etcd, Scheduler, Controller Manager (Healthy/Unhealthy).
- **Cluster Nesne Sayıları:** Toplam Pod, Deployment ve Service sayıları.
- **Cluster Yük Dağılımı:** Genel CPU/RAM kullanım özeti.

### 4. Vinç (Kube-Scheduler) Tıklanınca:
- **Sevkiyat Kararları:** Son zamanlanan Pod'lar, hangi scheduling kararına göre hangi Node'a atandığı.

### 5. Kube-Proxy Ağ Binası Tıklanınca:
- **Ağ Yönlendirmeleri:** Aktif Service listesi, ClusterIP haritası ve yönlendirilen Pod Endpoints listesi.
