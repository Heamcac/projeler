export default class HowToScene extends Phaser.Scene {
  constructor() {
    super('HowToScene');
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x2f2218);
    this.add.text(640, 84, 'Nasıl Oynanır', {
      fontSize: 54,
      color: '#f5d69a',
      fontFamily: 'Georgia, serif'
    }).setOrigin(0.5);

    const lines = [
      'Amaç rakibi yok etmek değil; doğru mesafe, açı ve zamanlama ile puan toplamaktır.',
      'Web: A/D veya ok tuşları ile hareket et, mouse ile nişan al.',
      'Sol tık basılı tutarak gücü doldur, bırakınca ciridi fırlat.',
      'Space kısa hızlanma sağlar.',
      'Mobil: sol ekran yönlendirme, sağ ekran nişan ve atış.',
      'Sağ ekranda yukarı kaydır hızlanır, aşağı kaydır ani yavaşlatır.',
      'Yakın isabet 10, orta 25, uzak 50 puan verir.',
      'Rakibin hamlesinden kaçıp karşı atış yaparsan ekstra 20 puan kazanırsın.'
    ];

    this.add.text(170, 170, lines.join('\n\n'), {
      fontSize: 25,
      color: '#fff0cf',
      lineSpacing: 6,
      wordWrap: { width: 940 }
    });

    this.button(640, 630, 'Menüye Dön', () => this.scene.start('MenuScene'));
  }

  button(x, y, label, action) {
    const bg = this.add.rectangle(x, y, 260, 54, 0x5b3320).setStrokeStyle(3, 0xd1a054);
    this.add.text(x, y, label, { fontSize: 24, color: '#ffe4ad' }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true }).on('pointerup', action);
  }
}
