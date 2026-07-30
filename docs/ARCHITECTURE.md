# ARCHITECTURE.md — Aktif Mimarisi (Faz 15 - 2D Dashboard & Raycasting Fix)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 15** ve güncellenmiş 3D->2D Dashboard Geçiş Mekaniği ile Raycasting Etkinlik Yönetim protokolünü tanımlar. Kod yapısı değiştikçe bu dosya `architecture-agent` tarafından güncellenir.

---

## 🏛️ 3D ➔ 2D Control Plane Dashboard Geçiş Mimarisi

Kullanıcı "Yönetim Binasına Gir" veya "🏢 YÖNETİM BİNASI İÇİ" aksiyonunu seçtiğinde:

1. **3D Kamera Yaklaşma (Lerp):** Kamera `Vector3.lerp` ile Master Node Kontrol Binasının içine doğru yumuşakça yaklaşır (0.6-1.0s).
2. **2D Control Dashboard Overlay (Full Screen Canvas Over):** 3D sahne yerini tam ekran etkileşimli **Control Plane Dashboard Overlay** bileşenine (`MasterDashboardOverlay.jsx`) bırakır.
3. **Dashboard İçeriği ve Sekmeleri:**
   - **📊 Genel Bakış:** Control plane bileşenlerinin canlı durumu (`API Server`, `etcd`, `kube-scheduler`, `controller-manager`), cluster geneli CPU/RAM yük dağılımı.
   - **⚡ Control Plane Sağlığı:** Detaylı metrikler ve etcd (Tersane Kaptanı) kayıt doğrulama durumu.
   - **📦 Sevkiyat & Deployments:** Tıklanabilir Sefer Siparişleri (Deployments) ve Pod listesi.
   - **🌐 Network & Endpoints:** Service IP haritası ve Kube-proxy yönlendirmeleri.
4. **Çıkış Mekanizması:** "🔙 Dışarı Çık (Kuşbakışı Görünüme Dön)" butonu ile kamera yumuşakça dış sahne izometrik görünümüne döner.

---

## 🎯 Raycasting Hit-Test ve Olay Kabarması (Event Bubbling) Protokolü

İç içe geçmiş 3D nesnelerde (Worker Node gemisi üzerindeki Pod konteynırları veya Kubelet radar ikonu) yanlış tıklama algılanmasını önlemek için:

1. **`e.stopPropagation()` Zorunluluğu:** Alt nesnelerin (`CargoContainer`, `KubeletRadar`) `onClick` ve `onPointerOver` olaylarında `e.stopPropagation()` çağrılarak olay ebeveyn nesneye (`CargoShip` gövdesi) kabarması önlenir.
2. **`userData.type` Önceliklendirme Haritası:**
   - `{ type: 'container', podData }` ➔ Pod Müfettişi
   - `{ type: 'kubelet', shipData }` ➔ Kubelet Müfettişi
   - `{ type: 'node', shipData }` ➔ Worker Node Müfettişi
   - `{ type: 'master' }` ➔ Control Plane Dashboard
   - `{ type: 'crane' }` ➔ Kube-Scheduler Müfettişi
   - `{ type: 'proxy' }` ➔ Kube-Proxy Müfettişi
