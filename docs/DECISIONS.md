# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Bu belge, Tersane projesinde alınan kritik teknik ve mimari kararların gerekçelerini saklar. Kararlar silinmez; güncellenen kararlar eski referanslarıyla açıkça işaretlenir.

---

## 📌 ADR-001: Backend Dili Olarak Go Tercih Edilmesi
- **Tarih:** 2026-07-30 | **Kararı Alan:** `architecture-agent` (Onay: `master-agent`) | **Durum:** 🟢 **Kabul Edildi**

---

## 📌 ADR-002: Kubernetes Veri Çekmede Polling Yerine Informer/Watch Kullanılması
- **Tarih:** 2026-07-30 | **Kararı Alan:** `backend-agent` (Onay: `master-agent`) | **Durum:** 🟢 **Kabul Edildi**

---

## 📌 ADR-003: Kesin Salt-Okunur (Read-Only) RBAC İlkesi
- **Tarih:** 2026-07-30 | **Kararı Alan:** `security-agent` (Onay: `master-agent`) | **Durum:** 🟢 **Kabul Edildi**

---

## 📌 ADR-004: 2D/Statik Görünümden Tam 3D Simülasyon ve Girilebilir Mekanlara Geçiş
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `architecture-agent` & `3d-scene-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi** (Önceki 2D varsayımı güncellendi)

### Bağlam
İlk tasarımda 2D izometrik veya statik 3D render hedeflenmişti. Ancak kullanıcıların binalara yaklaşması, iç mekanlara girmesi ve serbest kamera ile uçabilmesi ihtiyacı doğdu.

### Alınan Karar
Görselleştirme mimarisi **tam 3D WebGL (Three.js / React Three Fiber)** olarak yenilenmiştir.
- Serbest uçuş ve kuşbakışı genel mimari kamera modları eklendi.
- Master Node Yönetim Binası ve Kargo Gemileri (Worker Nodes) içine girilebilir 3D sahneler olarak tasarlandı.

### Sonuç ve Etki
- Öğrenme ve görsel hafıza etkisi üst seviyeye çıkarıldı.
- Arayüz akıcılığı için 60 FPS performans zorunluluğu getirildi.

---

## 📌 ADR-005: Metafor Revizyonu: Kaptan Rolünün `etcd`'ye Devredilmesi ve Kubelet'in Dümenci Olması
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `master-agent` & `doc-agent`
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Önceki metafor haritasında "Kaptan" rolü Kubelet'e atanmıştı. Ancak etcd, tüm cluster'ın tek doğru (single source of truth) durum kaydını tutan ana birimdir.

### Alınan Karar
- **etcd:** 👨‍✈️ **Tersane Kaptanı (Baş Kayıtçı)** olarak güncellendi. Filonun gerçek durumunu temsil eden tek doğrulanmış kayıt tutucu.
- **Kubelet:** 👨‍✈️⚓ **Geminin Dümencisi / 2. Kaptan** olarak yeniden tanımlandı. Kaptanın (etcd/Control Plane) talimatlarını gemi (node) üzerinde uygulayan birim.

### Açık Soru & Metafor Notu
> *etcd mantıksal olarak Control Plane içerisinde yer alsa da, metaforik olarak tüm filonun "Baş Kaptanı" konumundadır. Kubelet ise tekil geminin (Node) üstündeki "Dümencisi"dir. Bu ayrım hem teknik doğruluğu hem de sezgisel anlaşılabilirliği mükemmel şekilde dengeler.*

---

## 📌 ADR-006: Otomatik Port Çakışma Çözümü (Port Fallback Strategy)
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `backend-agent` & `architecture-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Tersane başlatıldığında varsayılan `8000` (backend) veya `5173` (frontend) portları kullanıcının ortamında başka bir servis tarafından kullanılıyor olabilir.

### Alınan Karar
Sistem başlatılırken port çakışması algılandığında otomatik olarak bir sonraki boş port bulunur (`8000 -> 8001 -> 8002...`).

### Sonuç ve Etki
- Kullanıcı çakışma hatası alıp durmaz, uygulama pürüzsüz başlar.
- Kullanılan port terminal konsolunda ve `/healthz` yanıtında açıkça duyurulur.

---

## 📌 ADR-007: UI/UX Kalitesinin Açık Bir Başarı Kriteri Olarak Kabul Edilmesi
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `ui-ux-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Bir eğitim ve görselleştirme aracında sadece "kodun çalışması" kullanıcı deneyimi açısından yetersizdir.

### Alınan Karar
Arayüzün 60 FPS akıcılıkta çalışması, kafa karıştırmayan kamera geçişleri sunması ve estetik glassmorphism UI kaplamaları barındırması **asli başarı kriteri** olarak kabul edildi.
