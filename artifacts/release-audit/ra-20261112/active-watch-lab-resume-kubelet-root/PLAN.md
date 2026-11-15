# Yeni somut teşhis: owned control-plane kubelet inactive/dead

Önceki sonlu hazırlıklar ve tüm failureSTOP sonuçları korunur. Üçüncü koşuda root yalnız ikiowned containerın systemctl show alanlarını okudu: CP ActiveState=inactive/SubState=dead/Result=success, worker active/running. Bu, API'nin neden başlamadığına dair yeni somut nedendir; ürün API testi değildir.

Bu yeni sonlu koşu120sn main/180sn total içinde, yalnız exactowned control-plane containerında sabit `systemctl start kubelet` eylemiyle hizmeti geri getirir; aktif worker restart edilmez. Sonra mevcut mappedportrefresh + unchangedauth/othercontexts ve clusterUID/NodeUID/Ready/namespaceUID/seal doğrulanır. Yeni Node/CNI/provider/bootstrap ve kullanıcı clusterı yok. Başarısızlıkta yine yalnız bu2container durur. Başka startup denemesi için yeni kanıt gerekir.
