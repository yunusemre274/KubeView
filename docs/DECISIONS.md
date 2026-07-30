# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Projedeki önemli mimari ve tasarım kararları bu dosyada belgelenir.

---

## 📋 Karar Listesi

### 🟢 [ADR-014] PNG Ekran Görüntüsü Dışa Aktarma ve Paylaşım Linki Kapsam Dışı Kararı
- **Tarih:** 2026-07-30
- **Durum:** ✅ Kabul Edildi
- **Önceki Karar:** Paylaşım özellikleri tanımlanmamıştı.
- **Güncellenen Karar:** Yerel tarayıcı canvas ekran görüntüsü PNG ve ekran kaydı indirme desteği eklenecek. Ancak **salt-okunur web paylaşım linki KAPSAM DIŞIDIR**, çünkü Tersane merkezi bir bulut veritabanı backend'i gerektirmeyen self-hosted/lokal çalışan bir müfettiştir.

---

### 🟢 [ADR-013] Olay Günlüğü Halka Arabellek (In-Memory Ring Buffer KISS Kararı)
- **Tarih:** 2026-07-30
- **Durum:** ✅ Kabul Edildi
- **Önceki Karar:** Zaman makinesi / DVR konusu belirsizdi.
- **Güncellenen Karar:** Ağır veritabanı, disk kaydı ve karmaşık zaman çizgesi (DVR) YASAKTIR. Olay Günlüğü (Event Log) tarayıcı belleğinde **ring buffer (halka arabellek)** mantığıyla SADECE son 1 saatin olaylarını tutar. Sayfa yenilenince sıfırlanır, hiçbir harici veritabanı bağımlılığı getirilmez.

---

### 🟢 [ADR-012] RBAC Sınırlı Yazma Yetkisi (Limited Write Mutative Verbs)
- **Tarih:** 2026-07-30
- **Durum:** 🔄 Güncellendi (Önceki: `ADR-001` Read-Only ServiceAccount)
- **Gerekçe:** Kullanıcının sadece izleme yapması değil, güvenli bir şekilde pod yeniden başlatması, pod silmesi ve deployment scale etmesi istenmiştir.
- **Güncellenen Karar:** Backend ServiceAccount RBAC rolleri salt-okunur moddan **sınırlı yazma yetkili (limited write)** moda geçirilmiştir. Sadece `pods/delete` ve `apps/deployments/scale` fiillerine (verbs) izin verilir. Secret değiştirme ve YAML düzenleme KAPSAM DIŞIDIR. UI tarafında onay modalları ve global "Salt İzleme Modu" kilidi zorunludur.

---

### 🟢 [ADR-011] 3D➔2D Interactive Control Dashboard, Raycasting StopPropagation ve Canlı Parçacık Ağ Trafiği
- **Tarih:** 2026-07-30
- **Durum:** ✅ Kabul Edildi
