# Sonlu startup kontrolü — üçüncü hazırlık, ürün testinin tekrarı değil

İlk helper eski API portunu varsaydı. İkinci helper farklı ownedmappingi ve yalnız private server alanının değiştiğini doğruladı; fakat API açılırken6sn request timeout'u readiness pollinginde geçici unavailable yerine fatal yaptı. Her ikisinin FAIL ve exactcontainerSTOP kayıtları korunur.

Bu koşunun somut sorusu: mevcut endpoint yenilemesi + başlangıç I/O timeout'unu yalnız deadline içinde hazır değil sayan kontrolle owned API ve özgün iki Node hazır oluyor mu? main120sn/total180sn, pil≥30, disk≥10GiB, aynıUID/owner/sealguard ve failureSTOP. Sonlu planda bu son hazırlık koşusudur; hazır olmazsa yeni kanıt/kök neden olmadan tekrar yok. CNI/provider/Node/bootstrap ve kullanıcı kümesi mutasyonu yok.
