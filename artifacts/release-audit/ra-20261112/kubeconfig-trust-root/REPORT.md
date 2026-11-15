# Kubeconfig trust ilk koşu — FAILED (test fixture)

Go1.26.11 productionserver.client/client-go ve workspacehandler üzerinden sentetik testler koşuldu. HelperdefaultcasePASS, iki asıltestFAIL; hiçbir gerçekküme/credential kullanılmadı. İlkcanaryHTTP olduğu içinclient-go0.30.0 authbilgisini yüklemedi; bu davranış kurulusource client_config.go:233 TLSguard ile doğrulandı. Workspace unknowncontext doğru reddedildi fakat422yeri400bekleyen ilk assertionhatalıydı. Bunlar ürün açığı veya başarılı kabul diye raporlanmaz.

İlkJSONL/stderr/manifest/testsource değişmeden korunur. Düzeltme yalnıztestfixture: gerçekpinnedCA TLS ve belgelenmiş422. Sonuç ayrı run-id altında ölçülecek; ilk başarısızlık silinmeyecek. Ownedtestlistener otomatik kapandı; temppaths Go t.Cleanup tarafından silindi.
