# Fixture sözleşmesi

`scripts/manual_lab.py`, `../profiles.json` içindeki sabit image/sürüm değerlerinden
standart Kubernetes JSON manifestleri üretir. Her profil için gerçek çözülmüş
manifestler kullanıcı state dizinindeki `profiles/<profil>/manifests-a.json`
(03 için ayrıca `manifests-b.json`) dosyalarına
yazılır. Bu dosya token/kubeconfig içermez; namespace ve placement gerçek lab
kimliklerinden üretilir. Yeni kurulum eski repo artefaktlarını okumaz.

Manifestler yalnız CREATE ve kaydedilmiş UID/owner denetimi ile kullanılır.
`reset`, yalnız kaydedilmiş fixture nesnelerini UID+resourceVersion önkoşulu ile
siler/yeniden kurar; namespace, kullanıcının eklediği nesneler ve workspace tercihleri
korunur. Ortak A worker arızası A üzerindeki bütün profilleri etkiler.
