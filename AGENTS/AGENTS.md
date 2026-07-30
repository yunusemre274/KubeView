# AGENTS.md — Tüm Ajanlar İçin Ortak Kurallar Rehberi (Canlı 3D Liman Motoru)

Bu dosya, Tersane projesinde görev alan tüm yapay zeka ajanlarının (worker agent & master agent) uymak zorunda olduğu **kesin ve esnetilemez mühendislik kurallarını** içerir.

---

## 🎯 1. Temel İlkeler

1. **Absolute Overlay Paneller & Sıfır Canvas Resize (KESİN KURAL):**
   - **Yan paneller ve bilgi kartları hiçbir zaman canvas ile flex/grid yer paylaşımı yapamaz!**
   - Canvas her zaman `position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0;` olarak 3D dünyayı render eder.
   - Bilgi kartları ve çekmeceler canvas'ın üstüne `position: absolute; top: 0; right: 0; bottom: 0; z-index: 40;` ve CSS `transform` animasyonu ile biner. Panel açılıp kapandığında canvas boyutu HİÇBİR ŞEKİLDE değişmez ve resize tetiklenmez.
2. **Unbroken 100% Height Chain & Canvas Boyutu:**
   - `html`, `body`, `#root`, `main` ve `.stage-wrapper` kapsayıcılarında `height: 100%` ve flexbox `min-height: 0` zinciri KESİNTİSİZ korunmalıdır!
3. **85% 3D Canvas / 15% UI Overlay Kuralı:**
   - 3D Canvas varsayılan durumda ekranın %100'ünü kaplar. UI Overlay panelleri sadece kenarlarda ince şeritler ve kapatılabilir dikey çekmeceler halinde yaşar.
4. **3D Canvas İçi Temizlik:**
   - 3D Canvas içine hiçbir zaman okunabilir metin, etiket veya buton render edilemez!
5. **KISS Prensibi (Keep It Simple, Stupid):**
   - En basit çalışan çözüm DOĞRU çözümdür. Gereksiz karmaşıklıklar, erken optimizasyon ve kullanılmayan esneklikler YASAKTIR.
6. **Dört Göz İlkesi (Four-Eyes Principle):**
   - Hiçbir agent kendi yazdığı veya ürettiği kodu kendi onaylayıp `main` dalına birleştiremez. Kod yazan agent ile denetleyen agent farklı olmalıdır.
7. **Otomatik Port Çakışma Önleme:**
   - Servisler başlatılırken varsayılan portun dolu olması durumunda uygulama çökmemeli, otomatik bir sonraki boş portu bularak kullanıcıya açıkça bildirmelidir.

---

## 📖 2. Görev Başlangıcı ve Bitiş Protokolü

### 📥 Her Görev Öncesi Okunması ZORUNLU Dosyalar
1. `/docs/PROJECT.md` (Vizyon ve sınırlar)
2. `/docs/ARCHITECTURE.md` (Aktif mimari durum)
3. `/docs/TODO.md` (Atanan aktif görev)
4. `/docs/DECISIONS.md` (Alınan geçmiş kararlar)
5. `/AGENTS/AGENTS.md` (Bu kural dosyası)
6. `/AGENTS/ORG-CHART.md` (Roller ve yetkiler)

### 📤 Her Görev Sonrası Güncellenmesi ZORUNLU Dosyalar
1. `/docs/TODO.md` (Tamamlanan görevi işaretle, sıradakini güncelle)
2. `/docs/CHANGELOG.md` (Yapılan değişikliği agent adı ile yaz)
3. *(Eğer mimari değiştiyse)* `/docs/ARCHITECTURE.md`
4. *(Eğer yeni karar alındıysa)* `/docs/DECISIONS.md`
5. *(Eğer hata/aksaklık yaşandıysa)* `/docs/LESSONS.md`

---

## 🌿 3. Git Workflow Kuralları

- **Branch İsimlendirme:** `fix/drawer-absolute-overlay`
- **Commit Mesaj Formatı:**
  ```text
  [Faz X][Agent Adı] Kısa özet başlığı

  - Ne değişti ve neden değişti (1-3 satır açıklama)
  Ref: TODO.md [GÖREV-XXX] / DECISIONS.md [ADR-XXX]
  ```
- **Merge Şartı:** `qa-agent` ve `code-review-agent` onayı olmadan hiçbir dal `main` branch'ine birleştirilemez.
