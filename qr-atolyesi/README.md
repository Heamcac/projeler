# QR Atölyesi

Türkçe, mobil uyumlu ve tamamen istemci tarafında çalışan bir QR kod oluşturucu. Vite + vanilla TypeScript + `qrcode` kullanır. Backend, hesap, analitik, CDN fontu veya uzaktaki QR servisi yoktur. QR içeriği ve yüklenen logo sunucuya gönderilmez.

## Kurulum

Node.js 20.19+ veya 22.12+ ve npm gerekir.

```sh
npm install
npm run dev
```

Terminaldeki yerel adresi açın (varsayılan: `http://127.0.0.1:5173`).

```sh
npm test        # Vitest birim testleri ve bağımsız QR okuyucusuyla payload kontrolü
npm run build  # TypeScript denetimi ve statik üretim build'i
npm run preview
```

## Kullanım ve özellikler

1. Link, düz metin, Wi-Fi, e-posta, telefon, SMS, kişi kartı veya konum sekmesini seçin.
2. Alanları doldurun. Önizleme 220 ms debounce ile güncellenir. Boş içerikte `https://ornek.com` için etiketli bir örnek gösterilir; örnek geçmişe kaydedilmez.
3. Ön/arka plan rengini, 128–1024 px boyutu, modül cinsinden kenar boşluğunu ve L/M/Q/H hata düzeltmesini seçin. Kare veya yuvarlak noktalar desteklenir; konum bulucu köşeler okunabilirlik için kare kalır.
4. İsterseniz gelişmiş ayarlardan PNG/JPG/WebP logo ekleyin (en fazla 5 MB). Logo yerel olarak PNG'ye dönüştürülür ve QR hata düzeltmesi otomatik H olur. Logo kaldırılınca seçtiğiniz önceki düzey geri gelir.
5. PNG veya bağımsız, gömülü logolu SVG indirin; görseli panoya kopyalayın ya da yazdırın. Panoya görsel kopyalama HTTPS veya localhost ve destekleyen bir tarayıcı gerektirir. İzin verilmezse PNG indirmeyi kullanın.

Koyu ön plan, açık arka plan ve en az 4 modül boşluk önerilir. Düşük kontrast, küçük modüller ve dar kenar boşluğunda uyarı gösterilir. Logo ve yoğun içerikler dahil, kullanmadan önce kodu telefonunuzla tarayın. QR içeriği statiktir; hedefi değiştirmek için yeni bir QR üretmeniz gerekir. QR kapasitesi veri türü, UTF-8 bayt sayısı ve hata düzeltmesine göre değişir; aşımda önizleme ve dışa aktarma kapatılır ve anlaşılır hata gösterilir.

Tema başlangıçta sistem tercihini izler. Üstteki düğme Sistem → Aydınlık → Karanlık sırasıyla değiştirir ve seçimi hatırlar. İçerik sekmeleri ok tuşları, Home/End ve klavye odağı ile kullanılabilir. Alan etiketleri, görünür odak, `aria-live` hataları ve azaltılmış hareket tercihi desteklenir.

## Gizlilik ve geçmiş

Geçerli içerik 1,2 saniye sonra son sekiz kayıt içinde yerel olarak saklanır. Aynı düzenleme oturumu yazarken güncellenir; her tuş vuruşu ayrı kayıt oluşturmaz. PNG/SVG, panoya kopyalama ve yazdırma da geçerli kaydı saklar. Bir kayıt yeniden açılabilir veya tek tek silinebilir; bütün geçmiş de temizlenebilir.

**Wi-Fi şifresi ve diğer kişisel alanlar dahil geçmiş `localStorage` içinde şifrelenmeden tutulur.** Ortak cihazlarda “Oluşturduğum kodları bu cihazda hatırla” seçeneğini kapatıp geçmişi temizleyin. Seçeneği kapatmak mevcut kayıtları silmez. Tarayıcı verilerini temizlemek de geçmişi siler. Depolama kapalı/dolu ise QR üretimi ve indirme çalışmaya devam eder. Veri yalnızca aynı origin'de saklanır. Barındırma sağlayıcısının standart sayfa erişim kayıtları QR içeriğini içermez; uygulama hiçbir payload için ağ isteği yapmaz.

