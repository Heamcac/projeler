# Cirit Arenası

Phaser.js, Vite ve JavaScript ile hazırlanmış web/mobil uyumlu 2D arena MVP'si.

## Kurulum

```bash
npm install
npm run dev
```

PowerShell script kısıtı varsa Windows'ta şu komutları kullanabilirsiniz:

```bash
npm.cmd install
npm.cmd run dev
```

## Kontroller

Web:
- `A/D` veya yön tuşları: sağ-sol hareket
- Mouse: nişan alma
- Sol tık basılı tut: güç ayarla
- Sol tık bırak: cirit fırlat
- `Space`: kısa hızlanma

Mobil:
- Sol ekran: atı yönlendir
- Sağ ekran: nişan al, basılı tutup bırakınca cirit fırlat
- Sağ ekranda yukarı kaydır: hızlan
- Sağ ekranda aşağı kaydır: ani yavaşlama

## MVP İçeriği

- Ana Menü, Nasıl Oynanır, Maç, Geliştirme ve Sonuç sahneleri
- Oyuncu ve rakip atlı ciritçi placeholder görselleri
- 60 saniyelik maç sistemi
- Mesafe, açı, zamanlama, combo ve karşı hamle bonuslu skor sistemi
- Basit rakip AI hareketi ve periyodik atışlar
- Cirit, at ve zırh geliştirmeleri
- `localStorage` ile altın, toplam skor, yüksek skor ve geliştirme kayıtları

## Build

```bash
npm run build
```
