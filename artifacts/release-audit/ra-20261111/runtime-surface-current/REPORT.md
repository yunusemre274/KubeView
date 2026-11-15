# Aktif endpoint envanteri: ilk yardımcı kontrolü başarısız

Kaynak4c6c2ac5, gerçek private provider09 binary f9e70b60 üzerinde 25 normal pattern ve 21 protect sarmalı kaynakta bulundu. Boş ve salt okunur owned app127.0.0.1:19844 üzerinde 28 GET kontrolü çalıştı: public shell/health/version, 21 yetkisiz route401, workspace-prefix401, sessionGET403 ve yetkili boş workspace/contexts200.

Son assertion yanlıştı: yardımcı `/api/contexts` yanıtını doğrudan boş array sandı; mevcut server.contexts() sözleşmesi `contexts` alanını taşıyan nesnedir. İlk boş AssertionError kaydı aynen korunur. Debug/replay/fallback ve yabancı-origin sonraki kontrolleri BU koşuda çalışmadı. Ürün veya API sözleşmesi değiştirilmedi.

App ownedPID85661/birth/PGID ile kapandı, exit0, portta listener yok. Herhangi Kubernetes/provider/mutation veya kişisel veri kullanılmadı. result.json kabulüFAIL, bu ürün endpoint veya güvenlik açığı tespiti değildir. Ayrı retest yardımcı assertion'ını mevcut sözleşmeye düzeltecek.
