import StorageSystem from '../systems/StorageSystem.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.result = data;
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x2f2218);
    const won = this.result.playerScore >= this.result.enemyScore;
    this.add.text(640, 92, won ? 'Müsabaka Kazanıldı' : 'Rakip Öne Geçti', {
      fontSize: 58,
      color: '#f5d69a',
      fontFamily: 'Georgia, serif'
    }).setOrigin(0.5);

    this.add.text(640, 190, `Sen: ${this.result.playerScore}   Rakip: ${this.result.enemyScore}`, {
      fontSize: 34,
      color: '#fff1c7'
    }).setOrigin(0.5);
    this.add.text(640, 245, `Kazanılan altın: ${this.result.goldEarned}`, {
      fontSize: 28,
      color: '#ffe2a7'
    }).setOrigin(0.5);

    const save = StorageSystem.load();
    this.add.text(640, 305, `Toplam Skor: ${save.toplamSkor}   En Yüksek Skor: ${save.enYuksekSkor}   Altın: ${save.altin}`, {
      fontSize: 24,
      color: '#f6d7aa'
    }).setOrigin(0.5);

    this.button(640, 430, 'Tekrar Oyna', () => this.scene.start('GameScene'));
    this.button(640, 500, 'Geliştirmeler', () => this.scene.start('UpgradeScene'));
    this.button(640, 570, 'Ana Menü', () => this.scene.start('MenuScene'));
  }

  button(x, y, label, action) {
    const bg = this.add.rectangle(x, y, 300, 54, 0x5b3320).setStrokeStyle(3, 0xd1a054);
    this.add.text(x, y, label, { fontSize: 24, color: '#ffe4ad' }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true }).on('pointerup', action);
  }
}
