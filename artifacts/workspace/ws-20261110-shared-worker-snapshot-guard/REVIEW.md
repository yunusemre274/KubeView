# Gerçek ortak worker arızası — v05

Root;1-unknown-Proje-1.png,2-unknown-held-Proje-2.png ve3-recovered-Proje-1.png açılarak incelendi. Zamanlı dört gözlem gerçek NodeAPI/UID ve frontend read-only visualLifecycle state ile eşleşir. İki proje aynı fiziksel worker UID için iletişim kaybını gösterdi; B Ready kaldı. Her projede canonical2Node/1Pod korundu. Node aynıUID ileReady oldu.

Bu Ready=Unknown/kubelet iletişim kaybı kanıtıdır; Ready=False, alev veya batma E2E kanıtı değildir. API/backend bağlantısı Canlı kalırken Node durumu Unknown'dır. Görsel fiziksel sunucunun kesin öldüğünü söylemez. Son görüntüde NodeReady iken PodReady hâlâ gecikmektedir; bütün Pod recovery'sinin tamamlandığı iddia edilmez.

Kaynak immutablevertical05 binary2ba3e80a…; frontendee974b3b…. Sonraki çok-namespace liste meta düzeltmesi ayrısource/binaryv06'dır. İlk helperFAIL geçmişte korunur; bu koşuda exactNodeUID canonical snapshot/visualstate görülmeden finder açılmaz. Yeni benchmark veya CPU/physicalFPS iddiası yoktur.
