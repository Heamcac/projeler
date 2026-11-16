# TÜRK TARİHİ DEMO 2

PHP 8+, MySQL, HTML5, CSS3 ve Vanilla JavaScript ile hazırlanmış çok sayfalı Türk tarihi demo platformudur. Amaç tek dosyalı veya SPA mantığı yerine gerçek URL'lere, ortak bileşenlere ve ilişkisel veritabanına dayanan temiz bir ikinci sürüm oluşturmaktır.

## Klasörler

- `includes/`: Ortak ayarlar, PDO bağlantısı, yardımcı fonksiyonlar, header, navbar, footer ve admin oturum yardımcıları.
- `admin/`: Session tabanlı admin paneli.
- `assets/css/`: Genel stil, bileşen stilleri ve responsive düzen.
- `assets/js/`: Küçük Vanilla JS etkileşimleri.
- `assets/uploads/`: İleride yüklenecek medya dosyaları için ayrılmış alan.
- `database/`: MySQL tablo şeması ve başlangıç demo verisi.
- `logs/`: Production hata logları. Git'e gönderilmez.

## Local Kurulum

1. PHP 8+ ve MySQL bulunan bir ortam hazırlayın.
2. `.env.example` dosyasını `.env` olarak kopyalayın.
3. `.env` içindeki `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `APP_URL` değerlerini doldurun.
4. MySQL içinde boş bir veritabanı oluşturun.
5. Sırasıyla SQL dosyalarını içeri alın:

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

6. Proje klasöründe PHP dahili sunucusunu başlatın:

```bash
php -S localhost:8000 router.php
```

7. Tarayıcıdan `http://localhost:8000` adresini açın.

Bu makinedeki local demo için MariaDB kurulduysa ve bilgisayar yeniden başlatıldıysa önce şu komutla veritabanını tekrar başlatabilirsiniz:

```powershell
.\start-local-db.ps1
```

## Cloud Database

Railway üzerinde MySQL oluşturduktan sonra bağlantı bilgilerini `.env` veya hosting panelindeki environment variables alanına girin:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://demo-domaininiz`

Şifreleri PHP dosyalarına yazmayın. `.env` GitHub'a gönderilmez.

## Database Kurulumu

`database/schema.sql` bütün tabloları, foreign key ilişkilerini ve indexleri oluşturur. `database/seed.sql` ise başlangıç için devletler, hükümdarlar, savaşlar, kültür içerikleri, destanlar, kaynaklar ve timeline kayıtları ekler.

## Admin Panel

Admin URL:

```text
/admin
```

Seed içindeki demo admin hesabı yalnızca ilk kurulum içindir. Production ortamına geçmeden önce admin şifresini panel veya SQL üzerinden `password_hash()` ile üretilmiş yeni bir hash ile değiştirin.

Demo kullanıcı adı:

```text
admin
```

Demo şifre:

```text
password
```

Admin panelinde CSRF token kontrolü, session tabanlı yetki kontrolü, `password_verify()` ve PDO prepared statement kullanılır.

## Yeni Devlet Ekleme

1. `/admin` adresinden giriş yapın.
2. `Devletler > Devlet ekle` ekranını açın.
3. Ad, slug, açıklama, dönem, başkent, kurucu, yönetim, din, bölge ve görsel URL alanlarını doldurun.
4. Kaydettikten sonra devlet `/devlet/{slug}` adresinden açılır.

## Yeni Sayfa Oluşturma

Yeni bir içerik türü eklerken:

1. Gerekirse `database/schema.sql` içinde ayrı tablo oluşturun.
2. `includes/functions.php` içine veri getirme fonksiyonları ekleyin.
3. Liste sayfası ve detay şablonu oluşturun.
4. `includes/navbar.php` içinde menüye ekleyin.
5. Gerekirse `.htaccess` içine temiz URL kuralı ekleyin.
6. Admin panelde ayrı yönetim sayfası oluşturun.

## Deploy Notları

Bu proje PHP çalıştırabilen bir hosting gerektirir. Railway, Render, DigitalOcean App Platform veya klasik PHP/MySQL hosting kullanılabilir. Temiz URL yapısı Apache `.htaccess` ile hazırdır; Nginx kullanılıyorsa rewrite kuralları ayrıca tanımlanmalıdır.

Production ortamında:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL` public demo adresi
- Railway MySQL environment değişkenleri
- Admin şifresi değiştirilmiş olmalıdır.

## Güvenlik Notları

- Veritabanı işlemleri PDO prepared statement kullanır.
- Normal metin çıktıları `htmlspecialchars()` ile escape edilir.
- Admin şifresi hash olarak saklanır.
- CSRF token kontrolü admin formlarında aktiftir.
- `.env`, loglar ve gerçek şifreler GitHub'a gönderilmez.

