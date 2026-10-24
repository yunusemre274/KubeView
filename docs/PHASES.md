# Güncel kabul aşamaları

2026-10-24: kalıcı dashboard kararları iptal edilmiştir. Bu dosyadaki önceki v1/v2/v3 “tamamlandı” listeleri güncel ürünün doğrulaması değildir.

1. **Dünya açılışı:** viewport tamamı canvas; merkez/gemi/temel yükler kesilmez; yalnız küçük yardımcı kontroller.
2. **Fiziksel etkileşim:** tesis ve UID doğru; drag seçim yapmaz; kutu tıklaması gemiye yayılmaz; solid occlusion doğru.
3. **Gerçek dikey akış:** merkez create/dry-run → watch Pod → scheduling → vinç → aynı Pod/container logu.
4. **Node bağlamı:** gemi Pod listesi ve bakım; hedefli create, mevcut affinity korunması ve UID recreation reddi.
5. **Yaşam döngüsü:** snapshot/delta/delete, finalizer, restart, replacement UID, stale/context cancellation.
6. **Erişilebilirlik:** nesne bulucu, klavye/Escape/focus, dirty taslak, reduced motion; dar sheet ve WebGL fallback.
7. **Teslim:** gerçek tarayıcı ekranları, kayıt, ölçüm koşulları, destek matrisi ve çalışan paketleme.

Her aşamanın kanıtı README / CAPABILITIES ve test çıktılarıyla değerlendirilir; build tek başına kabul değildir.
