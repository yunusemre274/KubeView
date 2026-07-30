# AGENTS.md — Tüm Ajanlar İçin Ortak Kurallar Rehberi

Bu dosya, Tersane projesinde görev alan tüm yapay zeka ajanlarının (worker agent & master agent) uymak zorunda olduğu **kesin ve esnetilemez mühendislik kurallarını** içerir.

---




## 🎯 1. Temel İlkeler

1. **KISS Prensibi (Keep It Simple, Stupid):**
   - En basit çalışan çözüm DOĞRU çözümdür.
   - Gereksiz soyutlamalar, erken optimizasyon (premature optimization) ve kullanılmayan esneklikler KESİNLİKLE YASAKTIR.
2. **Faz Dışı İş Yapılamaz:**
   - `PHASES.md` dosyasında tanımlı olan aktif faz dışında hiçbir koda veya özelliğe başlanmaz.
3. **Dört Göz İlkesi (Four-Eyes Principle):**
   - Hiçbir agent kendi yazdığı veya ürettiği kodu kendi onaylayıp `main` dalına birleştiremez. Kod yazan agent ile denetleyen agent farklı olmalıdır.
4. **Sorumluluk Sınırları ve İzinler:**
   - Bir agent kendi yetki alanındaki klasör/dosya dışındaki bir yere DOĞRUDAN müdahale edemez. Değişiklik önerilerini `master-agent` veya ilgili dosyanın "sahibi" agent'a raporlar.

---

## 📖 2. Görev Başlangıcı ve Bitiş Protokolü

### 📥 Her Görev Öncesi Okunması ZORUNLU Dosyalar
Geliştirmeye başlamadan önce her ajan aşağıdaki dosyaları okumakla yükümlüdür:
1. `/docs/PROJECT.md` (Vizyon ve sınırlar)
2. `/docs/ARCHITECTURE.md` (Aktif mimari durum)
3. `/docs/TODO.md` (Atanan aktif görev)
4. `/docs/DECISIONS.md` (Alınan geçmiş kararlar)
5. `/AGENTS/AGENTS.md` (Bu kural dosyası)
6. `/AGENTS/ORG-CHART.md` (Roller ve yetkiler)

### 📤 Her Görev Sonrası Güncellenmesi ZORUNLU Dosyalar
Görev tamamlandığında ilgili ajan aşağıdaki dosyaları güncellemelidir:
1. `/docs/TODO.md` (Tamamlanan görevi işaretle, sıradakini güncelle)
2. `/docs/CHANGELOG.md` (Yapılan değişikliği agent adı ile yaz)
3. *(Eğer mimari değiştiyse)* `/docs/ARCHITECTURE.md`
4. *(Eğer yeni bir teknik karar alındıysa)* `/docs/DECISIONS.md`
5. *(Eğer bir hata/aksaklık yaşandıysa)* `/docs/LESSONS.md`

- Bir faz İÇİNDEKİ görevler arasında kullanıcı onayı BEKLENMEZ. Bir görev 
  tamamlanıp doğrulandığında (validation-agent onayı), master-agent otomatik 
  olarak TODO.md'deki bir sonraki görevi başlatır.
- Kullanıcı onayı SADECE şu durumlarda istenir:
  1. Bir faz tamamen bitip bir sonraki faza geçilecekse
  2. DECISIONS.md'ye yazılacak, geri dönüşü zor bir mimari karar söz konusuysa
  3. Bir agent 2 kez üst üste aynı hatayı tekrar ederse (insan müdahalesi gerekir)

---

## 🌿 3. Git Workflow Kuralları

- **Branch İsimlendirme:** Her faz veya büyük özellik kendi branch'inde geliştirilir.
  - Örnek: `faz/01-readonly-backend`, `feature/websocket-stream`
- **Commit Mesaj Formatı:**
  ```text
  [Faz X][Agent Adı] Kısa özet başlığı

  - Ne değişti ve neden değişti (1-3 satır açıklama)
  Ref: TODO.md [GÖREV-XXX] / DECISIONS.md [ADR-XXX]
  ```
- **Merge Şartı:** `qa-agent` ve `code-review-agent` onayı olmadan hiçbir dal `main` branch'ine birleştirilemez.
- **Merge Sonrası İşlemler:**
  - `CHANGELOG.md` ve `ROADMAP.md` güncellenir.
  - `master-agent`, merge doğrulandıktan sonra ilgili geliştirme dalını siler.
