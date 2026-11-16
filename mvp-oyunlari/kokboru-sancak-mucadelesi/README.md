# Kökbörü: Sancak Mücadelesi

Phaser.js + Vite + JavaScript ile hazırlanmış web/mobil uyumlu 2D takım tabanlı arena oyunu MVP'si.

## Oynanış

- İki takım bozkır sahasında sancak topu için mücadele eder.
- Oyuncu tek atlı alp karakterini kontrol eder.
- Takım arkadaşları ve rakipler basit AI ile hareket eder.
- Sancak topu rakip kale alanına taşınınca sayı kazanılır.
- 3 sayıya ulaşan takım kazanır; süre 3 dakikadır.
- Gol sonrası top ortaya, oyuncular başlangıç noktalarına döner.

## Kontroller

### Web

- `W/A/S/D`: hareket
- Mouse: yön belirleme
- `Space`: kısa hızlanma
- `E`: topu alma veya pas atma
- Sol tık: omuz hamlesi

### Mobil

- Sol analog: hareket
- Sağdaki `Hız`: hızlanma
- `Pas`: topu bırakma/pas
- `Hamle`: omuz hamlesi

## Geliştirme Sistemi

`localStorage` kullanılır. Saklanan değerler:

- `altin`
- `toplamGalibiyet`
- `enYuksekSkor`
- `atSeviyesi`
- `dayaniklilikSeviyesi`
- `hamleSeviyesi`
- `pasSeviyesi`

Geliştirmeler:

- At seviyesi: hız ve dönüş hissini artırır.
- Dayanıklılık: top taşırken yavaşlamayı azaltır.
- Hamle: top düşürme şansını artırır.
- Pas: pas mesafesini artırır.

## Takımlar

MVP'de `Bozkır Alpleri` aktiftir. `Dağ Süvarileri`, `Kurt Obası` ve `Sancak Birliği` kilitli görünür.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda Vite'in verdiği yerel adresi açın.

## Üretim Build

```bash
npm run build
```

## Notlar

- Online multiplayer yoktur.
- Gerçek hayvan modeli veya hayvan şiddeti yoktur.
- 3D fizik yoktur.
- Görseller Phaser içinde üretilen placeholder bozkır, atlı ikon, sancak topu ve kale alanlarıdır.
