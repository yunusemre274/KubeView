# ARCHITECTURE.md — Aktif Mimarisi (Faz 12 - Katman Ayrımı & Tasarım Sistemi)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 12** ve güncellenmiş 3D/UI mimarisini tanımlar. Kod yapısı değiştikçe bu dosya `architecture-agent` tarafından güncellenir.

---

## 🏛️ Mimari Katman Ayrımı (Rendering Layer vs UI Layer)

Tersane platformunda **görsel kafa karışıklığını önlemek** ve **üst üste binen etiket karmaşasını ortadan kaldırmak** amacıyla 3D Dünya ve Kullanıcı Arayüzü iki kesin ve bağımsız katmana ayrılmıştır:

```
+-----------------------------------------------------------------------------------+
|                            EKRAN (VIEWPORT & CANVAS)                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | KATMAN 2: UI OVERLAY (position: absolute, z-index: 20)                     |  |
|  |  [Üst Bar: Namespace Selector + Stat Cards + RBAC Rozeti]                  |  |
|  |  [Sol Panel: Detay Müfettişi / Pod Bilgisi]                                |  |
|  |  [Sağ Panel: Sefer Siparişleri (Deployments) Listesi]                      |  |
|  |  [Alt Bar: Kamera / Görünüm Sekme Butonları]                              |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|  +-----------------------------------------------------------------------------+  |
|  | KATMAN 1: 3D SAHNE (WebGL / Three.js Canvas, z-index: 0)                    |  |
|  |  - SADECE Saf 3D Geometriler (Gemi, Rıhtım, Vinç, Binalar, Konteynırlar)    |  |
|  |  - KESİNLİKLE hiçbir HTML metin, etiket veya buton İÇERMEZ!                 |  |
|  |  - Hover durumunda SADECE hafif 3D glow/mesh highlight efekti verilir.       |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Katman 1: 3D Sahne (Pure 3D World)
- **Teknoloji:** Three.js / React Three Fiber / WebGL.
- **Sorumluluk:** Sadece gerçekçi, low-poly ve tanınabilir 3D nesneleri (Beton Rıhtım, Kargo Gemisi, Kule, Vinç, Konteynırlar, Su Yüzeyi) render etmek.
- **Kesin Kural:** 3D canvas içine hiçbir şekilde HTML metin, etiket (HTML overlay inside canvas), metin kutusu veya buton koyulmaz.

### Katman 2: UI Overlay (HTML/CSS & React Component Layer)
- **Teknoloji:** React 18 + Vanilla CSS (Endüstriyel Tersane Tema Sistemi).
- **Sorumluluk:** Tüm okunabilir bilgiler (Namespace seçici, Gemiler/Paletler rozetleri, Sefer Siparişleri kartları, Pod detayları, Sekme butonları) ekranın kenarlarına sabitlenmiş düzenli panellerde gösterilir.

---

## 🎨 Endüstriyel Tersane Tasarım Sistemi (Design System)

1. **Renk Paleti:**
   - Zemin & Arka Plan: Koyu Lacivert / Siyah (`#090d16`, `#111827`)
   - Birincil Vurgu: Liman Sodyum Işığı Amber/Turuncu (`#f59e0b`, `#d97706`)
   - İkincil Vurgu: Çelik Mavisi (`#0284c7`, `#0ea5e9`)
   - Durum Renkleri: Yeşil (`#10b981`), Sarı (`#f59e0b`), Kırmızı (`#ef4444`)
2. **Tipografi Hiyerarşisi:**
   - Başlıklar: Condensed Industrial Font (`Oswald`, `sans-serif`)
   - Metrikler & Kod Metinleri: Monospace (`JetBrains Mono`, `monospace`)
   - Etiketler & Gövde: Clean Sans (`Inter`, `system-ui`)
3. **Sabit Spacing Skalası:**
   - 4px, 8px, 12px, 16px, 24px sabit padding/margin değerleri.

---

## 🔌 Otomatik Port Çakışma Önleme Stratejisi

- Backend: Port 8000 doluysa `8000-8020` taranır.
- Frontend WebSocket Hook: Otomatik port algılama ve fallback istemcisi.
