# Mangala Hanlığı

React + Vite ile hazırlanmış web ve mobil uyumlu Mangala MVP'si.

## Özellikler

- Oyuncuya karşı basit yapay zeka
- Kolay, orta ve zor AI seviyeleri
- 6 oyuncu kuyusu, 6 rakip kuyusu ve iki hazine
- Sadeleştirilmiş Türk Mangala kuralları
- Hamle geçmişi, sıra bilgisi ve skor takibi
- Oyun sonucu ekranı
- `localStorage` tabanlı istatistikler
- Mobil dokunmatik kontroller

## Kurulum

```bash
npm install
npm run dev
```

PowerShell'de script politikası `npm` komutunu engellerse Windows ortamında şu şekilde çalıştırılabilir:

```bash
npm.cmd install
npm.cmd run dev
```

## Kural Özeti

- Oyuncu kendi tarafındaki taş olan kuyulardan birini seçer.
- Taşlar sırayla kuyulara ve oyuncunun kendi hazinesine dağıtılır.
- Rakibin hazinesi pas geçilir.
- Son taş kendi hazinesine düşerse ekstra hamle gelir.
- Son taş kendi boş kuyusuna düşerse karşı kuyudaki taşlar hazineye alınır.
- Son taş rakip kuyusunda çift sayı oluşturursa o kuyudaki taşlar kazanılır.
- Bir tarafın kuyuları boşalınca kalan taşlar toplanır ve yüksek hazine kazanır.

## Proje Yapısı

```text
src/
  components/
  pages/
  logic/
  storage/
  App.jsx
  main.jsx
  style.css
```
