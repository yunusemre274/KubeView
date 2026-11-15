# Gerçek Hubble protokol örnekleri

Bu beş JSON, 1 Kasım 2026 tarihinde sahip olunan `kv-repair-1101` laboratuvarındaki Hubble/Cilium **1.20.2** üzerinden yakalandı. Sentetik provider cevabı değildir. Testler kayıt replay'idir; yeniden canlı E2E çalıştırıldığı anlamına gelmez.

- `l4-old-mask`: L7 policy yokken eski alan maskesinin ürettiği gerçek TCP kaydındaki boş `l7.http` alanı.
- `l4-safe-mask`: `Type=L3_L4` ayırt edicisi bulunan gerçek TCP gözlemi; yeniden kullanılan provider nesnesinde önceki HTTP yanıtının `code=200`/protocol alanları kalmış olsa da uygulama protokolü TCP kalır.
- `l4-safe-mask-empty-oneof`: gerçek L3/L4 gözlemindeki boş Kafka oneof'u da Kafka/L7 gözlemi sayılmaz.
- `http-response-safe-mask`: UID ile sahipliği kaydedilmiş, yalnız test istemcisine uygulanan geçici L7 policy sonrasında gerçek HTTP/1.1 yanıtı.
- `dns-response-safe-mask`: aynı test istemcisinin CoreDNS iletişimi; gerçek `Type=L7`, `RESPONSE`, DNS oneof. Protobuf varsayılan `rcode=0` JSON'da bulunmadığından API'de `dnsRcode=null` kalır.

Maskeler URL, header, DNS query, payload veya endpoint label istemez. Yeni maske `Type`, `l7.type` ve bütün mevcut oneof türlerinin zararsız scalar alanlarını kapsar; Cilium `FieldMask.Alloc` kaynaklı boş nesneler uygulama protokolü sayılmaz. Detaylı kaynak/UID/alan maskesi kanıtları: `artifacts/pre-v11-repair/repair-20261101T130559Z/hubble-protocol-actual-before.json`, `hubble-protocol-actual-after.json`, `hubble-l7-owned-policy.json` ve pinned `cilium-fieldmask-v1.20.2-source.go`.
