# Matrak Ustası

Phaser.js + Vite + JavaScript ile geliştirilmiş web/mobil uyumlu 2D ritim, savunma ve düello MVP'si.

## Kurulum

```bash
npm install
npm run dev
```

## Oynanış

- Rakibin gösterdiği yönü doğru zamanda savun.
- Web kontrolleri: yön tuşları veya WASD.
- Karşı hamle: Space.
- Mobil kontroller: canvas altındaki dört yön butonu ve orta karşı hamle butonu.
- Combo 5 olunca "Karşı Hamle Hazır!" olur.
- Yanlış savunma dengeyi azaltır.
- Denge sıfırlanırsa raunt kaybedilir.
- 3 raunt sonunda sonuç ekranı açılır.

## Sahneler

- `BootScene`
- `MenuScene`
- `TutorialScene`
- `DuelScene`
- `UpgradeScene`
- `ResultScene`

## Sistemler

- `PlayerFighter.js`
- `OpponentFighter.js`
- `RhythmSystem.js`
- `InputSystem.js`
- `ComboSystem.js`
- `ScoreSystem.js`
- `UpgradeSystem.js`
- `StorageSystem.js`

## Kayıt ve Geliştirmeler

`localStorage` içinde şu değerler saklanır:

- `altin`
- `enYuksekSkor`
- `toplamGalibiyet`
- `refleksSeviyesi`
- `dengeSeviyesi`
- `odakSeviyesi`

Geliştirme etkileri:

- Refleks: doğru savunma süresini uzatır.
- Denge: maksimum dengeyi artırır.
- Odak: combo puan bonusu verir.

## MVP Notları

- Online multiplayer yok.
- Karmaşık animasyon ve gerçekçi dövüş sistemi yok.
- Kan, yaralanma veya ağır şiddet efekti yok.
- Usta zorluğu için fake hamle altyapısı not olarak bırakıldı; MVP'de aktif değil.
