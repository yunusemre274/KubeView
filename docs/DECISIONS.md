# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki teknik seçimlerin meşru gerekçeleri ve mimari kararlar.

---

## 📜 Karar Listesi

### 🟢 [ADR-020] RBAC İlişkisel İnceleme ve Aşırı Yetki Uyarısı Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** ServiceAccount, Role/ClusterRole ve Binding RBAC güvenlik bileşenlerinin sahnede görselleştirilmesi gereksinimi.
- **Karar:**
  1. RBAC bileşenleri fiziksel 3D bina veya yapılar olarak sahneyi karmaşıklaştırmak yerine, Pod ve ServiceAccount nesneleri arasında ilişkisel bağlarla entegre edilmiştir (`Pod ➔ ServiceAccount ➔ RoleBinding ➔ Role`).
  2. Role ve ClusterRole izinleri ham YAML olarak gösterilmek yerine insan tarafından rahat okunan UI tablosuna dönüştürülmüştür (`Resource` ➔ `Allowed Verbs`).
  3. Aşırı geniş yetkili (`cluster-admin`) ServiceAccount'lar için hem müfettiş kartında hem de Yönetim Binası özet panelinde belirgin bir kırmızı/turuncu güvenlik uyarısı rozeti gösterilerek farkındalık oluşturulmuştur.
  4. Tersane'nin K8s ServiceAccount yetkileri RBAC nesneleri için yalnızca `get/list/watch` (salt-okunur) olarak kısıtlanmıştır; yazma/değiştirme yetkisi verilmemiştir.
- **Sonuç:** Güvenlik farkındalığı artırılmış, salt-okunur RBAC mimarisi başarıyla kurulmuştur.

---

### 🟢 [ADR-019] İş Yükü Tipi Görsel ve Davranışsal Ayrıştırma Mimarisi
- **Tarih:** 2026-07-31
- **Durum:** Kabul Edildi
- **Bağlam:** Kubernetes'teki iş yükü tiplerinin (StatefulSet, DaemonSet, Job, CronJob) standart Deployment/Pod görünümünden görsel ve davranışsal olarak ayrıştırılması gereksinimi.
- **Karar:**
  1. StatefulSet nesneleri için sabit kimlik ve sıra kavramını yansıtmak amacıyla gemiler devriye rotasına sokulmamış, rıhtımda sabit demirli ve `#0` numaralı dikey rozetli olarak modellenmiştir.
  2. DaemonSet nesneleri her Worker Node gemisinin direğinde dönen 3D mavi anten ikonu olarak gösterilmiştir.
  3. Job nesneleri 3D görev şalupası (`JobTaskBoatMesh`) olarak modellenmiş, tamamlanınca yumuşakça silinen, başarısız olunca arıza dramatiği sergileyen yapıya kavuşturulmuştur.
  4. CronJob nesneleri Control Plane Sefer Tarifesi zamanlama paneline bağlanmış ve tetiklendiğinde sahnede canlı Job şalupası üreten mekanizma kurulmuştur.
  5. Her Pod kartına `ownerReferences` verisinden ayıklanan `Yöneten Üst Nesne` alanı eklenmiştir.
- **Sonuç:** K8s iş yükü tipleri 3D sahne diliyle mükemmel uyumlu hale getirilmiştir.
