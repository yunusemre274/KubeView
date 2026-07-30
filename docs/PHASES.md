# PHASES.md — Geliştirme Fazları

Proje, KISS (Keep It Simple, Stupid) prensibine uygun olarak küçük, bağımsız ve test edilebilir fazlara bölünmüştür.

---

## 📍 Faz 1: Read-Only Backend & Kubernetes API Bağlantısı (İskelet)
- **Hedef:** Kubernetes API Server'a `client-go` Informer/Watch pattern ile bağlanıp varsayılan namespace'teki Node ve Pod olaylarını konsola loglamak.
- **Aktif Agent'lar:** `master-agent`, `backend-agent`, `devops-agent`, `security-agent`, `code-review-agent`, `qa-agent`, `doc-agent`, `release-agent`. *(Frontend agent henüz aktif değil)*.
- **Bitti Sayılma Kriterleri:**
  - [ ] RBAC manifesti (`ServiceAccount`, `ClusterRole`, `ClusterRoleBinding`) eksiksiz tanımlanmış ve sadece `get`, `list`, `watch` izinlerini içermeli.
  - [ ] Go backend `client-go` kullanarak cluster içi (in-cluster) ve cluster dışı (`~/.kube/config`) ortamda sorunsuz başlatılabilmeli.
  - [ ] Yeni bir pod başladığında veya silindiğinde backend konsolunda anlık JSON log düşmeli.
  - [ ] Unit testler başarıyla çalışmalı.
- **Kapsam DIŞI:** WebSocket sunucusu, Frontend, Metrikler, 3D Render.

---

## 📍 Faz 2: WebSocket Veri Akışı & API Şeması
- **Hedef:** Backend'de yakalanan Kubernetes event'lerini standart bir JSON veri sözleşmesi üzerinden WebSocket aracılığıyla istemcilere yayınlamak.
- **Aktif Agent'lar:** `backend-agent`, `integration-agent`, `security-agent`, `code-review-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] WebSocket endpoint'i (`/ws`) yayın hayatına geçmeli.
  - [ ] `integration-agent` tarafından tanımlanan `EventMessage` JSON şeması tam olarak uygulanmalı (`type`, `object`, `payload`, `timestamp`).
  - [ ] İstemci bağlandığında mevcut Cluster state'i (Initial State Dump) tek seferde gönderilmeli, ardından delta güncellemeleri akmalı.
  - [ ] Birden fazla eşzamanlı WebSocket bağlantısı sorunsuz yönetilmeli.
- **Kapsam DIŞI:** 3D Görselleştirme, UI bileşenleri, Metrik API entegrasyonu.

---

## 📍 Faz 3: Statik 3D Sahne & Tek Node/Pod Render
- **Hedef:** React + Three.js (React Three Fiber) ile temel tersane (liman deniz yüzeyi, 1 adet gemi/node ve 1 adet kargo paleti/pod) sahnelerini statik olarak ekrana çizmek.
- **Aktif Agent'lar:** `frontend-agent`, `integration-agent`, `architecture-agent`, `code-review-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] React 18 + Vite + Three.js projesi sıfır hata ile derlenmeli.
  - [ ] Deniz, liman dock alanı ve 3D Gemi (Node) modeli ekranda doğru ışıklandırma ile görüntülenmeli.
  - [ ] Statik bir Pod verisi 3D kargo kutusu olarak geminin üstüne yerleşebilmeli.
  - [ ] Kamerayı döndürme, yakınlaştırma (OrbitControls) çalışmalı.
- **Kapsam DIŞI:** Canlı WebSocket bağlantısı, Animasyonlar, Metrikler.

---

