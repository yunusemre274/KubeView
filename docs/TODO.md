# Güncel görev durumu

- [x] Güncel kaynakları ve referansları incele; önceki gerçek Kubernetes servislerini koru.
- [x] Dashboard kabuğunu tam ekran world shell ile değiştir.
- [x] Merkez, vinç ve diğer fiziksel tesisleri geçici yönetim pencerelerine bağla.
- [x] Node → Pod → container tek panel geri zincirini ve gerçek log/exec/port-forward erişimini koru.
- [x] Gemi üzerinden scheduler’ı atlamayan, UID doğrulamalı Node affinity oluşturma.
- [x] YAML alan kaybını ve kirli taslak kapanışını engelle.
- [x] Backend SSAR scope, scale TOCTOU ve snapshot callback regresyonlarını düzelt.
- [x] Son birleşik gerçek canvas seçim / mutasyon / log senaryosunu geçir.
- [x] Son Chromium ve WebKit ekranlarını açıp görsel kabulü tamamla.
- [x] Kısa gerçek yaşam döngüsü kaydı ve 10 dakikalık churn ölçümünü kaydet.
- [x] Dağıtım/temiz kurulum ve belgeleri son kanıtlarla eşleştir.

Gerçek Safari donanımı, geniş ölçekli çok kullanıcılı backend watch havuzu, harici Prometheus/Helm/bulut VM entegrasyonu ayrı kapsamlardır. Tam Node drain/PDB kesinti senaryosu gerçek kümede henüz yürütülmedi; koruma fake-client testinde sınandı.
