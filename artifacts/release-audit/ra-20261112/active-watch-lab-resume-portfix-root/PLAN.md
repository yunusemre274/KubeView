# İkinci sonlu lab hazırlığı

İlk helper, Docker dinamik loopback portunu yeniden okumadığı için API hazır olma kontrolünü120sn içinde geçemedi;121,613sn toplam/180sn sınırında iki ownedcontainer durduruldu. Ürün testi yapılmadı.

Somut soru: eski private API portu50676 ile yeniden başlatılan owned8443 mappingi farklı mı? Mevcut `Lab.refresh_admin_server` yolunu kullanıp yalnız owned server URL alanının değiştiğini, credential/CA/diğercontext içeriklerinin aynı kaldığını doğrula. No minikube update-context, newnode, CNI, bootstrap veya global kubeconfig değişikliği.

120sn main/180sn toplam; başlangıç pil≥30/disk≥10GiB. Exact cluster/container/namespace UID/owner/seal guardları öncekihelper gibi korunur; başarısızlıkta yalnız başlatılan iki container durur. Yeni otomatik retry yok. Bu warm resume prerequisite, cold-start veya feature PASS değildir.
