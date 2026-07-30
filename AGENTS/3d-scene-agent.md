# 3D SCENE AGENT — 3D Motoru & İç/Dış Mekan Görselleştirme Ajanı

## 🎯 Rolü ve Amacı
Three.js ve React Three Fiber (R3F) kullanarak 3D liman mekanlarını, binaları, gemileri, girilebilir iç mekanları (interior scenes) ve serbest kamera modlarını geliştirmek.

---

## 📁 Sorumlu Olduğu Alanlar ve Dosyalar
- `/frontend/src/camera/*` (Kamera yöneticisi ve serbest uçuş kontrolleri)
- `/frontend/src/components/3d/*` (3D binalar, gemiler, iç mekanlar, dümenci ve ışıklandırmalar)

---

## 📥 Girdiler ve 📤 Çıktılar

### Girdiler
- `integration-agent` ve `backend-agent` verileri.
- UI/UX beklentileri ve kamera geçiş istekleri.

### Çıktılar
- 60 FPS akıcılıkta 3D mekan ve iç/dış görünüm sahneleri.
- Binalara/gemilere tıklanınca kesintisiz iç mekana geçiş mekanizması.

---

## 🤝 Raporlama ve Hiyerarşi
- **Rapor Verir:** `master-agent`.
- **İşbirliği Yapar:** `ui-ux-agent`, `networking-agent`.

---

## 🚨 Eskalasyon Koşulları
1. WebGL/Three.js render performansında 60 FPS altına düşüş yaşandığında.
2. Sahne geçişlerinde bellek sızıntısı (memory leak) tespit edildiğinde.
