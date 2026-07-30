# PROJECT.md — Proje Vizyonu ve Amacı

## 🚀 Proje Özeti (Elevator Pitch)
**Tersane**, bir Kubernetes cluster'ının canlı durumunu (Node'lar, Pod'lar, Deployment'lar, Service'ler, Network Policy'ler, Kaynak Metrikleri ve Event'ler) gerçek zamanlı olarak **tam 3D, girilebilir binalar ve gemi filosu** metaforu üzerinden görselleştiren, serbest kamera navigasyonu ve iç mekan (interior) görünümleri sunan, cluster içine dağıtılan ve web arayüzünden izlenebilen açık kaynaklı bir eğitim ve gözlemlenebilirlik platformudur.

---

## 🎯 Hedef Kitle
1. **Kubernetes Eğitimi Alanlar & Öğrenciler:** Soyut K8s nesnelerini 3D mekanlar (yönetim binası, kontrol kulesi, gemiler ve ambarlar) içerisinde doğrudan gezerek ve içlerine girerek öğrenmek isteyenler.
2. **Teknik Olmayan Paydaşlar & Yöneticiler:** Sistem mimarisini, ağ trafiği akışını ve canlı kaynak kullanımını kuşbakışı genel görünüm veya birinci şahıs modunda sezgisel olarak takip etmek isteyenler.
3. **DevOps & Platform Mühendisleri:** Canlı sunumlar, demo oturumları ve eğitim workshop'larında sistemi görsel ve etkileyici bir 3D dünya olarak sergilemek isteyen profesyoneller.

---

## 💡 Çözülen Problem
Kubernetes dünyasında `kubectl get pods`, `kubectl describe node` veya metin/grafik ağırlıklı klasik paneller (Grafana, K8s Dashboard) teknik olarak detaylı olsa da:
- Soyut nesneler (Pod, Service, Ingress, NetworkPolicy, ReplicaSet) arasındaki fiziksel ve ağ ilişkilerini 3D uzayda göstermez.
- Kubernetes mimarisini öğrenme eğrisini oldukça dikleştirir.
- Bir uygulamanın çökmesi, ölçeklenmesi veya ağ trafiğinin engellenmesinin sistemdeki gerçek etkisini canlı, girilebilir ve somut bir 3D simülasyon olarak sunamaz.

**Tersane**, Kubernetes kavramlarını liman, girilebilir yönetim binaları, dümencili gemiler, kargo paletleri ve gümrük kapıları gibi herkesin zihninde canlandırabileceği 3D mekanlarla eşleştirerek bu öğrenme ve takip engelini tamamen ortadan kaldırır.

---

## ⚓ Tam Güncellenmiş Metafor Eşleştirmesi

| Kubernetes Kavramı | Tersane Metaforu | Açıklama |
| :--- | :--- | :--- |
| **Cluster** | 🏗️ **Tersanenin Tamamı** | Tüm operasyonun gerçekleştiği liman ve tesis alanı |
| **Control Plane / Master Node** | 🏢 **Girilebilir Yönetim Binası** | Kullanıcının içine girip pencerelerden gemileri izlediği ve kontrol panellerine baktığı merkez |
| **API Server** | 🗼 **Kontrol Kulesi / Santral** | Tüm iletişimin geçtiği tek erişim ve doğrulama noktası |
| **etcd** | 👨‍✈️ **Tersane Kaptanı (Baş Kayıtçı)** | Tüm filonun ve tersanenin gerçek durumunu elinde tutan "Tek Doğru" kaynak |
| **Kubelet** | 👨‍✈️⚓ **Geminin Dümencisi / 2. Kaptan** | Kaptandan (etcd/Control Plane) aldığı emirleri gemide uygulayan ve kargo paletlerini yöneten yetkili |
| **Scheduler** | 📦 **Sevkiyat Planlayıcısı** | Hangi kargonun hangi gemiye yükleneceğine karar veren birim |
| **Controller Manager** | 👮 **Denetim Müfettişi** | Hedeflenen kargo sayısı ile mevcut durumu sürekli kıyaslayan birim |
| **Worker Node** | 🚢 **Girilebilir Kargo Gemisi** | İçine girilebilen, dümencisi olan ve kargo paletlerini barındıran işlem birimi |
| **Kube-proxy** | 🏢📻 **Ağ & Telsiz Binası** | Gemiler ve ambarlar arası trafik yönlendirmesini yapan bağımsız ağ yapısı |
| **Network Policy** | 🛂📜 **Gümrük ve Erişim Politikaları** | Ambarlar ve gemiler arası kargo geçiş izinlerini belirleyen güvenlik kuralları |
| **Container Runtime** | ⚙️ **Geminin Makine Dairesi** | Konteynırların fiilen çalışmasını sağlayan motor |
| **Pod** | 🧱 **Palet / Kargo Platformu** | Bir veya birden fazla kargo kutusunu bir arada tutan taşıyıcı |
| **Container** | 📦 **Kargo Kutusu** | Uygulamanın kendisini barındıran tekil birim |
| **Namespace** | 🚪 **Geminin Ambarları / Bölmeleri** | Mantıksal olarak ayrılmış çalışma ve depolama alanları |
| **Deployment** | 📜 **Sefer Siparişi** | Kaç adet paletin taşınacağını bildiren genel talimatname |
| **ReplicaSet** | 🧾 **Sipariş Fişi** | İstenen palet sayısının korunmasını garantileyen alt fiş |
| **Service** | 🎟️ **Liman Gişesi / Yönlendirme Tabelası** | Gelen trafiği doğru ambar ve paletlere yönlendiren kapı |
| **Ingress** | 🛂 **Ana Giriş / Gümrük Kapısı** | Dış dünyadan limana giren ana giriş ve yönlendirme noktası |

---

## 🏆 Başarı Kriterleri (3D & UI/UX Odaklı)
Tersane projesi aşağıdaki kriterler sağlandığında "başarılı ve tamamlanmış" kabul edilir:
1. **Tam 3D & Serbest Kamera Deneyimi:** 2D izometrik değil, kullanıcıların serbestçe uçabildiği, binalara/gemilere yaklaşabildiği, girilebilir mekanlar içeren akıcı 3D simülasyon.
2. **Kusursuz UI/UX Kalitesi:** Arayüzün 60 FPS akıcılıkta, modern glassmorphism kaplamalarla, kafa karıştırmayan geçişlerle ve etkileyici görsel efektlerle çalışması.
3. **Otomatik Port Çakışma Çözümü:** Başlangıçta varsayılan port (örn. 8000) doluysa sistemin otomatik olarak bir sonraki boş portu bulup kullanıcıya açıkça bildirmesi.
4. **Canlı Ağ Trafiği Görselleştirmesi:** Pod'lar ve Node'lar arasındaki ağ trafiğinin ve Network Policy sınırlarının 3D ışık akışları ile gösterilmesi.
5. **Sırf Read-Only RBAC & Sıfır Polling:** API Server'a kesinlikle zarar vermeyen salt-okunur erişim ve `client-go` Informer ile anlık WebSocket akışı.

---

## 🚫 Kapsam DIŞI (Out of Scope)
1. **Cluster Yönetimi ve Yazma (Write) Operasyonları:** Pod silme, deployment editleme veya scale-up/down butonları İÇERMEZ. Sistem %100 Read-Only'dir.
2. **Karmaşık Alarm ve Alerting Altyapısı:** PagerDuty, Slack entegrasyonu veya e-posta alarm mekanizmaları kapsam dışıdır.
3. **Ticari Lisanslama & Ücretli Özellikler:** Proje tamamen açık kaynaklı ve topluluk odaklı kalacaktır.
