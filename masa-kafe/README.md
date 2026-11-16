# Masa Kafe Demo

QR tabanlı sipariş ve masa otomasyonu için Türkçe ve İngilizce, tıklanabilir bir gösterim. Müşteri telefonu ile Garson, Kasa ve Yönetim panelleri aynı oturumdaki örnek veriyi paylaşır.

## Çevrimdışı açma

`dist/index.html` dosyasını tarayıcıda açın. JavaScript, stiller ve çizimler dosyanın içindedir. Sunum sırasında bağlantı veya yerel sunucu gerekmez. Her yenileme ve **Demoyu sıfırla** işlemi demoyu başlangıç verisine döndürür.

## Kurulum ve derleme

Node.js 22.12+ ve npm ile proje kökünden çalıştırın.

```sh
cd apps/demo
npm ci
npm run dev
```

Vite'ın terminalde yazdığı adresi açın. Üretim derlemesi için aynı dizinde `npm run build` çalıştırın. Çıktı `apps/demo/dist/index.html` dosyasıdır. Vercel veya Netlify için kök dizini `apps/demo`, derleme komutunu `npm run build`, yayın dizinini `dist` olarak seçin.

## Sunum akışı

- **Demo senaryosunu başlat** → **Siparişten temizliğe** ana akışı açar. Adımları ekrandaki kontrollerle tamamlayın veya **Adımı ilerlet** ile uygulayın. **Otomatik oynat** her üç saniyede bir sonraki işlemi yapar.
- Elle sunumda telefondan **Masa 07** ile başlayın. Garson tarafına telefondaki dört haneli kodu girin, ardından menüden ürün ekleyip siparişi gönderin. Garson panelinde siparişi hazırlatıp teslim edin, ikinci siparişi gönderin, müşteriden hesap isteyin ve kasada hesabı kapatın. Garson panelinde temizlik görevini üstlenip bitirin.
- **Masa taşıma** ve **Ürün tükendi** kısa senaryoları aynı menüdedir. Bir senaryo başlatmak örnek veriyi sıfırlar.
- **Sunum modu** alanı genişletir, metinleri büyütür ve sesi kapatır. Ses düğmesiyle yeniden açabilirsiniz. Telefondaki **Aa** menüsü dili, büyük yazıyı ve yüksek kontrastı değiştirir.
- Faz 2 kayıt önizlemesinin SMS kodu `123456`. Menüdeki ürünler, ekip, ödemeler ve hesaplar simülasyondur. QR önizlemeleri okutulamaz. Toplu PDF düğmesi 80 kartlık bir örnek sayfa açar.

## Gerçek API bağlantısı

`src/mock/mockApi.ts` başlangıç verisini, tipleri, Zustand deposunu ve işlem kurallarını içerir. Ekranlar `useDemo` ile durum okur ve türü belirli işlemler gönderir. `billFor`, `ordersFor` ve `openTasks` gibi seçiciler panel hesaplarını paylaşır.

Gerçek bağlantıda `act` işlemlerini asenkron API çağrılarına taşıyın. Yerel durum güncellemelerini API yanıtları ve WebSocket veya SSE olaylarıyla birleştirin. Atama, süreler, doğrulama, ödeme kuralları ve işlem günlüğünü sunucuda uygulayın. Arayüzün kullandığı veri şekilleri ve hata anahtarları korunursa ekran değişiklikleri sınırlı kalır.

## Ekran boyutları

Yatay ekranda iki panel yan yana durur. Küçük ekranlarda paneller alt alta geçer. Menü, işlem listeleri ve 80 masalık harita gerektiğinde dikey kaydırılır. Telefon çerçevesi 390 × 800 piksele kadar büyür ve kısa laptop ekranlarına uyum sağlar.
