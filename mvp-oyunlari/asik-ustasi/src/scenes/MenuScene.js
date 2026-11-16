import Phaser from 'phaser';
import StorageSystem from '../classes/StorageSystem.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const save = StorageSystem.load();
    drawBackdrop(this);
    this.add.text(270, 126, 'Aşık Ustası', {
      fontFamily: 'Georgia, serif',
      fontSize: '54px',
      color: '#fff0cf',
      stroke: '#3f2917',
      strokeThickness: 7
    }).setOrigin(0.5);
    this.add.text(270, 186, 'Fırlat, çarptır, alanı temizle', {
      fontSize: '20px',
      color: '#f3d8aa'
    }).setOrigin(0.5);

    this.add.text(270, 300, `Altın: ${save.altin}   En yüksek skor: ${save.enYuksekSkor}`, {
      fontSize: '21px',
      color: '#ffe5a8'
    }).setOrigin(0.5);

    makeButton(this, 270, 420, 300, 62, 'Oyna', () => this.scene.start('LevelSelectScene'));
    makeButton(this, 270, 500, 300, 62, 'Geliştirmeler', () => this.scene.start('UpgradeScene'));
    makeButton(this, 270, 580, 300, 62, 'Devam Et', () => {
      const level = Math.min(save.tamamlananBolum + 1, 15);
      this.scene.start('GameScene', { level });
    });

    this.add.text(270, 800, 'Tek parmakla geri çek ve bırak', {
      fontSize: '18px',
      color: '#d8c095'
    }).setOrigin(0.5);
  }
}

export function drawBackdrop(scene) {
  scene.add.tileSprite(270, 480, 540, 960, 'dirt-tile').setAlpha(0.95);
  scene.add.rectangle(270, 480, 510, 910, 0x5b351c, 1).setStrokeStyle(6, 0x2a1a10);
  scene.add.rectangle(270, 480, 470, 870, 0x9a713f, 0.16).setStrokeStyle(2, 0xd0a263, 0.35);
  scene.add.circle(92, 150, 28, 0xc8b07a, 0.22);
  scene.add.circle(450, 760, 36, 0x74512e, 0.25);
}

export function makeButton(scene, x, y, w, h, label, callback, enabled = true) {
  const fill = enabled ? 0x6f4624 : 0x554739;
  const rect = scene.add.rectangle(x, y, w, h, fill, 1).setStrokeStyle(3, enabled ? 0xf0c173 : 0x8c8172);
  rect.setInteractive({ useHandCursor: enabled });
  const text = scene.add.text(x, y, label, {
    fontSize: '24px',
    color: enabled ? '#fff4d5' : '#b9ad9d',
    fontStyle: '700'
  }).setOrigin(0.5);
  if (enabled) {
    rect.on('pointerover', () => rect.setFillStyle(0x85542a));
    rect.on('pointerout', () => rect.setFillStyle(fill));
    rect.on('pointerdown', callback);
    text.setInteractive({ useHandCursor: true }).on('pointerdown', callback);
  }
  return { rect, text };
}
