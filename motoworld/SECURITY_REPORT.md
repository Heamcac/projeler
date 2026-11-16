# MOTOWORLD Aşama 4 denetimi

## Bulgular ve düzeltmeler

| Bulgu | Uygulanan düzeltme |
|---|---|
| SQLite dosyası sunucusuz çalıştırmalarda kalıcı değildi ve üretim eşzamanlılığı aynı motorla test edilmiyordu. | Tüm ortamlar PostgreSQL kullanıyor. Kapasite okuması ve kayıt `Serializable` işlemde. PostgreSQL’in kısmi benzersiz indeksi bir telefonun aynı saatte ikinci aktif kaydını engelliyor. SQLite aktarım aracı boş hedefe tek işlemle yazıyor. |
| Yönetici hesabı için ayrı geçici kilit veya ilk şifre değişikliği yoktu. | PostgreSQL’de atomik sayaç aynı hesaba beş başarısız deneme sonrasında 15 dakika kilit uyguluyor. Başlangıç ve eski hesaplar şifre ekranına yönlendiriliyor. Diğer sayfalar ve API işlemleri şifre değişimine kadar kapalı. Şifre değişikliği tüm eski oturumları iptal ediyor. |
| Admin isteği, uygulama isteğinin URL’sini alternatif kaynak olarak kabul ediyordu. | Üretim mutasyonları `SITE_URL` ile eşleşen `Origin`, yönetim işlemleri ayrıca geçerli oturum gerektiriyor. Server Actions da kaynak doğruluyor. Formlar sunucuda doğrulanıyor, dosyalar ve 128 KiB üzerindeki gövdeler reddediliyor. |
| Çerçeveleme, betik çalıştırma ve tarayıcı yetki başlıkları eksikti. | HTML’de istek başına nonce ve `strict-dynamic` kullanan CSP var. X-Frame-Options, HSTS, nosniff, Referrer-Policy ve Permissions-Policy eklendi. CSP yalnızca stil tarafında inline kurallara izin veriyor. JSON-LD’de `<` kaçışlı ve kullanıcı verileri React tarafından metin olarak gösteriliyor. |
| Rate limit, hesap kilidi ve hassas tablo erişimi için sunucusuz dağıtım güvencesi eksikti. | PostgreSQL `ON CONFLICT` sayaçları birden çok uygulama örneğinde ortak. Proxy istemci IP başlığı yalnızca güvenilir kaynakla ayarlanır. Uygulama tablolarında RLS etkin. Veri API rollerine erişim politikası tanımlanmadı. |
| Kişisel verilerin saklama süresi ve isteğe bağlı analitik onayı yoktu. | Gizlilik ve çerez taslakları, ayrı opt-in ve geri alma eklendi. Süresi dolan kayıtların kişisel alanları, notları ve eski sorgu kodu günlük cron ile temizleniyor. Tarih, durum, CC ve hizmetler raporlama için kalıyor. |
| Canlı hata izlemesi, sağlık denetimi ve markalı hata sayfaları eksikti. | `/api/health` bağlantıyı deniyor ve yalnızca durum döndürüyor. Sentry isteğe bağlı; istek, kullanıcı, çerez, sorgu, gövde ve hata mesajı ayrıntıları ayıklanıyor. Markalı 404 ve hata ekranları teknik ayrıntı göstermiyor. |
| İlk `npm audit` sonucu Prisma zincirindeki DeepmergeTS duyurusundan üç yüksek düzeyli kayıt içeriyordu. | Prisma 7.10.1’e ve PostgreSQL sürücü adaptörüne geçildi. Yeniden `npm audit` sonucu 0 açık. [DeepmergeTS güvenlik duyurusu](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) |

Yönetim çerezi HTTPS üretiminde `Secure`, `HttpOnly`, `SameSite=Lax` ve en fazla sekiz saat geçerli. Üretim DNS’i, TLS ve sağlayıcı bağlantıları dağıtımda ayrıca doğrulanır.

## Rota denetimi

| Yüzey | Kontroller |
|---|---|
| `POST /api/admin/[operation]` | Oturum, zorunlu şifre değişimi, kesin kaynak eşleşmesi ve alan doğrulaması. Test mesajı ve şifre denemesi ayrıca sınırlı. |
| `GET /api/musaitlik` | Tarih ve izin verilen randevu aralığı doğrulanır. Anonim istemci sayacı uygulanır. |
| `GET /api/cron/reminders`, `GET /api/cron/privacy` | Sabit süreli Bearer karşılaştırması, PostgreSQL rate limit, önbelleksiz ve toplu sonuç. |
| `GET /api/health` | Girdi almayan veritabanı kontrolü. 200 veya 503 ve genel durum. |
| Randevu, sorgulama/iptal ve giriş Server Actions | Kaynak doğrulaması, alan doğrulaması ve kalıcı rate limit. Kod ve telefon birlikte doğrulanır. |

