import StorageSystem from '../systems/StorageSystem.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const save = StorageSystem.load();
    this.drawBackdrop();
    this.add.text(640, 100, 'Cirit Arenası', {
      fontFamily: 'Georgia, serif',
      fontSize: 74,
      color: '#f3d59b',
      stroke: '#2b170c',
      strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(640, 164, 'Bozkırda çeviklik, zamanlama ve usta nişan talimi', {
      fontSize: 24,
      color: '#f8ead0'
    }).setOrigin(0.5);

    this.add.text(640, 236, `Altın: ${save.altin}   En Yüksek Skor: ${save.enYuksekSkor}`, {
      fontSize: 24,
      color: '#fff2c6'
    }).setOrigin(0.5);

    this.button(640, 325, 'Maça Başla', () => this.scene.start('GameScene'));
    this.button(640, 395, 'Geliştirmeler', () => this.scene.start('UpgradeScene'));
    this.button(640, 465, 'Nasıl Oynanır', () => this.scene.start('HowToScene'));
  }

  button(x, y, label, action) {
    const group = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 310, 54, 0x5b3320).setStrokeStyle(3, 0xd1a054);
    const text = this.add.text(0, 0, label, { fontSize: 25, color: '#ffe4ad' }).setOrigin(0.5);
    group.add([bg, text]);
    bg.setInteractive({ useHandCursor: true }).on('pointerup', action);
    bg.on('pointerover', () => bg.setFillStyle(0x754126));
    bg.on('pointerout', () => bg.setFillStyle(0x5b3320));
  }

  drawBackdrop() {
    this.add.rectangle(640, 360, 1280, 720, 0x7f5a2e);
    this.add.rectangle(640, 90, 1280, 180, 0x6f8790);
    this.add.triangle(330, 180, 0, 110, 260, 0, 520, 110, 0x58685f);
    this.add.triangle(850, 178, 0, 120, 320, 0, 640, 120, 0x667463);
    this.add.rectangle(640, 610, 1280, 220, 0xa16a30);
    for (let i = 0; i < 9; i += 1) {
      const x = 170 + i * 120;
      this.add.rectangle(x, 595, 8, 90, 0x3a2114);
      this.add.triangle(x + 25, 550, 0, 0, 52, 20, 0, 42, i % 2 ? 0x9d2f2a : 0x1f4d6b);
    }
  }
}
