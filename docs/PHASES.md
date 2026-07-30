# PHASES.md — Geliştirme Fazları (Kesin Ekran Yerleşimi & K8s Veri Şeması)

Proje, KISS (Keep It Simple, Stupid) prensibine uygun olarak küçük, bağımsız ve test edilebilir fazlara bölünmüştür.

---

## 🟢 Faz 1-12: Altyapı, 3D Modeller & WebSocket Stream (Tamamlandı)
- Node, Pod, Deployment, Event, NetworkPolicy Informer'ları, WebSocket streaming, Port Resolver ve 3D Modeller tamamlandı.

---

## 🔵 Faz 13: Kesin Ekran Yerleşimi & Nesne Bazlı K8s Bilgi Kartı (Aktif)
- **Hedef:** Ekranın varsayılan durumda %100 3D canvas olmasını sağlamak, kalıcı üst bar ve sayaç panellerini kaldırmak, çift header hatasını gidermek, tıklanan 3D nesneye özel dikey tam yükseklikte (%100 height, ~%15 width) K8s detay kartı açmak ve liman mimarisini çoklu vinçler, depolar ve karada bekleyen konteynır yığınlarıyla zenginleştirmek.
- **Aktif Agent'lar:** `ui-ux-agent`, `3d-scene-agent`, `architecture-agent`, `qa-agent`.
- **Bitti Sayılma Kriterleri:**
  - [ ] Sayfa ilk açıldığında ekranda kalıcı hiçbir büyük metin paneli yok, sahne ekranın en az %95-100'ünü kaplıyor.
  - [ ] Herhangi bir nesneye tıklanınca sağda tam yükseklikte (%100 height), ~%15 genişlikte bir kart açılıyor, sahne görünür kalmaya devam ediyor.
  - [ ] Kart, tıklanan nesnenin GERÇEK tipine göre farklı, doğru bilgi gösteriyor (konteynıra tıklayınca pod/DNS/IP/container bilgisi, master node'a tıklayınca cluster geneli bilgi, vince tıklayınca scheduler bilgisi).
  - [ ] Kart kapatılabiliyor ve kapanınca sahne tekrar tam ekran oluyor.
  - [ ] Eski panel/başlık üst üste binme hatası tamamen giderilmiş.
  - [ ] Liman artık birden fazla bina, birden fazla vinç, karada bekleyen konteynırlarla zenginleşmiş, boş/ıssız görünmüyor.