## Kod yapısı

- `src/payloads.ts`: Her içerik için ayrı builder, doğrulama, URL normalizasyonu, Wi-Fi kaçışları, vCard 3.0 ve UTF-8 satır katlama.
- `src/qr.ts`: `qrcode` matrisiyle SVG üretimi, logo, kontrast, PNG ve indirme yardımcıları.
- `src/storage.ts`: Sürümlü, doğrulanan, sınırlı yerel geçmiş ve tercihler.
- `src/main.ts`: Arayüz, erişilebilir sekmeler, debounce, tema ve dışa aktarma.
- `src/style.css`: Mobil öncelikli uyarlamalar, açık/koyu tema ve yazdırma görünümü.
- `src/*.test.ts`: URL, Wi-Fi, vCard, diğer builder'lar, QR kapasitesi ve `jsQR` ile sekiz türün geri okunması.

Wi-Fi'de `; , : \\` ve tırnaklar kaçırılır. vCard TEXT alanlarında `; , \\` ve satır sonları kaçırılır; iki nokta RFC gereği alan değerinde olduğu gibi kalır. URL'de yapısal `; , :` korunur, Unicode ve boşluklar URL standardına göre kodlanır; ters eğik çizgi reddedilir. Yalnızca http/https kabul edilir; kullanıcı adı/şifre içeren URL'ler reddedilir. E-posta konu/mesajı URI kodlanır. Telefonlar normalize edilir, konum aralıkları doğrulanır.

## Statik yayınlama

`npm run build` çıktısı `dist/` klasörüdür. Sunucu çalışma zamanı, ortam değişkeni veya API anahtarı gerekmez. `base: './'` sayesinde alt dizinlerde de çalışır; SPA yönlendirme ayarı gerekmez.

### Netlify

Kaynak projeyi bir Git deposuna ekleyip Netlify'a bağlayın. Build komutu `npm run build`, yayın klasörü `dist`. Node 22 veya üstünü seçin. Alternatif olarak build sonrası `dist` klasörünü Netlify Drop'a sürükleyin.

### Vercel

Depoyu içe aktarın; framework olarak Vite, build komutu `npm run build`, output directory `dist` seçin. Kök dizin projenin `package.json` dosyasını içeren klasör olmalıdır.

### GitHub Pages

GitHub'da bir depo oluşturup projeyi gönderin. Settings → Pages → Source: GitHub Actions seçin. Actions işinde Node 22 kurun, `npm ci` ve `npm run build` çalıştırın; `actions/upload-pages-artifact` ile `dist` yükleyin, `actions/deploy-pages` ile yayınlayın. Workflow izinleri `contents: read`, `pages: write`, `id-token: write`; environment `github-pages` olmalıdır. Yerel test için `npm run preview` kullanın; `dist/index.html` dosyasını `file://` ile açmayın.

## Kullanılan standartlar

- [node-qrcode resmi belgeleri](https://github.com/soldair/node-qrcode)
- [ZXing QR içerik biçimleri ve Wi-Fi kaçışları](https://github.com/zxing/zxing/wiki/Barcode-Contents)
- [vCard 3.0 / RFC 2426](https://www.rfc-editor.org/rfc/rfc2426)

Yalnızca uygulama kaynakları yerel olarak yüklenir; QR kütüphanesi build paketine dahildir. İnternet bağlantısı ilk kurulum ve sitenin ilk yüklemesi içindir. Yüklenen sayfada QR üretimi bağlantısız devam eder; çevrimdışı sayfa yenileme için service worker eklenmemiştir.
