# Virtual Fit Backend

TypeScript, Fastify, PostgreSQL/Drizzle, BullMQ/Redis ve React/Three.js musteri arayuzu. Tum moduller tek calisan servis icinde birlestirildi. Musteri ekrani: http://127.0.0.1:3100/. API dokumantasyonu: http://127.0.0.1:3100/docs/.

## Yerel calistirma

Node.js 22 veya uzeri gerekir. Proje klasorunde:

```powershell
npm ci
npm run build
npm start
```

Ilk acilista SQL migration uygulanir; 3 demo hesap, 4 urun, 12 varyant ve bir vucut profili olusturulur. PostgreSQL motoru PGlite ile `.data/postgres` icinde kalici saklanir. Docker ve Redis gerektirmez. Ayni PGlite dizinini iki surecle acmayin. `.env` zorunlu degildir; secenekler `.env.example` icindedir. Yerel JWT anahtari verilmezse her acilista uretilir; eski oturumlar yeniden giris gerektirir. Arayuz icindeki giris penceresinde demo hesabina giris secenegi vardir. Katalog, arama/kategori/siralama, favoriler, coklu olcu profilleri, beden secimi, canli fit-check, 2D/3D prova odasi, sepet, siparis olusturma/iptal ve iade talebi API'ye baglidir. Katalog fotograflari temsili ve uzak kaynaklidir; kaynaklar `docs/IMAGE-SOURCES.md` icindedir.

Arayuzde hot reload icin iki terminalde `npm run dev` (backend 3100) ve `npm run web:dev` (arayuz 3101) calistirin. Uretimde derlenmis arayuz backend ile ayni porttan sunulur.

| Hesap | E-posta | Sifre |
| --- | --- | --- |
| Musteri | customer@demo.local | DemoOnly-2026! |
| Satici | seller@demo.local | DemoOnly-2026! |
| Yonetici | admin@demo.local | DemoOnly-2026! |

Swagger'da `POST /api/v1/auth/login` ile giris yapin. Donen `accessToken` degerini Authorize alanina girin. Oturum 15 dakika gecerlidir. `GET /api/v1/profile/measurements` ve `GET /api/v1/products` ile profil/urun kimliklerini, urun detayindan varyant kimligini alin.

```json
{
  "email": "customer@demo.local",
  "password": "DemoOnly-2026!"
}
```

```json
{
  "height": 172,
  "weight": 68,
  "chest": 94,
  "waist": 76,
  "hips": 100,
  "inseam": 78,
  "outseam": 102,
  "shoulderWidth": 40,
  "bodyShapeType": "pear",
  "name": "Kendim",
  "isDefault": true
}
```

`POST /api/v1/profile/measurements` yeni profil olusturur. Guncellerken yukaridaki govdeye `profileId` ve `expectedRevision` ekleyin. Eski revision ile guncelleme 409 doner.

```json
{
  "profileId": "PROFIL_UUID",
  "variantId": "VARYANT_UUID",
  "mode": "ai"
}
```

Bu govdeyi `POST /api/v1/products/URUN_UUID/try-on` adresine gonderin. 202 cevabindaki `statusUrl` adresini sorgulayin. `mode: "ai"` yerelde sematik SVG demo verir; `mode: "3d"` metre cinsinden avatar parametreleri verir. SVG onizleme de Authorization basligi ister; Swagger'dan veya `fetch` + blob ile alinabilir.

```powershell
$base = 'http://127.0.0.1:3100'
$login = Invoke-RestMethod "$base/api/v1/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"customer@demo.local","password":"DemoOnly-2026!"}'
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
$profile = (Invoke-RestMethod "$base/api/v1/profile/measurements" -Headers $headers)[0]
$catalog = Invoke-RestMethod "$base/api/v1/products"
$product = $catalog.items | Where-Object name -eq 'Regular Denim'
$detail = Invoke-RestMethod "$base/api/v1/products/$($product.id)"
$variant = ($detail.variants | Where-Object { $_.variant.size -eq 'M' }).variant
Invoke-RestMethod "$base/api/v1/products/$($product.id)/fit-check?profileId=$($profile.id)&variantId=$($variant.id)" -Headers $headers
Invoke-RestMethod "$base/api/v1/feed/tailored?profileId=$($profile.id)" -Headers $headers
```

## Test ve derleme