- **Kesin Yasaklar:**
  - Direct commit on `main` YASAKTIR.
  - `git push --force` YASAKTIR.

 - ZORUNLU COMMIT KURALI: Her görev (TODO.md maddesi) tamamlandığında, bir 
  sonraki göreve geçmeden ÖNCE mutlaka git commit atılır. Commit atmadan 
  yeni bir dosya değişikliğine başlamak YASAK.
- Bir görev birden fazla adımdan oluşuyorsa (örn. hem backend hem frontend 
  değişikliği), her adım kendi içinde çalışır/derlenir duruma geldiğinde 
  ayrı ayrı commit atılır — göreve tek bir dev commit ile devam edilmez.
- Her commit sonrası şu komut ÇALIŞTIRILIR ve çıktısı doğrulanır:
  git add -A && git commit -m "[Faz X][Agent Adı] Özet"
  git log -1 --oneline
- Eğer git status'ta "nothing to commit" çıkıyorsa ve gerçekte dosya 
  değişmişse, bu bir hata sinyalidir — agent DURUR ve LESSONS.md'ye 
  "commit adımı atlandı" diye not düşer.
- Commit atmadan TODO.md üzerinde bir görevi "tamamlandı" olarak işaretlemek 
  YASAK — TODO.md'de görev kapatma ile git commit AYNI ADIMDA yapılır.

---

## 💻 4. Kod Stili ve Standartlar

- **Backend (Go):**
  - Standard `gofmt` ve `golangci-lint` kurallarına uygunluk.
  - Hata yönetimi (error handling) açıkça yapılmalı, hatalar `_` ile yutulmamalıdır.
- **Frontend (React / Three.js):**
  - Modüler bileşen yapısı, Hooks kullanımı.
  - Component içinde ad-hoc stil yerine CSS modülleri / Tailwind ilkeleri.
- **Kubernetes YAML:**
  - Indentation 2 karakter olmalı.
  - Tüm manifestlerde etiketi (`app: tersane`) ve namespace tanımı bulunmalıdır.

---

## ❓ 5. Belirsizlik Yönetimi

Bir geliştirme esnasında belirsizlik veya çelişki ortaya çıkarsa:
1. Agent kendi başına karanlıkta varsayım yapıp ilerlemez.
2. Açık soruyu `/docs/DECISIONS.md` dosyasına "Açık Soru" başlığı altında ekler.
3. En makul geçici varsayımla ilerler ve bu varsayımı `DECISIONS.md` dosyasına gerekçesiyle not düşer.
4. Çelişkili durumlarda konuyu `master-agent`'a eskalasyon yapar.

---

## 🔄 6. Operasyon Döngüsü (8 Adım)

Tüm geliştirme süreci aşağıdaki döngüyü takip eder:

```
[1. OKU] --------> [2. GÖREV DAĞIT] -------> [3. UYGULA] -------> [4. DENETLE]
Docs & Context      Master Agent              Worker Agent         Code Review / Arch
                                                                        |
                                                                        v
[8. SONRAKİNE GEÇ] <--- [7. COMMIT/MERGE] <-- [6. KAYDET] <----- [5. DOĞRULA]
Döngüyü Tekrarla         Git & Release         Todo & Changelog     QA / Validation
```

1. **OKU:** `PROJECT.md`, `ARCHITECTURE.md`, `TODO.md`, `PHASES.md` (aktif faz), `DECISIONS.md`, `ORG-CHART.md`.
2. **GÖREV DAĞIT:** `master-agent`, `TODO.md` listesindeki görevi ilgili worker agent'a atar.
3. **UYGULA:** İlgili worker agent kodu yazar (KISS ilkesine uygun), faz branch'ini açar.
4. **DENETLE:** `code-review-agent`, `architecture-agent` ve `security-agent` kodu denetler. Hata varsa Adım 3'e döner.
5. **DOĞRULA:** `qa-agent`, `PHASES.md` kabul kriterleriyle kodu kıyaslar ve test eder.
6. **KAYDET:** `TODO.md`, `CHANGELOG.md`, gerekirse `ARCHITECTURE.md` ve `DECISIONS.md` güncellenir.
7. **COMMIT / MERGE:** `release-agent` kurallara göre commit atar ve PR'ı merge eder.
8. **SONRAKİNE GEÇ:** Bir sonraki aktif göreve geçilir (Adım 1).

*Not: Bir hata yaşanırsa `LESSONS.md` dosyasına yazılır ve kural eksikliğiyse bu dosyaya yeni madde olarak eklenir.*
