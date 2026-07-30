# AGENTS.md — Tüm Ajanlar İçin Ortak Kurallar Rehberi (Canlı 3D Liman Motoru)

Bu dosya, Tersane projesinde görev alan tüm yapay zeka ajanlarının (worker agent & master agent) uymak zorunda olduğu **kesin ve esnetilemez mühendislik kurallarını** içerir.

---

## 🎯 1. Temel İlkeler

1. **85% 3D Canvas / 15% UI Overlay Kuralı (KESİN KURAL):**
   - **3D Canvas ekranın en az %80-85'ini kaplamak zorundadır!**
   - UI Overlay panelleri sadece ekranın kenarlarında ince şeritler ve kapatılabilir çekmeceler halinde yaşar, hiçbir zaman ekranın %15-20'sinden fazlasını kaplayamaz.
2. **3D Canvas İçi Temizlik (KESİN KURAL):**
   - **3D Canvas içine hiçbir zaman okunabilir metin, etiket veya buton render edilemez!**
   - 3D Sahne (Katman 1) SADECE canlı su, tanınabilir 3D modeller, sarı vinç, binalar ve ışıklandırmaları render eder.
3. **KISS Prensibi (Keep It Simple, Stupid):**
   - En basit çalışan çözüm DOĞRU çözümdür. Gereksiz karmaşıklıklar, erken optimizasyon ve kullanılmayan esneklikler YASAKTIR.
4. **Dört Göz İlkesi (Four-Eyes Principle):**
   - Hiçbir agent kendi yazdığı veya ürettiği kodu kendi onaylayıp `main` dalına birleştiremez. Kod yazan agent ile denetleyen agent farklı olmalıdır.
5. **Low-Poly Canlı Oyun Estetiği & 60 FPS Standartı:**
   - Arayüzün sadece "çalışması" yeterli değildir; 60 FPS akıcılıkta, canlı turkuaz/mavi denizli, sarı vinçli, tanınabilir gemili Township estetiğinde çalışması ZORUNLUDUR.
6. **Otomatik Port Çakışma Önleme:**
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

- **Branch İsimlendirme:** `faz/12.1-3d-scene-redesign`
- **Commit Mesaj Formatı:**
  ```text
  [Faz X.Y][Agent Adı] Kısa özet başlığı

  - Ne değişti ve neden değişti (1-3 satır açıklama)
  Ref: TODO.md [GÖREV-XXX] / DECISIONS.md [ADR-XXX]
  ```
- **Merge Şartı:** `qa-agent` ve `code-review-agent` onayı olmadan hiçbir dal `main` branch'ine birleştirilemez.

---

## 🔄 4. Operasyon Döngüsü (8 Adım)

1. **OKU:** `PROJECT.md`, `ARCHITECTURE.md`, `TODO.md`, `PHASES.md` (aktif faz), `DECISIONS.md`, `ORG-CHART.md`.
2. **GÖREV DAĞIT:** `master-agent`, `TODO.md` listesindeki görevi ilgili worker agent'a atar.
3. **UYGULA:** İlgili worker agent kodu yazar (KISS & %85 3D Sahne ilkelerine uygun).
4. **DENETLE:** `code-review-agent`, `architecture-agent`, `security-agent` veya `ui-ux-agent` denetler.
5. **DOĞRULA:** `qa-agent`, `PHASES.md` kabul kriterleriyle kodu kıyaslar ve test eder.
6. **KAYDET:** `TODO.md`, `CHANGELOG.md`, gerekirse `ARCHITECTURE.md` ve `DECISIONS.md` güncellenir.
7. **COMMIT / MERGE:** `release-agent` kurallara göre commit atar.
8. **SONRAKİNE GEÇ:** Bir sonraki aktif göreve geçilir (Adım 1).
