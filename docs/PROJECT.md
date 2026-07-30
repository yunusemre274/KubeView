# PROJECT.md — Proje Vizyonu ve Amacı

## 🚀 Proje Özeti (Elevator Pitch)
**Tersane**, bir Kubernetes cluster'ının canlı durumunu (Node, Pod, Deployment, Service, Event, Metrikler) gerçek zamanlı olarak 3D/İzometrik bir "tersane ve gemi filosu" metaforu üzerinden görselleştiren, cluster içine dağıtılan ve web arayüzünden izlenebilen açık kaynaklı bir eğitim ve gözlemlenebilirlik platformudur.

---

## 🎯 Hedef Kitle
1. **Kubernetes Eğitimi Alanlar & Öğrenciler:** Soyut K8s nesnelerini görsel ve fiziksel bir benzetimle öğrenmek isteyenler.
2. **Teknik Olmayan Paydaşlar & Yöneticiler:** Sistem mimarisini ve canlı kaynak kullanımını karmaşık metin komutları yerine sezgisel bir harita üzerinden takip etmek isteyenler.
3. **DevOps & Platform Mühendisleri:** Canlı sunumlar, demo oturumları ve eğitim workshop'larında sistemi görsel olarak sergilemek isteyen profesyoneller.

---

## 💡 Çözülen Problem
Kubernetes dünyasında `kubectl get pods`, `kubectl describe node` veya grafik ağırlıklı klasik paneller (Grafana, K8s Dashboard) teknik olarak detaylı olsa da:
- Soyut nesneler (Pod, Service, Ingress, ReplicaSet) arasındaki fiziksel ve mantıksal ilişkileri doğrudan göstermez.
- Kubernetes mimarisini öğrenme eğrisini oldukça dikleştirir.
- Bir uygulamanın çökmesi, ölçeklenmesi veya node arızasının sistemdeki gerçek etkisini canlı ve somut bir animasyon olarak sunamaz.

**Tersane**, Kubernetes kavramlarını liman, gemi, kargo paleti ve gümrük kapısı gibi herkesin zihninde canlandırabileceği somut objelerle eşleştirerek bu öğrenme ve takip engelini tamamen ortadan kaldırır.

---

## 🚫 Kapsam DIŞI (Out of Scope)
Projenin genişleyerek odağını kaybetmesini (Scope Creep) engellemek için aşağıdaki konular kesinlikle **kapsam dışıdır**:
1. **Cluster Yönetimi ve Yazma (Write) Operasyonları:** Tersane bir yönetim paneli (K9s veya Dashboard alternatifi) DEĞİLDİR. Pod silme, deployment editleme veya scale-up/down butonları İÇERMEZ. Sistem %100 Read-Only'dir.
2. **Karmaşık Alarm ve Alerting Altyapısı:** PagerDuty, Slack entegrasyonu veya e-posta alarm mekanizmaları geliştirmek kapsam dışıdır.
3. **Log İnceleme ve Log Aggregation:** Pod loglarını `kubectl logs` gibi canlı akan metinler halinde göstermek ilk etapta kapsam dışıdır (Sadece Event anonsları gösterilir).
4. **Ticari Lisanslama & Ücretli Özellikler:** Proje tamamen açık kaynaklı ve topluluk odaklı kalacaktır.

---

## 🏆 Başarı Kriterleri
Tersane projesi aşağıdaki durumlar sağlandığında "başarılı ve işe yarar" kabul edilir:
1. **Sıfır Polling:** API Server üzerindeki tüm nesne değişiklikleri `client-go` Informer yapısıyla milisaniyeler seviyesinde yakalanıp WebSocket ile arayüze iletilmeli.
2. **Kesintisiz 3D Görselleştirme:** En az 50 Pod ve 5 Node bulunan bir cluster'da arayüz 60 FPS akıcılıkla çalışabilmeli.
3. **Tek Komutla Dağıtım:** Cluster'a tek bir `kubectl apply` veya `helm install` komutu ile deploy edilebilmeli.
4. **Güvenli RBAC:** Uygulamanın ClusterRole izinleri kesinlikle sadece `get`, `list`, `watch` yetkilerine sahip olmalı.
