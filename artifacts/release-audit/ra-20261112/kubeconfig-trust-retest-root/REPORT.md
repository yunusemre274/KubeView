# Kubeconfig trust retest — scoped PASS, review pending

Go1.26.11 ile üç top-level case geçti: biri default helper, iki asıl güvenlik testi. Gerçek client-go exec taşıması ayrı testbinary child başlattı, özel marker yazdı ve pinned-CA TLS canary API doğru sentetik bearer ile tek başarılı isteği gözledi. TLS doğrulaması kapatılmadı. Context listeleme/trust sorgusu ve bilinmeyen context authprogramı çalıştırmadı; operatör kubeconfig baytları değişmedi.

Üretim workspacehandler testinde bilinmeyen üç context/path/URL 422 reddedildi ve state değişmedi. Bilinen context normal eklenebildi. Browserın exec/kubeconfig fazladan alanları executableconfig olarak tutulmadı; import yeni kayda context/bound yetkisi taşımadı. Workspace/exportta canary yolu veya execalanı görülmedi ve shellcanary markerı oluşmadı.

İlk düzeneğin HTTP+400 varsayımı FAIL olarak ../kubeconfig-trust-root/ altında korunur. Değişiklik yalnız testfixture, gerçek ürünruntime yok. Bu sonuç gerçek Kubernetes kümesi veya bütün authpluginlerin kabulü değildir; yerel operatör güvenilen kubeconfigi seçtiğinde onun execplugininin hostprogram çalıştırabileceğini kanıtlar. Tempdirler/owned19848 listener cleanup ile kapandı. İkinci inceleme ayrıca beklenecek.

Tekrar komutu: backend içinde kurulu Go1.26.11 ile `GOTOOLCHAIN=local GOMAXPROCS=2 GOMEMLIMIT=2GiB go test -count=1 -p 1 -timeout 60s ./pkg/server -run '^TestRelease(KubeconfigTrustExecIsOperatorConfigured|WorkspaceCannotSupplyExecConfiguration|ExecAuthCanaryHelper)$'`. `-count=1` cache yerine gerçek test, `-p 1` tek package, `-timeout` bounded test süresidir. 19848 owned loopback portu boş olmalı.
