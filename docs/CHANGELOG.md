# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v1.7.0-scope - Genişletilmiş Pro Kapsam & Otonom Faz Geçiş Kuralları] - 2026-07-30

### Eklendi / Güncellendi
- **METAPHOR.md Oluşturuldu:** 13 yeni K8s kavramının (Ingress, NetworkPolicy, ResourceQuota, HPA, PDB, Taints/Tolerations, Node Affinity, ServiceAccount, RBAC, EndpointSlice, Rolling Update, CRD/Operator, Helm Release) 3D tersane karşılıklarını içeren tek resmi referans belgesi yayınlandı.
- **AGENTS.md Kuralları Güncellendi:**
  - Faz içi ve fazlar arası geçişlerde **otonom faz ilerlemesi** kuralı kabul edildi.
  - Release ve git işlemleri için **tam git yetkilendirmesi** tanımlandı.
- **DECISIONS.md Kararları Güncellendi:**
  - `ADR-012`: RBAC salt-okunur moddan sınırlı yazma yetkili moda (`pods/delete`, `deployments/scale`) güncellendi.
  - `ADR-013`: Olay Günlüğü için son 1 saatlik in-memory ring buffer (KISS prensibi) kabul edildi.
  - `ADR-014`: PNG Ekran görüntüsü dışa aktarma kabul edildi, web paylaşım linki kapsam dışı bırakıldı.
- **Yol Haritası Yeniden Sıralandı:** Faz 16 (Mutasyon & Olay Günlüğü) ile başlayan Faz 16-20 genişletme planı `PHASES.md` ve `ROADMAP.md` belgelerine işlendi.

---

## [v1.6.0 - 2D Control Dashboard, Raycasting Fix & Canlı Ağ Parçacıkları] - 2026-07-30
- 3D->2D lerp geçişli MasterDashboardOverlay konsolu, raycasting stopPropagation düzeltmesi ve canlı ağ parçacıkları eklendi.
