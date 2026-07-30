# ARCHITECTURE.md — Aktif Mimarisi (Faz 12.1 - Canlı 3D Liman Motoru)

> ⚠️ **UYARI:** Bu dosya SADECE mevcut aktif faz olan **Faz 12.1** ve güncellenmiş Canlı Low-Poly 3D Liman Görsel Simülasyon mimarisini tanımlar. Kod yapısı değiştikçe bu dosya `architecture-agent` tarafından güncellenir.

---

## 🏛️ Mimari Katman Ayrımı ve Ekran Oranı (85% 3D / 15% UI)

Ekran alanının **en az %85'i 3D WebGL dünyasına** ayrılmıştır. Kullanıcı arayüzü (UI Overlay) yalnızca kenarlarda yer alan ince ve zarif panellerden oluşur.

```
+-----------------------------------------------------------------------------------+
|                            EKRAN (VIEWPORT & CANVAS - %100)                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Üst Bar (İnce Bilgi Şeridi - %5 Yükseklik)                                  |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|   KATMAN 1: CANLI LOW-POLY 3D SAHNE (EKRANIN %85'İ)                                |
|   - Canlı Mavi Dalgalı Deniz (Animasyonlu Su Yüzeyi)                              |
|   - Beton Rıhtımlar, Yeşil Kara Parçası & Liman Köyü Binaları                      |
|   - İkonik Sarı Konteynır Vinci (Gantry Crane)                                    |
|   - Su Üstünde Yüzen Canlı Kargo Gemileri (Node'lar & Pod Grid)                   |
|   - Sadece Saf 3D Geometriler (HİÇBİR YÜZEN HTML METİN İÇERMEZ)                   |
|                                                                                   |
|                                                     +--------------------------+  |
|                                                     | KATMAN 2: DETAY PANELİ   |  |
|                                                     | (Max 280px Genişlik)     |  |
|                                                     | (Sadece tıklanınca)      |  |
|                                                     +--------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Alt Bar (Görünüm & Kamera Sekmeleri - %5 Yükseklik)                         |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🎨 Görsel Kimlik ve 3D Modelleme Standartları (Township / Low-Poly Estetiği)

1. **Canlı Mavi Deniz (Ocean Surface):**
   - Su yüzeyi sahnenin ana bileşenidir. Dalgalı sinüzoidal yükseklik animasyonu (`useFrame`), turkuaz-lacivert renk geçişi ve canlı ışık yansımaları barındırır.
2. **Kargo Gemileri (Worker Node'lar):**
   - Tanınabilir kırmızı/lacivert gemi gövdesi, sivri pruva, beyaz kaptan köşk bloğu, kırmızı baca ve bacadan yükselen duman efekti.
   - Güvertede renkli konteynır kutuları (yeşil `#10b981`, mavi `#0284c7`, mor `#a855f7`, amber `#f59e0b`) nizami ızgarada sıralanır.
   - Su üzerinde gerçekçi hafif salınım (bobbing motion) animasyonu.
3. **İkonik Sarı Konteynır Vinci (Gantry Crane):**
   - Yüksek kafes yapılı dikey kule + yatay kol + çelik halat formunda parlak sarı/amber renkli liman vinci.
4. **Master Kontrol Binası & Liman Köyü:**
   - Kontrol kulesi binası (pencereler, kırmızı çatı, döner radar anteni) + yanında yeşil kara şeridi ve depo binaları.
5. **İnteraktif Kamera Lerp:**
   - Tıklanan 3D nesneye kamera yumuşak bir interpolasyon (Lerp/Tween) ile yaklaşır ve sağdaki ince detay çekmecesi açılır.

---

## 🔌 Otomatik Port Çakışma Önleme Stratejisi

- Backend: Port 8000 doluysa `8000-8020` taranır.
- Frontend WebSocket Hook: Otomatik port algılama ve fallback istemcisi.
