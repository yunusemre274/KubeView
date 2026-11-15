# Güven sınırları — ana müdürün ikinci incelemesi

15 Kasım 2026, kaynak `2d5aced373b609aa012a7a4f80ed9dfe0410e29f`. İki worker raporu ve aktif kod noktaları ayrıca okundu; kaynak/kanıt kimlikleri sonlu bir root kontrolüyle yeniden karşılaştırıldı. Bu, mimari kaynak haritasının kabulüdür; yeni Kubernetes, trafik, UI, performans veya penetrasyon testi değildir.

## İlk işler ve sapma

Workspace işi343,823sn, host/provider işi340,094sn sürdü; her ikisi300sn hedefini aştı. Bu iki worker işi süre bütçesini **geçmedi**. İlk finalizer hatası, zamanlar, `false` limit alanları ve kaynak raporları korunur. Kaynak/dosya/çıktı sınırları içindeydiler; dinamik test veya provider işlemi başlatılmadı. Kaynak haritaları tekrar yazdırılmadı; aşağıdaki ayrı içerik/kimlik kontrolü ve düzeltmelerle değerlendirildi. Root hash kontrolünün süresi, rapor okuma/yazmanın veya uygulama performansının toplam süresi diye sunulmaz.

## Kaynakla karşılaştırma ve açıklamalar

- `bindWorkspaceRequest` hedefi store içinden çözer; workspace/harbor/tab ve context çelişkilerini reddeder. `scopedClient` kimliği credential nesli + connectionRef içerir. Kaynak adresi, yetki ve fiziksel cluster kimliği farklıdır.
- **Broker anahtarı açıklaması:** `ResourceScope.key()` yalnız group/version/resource/namespace içerir; selector anahtara eklenmez. Aynı yetkili credential/connection/GVR/namespace için unfiltered informer paylaşılır ve her tüketiciye yayın öncesi selector/membership uygulanır. Worker raporundaki “selectorcoverage” ifadesi selector'ın broker key'inde olduğu anlamına gelmemelidir. Frontend canonical scope key ise selector ve yetki neslini içerir.
- ClusterUID yalnız doğrulanmış fiziksel kaynak dedup içindir. URL/context adı tek başına credential eşitliği değildir. Client-map128 sayısı bir reset eşiğidir; alias eklemelerinin bütün anlarda tam128 eleman garantisi veya bellek/stress sonucu değildir.
- `authorize` gerçek SSAR/API ile, writable işlemlerde ayrıca server read-only ve browser grant ile çalışır. Canonical veri ve animasyon ayrı kalır. Periodic revoke anlık değildir; daha önce iletilen bilgi geri alınamaz. Mevcut watch testi diğer log/exec/forward/flow oturumlarına genellenmez.
- Hubble `LookPath` sonucunu saklar, minimal env ve özel config/TLS argümanlarıyla çalışır. Bu executable-content pinning veya hostile-local-binary sandbox değildir. Minikube ve bare docker komutları operatörün yapılandırmasına/PATH'ine daha geniş güven duyar; TEST12.08 ve filesystem kontrolleri açıktır.
- Container exec, host `os/exec` değildir. Host provider argv'leri sabittir; browser'dan genel shell/kubeconfig/binary/server URL yükleme yolu kaynakta görülmedi. Bu, bütün request kombinasyonlarının penetrasyon testi değildir.

## Yeniden kullanılabilen ve kullanılamayan kanıt

Workspace raporu30 kaynak dosyasını, host/provider raporu44 dosyayı bağlar. Gerçek RoleBinding/HTTP/WS planının12 kaynağı, SEC001 dar düzeltmesinin2 kaynağı, frontend reducer3 + companion6 kaynağı ve kubeconfig trust6 kaynağı güncel hashlerle eşleşir. Geçmişteki bazı provider-manager hashleri sonraki physical-lock düzeltmesi nedeniyle farklıdır; worker bunu kısmi uygulanabilirlik olarak saklar, tam güncel runtime testi saymaz.

Eski UI50 geçiş, TLS veya worker testleri yeni binary'de tekrar çalışmış sayılmaz. Gerçek API/WS, fake API/unit, replay UI ve source incelemesi farklı sınıflardır. Açık cold/full-TLS, collector/SCA, actual CLI provisioning, PATH/symlink, tüm stream revocation, gerçek UI ve uzun kaynak testleri kapanmaz.

## Faz kararı

TEST01.03 ve TEST01.04 için dar kaynak/tehdit sınırı envanteri ana müdürce kabul edildi. Bu karar worker'ın süre kontrolünü PASS yapmaz; o sapma açık kayıt olarak kalır. Gerekli yeni dinamik PoC/retest bu kaynak haritası işinde NOT_APPLICABLE: yeni runtime kusuru veya ürün değişikliği üretilmedi; ilgili gerçek/fake eski kanıtlar kaynak bağıyla ayrı etiketlendi. Genel **NOT_RELEASE_READY**. Root ve worker aynı ajan sistemindedir; profesyonel bağımsız üçüncü taraf güvenlik sertifikası değildir.