## Performans ve SEO

- Yerel görseller için `next/image`, duyarlı boyutlar ve hero ön yüklemesi kullanılıyor. Metin fontu yerel ve değişken ağırlıklı. Başlık fontu tek ağırlık ve Türkçe için Latin/Latin Extended alt kümeleriyle yükleniyor.
- Kamuya açık katalog, site ayarları ve çalışma saatleri beş dakikalığına önbelleğe alınır. Admin kaydını takiben ilgili etiket anında geçersiz kılınır. Müsaitlik, oturum ve yönetim verileri canlı okunur.
- Aynı üretim çıktısı farklı veritabanlarıyla çalıştırıldığında katalog ve ayar önbellekleri ayrılır. Zod istemci doğrulamasında dinamik kod üretimi kapatıldı ve CSP’nin betik kuralı korundu.
- Canonical, robots ve sitemap ayarlı temel adresi kullanır. Ana sayfanın AutoRepair JSON-LD içeriği dükkan ayarlarından ve çalışma saatlerinden oluşturulur.
- Favicon ve kurulum manifesti için 192 ve 512 piksel PNG ikonları eklendi.

### Mobil Lighthouse

Lighthouse 13.6.0 ve Headless Chrome 157 ile yerel üretim derlemesinde mobil benzetim kullanıldı. Aşağıdaki koşularda kaynak yükleme ve CSP hatası gözlenmedi.

| Sayfa | Performans | Erişilebilirlik | En İyi Uygulamalar | SEO |
|---|---:|---:|---:|---:|
| Ana sayfa | 99 | 100 | 100 | 100 |
| Fiyatlar | 100 | 100 | 100 | 100 |
| Randevu | 100 | 100 | 100 | 100 |

Ham raporlar `.lighthouse/home-mobile-recheck-3.json`, `.lighthouse/prices-mobile.json` ve `.lighthouse/booking-mobile-recheck-2.json` dosyalarında. Bazı önceki ölçümlerde Windows yerel ağ erişimi varlık isteklerini kesti ve En İyi Uygulamalar skoru 96 oldu. İlk randevu ölçümünde tespit edilen dinamik kod üretimi kaynaklı CSP uyarısı düzeltildi. Dağıtımdan sonra gerçek HTTPS adresinde ölçümü tekrarlayın.

## Doğrulama

- `npm run lint`, `npx tsc --noEmit` ve `npm run build` başarılı.
- 16 birim testi, 10 PostgreSQL entegrasyon testi ve 2 Playwright senaryosu başarılı. PostgreSQL 18.6 ile son boş slot, kalıcı giriş kilidi, RLS ve anonimleştirme kontrolleri çalıştı.
- Playwright müşteri rezervasyonu, yinelenen slot reddi, sorgu, iptal, yönetici ilk şifre değişimi, fiyat ve JSON-LD yenilenmesi, bildirim kaydı ve analitik onayını doğruladı. Ana sayfa, rezervasyon formu ve yönetim fiyat ekranı 375, 768 ve 1280 pikselde kontrol edildi.
- Bir ara Playwright koşusunda yerel PostgreSQL bağlantısı Windows `EACCES` hatası verdi. Aynı derleme yeni test veritabanında yeniden çalıştırıldı ve iki senaryo da geçti.
- Sentetik SQLite randevusu PostgreSQL’e taşındı. `pg_dump` ve `pg_restore` ile ikinci veritabanına geri yüklenen randevu, tarih, hizmet, not ve bildirim kaydı doğrulandı. Prisma şema karşılaştırması fark bulmadı.
- Yerel HTTP kontrolünde güvenlik başlıkları, geçersiz müsaitlik girdisinin reddi, yetkisiz cron reddi, sağlık yanıtı ve sitemap adresi doğrulandı.

## Yayına çıkışta doğrulanacaklar

- Gerçek alan adı, TLS, barındırma, canlı SMTP/Netgsm, Sentry uyarıları ve üretim cron zamanlaması bu yerel denetimin dışındadır.
- İşletmenin gerçek verileri, hukuki taslakların incelemesi ve üretim yedeği [README yayına çıkış kontrol listesinde](README.md) yer alır.
