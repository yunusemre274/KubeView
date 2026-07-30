# AGENTS.md — Tüm Ajanlar İçin Ortak Kurallar Rehberi (Canlı 3D Liman Motoru)

Bu dosya, Tersane projesinde görev alan tüm yapay zeka ajanlarının (worker agent & master agent) uymak zorunda olduğu **kesin ve esnetilemez mühendislik kurallarını** içerir.

---

## 🎯 1. Temel İlkeler

1. **Otonom Faz Geçişleri (KESİN KURAL):**
   - **Bir faz İÇİNDEKİ görevler arasında VE bir fazdan bir sonraki faza geçişte kullanıcı onayı BEKLENMEZ.**
   - Bir faz tamamlandığında, QA/Validation Agent `PHASES.md` belgesindeki kabul kriterlerini kontrol eder. TÜMÜ karşılanıyorsa `master-agent` otomatik olarak `ROADMAP.md` dosyasını günceller ve bir sonraki fazı başlatır.
   - **Kullanıcı Onayı Gerektiren İSTİSNAİ Durumlar:**
     1. Geri dönüşü zor, kapsamı önemli ölçüde değiştiren bir mimari karar ortaya çıkarsa.
     2. Bir agent aynı hatayı 2 kez üst üste tekrar ederse (`LESSONS.md` ihlali).
     3. `PHASES.md` dosyasında tanımlı olmayan, kapsam dışı bir iş ihtiyacı ortaya çıkarsa.
2. **Git Yetkilendirmesi (TAM YETKİ KURALI):**
   - `release-agent` (veya ilgili sorumlu agent), commit atma, branch açma, branch'leri `main` dalına merge etme ve uzak depoya (`remote/origin`) push işlemlerini **TAM YETKİYLE**, kullanıcıdan her seferinde onay istemeden yapabilir.
   - **Git Kısıtları:** Force-push (`git push --force`) YASAKTIR. `main` dalına doğrudan commit atılamaz (her zaman feature branch ➔ merge).
   - Her commit sonrası `git log` ile doğrulama yapılır ve `CHANGELOG.md` güncellenir.
3. **3D Event Propagation & Raycasting Hit-Test:**
   - İç içe 3D nesnelerde tıklama (`onClick`) ve hover (`onPointerOver`) event handler'larında `e.stopPropagation()` çağrılmak ZORUNDADIR!
4. **Absolute Overlay Paneller & Sıfır Canvas Resize:**
   - Yan paneller ve bilgi kartları hiçbir zaman canvas ile flex/grid yer paylaşımı yapamaz. Canvas her zaman `position: absolute; inset: 0;` olarak render edilir.
5. **Unbroken 100% Height Chain & Canvas Boyutu:**
   - `html, body, #root, main` ve `.stage-wrapper` kapsayıcılarında `height: 100%` ve flexbox `min-height: 0` zinciri KESİNTİSİZ korunmalıdır.
6. **KISS Prensibi (Keep It Simple, Stupid):**
   - En basit çalışan çözüm DOĞRU çözümdür. Gereksiz karmaşıklıklar ve ağır veritabanı kalıcılığı (DVR gibi) YASAKTIR. (Olay Günlüğü 1 saatlik in-memory ring buffer ile tutulur).

---

## 📖 2. Görev Başlangıcı ve Bitiş Protokolü

### 📥 Her Görev Öncesi Okunması ZORUNLU Dosyalar
1. `/docs/PROJECT.md` (Vizyon ve sınırlar)
2. `/docs/ARCHITECTURE.md` (Aktif mimari durum)
3. `/docs/TODO.md` (Atanan aktif görev)
4. `/docs/DECISIONS.md` (Alınan geçmiş kararlar)
5. `/METAPHOR.md` (Kavram-nesne eşleştirme tablosu)
6. `/AGENTS/AGENTS.md` (Bu kural dosyası)
7. `/AGENTS/ORG-CHART.md` (Roller ve yetkiler)

### 📤 Her Görev Sonrası Güncellenmesi ZORUNLU Dosyalar
1. `/docs/TODO.md` (Tamamlanan görevi işaretle, sıradakini güncelle)
2. `/docs/CHANGELOG.md` (Yapılan değişikliği agent adı ile yaz)
3. *(Eğer faz tamamlandıysa)* `/docs/ROADMAP.md` (Faz durumunu güncelle ve sıradaki faza otonom geç)
4. *(Eğer mimari değiştiyse)* `/docs/ARCHITECTURE.md`
5. *(Eğer yeni karar alındıysa)* `/docs/DECISIONS.md`
6. *(Eğer hata/aksaklık yaşandıysa)* `/docs/LESSONS.md`

---

## 🌿 3. Git Workflow Kuralları

- **Branch İsimlendirme:** `feature/phase-XX-name` veya `fix/issue-description`
- **Commit Mesaj Formatı:**
  ```text
  [Faz X][Agent Adı] Kısa özet başlığı

  - Ne değişti ve neden değişti (1-3 satır açıklama)
  Ref: TODO.md [GÖREV-XXX] / DECISIONS.md [ADR-XXX]
  ```
- **Merge Şartı:** `qa-agent` ve `code-review-agent` onayı sonrası otonom merge edilir.
