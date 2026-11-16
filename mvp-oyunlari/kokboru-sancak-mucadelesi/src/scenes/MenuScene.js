import Phaser from 'phaser';
import StorageSystem from '../systems/StorageSystem.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this.drawBackdrop(width, height);
    const save = StorageSystem.load();

    this.add.text(width / 2, height * 0.18, 'Kökbörü: Sancak Mücadelesi', {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.min(52, width * 0.08)}px`,
      color: '#fff4cf',
      stroke: '#233322',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.29, 'Sancak topunu kap, rakip alana taşı, toy meydanında takımına sayı kazandır.', {
      fontSize: `${Math.min(20, width * 0.038)}px`,
      color: '#f9efd2',
      align: 'center',
      wordWrap: { width: Math.min(760, width - 36) }
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.39, `Altın: ${save.altin}   Galibiyet: ${save.toplamGalibiyet}   En yüksek skor: ${save.enYuksekSkor}`, {
      fontSize: '18px',
      color: '#fff8dc',
      stroke: '#263829',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.button(width / 2, height * 0.53, 'Oyuna Başla', () => this.scene.start('TeamSelectScene'));
    this.button(width / 2, height * 0.64, 'Geliştirmeler', () => this.scene.start('UpgradeScene'));
  }

  drawBackdrop(width, height) {
    this.add.rectangle(0, 0, width, height, 0x8fb370).setOrigin(0);
    this.add.rectangle(0, height * 0.72, width, height * 0.28, 0x6f965f).setOrigin(0);
    for (let i = 0; i < 9; i += 1) {
      this.add.triangle(i * 180 - 40, height * 0.73, 0, 80, 90, 0, 180, 80, 0x45684d, 0.55).setOrigin(0);
    }
    this.add.circle(width * 0.78, height * 0.18, 58, 0xf1c15b, 0.82);
    this.add.rectangle(width * 0.18, height * 0.68, 130, 62, 0x9b6740, 0.9).setAngle(-2);
    this.add.triangle(width * 0.18 - 75, height * 0.65, 0, 55, 75, 0, 150, 55, 0xb34434, 0.92);
  }

  button(x, y, label, onClick) {
    const bg = this.add.rectangle(x, y, 260, 54, 0x2f5f46, 0.95).setStrokeStyle(3, 0xf5d06f);
    const text = this.add.text(x, y, label, { fontSize: '22px', color: '#fff8dc' }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(0x397452));
    bg.on('pointerout', () => bg.setFillStyle(0x2f5f46));
    return { bg, text };
  }
}
