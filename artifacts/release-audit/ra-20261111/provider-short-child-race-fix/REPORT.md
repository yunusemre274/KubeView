# Kısa child ömrü ve kimlik kontrolü yarışı

Case02 gerçekstack bounded_process→OwnedGroup.capture içinde ProcessLookupError gösterdi. Dar testhelper değişikliği, ps/getpgid sırasında tamamlanmış child için Popen exit durumunu kabul eder; hâlâ çalışan doğrulanmamış child reddedilir. Capture hatasında yalnız doğrudan yeni Popen child sonlandırılır ve pipe kapatılır; unverified process grubuna sinyal gönderilmez. App/CLI için mevcut PIDbirth/PGID guardı ve tüm kaynak kimliği şartları korunur.

26safcase ve aynı makinede100bounded /usr/bin/true komutu geçti. Her biri Popenwait ile reap edildi; bu Kubernetes/CLIworker veya uygulamaCPU ölçümü değildir. RUN_CLEAREDFalse. İlk iki gerçekFAIL ve ayrıcleanup kanıtları değişmez; canlıretest henüz yok.
