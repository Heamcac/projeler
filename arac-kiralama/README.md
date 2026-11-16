# Rent a Car Premtimi

PHP 8+, MySQL, Bootstrap 5, HTML, CSS ve JavaScript ile hazırlanmış araç kiralama yönetim platformu.

## Özellikler

- Güvenli admin login, session, CSRF koruması ve prepared statement tabanlı SQL işlemleri
- Araç CRUD, çoklu fotoğraf yükleme, sigorta ve tescil tarihleri
- Public siteden gelen rezervasyon taleplerinin `pending` olarak kaydedilmesi
- Admin onay/red/aktif/tamamlandı/iptal durum yönetimi
- Müşteri, pasaport, sürücü belgesi ve rezervasyon geçmişi
- Onaylı rezervasyonlar için yazdırılabilir sözleşme ve fatura
- Servis, bakım, gider, hasar/kaza ve kilometre kayıtları
- Dashboard uyarıları ve gelir/gider/net kazanç raporları
- Arnavutça, İngilizce ve Türkçe public site dil dosyaları

## XAMPP Kurulum

1. Bu klasörü XAMPP `htdocs` içine kopyalayın:
   `htdocs/rentacar-premtimi`
2. XAMPP Control Panel üzerinden Apache ve MySQL servislerini başlatın.
3. phpMyAdmin açın ve `database/schema.sql` dosyasını içe aktarın.
4. `config/config.php` dosyasında veritabanı bilgilerini gerekirse güncelleyin.
5. Tarayıcıda public siteyi açın:
   `http://localhost/rentacar-premtimi/public`
6. Admin panel:
   `http://localhost/rentacar-premtimi/public/admin/login`

## Demo Admin

- E-posta: `admin@premtimi.local`
- Şifre: `admin123`

## Notlar

- Public rezervasyonlar otomatik onaylanmaz; admin panelinde `pending` olarak görünür.
- Sözleşme ve fatura, rezervasyon `approved` veya `active` yapıldığında otomatik oluşur.
- Yazdırma ekranlarında tarayıcının `Yazdır / PDF` özelliği kullanılır.
- Canlı ortama çıkmadan önce `config/config.php` içindeki şirket iletişim bilgilerini, WhatsApp numarasını ve Google Maps iframe adresini güncelleyin.
