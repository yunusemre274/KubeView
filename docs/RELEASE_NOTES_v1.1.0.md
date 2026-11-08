# KubeView 1.1.0 — sürüm adayı

**Henüz yayımlanmadı.** Zorunlu kabul kapıları açık; release/tag ve milestone kapanışı ancak kanıtlar tamamlanınca yapılır.
Başlangıç paket sürümü 0.4.0 idi. Başlangıç GitHub envanterinde v1.0.0 release/tag yoktu; eski chart metni yayımlanmış sürüm olarak yorumlanmaz.

Bu aday, mevcut tam ekran limanı ve gerçek Kubernetes işlemlerini yerel operatörün kendi kümesine bağlanabileceği bir dağıtıma dönüştürür:

- Merkezden açık Connect/Demo seçimi; context/namespace ve ayrı API/keşif/yetki/metrics/Hubble tanılaması.
- Başlangıçta read-only. Sunucu `--write` ile izin verse de kullanıcı merkezden bu context/namespace için yönetimi ayrıca açar; değişen kapsam izni iptal eder.
- Geciken istekler ve metrics geçmişi bağlantı nesli/UID ile ayrılır; form çift gönderimleri ve sonucu belirsiz timeout için GET/watch incelemesi.
- Ön yüzü gömülü aynı-origin Go ikilisi; geliştirici araçları son kullanıcının çalıştırma önkoşulu değildir.
- Mevcut Neumorphism paneller, hareketli filo/su, Node yangın-batma/toparlanma, tek container düşüşü, minikube worker katılımı, vinç ve gerçek Hubble katmanı korunur. Caption yerleşimi iyileştirildi; safe-gap çarpışma koşulları korunur.

Kubernetes dışı bulut VM sağlama, tam TTY terminal, genel TCP/UDP port-forward, bütün protokollerin payload incelemesi veya çok kullanıcılı SaaS sunulmaz. Exec mevcut non-TTY satır kabuğu; port-forward sınırlı HTTP önizlemedir. Kubernetes log API'sinin atomik UID pinleme garantisi yoktur; oturum/UID doğrulama ve iptal risk azaltır, garanti oluşturmaz.

Kurulum ve güvenlik: [README](../README.md), [SECURITY](SECURITY.md).
Platform, kaynak/build ve gerçek test durumu: [kabul raporu](V11_ACCEPTANCE_REPORT.md).
