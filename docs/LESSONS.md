# LESSONS.md — Deneyimler ve Çıkarılan Dersler

Bu belge, geliştirme sürecinde yaşanan fiili hataları ve vizyon güncellemelerinden çıkarılan dersleri saklar.

---

## 📋 Kayıtlı Dersler

### 🔴 [DERS-003] CSS / Canvas Yükseklik Zinciri Kırılması ve 300px Sıkışma Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `frontend-agent`
- **Ne Yanlış Gitti?:** 3D WebGL Canvas ekranın üst tarafında dar bir şeritte (~300px) sıkışıp kaldı, alt taraf düz siyah göründü.
- **Kök Neden:** `html`, `body` ve `#root` elemanlarında `height: 100%` zincirinin kırılması ve canvas kapsayıcısında (`.stage-wrapper`) flexbox `min-height: 0` kuralının eksik kalması. CSS box sizing modelinde parent height tanımsız olduğunda HTML `<canvas>` varsayılan 300px yüksekliğine düşer.
- **Nasıl Düzeltildi?:** `index.html`, `index.css`, `App.jsx` ve `ShipyardScene.jsx` genelinde unbroken 100% height zinciri kuruldu. `.stage-wrapper` kapsayıcısına `flex: 1 1 0%` ve `min-height: 0` kuralları eklendi.
- **Geleceğe Dönük Kural:** `AGENTS.md` kod stili kurallarına eklendi: "Tüm canvas kapsayıcılarında `html, body, #root, main, stage-wrapper` unbroken `height: 100%` ve `min-height: 0` zinciri korunmalıdır."

---

### 🔴 [DERS-002] Çift Header / Üst Üste Binen Component Render Hatası
- **Tarih:** 2026-07-30
- **Sorumlu Agent:** `ui-ux-agent` & `frontend-agent`
