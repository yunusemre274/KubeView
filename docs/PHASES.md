# PHASES.md — Proje Fazları ve Kabul Kriterleri (Genişletilmiş Yol Haritası)

Bu belge, Tersane projesinin tüm geliştirme fazlarını, mantıksal bağımlılık sırasını ve kesin kabul kriterlerini tanımlar.

---

## 🟢 Tamamlanan Fazlar (Faz 1 - Faz 15)
- **Faz 1-12:** Backend Go Informer'lar, WebSocket streaming, React Three.js 3D liman motoru, girilebilir binalar, Kube-proxy ağ yapısı, Helm paketlemesi.
- **Faz 13:** Varsayılan %100 3D Canvas, Çift Header Çözümü (`LESSON-002`), Nesne bazlı K8s müfettiş çekmecesi.
- **Faz 14:** Absolute Overlay Çekmece Mimarisi, CSS Transform animasyonu, sıfır canvas resize (`LESSON-004`).
- **Faz 15:** 3D➔2D Interactive Control Dashboard konsolu, `e.stopPropagation()` Raycasting hit-test düzeltmesi (`LESSON-005`), Dönen 3D Kubelet Radar İkonu ve Canlı Parçacık Ağ Akış Çizgileri (`NetworkTrafficParticles.jsx`).

---

## 🔵 Aktif ve Sıradaki Fazlar (Faz 16 - Faz 20)

### 🟡 Faz 16: Güvenli Mutasyon İzinleri & Halka Arabellek Olay Günlüğü (Event Log)
- **Bağımlılıklar:** Faz 1-15 (Tamamlandı)
- **Sorumlu Agent'lar:** `backend-agent`, `ui-ux-agent`, `devops-agent`
- **Kapsam:**
  1. Backend RBAC yetkilerine `pods/delete` ve `deployments/scale` sınırlı yazma fiilleri ekleme.
  2. UI'da Deployment scale etme (replica +/-), Pod silme ve yeniden başlatma butonları.
  3. Güvenlik önlemleri: Yıkıcı aksiyon öncesi Onay Modalı, Global "Salt İzleme Modu" anahtarı (açıkken tüm mutasyon butonları kilitlenir), kilitli namespace desteği (`kube-system`).
  4. Sağ üstte "Olay Günlüğü" butonu ve dikey overlay paneli (`EventLogDrawer.jsx`).
  5. Tarayıcı belleğinde son 1 saatin olaylarını tutan **in-memory ring buffer** altyapısı.
  6. Günlükteki bir olaya tıklayınca o nesneye kamera lerp odağı ve olay detay kartı gösterimi.
- **Kabul Kriterleri:**
  - Deployment scale ve pod silme aksiyonları onay modalı doğrulaması ile çalışır.
  - "Salt İzleme Modu" aktifken mutasyon butonları UI'da tıklanamaz ve kilitli kalır.
  - Olay günlüğü paneli absolute overlay olarak canvas boyutunu bozmadan açılır.

---

### ⚪ Faz 17: Anomali / Alarm Dramatizasyonu Engine
- **Bağımlılıklar:** Faz 16
- **Sorumlu Agent'lar:** `3d-scene-agent`, `ui-ux-agent`
- **Kapsam:**
  1. **CrashLoopBackOff:** Konteynırdan çıkan 3D duman/alev ve kırmızı flaş parçacık efekti.
  2. **OOMKilled:** Konteynırın anlık şişip patlama/yok olma animasyonu.
  3. **ImagePullBackOff:** Vinci boşta sallanan ve kargoyu arayan sarı vinç animasyonu.
  4. **Pending:** Geminin rıhtıma yanaşamayarak açık denizde demirli beklemesi.
  5. **Evicted:** Konteynırın güverteden denize düşme animasyonu.
  6. **Node NotReady:** Geminin su almaya başlaması ve eğilme animasyonu.
  7. **Self-heal:** Geminin tekrar düzelip rıhtıma yanaşması.
  8. **Readiness Probe Fail:** Rıhtımda beliren kırmızı bayrak uyarısı.
  9. Olay günlüğünden bir anomaliye tıklandığında dramatize animasyonun **tek seferlik (one-shot)** oynatılması.
- **Kabul Kriterleri:**
  - Her 8 anomali durumu 3D sahnede anında ve olay günlüğünden tetiklendiğinde görsel efekt oynatır.

---

### ⚪ Faz 18: Genişletilmiş Kavramlar Katmanı 1 (Network & Security Isolation)
- **Bağımlılıklar:** Faz 17
- **Sorumlu Agent'lar:** `networking-agent`, `3d-scene-agent`
- **Kapsam:**
  1. **Ingress / Gateway API:** Liman ağzındaki Uluslararası Giriş Rıhtımı ve Deniz Feneri.
  2. **NetworkPolicy:** İhlal durumunda beliren 3D kırmızı gümrük bariyerleri.
  3. **ResourceQuota / LimitRange:** Depo ambar duvarındaki maksimum kapasite doluluk çizgileri.
  4. **ServiceAccount & RBAC:** Yetki kimlik kartları ve rozetleri.
  5. **EndpointSlice:** Kube-proxy binasından gemilere uzanan çoklu kablo demetleri.
- **Kabul Kriterleri:**
  - NetworkPolicy ihlalinde kırmızı bariyer belirmeli, Ingress deniz feneri aktif görünmelidir.

---

### ⚪ Faz 19: Genişletilmiş Kavramlar Katmanı 2 (Workload Orchestration & Scheduling)
- **Bağımlılıklar:** Faz 18
- **Sorumlu Agent'lar:** `3d-scene-agent`, `ui-ux-agent`
- **Kapsam:**
  1. **HorizontalPodAutoscaler (HPA):** Pod yükü artıkça otomatik sahaya giren hareketli vinçler.
  2. **PodDisruptionBudget (PDB):** Bakım izinli rıhtım bayrağı.
  3. **Taints / Tolerations:** Özel izinli rıhtım alanları ve uyarı işaretleri.
  4. **Node Affinity / Anti-Affinity:** Magnetik tercih çizgileri.
  5. **Rolling Update:** Gemilerin teker teker sırayla yanaşıp konteynır yenileme animasyonu.
- **Kabul Kriterleri:**
  - Rolling update esnasında gemiler sırayla yanaşır ve yük yeniler.

---

### ⚪ Faz 20: Diğer Genişletmeler (Hubble, Multi-Cluster, PNG Export & Cost Table)
- **Bağımlılıklar:** Faz 19
- **Sorumlu Agent'lar:** `devops-agent`, `ui-ux-agent`, `release-agent`
- **Kapsam:**
  1. **Cilium Hubble / Istio Algılama:** Gelişmiş ağ modu otomatik algılama ve sessiz fallback.
  2. **Multi-Cluster Contexts:** Çoklu kubeconfig bağlamları için üst sekme tersane seçici.
  3. **3D Ekran Görüntüsü Export:** 3D canvas görüntüsünü yerel PNG olarak indirme.
  4. **Statik Maliyet Tablosu:** Node instance tipi bazlı isteğe bağlı saatlik maliyet hesaplama tablosu.
  5. **Custom Resource / Operator & Helm Release:** Özel gemi tipleri ve sefer fişleri.
- **Kabul Kriterleri:**
  - PNG dışa aktarma sorunsuz çalışır, çoklu cluster sekmeleri arası geçiş sağlanır.
