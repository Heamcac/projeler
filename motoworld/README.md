# MOTOWORLD

Bursa Yıldırım’daki motosiklet servisi için Türkçe web sitesi, randevu sistemi, yönetim paneli ve bildirimler.

## Kurulum

Node.js 22 LTS (22.19 veya üstü) ya da 24 LTS, npm ve PostgreSQL gerekir. `.env.example` dosyasını `.env` olarak kopyalayın. Boş bir geliştirme veritabanı oluşturup `DATABASE_URL`, `DIRECT_URL`, `ADMIN_EMAIL` ve `ADMIN_PASSWORD` değerlerini doldurun.

```sh
npm ci
npx prisma migrate deploy
npx prisma generate
npm run seed
npm run dev
```

Siteyi [localhost:3000](http://localhost:3000) adresinde, yönetici girişini [localhost:3000/admin/giris](http://localhost:3000/admin/giris) adresinde açın. İlk oturumda **Hesap** ekranından başlangıç şifresini değiştirin ve yeni şifreyle tekrar giriş yapın. Yerel erişim için tarayıcı adresi `SITE_URL` ile aynı olmalıdır.

| Değişken | İşlevi |
|---|---|
| `DATABASE_URL` | Uygulamanın PostgreSQL bağlantısı. Sunucusuz dağıtımda sağlayıcının havuzlu adresini kullanın. |
| `DIRECT_URL` | Prisma migration ve SQLite aktarımı için doğrudan PostgreSQL bağlantısı. Yerelde `DATABASE_URL` ile aynı olabilir. |
| `TEST_DATABASE_URL` | Yalnızca testlere ayrılmış PostgreSQL sunucusu, örneğin bağlantı adresinin sonunda `/postgres`. Test rolü geçici veritabanı oluşturabilmelidir. |
| `SITE_URL` | CSRF kaynak kontrolü, sitemap, canonical ve Open Graph için kalıcı adres. Üretimde HTTPS kullanın. |
| `ADMIN_EMAIL` | Seed sırasında oluşturulacak yönetici e-postası. |
| `ADMIN_PASSWORD` | Yalnızca seed için başlangıç şifresi. 12–72 UTF-8 bayt sınırı içinde rastgele ve uzun bir değer kullanın. Seed var olan şifreyi korur. |
| `CLIENT_IP_HEADER` | Nginx için `x-real-ip`. Vercel’de boş bırakın, uygulama `x-vercel-forwarded-for` kullanır. Yerel ve başlıksız erişimde sayaç paylaşılır. |
| `SENTRY_DSN` | İsteğe bağlı sunucu hata izleme. Boşsa kapalı. |
| `PLAUSIBLE_DOMAIN` | Plausible’da kayıtlı istatistik alan adı. Boşsa kapalı. Etkinken kullanıcı onayından sonra yalnızca genel sayfa yolları iletilir. |

### PostgreSQL kararı ve eski SQLite kayıtları

Geliştirme, test ve üretimde PostgreSQL kullanılır. Aynı migration geçmişi, `Serializable` işlem davranışı, kısmi benzersiz indeks ve satır kilitleri her ortamda test edilir. Uygulama veritabanı rolü migration’ların oluşturduğu tabloların sahibi olmalıdır. RLS, tablolara yetki verilmiş olsa bile platformun sıradan veri API rollerini politika bulunmadığı için engeller. Supabase’de özel bir proje kullanın ve kullanılmıyorsa Data API’yi kapatın. Havuz ve doğrudan bağlantı ayrımı için [Prisma bağlantı kılavuzu](https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections).

Eski kayıtları taşımak için SQLite kullanan uygulamada yazmayı durdurun. Varsa WAL’ı da kapsayan tutarlı bir yedek alın ve yedeği salt okunur kaynak olarak kullanın. Eski migration’lar `prisma/legacy-sqlite/` altında saklanır. Yeni PostgreSQL hedefinde önce şu komutları uygulayın.

```sh
npx prisma migrate deploy
npx prisma generate
npm run import:sqlite -- /guvenli-yedek/motoworld.db
npm run seed
```

Aktarım boş hedefte tek PostgreSQL işlemi içinde çalışır. Rezervasyonları, fiyatları, ayarları, notları ve bildirim geçmişini korur. Eski oturum ve istek sayaçları taşınmaz. Aktarım sırasındaki belirsiz gönderimler **Atlandı** olarak kayıt altına alınır. Aktarılan yönetici hesapları ilk girişte şifre değiştirir. Kaynak dosyayı saklayın, hedef satır sayılarını ve örnek randevu sorgularını kontrol ettikten sonra trafik yönünü değiştirin.

## Proje yapısı

| Klasör | İçerik |
|---|---|
| `app/(site)/` | Ana sayfa, fiyatlar, rezervasyon ve sorgulama |
| `app/admin/` | Yönetici girişi, panel, rezervasyonlar, takvim, fiyatlar, hizmetler ve ayarlar |
| `app/actions.ts` ve `app/api/` | Sunucu işlemleri ve müsait saat uç noktası |
| `components/` | Ortak arayüz öğeleri ve formlar |
| `lib/` | Rezervasyon, İstanbul saati, doğrulama, oturum ve katalog |
| `prisma/` | Şema, migration ve başlangıç verisi |
| `tests/` | Birim testleri, PostgreSQL entegrasyonu ve Playwright uçtan uca testleri |

## Randevu ve fiyat varsayımları

- Türkiye saatiyle bugün ve sonraki 60 gün seçilebilir. Geçmiş saatler, kapalı günler ve `Holiday` tarihleri müsait görünmez.
- Kapasite randevu başlangıç saatine göre hesaplanır. Hizmet süreleri bilgilendirme amaçlıdır. Kapasite ve yinelenen telefon kontrolü kayıtla aynı seri işlemde yapılır.
- Yeni istekler **Beklemede** açılır. Kod ve telefonla bekleyen veya onaylı randevu iptal edilebilir. İptal kapasiteyi boşaltır.
- Fiyatlar tam TL tutarıyla saklanır. Seçili hizmetlerden bazılarına fiyat girilmediyse form, fiyatı girilen hizmetlerin ara toplamını gösterir.
- Seed, var olan ayar ve katalog satırlarının değerlerini korur. Başlangıç değerleri `prisma/seed.ts` içindedir. Geliştirme ortamında kayıtları `npx prisma studio` ile inceleyebilirsiniz.
- Telefonla alınan randevular panelden onaylı olarak açılır ve aynı müsaitlik kurallarını kullanır. Tatil ve saat değişiklikleri yeni rezervasyonlara uygulanır. Mevcut randevuları **Takvim** ekranında görebilirsiniz.
- Silinen hizmet arşivlenir ve müşteri sayfalarından kaldırılır. Eski randevuların hizmet bilgisi saklanır.

## Dükkan sahibi kullanım rehberi

Yönetici e-postanız ve şifrenizle **Yönetici girişi** ekranından giriş yapın.

### Fiyat değiştirme

1. Yönetim menüsünden **Fiyatlar** ekranını açın.
2. Hizmet satırını ve CC grubunu bulun. Telefonda **Düzenlenecek CC grubu** kutusundan grubu seçin.
3. **Min ₺** ve **Max ₺** tutarlarını yazın. Sitede yayımlamak için **Aktif** kutusunu işaretleyin.
4. **Fiyatları toplu kaydet** düğmesine basın. Birden fazla satırda yaptığınız düzenlemeler birlikte kaydedilir.

### Tatil günü ekleme

1. **Çalışma saatleri ve tatil** ekranını açın.
2. **Tatil günleri** bölümünde tarihi seçin ve bir açıklama yazın.
3. **Tatil ekle** düğmesine basın. Yeni randevu formunda o gün artık seçilemez.

### Randevu onaylama

1. **Panel** ekranındaki **Bekleyen onaylar** listesinden ilgili randevuya dokunun. **Rezervasyonlar** ekranında ad, telefon veya kodla da arayabilirsiniz.
2. Randevu detayında tarih, saat ve hizmetleri kontrol edin.
3. **Onayla** düğmesine basın. Durum **Onaylandı** olur ve müşteri sorgulama ekranında bu durumu görür.

### E-posta şablonunu değiştirme

1. **Bildirimler → Bildirim ayarları** ekranını açın.
2. **Olaylar ve şablonlar** bölümünde bir olayı açın. E-posta konusunu ve metnini düzenleyin. Örneğin `{kod}` ve `{saat}` alanları gönderimde randevudan doldurulur.
3. **WhatsApp hazır mesajı** bölümünden manuel gönderim metnini değiştirebilirsiniz.
4. **Bildirim ayarlarını kaydet** düğmesine basın. **Test e-postası** bölümünde kendi e-posta adresinizle bir gönderim deneyebilirsiniz.
5. **Bildirim geçmişi** ekranında **Başarısız gönderimler** filtresini kullanın. Randevu detayı, o kayda ait gönderimleri ve **WhatsApp ile mesaj gönder** bağlantısını gösterir.

## Bildirim kurulumu

Mevcut veritabanlarına `npx prisma migrate dev` ile yeni migration’ı uygulayın. Üretimde `npx prisma migrate deploy` kullanın. Sağlayıcı anahtarlarını ve cron sırrını sunucunun `.env` dosyasına veya barındırma ortamının gizli değişkenlerine girin.

| Değişken | İşlevi |
|---|---|
| `NOTIFICATION_OWNER_EMAIL` | Yeni randevu ve müşteri iptali e-postalarının dükkan alıcısı. |
| `NOTIFICATION_OWNER_PHONE` | Yeni randevu SMS’i için isteğe bağlı alıcı. Boş bırakıldığında **Site ayarları → Telefon** kullanılır. |
| `SMTP_HOST`, `SMTP_PORT` | SMTP sunucusu ve portu. Varsayılan port 587, örtük TLS için 465. |
| `SMTP_SECURE` | Örtük TLS için `true`. 587 için `false` ve STARTTLS kullanılır. |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP hesabı ve şifresi. Kimlik doğrulamalı bir sunucuda ikisini de doldurun. |
| `SMTP_FROM` | Sağlayıcının gönderime izin verdiği e-posta adresi. |
| `SMS_PROVIDER` | SMS koddan açıldıktan sonra sağlayıcıyı seçer. Geliştirmede `console`, canlı gönderim için `netgsm`. |
| `NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER` | Netgsm abone numarası, API alt kullanıcı şifresi ve onaylı gönderici adı. |
| `CRON_SECRET` | Cron uç noktası için rastgele, en az 32 baytlık gizli anahtar önerilir. Örnek üretim komutu `openssl rand -hex 32`. |

### SMTP ve Netgsm

- Gmail için iki adımlı doğrulamayı açıp uygulama şifresi oluşturun. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false` kullanın. `SMTP_USER` ve `SMTP_FROM` alanlarına Gmail adresinizi, `SMTP_PASSWORD` alanına uygulama şifresini girin. [Nodemailer Gmail rehberi](https://nodemailer.com/guides/using-gmail)
- Hosting SMTP hizmetiniz için örnek yapılandırma `SMTP_HOST=smtp.example.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=servis@example.com` ve `SMTP_FROM=servis@example.com`. Şifre ve gerçek sunucu değerlerini sağlayıcınızdan alın.
- İşletme sahibi için `NOTIFICATION_OWNER_EMAIL` alanına alıcı adresini, `SITE_URL` alanına yayımlanan HTTPS adresini girin. Yeni randevu e-postasındaki bağlantı, yönetici girişinden sonra rezervasyon detayını açar. Durum **Onayla** düğmesiyle değişir. SMTP veya alıcı ayarlanmamışsa gönderim geçmişte **Atlandı** olarak görünür.
- Gönderim kanalları `lib/notifications/channels.ts` dosyasından yönetilir. Varsayılan olarak e-posta açık, SMS kapalıdır. SMS istenirse geliştirici `SMS: true` yapıp uygulamayı yeniden dağıtır. Gerçek gönderim için Netgsm panelinde API erişimli alt kullanıcı ve onaylı gönderici adı oluşturun. `SMS_PROVIDER=netgsm` ve üç Netgsm değişkenini girin. İşletmenin yeni randevu SMS’i site ayarlarındaki telefona gider. Farklı bir cep telefonu için `NOTIFICATION_OWNER_PHONE` tanımlanabilir. [Netgsm API rehberi](https://www.netgsm.com.tr/dokuman/)

### Cron ile hatırlatmalar ve yeniden deneme

`GET /api/cron/reminders` isteğini her dakika ya da beş dakikada bir çalıştırın. İstek başlığı `Authorization: Bearer <CRON_SECRET>` olmalıdır. Randevu işlemleri ilk gönderimi yanıt sonrasında dener. Cron kuyrukta kalan işleri, gecikmeli denemeleri ve hatırlatmaları işler.

**VPS crontab** örneği. Yolları Node ve proje konumuna göre değiştirin. Dakikada bir için `*/5` yerine `*` kullanın.

```cron
*/5 * * * * /usr/bin/node --env-file=/srv/motoworld/.env -e 'fetch(new URL("/api/cron/reminders",process.env.SITE_URL),{headers:{Authorization:"Bearer "+process.env.CRON_SECRET}}).then(r=>{if(!r.ok)throw Error("Cron HTTP "+r.status)})'
```

**Vercel Cron** için dağıtımınızın `vercel.json` dosyasına aşağıdaki tanımı ekleyin ve `CRON_SECRET` değişkenini üretim ortamında ayarlayın. Vercel bu değeri Bearer başlığına ekler. Dakikalık aralık Pro veya Enterprise plan gerektirir. Uygulama ile cron işlevleri aynı PostgreSQL veritabanını kullanır. [Vercel cron belgeleri](https://vercel.com/docs/schedules/cron-jobs) · [Zamanlama sınırları](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing)

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/privacy", "schedule": "15 1 * * *" }
  ]
}
```

**Harici cron servisi** kullanıyorsanız üretim sitenizde aynı yola düzenli HTTPS GET isteği tanımlayın. Sırrı servisinizin gizli başlık alanında saklayın.

### Gönderim ve gizlilik varsayımları

- Yeni kayıt, onay ve iptal işlem bildirimleridir. Randevu tamamlandı mesajı ve hatırlatmalar isteğe bağlı izne bağlıdır. İzin zamanı kaydedilir. Müşteri iznini geri çekerse randevu detayında **Bildirim iznini kaldır** işlemini kullanın. Eski kayıtlar izin verilmemiş sayılır.
- Hatırlatmalar Türkiye saatine göre onaylı randevular için planlanır. Cron, eşikten sonraki 15 dakika içinde çalışırsa gönderimi kuyruğa alır. Pencereler örtüşürse randevuya daha yakın hatırlatma seçilir. Olay ve kanal başına tek kayıt bulunur.
- Sağlayıcı geçici bir ret verirse ilk gönderimden sonra en çok üç kez, sırasıyla 1, 5 ve 15 dakika arayla yeniden denenir. Başarısı belirsiz bir gönderim tekrarlanmaz. **Gönderildi** sağlayıcının mesajı kabul ettiğini belirtir. WhatsApp bağlantısı hazır mesajı açar ve gönderim operatör tarafından yapılır.
- Yerleşik KVKK sayfası, işletmenin gerçek unvanına, veri aktarımına ve başvuru bilgilerine göre yayına almadan önce düzenlenecek bir başlangıç metnidir. [KVKK aydınlatma rehberi](https://www.kvkk.gov.tr/Icerik/5395/Aydinlatma-Yukumlulugunun-Yerine-Getirilmesi-Rehberi-Kurum-Internet-Sayfasinda-Yayinlanmistir-)

### Kişisel veri saklama süresi

1. **Site ayarları → Kişisel veri saklama süresi** bölümünü açın.
2. Süreyi gün cinsinden yazın ve **Saklama süresini kaydet** düğmesine basın. Varsayılan 365 gün, ayarlanabilir aralık 30–3650 gündür.
3. Günlük `/api/cron/privacy` işi, randevu tarihi, kayıt tarihi ve varsa kapatma tarihi bu süreyi aşan kayıtları 100’lük gruplara kadar temizler. Ad, iletişim, plaka, motosiklet ayrıntısı, müşteri ve yönetici notları, izin bilgisi ve eski sorgu kodu kaldırılır. Randevu tarihi, durum ve hizmet sayıları raporlar için kalır. Geriye dönük yedeklerin saklama süresini de işletme politikasıyla hizalayın.

**Hukuki danışmanlık gerektirir, taslaktır.** `/gizlilik-ve-kvkk` ve `/cerez-politikasi` yayımdan önce işletmenin resmi unvanı, hukuki dayanakları, saklama süreleri, başvuru adresi, sağlayıcıları ve yurt dışı veri aktarımına göre gözden geçirilmelidir. Analitik rızası ile randevu bildirim izni ayrı alınır. [KVKK çerez rehberi](https://www.kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber)

## Görseller ve harita

Ana sayfa, `public/images/` içindeki üç temsili, yapay zekâ üretimi servis görselini slider’da kullanır. İlk slaydı ve Hakkımızda görselini kendi fotoğraflarınızla değiştirmek için dosyaları aynı klasöre koyup `Setting` tablosundaki anahtarları güncelleyin.

<details>
<summary>Slider görselleri ve ImageGen istemleri</summary>

Yerleşik ImageGen aracı her görseli aşağıdaki ortak istem ve ilgili konu satırıyla üretti.

> Use case: photorealistic-natural. Asset: landscape hero photograph for a Turkish motorcycle maintenance shop website. Wide 3:2 editorial photography. Realistic independent motorcycle workshop, navy charcoal and grey palette with subtle cyan reflections and small warm highlights. Moderately bright clear subject, natural textures, deep shadows, premium but believable. No text, logos, signs, graphics, watermarks or visible number plates.

- `public/images/servis-atolyesi.webp` — Subject: a graphite modern naked street motorcycle seen from a low three-quarter front angle, parked in a neat service bay with workshop equipment in the soft background. 35mm lens, strong silhouette, headlight off, realistic whole motorcycle with wheels and handlebars. Frame the bike in the middle-right with breathing room on the left, suitable for a responsive slideshow crop.
- `public/images/motosiklet-bakimi.webp` — Subject: close editorial photo of a mechanic’s gloved hands inspecting a motorcycle engine with a compact torque wrench, exposed dark metal engine, workbench bokeh. No face. Keep the action clear in the middle-right and suitable for a responsive slideshow crop.
- `public/images/fren-ve-lastik.webp` — Subject: close editorial photo of the front wheel and disc brake of a dark motorcycle on a workshop lift, crisp tire tread and metal rotor, tool cabinet softly in the background. Keep the wheel center-right and suitable for a responsive slideshow crop.

</details>

| Ayar | Örnek değer |
|---|---|
| `heroImage` | `/images/servis-kapak.webp` |
| `workshopImage` | `/images/atolye.webp` |
| `ogImage` | `/images/paylasim.jpg` (1200 × 630 önerilir) |
| `mapEmbedUrl` | Google Maps’in **Harita yerleştir** ekranındaki iframe `src` adresi |

## Doğrulama

```sh
npx prisma generate
npm run lint
npx tsc --noEmit
npm test
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
npm run lighthouse -- http://localhost:3000/ home-mobile
```

`TEST_DATABASE_URL` testlere ayrılmış bir sunucuda olmalıdır. Entegrasyon ve Playwright her çalıştırmada ayrı geçici veritabanı oluşturur, gerçek migration’ı uygular ve kendi ürettiği veritabanını siler. Playwright, üretim derlemesini 3110 numaralı yerel portta açar. Sistem Chrome ile çalıştırmak için `PLAYWRIGHT_CHANNEL=chrome` kullanın. Lighthouse güncel Chrome gerektirir ve ham raporu `.lighthouse/` altına yazar. VPS ve Vercel ölçümleri için aynı komutu gerçek HTTPS adresinde çalıştırın.

## Canlıya alma

Her iki yol için `.env.production.example` değişken listesini kullanın. Çalışan site için `/api/health`, HTTPS, yönetici girişi ve cron uçlarını doğrulayın. [Güvenlik ve ölçüm raporu](SECURITY_REPORT.md).

### A. Vercel ve Neon veya Supabase

1. Neon’da bir PostgreSQL projesi ve veritabanı oluşturun veya özel bir Supabase projesi kullanın. Sunucusuz uygulama için **pooled** bağlantıyı `DATABASE_URL` yapın. `DIRECT_URL` için havuzlanmayan adresi kullanın. Supabase doğrudan adresinizin IPv6 bağlantısı yoksa migration için session pooler kullanın. Sağlayıcının TLS ayarlarını koruyun. [Prisma migration bağlantı rehberi](https://www.prisma.io/postgres/migration-cannot-reach-database)
2. Güvenli bir dağıtım makinesinde üretim değişkenlerini ortamdan sağlayıp aşağıdaki komutları çalıştırın. Eski SQLite yedeğiniz varsa aktarımı migration ile seed arasına yerleştirin. Seed’den sonra başlangıç şifresini değiştirin ve yalnızca geçici seed şifresini ortamdan kaldırın.

   ```sh
   npm ci
   npx prisma migrate deploy
   npx prisma generate
   npm run seed
   ```

3. Vercel’de Git deposunu **New Project** ile içe aktarın. Framework **Next.js**, Build Command `npm run build`, Node 22.19+ veya 24 olsun. Üretim değişkenlerini **Settings → Environment Variables** ekranında ekleyin. Preview dağıtımlarına ayrı PostgreSQL dalı ve ayrı sağlayıcı anahtarları verin. Üretim migration’ını her sürümden önce tek bir CI dağıtım adımında, `DIRECT_URL` ile çalıştırın. CLI ile dağıtacaksanız proje klasöründe `npx vercel link` ile projeyi bağlayın ve `npx vercel --prod` çalıştırın.
4. **Domains** ekranına ana adresi ve varsa `www` adresini ekleyin. Alan adı sağlayıcısında kök alanın **A** kaydını, alt alanın **CNAME** kaydını Vercel ekranında gösterilen değerlerle oluşturun. Eski çakışan kayıtları kontrol edin. Tek kanonik HTTPS adresini `SITE_URL` yapın ve diğer alan adını oraya yönlendirin. Sertifika hazır olunca yayımlanan adresi açın. [Vercel özel alan adı rehberi](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
5. Pro veya Enterprise dağıtımında yukarıdaki `vercel.json` cron tanımını uygulayın. Alternatif olarak HTTPS ve Bearer başlığı destekleyen harici cron ile hatırlatmayı her beş dakikada bir, anonimleştirmeyi günlük çalıştırın. Vercel’in cron ekranındaki çalıştırma sonuçlarını ve yönetim bildirim geçmişini kontrol edin.

### B. Ubuntu VPS, PostgreSQL, Nginx ve PM2

1. Sunucuda dağıtımı ayrı bir işletim sistemi kullanıcısıyla yapın. İlk hazırlıkta PostgreSQL, Git, Nginx ve güvenlik duvarını kurun. Aşağıdaki Node örneği x86-64 Ubuntu içindir. ARM sunucuda `linux-x64` yerine `linux-arm64` kullanın.

   ```sh
   sudo apt update
   sudo apt install -y postgresql postgresql-client nginx ufw git curl xz-utils
   node_install_dir="$(mktemp -d)"
   cd "$node_install_dir"
   curl -fsSLO https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt
   node_archive="$(awk '$2 ~ /linux-x64\.tar\.xz$/ {print $2; exit}' SHASUMS256.txt)"
   curl -fsSLO "https://nodejs.org/dist/latest-v22.x/$node_archive"
   grep -F "  $node_archive" SHASUMS256.txt | sha256sum -c -
   sudo install -d /opt/motoworld-node
   sudo tar -xJf "$node_archive" -C /opt/motoworld-node --strip-components=1
   sudo ln -s /opt/motoworld-node/bin/node /usr/local/bin/node
   sudo ln -s /opt/motoworld-node/bin/npm /usr/local/bin/npm
   sudo ln -s /opt/motoworld-node/bin/npx /usr/local/bin/npx
   node --version
   npm --version
   sudo -u postgres psql -c 'CREATE ROLE motoworld LOGIN'
   sudo -u postgres psql -c '\password motoworld'
   sudo -u postgres createdb -O motoworld motoworld
   ```

   [Node.js kurulum ve sürüm sayfası](https://nodejs.org/en/download)

2. Depoyu örneğin `/srv/motoworld` altında dağıtım kullanıcısına ait bir klasöre alın. Üretim şablonunu `.env` olarak kopyalayın ve `chmod 600 .env` uygulayın. Havuz kullanılmıyorsa yerel PostgreSQL için iki URL aynı olabilir. `SITE_URL` değerini ana HTTPS adresine, `CLIENT_IP_HEADER` değerini `x-real-ip` yapın.

   ```sh
   cd /srv/motoworld
   npm ci
   npx prisma migrate deploy
   npx prisma generate
   npm run seed
   npm run build
   npx --yes pm2 start npm --name motoworld -- start -- --hostname 127.0.0.1 --port 3000
   npx --yes pm2 startup
   npx --yes pm2 save
   ```

   `pm2 startup` çıktısındaki yetkili komutu bir kez çalıştırıp ardından `pm2 save` çalıştırın. Sürüm güncellemesinde migration ve build sonrası `pm2 restart motoworld --update-env` uygulayın. [PM2 açılış rehberi](https://pm2.keymetrics.io/docs/usage/startup/)

3. Alan adında **A** kaydını VPS IPv4 adresine yönlendirin. IPv6 gerçekten açıksa uygun **AAAA** kaydını ekleyin. `www` için ana alan adına **CNAME** koyabilirsiniz. Aşağıdaki Nginx yapılandırmasını `/etc/nginx/sites-available/motoworld` dosyasına yazın ve alan adını değiştirin.

   ```nginx
   server {
     listen 80;
     server_name motoworld.example www.motoworld.example;
     client_max_body_size 128k;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-Host $host;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_buffering off;
     }
   }
   ```

   ```sh
   sudo ln -s /etc/nginx/sites-available/motoworld /etc/nginx/sites-enabled/motoworld
   sudo nginx -t
   sudo systemctl reload nginx
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d motoworld.example -d www.motoworld.example --redirect
   sudo certbot renew --dry-run
   curl -fsS https://motoworld.example/api/health
   ```

   Varsayılan dışında bir SSH portu kullanıyorsanız UFW’yi etkinleştirmeden önce onu açın. PostgreSQL ve Next.js portlarını halka açmayın. `www` alanını ana HTTPS adrese yönlendirin. [Certbot Nginx kurulumu](https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal)

4. Dağıtım kullanıcısının `crontab -e` ekranına yukarıdaki hatırlatma satırını ekleyin. Anonimleştirme için aynı komutu `15 4 * * *` zamanlaması ve `/api/cron/privacy` yolu ile ekleyin. Cron saatleri VPS’in saat dilimine göre yorumlanır. Harici bir HTTP uptime izleyicisini `/api/health` için kullanabilirsiniz. Sentry için `SENTRY_DSN` atayın ve dağıtımdan sonra kontrollü bir test hatasıyla alarmı doğrulayın.

## Veritabanı yedekleme ve geri yükleme

Neon veya Supabase panelinde planınızın yedekleri, saklama süresini ve zaman noktasına geri dönüş desteğini kontrol edin. Migration öncesi ayrıca doğrudan bağlantı üzerinden `pg_dump -Fc` alın ve şifreli depolamada saklayın. Geri yüklemeyi ayrı bir veritabanında prova edin. [Neon geri yükleme](https://neon.com/docs/introduction/point-in-time-restore) · [Supabase yedekler](https://supabase.com/docs/guides/platform/backups)

VPS örneğinde `PGPASSFILE` yolunda 600 izinli, cron kullanıcısına ait bir PostgreSQL parola dosyası kullanın. `/var/backups/motoworld` klasörü aynı kullanıcıya ait ve 700 izinli olmalıdır. Scripti örneğin `/srv/motoworld/backup.sh` olarak kaydedin.

```sh
#!/bin/sh
set -eu
umask 077
export PGPASSFILE=/srv/motoworld/.pgpass
dest="/var/backups/motoworld/motoworld-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --no-password -h 127.0.0.1 -U motoworld -d motoworld -Fc -f "$dest.part"
pg_restore --list "$dest.part" >/dev/null
mv "$dest.part" "$dest"
```

Crontab satırı `30 2 * * * /bin/sh /srv/motoworld/backup.sh`. Arşivleri şifreli ve sistemden ayrı konuma kopyalayın. Test geri yüklemesi için boş bir `motoworld_restore` veritabanında `pg_restore --no-owner --exit-on-error -d motoworld_restore yedek.dump` çalıştırın. Restore sonrası satır sayıları, randevu sorgusu ve yönetici erişimini kontrol edin.

## Canlıya çıkış kontrol listesi

- [ ] PostgreSQL migration’ları uygulandı, varsa SQLite aktarımının kayıt sayıları kontrol edildi.
- [ ] Üretim alan adı, DNS, HTTPS, canonical, sitemap, robots ve LocalBusiness verileri doğrulandı.
- [ ] Yönetici başlangıç şifresi değiştirildi, eski oturumlar kapandı, geçici seed parolası dağıtım ortamından kaldırıldı.
- [ ] Gerçek fiyatlar ve hizmetler girildi.
- [ ] Telefon, adres, çalışma saatleri, tatiller ve harita bağlantısı doğru.
- [ ] Yetkili test alıcısına gerçek SMTP gönderimi doğrulandı. SMS açıldıysa Netgsm gönderimi de doğrulandı.
- [ ] Hatırlatma ve gizlilik cron işleri çalışıyor, `/api/health` ve izleme kontrol edildi.
- [ ] KVKK ve çerez taslakları hukuken gözden geçirildi, saklama süresi ve isteğe bağlı analitik tercihi doğrulandı.
- [ ] Yedek alındı, ayrı veritabanında geri yükleme provası yapıldı.
- [ ] Lint, TypeScript, birim, PostgreSQL, Playwright, build ve gerçek alan adında mobil Lighthouse geçti.