## 📍 Faz 4: Canlı Güncelleme & Animasyon Entegrasyonu
- **Hedef:** WebSocket'ten gelen canlı verileri 3D sahne ile birleştirerek yeni Pod yükleme, silinme ve durum değişim animasyonlarını tetiklemek.
- **Aktif Agent'lar:** `frontend-agent`, `backend-agent`, `integration-agent`, `qa-agent`, `code-review-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Frontend WebSocket sunucusuna otomatik bağlanmalı ve kopma durumunda reconnect olmalı.
  - [ ] Yeni Pod oluşturulduğunda kargo paletinin gemiye inme animasyonu oynatılmalı.
  - [ ] Pod silindiğinde kargo kutusu yumuşak bir fade/kaybolma animasyonuyla yok olmalı.
  - [ ] Pod durumuna göre (Running, Pending, Failed) kargo rengi değişmeli (Yeşil, Sarı, Kırmızı).
- **Kapsam DIŞI:** Metrik verileri, HPA, Çoklu Namespace seçimi.

---

## 📍 Faz 5: Kaynak Metrikleri (CPU / Memory) Görselleştirmesi
- **Hedef:** `metrics-server` API'sinden gelen CPU ve RAM kullanım verilerini gemilerin ve kargo kutularının doluluk göstergelerine yansıtmak.
- **Aktif Agent'lar:** `backend-agent`, `frontend-agent`, `integration-agent`, `security-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Backend `metrics.k8s.io` API'sinden node ve pod metriklerini 5 saniyede bir çekmeli.
  - [ ] Gemi (Node) üzerindeki doluluk barları veya bacadan çıkan duman yoğunluğu CPU/RAM kullanımına göre dinamik değişmeli.
  - [ ] Tıklanan kargo kutusunda detay kartı açılıp instant CPU/Memory değeri gösterilmeli.
- **Kapsam DIŞI:** Prometheus uzun süreli geçmiş verileri.

---

## 📍 Faz 6: Deployment & Scaling Görselleştirmesi
- **Hedef:** Deployment ve ReplicaSet objelerini "Sefer Siparişi" panosu olarak ekrana eklemek ve ölçeklenme (Scale Up/Down) animasyonlarını sunmak.
- **Aktif Agent'lar:** `backend-agent`, `frontend-agent`, `integration-agent`, `code-review-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Deployment ve ReplicaSet değişimleri WebSocket üzerinden frontend'e iletilmeli.
  - [ ] Ekranın sol üstünde "Sefer Siparişleri (Deployments)" listesi yer almalı.
  - [ ] Scale-up durumunda sırayla kargo kutularının gemiye yüklenme serisi başlatılmalı.
- **Kapsam DIŞI:** Multi-cluster desteği.

---

## 📍 Faz 7: Çoklu Namespace & Liman Anonsları (Events)
- **Hedef:** Namespace filtresi eklemek ve Kubernetes Event'lerini liman hoparlör anonsları gibi ekran altında canlı akan bandajda göstermek.
- **Aktif Agent'lar:** `backend-agent`, `frontend-agent`, `doc-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Kullanıcı UI üzerinden belirli bir Namespace seçebilmeli veya "Tüm Ambarlar (All Namespaces)" moduna geçebilmeli.
  - [ ] K8s Event'leri (Warning, Normal) ekranın alt kısmında "📢 Liman Anonsu" başlığıyla canlı akmalı.
- **Kapsam DIŞI:** Sesli Türkçe yapay zeka okuma motoru (ileriki yol haritası).

---

## 📍 Faz 8: Cilalama (Polish), Production Build & Helm Chart
- **Hedef:** Tüm uygulamanın Docker imajını oluşturmak, Helm Chart yazmak ve canlı cluster ortamlarında test edip yayınlamak.
- **Aktif Agent'lar:** `devops-agent`, `security-agent`, `doc-agent`, `qa-agent`, `release-agent`, `master-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Çok katmanlı (multi-stage) Dockerfile yazılmalı ve imaj boyutu minimumda tutulmalı (<50MB).
  - [ ] `charts/tersane` altında geçerli ve test edilmiş Helm Chart oluşturulmalı.
  - [ ] Production güvenlik taraması (Trivy / Hadolint) sıfır kritik uyarı vermeli.
  - [ ] README.md ve tüm dokümantasyon nihai sürüme güncellenmeli.
