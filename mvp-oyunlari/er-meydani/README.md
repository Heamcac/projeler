# Er Meydani

React + Vite ile gelistirilmis web/mobil uyumlu 2D gures oyunu MVP'si.

## Ozellikler

- 3 raunttan olusan kart tabanli mac akisi
- Kavrama, Celme, Savunma, Denge Bozma, Karsi Hamle ve Dayan kartlari
- Tiklama/dokunma ile calisan timing bar mini-game'i
- Kolay, orta ve zor rakip AI secenekleri
- Mac sonunda altin ve XP odulu
- localStorage ile galibiyet, maglubiyet, altin, XP ve gelistirme kaydi
- Guc, Denge, Dayaniklilik ve Teknik gelistirmeleri
- Mobil ve masaustu uyumlu arayuz

## Calistirma

```bash
npm install
npm run dev
```

Ardindan Vite'in verdigi yerel adresi tarayicida acin.

## Build

```bash
npm run build
```

## Oynanis

1. Ana menuden maca baslayin.
2. Pehlivan ve rakip seviyesini secin.
3. Her tur bir hamle karti secin.
4. Timing bar acildiginda isaret basari alanindayken tiklayin veya dokunun.
5. 3 raunt sonunda yuksek skor kazanan olur.

## Kart Iliskileri

- Kavrama, Denge Bozma'ya karsi gucludur.
- Celme, Kavrama'ya karsi gucludur.
- Savunma, Celme'ye karsi gucludur.
- Karsi Hamle, agresif hamlelere karsi gucludur.
- Dayan, enerji kazanimi saglar.