```powershell
npm run typecheck
npm test
npm run test:ui
npm run build
npm run openapi
npm audit
```

Testler gercek PostgreSQL SQL motorunun gomulu surumu uzerinde migration, HTTP route, yetki, kuyruk durumlari, webhook, stok yarisi ve iade akislarini dogrular. Docker servisleri ve harici AI saglayicisi bu yerel testlerde kullanilmaz. Uretim baslatmasi: `npm start`. Gelistirmede derlenmis surumu de `npm start` ile calistirabilirsiniz.

## Uretim altyapisi

`.env.example` dosyasini `.env` olarak kullanip PostgreSQL, Redis ve JWT degerlerini doldurun. Compose icin ayrica `POSTGRES_PASSWORD` ve HTTPS `PUBLIC_BASE_URL` gerekir. Compose PostgreSQL ve Redis portlarini disa acmaz; API loopback'te 3100 portundadir. HTTPS ters proxy bu porta yonlendirilmelidir. SQL migration ayri tek seferlik servisle calisir. Docker mevcut bir makinede:

```sh
docker compose up --build -d
```

Demo veri uretimde otomatik olusturulmaz. Ilk yonetici icin `ADMIN_EMAIL` ve en az 16 karakterli `ADMIN_PASSWORD` ortam degiskenlerini ayarlayip `npm run admin:create` calistirin. Docker'da ayni islem, bu degiskenler verilerek `node dist/src/create-admin.js` komutuyla yapilir. CLI mevcut hesabi degistirmez ve bir baslangic kategorisi ekler. Satici once kayit olur; yonetici `POST /api/v1/admin/vendors` ile magazasini acar. Satici `GET /api/v1/seller/stores`, `GET /api/v1/categories` ve `POST /api/v1/seller/products` ile katalog olusturur. AI saglayicisi icin `TRYON_PROVIDER=http` ve VTON degiskenleri gerekir. Replicate/Kling API'leri bu projenin ortak sozlesmesine dogrudan uymaz; [saglayici adapter sozlesmesine](docs/ARCHITECTURE.md) uygun gateway gerekir. Model guncellemelerinde `VTON_MODEL_VERSION` degistirilir.

Mevcut kodda odeme istegi acilir ve stok rezerve edilir. `paid` durumuna gecis gelistirmede yonetici endpoint'iyle denenir; uretimde bu islem dogrulanmis odeme saglayicisi entegrasyonu gerektirir. Iade talebi kaydedilir; gercek para iadesi, kargo etiketi, vergi/fatura ve satici hakedis transferi dahil degildir.

3D akis avatar parametrelerini uretir; musteri arayuzu bunlari Three.js ile sematik 3D avatara donusturur. Donus, zoom ve mobil gorunum bulunur. SMPL-X beta fitting, lisansli anatomik mesh uretimi ve fiziksel kumas simulasyonu 4. faz kapsamindadir. AI gorseli fiziksel beden uyumunu kanitlamaz; fit-check olcu tabanli ayri bir hesaplamadir. Playwright testleri calisan yerel sunucuya baglanir ve bir demo siparisini olusturup iptal eder. Windows'ta kurulu Edge'i kullanir; diger sistemlerde once `npx playwright install chromium` gerekir.

## Dosyalar

| Dosya | Islev |
| --- | --- |
| src/db/schema.ts | 19 tablo, enum, FK, unique/index ve CHECK yapilari |
| drizzle/ | Uygulanan ve versiyonlanan PostgreSQL SQL migration |
| src/fit/engine.ts | Deterministik uyum motoru |
| src/tryon/service.ts | Kalici outbox, yerel worker/BullMQ, Redis onbellek, webhook |
| src/tryon/avatar.ts | Baz manken secimi ve cm -> metre donusumu |
| src/orders.ts | Stok rezervasyonu, idempotency, snapshot, sure dolumu |
| src/api/routes.ts | Auth, profiller, katalog, fit, prova, siparis ve iade |
| openapi.json | Route'lardan uretilen OpenAPI sozlesmesi |
| docs/ARCHITECTURE.md | Veri kurallari, servis akislari ve adapter sozlesmesi |
| docs/ROADMAP.md | Dort faz ve kabul olcutleri |
| web/src/ | React musteri ekrani ve Three.js prova odasi |
| ui-tests/ | Masaustu/mobil alisveris akis ve canvas pixel kontrolleri |
