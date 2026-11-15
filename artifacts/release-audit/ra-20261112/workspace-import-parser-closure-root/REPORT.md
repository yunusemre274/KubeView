# TEST-13.01 — bounded workspace/import/parser kabulü

14 Kasım2026: kök inceleme tamamlandı. Yeni test çalıştırılmadı; tamamlanan12Kasım koşuları exact sourceSHA ve kanıtlarla uzlaştırıldı. Ürün runtime15770296, denetimHEAD362e91c3; değişiklikler yalnız iki yeni Go test dosyası ve bu kanıtlardır.

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Eski Validate→Export fuzz |111850 motor yürütmesi; dört sourceSHA aynı, yeniden koşulmadı |../workspace-import-fuzz-worker/historical-source-reuse.json |
| ImportInto unit |3ana/9alt PASS,0SKIP |../workspace-import-fuzz-worker/unit/execution.json |
| Yeni ImportInto fuzz |tek10sn bütçe,563506 motor yürütmesi,8seed+17interesting, hata yok |../workspace-import-fuzz-worker/fuzz/go-test.jsonl |
| JSON handler negatifleri |3ana/9alt PASS; malformed/trailing/size/MIME/nonce/schema/depth/unsafe/ref kontrolleri |../workspace-parser-guards-worker/attempt02/go-test.jsonl |
| Son HTTP prefix assertion retest |3ana/9alt PASS,0SKIP;3,422sn; mevcut connection/harbor import sonrası korunuyor |../workspace-parser-binding-retest-root/execution.json |

İlk parser grubu yanlış fixture beklentisiyle FAIL oldu: Go tekrarlanan object/map alanlarını birleştiriyor; önceki credential alanı korunarak422 ile reddedildi. Scalar revision için son değer kullanılır; bilinmeyen alanlar ignore edilir. İlkRED ve exactkaynak korundu. Düzeltme ürün koduna yapılmadı; unsafe duplicate-map422+değişmezlik testi tutuldu, scalar-last200 pozitif kontrolü ayrıldı.

Bağımsız ikinci parser incelemesi, önceki grubun mevcut trusted binding için post-import assertion içermediğini doğru belirtti. Root iki prefix deepEqual assertion ekleyip yalnız kısa grubu tekrar çalıştırdı. Önceki f759b7… kaynağı tarihsel kopyayla, son71b3a61… kaynak ayrı retest ile doğrulandı. Eski sonucu yeni assertiona aktarma veya fuzzı sebepsiz tekrar etme yok.

Import invariants: kaynak ve geçersiz destination değişmezliği; authority stripping; eski trusted prefix; yeniID/ilişki remap; Store.Update toplamkapasite reddinde snapshot/revision/disk/reopen korunumu. Saf ImportInto tek başına kapasite rollback garantisi diye sunulmaz.

Fuzz yürütme sayısı geçerli import sayısı değildir; malformed girdiler dahildir, validimport sayısı bilinmiyor.64KiBüstü bu yeni fuzzın dışındadır; HTTP2MiB sınır testi ayrı kanıttır. Validity oracle üretimdeki Export/Validate kullanır; ortak politika kusurları, YAML/alias ve tümparser/endpointler bu kabulle kapanmaz. Hiçbir gerçekKubernetes, UI, finalbinary veya genel güvenlik kabulü verilmedi.

İki peer review ve kök manifest kontrolü ayrı saklandı. Manifestlerin köke/dizine göre farklı path biçimi ile eski parser kaynak adı root doğrulayıcısında ilk hatayı üretti; ürün veya test başarısızlığı değildir, ilk kontrol kaydı korundu. Finalsource, raw packagePASS/0FAIL/0SKIP ve capturedprocesscleanup kontrol edildi. Coroutine/PID örneklemesi bütün kısaömürlü süreçlerin eksiksiz sayımı değildir.
