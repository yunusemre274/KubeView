# DECISIONS.md — Mimari Karar Kayıtları (ADR)

Bu belge, Tersane projesinde alınan kritik teknik ve mimari kararların gerekçelerini saklar. Kararlar silinmez; güncellenen kararlar eski referanslarıyla açıkça işaretlenir.

---

## 📌 ADR-001...007 (Önceki Kabul Edilen Kararlar)
- ADR-001 (Go Backend), ADR-002 (Informer/Watch), ADR-003 (Read-Only RBAC), ADR-004 (Tam 3D), ADR-005 (etcd Kaptan/Kubelet Dümenci), ADR-006 (Auto Port), ADR-007 (UI/UX 60 FPS).

---

## 📌 ADR-008: Katman Ayrımı (3D Canvas vs HTML UI Overlay) ve Endüstriyel Tersane Tasarım Sistemi
- **Tarih:** 2026-07-30
- **Kararı Alan Agent:** `ui-ux-agent` & `architecture-agent` (Onaylayan: `master-agent`)
- **Durum:** 🟢 **Kabul Edildi**

### Bağlam
Mevcut arayüzde 3D sahne içindeki metin etiketleri ve butonlar birbirinin üzerine biniyor, okunamıyor ve paneller düz HTML görünümünde kalıyordu.

### Alınan Karar
1. **Katman 1 (3D Canvas):** 3D WebGL dünyasında KESİNLİKLE metin/buton/HTML etiket render edilmeyecek. Sadece tanınabilir 3D geometriler, su, vinç, binalar ve ışıklandırmalar bulunacak.
2. **Katman 2 (HTML UI Overlay):** Tüm okunabilir metinler, sayaçlar, butonlar, sekmeler ve listeler ekranın kenarlarına sabitlenmiş düzenli HTML/CSS panellerinde gösterilecek.
3. **Endüstriyel Tasarım Sistemi:** Özel renk paleti (amber, koyu lacivert, çelik mavisi), `Oswald` / `JetBrains Mono` tipografisi ve sabit spacing ölçeği (4/8/12/16/24px) uygulanacak.

### Sonuç ve Etki
- Metinlerin üst üste binmesi ve görsel karmaşa %100 engellendi.
- Uygulama özgün, profesyonel bir endüstriyel liman kimliği kazandı.
