# Mimari

HOSPİON monorepo yapısında iki uygulamadan oluşur:

- `apps/api`: NestJS tabanlı backend API
- `apps/web`: Next.js tabanlı responsive web uygulaması

Backend katmanı PostgreSQL'e `pg` bağlantı havuzu ile bağlanır. İş kuralları servis katmanında uygulanır; SQL migration dosyaları veri bütünlüğünü CHECK, FK ve index'lerle destekler.

Talep oluşturma, karar verme ve tamamlama işlemleri audit event ile aynı veritabanı transaction'ında kaydedilir.

## Modüller

- Auth: local login, session cookie, CSRF
- Requests: talep oluşturma, listeleme, detay, iptal, event geçmişi
- Approvals: ekip lideri onay kutusu
- Implementations: manuel HBYS tamamlama ve doğrulama
- Notifications: uygulama içi bildirimler
- Admin: kullanıcı, birim ve lider atamaları
- Reports: temel durum ve birim raporları
