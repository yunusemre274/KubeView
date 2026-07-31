# CHANGELOG.md — Değişiklik Kaydı

Projedeki tüm önemli değişiklikler mevcuttur. Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır.

---

## [v2.8.1 - 3D Canvas Context Loss & Geometri Düzeltmesi] - 2026-07-31

### Düzeltilen Hata
- **R3F Geometri Hatası ve WebGL Context Loss:** `StorageDepotMesh.jsx` bileşeninde Three.js tarafında karşılığı olmayan `<prismGeometry>` JSX etiketi kullanılması nedeniyle R3F'in istisna fırlatıp WebGL canvas context'ini düşürdüğü (`THREE.WebGLRenderer: Context Lost`) ve sahneyi siyah gösterdiği hata tespit edilmiştir.
- **Çözüm:** Oluklu ambar çatısı Three.js'in yerleşik 4-segmentli `<coneGeometry args={[4.6, 1.8, 4]} rotation={[0, Math.PI / 4, 0]}>` Beşik Çatı (Gable Roof) geometrisi ile değiştirilmiş, 3D Canvas çökmesi tamamen engellenmiştir.

---

## [v2.7.0 - Zaman İçindeki Kaynak Kullanım Trend Grafiği] - 2026-07-31

### Durum Tespiti Notu
- **Önceki Durum Tespiti:** Kod tabanında yapılan denetimde CPU ve RAM metriklerinin sadece anlık tek bir sayı (scalar value: `cpu_usage: '320m'`) olarak tutulduğu, zaman serisi geçmişinin bulunmadığı tespit edilmiştir.
- **Eklenen Özellik:**
  - **Bellek-İçi Ring Buffer:** Node ve küme genelinde son 1 saatlik (30 saniye örneklemeli) zaman serisi metrik buffer'ı kuruldu. Kalıcı veritabanı yok (KISS ilkesi).
  - **Node Sparkline & Detaylı Grafik:** Node müfettiş kartında mini SVG sparkline grafiği eklendi. Tıklandığında eksenli (zaman/yüzde), tooltip destekli detaylı trend grafiği modalı açılır.
  - **Master Dashboard Cluster Trend Grafiği:** Yönetim Binası paneli Genel Bakış ve Yük Dağılımı sekmelerinde küme geneli canlı zaman serisi trend grafik eklendi.
