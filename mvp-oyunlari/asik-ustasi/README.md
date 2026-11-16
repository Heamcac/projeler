# Aşık Ustası

Phaser.js, Vite ve JavaScript ile hazırlanmış web/mobil uyumlu 2D fizik tabanlı beceri oyunu MVP'si.

## Özellikler

- Matter.js fizik motoru ile çarpışan ve sürtünen taşlar
- Mouse veya tek parmakla geri çekip bırakma kontrolü
- 15 farklı bölüm
- Sınırlı atış hakkı
- Hedef vurma, hedefi temizleme alanından çıkarma ve combo puanları
- Kalan atış bonusu ve 3 yıldızlı bölüm sonucu
- localStorage ile ilerleme, skor, altın ve geliştirme kaydı
- Güç, kontrol ve şans geliştirmeleri
- Mobil ekrana uyumlu Phaser Scale FIT düzeni

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda Vite'ın verdiği yerel adresi açın.

## Build

```bash
npm run build
```

## Oynanış

Oyuncu taşını mouse veya parmakla geri çekin. Nişan çizgisi atış yönünü gösterir. Bırakınca taş fırlatılır. Hedef taşlar vurulduğunda puan kazanılır; hedefler işaretli temizleme alanının dışına çıktığında daha yüksek puan verir. Tüm hedefler temizlenirse bölüm tamamlanır.

## Kayıt Verileri

Kayıtlar `localStorage` içinde `asik-ustasi-save-v1` anahtarıyla tutulur:

- `altin`
- `tamamlananBolum`
- `enYuksekSkor`
- `gucSeviyesi`
- `kontrolSeviyesi`
- `sansSeviyesi`
- bölüm skorları ve yıldızları
