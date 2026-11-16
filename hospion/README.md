# HOSPİON v1.0 MVP

HOSPİON, hastane içi işlem onaylarının WhatsApp gibi dağınık kanallardan çıkarılıp merkezi bir dijital talep ve onay sisteminde izlenmesi için hazırlanmış responsive web uygulaması MVP'sidir.

Bu sürüm yalnızca sentetik demo verileri içindir. Gerçek hasta verisiyle kullanılmadan önce kurum BT, bilgi güvenliği, KVKK ve üretim mimarisi değerlendirmesi yapılmalıdır.

## Teknoloji

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript, class-validator, class-transformer
- Database: PostgreSQL, `pg`, versiyonlanmış SQL migration dosyaları
- Test: Jest

## Windows Kurulum

Bu bilgisayarda kurulum tamamlandı. PostgreSQL proje içindeki `.local` klasöründe çalışır; Docker ve yönetici yetkisi gerekmez.

- Uygulamayı açmak için `HOSPION-Baslat.cmd` dosyasına çift tıklayın.
- Uygulamayı ve veritabanını kapatmak için `HOSPION-Durdur.cmd` dosyasına çift tıklayın.
- Kurulumu yeniden kontrol etmek için `HOSPION-Kur.cmd` dosyasını açın.

Başlatma dosyası sunucuları arka planda çalıştırır ve tarayıcıyı açar. Bilgisayar yeniden başlatıldıktan sonra tekrar başlatma dosyasını açın. Veritabanı kayıtları `.local/pgdata` içinde korunur. `.local` klasörünü silmeyin. Sunucu günlükleri `.local` içinde bulunur.

Yerel kurulum betiği PostgreSQL 17.11'i [EDB'nin resmi indirme sayfasındaki](https://www.enterprisedb.com/download-postgresql-binaries) Windows paketinden kurar. Bağlantı parolası ve oturum anahtarı otomatik üretilir; ayarlar kökteki `.env` dosyasından yüklenir.

Docker ile alternatif kurulum:

```powershell
cd C:\Users\serka\Documents\Codex\2026-10-10\files-pasted-by-the-user-codex\outputs\HOSPION
copy .env.example .env
docker compose -f infra\docker-compose.yml up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Docker bu makinede yüklü değilse PostgreSQL'i ayrıca kurup `.env` içindeki `DATABASE_URL` değerini kendi bağlantınıza göre düzenleyin.

Frontend: http://localhost:3000  
API: http://localhost:4000/api/v1

## Demo Kullanıcıları

Tüm demo kullanıcılarının parolası: `Demo1234!`

- `staff@hospion.local` — STAFF
- `leader@hospion.local` — TEAM_LEADER
- `billing@hospion.local` — BILLING_OPERATOR
- `admin@hospion.local` — ADMIN
- `auditor@hospion.local` — AUDITOR

Varsayılan demo hesapları üretim ortamında bırakılmamalıdır.

## Çekirdek İş Akışı

1. Personel yeni talep oluşturur.
2. Protokol numarası veya hasta numarasından en az biri backend ve SQL CHECK constraint ile zorunlu tutulur.
3. Talep ilgili aktif ekip liderine atanır.
4. Ekip lideri onaylar, reddeder veya ek bilgi ister.
5. Onaylanan talepler `IMPLEMENTATION_PENDING` durumuna geçer.
6. Fatura yetkilisi HBYS üzerinde manuel yapılan işlemin sonucunu kaydeder.
7. Talep tamamlanır ve olay/audit kayıtları tutulur.

## Log Takibi

Talep satırına sağ tıklayıp **Log Takibi** seçeneğiyle geçmişi açabilirsiniz. Satırdaki saat/geçmiş simgesi aynı ekranı dokunmatik cihazlarda da açar. Menüdeki **Log Takibi** sayfası tüm erişebildiğiniz taleplerin işlemlerini tarih, işlem türü, kullanıcı veya referans numarasıyla filtreler.

Oluşturma, onay, ret, ek bilgi, geri çekme, tamamlama ve tamamlanma doğrulaması `request_events` ile `audit_logs` tablolarına işlemle aynı transaction içinde yazılır. Yeni kayıtlar kullanıcı adı/rolü, gerekçe, durum geçişi ve sürüm bilgisini içerir. Logları düzenleyen veya silen uygulama komutu yoktur.

Tüm roller log ekranını açabilir. Personel kendi taleplerini; lider kendi birimini ve lider olarak atandığı birimleri; yönetici, denetçi ve fatura yetkilisi tüm talepleri görebilir. Eski loglar korunur; geçmişte kaydedilmeyen ayrıntılar sonradan uydurulmaz.

Gerçek yerel veritabanıyla log/transaction/yetki testleri:

```powershell
$env:RUN_DB_TESTS = '1'
npm run test
```

Bu testler yalnızca kendilerinin oluşturduğu geçici test kullanıcılarını ve kayıtlarını temizler. Uygulamadaki `000LOG-DEMO` referanslı reddedilmiş talep, sentetik log takip örneğidir.

## Testler

```powershell
npm run test
```

Jest testleri protokol/hasta numarası doğrulamasını, boşlukların reddini, baştaki sıfırların korunmasını, yetki kapsamını, karar gerekçelerini ve state machine geçişlerini kapsar.

Kurulum sırasında beş demo hesabıyla giriş, referans doğrulaması, talep oluşturma, lider onayı ve uygulama tamamlama gerçek yerel PostgreSQL üzerinde doğrulandı. Sunucular ve PostgreSQL kapatılıp yeniden açıldığında tamamlanan kaydın korunduğu da kontrol edildi. Sentetik kontrol talebi uygulamada görünür; HBYS üzerinde işlem yapılmadı.

## Güvenlik Notları

- Oturumlar HttpOnly cookie ile tutulur.
- CSRF token endpoint'i ve state-changing isteklerde CSRF kontrolü vardır.
- Parolalar Argon2id ile hashlenir.
- Backend RBAC ve kaynak/birim bazlı erişim kontrolü uygular.
- Kritik durum değişiklikleri transaction içinde request event ve audit log üretir.
- API, istemciden gelen `createdBy`, `assignedTo`, `approvedBy` veya `status` alanlarına güvenmez.

## Üretime Geçmeden Önce

- HTTPS ve güvenli reverse proxy yapılandırması
- Kurumsal SSO veya sağlam parola politikası
- Merkezi loglama ve SIEM entegrasyonu
- KVKK veri envanteri ve saklama/imha politikaları
- Penetrasyon testi ve güvenli kod incelemesi
- Yedekleme, felaket kurtarma ve erişim kayıtları prosedürleri
- HBYS entegrasyonu yapılacaksa resmi entegrasyon ve test protokolü
