# Hazırlık helper şema düzeltmesi

Önceki koşu ownedCP kubelet başlatıldıktan sonra APIye ulaştı, fakat roothelper Python alanını `nodeUIDs` yazdığı için KeyError aldı; gerçek lab.json alanı `nodeUids`. Assertion gevşetilmedi; gerçek şema ile ön kontrol yapıldı. İki containerın durduğu ayrıca actualinspect ile doğrulandı; CPstopCLI timeout kaydı silinmedi.

Aynı exactUID/owner/network/namespaceSeal doğrulaması ve120/180sn bütçe;5snDockerstop/10snchildtimeout ile temizlik payı. Uygulama/KubernetesRoleBinding testi değildir. Hiçbir fixture kurulmadı. Bu yeni koşu somut helper kusurunu düzeltir, öncekiFAILları geçerliye çevirmeye çalışmaz. Başka retry için yeni somut neden gerekir.
