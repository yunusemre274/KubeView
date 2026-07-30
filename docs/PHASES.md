# PHASES.md — Geliştirme Fazları (3D Vizyon Revizyonu)

Proje, KISS (Keep It Simple, Stupid) prensibine uygun olarak küçük, bağımsız ve test edilebilir fazlara bölünmüştür. 3D kapsam genişlemesiyle birlikte fazlar yeniden yapılandırılmıştır.

---

## 🟢 Faz 1: Read-Only Backend & K8s API Bağlantısı (Tamamlandı)
- **Hedef:** Kubernetes API Server'a `client-go` Informer/Watch pattern ile bağlanıp Node ve Pod olaylarını dinlemek.
- **Aktif Agent'lar:** `backend-agent`, `devops-agent`, `security-agent`.

---

## 🟢 Faz 2: WebSocket Veri Akışı & API Şeması (Tamamlandı)
- **Hedef:** Backend'de yakalanan K8s event'lerini ve ilk küme durumunu WebSocket üzerinden istemcilere yayınlamak.
- **Aktif Agent'lar:** `backend-agent`, `integration-agent`.

---

## 🟢 Faz 3: Temel 3D Sahne, Serbest Kamera & Dış Mekan Mimarisi (Tamamlandı)
- **Hedef:** React + Three.js (R3F) ile 3D deniz, liman iskelesi, Master Node binası, Kube-proxy yapısı ve 3D kargo gemilerini dış mekan olarak çizmek ve serbest OrbitControls kamera navigasyonu sunmak.
- **Aktif Agent'lar:** `3d-scene-agent`, `ui-ux-agent`, `architecture-agent`.

---

## 🟢 Faz 4: WebSocket Canlı 3D Güncelleme & Animasyon (Tamamlandı)
- **Hedef:** WebSocket'ten gelen canlı verilerle 3D sahnede kargo yükleme/silinme animasyonlarını ve durum renklerini (Yeşil, Sarı, Kırmızı) canlı güncellemek.
- **Aktif Agent'lar:** `3d-scene-agent`, `backend-agent`, `integration-agent`.

---

## 🟢 Faz 5: Kaynak Metrikleri (CPU/RAM) & 3D Metrik Göstergeleri (Tamamlandı)
- **Hedef:** `metrics.k8s.io` API'sinden gelen CPU/RAM kullanım verilerini gemi bacalarındaki duman ve güverte çubuklarına yansıtmak.
- **Aktif Agent'lar:** `backend-agent`, `3d-scene-agent`.

---

## 🟢 Faz 6: Deployment & Scaling Görselleştirmesi (Tamamlandı)
- **Hedef:** Deployment ve ReplicaSet objelerini "📜 Sefer Siparişleri" paneli olarak ekrana eklemek.
- **Aktif Agent'lar:** `backend-agent`, `ui-ux-agent`.

---

## 🟢 Faz 7: Multi-Namespace & Liman Anonsları (Events) (Tamamlandı)
- **Hedef:** Namespace filtresi (Ambar Seçici) ve canlı K8s Event anonsları bandı eklemek.
- **Aktif Agent'lar:** `backend-agent`, `ui-ux-agent`, `doc-agent`.

---

## 🔵 Faz 8: Otomatik Port Çakışma Yönetimi (Auto Port Detect & Fallback) (Aktif)
- **Hedef:** Backend ve Frontend başlatılırken varsayılan portun (örn. 8000 veya 5173) dolu olması durumunda otomatik olarak bir sonraki boş portu bulup ona bağlanması ve kullanıcıya açıkça bildirmesi.
- **Aktif Agent'lar:** `backend-agent`, `ui-ux-agent`, `architecture-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Backend 8000 portu doluysa otomatik olarak 8001, 8002... arayarak boş portta başlatılmalı.
  - [ ] Terminal konsolunda ve HTTP `/healthz` yanıtında kullanılan port açıkça duyurulmalı.
  - [ ] Frontend WebSocket adresi dinamik port algılama ile sorunsuz bağlanmalı.

---

## 🟡 Faz 9: Girilebilir Binalar & İç Mekan (Interior) Sahne Geçişleri
- **Hedef:** Master Node yönetim binasına ve Worker Node gemilerinin içine "girilebilir" yapılması; kullanıcı tıkladığında akıcı bir kamera geçişi ile iç mekana geçilmesi.
- **Aktif Agent'lar:** `3d-scene-agent`, `ui-ux-agent`, `architecture-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Master Node binasına tıklandığında kamera bina içine girmeli; içeride kontrol paneli ekranları ve dışarıdaki gemileri gören pencereler render edilmeli.
  - [ ] Gemilere (Worker Node) tıklandığında gemi içine girilmeli; dümenci (Kubelet) ve kargo paletleri iç mekanda detaylı görünmeli.
  - [ ] "Kuşbakışı Genel Mimarisi" butonu ile her an dış dünya genel görünümüne sorunsuz dönülebilmeli.

---

## 🟡 Faz 10: Ağ Trafiği Görselleştirmesi & Network Policy Haritası
- **Hedef:** Kube-proxy yapısını bağımsız Ağ Binası olarak çizmek, Pod'lar arası canlı ağ trafiğini 3D ışık çizgileriyle göstermek ve Network Policy kurallarını gümrük politikaları olarak görselleştirmek.
- **Aktif Agent'lar:** `networking-agent`, `3d-scene-agent`, `backend-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Kube-proxy ağ binası 3D sahnede özel telsiz/ağ kuleleri ile yer almalı.
  - [ ] Pod'lar arası veri paketleri 3D ışık hüzmeleri şeklinde akmalı.
  - [ ] Engellenen veya izin verilen NetworkPolicy kuralları renkli 3D gümrük bariyerleri olarak görünmeli.

---

## 🟡 Faz 11: UI/UX Cilalama (Polish), Production Build & Helm Chart
- **Hedef:** Görsel kaliteyi 60 FPS standartlarında cilalamak, multi-stage Dockerfile ve Helm Chart paketini güncellemek.
- **Aktif Agent'lar:** `ui-ux-agent`, `devops-agent`, `security-agent`, `release-agent`, `master-agent`.
